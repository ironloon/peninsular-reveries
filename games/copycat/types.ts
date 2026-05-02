export type Pose = 'idle' | 'left-paw-up' | 'right-paw-up' | 'both-paws-up' | 'crouch' | 'jump'

export interface RoundConfig {
  round: number
  maxRounds: number
  durationMs: number
  bpm: number
  melodySeed: number[]
  catDelayMs: number
  thresholds: number[]
  songStyle: 'groove' | 'drive' | 'swing' | 'half' | 'break'
}

export interface Cat {
  id: string
  x: number
  y: number
  scale: number
  tint: number
  pose: Pose
  delayMs: number
  joinTime: number
}

export interface DanceState {
  phase: 'start' | 'dancing' | 'complete'
  cats: Cat[]
  poseHistory: Array<{ pose: Pose; timestamp: number }>
  songProgress: number
  lastPoseTime: number
  round: number
  maxRounds: number
  config: RoundConfig
}
