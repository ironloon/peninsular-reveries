import type { GameState } from './state.js'

export function announceCorrect(value: number, _streak: number): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = `Correct! ${value} points`
}

export function announceWrong(value: number, correctAnswer: number): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = `Wrong! The answer was ${correctAnswer}`
}

export function announceRound(round: number, total: number): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = `Round ${round} of ${total}`
}

export function announceGameOver(state: GameState): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = `Game over! Final score: ${state.score}`
}

export function announceProblem(): void {
  // announced visually through HUD
}

export function moveFocusAfterTransition(_id: string, _delay: number): void {
  // focus management handled by game loop in immersive mode
}