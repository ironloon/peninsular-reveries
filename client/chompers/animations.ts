import { isReducedMotionEnabled } from '../preferences.js'

export function isReducedMotion(): boolean {
  return isReducedMotionEnabled()
}

export function pulseElement(element: HTMLElement, className: string, durationMs: number = 320): void {
  element.classList.remove(className)
  void element.offsetHeight
  element.classList.add(className)

  window.setTimeout(() => {
    element.classList.remove(className)
  }, durationMs)
}

export function spawnPointsPopup(
  x: number,
  y: number,
  text: string,
  tone: 'positive' | 'bonus' | 'danger' | 'warning' = 'positive',
): void {
  const layer = document.getElementById('effect-layer')
  if (!layer) return

  const popup = document.createElement('div')
  popup.className = `points-popup tone-${tone}`
  popup.textContent = text
  popup.style.left = `${x}%`
  popup.style.top = `${y}%`
  popup.setAttribute('aria-hidden', 'true')

  if (isReducedMotion()) {
    popup.style.opacity = '0.9'
  }

  layer.appendChild(popup)

  let removed = false
  const cleanup = () => {
    if (removed) return
    removed = true
    popup.remove()
  }

  popup.addEventListener('animationend', cleanup, { once: true })
  window.setTimeout(cleanup, isReducedMotion() ? 260 : 820)
}