import type { MissionCrewProfile } from '../../app/data/mission-orbit-crew.js'

export const MISSION_SEQUENCE = [
  'countdown',
  'launch',
  'orbit-insertion',
  'high-earth-orbit',
  'trans-lunar-injection',
  'lunar-flyby',
  'return-coast',
  'service-module-jettison',
  'parachute-deploy',
  'splashdown',
] as const

export type MissionGameplayPhase = (typeof MISSION_SEQUENCE)[number]
export type MissionPhase = 'title' | MissionGameplayPhase | 'celebration'
export type PhaseMode = 'countdown' | 'hold' | 'timing' | 'auto'
export type BurnGrade = 'perfect' | 'good' | 'safe' | 'assist'

export interface TimingWindow {
  readonly perfectStart: number
  readonly perfectEnd: number
  readonly goodStart: number
  readonly goodEnd: number
}

export interface MissionPhaseDefinition {
  readonly id: MissionGameplayPhase
  readonly label: string
  readonly dayLabel: string
  readonly status: string
  readonly prompt: string
  readonly actionLabel: string
  readonly timingHint: string
  readonly mode: PhaseMode
  readonly briefingMs?: number
  readonly autoAdvanceMs?: number
  readonly assistAfterMs?: number
  readonly meterSpeed?: number
  readonly timingWindow?: TimingWindow
}

export interface BurnResult {
  readonly phase: MissionGameplayPhase
  readonly label: string
  readonly grade: BurnGrade
  readonly accuracy: number
  readonly score: number
  readonly detail: string
}

export interface GameState {
  readonly phase: MissionPhase
  readonly phaseIndex: number
  readonly phaseElapsedMs: number
  readonly missionElapsedMs: number
  readonly crew: readonly MissionCrewProfile[]
  readonly briefingActive: boolean
  readonly countdownValue: number
  readonly actionHeld: boolean
  readonly launchProgress: number
  readonly timingCursor: number
  readonly timingDirection: 1 | -1
  readonly timingLatched: boolean
  readonly burnResults: readonly BurnResult[]
  readonly outcomeText: string
  readonly outcomeGrade: BurnGrade | null
  readonly stopMoActive: boolean
  readonly phaseResolved: boolean
  readonly serviceModuleDetached: boolean
  readonly parachuteDeployed: boolean
  readonly missionComplete: boolean
}

export const TOTAL_GAMEPLAY_STEPS = MISSION_SEQUENCE.length

