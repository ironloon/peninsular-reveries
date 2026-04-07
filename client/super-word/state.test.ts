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