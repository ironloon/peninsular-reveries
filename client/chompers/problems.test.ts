import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { generateProblem, buildSceneItems } from './problems'
import { AREAS } from './types'
import type { AreaLevel } from './types'

const LEVELS: AreaLevel[] = [1, 2, 3]
const constantRng = (): number => 0.5

describe('generateProblem — all 18 area+level combinations', () => {
  for (const area of AREAS) {
    for (const level of LEVELS) {
      test(`${area} level ${level}: positive integer answer and non-empty prompt`, () => {
        const problem = generateProblem(area, level, constantRng)
        assert.ok(Number.isInteger(problem.correctAnswer), `answer should be integer: ${problem.correctAnswer}`)
        assert.ok(problem.correctAnswer > 0, `answer should be positive: ${problem.correctAnswer}`)
        assert.ok(problem.prompt.length > 0, 'prompt should be non-empty')
      })
    }
  }
})

describe('counting area', () => {
  for (const level of LEVELS) {
    test(`level ${level}: countingObjects length === answer`, () => {
      const problem = generateProblem('counting', level, constantRng)
      assert.ok(Array.isArray(problem.countingObjects), 'countingObjects should be an array')
      assert.equal(problem.countingObjects!.length, problem.correctAnswer)
    })
  }
})

describe('matching area', () => {
  for (const level of LEVELS) {
    test(`level ${level}: prompt starts with "Find "`, () => {
      const problem = generateProblem('matching', level, constantRng)
      assert.ok(problem.prompt.startsWith('Find '), `Expected prompt to start with "Find ", got: ${problem.prompt}`)
    })
  }
})

describe('buildSceneItems', () => {
  test('no duplicate itemIds', () => {
    for (const area of AREAS) {
      for (const level of LEVELS) {
        const problem = generateProblem(area, level, constantRng)
        const items = buildSceneItems(problem, area, constantRng)
        const ids = items.map((item) => item.id)
        const uniqueIds = new Set(ids)
        assert.equal(uniqueIds.size, ids.length, `Duplicate IDs for ${area} level ${level}: ${ids.join(', ')}`)
      }
    }
  })

  test('correct answer is present among items', () => {
    for (const area of AREAS) {
      for (const level of LEVELS) {
        const problem = generateProblem(area, level, constantRng)
        const items = buildSceneItems(problem, area, constantRng)
        const correctItems = items.filter((item) => item.isCorrect)
        assert.equal(correctItems.length, 1, `Expected 1 correct item for ${area} level ${level}`)
        assert.equal(correctItems[0].value, problem.correctAnswer)
      }
    }
  })

  test('all items have x and y percentage positions (5–95)', () => {
    for (const area of AREAS) {
      for (const level of LEVELS) {
        const problem = generateProblem(area, level, constantRng)
        const items = buildSceneItems(problem, area, constantRng)
        for (const item of items) {
          assert.ok(item.x >= 5 && item.x <= 95, `x=${item.x} out of 5–95 range for ${area} level ${level}`)
          assert.ok(item.y >= 5 && item.y <= 95, `y=${item.y} out of 5–95 range for ${area} level ${level}`)
        }
      }
    }
  })
})

describe('distractor validation', () => {
  test('each problem scene has at least 1 distractor (wrong answer)', () => {
    for (const area of AREAS) {
      const problem = generateProblem(area, 1, constantRng)
      const items = buildSceneItems(problem, area, constantRng)
      const wrong = items.filter((item) => !item.isCorrect)
      assert.ok(wrong.length >= 1, `Expected at least 1 distractor for ${area}, got ${wrong.length}`)
    }
  })

  test('all item values are positive integers', () => {
    for (const area of AREAS) {
      for (const level of LEVELS) {
        const problem = generateProblem(area, level, constantRng)
        const items = buildSceneItems(problem, area, constantRng)
        for (const item of items) {
          assert.ok(
            Number.isInteger(item.value) && item.value > 0,
            `Item value ${item.value} is not a positive integer for ${area} level ${level}`,
          )
        }
      }
    }
  })
})
