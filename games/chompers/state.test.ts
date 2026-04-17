import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createInitialState,
  selectAnswer,
  resolveChomp,
  advanceRound,
  resetGame,
} from './state'
import { AREA_LEVEL_RANGES, LEVEL_ADVANCE_THRESHOLD, POINTS_FOR_AREA, SCENE_ITEM_COUNTS, START_LIVES, TOTAL_ROUNDS } from './types'
import type { Area, AreaLevel } from './types'

const SEED = 0xc0ffee

test('createInitialState produces valid initial state', () => {
  const state = createInitialState('addition', 1, SEED)

  assert.equal(state.phase, 'playing')
  assert.equal(state.round, 1)
  assert.equal(state.totalRounds, TOTAL_ROUNDS)
  assert.equal(state.lives, START_LIVES)
  assert.equal(state.score, 0)
  assert.equal(state.streak, 0)
  assert.equal(state.bestStreak, 0)
  assert.equal(state.correctCount, 0)
  assert.equal(state.area, 'addition')
  assert.equal(state.level, 1)
  assert.ok(!('difficulty' in state), 'state should not have difficulty')
  assert.equal(state.sceneItems.length, SCENE_ITEM_COUNTS['addition'])
  assert.ok(state.sceneItems.some((item) => item.isCorrect), 'Expected at least one correct item')
})

test('correct answer flow: score increases, streak increments, advances to round 2', () => {
  const state = createInitialState('addition', 1, SEED)
  const correctItem = state.sceneItems.find((item) => item.isCorrect)
  assert.ok(correctItem, 'Expected a correct item in scene')

  const chomping = selectAnswer(state, correctItem.id)
  assert.equal(chomping.phase, 'chomping')
  assert.equal(chomping.hippo.targetItemId, correctItem.id)

  const feedback = resolveChomp(chomping)
  assert.equal(feedback.phase, 'feedback')
  assert.ok(feedback.score > 0, 'Expected score to increase')
  assert.equal(feedback.streak, 1)
  assert.equal(feedback.bestStreak, 1)
  assert.equal(feedback.correctCount, 1)
  assert.equal(feedback.lives, START_LIVES)

  const next = advanceRound(feedback)
  assert.equal(next.phase, 'playing')
  assert.equal(next.round, 2)
})

test('wrong answer flow: lives decrease, streak resets', () => {
  const state = createInitialState('addition', 1, SEED)
  const wrongItem = state.sceneItems.find((item) => !item.isCorrect)
  assert.ok(wrongItem, 'Expected a wrong item in scene')

  const chomping = selectAnswer(state, wrongItem.id)
  const feedback = resolveChomp(chomping)

  assert.equal(feedback.phase, 'feedback')
  assert.equal(feedback.lives, START_LIVES - 1)
  assert.equal(feedback.streak, 0)
  assert.equal(feedback.score, 0)
})

test('game over after totalRounds', () => {
  let state = createInitialState('addition', 1, SEED)
  assert.equal(state.totalRounds, TOTAL_ROUNDS)

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    state = advanceRound({ ...state, phase: 'feedback' })
  }

  assert.equal(state.phase, 'gameover')
})

test('game over early when lives reach 0', () => {
  const state = createInitialState('addition', 1, SEED)
  const depleted = { ...state, lives: 0, phase: 'feedback' as const }
  const result = advanceRound(depleted)
  assert.equal(result.phase, 'gameover')
})

test('streak increments on consecutive correct answers and bestStreak tracks the max', () => {
  let state = createInitialState('multiplication', 1, SEED)

  for (let round = 0; round < 4; round++) {
    const correctItem = state.sceneItems.find((item) => item.isCorrect)
    assert.ok(correctItem, `Expected correct item in round ${round + 1}`)
    state = resolveChomp(selectAnswer(state, correctItem.id))
    assert.equal(state.streak, round + 1, `Streak should be ${round + 1} after ${round + 1} correct answers`)
    assert.equal(state.bestStreak, round + 1)
    state = advanceRound(state)
    if (state.phase === 'gameover') break
  }
})

test('wrong answer after a streak resets streak but preserves bestStreak', () => {
  let state = createInitialState('subtraction', 1, SEED)

  // Get two correct answers to build a streak
  for (let round = 0; round < 2; round++) {
    const correctItem = state.sceneItems.find((item) => item.isCorrect)!
    state = resolveChomp(selectAnswer(state, correctItem.id))
    state = advanceRound(state)
  }

  const streakBeforeWrong = state.bestStreak

  // Now answer wrong
  const wrongItem = state.sceneItems.find((item) => !item.isCorrect)!
  state = resolveChomp(selectAnswer(state, wrongItem.id))

  assert.equal(state.streak, 0)
  assert.equal(state.bestStreak, streakBeforeWrong)
})

