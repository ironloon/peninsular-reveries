import { findNearestDirectionalTarget, type NavigationDirection } from '../../client/spatial-navigation.js'

import {
  SQUARES_CELL_SELECTOR,
  SQUARES_MENU_BUTTON_SELECTOR,
  SQUARES_PATTERN_TOGGLE_SELECTOR,
  SQUARES_RESTART_BUTTON_SELECTOR,
} from './renderer.js'
import type { SquaresCoordinate } from './types.js'

export type SquaresInputSource = 'keyboard' | 'mouse' | 'touch' | 'gamepad'
export type SquaresInputTargetKind = 'cell' | 'pattern-toggle' | 'menu' | 'restart' | 'none'

export interface SquaresInputTargetDescriptor {
  readonly kind: SquaresInputTargetKind
  readonly coordinate: SquaresCoordinate | null
}

export type SquaresInputAction =
  | { readonly type: 'move-focus'; readonly direction: NavigationDirection; readonly source: SquaresInputSource }
  | { readonly type: 'play-cell'; readonly coordinate: SquaresCoordinate; readonly source: SquaresInputSource }
  | { readonly type: 'toggle-pattern'; readonly source: SquaresInputSource }
  | { readonly type: 'open-menu'; readonly source: SquaresInputSource }
  | { readonly type: 'restart-current-puzzle'; readonly source: SquaresInputSource }

export interface InputCallbacks {
  onMoveFocus: (coordinate: SquaresCoordinate | null, direction: NavigationDirection, source: SquaresInputSource) => void
  onPlayCell: (coordinate: SquaresCoordinate, source: SquaresInputSource) => void
  onTogglePattern: (source: SquaresInputSource) => void
  onOpenMenu: (source: SquaresInputSource) => void
  onRestartCurrentPuzzle: (source: SquaresInputSource) => void
  onPreviewCoordinateChange?: (coordinate: SquaresCoordinate | null, source: SquaresInputSource) => void
  onGamepadConnectionChange?: (connected: boolean) => void
}

export interface KeyboardActionLike {
  readonly key: string
  readonly code?: string
}

export interface PointerActionLike {
  readonly type: 'click' | 'contextmenu'
  readonly button: number
  readonly pointerType?: 'mouse' | 'touch' | 'pen'
}

export interface SquaresGamepadSnapshot {
  readonly connected: boolean
  readonly buttons: readonly boolean[]
  readonly axes: readonly number[]
}

export interface SquaresGamepadState {
  readonly connected: boolean
  readonly lastActionAt: number
  readonly previousButtons: readonly boolean[]
  readonly previousAxisDirection: NavigationDirection | null
}

export interface SquaresGamepadReadResult {
  readonly action: SquaresInputAction | null
  readonly connectionChange: 'connected' | 'disconnected' | null
  readonly nextState: SquaresGamepadState
}

export interface SetupInputOptions {
  readonly root?: Document | HTMLElement
  readonly longHoldMs?: number
  readonly now?: () => number
  readonly requestAnimationFrameFn?: typeof requestAnimationFrame
  readonly cancelAnimationFrameFn?: typeof cancelAnimationFrame
  readonly setTimeoutFn?: typeof setTimeout
  readonly clearTimeoutFn?: typeof clearTimeout
}

export interface TouchHoldTracker<T> {
  start: (target: T) => void
  release: () => 'tap' | 'long-hold' | 'idle'
  cancel: () => void
}

const EMPTY_TARGET: SquaresInputTargetDescriptor = { kind: 'none', coordinate: null }
const MANAGED_TARGET_SELECTORS = [
  SQUARES_CELL_SELECTOR,
  SQUARES_PATTERN_TOGGLE_SELECTOR,
  SQUARES_MENU_BUTTON_SELECTOR,
  SQUARES_RESTART_BUTTON_SELECTOR,
].join(', ')
const LONG_HOLD_MS = 420
const GAMEPAD_DEBOUNCE_MS = 200
const GAMEPAD_DEAD_ZONE = 0.5

