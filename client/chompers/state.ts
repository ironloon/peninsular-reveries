import {
  ARENA_MAX_X,
  ARENA_MIN_X,
  CHOMP_DURATION_MS,
  CHOMP_HALF_WIDTH,
  CHOMP_REACH,
  FRUIT_DEFINITIONS,
  FRUIT_KINDS,
  HIPPO_START_X,
  HIPPO_Y,
  ROUND_TIME_MS,
  START_LIVES,
} from './types.js'
import type { ChompResult, FallingItem, FruitKind, GameMode, GameState, HippoState, TickResult } from './types.js'

const OPENING_PATTERN: ReadonlyArray<Pick<FallingItem, 'kind' | 'x' | 'y' | 'speed' | 'rotation' | 'rotationSpeed'>> = [
  { kind: 'cherry', x: 26, y: 18, speed: 18, rotation: -8, rotationSpeed: -42 },
  { kind: 'apple', x: 50, y: 58, speed: 16, rotation: 4, rotationSpeed: 36 },
  { kind: 'orange', x: 75, y: 8, speed: 21, rotation: -2, rotationSpeed: 48 },
]

const INITIAL_SEED = 0x0c0ffee
const ITEM_START_Y = -10
const GROUND_Y = 106
const MAX_ITEMS = 18

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function advanceSeed(seed: number): number {
  return (seed * 1_664_525 + 1_013_904_223) >>> 0
}

function random(seed: number): { seed: number; value: number } {
  const nextSeed = advanceSeed(seed)
  return { seed: nextSeed, value: nextSeed / 0x1_0000_0000 }
}

function createOpeningItems(): readonly FallingItem[] {
  return OPENING_PATTERN.map((item, index) => ({
    id: index + 1,
    kind: item.kind,
    x: item.x,
    y: item.y,
    speed: item.speed,
    rotation: item.rotation,
    rotationSpeed: item.rotationSpeed,
  }))
}

function createHippoState(): HippoState {
  return {
    x: HIPPO_START_X,
    y: HIPPO_Y,
    targetX: HIPPO_START_X,
    chomping: false,
    chompTimerMs: 0,
    chompProgress: 0,
    neckExtension: 0,
  }
}

function getSpawnIntervalMs(mode: GameMode, difficultyLevel: number): number {
  const base = mode === 'rush' ? 860 : 940
  return Math.max(260, base - (difficultyLevel - 1) * 120)
}

function getDifficultyLevel(elapsedMs: number): number {
  return 1 + Math.min(elapsedMs / 18_000, 3)
}

function getWeights(mode: GameMode, difficultyLevel: number): ReadonlyArray<[FruitKind, number]> {
  const hazardBoost = Math.max(0, Math.floor((difficultyLevel - 1) * 3))

  return FRUIT_KINDS.map((kind) => {
    const def = FRUIT_DEFINITIONS[kind]
    if (kind === 'rotten') {
      return [kind, def[mode === 'rush' ? 'rushWeight' : 'survivalWeight'] + hazardBoost] as const
    }

    if (kind === 'bomb') {
      return [kind, mode === 'survival' ? def.survivalWeight + hazardBoost : 0] as const
    }

    if (kind === 'star') {
      return [kind, Math.max(1, def[mode === 'rush' ? 'rushWeight' : 'survivalWeight'] - Math.floor(difficultyLevel / 2))] as const
    }

    return [kind, def[mode === 'rush' ? 'rushWeight' : 'survivalWeight']] as const
  })
}

function pickKind(mode: GameMode, difficultyLevel: number, seed: number): { kind: FruitKind; seed: number } {
  const weights = getWeights(mode, difficultyLevel)
  const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0)
  const roll = random(seed)
  let cursor = roll.value * totalWeight

  for (const [kind, weight] of weights) {
    cursor -= weight
    if (cursor <= 0) {
      return { kind, seed: roll.seed }
    }
  }

  return { kind: 'apple', seed: roll.seed }
}

