import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SESSION_SIZE, PUZZLES, selectPuzzles } from '../client/super-word/puzzles'

test('easy puzzle pool stays beginner-friendly', () => {
  const easyAnswers = PUZZLES
    .filter((puzzle) => puzzle.difficulty === 'easy')
    .map((puzzle) => puzzle.answer)

  assert.ok(easyAnswers.includes('BED'))
  assert.ok(easyAnswers.includes('HEN'))
  assert.ok(easyAnswers.includes('MAP'))
  assert.ok(!easyAnswers.includes('OWL'))
  assert.deepEqual(
    easyAnswers.filter((answer) => answer.endsWith('E') && !answer.endsWith('EE')),
    [],
  )
})

test('easy difficulty selection only returns easy puzzles', () => {
  const selected = selectPuzzles('easy')

  assert.ok(selected.length > 0)
  assert.ok(selected.length <= DEFAULT_SESSION_SIZE)
  assert.ok(selected.every((puzzle) => puzzle.difficulty === 'easy'))
})