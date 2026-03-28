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
