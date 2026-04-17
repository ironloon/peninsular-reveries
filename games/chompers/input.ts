import { findNearestDirectionalTarget, type NavigationDirection } from '../../client/spatial-navigation.js'
import { isModalOpen } from '../../client/game-input.js'

export interface InputCallbacks {
  onSelectAnswer: (itemId: string) => void
  onToggleSettings: () => void
}

let pointerHandler: ((event: PointerEvent) => void) | null = null
let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let gamepadHandle: number | null = null
let lastGamepadAction = 0
let clearGamepadModeHandler: (() => void) | null = null

function isVisible(element: HTMLElement): boolean {
  return !element.closest('[hidden]') && element.getClientRects().length > 0
}

function getActiveScreen(): 'start-screen' | 'game-screen' | 'end-screen' | null {
  const active = document.querySelector<HTMLElement>('.game-screen:not([hidden])')
  if (!active) return null
  if (active.id === 'start-screen' || active.id === 'game-screen' || active.id === 'end-screen') {
    return active.id
  }
  return null
}

function isManagedFocusTarget(element: HTMLElement): boolean {
  return element.matches('.area-card, .level-selector label, .mode-radio-group label')
}

function getStartScreenTargets(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(
    '#start-screen .area-card, #start-screen .level-selector label, #start-screen .start-actions .chomp-btn',
  )).filter(isVisible)
}

function getEndScreenTargets(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#end-screen .chomp-btn')).filter(isVisible)
}

