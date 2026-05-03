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
  el.textContent = `Mud is ${Math.round(percent)} percent full.`
}

export function announceGameOver(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'The screen is completely covered in mud! Game over.'
}

export function announceStart(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Mudskipper pond ready. Press start to begin.'
}

export function announcePlaying(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Jump to make your mudskipper splash in the mud!'
}

export function announceReturnToStart(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Mud is draining away. Returning to start screen.'
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
