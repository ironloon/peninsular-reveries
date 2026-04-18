import { isReducedMotion } from '../../client/game-animations.js'

const PAD_HIT_DURATION_MS = 120

export function animatePadHit(element: HTMLElement | null): Promise<void> {
  if (!element) return Promise.resolve()
  if (isReducedMotion()) {
    element.classList.add('hit')
    element.classList.remove('hit')
    return Promise.resolve()
  }
  void element.offsetWidth
  element.classList.add('hit')
  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      element.classList.remove('hit')
      resolve()
    }, PAD_HIT_DURATION_MS)
  })
}

export function animateRecordPulse(element: HTMLElement | null, active: boolean): void {
  if (!element) return
  element.classList.toggle('recording', active)
}

export function animateProgressSweep(element: HTMLElement | null, progress: number): void {
  if (!element) return
  const clamped = Math.max(0, Math.min(1, progress))
  element.style.width = `${clamped * 100}%`
}
