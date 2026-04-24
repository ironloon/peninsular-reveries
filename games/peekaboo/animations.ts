import { isReducedMotion } from '../../client/game-animations.js'

export { isReducedMotion }

// ── In-flight animation tracking ─────────────────────────────────────────────────

const activeAnimations: Animation[] = []
const activeAnimationElements: Set<HTMLElement> = new Set()
const activeTimeouts: number[] = []

// ── Animation functions ───────────────────────────────────────────────────────────

/** Triggers CSS class `peekaboo-cell--revealing` on the cell. CSS handles
 *  opacity transition. If reduced motion, sets final state immediately. */
export function animateCellReveal(cellElement: HTMLElement): void {
  if (isReducedMotion()) {
    cellElement.classList.add('peekaboo-cell--revealing')
    // Force the final state instantly, bypassing any CSS transition
    cellElement.style.opacity = '1'
    return
  }

  cellElement.classList.add('peekaboo-cell--revealing')
}

/** Staggered delay on each cell's opacity transition (30ms between cells,
 *  row-by-row). If reduced motion, all cells appear simultaneously. */
export function animateFogRollIn(gridCells: readonly HTMLElement[]): void {
  if (isReducedMotion()) {
    for (const cell of gridCells) {
      cell.classList.add('peekaboo-cell--fog')
    }
    return
  }

  gridCells.forEach((cell, index) => {
    const id = window.setTimeout(() => {
      cell.classList.add('peekaboo-cell--fog')
    }, index * 30)
    activeTimeouts.push(id)
  })
}

/** CSS animation — target emoji translates from off-screen (top-left) to center,
 *  then fades out. Duration ~1s. If reduced motion, character shown briefly at
 *  center then hidden. */
export function animateFlyIn(targetElement: HTMLElement): void {
  if (isReducedMotion()) {
    targetElement.style.opacity = '1'
    const id = window.setTimeout(() => {
      targetElement.style.opacity = '0'
    }, 200)
    activeTimeouts.push(id)
    return
  }

  const animation = targetElement.animate([
    { transform: 'translate(-200%, -200%)', opacity: 0 },
    { transform: 'translate(0, 0)', opacity: 1, offset: 0.4 },
    { transform: 'translate(0, 0)', opacity: 0 },
  ], {
    duration: 1000,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'forwards',
  })

  activeAnimations.push(animation)
}

/** Scale-up + confetti particles. Confetti: 8-12 small `<span>` elements with
 *  random positions, colors, rotation, and fall animation. If reduced motion,
 *  static scale-up only, no confetti. */
export function animateCelebration(targetElement: HTMLElement): void {
  if (isReducedMotion()) {
    const animation = targetElement.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.2)' },
      { transform: 'scale(1)' },
    ], { duration: 400, easing: 'ease-out' })
    activeAnimations.push(animation)
    return
  }

  // Scale-up animation
  const scaleAnimation = targetElement.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.3)' },
    { transform: 'scale(1)' },
  ], {
    duration: 600,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  })
  activeAnimations.push(scaleAnimation)

  // Confetti particles: 8-12 small spans with random positions, colors, rotation, and fall
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#6c5ce7']
  const particleCount = 8 + Math.floor(Math.random() * 5)

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('span')
    particle.textContent = '●'
    particle.style.position = 'absolute'
    particle.style.left = `${Math.random() * 100}%`
    particle.style.top = `${Math.random() * 50}%`
    particle.style.color = colors[Math.floor(Math.random() * colors.length)]
    particle.style.fontSize = `${4 + Math.random() * 6}px`
    particle.style.pointerEvents = 'none'

    // Ensure the target can position the confetti particles
    const originalPosition = targetElement.style.position
    if (!originalPosition || originalPosition === 'static') {
      targetElement.style.position = 'relative'
    }

    targetElement.appendChild(particle)
    activeAnimationElements.add(particle)

    const fallDistance = 60 + Math.random() * 80
    const rotation = Math.random() * 720 - 360
    const fallDuration = 800 + Math.random() * 400

    const fallAnimation = particle.animate([
      { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
      { transform: `translateY(${fallDistance}px) rotate(${rotation}deg)`, opacity: 0 },
    ], {
      duration: fallDuration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    })

    activeAnimations.push(fallAnimation)

    fallAnimation.finished.then(() => {
      particle.remove()
      activeAnimationElements.delete(particle)
    }).catch(() => {
      particle.remove()
      activeAnimationElements.delete(particle)
    })
  }
}

// ── Peek behind scenery ────────────────────────────────────────────────────────

export function animatePeekBehind(element: HTMLElement, found: boolean): void {
  if (isReducedMotion()) {
    return
  }

  if (found) {
    const animation = element.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.4)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.2)', opacity: 1 },
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    })
    activeAnimations.push(animation)
  } else {
    const animation = element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-3px)', offset: 0.2 },
      { transform: 'translateX(3px)', offset: 0.4 },
      { transform: 'translateX(-2px)', offset: 0.6 },
      { transform: 'translateX(0)' },
    ], {
      duration: 300,
      easing: 'ease-out',
    })
    activeAnimations.push(animation)
  }
}

// ── Cleanup ──────────────────────────────────────────────────────────────────────

/** Removes any in-flight animation elements and CSS classes. */
export function stopAllAnimations(): void {
  // Cancel all active Web Animations API animations
  for (const animation of activeAnimations) {
    try {
      animation.cancel()
    } catch {
      // Animation may have already finished or been cancelled
    }
  }
  activeAnimations.length = 0

  // Clear pending timeouts
  for (const id of activeTimeouts) {
    window.clearTimeout(id)
  }
  activeTimeouts.length = 0

  // Remove confetti particles and other injected elements
  Array.from(activeAnimationElements).forEach((element) => {
    element.remove()
  })
  activeAnimationElements.clear()

  // Remove CSS classes added by animation functions
  document.querySelectorAll('.peekaboo-cell--revealing').forEach((el) => {
    el.classList.remove('peekaboo-cell--revealing')
  })
  document.querySelectorAll('.peekaboo-cell--fog').forEach((el) => {
    el.classList.remove('peekaboo-cell--fog')
  })
  document.querySelectorAll('.peekaboo-scenery--peeked').forEach((el) => {
    el.classList.remove('peekaboo-scenery--peeked')
  })
  document.querySelectorAll('.peekaboo-scenery--found').forEach((el) => {
    el.classList.remove('peekaboo-scenery--found')
  })
}