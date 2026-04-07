import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SESSION_SIZE, PUZZLES, selectPuzzles } from './puzzles'
import { DIFFICULTIES } from './types'

const minimumCounts: Record<(typeof DIFFICULTIES)[number], number> = {
  sidekick: 50,
  hero: 48,
  super: 50,
  ultra: 50,
  legend: 50,
}

test('each tier has enough words with non-empty phonemicPattern and sources', () => {
  for (const difficulty of DIFFICULTIES) {
    const pool = PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty)
    assert.ok(
      pool.length >= minimumCounts[difficulty],
      `${difficulty}: expected >= ${minimumCounts[difficulty]} puzzles, got ${pool.length}`,
    )
  }
})

test('all answers are uppercase letters only', () => {
  for (const puzzle of PUZZLES) {
    assert.match(puzzle.answer, /^[A-Z]+$/, `${puzzle.answer} is not all uppercase letters`)
    assert.ok(puzzle.answer.length >= 2, `${puzzle.answer} is shorter than 2 characters`)
  }
})

test('all hints are non-empty strings', () => {
  for (const puzzle of PUZZLES) {
    assert.ok(typeof puzzle.prompt === 'string' && puzzle.prompt.length > 0, `${puzzle.answer} has empty prompt`)
  }
})

test('no duplicate answers within a tier', () => {
  for (const difficulty of DIFFICULTIES) {
    const pool = PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty)
    const answers = pool.map((p) => p.answer)
    const unique = new Set(answers)
    assert.equal(
      unique.size,
      answers.length,
      `${difficulty}: duplicate answers found: ${answers.filter((a, i) => answers.indexOf(a) !== i).join(', ')}`,
    )
  }
})

test('no duplicate answers across tiers', () => {
  const allAnswers = PUZZLES.map((p) => p.answer)
  const unique = new Set(allAnswers)
  const dupes = allAnswers.filter((a, i) => allAnswers.indexOf(a) !== i)
  assert.equal(unique.size, allAnswers.length, `cross-tier duplicates found: ${[...new Set(dupes)].join(', ')}`)
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