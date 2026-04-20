import {
  createGamepadPoller,
  focusableElements,
  isModalOpen,
  type GamepadPoller,
} from '../../client/game-input.js'
import {
  findNearestDirectionalTarget,
  type NavigationDirection,
} from '../../client/spatial-navigation.js'

export interface TrainSoundsInputCallbacks {
  onStart?: () => void
  onPreviousTrain?: () => void
  onNextTrain?: () => void
  onToggleMenu?: () => void
}

interface PositionedTarget {
  readonly element: HTMLElement
  readonly x: number
  readonly y: number
}

let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let clearGamepadModeHandler: ((event: Event) => void) | null = null
let gamepadPoller: GamepadPoller | null = null
let currentGamepadFocus: HTMLElement | null = null

function isVisible(element: HTMLElement | null): element is HTMLElement {
  if (!element) return false
  return !element.closest('[hidden]') && element.getClientRects().length > 0
}

function isTextEntryTarget(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  const tagName = element.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || element.isContentEditable
}

function isArrowKey(key: string): key is NavigationDirection {
  return key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight'
}

function isMenuButton(element: Element | null): boolean {
  return element instanceof HTMLElement && element.matches('[data-settings-open="true"]')
}

function isHotspot(element: Element | null): boolean {
  return element instanceof HTMLElement && element.matches('.train-hotspot')
}

function isTrainSwitchButton(element: Element | null): boolean {
  return element instanceof HTMLElement && (element.id === 'train-prev-btn' || element.id === 'train-next-btn')
}

function clearGamepadFocus(): void {
  if (currentGamepadFocus) {
    currentGamepadFocus.classList.remove('gamepad-focus')
    currentGamepadFocus = null
  }
}

function clearGamepadMode(): void {
  document.body.classList.remove('gamepad-active')
  clearGamepadFocus()
}

