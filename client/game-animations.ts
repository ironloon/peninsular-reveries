import { isReducedMotionEnabled } from './preferences.js'

export function isReducedMotion(): boolean {
  return isReducedMotionEnabled()
}

export function animateClass(element: HTMLElement | null, className: string, durationMs: number = 300): Promise<void> {
  if (!element) return Promise.resolve()

  if (isReducedMotion()) {
    element.classList.add(className)
    element.classList.remove(className)
    return Promise.resolve()
  }

  // Force reflow so the class addition triggers a fresh animation/transition
  void element.offsetWidth
  element.classList.add(className)

  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      element.classList.remove(className)
      resolve()
    }, durationMs)
  })
}
