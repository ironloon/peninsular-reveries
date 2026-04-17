import { announce, moveFocusAfterTransition } from '../../client/game-accessibility.js'
import type { GameState, Problem } from './types.js'

function promptToSpeech(prompt: string): string {
  // Counting prompts are already natural language questions
  if (!prompt.includes('=')) return prompt

  const text = prompt
    .replace(/\s*=\s*\?$/, '')
    .replace(/\+/g, 'plus')
    .replace(/\u2212/g, 'minus')
    .replace(/\u00d7/g, 'times')
    .replace(/\u00f7/g, 'divided by')
  return `What is ${text}?`
}

export function announceProblem(problem: Problem): void {
  let text: string

  if (problem.area === 'counting') {
    text = 'Count the objects. How many are there?'
  } else if (problem.area === 'matching') {
    text = `Find the number ${problem.correctAnswer}.`
  } else {
    text = promptToSpeech(problem.prompt)
  }

  announce(text, 'polite')
}

export function announceCorrect(answer: number, streak: number): void {
  const streakText = streak >= 3 ? ` ${streak} in a row!` : ''
  announce(`Correct! ${answer} is right.${streakText}`, 'assertive')
}

export function announceWrong(selected: number, correct: number): void {
  announce(`Not quite. You picked ${selected}. The answer is ${correct}.`, 'assertive')
}

export function announceRound(round: number, total: number): void {
  announce(`Round ${round} of ${total}`, 'polite')
}

export function announceGameOver(state: GameState): void {
  announce(
    `Game over. You got ${state.correctCount} out of ${state.totalRounds} right. Score: ${state.score}.`,
    'assertive',
  )
}

export { moveFocusAfterTransition }
