const statusEl = () => document.getElementById('game-status')
const feedbackEl = () => document.getElementById('game-feedback')

export function announceWave(wave: number): void {
  const el = statusEl()
  if (el) el.textContent = `Wave ${wave} — Destroy the towers!`
}

export function announceScore(score: number): void {
  const el = statusEl()
  if (el) el.textContent = `Score: ${score}`
}

export function announceBlocksDestroyed(count: number): void {
  const el = feedbackEl()
  if (el) el.textContent = count > 3 ? `Big smash! ${count} blocks destroyed!` : `Smash! ${count} blocks!`
}

export function announceCombo(count: number): void {
  const el = feedbackEl()
  if (el) el.textContent = `Combo x${count}!`
}

export function announceTowerDown(): void {
  const el = feedbackEl()
  if (el) el.textContent = 'Tower destroyed!'
}

export function announceGameOver(score: number, waves: number): void {
  const el = statusEl()
  if (el) el.textContent = `Game over! Final score: ${score} across ${waves} waves.`
}

export function announceReturnToStart(): void {
  const el = statusEl()
  if (el) el.textContent = 'Returned to start screen.'
}