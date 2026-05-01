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

export interface CopycatInputOptions {
  onMenu(): void
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

function getDefaultScreenTarget(_direction: NavigationDirection = 'ArrowDown'): HTMLElement | null {
  const screen = getActiveScreen()
  if (!screen) return null

  if (screen.id === 'start-screen') {
    const startButton = document.getElementById('start-btn')
    return isVisible(startButton) ? startButton : getCurrentScreenControls()[0] ?? null
  }

  if (screen.id === 'game-screen') {
    const menuButton = getCurrentScreenControls().find((el) => el.matches('[data-settings-open="true"]')) ?? null
    return menuButton ?? getCurrentScreenControls()[0] ?? null
  }

  if (screen.id === 'end-screen') {
    const replayButton = document.getElementById('replay-btn')
    return isVisible(replayButton) ? replayButton : getCurrentScreenControls()[0] ?? null
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

function activateCurrentControl(): void {
  const targets = getCurrentContextControls()
  const current = getCurrentControl(targets)

  if (!current) {
    const defaultTarget = getDefaultContextTarget('ArrowDown')
    if (defaultTarget) {
      focusTarget(defaultTarget, true)
      defaultTarget.click()
    }
    return
  }

  current.click()
}

export function setupCopycatInput(opts: CopycatInputOptions): void {
  cleanupCopycatInput()

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
      opts.onMenu()
      return
    }

    if (event.repeat) return

    if (event.key === 'Enter' || event.key === ' ') {
      if (isTextEntryTarget(event.target as Element | null)) return

      const targets = getCurrentContextControls()
      const active = document.activeElement
      if (active instanceof HTMLElement && targets.includes(active)) {
        event.preventDefault()
        active.click()
      }
      return
    }

    // Tab / Shift+Tab navigates focus naturally; do not intercept.
  }

  document.addEventListener('keydown', keydownHandler)

  gamepadPoller = createGamepadPoller({
    onDpad(direction): void {
      const key =
        direction === 'up'
          ? 'ArrowUp'
          : direction === 'down'
            ? 'ArrowDown'
            : direction === 'left'
              ? 'ArrowLeft'
              : 'ArrowRight'
      moveFocus(key, true)
    },
    onButtonA(): void {
      activateCurrentControl()
    },
    onButtonStart(): void {
      opts.onMenu()
    },
    onDisconnect(): void {
      clearGamepadMode()
    },
  })

  gamepadPoller.start()
}

export function cleanupCopycatInput(): void {
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
