const statusEl = () => document.getElementById('game-status')
const feedbackEl = () => document.getElementById('game-feedback')

export function announceScore(score: number): void {
  const el = statusEl()
  if (el) el.textContent = `Score: ${score}`
}

export function announceFoodSpawned(count: number, max: number): void {
  const el = statusEl()
  if (el) el.textContent = `Food ${count} of ${max} falling.`
}

export function announceChomp(value: number): void {
  const el = feedbackEl()
  if (el) el.textContent = value >= 5 ? 'Big crunch! 5 points!' : 'Chomp! 1 point!'
}

export function announceDragonJoined(count: number): void {
  const el = feedbackEl()
  if (el) el.textContent = `Dragon ${count} joined the feast!`
}

export function announceCelebration(): void {
  const el = feedbackEl()
  if (el) el.textContent = 'All food served! Celebration! Raise your arms to breathe fire!'
}

export function announceReturnToStart(): void {
  const el = statusEl()
  if (el) el.textContent = 'Returning to start screen.'
}