function createRandomItem(id: number, mode: GameMode, difficultyLevel: number, seed: number): { item: FallingItem; seed: number } {
  const kindPick = pickKind(mode, difficultyLevel, seed)
  const xRoll = random(kindPick.seed)
  const speedRoll = random(xRoll.seed)
  const rotationRoll = random(speedRoll.seed)
  const rotationSpeedRoll = random(rotationRoll.seed)

  return {
    item: {
      id,
      kind: kindPick.kind,
      x: 12 + xRoll.value * 76,
      y: ITEM_START_Y,
      speed: 18 + difficultyLevel * 5 + speedRoll.value * 9,
      rotation: -12 + rotationRoll.value * 24,
      rotationSpeed: (rotationSpeedRoll.value * 2 - 1) * (36 + difficultyLevel * 18),
    },
    seed: rotationSpeedRoll.seed,
  }
}

function tickHippo(hippo: HippoState, deltaMs: number): HippoState {
  const followAmount = clamp(deltaMs / 70, 0, 1)
  const x = hippo.x + (hippo.targetX - hippo.x) * followAmount
  const chompTimerMs = Math.max(0, hippo.chompTimerMs - deltaMs)
  const chomping = chompTimerMs > 0
  const chompProgress = chomping ? 1 - chompTimerMs / CHOMP_DURATION_MS : 0
  const neckExtension = chomping ? Math.sin(chompProgress * Math.PI) : 0

  return {
    ...hippo,
    x,
    chomping,
    chompTimerMs,
    chompProgress,
    neckExtension,
  }
}

function getCountdownWarnings(previousMs: number, nextMs: number): number[] {
  if (previousMs <= 0 || nextMs <= 0) return []

  const warnings: number[] = []
  const previousSeconds = Math.ceil(previousMs / 1000)
  const nextSeconds = Math.ceil(nextMs / 1000)

  for (let second = previousSeconds - 1; second >= nextSeconds; second -= 1) {
    if (second <= 10 && second >= 1) {
      warnings.push(second)
    }
  }

  return warnings
}

function isCollectible(kind: FruitKind): boolean {
  return !FRUIT_DEFINITIONS[kind].hazard
}

function isCatchable(item: FallingItem, hippoX: number, hippoY: number): boolean {
  const distanceX = Math.abs(item.x - hippoX)
  const distanceY = hippoY - item.y
  return distanceX <= CHOMP_HALF_WIDTH && distanceY >= 0 && distanceY <= CHOMP_REACH
}

export function createInitialState(mode: GameMode): GameState {
  return {
    phase: 'playing',
    mode,
    score: 0,
    timeRemainingMs: ROUND_TIME_MS,
    lives: START_LIVES,
    items: createOpeningItems(),
    hippo: createHippoState(),
    spawnTimerMs: 720,
    difficultyLevel: 1,
    elapsedMs: 0,
    itemsChomped: 0,
    itemsMissed: 0,
    combo: 0,
    bestCombo: 0,
    nextItemId: OPENING_PATTERN.length + 1,
    rngSeed: INITIAL_SEED,
  }
}

export function moveHippo(state: GameState, x: number): GameState {
  const clampedX = clamp(x, ARENA_MIN_X, ARENA_MAX_X)
  return {
    ...state,
    hippo: {
      ...state.hippo,
      x: clampedX,
      targetX: clampedX,
    },
  }
}

export function nudgeHippo(state: GameState, delta: number): GameState {
  return moveHippo(state, state.hippo.targetX + delta)
}

export function spawnItem(state: GameState): GameState {
  const created = createRandomItem(state.nextItemId, state.mode, state.difficultyLevel, state.rngSeed)
  return {
    ...state,
    items: [...state.items, created.item],
    nextItemId: state.nextItemId + 1,
    rngSeed: created.seed,
    spawnTimerMs: getSpawnIntervalMs(state.mode, state.difficultyLevel),
  }
}

