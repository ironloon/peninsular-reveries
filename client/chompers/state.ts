import {
  ARENA_MAX_X,
  ARENA_MIN_X,
  CHOMP_DURATION_MS,
  CHOMP_REACH,
  FRUIT_DEFINITIONS,
  FRUIT_KINDS,
  HIPPO_START_X,
  HIPPO_Y,
  ROUND_TIME_MS,
  START_LIVES,
  ZEN_ROUND_ITEMS,
} from './types.js'
import type { ChompResult, FallingItem, FruitKind, GameMode, GameState, HippoState, TickResult } from './types.js'

const OPENING_PATTERN: ReadonlyArray<Pick<FallingItem, 'kind' | 'x' | 'y' | 'speed' | 'rotation' | 'rotationSpeed'>> = [
  { kind: 'cherry', x: 26, y: 10, speed: 18, rotation: -8, rotationSpeed: -42 },
  { kind: 'apple', x: 50, y: 6, speed: 16, rotation: 4, rotationSpeed: 36 },
  { kind: 'orange', x: 75, y: 2, speed: 21, rotation: -2, rotationSpeed: 48 },
]

const INITIAL_SEED = 0x0c0ffee
const ITEM_START_Y = -10
const GROUND_Y = 106
const MAX_ITEMS = 18
const DEFAULT_ARENA_WIDTH = 640
const DEFAULT_ARENA_HEIGHT = 480
const CHOMP_HALF_WIDTH_RATIO = 0.035
const CHOMP_HALF_WIDTH_MIN_PX = 30.4
const CHOMP_HALF_WIDTH_MAX_PX = 43.2
const ITEM_MIN_X = 12
const ITEM_X_SPAN = 76
const SPAWN_PATH_BUFFER = 14
const SPAWN_PATH_LOOKAHEAD_Y = 54
const MAX_SPAWN_X_ATTEMPTS = 6
const FALLBACK_SPAWN_XS = [14, 28, 42, 58, 72, 86] as const

interface ArenaMetrics {
  readonly width: number
  readonly height: number
}

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
  if (mode === 'zen') {
    return 1_120
  }

  const base = mode === 'rush' ? 860 : 940
  return Math.max(260, base - (difficultyLevel - 1) * 120)
}

function getDifficultyLevel(mode: GameMode, elapsedMs: number): number {
  if (mode === 'zen') {
    return 1
  }

  return 1 + Math.min(elapsedMs / 40_000, 3)
}

function getModeWeight(kind: FruitKind, mode: GameMode): number {
  const definition = FRUIT_DEFINITIONS[kind]

  if (mode === 'rush') {
    return definition.rushWeight
  }

  if (mode === 'survival') {
    return definition.survivalWeight
  }

  return definition.zenWeight
}

