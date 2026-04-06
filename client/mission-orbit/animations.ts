import { isReducedMotionEnabled } from '../preferences.js'

export function isReducedMotion(): boolean {
  return isReducedMotionEnabled()
}

export function triggerFadeIn(el: HTMLElement): void {
  if (isReducedMotion()) return
  el.classList.remove('fade-in', 'fade-out')
  void el.offsetWidth
  el.classList.add('fade-in')
}

export function triggerFadeOut(el: HTMLElement, onDone?: () => void): void {
  if (isReducedMotion()) {
    onDone?.()
    return
  }
  el.classList.remove('fade-in', 'fade-out')
  void el.offsetWidth
  el.classList.add('fade-out')
  if (onDone) {
    el.addEventListener('animationend', () => onDone(), { once: true })
  }
}

export function triggerTapPulse(el: HTMLElement): void {
  if (isReducedMotion()) return
  el.classList.remove('tap-pulse')
  void el.offsetWidth
  el.classList.add('tap-pulse')
  el.addEventListener('animationend', () => el.classList.remove('tap-pulse'), { once: true })
}

export function triggerHoldGlow(el: HTMLElement, active: boolean): void {
  el.classList.toggle('hold-glow', active)
}

export function triggerCompletionFlash(el: HTMLElement): void {
  if (isReducedMotion()) return
  el.classList.remove('completion-flash')
  void el.offsetWidth
  el.classList.add('completion-flash')
  el.addEventListener('animationend', () => el.classList.remove('completion-flash'), { once: true })
}