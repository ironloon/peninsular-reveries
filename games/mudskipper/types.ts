export type GamePhase = 'start' | 'playing' | 'gameover' | 'draining'

export interface MotionBody {
  id: number
  normalizedX: number
  normalizedY: number
  spreadX: number
  spreadY: number
  pixelCount: number
  active: boolean
  jumping: boolean
  jumpPhase: 'idle' | 'rising' | 'falling' | 'landing'
}

export interface MudskipperState {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  scale: number
  tint: number
  facingRight: boolean
  jumpPhase: 'idle' | 'rising' | 'falling' | 'landing'
  jumpProgress: number
  landSquash: number
  blinkTimer: number
  blinkState: boolean
  idleOffset: number
}

export interface SplashParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: number
}

export interface MudState {
  level: number
  targetLevel: number
  maxLevel: number
  wavePhase: number
  drainSpeed: number
}

export interface GameState {
  phase: GamePhase
  mudskippers: MudskipperState[]
  particles: SplashParticle[]
  mud: MudState
  time: number
  drainTimer: number
  lastJumpTime: number
}
