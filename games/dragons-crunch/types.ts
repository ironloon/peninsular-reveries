export type GamePhase = 'start' | 'playing' | 'celebrating' | 'end'

export interface DragonState {
  id: number
  x: number
  y: number
  scale: number
  tint: number
  chomping: boolean
  breathingFire: boolean
  fireIntensity: number
  lastChomp: number
}

export interface FoodItem {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  value: number
  color: number
  eaten: boolean
  landed?: boolean
  spawnTime: number
  announced?: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: number
  size: number
}

export interface GameState {
  phase: GamePhase
  dragons: DragonState[]
  foods: FoodItem[]
  particles: Particle[]
  score: number
  foodSpawned: number
  maxFood: number
  celebrationTimeLeft: number
  celebrationDuration: number
  lastFoodSpawnTime: number
  gameTime: number
  landedFood: string[]
}

export interface MotionBody {
  id: number
  normalizedX: number // 0-1 across frame width (mirrored for display)
  normalizedY: number // 0-1 across frame height (0=top, 1=bottom)
  spreadX: number
  spreadY: number
  pixelCount: number
  active: boolean
  armsUp: boolean
}
