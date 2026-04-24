import { findNearestDirectionalTarget, type NavigationDirection } from '../../client/spatial-navigation.js'

// ── Selectors ─────────────────────────────────────────────────────────────────

const CELL_SELECTOR = '[data-peekaboo-row][data-peekaboo-col]'
const SCENERY_SELECTOR = '[data-scenery="true"]'
const PROCEED_BTN_SELECTOR = '.peekaboo-proceed-btn'
const PLAY_AGAIN_BTN_SELECTOR = '.peekaboo-play-again-btn'
const MENU_BTN_SELECTOR = '.peekaboo-menu-btn'

const MANAGED_TARGET_SELECTORS = [
  CELL_SELECTOR,
  SCENERY_SELECTOR + ':not([disabled])',
  PROCEED_BTN_SELECTOR,
  PLAY_AGAIN_BTN_SELECTOR,
  MENU_BTN_SELECTOR,
].join(', ')

// ── Callback types ─────────────────────────────────────────────────────────────

export interface InputCallbacks {
  onRevealCell: (row: number, col: number) => void
  onPeekBehind: (row: number, col: number) => void
  onAdvancePhase: () => void
  onNextRound: () => void
  onOpenMenu: () => void
}

// ── Gamepad constants ─────────────────────────────────────────────────────────

const GAMEPAD_DEBOUNCE_MS = 200
const GAMEPAD_DEAD_ZONE = 0.5

// ── Gamepad types ─────────────────────────────────────────────────────────────

interface GamepadSnapshot {
  readonly connected: boolean
  readonly buttons: readonly boolean[]
  readonly axes: readonly number[]
}

interface GamepadState {
  readonly connected: boolean
  readonly lastActionAt: number
  readonly previousButtons: readonly boolean[]
  readonly previousAxisDirection: NavigationDirection | null
}

// ── Module-level handler refs ─────────────────────────────────────────────────

let clickHandler: ((event: MouseEvent) => void) | null = null
let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let gamepadConnectedHandler: (() => void) | null = null
let gamepadDisconnectedHandler: (() => void) | null = null
let gamepadFrame: number | null = null

// ── Helpers ────────────────────────────────────────────────────────────────────

