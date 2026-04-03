import type { GameState } from './types.js'

declare global {
  interface Window {
    __missionOrbitSettingsToggle?: () => void
  }
}

export interface InputCallbacks {
  onStartGame: () => void
  onActionStart: () => void
  onActionEnd: () => void
  onReplay: () => void
}

function isModalOpen(): boolean {
  const modal = document.getElementById('settings-modal')
  return modal ? !modal.hasAttribute('hidden') : false
}

export function setupInput(getState: () => GameState, callbacks: InputCallbacks): void {
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement | null
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement | null
  const actionBtn = document.getElementById('mission-action-btn') as HTMLButtonElement | null

  startBtn?.addEventListener('click', () => callbacks.onStartGame())
  replayBtn?.addEventListener('click', () => callbacks.onReplay())

  if (actionBtn) {
    actionBtn.addEventListener('pointerdown', (event) => {
      if (actionBtn.disabled) return
      event.preventDefault()
      actionBtn.setPointerCapture(event.pointerId)
      callbacks.onActionStart()
    })

    actionBtn.addEventListener('pointerup', (event) => {
      if (actionBtn.disabled) return
      event.preventDefault()
      callbacks.onActionEnd()
    })

    actionBtn.addEventListener('pointercancel', () => {
      if (actionBtn.disabled) return
      callbacks.onActionEnd()
    })
  }

  let keyboardActionActive = false
  document.addEventListener('keydown', (event) => {
    if (isModalOpen()) return

    const state = getState()
    if (state.phase === 'title' || state.phase === 'celebration') return
    if (event.key !== ' ' && event.key !== 'Enter') return
    if (event.repeat || keyboardActionActive) return

    const target = event.target
    if (target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
      return
    }

    event.preventDefault()
    keyboardActionActive = true
    callbacks.onActionStart()
  })

  document.addEventListener('keyup', (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    if (!keyboardActionActive) return

    keyboardActionActive = false
    callbacks.onActionEnd()
  })

  let previousActionPressed = false
  let previousStartPressed = false

  const pollGamepad = (): void => {
    const pad = navigator.getGamepads().find((gamepad) => gamepad !== null)
    const state = getState()
    const actionPressed = Boolean(pad?.buttons[0]?.pressed)
    const startPressed = Boolean(pad?.buttons[9]?.pressed)

    if (actionPressed && !previousActionPressed) {
      if (state.phase === 'title') {
        callbacks.onStartGame()
      } else if (state.phase === 'celebration') {
        callbacks.onReplay()
      } else if (!isModalOpen()) {
        callbacks.onActionStart()
      }
    }

    if (!actionPressed && previousActionPressed && state.phase !== 'title' && state.phase !== 'celebration') {
      callbacks.onActionEnd()
    }

    if (startPressed && !previousStartPressed) {
      window.__missionOrbitSettingsToggle?.()
    }

    previousActionPressed = actionPressed
    previousStartPressed = startPressed

    requestAnimationFrame(pollGamepad)
  }

  requestAnimationFrame(pollGamepad)
}