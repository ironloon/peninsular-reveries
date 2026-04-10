function announce(message: string, priority: 'polite' | 'assertive'): void {
  const targetId = priority === 'assertive' ? 'game-feedback' : 'game-status'
  const element = document.getElementById(targetId)
  if (element) {
    element.textContent = message
  }
}

export function announcePhase(message: string): void {
  announce(message, 'polite')
}

export function announceMarkerSelection(label: string, isCurrent: boolean = false): void {
  announce(
    isCurrent
      ? `${label}. You are here. Press enter to read it again.`
      : `${label}. Press enter to go.`,
    'polite',
  )
}

export function announceTravel(from: string, to: string, transport: string): void {
  announce(`The magic bus turns into a ${transport}. Traveling from ${from} to ${to}.`, 'assertive')
}

export function announceRevisit(name: string, country: string): void {
  announce(`You are here in ${name}, ${country}. Reading this place again.`, 'assertive')
}

export function announceDestination(name: string, country: string): void {
  announce(`You are in ${name}, ${country}.`, 'assertive')
}

export function announceFact(fact: string): void {
  announce(fact, 'polite')
}

export function announceMemory(label: string, isNew: boolean): void {
  announce(isNew ? `You found a ${label}.` : `You still have the ${label}.`, 'assertive')
}

export function announceRoom(memoryCount: number): void {
  announce(`Your room. You have ${memoryCount} memories.`, 'polite')
}

export function moveFocusAfterTransition(elementId: string, delayMs: number = 260): void {
  window.setTimeout(() => {
    const element = document.getElementById(elementId)
    if (element) {
      requestAnimationFrame(() => element.focus())
    }
  }, delayMs)
}