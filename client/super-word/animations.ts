import { isReducedMotionEnabled } from '../preferences.js'

export function isReducedMotion(): boolean {
  return isReducedMotionEnabled()
}

export function animateCollectPop(element: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    element.classList.add('collecting')
    let resolved = false

    const onEnd = () => {
      if (resolved) return
      resolved = true
      element.classList.remove('collecting')
      element.removeEventListener('animationend', onEnd)
      resolve()
    }

    element.addEventListener('animationend', onEnd, { once: true })
    setTimeout(() => {
      if (!resolved) onEnd()
    }, 700)
  })
}

export function animateItemShake(element: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    element.classList.add('shaking')
    let resolved = false

    const onEnd = () => {
      if (resolved) return
      resolved = true
      element.classList.remove('shaking')
      element.removeEventListener('animationend', onEnd)
      resolve()
    }

    element.addEventListener('animationend', onEnd, { once: true })
    setTimeout(() => {
      if (!resolved) onEnd()
    }, 500)
  })
}

export function animateTileAppear(element: HTMLElement, delay: number = 0): void {
  element.style.animationDelay = `${delay}s`
  element.classList.add('appearing')

  const onEnd = () => {
    element.classList.remove('appearing')
    element.style.animationDelay = ''
    element.removeEventListener('animationend', onEnd)
  }

  element.addEventListener('animationend', onEnd, { once: true })
}

export function animateTileWrongShake(elements: HTMLElement[]): Promise<void> {
  return new Promise<void>((resolve) => {
    let resolved = false

    const onEnd = () => {
      if (resolved) return
      resolved = true
      for (const el of elements) {
        el.classList.remove('wrong-shake')
        el.removeEventListener('animationend', onEnd)
      }
      resolve()
    }

    for (const el of elements) {
      el.classList.add('wrong-shake')
    }

    if (elements.length > 0) {
      elements[0].addEventListener('animationend', onEnd, { once: true })
    }

    setTimeout(() => {
      if (!resolved) onEnd()
    }, 550)
  })
}

export function animateSolvedLetters(container: HTMLElement): void {
  const letters = container.querySelectorAll('.solved-letter')
  for (const letter of letters) {
    letter.classList.add('solved-pop')
  }
}

export function animateFlyToNotepad(
  sceneItem: HTMLElement,
  targetSlot: HTMLElement,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const badge = sceneItem.querySelector('.item-badge') as HTMLElement | null
    const startRect = badge?.getBoundingClientRect() ?? sceneItem.getBoundingClientRect()
    const slotRect = targetSlot.getBoundingClientRect()

    const clone = document.createElement('div')
    clone.className = 'letter-tile flying-letter'
    clone.textContent = badge?.textContent ?? targetSlot.textContent ?? ''
    clone.setAttribute('aria-hidden', 'true')

    const startLeft = startRect.left + startRect.width / 2 - slotRect.width / 2
    const startTop = startRect.top + startRect.height / 2 - slotRect.height / 2
    const endX = slotRect.left - startLeft
    const endY = slotRect.top - startTop
    const midX = endX * 0.55
    const arcHeight = Math.min(76, Math.max(26, Math.abs(endY) * 0.35 + 20))
    const midY = endY * 0.5 - arcHeight
    const startScale = Math.max(0.52, Math.min(0.88, startRect.width / Math.max(slotRect.width, 1)))

    clone.style.left = `${startLeft}px`
    clone.style.top = `${startTop}px`
    clone.style.width = `${slotRect.width}px`
    clone.style.height = `${slotRect.height}px`
    clone.style.fontSize = getComputedStyle(targetSlot).fontSize
    clone.style.borderRadius = getComputedStyle(targetSlot).borderRadius

    document.body.appendChild(clone)

    let resolved = false
    const onEnd = () => {
      if (resolved) return
      resolved = true
      clone.remove()
      resolve()
    }

    if (typeof clone.animate !== 'function') {
      setTimeout(onEnd, 0)
      return
    }

    clone.animate([
      { transform: `translate3d(0, 0, 0) scale(${startScale})`, opacity: 0.94, offset: 0 },
      { transform: `translate3d(${midX}px, ${midY}px, 0) scale(1.08)`, opacity: 1, offset: 0.68 },
      { transform: `translate3d(${endX}px, ${endY}px, 0) scale(1)`, opacity: 1, offset: 1 },
    ], {
      duration: 520,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    }).finished.then(onEnd).catch(onEnd)

    setTimeout(onEnd, 700)
  })
}

// Pan is CSS-driven; triggered by showScreen adding/removing CSS classes