function focusTarget(target: HTMLElement | null, useGamepadMode: boolean): void {
  if (!target) return

  if (useGamepadMode) {
    document.body.classList.add('gamepad-active')

    if (currentGamepadFocus !== target) {
      clearGamepadFocus()
      currentGamepadFocus = target
      currentGamepadFocus.classList.add('gamepad-focus')
    }
  }

  target.focus({ preventScroll: true })
  target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function getActiveScreen(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.screen.active:not([hidden])')
}

function getCurrentScreenControls(): HTMLElement[] {
  const screen = getActiveScreen()
  return focusableElements(screen)
}

function getModalControls(): HTMLElement[] {
  return focusableElements(document.getElementById('settings-modal'))
}

function getCurrentContextControls(): HTMLElement[] {
  return isModalOpen() ? getModalControls() : getCurrentScreenControls()
}

function getVisibleMenuButton(): HTMLElement | null {
  return getCurrentScreenControls().find((control) => isMenuButton(control)) ?? null
}

function getTrainSwitchButton(buttonId: 'train-prev-btn' | 'train-next-btn'): HTMLButtonElement | null {
  const button = document.getElementById(buttonId)
  return button instanceof HTMLButtonElement && isVisible(button) ? button : null
}

function getVisibleHotspots(): HTMLElement[] {
  return getCurrentScreenControls().filter((control) => isHotspot(control))
}

function getDefaultScreenTarget(direction: NavigationDirection = 'ArrowDown'): HTMLElement | null {
  const screen = getActiveScreen()
  if (!screen) return null

  if (screen.id === 'start-screen') {
    const startButton = document.getElementById('start-btn')
    return isVisible(startButton) ? startButton : getCurrentScreenControls()[0] ?? null
  }

  if (screen.id === 'game-screen') {
    const menuButton = getVisibleMenuButton()
    const prevButton = getTrainSwitchButton('train-prev-btn')
    const nextButton = getTrainSwitchButton('train-next-btn')
    const hotspots = getVisibleHotspots()
    const lastHotspot = hotspots.length > 0 ? hotspots[hotspots.length - 1] : null

    switch (direction) {
      case 'ArrowUp':
        return menuButton ?? prevButton ?? hotspots[0] ?? nextButton ?? null
      case 'ArrowLeft':
        return prevButton ?? hotspots[0] ?? menuButton ?? nextButton ?? null
      case 'ArrowRight':
        return nextButton ?? lastHotspot ?? menuButton ?? prevButton ?? null
      case 'ArrowDown':
      default:
        return hotspots[0] ?? prevButton ?? nextButton ?? menuButton ?? null
    }
  }

  return getCurrentScreenControls()[0] ?? null
}

function getDefaultContextTarget(direction: NavigationDirection): HTMLElement | null {
  if (isModalOpen()) {
    return getModalControls()[0] ?? null
  }

  return getDefaultScreenTarget(direction)
}

function getCurrentControl(targets: readonly HTMLElement[]): HTMLElement | null {
  const active = document.activeElement
  if (active instanceof HTMLElement && targets.includes(active)) {
    return active
  }

  if (currentGamepadFocus && targets.includes(currentGamepadFocus)) {
    return currentGamepadFocus
  }

  return null
}

function moveFocus(direction: NavigationDirection, useGamepadMode: boolean): void {
  const targets = getCurrentContextControls()
  if (targets.length === 0) return

  const current = getCurrentControl(targets)
  if (!current) {
    focusTarget(getDefaultContextTarget(direction), useGamepadMode)
    return
  }

  const currentRect = current.getBoundingClientRect()
  const next = findNearestDirectionalTarget<PositionedTarget>(
    {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2,
    },
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

  if (!next) return
  focusTarget(next.element, useGamepadMode)
}

function toggleMenu(callbacks: TrainSoundsInputCallbacks): void {
  if (typeof window.__settingsToggle === 'function') {
    window.__settingsToggle()
    return
  }

  if (isModalOpen()) {
    const closeButton = document.getElementById('settings-close-btn')
    if (isVisible(closeButton)) {
      closeButton.click()
      return
    }
  }

  const menuButton = getVisibleMenuButton()
  if (menuButton) {
    menuButton.click()
    return
  }

  callbacks.onToggleMenu?.()
}

function switchTrain(direction: 'previous' | 'next', callbacks: TrainSoundsInputCallbacks): void {
  const button = direction === 'previous'
    ? getTrainSwitchButton('train-prev-btn')
    : getTrainSwitchButton('train-next-btn')

  if (button) {
    button.focus({ preventScroll: true })
    button.click()
    return
  }

  if (direction === 'previous') {
    callbacks.onPreviousTrain?.()
    return
  }

  callbacks.onNextTrain?.()
}

function activateCurrentControl(callbacks: TrainSoundsInputCallbacks): void {
  const targets = getCurrentContextControls()
  const current = getCurrentControl(targets)

  if (isModalOpen()) {
    if (!current) {
      focusTarget(targets[0] ?? null, true)
      return
    }

    current.click()
    return
  }

  const screen = getActiveScreen()
  if (!screen) return

  if (screen.id === 'start-screen' && !current) {
    const startButton = document.getElementById('start-btn')
    if (isVisible(startButton)) {
      startButton.click()
      return
    }

    callbacks.onStart?.()
    return
  }

  if (!current) {
    focusTarget(getDefaultScreenTarget('ArrowDown'), true)
    return
  }

  current.click()
}

export function setupTrainSoundsInput(callbacks: TrainSoundsInputCallbacks = {}): void {
  cleanupTrainSoundsInput()

  clearGamepadModeHandler = (): void => {
    clearGamepadMode()
  }

  document.addEventListener('mousemove', clearGamepadModeHandler)
  document.addEventListener('pointerdown', clearGamepadModeHandler)
  document.addEventListener('touchstart', clearGamepadModeHandler, { passive: true })
  document.addEventListener('keydown', clearGamepadModeHandler)

  keydownHandler = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return
    if (event.ctrlKey || event.altKey || event.metaKey) return

    if (event.key === 'Escape') {
      event.preventDefault()
      toggleMenu(callbacks)
      return
    }

    if (event.repeat) return
    if (isModalOpen()) return
    if (isTextEntryTarget(event.target as Element | null)) return
    if (!isArrowKey(event.key)) return

    const screen = getActiveScreen()
    if (!screen) return

    if (screen.id === 'game-screen' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const current = getCurrentControl(getCurrentScreenControls())
      const shouldSwitchTrain = !current || isTrainSwitchButton(current) || (!isHotspot(current) && !isMenuButton(current))

      if (shouldSwitchTrain) {
        event.preventDefault()
        switchTrain(event.key === 'ArrowLeft' ? 'previous' : 'next', callbacks)
        return
      }
    }

    event.preventDefault()
    moveFocus(event.key, false)
  }

  document.addEventListener('keydown', keydownHandler)

  gamepadPoller = createGamepadPoller({
    onDpad(direction): void {
      const key = direction === 'up'
        ? 'ArrowUp'
        : direction === 'down'
          ? 'ArrowDown'
          : direction === 'left'
            ? 'ArrowLeft'
            : 'ArrowRight'
      moveFocus(key, true)
    },
    onButtonA(): void {
      activateCurrentControl(callbacks)
    },
    onButtonStart(): void {
      toggleMenu(callbacks)
    },
    onDisconnect(): void {
      clearGamepadMode()
    },
  })

  gamepadPoller.start()
}

export function cleanupTrainSoundsInput(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }

  if (clearGamepadModeHandler) {
    document.removeEventListener('mousemove', clearGamepadModeHandler)
    document.removeEventListener('pointerdown', clearGamepadModeHandler)
    document.removeEventListener('touchstart', clearGamepadModeHandler)
    document.removeEventListener('keydown', clearGamepadModeHandler)
    clearGamepadModeHandler = null
  }

  if (gamepadPoller) {
    gamepadPoller.stop()
    gamepadPoller = null
  }

  clearGamepadMode()
}