import { isReducedMotionEnabled } from '../preferences.js'

const pulseTimeouts = new WeakMap<HTMLElement, number>()
const pulseFrames = new WeakMap<HTMLElement, number>()

export function isReducedMotion(): boolean {
  return isReducedMotionEnabled()
}

export function pulseElement(element: HTMLElement, className: string, durationMs: number = 320): void {
  const pendingFrame = pulseFrames.get(element)
  if (pendingFrame !== undefined) {
    window.cancelAnimationFrame(pendingFrame)
  }

  const pendingTimeout = pulseTimeouts.get(element)
  if (pendingTimeout !== undefined) {
    window.clearTimeout(pendingTimeout)
  }

  element.classList.remove(className)

  const frame = window.requestAnimationFrame(() => {
    element.classList.add(className)

    const timeout = window.setTimeout(() => {
      element.classList.remove(className)
      pulseTimeouts.delete(element)
    }, durationMs)

    pulseTimeouts.set(element, timeout)
    pulseFrames.delete(element)
  })

  pulseFrames.set(element, frame)
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