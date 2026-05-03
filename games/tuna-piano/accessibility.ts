const statusEl = () => document.getElementById('game-status')
const feedbackEl = () => document.getElementById('game-feedback')

export function announceNote(note: string, sustained: boolean): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = sustained ? `Sustained ${note}` : note
}

export function announceStart(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Tuna Piano ready. Press Start to play!'
}

export function announcePlaying(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Play the piano with your hands!'
}

export function announceTunaPressed(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'Hold closed hand on the tuna to go home...'
}

export function announceTunaReleased(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = ''
}

export function announceReturnHome(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Returning to home screen...'
}

export function manageFocus(screen: 'start' | 'playing'): void {
  let target: HTMLElement | null = null
  if (screen === 'start') {
    target = document.getElementById('start-btn')
  } else if (screen === 'playing') {
    target = document.querySelector('.tp-menu-btn')
  }
  if (target) {
    target.focus()
  }
}