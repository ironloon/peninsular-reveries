export type GamePhase = 'start' | 'playing' | 'end'

export interface Block {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: number
  resting: boolean
  falling: boolean
  destroyed: boolean
  vx: number
  vy: number
  rotation: number
  angularVel: number
  opacity: number
  damageTimer: number
  towerIndex: number
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

export interface Tower {
  id: number
  blocks: string[]
  destroyed: boolean
}

export interface MotionBody {
  id: number
  normalizedX: number
  normalizedY: number
  spreadX: number
  spreadY: number
  pixelCount: number
  active: boolean
  armsUp: boolean
}

export interface BodyPosition {
  x: number
  y: number
  spreadX: number
  spreadY: number
}

export interface GameState {
  phase: GamePhase
  blocks: Block[]
  towers: Tower[]
  particles: Particle[]
  score: number
  towersDestroyed: number
  wave: number
  blocksDestroyedThisWave: number
  blocksPerWave: number
  gameTime: number
  waveTime: number
  smashCooldown: number
  comboCount: number
  comboTimer: number
  lastSmashTime: number
}