const statusEl = () => document.getElementById('game-status')
const feedbackEl = () => document.getElementById('game-feedback')

export function announceJump(count: number): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = `${count} mudskipper${count > 1 ? 's' : ''} jumping!`
}

export function announceMudLevel(percent: number): void {
  const el = statusEl()
  if (!el) return
  el.textContent = `Mud covers ${Math.round(percent)} percent of the screen.`
}

export function announceGameOver(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'The mud filled the whole screen! Game over.'
}

export function announceStart(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Mudskipper pond ready. Press start to begin.'
}

export function announcePlaying(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Jump to make your mudskipper leap and splash mud everywhere!'
}

export function announceReturnToStart(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Returning to start screen.'
}

export function manageFocus(screen: 'start' | 'playing' | 'gameover'): void {
  let target: HTMLElement | null = null
  if (screen === 'start') {
    target = document.getElementById('start-btn')
  } else if (screen === 'playing') {
    target = document.querySelector('.ms-menu-btn')
  } else if (screen === 'gameover') {
    target = document.getElementById('replay-btn')
  }
  if (target) {
    target.focus()
  }
}