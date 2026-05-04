// Accessibility announcements for immersive mode
export function announceAction(text: string): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = text
}

export function announceStatus(text: string): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = text
}