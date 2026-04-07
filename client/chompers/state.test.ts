import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createInitialState,
  selectAnswer,
  resolveChomp,
  advanceRound,
  resetGame,
  createNpcHippos,
  npcSelectTarget,
  tickNpcProgress,
  updateAdaptiveDifficulty,
  tickRoundTimer,
  resolveFrenzyRound,
} from './state'
import { AREA_LEVEL_RANGES, POINTS_FOR_AREA, SCENE_ITEM_COUNTS, START_LIVES, TOTAL_ROUNDS } from './types'
import type { Area, AreaLevel, FrenzyConfig, FrenzyState } from './types'

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
  assert.equal(state.mode, 'normal')
  assert.equal(state.frenzy, null)
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

// ── Frenzy tests ──────────────────────────────────────────────────────────────

const ffaConfig: FrenzyConfig = {
  npcCount: 1,
  teamMode: 'ffa',
  playerColor: '#FF6B6B',
  npcColors: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
}

const teamConfig: FrenzyConfig = {
  npcCount: 3,
  teamMode: 'team',
  playerColor: '#FF6B6B',
  npcColors: ['#4ECDC4', '#45B7D1', '#96CEB4'],
}

function makeFrenzyState(overrides?: Partial<FrenzyState>): FrenzyState {
  const npcs = createNpcHippos(ffaConfig)
  return {
    config: ffaConfig,
    npcs,
    roundTimer: 8000,
    roundTimerMax: 8000,
    adaptiveDifficulty: 1.0,
    playerAnswerTimes: [],
    playerWins: [],
    teamScores: { a: 0, b: 0 },
    ...overrides,
  }
}

test('createNpcHippos: count=1 creates 1 NPC at correct position', () => {
  const npcs = createNpcHippos(ffaConfig)
  assert.equal(npcs.length, 1)
  assert.equal(npcs[0].position.x, 80)
  assert.equal(npcs[0].position.y, 85)
  assert.equal(npcs[0].accuracy, 0.75)
  assert.equal(npcs[0].startDelayMs, 200)
  assert.equal(npcs[0].score, 0)
  assert.equal(npcs[0].chompProgress, 0)
  assert.equal(npcs[0].targetFruitIndex, null)
})

test('createNpcHippos: count=5 creates 5 NPCs', () => {
  const config5: FrenzyConfig = { ...ffaConfig, npcCount: 5, npcColors: ['#a', '#b', '#c', '#d', '#e'] }
  const npcs = createNpcHippos(config5)
  assert.equal(npcs.length, 5)
  assert.equal(npcs[0].position.x, 20)
  assert.equal(npcs[4].position.x, 50)
  assert.equal(npcs[4].startDelayMs, 1000)
})

test('createNpcHippos: FFA mode — all teamIds are null', () => {
  const npcs = createNpcHippos(ffaConfig)
  for (const npc of npcs) {
    assert.equal(npc.teamId, null)
  }
})

test('createNpcHippos: team mode — teamIds alternate starting with b', () => {
  const npcs = createNpcHippos(teamConfig)
  assert.equal(npcs.length, 3)
  assert.equal(npcs[0].teamId, 'b')
  assert.equal(npcs[1].teamId, 'a')
  assert.equal(npcs[2].teamId, 'b')
})

test('npcSelectTarget: rng=0 (accurate) returns correct index', () => {
  const npc = createNpcHippos(ffaConfig)[0]
  const result = npcSelectTarget(npc, 6, 2, () => 0)
  assert.equal(result.fruitIndex, 2)
  assert.equal(result.isCorrect, true)
})

test('npcSelectTarget: rng=1 (inaccurate) returns non-correct index', () => {
  const npc = createNpcHippos(ffaConfig)[0]
  const result = npcSelectTarget(npc, 6, 2, () => 1)
  assert.notEqual(result.fruitIndex, 2)
  assert.equal(result.isCorrect, false)
})

test('tickNpcProgress: advances chompProgress when startDelay=0', () => {
  const npc = { ...createNpcHippos(ffaConfig)[0], targetFruitIndex: 2, chompProgress: 0, startDelayMs: 0 }
  const updated = tickNpcProgress(npc, 1000, 1.0)
  // speed = 0.0004 / 1.0 = 0.0004; delta=1000 → progress = 0.4
  assert.ok(Math.abs(updated.chompProgress - 0.4) < 1e-9)
  assert.equal(updated.startDelayMs, 0)
})

