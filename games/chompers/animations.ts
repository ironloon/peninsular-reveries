import { isReducedMotionEnabled } from '../../client/preferences.js'

export function isReducedMotion(): boolean {
  return isReducedMotionEnabled()
}

export function animateHippoChomp(
  hippoEl: HTMLElement,
  targetEl: HTMLElement | null,
  isCorrect: boolean,
): Promise<void> {
  const arenaEl = document.getElementById('game-arena')
  let targetXPct = 50
  let neckH = 20

  if (arenaEl && targetEl) {
    const arenaRect = arenaEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    targetXPct = ((targetCenterX - arenaRect.left) / arenaRect.width) * 100

    const bodyEl = hippoEl.querySelector<HTMLElement>('.hippo-body')
    const headEl = hippoEl.querySelector<HTMLElement>('.hippo-head')
    const bodyH = bodyEl?.offsetHeight ?? 40
    const headH = headEl?.offsetHeight ?? 48
    const maxNeck = Math.max(20, arenaRect.height * 0.55 - bodyH - headH)
    neckH = Math.min(Math.max(20, arenaRect.bottom - targetCenterY - bodyH - headH / 2), maxNeck)
  }

  if (isReducedMotion()) {
    // Reduced motion: position + extend instantly, no transitions
    hippoEl.style.left = `${targetXPct}%`
    hippoEl.style.setProperty('--neck-height', `${neckH}px`)
    hippoEl.style.setProperty('--jaw-angle', '1')

    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        hippoEl.style.setProperty('--jaw-angle', '0')
        hippoEl.style.setProperty('--neck-height', '20px')
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
    // Phase 1: slide to align under target (200ms CSS transition)
    hippoEl.style.left = `${targetXPct}%`

    // Phase 2: after slide, extend neck + open jaw (300ms neck transition)
    window.setTimeout(() => {
      hippoEl.style.setProperty('--neck-height', `${neckH}px`)
      hippoEl.style.setProperty('--jaw-angle', '1')
    }, 200)

    // Phase 3: close jaw at 500ms
    window.setTimeout(() => {
      hippoEl.style.setProperty('--jaw-angle', '0')
    }, 500)

    // Phase 4: retract neck at 700ms, apply outcome class
    window.setTimeout(() => {
      hippoEl.style.setProperty('--neck-height', '20px')
      const outcomeClass = isCorrect ? 'hippo-chomp-correct' : 'hippo-chomp-wrong'
      hippoEl.classList.add(outcomeClass)

      // Phase 5: remove outcome class and resolve
      window.setTimeout(() => {
        hippoEl.classList.remove(outcomeClass)
        resolve()
      }, 600)
    }, 700)
  })
}

export function animateCorrectFeedback(el: HTMLElement): void {
  if (isReducedMotion()) return

  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const colors = ['#FFD54F', '#8BC34A', '#F06292', '#4FC3F7', '#FF8A65', '#CE93D8']
  const count = 6
  const particles: HTMLDivElement[] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const dist = 36 + Math.random() * 20
    const dx = Math.round(Math.cos(angle) * dist)
    const dy = Math.round(Math.sin(angle) * dist)

    const p = document.createElement('div')
    p.className = 'confetti-particle'
    p.style.left = `${cx - 4}px`
    p.style.top = `${cy - 4}px`
    p.style.backgroundColor = colors[i % colors.length]
    p.style.setProperty('--dx', `${dx}px`)
    p.style.setProperty('--dy', `${dy}px`)
    document.body.appendChild(p)
    particles.push(p)
  }

  window.setTimeout(() => {
    for (const p of particles) p.remove()
  }, 600)
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

// ── Frenzy NPC animations ─────────────────────────────────────────────────────

export function animateNpcChomp(npcId: string, targetEl: HTMLElement | null): void {
  const npcEl = document.getElementById(npcId)
  if (!npcEl) return

  const arenaEl = document.getElementById('game-arena')
  let targetXPct = parseFloat(npcEl.style.getPropertyValue('--hippo-x') || '50')
  let neckH = 20

  if (arenaEl && targetEl) {
    const arenaRect = arenaEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetCenterY = targetRect.top + targetRect.height / 2
    targetXPct = ((targetCenterX - arenaRect.left) / arenaRect.width) * 100

    const bodyEl = npcEl.querySelector<HTMLElement>('.hippo-body')
    const headEl = npcEl.querySelector<HTMLElement>('.hippo-head')
    const bodyH = bodyEl?.offsetHeight ?? 40
    const headH = headEl?.offsetHeight ?? 48
    const maxNeck = Math.max(20, arenaRect.height * 0.55 - bodyH - headH)
    neckH = Math.min(Math.max(20, arenaRect.bottom - targetCenterY - bodyH - headH / 2), maxNeck)
  }

  // Slide to target
  npcEl.style.setProperty('--hippo-x', `${targetXPct}%`)

  // Extend neck + open jaw after slide
  window.setTimeout(() => {
    npcEl.style.setProperty('--neck-height', `${neckH}px`)
    npcEl.style.setProperty('--jaw-angle', '1')
  }, 200)

  // Close jaw
  window.setTimeout(() => {
    npcEl.style.setProperty('--jaw-angle', '0')
  }, 500)

  // Retract neck
  window.setTimeout(() => {
    npcEl.style.setProperty('--neck-height', '20px')
  }, 700)

  if (targetEl) {
    targetEl.classList.remove('shrink-claimed')
    void targetEl.offsetWidth
    targetEl.classList.add('shrink-claimed')
    window.setTimeout(() => targetEl.classList.remove('shrink-claimed'), 300)
  }
}


