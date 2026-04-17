import { isReducedMotion } from '../../client/game-animations.js'

export { isReducedMotion }

// ── Inject animation CSS once ─────────────────────────────────
const animCSS = `
@keyframes item-flash-anim { 0%{transform:scale(1)} 50%{transform:scale(1.1)} 100%{transform:scale(1)} }
.item-flash-active { animation: item-flash-anim 0.3s ease; }
@keyframes trail-pulse { 0%{box-shadow:0 0 0 0 rgba(107,142,78,0.7)} 70%{box-shadow:0 0 0 10px rgba(107,142,78,0)} 100%{box-shadow:0 0 0 0 rgba(107,142,78,0)} }
.trail-stop-pulse { animation: trail-pulse 0.6s ease; }
.trail-stop-new { border-color: #6b8e4e !important; outline: 2px solid #d4a853; }
`
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = animCSS
  document.head.appendChild(style)
}

// ── Typewriter cancel token ───────────────────────────────────
let cancelTypewriter: (() => void) | null = null

// ── Animations ────────────────────────────────────────────────

export function typeText(
  element: HTMLElement,
  text: string,
  onChar?: () => void,
  speedMs: number = 80,
): Promise<void> {
  cancelTypewriter?.()
  cancelTypewriter = null

  if (isReducedMotion()) {
    element.textContent = text
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    element.textContent = ''
    let index = 0
    const timeouts: ReturnType<typeof setTimeout>[] = []
    let cancelled = false

    cancelTypewriter = () => {
      cancelled = true
      for (const t of timeouts) clearTimeout(t)
      timeouts.length = 0
    }

    function revealNext(): void {
      if (cancelled) return
      if (index >= text.length) {
        cancelTypewriter = null
        resolve()
        return
      }
      element.textContent = text.slice(0, index + 1)
      onChar?.()
      index++
      const t = setTimeout(revealNext, speedMs)
      timeouts.push(t)
    }

    const t = setTimeout(revealNext, 0)
    timeouts.push(t)
  })
}

export function animateScreenTransition(fromScreenId: string, toScreenId: string): Promise<void> {
  if (isReducedMotion()) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const fromScreen = document.getElementById(fromScreenId)
    const toScreen = document.getElementById(toScreenId)
    if (fromScreen) fromScreen.classList.add('transitioning-out')
    setTimeout(() => {
      if (toScreen) toScreen.classList.add('transitioning-in')
    }, 150)
    setTimeout(() => {
      if (fromScreen) fromScreen.classList.remove('transitioning-out')
      if (toScreen) toScreen.classList.remove('transitioning-in')
      resolve()
    }, 300)
  })
}

export function animateItemFlash(element: HTMLElement): Promise<void> {
  if (isReducedMotion()) return Promise.resolve()

  return new Promise<void>((resolve) => {
    element.classList.add('item-flash-active')
    setTimeout(() => {
      element.classList.remove('item-flash-active')
      resolve()
    }, 300)
  })
}

export function animateTrailAdvance(stopElement: HTMLElement): Promise<void> {
  if (isReducedMotion()) {
    stopElement.classList.add('trail-stop-new')
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    stopElement.classList.add('trail-stop-new', 'trail-stop-pulse')
    setTimeout(() => {
      resolve()
    }, 600)
  })
}