let clickHandler: ((event: MouseEvent) => void) | null = null
let contextMenuHandler: ((event: MouseEvent) => void) | null = null
let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let pointerDownHandler: ((event: PointerEvent) => void) | null = null
let pointerUpHandler: ((event: PointerEvent) => void) | null = null
let pointerCancelHandler: (() => void) | null = null
let gamepadConnectedHandler: (() => void) | null = null
let gamepadDisconnectedHandler: (() => void) | null = null
let gamepadFrame: number | null = null

function coordinateKey(coordinate: SquaresCoordinate | null): string {
  return coordinate ? `${coordinate.row}:${coordinate.column}` : 'none'
}

function targetKey(target: SquaresInputTargetDescriptor): string {
  return target.kind === 'cell' ? `cell:${coordinateKey(target.coordinate)}` : target.kind
}

function toCoordinate(row: string | undefined, column: string | undefined): SquaresCoordinate | null {
  if (row === undefined || column === undefined) {
    return null
  }

  const parsedRow = Number.parseInt(row, 10)
  const parsedColumn = Number.parseInt(column, 10)
  if (!Number.isFinite(parsedRow) || !Number.isFinite(parsedColumn)) {
    return null
  }

  return {
    row: parsedRow,
    column: parsedColumn,
  }
}

function isManagedTarget(element: HTMLElement): boolean {
  return element.matches(MANAGED_TARGET_SELECTORS)
}

function isVisible(element: HTMLElement): boolean {
  if (element.closest('[hidden]')) {
    return false
  }

  if (typeof element.getClientRects !== 'function') {
    return true
  }

  return element.getClientRects().length > 0
}

function isTextEntryTarget(element: HTMLElement | null): boolean {
  return Boolean(element && ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))
}

function activateTarget(target: SquaresInputTargetDescriptor, source: SquaresInputSource): SquaresInputAction | null {
  switch (target.kind) {
    case 'cell':
      return target.coordinate ? { type: 'play-cell', coordinate: target.coordinate, source } : null
    case 'pattern-toggle':
      return { type: 'toggle-pattern', source }
    case 'menu':
      return { type: 'open-menu', source }
    case 'restart':
      return { type: 'restart-current-puzzle', source }
    default:
      return null
  }
}

function buttonPressed(snapshot: SquaresGamepadSnapshot, buttonIndex: number): boolean {
  return snapshot.buttons[buttonIndex] ?? false
}

function axisDirection(snapshot: SquaresGamepadSnapshot): NavigationDirection | null {
  const horizontal = snapshot.axes[0] ?? 0
  const vertical = snapshot.axes[1] ?? 0

  if (vertical <= -GAMEPAD_DEAD_ZONE) return 'ArrowUp'
  if (vertical >= GAMEPAD_DEAD_ZONE) return 'ArrowDown'
  if (horizontal <= -GAMEPAD_DEAD_ZONE) return 'ArrowLeft'
  if (horizontal >= GAMEPAD_DEAD_ZONE) return 'ArrowRight'
  return null
}

function describeTargetFromElement(target: EventTarget | null): SquaresInputTargetDescriptor {
  const element = target instanceof HTMLElement ? target : null
  const button = element?.closest<HTMLElement>('button') ?? null

  if (!button) {
    return EMPTY_TARGET
  }

  if (button.matches(SQUARES_CELL_SELECTOR)) {
    return {
      kind: 'cell',
      coordinate: toCoordinate(button.dataset['row'], button.dataset['column']),
    }
  }

  if (button.matches(SQUARES_PATTERN_TOGGLE_SELECTOR)) {
    return { kind: 'pattern-toggle', coordinate: null }
  }

  if (button.matches(SQUARES_MENU_BUTTON_SELECTOR)) {
    return { kind: 'menu', coordinate: null }
  }

  if (button.matches(SQUARES_RESTART_BUTTON_SELECTOR)) {
    return { kind: 'restart', coordinate: null }
  }

  return EMPTY_TARGET
}

