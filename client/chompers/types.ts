export const GAME_MODES = ['rush', 'survival'] as const
export type GameMode = (typeof GAME_MODES)[number]

export type GamePhase = 'playing' | 'gameover'

export const FRUIT_KINDS = ['cherry', 'apple', 'orange', 'grapes', 'star', 'rotten', 'bomb'] as const
export type FruitKind = (typeof FRUIT_KINDS)[number]

export interface FruitDefinition {
  readonly kind: FruitKind
  readonly label: string
  readonly emoji: string
  readonly points: number
  readonly hazard: boolean
  readonly rushWeight: number
  readonly survivalWeight: number
}

export const FRUIT_DEFINITIONS: Record<FruitKind, FruitDefinition> = {
  cherry: {
    kind: 'cherry',
    label: 'Cherry',
    emoji: '🍒',
    points: 1,
    hazard: false,
    rushWeight: 28,
    survivalWeight: 24,
  },
  apple: {
    kind: 'apple',
    label: 'Apple',
    emoji: '🍎',
    points: 2,
    hazard: false,
    rushWeight: 24,
    survivalWeight: 22,
  },
  orange: {
    kind: 'orange',
    label: 'Orange',
    emoji: '🍊',
    points: 3,
    hazard: false,
    rushWeight: 18,
    survivalWeight: 18,
  },
  grapes: {
    kind: 'grapes',
    label: 'Grapes',
    emoji: '🍇',
    points: 5,
    hazard: false,
    rushWeight: 10,
    survivalWeight: 10,
  },
  star: {
    kind: 'star',
    label: 'Golden star',
    emoji: '⭐',
    points: 10,
    hazard: false,
    rushWeight: 2,
    survivalWeight: 2,
  },
  rotten: {
    kind: 'rotten',
    label: 'Rotten fruit',
    emoji: '🥀',
    points: -3,
    hazard: true,
    rushWeight: 5,
    survivalWeight: 8,
  },
  bomb: {
    kind: 'bomb',
    label: 'Bomb',
    emoji: '💣',
    points: 0,
    hazard: true,
    rushWeight: 0,
    survivalWeight: 6,
  },
}

export interface FallingItem {
  readonly id: number
  readonly kind: FruitKind
  readonly x: number
  readonly y: number
  readonly speed: number
  readonly rotation: number
  readonly rotationSpeed: number
}

export interface HippoState {
  readonly x: number
  readonly y: number
  readonly targetX: number
  readonly chomping: boolean
  readonly chompTimerMs: number
  readonly chompProgress: number
  readonly neckExtension: number
}

export interface GameState {
  readonly phase: GamePhase
  readonly mode: GameMode
  readonly score: number
  readonly timeRemainingMs: number
  readonly lives: number
  readonly items: readonly FallingItem[]
  readonly hippo: HippoState
  readonly spawnTimerMs: number
  readonly difficultyLevel: number
  readonly elapsedMs: number
  readonly itemsChomped: number
  readonly itemsMissed: number
  readonly combo: number
  readonly bestCombo: number
  readonly nextItemId: number
  readonly rngSeed: number
}

export interface TickResult {
  readonly state: GameState
  readonly missedItems: readonly FallingItem[]
  readonly countdownWarnings: readonly number[]
}

export interface ChompResult {
  readonly state: GameState
  readonly hitItem: FallingItem | null
  readonly scoreDelta: number
  readonly lifeDelta: number
  readonly comboBroken: boolean
}

export const ROUND_TIME_MS = 60_000
export const START_LIVES = 3
export const CHOMP_DURATION_MS = 280
export const HIPPO_START_X = 50
export const HIPPO_Y = 90
export const ARENA_MIN_X = 10
export const ARENA_MAX_X = 90
export const CHOMP_REACH = 62
export const CHOMP_HALF_WIDTH = 10