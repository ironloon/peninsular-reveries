import { isRecoveryActionReady } from './state.js'
import { getPhaseDefinition, type GameState } from './types.js'

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

type PressTarget = HTMLElement | SVGElement

function isModalOpen(): boolean {
  const modal = document.getElementById('settings-modal')
  return modal ? !modal.hasAttribute('hidden') : false
}

function canUseMissionAction(state: GameState): boolean {
  if (state.phase === 'title' || state.phase === 'celebration' || state.phase === 'countdown' || state.phaseResolved) {
    return false
  }

  if (state.briefingActive) {
    return true
  }

  if (state.phase === 'splashdown') {
    return isRecoveryActionReady(state)
  }

  const definition = getPhaseDefinition(state.phase)
  return definition.mode === 'hold' || definition.mode === 'narrative'
}

function bindPressTarget(target: PressTarget | null, isDisabled: () => boolean, callbacks: Pick<InputCallbacks, 'onActionStart' | 'onActionEnd'>): void {
  if (!target) return

  let activePointerId: number | null = null

  const endPress = (event: Event): void => {
    const pointerEvent = event as PointerEvent
    if (activePointerId === null || pointerEvent.pointerId !== activePointerId) return
    pointerEvent.preventDefault()
    if ('releasePointerCapture' in target) {
      target.releasePointerCapture(pointerEvent.pointerId)
    }
    activePointerId = null
    callbacks.onActionEnd()
  }

  target.addEventListener('pointerdown', (event) => {
    const pointerEvent = event as PointerEvent
    if (isDisabled()) return
    pointerEvent.preventDefault()
    activePointerId = pointerEvent.pointerId
    if ('setPointerCapture' in target) {
      target.setPointerCapture(pointerEvent.pointerId)
    }
    callbacks.onActionStart()
  })

  target.addEventListener('pointerup', endPress)
  target.addEventListener('pointercancel', endPress)
}

export function setupInput(getState: () => GameState, callbacks: InputCallbacks): void {
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement | null
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement | null
  const actionBtn = document.getElementById('mission-action-btn') as HTMLButtonElement | null
  const rocketHitArea = document.getElementById('mission-rocket-hit-area') as SVGElement | null

  startBtn?.addEventListener('click', () => callbacks.onStartGame())
  replayBtn?.addEventListener('click', () => callbacks.onReplay())

  bindPressTarget(actionBtn, () => Boolean(actionBtn?.disabled), callbacks)
  bindPressTarget(rocketHitArea, () => {
    const state = getState()
    return isModalOpen() || state.phase === 'splashdown' || !canUseMissionAction(state)
  }, callbacks)

  let keyboardActionActive = false
  document.addEventListener('keydown', (event) => {
    if (isModalOpen()) return

    const state = getState()
    if (event.key !== ' ' && event.key !== 'Enter') return
    if (event.repeat || keyboardActionActive) return

    const target = event.target
    if (target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
      return
    }

    event.preventDefault()

    if (state.phase === 'title') {
      callbacks.onStartGame()
      return
    }

    if (state.phase === 'celebration') {
      callbacks.onReplay()
      return
    }

    if (!canUseMissionAction(state)) {
      return
    }

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
      } else if (!isModalOpen() && canUseMissionAction(state)) {
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