function toRowCol(element: HTMLElement): { row: number; col: number } | null {
  const rowStr = element.dataset['peekabooRow']
  const colStr = element.dataset['peekabooCol']
  if (rowStr === undefined || colStr === undefined) {
    return null
  }

  const row = Number.parseInt(rowStr, 10)
  const col = Number.parseInt(colStr, 10)
  if (!Number.isFinite(row) || !Number.isFinite(col)) {
    return null
  }

  return { row, col }
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

// ── Gamepad reading ────────────────────────────────────────────────────────────

function buttonPressed(snapshot: GamepadSnapshot, buttonIndex: number): boolean {
  return snapshot.buttons[buttonIndex] ?? false
}

function axisDirection(snapshot: GamepadSnapshot): NavigationDirection | null {
  const horizontal = snapshot.axes[0] ?? 0
  const vertical = snapshot.axes[1] ?? 0

  if (vertical <= -GAMEPAD_DEAD_ZONE) return 'ArrowUp'
  if (vertical >= GAMEPAD_DEAD_ZONE) return 'ArrowDown'
  if (horizontal <= -GAMEPAD_DEAD_ZONE) return 'ArrowLeft'
  if (horizontal >= GAMEPAD_DEAD_ZONE) return 'ArrowRight'
  return null
}

type GamepadAction =
  | { readonly type: 'move-focus'; readonly direction: NavigationDirection }
  | { readonly type: 'reveal-cell' }
  | { readonly type: 'peek-behind' }
  | { readonly type: 'advance-phase' }
  | { readonly type: 'next-round' }
  | { readonly type: 'open-menu' }

interface GamepadReadResult {
  readonly action: GamepadAction | null
  readonly connectionChange: 'connected' | 'disconnected' | null
  readonly nextState: GamepadState
}

function readGamepadAction(
  snapshot: GamepadSnapshot,
  previousState: GamepadState,
  now: number,
  focusedElement: HTMLElement | null,
): GamepadReadResult {
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

  let action: GamepadAction | null = null

  // Start button (index 9): open menu
  if (canAct && buttonPressed(snapshot, 9) && !previousState.previousButtons[9]) {
    action = { type: 'open-menu' }
  } else if (canAct && buttonPressed(snapshot, 0) && !previousState.previousButtons[0]) {
    // A button (index 0): activate focused element
    if (focusedElement?.matches(SCENERY_SELECTOR) && !(focusedElement as HTMLButtonElement).disabled) {
      action = { type: 'peek-behind' }
    } else if (focusedElement?.matches(CELL_SELECTOR)) {
      action = { type: 'reveal-cell' }
    } else if (focusedElement?.matches(PROCEED_BTN_SELECTOR)) {
      action = { type: 'advance-phase' }
    } else if (focusedElement?.matches(PLAY_AGAIN_BTN_SELECTOR)) {
      action = { type: 'next-round' }
    } else if (focusedElement?.matches(MENU_BTN_SELECTOR)) {
      action = { type: 'open-menu' }
    }
  } else if (canAct && buttonPressed(snapshot, 12) && !previousState.previousButtons[12]) {
    // D-pad up (index 12)
    action = { type: 'move-focus', direction: 'ArrowUp' }
  } else if (canAct && buttonPressed(snapshot, 13) && !previousState.previousButtons[13]) {
    // D-pad down (index 13)
    action = { type: 'move-focus', direction: 'ArrowDown' }
  } else if (canAct && buttonPressed(snapshot, 14) && !previousState.previousButtons[14]) {
    // D-pad left (index 14)
    action = { type: 'move-focus', direction: 'ArrowLeft' }
  } else if (canAct && buttonPressed(snapshot, 15) && !previousState.previousButtons[15]) {
    // D-pad right (index 15)
    action = { type: 'move-focus', direction: 'ArrowRight' }
  } else if (canAct && nextAxisDirection !== null && nextAxisDirection !== previousState.previousAxisDirection) {
    action = { type: 'move-focus', direction: nextAxisDirection }
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

// ── Setup / teardown ──────────────────────────────────────────────────────────

export interface SetupInputOptions {
  readonly root?: Document | HTMLElement
  readonly requestAnimationFrameFn?: typeof requestAnimationFrame
  readonly cancelAnimationFrameFn?: typeof cancelAnimationFrame
}

export function setupInput(
  callbacks: InputCallbacks,
  gridContainer: HTMLElement,
  buttons: { proceed: HTMLElement; playAgain: HTMLElement; menu: HTMLElement },
  options: SetupInputOptions = {},
): () => void {
  // Prevent double-setup
  if (clickHandler || keydownHandler) {
    return () => {}
  }

  const root = options.root ?? document
  const rootNode = root instanceof Document ? root : root.ownerDocument
  const requestAnimationFrameFn = options.requestAnimationFrameFn ?? requestAnimationFrame
  const cancelAnimationFrameFn = options.cancelAnimationFrameFn ?? cancelAnimationFrame

  // Apply touch-action: manipulation to all grid cells
  const cells = Array.from(gridContainer.querySelectorAll<HTMLButtonElement>(CELL_SELECTOR))
  for (const cell of cells) {
    cell.style.touchAction = 'manipulation'
  }

  let gamepadState: GamepadState = {
    connected: false,
    lastActionAt: Number.NEGATIVE_INFINITY,
    previousButtons: [],
    previousAxisDirection: null,
  }

  // ── Click handler ─────────────────────────────────────────────────────────

  clickHandler = (event: MouseEvent) => {
    const target = event.target instanceof HTMLElement ? event.target : null
    const button = target?.closest<HTMLButtonElement>('button') ?? null
    if (!button) return

    // Scenery click (peek behind) — check before CELL_SELECTOR since scenery also has row/col
    if (button.matches(SCENERY_SELECTOR) && !button.disabled) {
      const rc = toRowCol(button)
      if (rc) {
        callbacks.onPeekBehind(rc.row, rc.col)
      }
      return
    }

    if (button.matches(CELL_SELECTOR)) {
      const rc = toRowCol(button)
      if (rc) {
        callbacks.onRevealCell(rc.row, rc.col)
      }
      return
    }

    if (button.matches(PROCEED_BTN_SELECTOR)) {
      callbacks.onAdvancePhase()
      return
    }

    if (button.matches(PLAY_AGAIN_BTN_SELECTOR)) {
      callbacks.onNextRound()
      return
    }

    if (button.matches(MENU_BTN_SELECTOR)) {
      callbacks.onOpenMenu()
      return
    }
  }

  // ── Keyboard handler ─────────────────────────────────────────────────────

  keydownHandler = (event: KeyboardEvent) => {
    const target = event.target instanceof HTMLElement ? event.target : null

    // Ignore events inside settings modal
    if (target?.closest('#settings-modal')) {
      return
    }

    // Ignore text entry targets
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return
    }

    const key = event.code ?? event.key

    // Arrow keys: navigate grid cells
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault()
      moveFocus(key)
      return
    }

    // Enter/Space on focused grid cell: reveal
    if (key === 'Enter' || key === 'Space' || key === 'Spacebar' || event.key === ' ') {
      // Scenery button: peek behind
      if (target?.matches(SCENERY_SELECTOR) && !(target as HTMLButtonElement).disabled) {
        event.preventDefault()
        const rc = toRowCol(target)
        if (rc) {
          callbacks.onPeekBehind(rc.row, rc.col)
        }
        return
      }

      if (target?.matches(CELL_SELECTOR)) {
        event.preventDefault()
        const rc = toRowCol(target)
        if (rc) {
          callbacks.onRevealCell(rc.row, rc.col)
        }
        return
      }

      // Enter on proceed button: advance phase
      if (key === 'Enter' && target?.matches(PROCEED_BTN_SELECTOR)) {
        event.preventDefault()
        callbacks.onAdvancePhase()
        return
      }

      // Enter on play-again button: next round
      if (key === 'Enter' && target?.matches(PLAY_AGAIN_BTN_SELECTOR)) {
        event.preventDefault()
        callbacks.onNextRound()
        return
      }
    }

    // Escape: open menu
    if (key === 'Escape') {
      event.preventDefault()
      callbacks.onOpenMenu()
      return
    }
  }

  // ── Focus navigation ─────────────────────────────────────────────────────

  function moveFocus(direction: NavigationDirection): void {
    const targets = managedTargets(gridContainer)
    // Also include button targets in the search scope
    const allTargets: HTMLElement[] = [...targets]
    const btnRoot = rootNode ?? document
    const proceedBtn = btnRoot.querySelector<HTMLElement>(PROCEED_BTN_SELECTOR)
    const playAgainBtn = btnRoot.querySelector<HTMLElement>(PLAY_AGAIN_BTN_SELECTOR)
    const menuBtn = btnRoot.querySelector<HTMLElement>(MENU_BTN_SELECTOR)
    if (proceedBtn && isVisible(proceedBtn)) allTargets.push(proceedBtn)
    if (playAgainBtn && isVisible(playAgainBtn)) allTargets.push(playAgainBtn)
    if (menuBtn && isVisible(menuBtn)) allTargets.push(menuBtn)

    if (allTargets.length === 0) {
      return
    }

    const activeTarget = currentManagedTarget(gridContainer) ?? allTargets[0]
    const nextTarget = spatialTarget(activeTarget, allTargets, direction) ?? activeTarget

    focusManagedTarget(allTargets, nextTarget)
  }

  // ── Gamepad polling ──────────────────────────────────────────────────────

  gamepadConnectedHandler = () => {
    document.body.classList.add('gamepad-active')
  }

  gamepadDisconnectedHandler = () => {
    // nothing extra needed
  }

  function pollGamepad(): void {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : []
    const pad = Array.from(pads ?? []).find((candidate) => candidate?.connected) ?? null
    const focusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null

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
      Date.now(),
      focusedElement,
    )

    gamepadState = result.nextState

    if (result.action?.type === 'move-focus') {
      moveFocus(result.action.direction)
    } else if (result.action?.type === 'reveal-cell') {
      const rc = focusedElement ? toRowCol(focusedElement) : null
      if (rc) {
        callbacks.onRevealCell(rc.row, rc.col)
      }
    } else if (result.action?.type === 'peek-behind') {
      const rc = focusedElement ? toRowCol(focusedElement) : null
      if (rc) {
        callbacks.onPeekBehind(rc.row, rc.col)
      }
    } else if (result.action?.type === 'advance-phase') {
      callbacks.onAdvancePhase()
    } else if (result.action?.type === 'next-round') {
      callbacks.onNextRound()
    } else if (result.action?.type === 'open-menu') {
      callbacks.onOpenMenu()
    }

    gamepadFrame = requestAnimationFrameFn(pollGamepad)
  }

  // ── Bind events ──────────────────────────────────────────────────────────

  rootNode.addEventListener('click', clickHandler)
  rootNode.addEventListener('keydown', keydownHandler)
  window.addEventListener('gamepadconnected', gamepadConnectedHandler)
  window.addEventListener('gamepaddisconnected', gamepadDisconnectedHandler)
  gamepadFrame = requestAnimationFrameFn(pollGamepad)

  // ── Cleanup function ─────────────────────────────────────────────────────

  const cleanup = (): void => {
    if (clickHandler) {
      rootNode.removeEventListener('click', clickHandler)
      clickHandler = null
    }

    if (keydownHandler) {
      rootNode.removeEventListener('keydown', keydownHandler)
      keydownHandler = null
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
      cancelAnimationFrameFn(gamepadFrame)
      gamepadFrame = null
    }
  }

  return cleanup
}

export function cleanup(): void {
  if (!clickHandler && !keydownHandler) {
    return
  }

  if (clickHandler) {
    document.removeEventListener('click', clickHandler)
    clickHandler = null
  }

  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
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