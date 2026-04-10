export interface InputCallbacks {
  onStart: () => void
  onAdvancePhase: () => void
  onTap: () => void
  onHoldStart: () => void
  onHoldEnd: () => void
  onSettings: () => void
  onPlayAgain: () => void
}

type NavigationDirection = 'previous' | 'next'

type Listener = {
  target: EventTarget
  type: string
  fn: EventListenerOrEventListenerObject
}

const STICK_THRESHOLD = 0.5
const NAVIGATION_DEBOUNCE_MS = 200

let listeners: Listener[] = []
let tapDebounceTimer: ReturnType<typeof setTimeout> | null = null
let gamepadFrameId: number | null = null
let previousButtonStates: boolean[] = []
let heldDirection: NavigationDirection | null = null
let lastNavigationAt = 0
let holdingWithGamepad = false
let currentGamepadFocus: HTMLElement | null = null

function addListener(target: EventTarget, type: string, fn: EventListenerOrEventListenerObject): void {
  target.addEventListener(type, fn)
  listeners.push({ target, type, fn })
}

function makeTap(callbacks: InputCallbacks): () => void {
  return () => {
    if (tapDebounceTimer !== null) return
    callbacks.onTap()
    tapDebounceTimer = setTimeout(() => {
      tapDebounceTimer = null
    }, 50)
  }
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
}

function isModalOpen(): boolean {
  const modal = document.getElementById('settings-modal')
  return modal instanceof HTMLElement && !modal.hasAttribute('hidden')
}

