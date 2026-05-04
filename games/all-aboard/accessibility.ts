export function announcePolite(text: string): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = text
}

export function announceAssertive(text: string): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = text
}

export function announceScore(score: number): void {
  announcePolite(`Score: ${score}`)
}

export function announceWhistle(): void {
  announceAssertive('All Aboard! Whistle blown!')
}

export function announceChugging(): void {
  announcePolite('Chugga chugga! The train is moving!')
}

export function announceTrip(trips: number): void {
  announcePolite(`Trip ${trips} complete!`)
}

export function announceBounce(): void {
  announceAssertive('Turbo boost! Bouncing!')
}

export function announceReturnToStart(): void {
  announcePolite('Returned to start screen.')
}