export const AREAS = ['matching', 'counting', 'addition', 'subtraction', 'multiplication', 'division'] as const
export type Area = (typeof AREAS)[number]
export type AreaLevel = 1 | 2 | 3

export const AREA_LEVEL_RANGES: Record<Area, Record<AreaLevel, { min: number; max: number }>> = {
  matching: {
    1: { min: 1, max: 5 },   // L1: pre-K — Clements & Sarama: cardinality ages 3-5
    2: { min: 1, max: 10 },  // L2: K — CCSS K.CC: count to 100; NCTM Pre-K-2
    3: { min: 1, max: 20 },  // L3: K-1 — CCSS 1.NBT: extend counting sequence
  },
  counting: {
    1: { min: 1, max: 5 },   // L1: pre-K — Clements & Sarama: one-to-one correspondence
    2: { min: 1, max: 10 },  // L2: K — CCSS K.CC.4: counting = cardinality
    3: { min: 1, max: 15 },  // L3: K-1 — NCTM Pre-K-2: connect counting to quantity
  },
  addition: {
    1: { min: 1, max: 4 },   // L1: K — CCSS K.OA: addition within 5
    2: { min: 1, max: 9 },   // L2: K-1 — NCTM: whole number sense (sums ≤ 10)
    3: { min: 1, max: 10 },  // L3: 1-2 — NMAP: fluency through 18 (sums ≤ 20)
  },
  subtraction: {
    1: { min: 2, max: 5 },   // L1: K — CCSS K.OA: subtraction within 5
    2: { min: 2, max: 10 },  // L2: K-1 — NCTM fluency; NMAP facts through 18
    3: { min: 2, max: 20 },  // L3: 1-2 — CCSS 2.OA: add/subtract within 20
  },
  multiplication: {
    1: { min: 2, max: 5 },   // L1: Grade 3 — CCSS 3.OA: multiply within 100
    2: { min: 2, max: 9 },   // L2: Grade 3-4 — NCTM Focal Points: Grade 3 mult/div
    3: { min: 2, max: 12 },  // L3: Grade 4-5 — NMAP: automatic recall of mult facts
  },
  division: {
    1: { min: 2, max: 5 },   // L1: Grade 3 — CCSS 3.OA: divide within 100
    2: { min: 2, max: 9 },   // L2: Grade 3-4 — NCTM: fluency with basic combinations
    3: { min: 2, max: 12 },  // L3: Grade 4-5 — NMAP: automatic recall of division facts
  },
}

export type GamePhase = 'playing' | 'chomping' | 'feedback' | 'gameover'

export type GameMode = 'normal' | 'frenzy'
export type FrenzyTeamMode = 'ffa' | 'team'

export interface FrenzyConfig {
  npcCount: 1 | 3 | 5
  teamMode: FrenzyTeamMode
  playerColor: string
  npcColors: string[]
}

export interface NpcHippo {
  id: string
  color: string
  position: { x: number; y: number }
  targetFruitIndex: number | null
  targetIsCorrect: boolean
  chompProgress: number
  score: number
  teamId: 'a' | 'b' | null
  accuracy: number
  startDelayMs: number
}

export interface FrenzyState {
  config: FrenzyConfig
  npcs: NpcHippo[]
  roundTimer: number
  roundTimerMax: number
  adaptiveDifficulty: number
  playerAnswerTimes: number[]
  playerWins: number[]
  teamScores: { a: number; b: number }
}

export interface Problem {
  readonly prompt: string
  readonly correctAnswer: number
  readonly operation: string
  readonly area: Area
  readonly countingObjects?: readonly string[]
}

export interface SceneItem {
  readonly id: string
  readonly value: number
  readonly emoji: string
  readonly x: number
  readonly y: number
  readonly isCorrect: boolean
}

export interface HippoState {
  readonly x: number
  readonly y: number
  readonly targetItemId: string | null
  readonly chompPhase: 'idle' | 'extending' | 'retracting'
  readonly neckExtension: number
}

export interface GameState {
  readonly phase: GamePhase
  readonly area: Area
  readonly level: AreaLevel
  readonly currentProblem: Problem
  readonly sceneItems: readonly SceneItem[]
  readonly score: number
  readonly round: number
  readonly totalRounds: number
  readonly lives: number
  readonly streak: number
  readonly bestStreak: number
  readonly hippo: HippoState
  readonly correctCount: number
  readonly rngSeed: number
  readonly mode: GameMode
  readonly frenzy: FrenzyState | null
}

export interface ScenePosition {
  readonly x: number
  readonly y: number
}

export const TOTAL_ROUNDS = 10
export const START_LIVES = 3

export const POINTS_FOR_AREA: Record<Area, number> = {
  matching: 1,
  counting: 1,
  addition: 1,
  subtraction: 2,
  multiplication: 3,
  division: 3,
}

export const SCENE_ITEM_COUNTS: Record<Area, number> = {
  matching: 6,
  counting: 6,
  addition: 6,
  subtraction: 6,
  multiplication: 6,
  division: 6,
}

/**
 * Static position grids for 6, 7, 8, 9 items (percentage-based x/y).
 * Arena sky zone: y 10–45%, ground zone: y 55–85%.
 * Hippo occupies the left edge; items stay at x >= 20%.
 * Each layout guarantees >= 12% x or >= 12% y separation between all peers.
 */
export const BASE_LAYOUTS: Record<number, readonly ScenePosition[]> = {
  6: [
    { x: 32, y: 15 },
    { x: 55, y: 12 },
    { x: 78, y: 18 },
    { x: 28, y: 68 },
    { x: 56, y: 62 },
    { x: 82, y: 68 },
  ],
  7: [
    { x: 26, y: 15 },
    { x: 52, y: 12 },
    { x: 78, y: 17 },
    { x: 26, y: 65 },
    { x: 47, y: 72 },
    { x: 68, y: 65 },
    { x: 88, y: 72 },
  ],
  8: [
    { x: 24, y: 16 },
    { x: 44, y: 12 },
    { x: 64, y: 18 },
    { x: 84, y: 14 },
    { x: 24, y: 72 },
    { x: 44, y: 65 },
    { x: 64, y: 72 },
    { x: 84, y: 65 },
  ],
  9: [
    { x: 24, y: 14 },
    { x: 44, y: 18 },
    { x: 64, y: 12 },
    { x: 84, y: 16 },
    { x: 22, y: 68 },
    { x: 39, y: 75 },
    { x: 57, y: 65 },
    { x: 74, y: 72 },
    { x: 88, y: 65 },
  ],
}

export const FRUIT_POOL = ['🍒', '🍎', '🍊', '🍇', '🍋', '🍑', '🍓', '🫐', '🥝', '🍌'] as const

export const FRENZY_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'] as const
