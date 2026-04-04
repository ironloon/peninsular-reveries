import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SESSION_SIZE, PUZZLES, selectPuzzles } from '../../client/super-word/puzzles'
import { DIFFICULTIES } from '../../client/super-word/types'

const expectedWordLengths = {
  starter: 2,
  easy: 3,
  medium: 4,
  hard: 5,
  expert: 6,
} as const

const minimumCounts = {
  starter: 15,
  easy: 20,
  medium: 20,
  hard: 15,
  expert: 10,
} as const

test('puzzle bank covers every difficulty with the expected word length', () => {
  for (const difficulty of DIFFICULTIES) {
    const pool = PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty)

    assert.ok(pool.length >= minimumCounts[difficulty])
    assert.ok(pool.every((puzzle) => puzzle.answer.length === expectedWordLengths[difficulty]))
    assert.ok(pool.every((puzzle) => puzzle.items.filter((item) => item.type === 'letter').length === puzzle.answer.length))
  }
})

test('difficulty selection keeps each session inside its tier and mobile-safe bounds', () => {
  for (const difficulty of DIFFICULTIES) {
    const selected = selectPuzzles(difficulty)

    assert.ok(selected.length > 0)
    assert.ok(selected.length <= DEFAULT_SESSION_SIZE)
    assert.ok(selected.every((puzzle) => puzzle.difficulty === difficulty))
    assert.ok(selected.every((puzzle) => puzzle.items.every((item) => item.x >= 12 && item.x <= 88 && item.y >= 14 && item.y <= 78)))
  }
})