import assert from 'node:assert/strict'
import test from 'node:test'
import { advancePuzzle, checkAnswer, collectLetter, createInitialState, resetGame, selectTile } from './state'
import type { Puzzle } from './types'

const samplePuzzle: Puzzle = {
  answer: 'CAT',
  difficulty: 'hero',
  prompt: 'Spell CAT',
  items: [],
}

test('selectTile selects on first activation and swaps on second activation', () => {
  let state = createInitialState(1, false)
  state = collectLetter(state, 'C', 'c0')
  state = collectLetter(state, 'A', 'a0')

  const selected = selectTile(state, 0)
  assert.equal(selected.selectedTileIndex, 0)

  const swapped = selectTile(selected, 1)
  assert.deepEqual(swapped.collectedLetters.map((letter) => letter.char), ['A', 'C'])
  assert.equal(swapped.selectedTileIndex, null)
})

test('checkAnswer scores correct words and advance/reset clear transient state', () => {
  let state = createInitialState(2, true)
  state = collectLetter(state, 'C', 'c0')
  state = collectLetter(state, 'A', 'a0')
  state = collectLetter(state, 'T', 't0')

  const { correct, newState } = checkAnswer(state, samplePuzzle)
  assert.equal(correct, true)
  assert.equal(newState.score, 10)
  assert.deepEqual(newState.completed, [true, false])

  const advanced = advancePuzzle(newState)
  assert.equal(advanced.currentPuzzleIndex, 1)
  assert.deepEqual(advanced.collectedLetters, [])
  assert.equal(advanced.selectedTileIndex, null)

  const reset = resetGame(advanced)
  assert.equal(reset.currentPuzzleIndex, 0)
  assert.equal(reset.wowMode, true)
  assert.deepEqual(reset.completed, [false, false])
})

test('full 2-puzzle flow: solving both puzzles marks all completed', () => {
  const puzzle1: Puzzle = { answer: 'CAT', difficulty: 'hero', prompt: 'Spell CAT', items: [] }
  const puzzle2: Puzzle = { answer: 'DOG', difficulty: 'hero', prompt: 'Spell DOG', items: [] }

  let state = createInitialState(2, false)

  // Solve puzzle 0
  state = collectLetter(state, 'C', 'c0')
  state = collectLetter(state, 'A', 'a0')
  state = collectLetter(state, 'T', 't0')
  const { correct: c1, newState: s1 } = checkAnswer(state, puzzle1)
  assert.equal(c1, true)
  assert.deepEqual(s1.completed, [true, false])

  state = advancePuzzle(s1)
  assert.equal(state.currentPuzzleIndex, 1)
  assert.deepEqual(state.collectedLetters, [])

  // Solve puzzle 1
  state = collectLetter(state, 'D', 'd0')
  state = collectLetter(state, 'O', 'o0')
  state = collectLetter(state, 'G', 'g0')
  const { correct: c2, newState: s2 } = checkAnswer(state, puzzle2)
  assert.equal(c2, true)
  assert.deepEqual(s2.completed, [true, true])
  assert.equal(s2.completed.every(Boolean), true)
})

test('wrong answer does not change score or completion', () => {
  let state = createInitialState(1, false)
  state = collectLetter(state, 'X', 'x0')
  state = collectLetter(state, 'Y', 'y0')
  state = collectLetter(state, 'Z', 'z0')

  const { correct, newState } = checkAnswer(state, samplePuzzle)
  assert.equal(correct, false)
  assert.equal(newState.score, 0)
  assert.deepEqual(newState.completed, [false])
})