export function isReducedMotion(): boolean {
  const override = document.documentElement.dataset.reduceMotion
  if (override === 'reduce') return true
  if (override === 'no-preference') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function animateHippoChomp(
  hippoEl: HTMLElement,
  targetEl: HTMLElement | null,
  isCorrect: boolean,
): Promise<void> {
  if (isReducedMotion()) {
    // Reduced motion: jaw-only animation, no neck extension
    return new Promise<void>((resolve) => {
      hippoEl.style.setProperty('--jaw-angle', '1')
      window.setTimeout(() => {
        hippoEl.style.setProperty('--jaw-angle', '0')
        const outcomeClass = isCorrect ? 'hippo-chomp-correct' : 'hippo-chomp-wrong'
        hippoEl.classList.add(outcomeClass)
        window.setTimeout(() => {
          hippoEl.classList.remove(outcomeClass)
          resolve()
        }, 320)
      }, 280)
    })
  }

  return new Promise<void>((resolve) => {
    // Calculate angle toward target item
    let angle = 0
    let neckExt = 0.8 // default extension

    if (targetEl) {
      const hippoRect = hippoEl.getBoundingClientRect()
      const targetRect = targetEl.getBoundingClientRect()
      const hippoX = hippoRect.right
      const hippoY = hippoRect.top + hippoRect.height * 0.5
      const targetX = targetRect.left + targetRect.width / 2
      const targetY = targetRect.top + targetRect.height / 2
      const dx = targetX - hippoX
      const dy = targetY - hippoY
      angle = Math.atan2(dy, Math.max(dx, 1)) * (180 / Math.PI)

      // Scale neck extension to distance, normalized by arena width
      const arenaEl = document.getElementById('game-arena')
      if (arenaEl) {
        const arenaRect = arenaEl.getBoundingClientRect()
        const reach = (targetX - hippoX) / (arenaRect.right - hippoX)
        neckExt = Math.min(Math.max(reach * 1.5, 0.2), 1.8)
      }
    }

    hippoEl.style.setProperty('--neck-angle', `${angle}deg`)

    // Phase 1: extend neck and open jaw over 300ms
    hippoEl.style.setProperty('--neck-extension', String(neckExt))
    hippoEl.style.setProperty('--jaw-angle', '1')

    // Phase 2: close jaw at 400ms
    window.setTimeout(() => {
      hippoEl.style.setProperty('--jaw-angle', '0')
    }, 400)

    // Phase 3: retract neck at 600ms
    window.setTimeout(() => {
      hippoEl.style.setProperty('--neck-extension', '0')

      const outcomeClass = isCorrect ? 'hippo-chomp-correct' : 'hippo-chomp-wrong'
      hippoEl.classList.add(outcomeClass)

      // Phase 4: remove outcome class and resolve at ~1200ms total
      window.setTimeout(() => {
        hippoEl.classList.remove(outcomeClass)
        hippoEl.style.setProperty('--neck-angle', '0deg')
        resolve()
      }, 600)
    }, 600)
  })
}

export function animateCorrectFeedback(itemEl: HTMLElement): Promise<void> {
  if (isReducedMotion()) return Promise.resolve()

  return new Promise<void>((resolve) => {
    itemEl.classList.add('item-correct')

    const sparkle = document.createElement('span')
    sparkle.textContent = '✨'
    sparkle.setAttribute('aria-hidden', 'true')
    sparkle.className = 'item-sparkle'
    itemEl.appendChild(sparkle)

    window.setTimeout(() => {
      itemEl.classList.remove('item-correct')
      sparkle.remove()
      resolve()
    }, 500)
  })
}

export function animateWrongFeedback(itemEl: HTMLElement): Promise<void> {
  if (isReducedMotion()) return Promise.resolve()

  return new Promise<void>((resolve) => {
    itemEl.classList.add('item-wrong')

    window.setTimeout(() => {
      itemEl.classList.remove('item-wrong')
      resolve()
    }, 400)
  })
}

export function animateNextRound(): Promise<void> {
  const container = document.getElementById('scene-items')
  if (!container || isReducedMotion()) return Promise.resolve()

  return new Promise<void>((resolve) => {
    container.classList.add('round-exit')

    window.setTimeout(() => {
      container.classList.remove('round-exit')
      resolve()
    }, 300)
  })
}

export function spawnPointsPopup(
  x: number,
  y: number,
  text: string,
  tone: 'positive' | 'negative',
): void {
  const layer = document.getElementById('effect-layer')
  if (!layer) return

  const popup = document.createElement('div')
  popup.className = `points-popup tone-${tone}`
  popup.textContent = text
  popup.style.left = `${x}%`
  popup.style.top = `${y}%`
  popup.setAttribute('aria-hidden', 'true')
  layer.appendChild(popup)

  let removed = false
  const cleanup = () => {
    if (removed) return
    removed = true
    popup.remove()
  }

  popup.addEventListener('animationend', cleanup, { once: true })
  window.setTimeout(cleanup, 1000)
}

// Legacy helper kept for compatibility — not used by new animations
const pulseTimeouts = new WeakMap<HTMLElement, number>()
const pulseFrames = new WeakMap<HTMLElement, number>()

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
