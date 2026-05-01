export type Pose = 'idle' | 'left-paw-up' | 'right-paw-up' | 'both-paws-up' | 'crouch' | 'jump'

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
}
