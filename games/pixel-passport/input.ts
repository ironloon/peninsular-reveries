import { DESTINATION_IDS, type DestinationId, type GameState, type NavigationDirection } from './types.js'
import { isModalOpen, focusableElements } from '../../client/game-input.js'

declare global {
  interface Window {
    __settingsToggle?: () => void
  }
}

export interface InputCallbacks {
  onStartExplore: () => void
  onSelectDestination: (destinationId: DestinationId) => void
  onAdvanceFact: () => void
  onNavigateGlobe: (direction: NavigationDirection) => void
}

const STICK_THRESHOLD = 0.5
const NAVIGATION_DEBOUNCE_MS = 200

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
}

function currentSelectedDestination(state: GameState): DestinationId {
  return DESTINATION_IDS[state.globeSelectedIndex] ?? DESTINATION_IDS[0]
}

function screenIdForPhase(phase: GameState['phase']): string {
  switch (phase) {
    case 'title': return 'start-screen'
    case 'globe': return 'globe-screen'
    case 'travel': return 'travel-screen'
    case 'explore': return 'explore-screen'
  }
}

function cycleFocus(elements: readonly HTMLElement[], direction: NavigationDirection): void {
  if (elements.length === 0) return

  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const currentIndex = active ? elements.indexOf(active) : -1

  const nextIndex = currentIndex >= 0
    ? direction === 'next'
      ? (currentIndex + 1) % elements.length
      : (currentIndex - 1 + elements.length) % elements.length
    : direction === 'next'
      ? 0
      : elements.length - 1

  elements[nextIndex]?.focus()
}

function activateFocusedElement(root: ParentNode | null): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || !isInteractiveTarget(active)) {
    return false
  }

  if (root && !root.contains(active)) {
    return false
  }

  active.click()
  return true
}

function activeScreenElement(state: GameState): HTMLElement | null {
  return document.getElementById(screenIdForPhase(state.phase))
}

function connectedGamepad(): Gamepad | null {
  const gamepads = navigator.getGamepads?.()
  if (!gamepads) {
    return null
  }

  for (const gamepad of Array.from(gamepads)) {
    if (gamepad?.connected) {
      return gamepad
    }
  }

  return null
}

function gamepadDirection(gamepad: Gamepad): NavigationDirection | null {
  const dpadPrevious = Boolean(gamepad.buttons[12]?.pressed) || Boolean(gamepad.buttons[14]?.pressed)
  const dpadNext = Boolean(gamepad.buttons[13]?.pressed) || Boolean(gamepad.buttons[15]?.pressed)

  if (dpadPrevious) {
    return 'previous'
  }

  if (dpadNext) {
    return 'next'
  }

  const axisX = gamepad.axes[0] ?? 0
  const axisY = gamepad.axes[1] ?? 0

  if (axisX <= -STICK_THRESHOLD || axisY <= -STICK_THRESHOLD) {
    return 'previous'
  }

  if (axisX >= STICK_THRESHOLD || axisY >= STICK_THRESHOLD) {
    return 'next'
  }

  return null
}