function managedTargets(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(MANAGED_TARGET_SELECTORS)).filter(isVisible)
}

function currentManagedTarget(root: ParentNode): HTMLElement | null {
  const activeElement = document.activeElement
  return activeElement instanceof HTMLElement && isManagedTarget(activeElement) && root.contains(activeElement)
    ? activeElement
    : null
}

function focusManagedTarget(targets: readonly HTMLElement[], nextTarget: HTMLElement): void {
  for (const target of targets) {
    target.tabIndex = target === nextTarget ? 0 : -1
  }

  nextTarget.focus({ preventScroll: true })
}

function adjacentCell(
  current: HTMLElement,
  direction: NavigationDirection,
  targets: readonly HTMLElement[],
): HTMLElement | null {
  if (!current.matches(SQUARES_CELL_SELECTOR)) {
    return null
  }

  const coordinate = toCoordinate(current.dataset['row'], current.dataset['column'])
  if (!coordinate) {
    return null
  }

  const delta = direction === 'ArrowUp'
    ? { row: -1, column: 0 }
    : direction === 'ArrowDown'
      ? { row: 1, column: 0 }
      : direction === 'ArrowLeft'
        ? { row: 0, column: -1 }
        : { row: 0, column: 1 }

  const nextKey = coordinateKey({
    row: coordinate.row + delta.row,
    column: coordinate.column + delta.column,
  })

  return targets.find((target) =>
    target.matches(SQUARES_CELL_SELECTOR)
    && coordinateKey(toCoordinate(target.dataset['row'], target.dataset['column'])) === nextKey,
  ) ?? null
}

function spatialTarget(current: HTMLElement, targets: readonly HTMLElement[], direction: NavigationDirection): HTMLElement | null {
  const currentRect = current.getBoundingClientRect()
  const currentPoint = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2,
  }

  const nearest = findNearestDirectionalTarget(
    currentPoint,
    targets
      .filter((target) => target !== current)
      .map((target) => {
        const rect = target.getBoundingClientRect()
        return {
          element: target,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      }),
    direction,
  )

  return nearest?.element ?? null
}

function dispatchAction(action: SquaresInputAction | null, callbacks: InputCallbacks): void {
  if (!action) {
    return
  }

  switch (action.type) {
    case 'play-cell':
      callbacks.onPlayCell(action.coordinate, action.source)
      break
    case 'toggle-pattern':
      callbacks.onTogglePattern(action.source)
      break
    case 'open-menu':
      callbacks.onOpenMenu(action.source)
      break
    case 'restart-current-puzzle':
      callbacks.onRestartCurrentPuzzle(action.source)
      break
    default:
      break
  }
}

export function normalizeKeyboardAction(
  event: KeyboardActionLike,
  target: SquaresInputTargetDescriptor = EMPTY_TARGET,
): SquaresInputAction | null {
  const key = event.code ?? event.key

  if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
    return {
      type: 'move-focus',
      direction: key,
      source: 'keyboard',
    }
  }

  if (key === 'Enter' || key === 'Space' || key === 'Spacebar' || event.key === ' ') {
    return activateTarget(target, 'keyboard')
  }

  if (key === 'KeyT' || key === 'KeyX' || event.key === 't' || event.key === 'T' || event.key === 'x' || event.key === 'X') {
    return { type: 'toggle-pattern', source: 'keyboard' }
  }

  if (key === 'Escape' || key === 'KeyM' || event.key === 'm' || event.key === 'M') {
    return { type: 'open-menu', source: 'keyboard' }
  }

  if (key === 'KeyR' || event.key === 'r' || event.key === 'R') {
    return { type: 'restart-current-puzzle', source: 'keyboard' }
  }

  return null
}

