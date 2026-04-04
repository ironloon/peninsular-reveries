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

export function announceMarkerSelection(label: string): void {
  announce(`${label}. Press enter to go.`, 'polite')
}

export function announceTravel(from: string, to: string, transport: string): void {
  announce(`The magic bus turns into a ${transport}. Traveling from ${from} to ${to}.`, 'assertive')
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

export function announceClue(clue: string, clueNumber: number): void {
  announce(`Clue ${clueNumber}. ${clue}`, 'assertive')
}

export function announceMysteryResult(destinationName: string, revealed: boolean): void {
  if (revealed) {
    announce(`That one was ${destinationName}. Let's visit it now.`, 'assertive')
    return
  }

  announce(`Yes. It is ${destinationName}.`, 'assertive')
}

export function announceMysteryMiss(nextClueNumber: number): void {
  announce(`Not yet. Here comes clue ${nextClueNumber}.`, 'assertive')
}

export function moveFocusAfterTransition(elementId: string, delayMs: number = 260): void {
  window.setTimeout(() => {
    const element = document.getElementById(elementId)
    if (element) {
      requestAnimationFrame(() => element.focus())
    }
  }, delayMs)
}