export function setupInput(getState: () => GameState, callbacks: InputCallbacks): void {
  document.getElementById('start-explore-btn')?.addEventListener('click', callbacks.onStartExplore)
  document.getElementById('explore-next-btn')?.addEventListener('click', callbacks.onAdvanceFact)

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-destination-id]')) {
    button.addEventListener('click', () => {
      const destinationId = button.dataset.destinationId as DestinationId | undefined
      if (!destinationId) return

      const state = getState()
      if (state.phase === 'globe') {
        callbacks.onSelectDestination(destinationId)
      }
    })
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isModalOpen()) {
      event.preventDefault()
      window.__settingsToggle?.()
      return
    }

    if (isModalOpen()) return

    const state = getState()
    const inGlobe = state.phase === 'globe'
    const interactiveTarget = isInteractiveTarget(event.target)

    if (inGlobe && (event.key === 'ArrowRight' || event.key === 'ArrowDown')) {
      event.preventDefault()
      callbacks.onNavigateGlobe('next')
      return
    }

    if (inGlobe && (event.key === 'ArrowLeft' || event.key === 'ArrowUp')) {
      event.preventDefault()
      callbacks.onNavigateGlobe('previous')
      return
    }

    if ((event.key === 'Enter' || event.key === ' ') && !interactiveTarget) {
      if (state.phase === 'title') {
        event.preventDefault()
        callbacks.onStartExplore()
        return
      }

      if (state.phase === 'globe') {
        event.preventDefault()
        callbacks.onSelectDestination(currentSelectedDestination(state))
        return
      }

      if (state.phase === 'explore') {
        event.preventDefault()
        callbacks.onAdvanceFact()
        return
      }
    }
  })

  function handleDirectionalInput(direction: NavigationDirection): void {
    if (isModalOpen()) {
      cycleFocus(focusableElements(document.getElementById('settings-modal')), direction)
      return
    }

    const state = getState()

    if (state.phase === 'globe') {
      callbacks.onNavigateGlobe(direction)
      return
    }

    if (state.phase === 'travel') {
      return
    }

    cycleFocus(focusableElements(activeScreenElement(state)), direction)
  }

  function handlePrimaryAction(): void {
    if (isModalOpen()) {
      if (!activateFocusedElement(document.getElementById('settings-modal'))) {
        focusableElements(document.getElementById('settings-modal'))[0]?.focus()
      }
      return
    }

    const state = getState()
    if (activateFocusedElement(activeScreenElement(state))) {
      return
    }

    if (state.phase === 'title') {
      callbacks.onStartExplore()
      return
    }

    if (state.phase === 'globe') {
      callbacks.onSelectDestination(currentSelectedDestination(state))
      return
    }

    if (state.phase === 'explore') {
      callbacks.onAdvanceFact()
    }
  }

  let gamepadFrameId: number | null = null
  let previousButtonStates: boolean[] = []
  let heldDirection: NavigationDirection | null = null
  let lastNavigationAt = 0

  const pollGamepad = (): void => {
    if (document.visibilityState !== 'visible') {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
      return
    }

    const pad = connectedGamepad()
    if (!pad) {
      heldDirection = null
      previousButtonStates = []
      gamepadFrameId = requestAnimationFrame(pollGamepad)
      return
    }

    const now = Date.now()
    const direction = gamepadDirection(pad)
    if (direction && (direction !== heldDirection || now - lastNavigationAt >= NAVIGATION_DEBOUNCE_MS)) {
      handleDirectionalInput(direction)
      lastNavigationAt = now
    }
    heldDirection = direction

    const actionPressed = Boolean(pad.buttons[0]?.pressed)
    const startPressed = Boolean(pad.buttons[9]?.pressed)

    if (actionPressed && !(previousButtonStates[0] ?? false)) {
      handlePrimaryAction()
    }

    if (startPressed && !(previousButtonStates[9] ?? false)) {
      window.__settingsToggle?.()
    }

    previousButtonStates = pad.buttons.map((button) => button.pressed)
    gamepadFrameId = requestAnimationFrame(pollGamepad)
  }

  const ensureGamepadPolling = (): void => {
    document.body.classList.add('gamepad-active')
    if (gamepadFrameId === null) {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
    }
  }

  if (connectedGamepad()) {
    ensureGamepadPolling()
  }

  window.addEventListener('gamepadconnected', ensureGamepadPolling)
  window.addEventListener('gamepaddisconnected', () => {
    if (connectedGamepad()) {
      return
    }

    if (gamepadFrameId !== null) {
      cancelAnimationFrame(gamepadFrameId)
      gamepadFrameId = null
    }

    heldDirection = null
    previousButtonStates = []
  })
}