const PHASE_DEFINITIONS: readonly MissionPhaseDefinition[] = [
  {
    id: 'countdown',
    label: 'Final countdown',
    dayLabel: 'Flight Day 1',
    status: 'Pad 39B is live',
    prompt: 'Stand by. Main engines start at T minus 7, boosters ignite at T zero.',
    actionLabel: 'Countdown running',
    timingHint: 'Watch the clock. Liftoff comes at zero.',
    mode: 'countdown',
  },
  {
    id: 'launch',
    label: 'Ascent to orbit',
    dayLabel: 'Flight Day 1',
    status: 'SLS climb is under way',
    prompt: 'Hold the spacecraft, or hold the action control, to climb. Let go on the cue for main engine cutoff.',
    actionLabel: 'Hold to climb',
    timingHint: 'Hold steady. Let go on the bright cue.',
    mode: 'hold',
    briefingMs: 1600,
    assistAfterMs: 9000,
    timingWindow: {
      perfectStart: 0.79,
      perfectEnd: 0.92,
      goodStart: 0.68,
      goodEnd: 0.97,
    },
  },
  {
    id: 'orbit-insertion',
    label: 'Orbit raise burn',
    dayLabel: 'Flight Day 1',
    status: 'Orion is circling Earth',
    prompt: 'Tap the spacecraft on cue to raise perigee and settle into the test orbit.',
    actionLabel: 'Tap spacecraft',
    timingHint: 'Tap the spacecraft, or use the action control, on cue.',
    mode: 'timing',
    briefingMs: 2200,
    assistAfterMs: 7600,
    meterSpeed: 0.00035,
    timingWindow: {
      perfectStart: 0.44,
      perfectEnd: 0.6,
      goodStart: 0.3,
      goodEnd: 0.74,
    },
  },
  {
    id: 'high-earth-orbit',
    label: 'High Earth orbit checkout',
    dayLabel: 'Flight Day 1',
    status: 'Cabin checks are nominal',
    prompt: 'Orion coasts in high Earth orbit while the crew configures the spacecraft for deep space.',
    actionLabel: 'Coasting',
    timingHint: 'Coasting segment. Watch the trajectory settle.',
    mode: 'auto',
    briefingMs: 1800,
    autoAdvanceMs: 5200,
  },
  {
    id: 'trans-lunar-injection',
    label: 'Trans-lunar injection',
    dayLabel: 'Flight Day 2',
    status: 'Time to leave Earth orbit',
    prompt: 'Tap the spacecraft on cue to light the burn that sends Orion around the Moon on a free-return path.',
    actionLabel: 'Tap spacecraft',
    timingHint: 'One bright cue, one clean tap on the spacecraft.',
    mode: 'timing',
    briefingMs: 2400,
    assistAfterMs: 7600,
    meterSpeed: 0.00043,
    timingWindow: {
      perfectStart: 0.42,
      perfectEnd: 0.58,
      goodStart: 0.28,
      goodEnd: 0.72,
    },
  },
  {
    id: 'lunar-flyby',
    label: 'Lunar flyby',
    dayLabel: 'Flight Day 4',
    status: 'The Moon is filling the windows',
    prompt: 'Tap near closest approach for a small correction as the Moon bends the return trajectory home.',
    actionLabel: 'Tap spacecraft',
    timingHint: 'Hold for the cue, then tap the spacecraft once.',
    mode: 'timing',
    briefingMs: 2200,
    assistAfterMs: 7800,
    meterSpeed: 0.00039,
    timingWindow: {
      perfectStart: 0.46,
      perfectEnd: 0.64,
      goodStart: 0.32,
      goodEnd: 0.78,
    },
  },
  {
    id: 'return-coast',
    label: 'Return coast',
    dayLabel: 'Flight Day 7',
    status: 'Earth is back on the horizon',
    prompt: 'The free-return path is carrying Orion home. Recovery teams are already planning the splash zone.',
    actionLabel: 'Coasting',
    timingHint: 'Coasting segment. Watch Earth grow in the windows.',
    mode: 'auto',
    briefingMs: 1800,
    autoAdvanceMs: 5600,
  },
  {
    id: 'service-module-jettison',
    label: 'Entry interface',
    dayLabel: 'Flight Day 10',
    status: 'Re-entry heating is building',
    prompt: 'Tap the spacecraft on cue to jettison the service module before Orion commits to atmospheric entry.',
    actionLabel: 'Tap spacecraft',
    timingHint: 'Tap on cue before the heat ramps up.',
    mode: 'timing',
    briefingMs: 2200,
    assistAfterMs: 7000,
    meterSpeed: 0.00046,
    timingWindow: {
      perfectStart: 0.41,
      perfectEnd: 0.57,
      goodStart: 0.27,
      goodEnd: 0.71,
    },
  },
  {
    id: 'parachute-deploy',
    label: 'Parachute deploy',
    dayLabel: 'Flight Day 10',
    status: 'Ocean recovery is in range',
    prompt: 'Tap the spacecraft on cue to open the drogues and mains for the last leg down to the Pacific.',
    actionLabel: 'Tap spacecraft',
    timingHint: 'Hold for the cue, then open the parachutes.',
    mode: 'timing',
    briefingMs: 2200,
    assistAfterMs: 7000,
    meterSpeed: 0.00042,
    timingWindow: {
      perfectStart: 0.47,
      perfectEnd: 0.63,
      goodStart: 0.33,
      goodEnd: 0.77,
    },
  },
  {
    id: 'splashdown',
    label: 'Pacific splashdown',
    dayLabel: 'Flight Day 10',
    status: 'Recovery teams are moving in',
    prompt: 'The capsule is home. Recovery boats close in while Orion settles into the Pacific.',
    actionLabel: 'Recovery underway',
    timingHint: 'Watch the splash zone while recovery moves in.',
    mode: 'auto',
    briefingMs: 1600,
    autoAdvanceMs: 14000,
  },
] as const

export function getPhaseDefinition(phase: MissionGameplayPhase): MissionPhaseDefinition {
  const definition = PHASE_DEFINITIONS.find((item) => item.id === phase)
  if (!definition) {
    throw new Error(`Unknown mission phase: ${phase}`)
  }
  return definition
}