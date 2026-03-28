export function animateCollectPop(element: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    element.classList.add('collecting')
    let resolved = false

    const onEnd = () => {
      if (resolved) return
      resolved = true
      element.style.display = 'none'
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

export function setWowMode(container: HTMLElement, enabled: boolean): void {
  if (enabled) {
    container.classList.add('wow-mode')
  } else {
    container.classList.remove('wow-mode')
  }
}

export function animateFlyToNotepad(
  sceneItem: HTMLElement,
  targetSlot: HTMLElement,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const itemRect = sceneItem.getBoundingClientRect()
    const slotRect = targetSlot.getBoundingClientRect()

    // Create flying clone
    const clone = document.createElement('div')
    clone.className = 'flying-letter'
    const badge = sceneItem.querySelector('.item-badge')
    clone.textContent = badge?.textContent ?? ''

    // Style clone like a letter tile
    const startLeft = itemRect.left + itemRect.width / 2 - 27
    const startTop = itemRect.top + itemRect.height / 2 - 27
    clone.style.cssText = `
      width: 54px; height: 54px;
      background: var(--game-yellow); color: var(--game-purple-dark);
      border-radius: 12px; font-size: 1.75rem; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 0 var(--game-yellow-dark);
      left: ${startLeft}px;
      top: ${startTop}px;
    `

    // Set CSS custom properties for keyframe endpoints
    const endX = (slotRect.left + slotRect.width / 2 - 27) - startLeft
    const endY = (slotRect.top + slotRect.height / 2 - 27) - startTop
    clone.style.setProperty('--fly-start-x', '0px')
    clone.style.setProperty('--fly-start-y', '0px')
    clone.style.setProperty('--fly-end-x', `${endX}px`)
    clone.style.setProperty('--fly-end-y', `${endY}px`)

    document.body.appendChild(clone)

    // Hide the original scene item immediately
    sceneItem.style.display = 'none'

    let resolved = false
    const onEnd = () => {
      if (resolved) return
      resolved = true
      clone.remove()
      resolve()
    }

    clone.addEventListener('animationend', onEnd, { once: true })
    setTimeout(onEnd, 500) // fallback > 450ms animation
  })
}

export function animateScenePan(_track: HTMLElement): void {
  // Pan is CSS-driven — this function exists for discoverability
  // The actual pan is triggered by showScreen adding/removing CSS classes
}
