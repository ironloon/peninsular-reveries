import { isReducedMotion } from '../../client/game-animations.js'

const HOTSPOT_FEEDBACK_MS = 180
const HOTSPOT_FEEDBACK_REDUCED_MS = 140
const SWITCH_FEEDBACK_MS = 620
const SWITCH_FEEDBACK_REDUCED_MS = 140
const SWITCH_SETTLE_MS = 220
const SWITCH_SETTLE_REDUCED_MS = 180
const SWITCH_BUTTON_FEEDBACK_MS = 180

const elementTimers = new WeakMap<HTMLElement, Map<string, number>>()

let switchTimer: number | null = null
let settleTimer: number | null = null
let switchSequence = 0

function getClassTimers(element: HTMLElement): Map<string, number> {
  let timers = elementTimers.get(element)
  if (!timers) {
    timers = new Map<string, number>()
    elementTimers.set(element, timers)
  }
  return timers
}

function clearTransientClass(element: HTMLElement | null, className: string): void {
  if (!element) return

  const timers = elementTimers.get(element)
  const existingTimer = timers?.get(className)

  if (existingTimer !== undefined) {
    window.clearTimeout(existingTimer)
    timers?.delete(className)
  }

  if (timers && timers.size === 0) {
    elementTimers.delete(element)
  }

  element.classList.remove(className)
}

function restartTransientClass(
  element: HTMLElement | null,
  className: string,
  durationMs: number,
): void {
  if (!element) return

  const timers = getClassTimers(element)
  const existingTimer = timers.get(className)

  if (existingTimer !== undefined) {
    window.clearTimeout(existingTimer)
  }

  element.classList.remove(className)
  void element.offsetWidth
  element.classList.add(className)

  const timer = window.setTimeout(() => {
    element.classList.remove(className)
    const currentTimers = elementTimers.get(element)
    currentTimers?.delete(className)

    if (currentTimers && currentTimers.size === 0) {
      elementTimers.delete(element)
    }
  }, durationMs)

  timers.set(className, timer)
}

function hotspotFeedbackDuration(): number {
  return isReducedMotion() ? HOTSPOT_FEEDBACK_REDUCED_MS : HOTSPOT_FEEDBACK_MS
}

function switchFeedbackDuration(): number {
  return isReducedMotion() ? SWITCH_FEEDBACK_REDUCED_MS : SWITCH_FEEDBACK_MS
}

function switchSettleDuration(): number {
  return isReducedMotion() ? SWITCH_SETTLE_REDUCED_MS : SWITCH_SETTLE_MS
}

export function resetTrainAnimationState(
  scene: HTMLElement | null,
  trainName: HTMLElement | null,
): void {
  if (switchTimer !== null) {
    window.clearTimeout(switchTimer)
    switchTimer = null
  }

  if (settleTimer !== null) {
    window.clearTimeout(settleTimer)
    settleTimer = null
  }

  if (scene) {
    clearTransientClass(scene, 'is-pressed')
    clearTransientClass(scene, 'is-switching')
    clearTransientClass(scene, 'is-switched')
    scene.dataset.sceneState = 'idle'
  }

  clearTransientClass(trainName, 'is-switching')
}

export function animateTrainSwitch(
  scene: HTMLElement | null,
  trainName: HTMLElement | null,
  triggerButton: HTMLElement | null = null,
): void {
  if (!scene) return

  switchSequence += 1
  const sequence = switchSequence

  if (switchTimer !== null) {
    window.clearTimeout(switchTimer)
    switchTimer = null
  }

  if (settleTimer !== null) {
    window.clearTimeout(settleTimer)
    settleTimer = null
  }

  clearTransientClass(scene, 'is-pressed')
  clearTransientClass(scene, 'is-switched')
  restartTransientClass(triggerButton, 'is-active', SWITCH_BUTTON_FEEDBACK_MS)

  scene.classList.remove('is-switching')
  void scene.offsetWidth
  scene.classList.add('is-switching')
  trainName?.classList.remove('is-switching')
  trainName?.classList.add('is-switching')
  scene.dataset.sceneState = 'switching'

  switchTimer = window.setTimeout(() => {
    if (sequence !== switchSequence) {
      return
    }

    scene.classList.remove('is-switching')
    trainName?.classList.remove('is-switching')
    scene.classList.add('is-switched')
    scene.dataset.sceneState = 'switched'
    switchTimer = null

    settleTimer = window.setTimeout(() => {
      if (sequence !== switchSequence) {
        return
      }

      scene.classList.remove('is-switched')
      scene.dataset.sceneState = 'idle'
      settleTimer = null
    }, switchSettleDuration())
  }, switchFeedbackDuration())
}

export function animateHotspotPress(
  scene: HTMLElement | null,
  hotspotButton: HTMLElement | null,
): void {
  const durationMs = hotspotFeedbackDuration()

  restartTransientClass(scene, 'is-pressed', durationMs)
  restartTransientClass(hotspotButton, 'is-pressed', durationMs)
}