test('tickNpcProgress: no movement while startDelay > 0', () => {
  const npc = { ...createNpcHippos(ffaConfig)[0], targetFruitIndex: 2, chompProgress: 0, startDelayMs: 500 }
  const updated = tickNpcProgress(npc, 200, 1.0)
  assert.equal(updated.chompProgress, 0)
  assert.equal(updated.startDelayMs, 300)
})

test('updateAdaptiveDifficulty: >70% wins decreases difficulty', () => {
  const base = makeFrenzyState({ adaptiveDifficulty: 1.0, playerWins: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0] })
  const newDiff = updateAdaptiveDifficulty(base)
  assert.ok(Math.abs(newDiff - 0.95) < 1e-9, `Expected ~0.95, got ${newDiff}`)
})

test('updateAdaptiveDifficulty: <40% wins increases difficulty', () => {
  const base = makeFrenzyState({ adaptiveDifficulty: 1.0, playerWins: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1] })
  const newDiff = updateAdaptiveDifficulty(base)
  assert.ok(Math.abs(newDiff - 1.05) < 1e-9, `Expected ~1.05, got ${newDiff}`)
})

test('updateAdaptiveDifficulty: clamps at 1.5', () => {
  const base = makeFrenzyState({ adaptiveDifficulty: 1.5, playerWins: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] })
  const newDiff = updateAdaptiveDifficulty(base)
  assert.equal(newDiff, 1.5)
})

test('tickRoundTimer: subtracts deltaMs', () => {
  const frenzy = makeFrenzyState({ roundTimer: 5000 })
  const updated = tickRoundTimer(frenzy, 1000)
  assert.equal(updated.roundTimer, 4000)
})

test('tickRoundTimer: floors at 0', () => {
  const frenzy = makeFrenzyState({ roundTimer: 200 })
  const updated = tickRoundTimer(frenzy, 500)
  assert.equal(updated.roundTimer, 0)
})

test('resolveFrenzyRound: player scores when correct and no NPC', () => {
  const frenzy = makeFrenzyState()
  const result = resolveFrenzyRound(frenzy, { fruitIndex: 1, isCorrect: true }, null)
  assert.equal(result.playerScored, true)
  assert.equal(result.npcScoredId, null)
  assert.equal(result.penaltyLives, 0)
  assert.equal(result.updatedFrenzy.playerWins[0], 1)
})

test('resolveFrenzyRound: NPC scores when NPC first', () => {
  const npcs = createNpcHippos(ffaConfig)
  const frenzy = makeFrenzyState({ npcs })
  const result = resolveFrenzyRound(frenzy, null, 'npc-0')
  assert.equal(result.playerScored, false)
  assert.equal(result.npcScoredId, 'npc-0')
  assert.equal(result.penaltyLives, 0)
  const npc0 = result.updatedFrenzy.npcs.find((n) => n.id === 'npc-0')
  assert.equal(npc0?.score, 1)
  assert.equal(result.updatedFrenzy.playerWins[0], 0)
})

test('resolveFrenzyRound: timeout — no score, push 0 to playerWins', () => {
  const frenzy = makeFrenzyState()
  const result = resolveFrenzyRound(frenzy, null, null)
  assert.equal(result.playerScored, false)
  assert.equal(result.npcScoredId, null)
  assert.equal(result.penaltyLives, 0)
  assert.equal(result.updatedFrenzy.playerWins.length, 1)
  assert.equal(result.updatedFrenzy.playerWins[0], 0)
})

test('resolveFrenzyRound: wrong answer gives penaltyLives=1', () => {
  const frenzy = makeFrenzyState()
  const result = resolveFrenzyRound(frenzy, { fruitIndex: 0, isCorrect: false }, null)
  assert.equal(result.playerScored, false)
  assert.equal(result.penaltyLives, 1)
  assert.equal(result.updatedFrenzy.playerWins[0], 0)
})

test('resolveFrenzyRound: resets NPCs after round', () => {
  const npcs = createNpcHippos(ffaConfig).map((n) => ({ ...n, chompProgress: 0.8, targetFruitIndex: 3 }))
  const frenzy = makeFrenzyState({ npcs })
  const result = resolveFrenzyRound(frenzy, { fruitIndex: 1, isCorrect: true }, null)
  for (const npc of result.updatedFrenzy.npcs) {
    assert.equal(npc.chompProgress, 0)
    assert.equal(npc.targetFruitIndex, null)
  }
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

