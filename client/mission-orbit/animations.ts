export function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function pulseElement(element: HTMLElement, className: string, durationMs: number = 420): Promise<void> {
  if (isReducedMotion()) {
    element.classList.remove(className)
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