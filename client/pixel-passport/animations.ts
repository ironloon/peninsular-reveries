import { isReducedMotionEnabled } from '../preferences.js'

export function isReducedMotion(): boolean {
  return isReducedMotionEnabled()
}

export function pulseElement(element: HTMLElement | null, className: string, durationMs: number = 420): Promise<void> {
  if (!element || isReducedMotion()) {
    return Promise.resolve()
  }

  element.classList.remove(className)
  void element.offsetWidth
  element.classList.add(className)

  return new Promise((resolve) => {
    window.setTimeout(() => {
      element.classList.remove(className)
      resolve()
    }, durationMs)
  })
}

export function animateClass(element: HTMLElement | null, className: string, durationMs: number = 520): Promise<void> {
  if (!element || isReducedMotion()) {
    return Promise.resolve()
  }

  element.classList.remove(className)
  void element.offsetWidth
  element.classList.add(className)

  return new Promise((resolve) => {
    window.setTimeout(() => {
      element.classList.remove(className)
      resolve()
    }, durationMs)
  })
}