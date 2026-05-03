export type GamePhase = 'start' | 'playing' | 'gameover'

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
  x: number
  y: number
  vy: number
  scale: number
  facingRight: boolean
  jumpPhase: 'idle' | 'rising' | 'falling' | 'landing'
  jumpProgress: number
  landSquash: number
  blinkTimer: number
  blinkState: boolean
  idleOffset: number
}

export interface MudSplatter {
  id: string
  x: number
  y: number
  radiusX: number
  radiusY: number
  rotation: number
  color: number
  alpha: number
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
  wavePhase: number
}

export interface GameState {
  phase: GamePhase
  mudskipper: MudskipperState
  particles: SplashParticle[]
  splatters: MudSplatter[]
  mud: MudState
  coverage: number
  time: number
  lastJumpTime: number
  needsSplash: boolean
}