function focusableElements(root: ParentNode | null): HTMLElement[] {
  if (!root) {
    return []
  }

  return Array.from(root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')).filter((element) => {
    if (element.tabIndex < 0) return false
    if (element.hasAttribute('disabled') || element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
      return false
    }

    if (element instanceof HTMLInputElement && element.type === 'hidden') {
      return false
    }

    return element.getClientRects().length > 0
  })
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
  const previousPressed = Boolean(gamepad.buttons[12]?.pressed) || Boolean(gamepad.buttons[14]?.pressed)
  const nextPressed = Boolean(gamepad.buttons[13]?.pressed) || Boolean(gamepad.buttons[15]?.pressed)

  if (previousPressed) {
    return 'previous'
  }

  if (nextPressed) {
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

function clearGamepadFocus(): void {
  currentGamepadFocus?.classList.remove('gamepad-focus')
  currentGamepadFocus = null
}

function enableGamepadMode(): void {
  document.body.classList.add('gamepad-active')
}

function clearGamepadMode(): void {
  document.body.classList.remove('gamepad-active')
  clearGamepadFocus()
}

function markGamepadFocus(target: HTMLElement | null, shouldFocus: boolean = true): HTMLElement | null {
  if (!target) {
    clearGamepadFocus()
    return null
  }

  enableGamepadMode()
  if (currentGamepadFocus !== target) {
    clearGamepadFocus()
    currentGamepadFocus = target
    currentGamepadFocus.classList.add('gamepad-focus')
  }

  if (shouldFocus) {
    target.focus({ preventScroll: true })
  }

  return target
}

function activeScreen(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.screen.active')
}

function activeOrHighlightedElement(root: ParentNode | null): HTMLElement | null {
  const active = document.activeElement
  if (active instanceof HTMLElement && root && root.contains(active) && isInteractiveTarget(active)) {
    return active
  }

  if (currentGamepadFocus && root && root.contains(currentGamepadFocus) && isInteractiveTarget(currentGamepadFocus)) {
    return currentGamepadFocus
  }

  return null
}

function defaultScreenTarget(screen: HTMLElement): HTMLElement | null {
  if (screen.id === 'start-screen') {
    return document.getElementById('start-btn')
      ?? focusableElements(screen)[0]
      ?? null
  }

  if (screen.id === 'end-screen') {
    return document.getElementById('play-again-btn')
      ?? focusableElements(screen)[0]
      ?? null
  }

  return focusableElements(screen)[0] ?? null
}

function visibleContinueButton(): HTMLButtonElement | null {
  const button = document.getElementById('continue-btn')
  if (!(button instanceof HTMLButtonElement) || button.hidden || !button.classList.contains('continue-visible')) {
    return null
  }

  return button
}

function visibleTapButton(): HTMLButtonElement | null {
  const button = document.getElementById('tap-btn')
  if (!(button instanceof HTMLButtonElement) || button.hidden || button.getClientRects().length === 0) {
    return null
  }

  return button
}

function isHoldActionButton(button: HTMLButtonElement | null): boolean {
  return button?.dataset.actionMode === 'hold'
}

export function setupInput(callbacks: InputCallbacks): void {
  const startBtn = document.getElementById('start-btn')
  const tapBtn = document.getElementById('tap-btn')
  const playAgainBtn = document.getElementById('play-again-btn')

  const tap = makeTap(callbacks)

  const releaseGamepadHold = (): void => {
    if (!holdingWithGamepad) {
      return
    }

    holdingWithGamepad = false
    callbacks.onHoldEnd()
  }

  const syncGamepadCue = (): void => {
    if (!document.body.classList.contains('gamepad-active')) {
      return
    }

    if (isModalOpen()) {
      const modal = document.getElementById('settings-modal')
      markGamepadFocus(activeOrHighlightedElement(modal) ?? focusableElements(modal)[0] ?? null, false)
      return
    }

    const screen = activeScreen()
    if (!screen) {
      clearGamepadFocus()
      return
    }

    if (screen.id === 'game-screen') {
      markGamepadFocus(visibleContinueButton() ?? visibleTapButton(), false)
      return
    }

    markGamepadFocus(activeOrHighlightedElement(screen) ?? defaultScreenTarget(screen), false)
  }

  const cycleFocus = (elements: readonly HTMLElement[], direction: NavigationDirection): void => {
    if (elements.length === 0) {
      return
    }

    enableGamepadMode()
    const current = activeOrHighlightedElement(elements[0]?.closest('.screen, #settings-modal') ?? null)
    const currentIndex = current ? elements.indexOf(current) : -1
    const nextIndex = currentIndex >= 0
      ? direction === 'next'
        ? (currentIndex + 1) % elements.length
        : (currentIndex - 1 + elements.length) % elements.length
      : 0

    markGamepadFocus(elements[nextIndex] ?? elements[0])
  }

  const handleDirectionalInput = (direction: NavigationDirection): void => {
    if (isModalOpen()) {
      cycleFocus(focusableElements(document.getElementById('settings-modal')), direction)
      return
    }

    const screen = activeScreen()
    if (!screen || (screen.id !== 'start-screen' && screen.id !== 'end-screen')) {
      return
    }

    cycleFocus(focusableElements(screen), direction)
  }

  const handlePrimaryPress = (): void => {
    enableGamepadMode()

    if (isModalOpen()) {
      const modal = document.getElementById('settings-modal')
      const target = markGamepadFocus(activeOrHighlightedElement(modal) ?? focusableElements(modal)[0] ?? null)
      target?.click()
      return
    }

    const screen = activeScreen()
    if (!screen) {
      return
    }

    if (screen.id === 'game-screen') {
      const continueButton = visibleContinueButton()
      if (continueButton) {
        markGamepadFocus(continueButton, false)
        callbacks.onAdvancePhase()
        return
      }

      const actionButton = visibleTapButton()
      if (!actionButton) {
        return
      }

      markGamepadFocus(actionButton, false)
      if (isHoldActionButton(actionButton)) {
        holdingWithGamepad = true
        callbacks.onHoldStart()
        return
      }

      tap()
      return
    }

    const target = markGamepadFocus(activeOrHighlightedElement(screen) ?? defaultScreenTarget(screen))
    if (target) {
      target.click()
      return
    }

    if (screen.id === 'start-screen') {
      callbacks.onStart()
    } else if (screen.id === 'end-screen') {
      callbacks.onPlayAgain()
    }
  }

  if (startBtn) {
    addListener(startBtn, 'click', () => callbacks.onStart())
  }

  if (tapBtn) {
    addListener(tapBtn, 'pointerdown', () => callbacks.onHoldStart())
    addListener(tapBtn, 'pointerup', () => callbacks.onHoldEnd())
    addListener(tapBtn, 'pointerleave', () => callbacks.onHoldEnd())
    addListener(tapBtn, 'pointercancel', () => callbacks.onHoldEnd())
    addListener(tapBtn, 'click', tap)
  }

  if (playAgainBtn) {
    addListener(playAgainBtn, 'click', () => callbacks.onPlayAgain())
  }

  const handleKeydown = (event: Event): void => {
    const e = event as KeyboardEvent
    const target = e.target
    if (target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return

    // Space/Enter on #tap-btn → tap
    if ((e.key === ' ' || e.key === 'Enter') && target instanceof HTMLElement && target.id === 'tap-btn') {
      e.preventDefault()
      tap()
      return
    }

    if ((e.key === ' ' || e.key === 'Enter') && (document.activeElement === document.body || document.activeElement === document.documentElement)) {
      const continueButton = visibleContinueButton()
      if (continueButton) {
        e.preventDefault()
        callbacks.onAdvancePhase()
      }
    }

    // Z key → tap (fast-tapping accessibility)
    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault()
      tap()
    }
  }

  addListener(document, 'keydown', handleKeydown)
  addListener(document, 'pointerdown', clearGamepadMode)
  addListener(document, 'mousemove', clearGamepadMode)
  addListener(document, 'keydown', clearGamepadMode)

  const pollGamepad = (): void => {
    if (document.visibilityState !== 'visible') {
      releaseGamepadHold()
      gamepadFrameId = requestAnimationFrame(pollGamepad)
      return
    }

    const pad = connectedGamepad()
    if (!pad) {
      releaseGamepadHold()
      heldDirection = null
      previousButtonStates = []
      clearGamepadMode()
      gamepadFrameId = requestAnimationFrame(pollGamepad)
      return
    }

    const now = Date.now()
    const direction = gamepadDirection(pad)
    if (direction) {
      enableGamepadMode()
      syncGamepadCue()
      if (direction !== heldDirection || now - lastNavigationAt >= NAVIGATION_DEBOUNCE_MS) {
        handleDirectionalInput(direction)
        lastNavigationAt = now
      }
    }
    heldDirection = direction

    const actionPressed = Boolean(pad.buttons[0]?.pressed)
    const startPressed = Boolean(pad.buttons[9]?.pressed)

    if (actionPressed && !(previousButtonStates[0] ?? false)) {
      handlePrimaryPress()
    }
    if (!actionPressed && (previousButtonStates[0] ?? false)) {
      releaseGamepadHold()
    }

    if (startPressed && !(previousButtonStates[9] ?? false) && !isModalOpen()) {
      enableGamepadMode()
      callbacks.onSettings()
    }

    previousButtonStates = pad.buttons.map((button) => button.pressed)
    syncGamepadCue()
    gamepadFrameId = requestAnimationFrame(pollGamepad)
  }

  const ensureGamepadPolling = (): void => {
    if (gamepadFrameId === null) {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
    }
  }

  if (connectedGamepad()) {
    ensureGamepadPolling()
  }

  addListener(window, 'gamepadconnected', ensureGamepadPolling)
  addListener(window, 'gamepaddisconnected', () => {
    if (connectedGamepad()) {
      return
    }

    releaseGamepadHold()
    if (gamepadFrameId !== null) {
      cancelAnimationFrame(gamepadFrameId)
      gamepadFrameId = null
    }

    heldDirection = null
    previousButtonStates = []
    clearGamepadMode()
  })
}

export function teardownInput(): void {
  for (const { target, type, fn } of listeners) {
    target.removeEventListener(type, fn)
  }
  listeners = []
  if (tapDebounceTimer !== null) {
    window.clearTimeout(tapDebounceTimer)
    tapDebounceTimer = null
  }

  if (gamepadFrameId !== null) {
    cancelAnimationFrame(gamepadFrameId)
    gamepadFrameId = null
  }

  previousButtonStates = []
  heldDirection = null
  holdingWithGamepad = false
  clearGamepadMode()
}