export function tickState(state: GameState, deltaMs: number): TickResult {
  if (state.phase !== 'playing') {
    return { state, missedItems: [], countdownWarnings: [] }
  }

  const elapsedMs = state.elapsedMs + deltaMs
  const difficultyLevel = getDifficultyLevel(elapsedMs)
  const timeRemainingMs = state.mode === 'rush'
    ? Math.max(0, state.timeRemainingMs - deltaMs)
    : state.timeRemainingMs
  const countdownWarnings = state.mode === 'rush'
    ? getCountdownWarnings(state.timeRemainingMs, timeRemainingMs)
    : []

  const hippo = tickHippo(state.hippo, deltaMs)
  const items = state.items.map((item) => ({
    ...item,
    y: item.y + item.speed * difficultyLevel * (deltaMs / 1000),
    rotation: item.rotation + item.rotationSpeed * (deltaMs / 1000),
  }))

  const missedItems = items.filter((item) => item.y >= GROUND_Y)
  const missedCollectibles = missedItems.filter((item) => isCollectible(item.kind))
  const remainingItems = items.filter((item) => item.y < GROUND_Y)
  const lives = state.mode === 'survival'
    ? Math.max(0, state.lives - missedCollectibles.length)
    : state.lives

  let nextState: GameState = {
    ...state,
    phase: state.phase,
    timeRemainingMs,
    lives,
    items: remainingItems,
    hippo,
    spawnTimerMs: state.spawnTimerMs - deltaMs,
    difficultyLevel,
    elapsedMs,
    itemsMissed: state.itemsMissed + missedItems.length,
    combo: missedItems.length > 0 ? 0 : state.combo,
  }

  const shouldEndRound = (state.mode === 'rush' && timeRemainingMs <= 0) || lives <= 0

  while (!shouldEndRound && nextState.spawnTimerMs <= 0 && nextState.items.length < MAX_ITEMS && nextState.phase === 'playing') {
    nextState = spawnItem(nextState)
  }

  if (shouldEndRound) {
    nextState = {
      ...nextState,
      phase: 'gameover',
    }
  }

  return {
    state: nextState,
    missedItems,
    countdownWarnings,
  }
}

export function attemptChomp(state: GameState): ChompResult {
  if (state.phase !== 'playing') {
    return {
      state,
      hitItem: null,
      scoreDelta: 0,
      lifeDelta: 0,
      comboBroken: false,
    }
  }

  const hitItem = [...state.items]
    .filter((item) => isCatchable(item, state.hippo.x, state.hippo.y))
    .sort((left, right) => right.y - left.y)[0] ?? null

  let score = state.score
  let lives = state.lives
  let combo = state.combo
  let bestCombo = state.bestCombo
  let itemsChomped = state.itemsChomped
  let scoreDelta = 0
  let lifeDelta = 0
  let comboBroken = false
  const remainingItems = hitItem
    ? state.items.filter((item) => item.id !== hitItem.id)
    : state.items

  if (hitItem) {
    const definition = FRUIT_DEFINITIONS[hitItem.kind]

    if (definition.hazard) {
      scoreDelta = definition.points
      score = Math.max(0, state.score + scoreDelta)
      combo = 0
      comboBroken = state.combo > 0
      if (hitItem.kind === 'bomb' && state.mode === 'survival') {
        lifeDelta = -1
        lives = Math.max(0, state.lives - 1)
      }
    } else {
      scoreDelta = definition.points
      score = state.score + scoreDelta
      combo = state.combo + 1
      bestCombo = Math.max(state.bestCombo, combo)
      itemsChomped = state.itemsChomped + 1
    }
  } else if (state.combo > 0) {
    combo = 0
    comboBroken = true
  }

  const phase = lives <= 0 ? 'gameover' : state.phase

  return {
    state: {
      ...state,
      phase,
      score,
      lives,
      items: remainingItems,
      combo,
      bestCombo,
      itemsChomped,
      hippo: {
        ...state.hippo,
        chomping: true,
        chompTimerMs: CHOMP_DURATION_MS,
        chompProgress: 0,
        neckExtension: 1,
      },
    },
    hitItem,
    scoreDelta,
    lifeDelta,
    comboBroken,
  }
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'gameover'
}