export function normalizePointerAction(
  event: PointerActionLike,
  target: SquaresInputTargetDescriptor = EMPTY_TARGET,
): SquaresInputAction | null {
  if (event.type === 'contextmenu' && target.kind === 'cell') {
    return { type: 'toggle-pattern', source: event.pointerType === 'touch' ? 'touch' : 'mouse' }
  }

  if (event.type === 'click' && event.button === 0) {
    return activateTarget(target, event.pointerType === 'touch' ? 'touch' : 'mouse')
  }

  return null
}

export function createTouchHoldTracker<T>(options: {
  readonly thresholdMs?: number
  readonly schedule?: (callback: () => void, delayMs: number) => unknown
  readonly cancel?: (handle: unknown) => void
  readonly onTap: (target: T) => void
  readonly onLongHold: (target: T) => void
}): TouchHoldTracker<T> {
  const thresholdMs = options.thresholdMs ?? LONG_HOLD_MS
  const schedule = options.schedule ?? ((callback, delayMs) => setTimeout(callback, delayMs))
  const cancel = options.cancel ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>))
  let handle: unknown = null
  let currentTarget: T | null = null
  let longHeld = false

  return {
    start: (target) => {
      if (handle !== null) {
        cancel(handle)
      }

      currentTarget = target
      longHeld = false
      handle = schedule(() => {
        if (currentTarget === null) {
          return
        }

        longHeld = true
        options.onLongHold(currentTarget)
      }, thresholdMs)
    },
    release: () => {
      if (currentTarget === null) {
        return 'idle'
      }

      if (handle !== null) {
        cancel(handle)
        handle = null
      }

      const releasedTarget = currentTarget
      currentTarget = null

      if (longHeld) {
        return 'long-hold'
      }

      options.onTap(releasedTarget)
      return 'tap'
    },
    cancel: () => {
      if (handle !== null) {
        cancel(handle)
        handle = null
      }

      currentTarget = null
      longHeld = false
    },
  }
}

export function readGamepadAction(
  snapshot: SquaresGamepadSnapshot,
  previousState: SquaresGamepadState,
  now: number,
  focusedTarget: SquaresInputTargetDescriptor = EMPTY_TARGET,
): SquaresGamepadReadResult {
  const connectionChange = snapshot.connected === previousState.connected
    ? null
    : snapshot.connected
      ? 'connected'
      : 'disconnected'

  if (!snapshot.connected) {
    return {
      action: null,
      connectionChange,
      nextState: {
        connected: false,
        lastActionAt: previousState.lastActionAt,
        previousButtons: [],
        previousAxisDirection: null,
      },
    }
  }

  const canAct = now - previousState.lastActionAt >= GAMEPAD_DEBOUNCE_MS
  const nextAxisDirection = axisDirection(snapshot)

  let action: SquaresInputAction | null = null

  if (canAct && buttonPressed(snapshot, 9) && !previousState.previousButtons[9]) {
    action = { type: 'open-menu', source: 'gamepad' }
  } else if (canAct && buttonPressed(snapshot, 4) && !previousState.previousButtons[4]) {
    action = { type: 'toggle-pattern', source: 'gamepad' }
  } else if (canAct && buttonPressed(snapshot, 0) && !previousState.previousButtons[0]) {
    action = activateTarget(focusedTarget, 'gamepad')
  } else if (canAct && buttonPressed(snapshot, 12) && !previousState.previousButtons[12]) {
    action = { type: 'move-focus', direction: 'ArrowUp', source: 'gamepad' }
  } else if (canAct && buttonPressed(snapshot, 13) && !previousState.previousButtons[13]) {
    action = { type: 'move-focus', direction: 'ArrowDown', source: 'gamepad' }
  } else if (canAct && buttonPressed(snapshot, 14) && !previousState.previousButtons[14]) {
    action = { type: 'move-focus', direction: 'ArrowLeft', source: 'gamepad' }
  } else if (canAct && buttonPressed(snapshot, 15) && !previousState.previousButtons[15]) {
    action = { type: 'move-focus', direction: 'ArrowRight', source: 'gamepad' }
  } else if (canAct && nextAxisDirection !== null && nextAxisDirection !== previousState.previousAxisDirection) {
    action = { type: 'move-focus', direction: nextAxisDirection, source: 'gamepad' }
  }

  return {
    action,
    connectionChange,
    nextState: {
      connected: true,
      lastActionAt: action ? now : previousState.lastActionAt,
      previousButtons: [...snapshot.buttons],
      previousAxisDirection: nextAxisDirection,
    },
  }
}

