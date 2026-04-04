import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SESSION_SIZE, PUZZLES, selectPuzzles } from './puzzles'
import { DIFFICULTIES } from './types'

const expectedWordLengths = {
  starter: 2,
  easy: 3,
  medium: 4,
  hard: 5,
  expert: 6,
} as const

const minimumCounts = {
  starter: 25,
  easy: 40,
  medium: 40,
  hard: 35,
  expert: 30,
} as const

test('puzzle bank covers every difficulty with the expected word length', () => {
  for (const difficulty of DIFFICULTIES) {
    const pool = PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty)
    const answers = new Set(pool.map((puzzle) => puzzle.answer))

    assert.ok(pool.length >= minimumCounts[difficulty])
    assert.equal(answers.size, pool.length)
    assert.ok(pool.every((puzzle) => puzzle.answer.length === expectedWordLengths[difficulty]))
    assert.ok(pool.every((puzzle) => puzzle.items.filter((item) => item.type === 'letter').length === puzzle.answer.length))
    assert.ok(pool.every((puzzle) => puzzle.items.every((item) => item.type !== 'letter' || item.emoji !== '🔤')))
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

test('distractors stay in scene-friendly sky or ground bands while letters stay central', () => {
  for (const difficulty of DIFFICULTIES) {
    const selected = selectPuzzles(difficulty)

    for (const puzzle of selected) {
      const letters = puzzle.items.filter((item) => item.type === 'letter')
      const distractors = puzzle.items.filter((item) => item.type === 'distractor')

      assert.ok(letters.every((item) => item.zone === 'middle'))
      assert.ok(letters.every((item) => item.y >= 18 && item.y <= 76))
      assert.ok(distractors.every((item) => item.zone === 'sky' || item.zone === 'ground'))
      assert.ok(distractors.every((item) => (
        item.zone === 'sky'
          ? item.y >= 12 && item.y <= 51
          : item.y >= 51 && item.y <= 82
      )))
    }
  }
})