test('score accumulation matches POINTS_FOR_AREA', () => {
  const areas: Array<[Area, AreaLevel]> = [
    ['matching', 1],
    ['counting', 1],
    ['addition', 1],
    ['subtraction', 1],
    ['multiplication', 1],
    ['division', 1],
  ]

  for (const [area, level] of areas) {
    const expectedPoints = POINTS_FOR_AREA[area]
    const state = createInitialState(area, level, SEED)
    const correctItem = state.sceneItems.find((item) => item.isCorrect)!
    const result = resolveChomp(selectAnswer(state, correctItem.id))
    assert.equal(result.score, expectedPoints, `Expected ${expectedPoints} points for ${area}`)
  }
})

test('resetGame returns to round 1 with same area and level', () => {
  let state = createInitialState('division', 1, SEED)
  state = advanceRound({ ...state, phase: 'feedback' })
  state = advanceRound({ ...state, phase: 'feedback' })
  assert.equal(state.round, 3)

  const reset = resetGame(state)
  assert.equal(reset.round, 1)
  assert.equal(reset.area, 'division')
  assert.equal(reset.level, 1)
  assert.equal(reset.phase, 'playing')
  assert.equal(reset.score, 0)
})

test('area: counting initial state has countingObjects on the problem', () => {
  const state = createInitialState('counting', 1, SEED)
  assert.equal(state.area, 'counting')
  assert.equal(state.currentProblem.prompt, 'Count the objects')
  assert.ok(Array.isArray(state.currentProblem.countingObjects), 'Expected countingObjects array')
  assert.ok((state.currentProblem.countingObjects?.length ?? 0) > 0, 'Expected non-empty countingObjects')
})

test('area: matching initial state has a find-N prompt and no countingObjects', () => {
  const state = createInitialState('matching', 1, SEED)
  assert.equal(state.area, 'matching')
  assert.match(state.currentProblem.prompt, /^Find \d+$/)
  assert.equal(state.currentProblem.countingObjects, undefined)
})

test('advanceRound preserves area, level, and accumulated score across boundaries', () => {
  let state = createInitialState('multiplication', 2, SEED)

  // Correct answer on round 1
  const correctItem = state.sceneItems.find((item) => item.isCorrect)
  assert.ok(correctItem)
  state = resolveChomp(selectAnswer(state, correctItem.id))
  const scoreAfterRound1 = state.score
  assert.ok(scoreAfterRound1 > 0)

  state = advanceRound(state)

  assert.equal(state.round, 2, 'round should increment to 2')
  assert.equal(state.score, scoreAfterRound1, 'score should be preserved across round advance')
  assert.equal(state.area, 'multiplication', 'area should be unchanged')
  assert.equal(state.level, 2, 'level should be unchanged')
  assert.equal(state.phase, 'playing')
})

test('difficulty level affects problem parameter ranges', () => {
  const arithAreas: Array<Area> = ['addition', 'subtraction', 'multiplication', 'division']
  for (const area of arithAreas) {
    const l1Max = AREA_LEVEL_RANGES[area][1].max
    const l3Max = AREA_LEVEL_RANGES[area][3].max
    assert.ok(l3Max > l1Max, `Level 3 max (${l3Max}) should exceed level 1 max (${l1Max}) for ${area}`)
  }
})

test('progressive level: advances from level 1 to level 2 when levelCorrectCount reaches threshold', () => {
  const state = createInitialState('addition', 1, SEED)
  const atThreshold = { ...state, levelCorrectCount: LEVEL_ADVANCE_THRESHOLD, phase: 'feedback' as const }
  const advanced = advanceRound(atThreshold)

  assert.equal(advanced.level, 2, 'level should advance from 1 to 2')
  assert.equal(advanced.levelCorrectCount, 0, 'levelCorrectCount should reset after level advance')
})

test('progressive level: does not advance below threshold', () => {
  const state = createInitialState('addition', 1, SEED)
  const belowThreshold = { ...state, levelCorrectCount: LEVEL_ADVANCE_THRESHOLD - 1, phase: 'feedback' as const }
  const next = advanceRound(belowThreshold)

  assert.equal(next.level, 1, 'level should stay at 1 below threshold')
  assert.equal(next.levelCorrectCount, LEVEL_ADVANCE_THRESHOLD - 1, 'levelCorrectCount should be preserved')
})

test('progressive level: caps at level 3', () => {
  const state = createInitialState('addition', 3, SEED)
  const atMax = { ...state, levelCorrectCount: LEVEL_ADVANCE_THRESHOLD, phase: 'feedback' as const }
  const next = advanceRound(atMax)

  assert.equal(next.level, 3, 'level should not exceed 3')
})