function getModalTargets(): HTMLElement[] {
  const modal = document.getElementById('settings-modal')
  if (!modal || modal.hasAttribute('hidden')) return []

  return Array.from(modal.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter(isVisible)
}

function focusGamepadTarget(target: HTMLElement): void {
  document.body.classList.add('gamepad-active')

  const previous = document.querySelector<HTMLElement>('.gamepad-focus')
  if (previous && previous !== target) {
    previous.classList.remove('gamepad-focus')
    if (isManagedFocusTarget(previous)) previous.tabIndex = -1
  }

  if (isManagedFocusTarget(target)) target.tabIndex = 0
  target.classList.add('gamepad-focus')
  target.focus({ preventScroll: true })
  target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function focusNearestControl(candidates: HTMLElement[], direction: NavigationDirection): void {
  if (candidates.length === 0) return

  const focused = document.activeElement as HTMLElement | null
  const current = focused && candidates.includes(focused) ? focused : null

  if (!current) {
    focusGamepadTarget(candidates[0])
    return
  }

  const nearest = findNearestInDirection(current, candidates, direction)
  if (nearest) focusGamepadTarget(nearest)
}

function activateElement(target: HTMLElement): void {
  target.click()
}

function getActiveSceneItems(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('.scene-item:not([disabled]):not([aria-hidden="true"])'),
  )
}

function findNearestInDirection(
  current: HTMLElement,
  candidates: HTMLElement[],
  direction: NavigationDirection,
): HTMLElement | null {
  const currentRect = current.getBoundingClientRect()
  const currentPoint = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2,
  }

  const nearest = findNearestDirectionalTarget(
    currentPoint,
    candidates
      .filter((candidate) => candidate !== current)
      .map((candidate) => {
        const rect = candidate.getBoundingClientRect()
        return {
          element: candidate,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      }),
    direction,
  )

  return nearest?.element ?? null
}

function getFocusedItem(): HTMLElement | null {
  const focused = document.activeElement as HTMLElement | null
  if (focused?.classList.contains('scene-item') && isVisible(focused) && !focused.hasAttribute('disabled')) return focused
  return null
}

export function moveFocusToFirstItem(): void {
  const first = document.querySelector<HTMLElement>('.scene-item:not([disabled])')
  if (first) first.focus()
}

export function setupInput(callbacks: InputCallbacks): void {
  if (pointerHandler || keydownHandler || gamepadHandle !== null) return

  clearGamepadModeHandler = () => {
    document.body.classList.remove('gamepad-active')
    document.querySelector<HTMLElement>('.gamepad-focus')?.classList.remove('gamepad-focus')
  }

  document.addEventListener('mousemove', clearGamepadModeHandler)
  document.addEventListener('pointerdown', clearGamepadModeHandler)
  document.addEventListener('touchstart', clearGamepadModeHandler, { passive: true })
  document.addEventListener('keydown', clearGamepadModeHandler)

  pointerHandler = (event: PointerEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-item-id]')
    if (target && !target.disabled) {
      const itemId = target.dataset.itemId
      if (itemId) callbacks.onSelectAnswer(itemId)
    }
  }
  document.addEventListener('pointerup', pointerHandler)

  keydownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !isModalOpen()) {
      event.preventDefault()
      callbacks.onToggleSettings()
      return
    }

    if (isModalOpen()) return

    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) && !target.classList.contains('scene-item')) {
      return
    }

    if (getActiveScreen() !== 'game-screen') return

    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (arrows.includes(event.key)) {
      event.preventDefault()
      const items = getActiveSceneItems()
      if (items.length <= 1) return

      const focused = getFocusedItem()
      if (!focused) {
        moveFocusToFirstItem()
        return
      }

      const nearest = findNearestInDirection(focused, items, event.key as NavigationDirection)
      if (nearest) {
        focused.tabIndex = -1
        nearest.tabIndex = 0
        nearest.focus()
      }
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const focused = getFocusedItem()
      if (focused) {
        event.preventDefault()
        const itemId = focused.dataset.itemId
        if (itemId) callbacks.onSelectAnswer(itemId)
      }
    }
  }
  document.addEventListener('keydown', keydownHandler)

  function focusGameplayItem(direction: NavigationDirection): void {
    const items = getActiveSceneItems()
    const focused = getFocusedItem()

    if (!focused) {
      if (items[0]) focusGamepadTarget(items[0])
      return
    }

    if (items.length <= 1) return

    const nearest = findNearestInDirection(focused, items, direction)
    if (nearest) {
      focused.tabIndex = -1
      nearest.tabIndex = 0
      focusGamepadTarget(nearest)
    }
  }

  function focusCurrentContext(direction: NavigationDirection): void {
    if (isModalOpen()) {
      focusNearestControl(getModalTargets(), direction)
      return
    }

    const screen = getActiveScreen()
    if (screen === 'game-screen') {
      focusGameplayItem(direction)
      return
    }

    if (screen === 'start-screen') {
      focusNearestControl(getStartScreenTargets(), direction)
      return
    }

    if (screen === 'end-screen') {
      focusNearestControl(getEndScreenTargets(), direction)
    }
  }

  function activateCurrentContext(): void {
    if (isModalOpen()) {
      const modalTargets = getModalTargets()
      const focused = document.activeElement as HTMLElement | null
      const current = focused && modalTargets.includes(focused) ? focused : null
      if (!current) {
        if (modalTargets[0]) focusGamepadTarget(modalTargets[0])
        return
      }
      activateElement(current)
      return
    }

    const screen = getActiveScreen()
    if (screen === 'game-screen') {
      const focused = getFocusedItem()
      if (!focused) {
        moveFocusToFirstItem()
        return
      }

      const itemId = focused.dataset.itemId
      if (itemId) callbacks.onSelectAnswer(itemId)
      return
    }

    if (screen === 'start-screen') {
      const startTargets = getStartScreenTargets()
      const focused = document.activeElement as HTMLElement | null
      const current = focused && startTargets.includes(focused) ? focused : null
      if (current) {
        activateElement(current)
        return
      }

      document.getElementById('start-btn')?.click()
      return
    }

    if (screen === 'end-screen') {
      const endTargets = getEndScreenTargets()
      const focused = document.activeElement as HTMLElement | null
      const current = focused && endTargets.includes(focused) ? focused : null
      if (current) {
        activateElement(current)
        return
      }

      document.getElementById('replay-btn')?.click()
    }
  }

  let prevDpadUp = false
  let prevDpadDown = false
  let prevDpadLeft = false
  let prevDpadRight = false
  let prevBtnA = false
  let prevBtnStart = false

  function pollGamepad(): void {
    if (document.visibilityState !== 'visible') {
      gamepadHandle = requestAnimationFrame(pollGamepad)
      return
    }

    const pads = navigator.getGamepads?.()
    const pad = pads ? pads[0] : null

    if (pad) {
      document.body.classList.add('gamepad-active')

      const now = Date.now()
      const debounce = 200

      const dpadUp = pad.buttons[12]?.pressed ?? false
      const dpadDown = pad.buttons[13]?.pressed ?? false
      const dpadLeft = pad.buttons[14]?.pressed ?? false
      const dpadRight = pad.buttons[15]?.pressed ?? false
      const btnA = pad.buttons[0]?.pressed ?? false
      const btnStart = pad.buttons[9]?.pressed ?? false
      const axis0 = pad.axes[0] ?? 0
      const axis1 = pad.axes[1] ?? 0

      if (now - lastGamepadAction >= debounce) {
        let direction: NavigationDirection | null = null

        if (dpadUp && !prevDpadUp) direction = 'ArrowUp'
        else if (dpadDown && !prevDpadDown) direction = 'ArrowDown'
        else if (dpadLeft && !prevDpadLeft) direction = 'ArrowLeft'
        else if (dpadRight && !prevDpadRight) direction = 'ArrowRight'
        else if (axis1 < -0.5) direction = 'ArrowUp'
        else if (axis1 > 0.5) direction = 'ArrowDown'
        else if (axis0 < -0.5) direction = 'ArrowLeft'
        else if (axis0 > 0.5) direction = 'ArrowRight'

        if (direction) {
          lastGamepadAction = now
          focusCurrentContext(direction)
        }

        if (btnA && !prevBtnA) {
          lastGamepadAction = now
          activateCurrentContext()
        }

        if (btnStart && !prevBtnStart) {
          lastGamepadAction = now
          callbacks.onToggleSettings()
        }
      }

      prevDpadUp = dpadUp
      prevDpadDown = dpadDown
      prevDpadLeft = dpadLeft
      prevDpadRight = dpadRight
      prevBtnA = btnA
      prevBtnStart = btnStart
    }

    gamepadHandle = requestAnimationFrame(pollGamepad)
  }

  gamepadHandle = requestAnimationFrame(pollGamepad)
}

export function teardownInput(): void {
  if (pointerHandler) {
    document.removeEventListener('pointerup', pointerHandler)
    pointerHandler = null
  }

  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }

  if (gamepadHandle !== null) {
    cancelAnimationFrame(gamepadHandle)
    gamepadHandle = null
  }

  if (clearGamepadModeHandler) {
    document.removeEventListener('mousemove', clearGamepadModeHandler)
    document.removeEventListener('pointerdown', clearGamepadModeHandler)
    document.removeEventListener('touchstart', clearGamepadModeHandler)
    document.removeEventListener('keydown', clearGamepadModeHandler)
    clearGamepadModeHandler = null
  }

  document.body.classList.remove('gamepad-active')
  document.querySelector<HTMLElement>('.gamepad-focus')?.classList.remove('gamepad-focus')
}