function getWeights(mode: GameMode, difficultyLevel: number): ReadonlyArray<[FruitKind, number]> {
  if (mode === 'zen') {
    return FRUIT_KINDS.map((kind) => [kind, getModeWeight(kind, mode)] as const)
  }

  const hazardBoost = Math.max(0, Math.floor((difficultyLevel - 1) * 3))

  return FRUIT_KINDS.map((kind) => {
    if (kind === 'rotten') {
      return [kind, getModeWeight(kind, mode) + hazardBoost] as const
    }

    if (kind === 'bomb') {
      return [kind, mode === 'survival' ? getModeWeight(kind, mode) + hazardBoost : 0] as const
    }

    if (kind === 'star') {
      return [kind, Math.max(1, getModeWeight(kind, mode) - Math.floor(difficultyLevel / 2))] as const
    }

    return [kind, getModeWeight(kind, mode)] as const
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

function isHazardKind(kind: FruitKind): boolean {
  return FRUIT_DEFINITIONS[kind].hazard
}

function hasSpawnPathConflict(kind: FruitKind, x: number, items: readonly FallingItem[]): boolean {
  const nextItemIsHazard = isHazardKind(kind)

  return items.some((item) => {
    if (item.y > SPAWN_PATH_LOOKAHEAD_Y) {
      return false
    }

    if (isHazardKind(item.kind) === nextItemIsHazard) {
      return false
    }

    return Math.abs(item.x - x) < SPAWN_PATH_BUFFER
  })
}

function scoreSpawnX(kind: FruitKind, x: number, items: readonly FallingItem[]): number {
  let minDistance = Number.POSITIVE_INFINITY
  let conflictCount = 0

  for (const item of items) {
    if (item.y > SPAWN_PATH_LOOKAHEAD_Y) {
      continue
    }

    if (isHazardKind(item.kind) === isHazardKind(kind)) {
      continue
    }

    const distance = Math.abs(item.x - x)
    minDistance = Math.min(minDistance, distance)

    if (distance < SPAWN_PATH_BUFFER) {
      conflictCount += 1
    }
  }

  if (conflictCount === 0) {
    return Number.POSITIVE_INFINITY
  }

  return minDistance - conflictCount * SPAWN_PATH_BUFFER
}

function pickSpawnX(kind: FruitKind, items: readonly FallingItem[], x: number, seed: number): { x: number; seed: number } {
  let nextX = x
  let nextSeed = seed

  for (let attempt = 0; attempt < MAX_SPAWN_X_ATTEMPTS; attempt += 1) {
    if (!hasSpawnPathConflict(kind, nextX, items)) {
      return { x: nextX, seed: nextSeed }
    }

    const reroll = random(nextSeed)
    nextSeed = reroll.seed
    nextX = ITEM_MIN_X + reroll.value * ITEM_X_SPAN
  }

  let bestX = nextX
  let bestScore = scoreSpawnX(kind, nextX, items)

  for (const candidateX of FALLBACK_SPAWN_XS) {
    const candidateScore = scoreSpawnX(kind, candidateX, items)
    if (candidateScore > bestScore) {
      bestScore = candidateScore
      bestX = candidateX
    }
  }

  return { x: bestX, seed: nextSeed }
}

function getItemSpeed(mode: GameMode, difficultyLevel: number, speedRollValue: number): number {
  if (mode === 'zen') {
    return 14 + speedRollValue * 6
  }

  return 18 + difficultyLevel * 5 + speedRollValue * 9
}

function getRotationSpeed(mode: GameMode, difficultyLevel: number, rotationSpeedValue: number): number {
  const spinRange = mode === 'zen'
    ? 24
    : 36 + difficultyLevel * 18

  return (rotationSpeedValue * 2 - 1) * spinRange
}

function getInitialSpawnTimerMs(mode: GameMode): number {
  return mode === 'zen' ? getSpawnIntervalMs(mode, 1) : 720
}

function getTotalSpawnedItems(state: Pick<GameState, 'nextItemId'>): number {
  return state.nextItemId - 1
}

function canSpawnMoreItems(state: Pick<GameState, 'mode' | 'nextItemId'>): boolean {
  return state.mode !== 'zen' || getTotalSpawnedItems(state) < ZEN_ROUND_ITEMS
}

function isZenRoundComplete(state: Pick<GameState, 'mode' | 'nextItemId' | 'items'>): boolean {
  return state.mode === 'zen' && getTotalSpawnedItems(state) >= ZEN_ROUND_ITEMS && state.items.length === 0
}

function hasRoundEnded(state: Pick<GameState, 'mode' | 'timeRemainingMs' | 'lives' | 'nextItemId' | 'items'>): boolean {
  if (state.mode === 'rush') {
    return state.timeRemainingMs <= 0
  }

  if (state.mode === 'survival') {
    return state.lives <= 0
  }

  return isZenRoundComplete(state)
}

function createRandomItem(
  id: number,
  mode: GameMode,
  difficultyLevel: number,
  seed: number,
  items: readonly FallingItem[],
): { item: FallingItem; seed: number } {
  const kindPick = pickKind(mode, difficultyLevel, seed)
  const xRoll = random(kindPick.seed)
  const xPick = pickSpawnX(kindPick.kind, items, ITEM_MIN_X + xRoll.value * ITEM_X_SPAN, xRoll.seed)
  const speedRoll = random(xPick.seed)
  const rotationRoll = random(speedRoll.seed)
  const rotationSpeedRoll = random(rotationRoll.seed)

  return {
    item: {
      id,
      kind: kindPick.kind,
      x: xPick.x,
      y: ITEM_START_Y,
      speed: getItemSpeed(mode, difficultyLevel, speedRoll.value),
      rotation: -12 + rotationRoll.value * 24,
      rotationSpeed: getRotationSpeed(mode, difficultyLevel, rotationSpeedRoll.value),
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

function percentToPixels(percent: number, size: number): number {
  return (percent / 100) * size
}

function resolveArenaMetrics(metrics?: ArenaMetrics): ArenaMetrics {
  return {
    width: Math.max(metrics?.width ?? DEFAULT_ARENA_WIDTH, 1),
    height: Math.max(metrics?.height ?? DEFAULT_ARENA_HEIGHT, 1),
  }
}

function getChompHalfWidthPx(width: number): number {
  return clamp(width * CHOMP_HALF_WIDTH_RATIO, CHOMP_HALF_WIDTH_MIN_PX, CHOMP_HALF_WIDTH_MAX_PX)
}

function isCatchable(item: FallingItem, hippoX: number, hippoY: number, arenaMetrics?: ArenaMetrics): boolean {
  const { width, height } = resolveArenaMetrics(arenaMetrics)
  const distanceX = Math.abs(percentToPixels(item.x, width) - percentToPixels(hippoX, width))
  const distanceY = percentToPixels(hippoY, height) - percentToPixels(item.y, height)
  return distanceX <= getChompHalfWidthPx(width) && distanceY >= 0 && distanceY <= percentToPixels(CHOMP_REACH, height)
}

export function createInitialState(mode: GameMode): GameState {
  return {
    phase: 'playing',
    mode,
    score: 0,
    timeRemainingMs: mode === 'rush' ? ROUND_TIME_MS : 0,
    lives: mode === 'survival' ? START_LIVES : 0,
    items: createOpeningItems(),
    hippo: createHippoState(),
    spawnTimerMs: getInitialSpawnTimerMs(mode),
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
  if (!canSpawnMoreItems(state)) {
    return state
  }

  const created = createRandomItem(state.nextItemId, state.mode, state.difficultyLevel, state.rngSeed, state.items)
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
  const difficultyLevel = getDifficultyLevel(state.mode, elapsedMs)
  const timeRemainingMs = state.mode === 'rush'
    ? Math.max(0, state.timeRemainingMs - deltaMs)
    : state.timeRemainingMs
  const countdownWarnings = state.mode === 'rush'
    ? getCountdownWarnings(state.timeRemainingMs, timeRemainingMs)
    : []

  const hippo = tickHippo(state.hippo, deltaMs)
  const items = state.items.map((item) => ({
    ...item,
    y: item.y + item.speed * (deltaMs / 1000),
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

  while (!hasRoundEnded(nextState) && nextState.spawnTimerMs <= 0 && nextState.items.length < MAX_ITEMS && nextState.phase === 'playing' && canSpawnMoreItems(nextState)) {
    nextState = spawnItem(nextState)
  }

  if (hasRoundEnded(nextState)) {
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

export function attemptChomp(state: GameState, arenaMetrics?: ArenaMetrics): ChompResult {
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
    .filter((item) => isCatchable(item, state.hippo.x, state.hippo.y, arenaMetrics))
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

  const phase = hasRoundEnded({
    ...state,
    lives,
    timeRemainingMs: state.timeRemainingMs,
    nextItemId: state.nextItemId,
    items: remainingItems,
  })
    ? 'gameover'
    : state.phase

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