export function setupInput(callbacks: InputCallbacks, options: SetupInputOptions = {}): void {
  if (clickHandler || keydownHandler || contextMenuHandler) {
    return
  }

  const root = options.root ?? document
  const rootNode = root instanceof Document ? root : root.ownerDocument
  const now = options.now ?? (() => Date.now())
  const requestAnimationFrameFn = options.requestAnimationFrameFn ?? requestAnimationFrame
  const cancelAnimationFrameFn = options.cancelAnimationFrameFn ?? cancelAnimationFrame
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout
  const clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout

  let suppressedClickTargetKey: string | null = null
  let gamepadState: SquaresGamepadState = {
    connected: false,
    lastActionAt: Number.NEGATIVE_INFINITY,
    previousButtons: [],
    previousAxisDirection: null,
  }

  const touchTracker = createTouchHoldTracker<SquaresInputTargetDescriptor>({
    thresholdMs: options.longHoldMs ?? LONG_HOLD_MS,
    schedule: (callback, delayMs) => setTimeoutFn(callback, delayMs),
    cancel: (handle) => clearTimeoutFn(handle as ReturnType<typeof setTimeout>),
    onTap: (target) => {
      dispatchAction(activateTarget(target, 'touch'), callbacks)
      suppressedClickTargetKey = targetKey(target)
    },
    onLongHold: () => {
      callbacks.onTogglePattern('touch')
    },
  })

  function updatePreview(target: SquaresInputTargetDescriptor, source: SquaresInputSource): void {
    callbacks.onPreviewCoordinateChange?.(target.kind === 'cell' ? target.coordinate : null, source)
  }

  function moveFocus(direction: NavigationDirection, source: SquaresInputSource): void {
    const targets = managedTargets(root)
    if (targets.length === 0) {
      callbacks.onMoveFocus(null, direction, source)
      return
    }

    const activeTarget = currentManagedTarget(root) ?? targets[0]
    const nextTarget = adjacentCell(activeTarget, direction, targets) ?? spatialTarget(activeTarget, targets, direction) ?? activeTarget

    focusManagedTarget(targets, nextTarget)
    const descriptor = describeTargetFromElement(nextTarget)
    callbacks.onMoveFocus(descriptor.coordinate, direction, source)
    updatePreview(descriptor, source)
  }

  clickHandler = (event) => {
    const descriptor = describeTargetFromElement(event.target)
    if (suppressedClickTargetKey !== null && suppressedClickTargetKey === targetKey(descriptor)) {
      suppressedClickTargetKey = null
      event.preventDefault()
      return
    }

    dispatchAction(normalizePointerAction({ type: 'click', button: event.button, pointerType: 'mouse' }, descriptor), callbacks)
  }

  contextMenuHandler = (event) => {
    const descriptor = describeTargetFromElement(event.target)
    const action = normalizePointerAction({ type: 'contextmenu', button: event.button, pointerType: 'mouse' }, descriptor)
    if (action) {
      event.preventDefault()
      dispatchAction(action, callbacks)
    }
  }

  keydownHandler = (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null
    if (target?.closest('#settings-modal')) {
      return
    }

    if (isTextEntryTarget(target)) {
      return
    }

    const descriptor = describeTargetFromElement(event.target)
    const action = normalizeKeyboardAction({ key: event.key, code: event.code }, descriptor)
    if (!action) {
      return
    }

    event.preventDefault()

    if (action.type === 'move-focus') {
      moveFocus(action.direction, action.source)
      return
    }

    if ((event.key === 'Enter' || event.key === ' ') && descriptor.kind !== 'none') {
      suppressedClickTargetKey = targetKey(descriptor)
    }

    dispatchAction(action, callbacks)
  }

  pointerDownHandler = (event) => {
    if (event.pointerType !== 'touch') {
      return
    }

    const descriptor = describeTargetFromElement(event.target)
    if (descriptor.kind !== 'cell') {
      return
    }

    touchTracker.start(descriptor)
    updatePreview(descriptor, 'touch')
  }

  pointerUpHandler = (event) => {
    if (event.pointerType !== 'touch') {
      return
    }

    const outcome = touchTracker.release()
    if (outcome === 'long-hold') {
      const descriptor = describeTargetFromElement(event.target)
      suppressedClickTargetKey = targetKey(descriptor)
    }
  }

  pointerCancelHandler = () => {
    touchTracker.cancel()
  }

  gamepadConnectedHandler = () => {
    callbacks.onGamepadConnectionChange?.(true)
  }

  gamepadDisconnectedHandler = () => {
    callbacks.onGamepadConnectionChange?.(false)
  }

  function pollGamepad(): void {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : []
    const pad = Array.from(pads ?? []).find((candidate) => candidate?.connected) ?? null
    const focusedTarget = describeTargetFromElement(document.activeElement)

    const result = readGamepadAction(
      pad
        ? {
          connected: true,
          buttons: pad.buttons.map((button) => button.pressed),
          axes: [...pad.axes],
        }
        : {
          connected: false,
          buttons: [],
          axes: [],
        },
      gamepadState,
      now(),
      focusedTarget,
    )

    gamepadState = result.nextState
    if (result.connectionChange === 'connected') {
      callbacks.onGamepadConnectionChange?.(true)
    } else if (result.connectionChange === 'disconnected') {
      callbacks.onGamepadConnectionChange?.(false)
    }

    if (result.action?.type === 'move-focus') {
      moveFocus(result.action.direction, result.action.source)
    } else {
      dispatchAction(result.action, callbacks)
    }

    gamepadFrame = requestAnimationFrameFn(pollGamepad)
  }

  rootNode.addEventListener('click', clickHandler)
  rootNode.addEventListener('contextmenu', contextMenuHandler)
  rootNode.addEventListener('keydown', keydownHandler)
  rootNode.addEventListener('pointerdown', pointerDownHandler)
  rootNode.addEventListener('pointerup', pointerUpHandler)
  rootNode.addEventListener('pointercancel', pointerCancelHandler)
  window.addEventListener('gamepadconnected', gamepadConnectedHandler)
  window.addEventListener('gamepaddisconnected', gamepadDisconnectedHandler)
  gamepadFrame = requestAnimationFrameFn(pollGamepad)

  void cancelAnimationFrameFn
}

export function teardownInput(): void {
  if (!clickHandler && !keydownHandler && !contextMenuHandler) {
    return
  }

  if (clickHandler) {
    document.removeEventListener('click', clickHandler)
    clickHandler = null
  }

  if (contextMenuHandler) {
    document.removeEventListener('contextmenu', contextMenuHandler)
    contextMenuHandler = null
  }

  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }

  if (pointerDownHandler) {
    document.removeEventListener('pointerdown', pointerDownHandler)
    pointerDownHandler = null
  }

  if (pointerUpHandler) {
    document.removeEventListener('pointerup', pointerUpHandler)
    pointerUpHandler = null
  }

  if (pointerCancelHandler) {
    document.removeEventListener('pointercancel', pointerCancelHandler)
    pointerCancelHandler = null
  }

  if (gamepadConnectedHandler) {
    window.removeEventListener('gamepadconnected', gamepadConnectedHandler)
    gamepadConnectedHandler = null
  }

  if (gamepadDisconnectedHandler) {
    window.removeEventListener('gamepaddisconnected', gamepadDisconnectedHandler)
    gamepadDisconnectedHandler = null
  }

  if (gamepadFrame !== null) {
    cancelAnimationFrame(gamepadFrame)
    gamepadFrame = null
  }
}
