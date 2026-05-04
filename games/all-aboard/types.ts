export type GamePhase = 'start' | 'playing' | 'end'

export type Pose = 'idle' | 'hand-up' | 'arm-rotating' | 'both-arms-up' | 'bouncing'

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

export interface SteamPuff {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

export interface WheelRotation {
  angle: number
  speed: number
}

export interface TrainCar {
  offsetX: number
  bobPhase: number
}

export interface GameState {
  phase: GamePhase
  trainX: number
  trainSpeed: number
  targetTrainX: number
  chuggaCount: number
  totalDistance: number
  whistleTriggered: boolean
  whistleCooldown: number
  armRotateCooldown: number
  chuggingActive: boolean
  chuggingTimer: number
  steamPuffs: SteamPuff[]
  wheels: WheelRotation[]
  globalTime: number
  score: number
  trips: number
  announcedAllAboard: boolean
  bouncingActive: boolean
  turboBoost: number
  trainCars: TrainCar[]
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
  gravity: number
}