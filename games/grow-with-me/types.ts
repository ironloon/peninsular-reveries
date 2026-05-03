export type GamePhase = 'start' | 'playing' | 'celebrating'

export type WeatherType = 'sunny' | 'cloudy' | 'rainy'

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export type PlantStage = 'seed' | 'sprout' | 'growing' | 'bud' | 'bloom' | 'fruiting'

export interface MotionZone {
  id: number
  normalizedX: number
  normalizedY: number
  spreadX: number
  spreadY: number
  pixelCount: number
  active: boolean
  velocityY: number
}

export interface PlantState {
  id: number
  lane: number
  stage: PlantStage
  growthProgress: number
  heightPx: number
  targetHeightPx: number
  growthMultiplier: number
  rainBoostTimer: number
  swayOffset: number
  colorSeed: number
}

export interface RainDrop {
  x: number
  y: number
  speed: number
  length: number
  opacity: number
}

export interface LeafParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: number
  rotation: number
  rotSpeed: number
}

export interface SparkleParticle {
  x: number
  y: number
  life: number
  maxLife: number
  size: number
  color: number
}

export interface DayNightState {
  timeMs: number
  cycleLengthMs: number
  timeOfDay: TimeOfDay
  skyBrightness: number // 0 (darkest night) to 1 (brightest day)
}

export interface WeatherState {
  type: WeatherType
  timerMs: number
  durationMs: number
  rainIntensity: number // 0-1
  nextWeatherIn: number
}

export interface LaneState {
  activity: number // 0-1, how much motion activity in this lane
  lastActiveMs: number
}

export interface GameState {
  phase: GamePhase
  plants: PlantState[]
  rainDrops: RainDrop[]
  leafParticles: LeafParticle[]
  sparkleParticles: SparkleParticle[]
  dayNight: DayNightState
  weather: WeatherState
  lanes: LaneState[]
  moistureLevel: number // 0-1, accumulated water for growth boost
  rainBoostDecay: number // how quickly the rain boost fades
  totalBloomed: number
  time: number
  nextPlantId: number
  harvestFlash: number // 0-1, flash on harvest
  soilMoistureMap: number[] // per-lane moisture
}