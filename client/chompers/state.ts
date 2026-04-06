import type { Area, AreaLevel, FrenzyConfig, FrenzyState, GameState, HippoState, NpcHippo } from './types.js'
import { POINTS_FOR_AREA, START_LIVES, TOTAL_ROUNDS } from './types.js'
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
    rngSeed: getSeed(),
    mode: 'normal',
    frenzy: null,
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

  const [rng, getSeed] = seededRng(state.rngSeed)
  const problem = generateProblem(state.area, state.level, rng)
  const sceneItems = buildSceneItems(problem, state.area, rng)

  return {
    ...state,
    phase: 'playing',
    round: state.round + 1,
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

// ── Frenzy helpers ────────────────────────────────────────────────────────────

const NPC_POSITIONS: Record<1 | 3 | 5, Array<{ x: number; y: number }>> = {
  1: [{ x: 80, y: 85 }],
  3: [
    { x: 20, y: 85 },
    { x: 80, y: 85 },
    { x: 50, y: 20 },
  ],
  5: [
    { x: 20, y: 85 },
    { x: 80, y: 85 },
    { x: 15, y: 20 },
    { x: 85, y: 20 },
    { x: 50, y: 50 },
  ],
}

const NPC_ACCURACIES: Record<1 | 3 | 5, number[]> = {
  1: [0.75],
  3: [0.65, 0.75, 0.85],
  5: [0.6, 0.65, 0.75, 0.85, 0.9],
}

export function createNpcHippos(config: FrenzyConfig): NpcHippo[] {
  const positions = NPC_POSITIONS[config.npcCount]
  const accuracies = NPC_ACCURACIES[config.npcCount]
  return positions.map((pos, i) => ({
    id: `npc-${i}`,
    color: config.npcColors[i] ?? '#888888',
    position: pos,
    targetFruitIndex: null,
    targetIsCorrect: false,
    chompProgress: 0,
    score: 0,
    teamId: config.teamMode === 'ffa' ? null : i % 2 === 0 ? 'b' : ('a' as 'a' | 'b'),
    accuracy: accuracies[i],
    startDelayMs: 200 * (i + 1),
  }))
}

export function npcSelectTarget(
  npc: NpcHippo,
  fruitCount: number,
  correctIndex: number,
  rng: () => number,
): { fruitIndex: number; isCorrect: boolean } {
  if (rng() < npc.accuracy) {
    return { fruitIndex: correctIndex, isCorrect: true }
  }
  const nonCorrect: number[] = []
  for (let i = 0; i < fruitCount; i++) {
    if (i !== correctIndex) nonCorrect.push(i)
  }
  if (nonCorrect.length === 0) {
    return { fruitIndex: correctIndex, isCorrect: true }
  }
  const raw = Math.floor(rng() * nonCorrect.length)
  const idx = Math.min(raw, nonCorrect.length - 1)
  return { fruitIndex: nonCorrect[idx], isCorrect: false }
}

export function tickNpcProgress(npc: NpcHippo, deltaMs: number, adaptiveDifficulty: number): NpcHippo {
  if (npc.startDelayMs > 0) {
    return { ...npc, startDelayMs: Math.max(0, npc.startDelayMs - deltaMs) }
  }
  if (npc.targetFruitIndex === null) {
    return npc
  }
  const speed = 0.0004 / adaptiveDifficulty
  const newProgress = Math.min(1, npc.chompProgress + speed * deltaMs)
  return { ...npc, chompProgress: newProgress }
}

export function updateAdaptiveDifficulty(state: FrenzyState): number {
  const wins = state.playerWins
  const winRate = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0.5
  let next = state.adaptiveDifficulty
  if (winRate > 0.7) {
    next = state.adaptiveDifficulty - 0.05
  } else if (winRate < 0.4) {
    next = state.adaptiveDifficulty + 0.05
  }
  return Math.min(1.5, Math.max(0.5, next))
}

export function getRoundTimerMax(level: 1 | 2 | 3): number {
  if (level === 1) return 8000
  if (level === 2) return 6000
  return 4000
}

export function tickRoundTimer(frenzy: FrenzyState, deltaMs: number): FrenzyState {
  return { ...frenzy, roundTimer: Math.max(0, frenzy.roundTimer - deltaMs) }
}

export function resolveFrenzyRound(
  frenzy: FrenzyState,
  playerChoice: { fruitIndex: number; isCorrect: boolean } | null,
  firstNpcId: string | null,
): { updatedFrenzy: FrenzyState; playerScored: boolean; npcScoredId: string | null; penaltyLives: number } {
  let playerScored = false
  let npcScoredId: string | null = null
  let penaltyLives = 0
  let npcs = frenzy.npcs
  let playerWins = [...frenzy.playerWins]
  let teamScores = { ...frenzy.teamScores }
  const isTeamMode = frenzy.config.teamMode === 'team'

  if (playerChoice !== null && playerChoice.isCorrect && firstNpcId === null) {
    playerScored = true
    playerWins.push(1)
    if (isTeamMode) {
      teamScores = { ...teamScores, a: teamScores.a + 1 }
    }
  } else if (firstNpcId !== null) {
    npcScoredId = firstNpcId
    npcs = frenzy.npcs.map((n) => (n.id === firstNpcId ? { ...n, score: n.score + 1 } : n))
    const scoringNpc = frenzy.npcs.find((n) => n.id === firstNpcId)
    if (isTeamMode && scoringNpc?.teamId === 'a') {
      playerWins.push(0.5)
      teamScores = { ...teamScores, a: teamScores.a + 1 }
    } else {
      playerWins.push(0)
      if (isTeamMode && scoringNpc?.teamId === 'b') {
        teamScores = { ...teamScores, b: teamScores.b + 1 }
      }
    }
  } else if (playerChoice === null) {
    playerWins.push(0)
  } else {
    penaltyLives = 1
    playerWins.push(0)
  }

  if (playerWins.length > 10) {
    playerWins = playerWins.slice(-10)
  }

  const resetNpcs = npcs.map((n, i) => ({
    ...n,
    targetFruitIndex: null,
    chompProgress: 0,
    startDelayMs: 200 * (i + 1),
  }))

  const partialFrenzy: FrenzyState = {
    ...frenzy,
    npcs: resetNpcs,
    playerWins,
    teamScores,
  }

  const newAdaptiveDifficulty = updateAdaptiveDifficulty(partialFrenzy)

  const updatedFrenzy: FrenzyState = {
    ...partialFrenzy,
    adaptiveDifficulty: newAdaptiveDifficulty,
  }

  return { updatedFrenzy, playerScored, npcScoredId, penaltyLives }
}

