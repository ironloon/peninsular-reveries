import type { Area, AreaLevel, GameState, HippoState } from './types.js'
import { LEVEL_ADVANCE_THRESHOLD, POINTS_FOR_AREA, START_LIVES, TOTAL_ROUNDS } from './types.js'
import { buildSceneItems, generateProblem } from './problems.js'

function seededRng(seed: number): [() => number, () => number] {
  let s = seed >>> 0
  const rng = (): number => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
  const getSeed = (): number => s
  return [rng, getSeed]
}

function createHippo(): HippoState {
  return {
    x: 8,
    y: 70,
    targetItemId: null,
    chompPhase: 'idle',
    neckExtension: 0,
  }
}

export function createInitialState(area: Area, level: AreaLevel, seed: number): GameState {
  const [rng, getSeed] = seededRng(seed)
  const problem = generateProblem(area, level, rng)
  const sceneItems = buildSceneItems(problem, area, rng)

  return {
    phase: 'playing',
    area,
    level,
    currentProblem: problem,
    sceneItems,
    score: 0,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    lives: START_LIVES,
    streak: 0,
    bestStreak: 0,
    hippo: createHippo(),
    correctCount: 0,
    levelCorrectCount: 0,
    rngSeed: getSeed(),
  }
}

/** Set the player's chosen item and begin the chomp animation phase. */
export function selectAnswer(state: GameState, itemId: string): GameState {
  return {
    ...state,
    phase: 'chomping',
    hippo: {
      ...state.hippo,
      targetItemId: itemId,
    },
  }
}

/** Evaluate the chomped item and transition to feedback phase. */
export function resolveChomp(state: GameState): GameState {
  const targetItem = state.sceneItems.find((item) => item.id === state.hippo.targetItemId)

  if (!targetItem) {
    return state
  }

  const remainingItems = state.sceneItems.filter((item) => item.id !== targetItem.id)
  const resetHippo: HippoState = {
    ...state.hippo,
    targetItemId: null,
    chompPhase: 'idle',
    neckExtension: 0,
  }

  if (targetItem.isCorrect) {
    const points = POINTS_FOR_AREA[state.area]
    const streak = state.streak + 1
    return {
      ...state,
      phase: 'feedback',
      score: state.score + points,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      correctCount: state.correctCount + 1,
      levelCorrectCount: state.levelCorrectCount + 1,
      sceneItems: remainingItems,
      hippo: resetHippo,
    }
  }

  return {
    ...state,
    phase: 'feedback',
    lives: Math.max(0, state.lives - 1),
    streak: 0,
    sceneItems: remainingItems,
    hippo: resetHippo,
  }
}

/** Advance to the next round, or end the game if all rounds or lives are exhausted. */
export function advanceRound(state: GameState): GameState {
  const bestStreak = Math.max(state.bestStreak, state.streak)

  if (state.round >= state.totalRounds || state.lives <= 0) {
    return {
      ...state,
      bestStreak,
      phase: 'gameover',
    }
  }

  // Progressive level: advance when threshold met, never regress
  let nextLevel = state.level
  let nextLevelCorrectCount = state.levelCorrectCount
  if (state.levelCorrectCount >= LEVEL_ADVANCE_THRESHOLD && state.level < 3) {
    nextLevel = (state.level + 1) as AreaLevel
    nextLevelCorrectCount = 0
  }

  const [rng, getSeed] = seededRng(state.rngSeed)
  const problem = generateProblem(state.area, nextLevel, rng)
  const sceneItems = buildSceneItems(problem, state.area, rng)

  return {
    ...state,
    phase: 'playing',
    round: state.round + 1,
    level: nextLevel,
    levelCorrectCount: nextLevelCorrectCount,
    bestStreak,
    currentProblem: problem,
    sceneItems,
    hippo: createHippo(),
    rngSeed: getSeed(),
  }
}

/** Restart from the same area, level, and seed. */
export function resetGame(state: GameState): GameState {
  return createInitialState(state.area, state.level, state.rngSeed)
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'gameover'
}

