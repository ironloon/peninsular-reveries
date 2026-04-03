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
  readonly countdownValue: number
  readonly actionHeld: boolean
  readonly launchProgress: number
  readonly timingCursor: number
  readonly timingDirection: 1 | -1
  readonly burnResults: readonly BurnResult[]
  readonly outcomeText: string
  readonly outcomeGrade: BurnGrade | null
  readonly slowMoActive: boolean
  readonly slowMoElapsedMs: number
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
    prompt: 'Stand by. Main engines ignite at T minus 7, boosters at T zero.',
    actionLabel: 'Countdown running',
    timingHint: 'Watch the clock. Liftoff comes at zero.',
    mode: 'countdown',
  },
  {
    id: 'launch',
    label: 'Ascent to orbit',
    dayLabel: 'Flight Day 1',
    status: 'SLS climb is under way',
    prompt: 'Hold the action button to climb. Listen for the bright cue and release on the flare for main engine cutoff.',
    actionLabel: 'Hold engines',
    timingHint: 'Listen for the bright cue, then release on the flare.',
    mode: 'hold',
    assistAfterMs: 6500,
    timingWindow: {
      perfectStart: 0.82,
      perfectEnd: 0.89,
      goodStart: 0.73,
      goodEnd: 0.94,
    },
  },
  {
    id: 'orbit-insertion',
    label: 'Orbit raise burn',
    dayLabel: 'Flight Day 1',
    status: 'Orion is circling Earth',
    prompt: 'Listen for the cue swell and tap on the flare to raise perigee and settle into the test orbit.',
    actionLabel: 'Fire orbit burn',
    timingHint: 'Listen for the bright tone and tap on the flare.',
    mode: 'timing',
    assistAfterMs: 5200,
    meterSpeed: 0.00058,
    timingWindow: {
      perfectStart: 0.47,
      perfectEnd: 0.57,
      goodStart: 0.38,
      goodEnd: 0.66,
    },
  },
  {
    id: 'high-earth-orbit',
    label: 'High Earth orbit checkout',
    dayLabel: 'Flight Day 1',
    status: 'Cabin checks are nominal',
    prompt: 'Orion coasts in high Earth orbit while the crew configures the spacecraft for deep space.',
    actionLabel: 'Autopilot active',
    timingHint: 'Autopilot is handling this segment.',
    mode: 'auto',
    autoAdvanceMs: 3200,
  },
  {
    id: 'trans-lunar-injection',
    label: 'Trans-lunar injection',
    dayLabel: 'Flight Day 2',
    status: 'Time to leave Earth orbit',
    prompt: 'Listen for the cue flare and tap on the strike to light the burn that sends Orion around the Moon on a free-return path.',
    actionLabel: 'Fire TLI burn',
    timingHint: 'One bright cue, one clean tap.',
    mode: 'timing',
    assistAfterMs: 5200,
    meterSpeed: 0.00072,
    timingWindow: {
      perfectStart: 0.45,
      perfectEnd: 0.55,
      goodStart: 0.34,
      goodEnd: 0.67,
    },
  },
  {
    id: 'lunar-flyby',
    label: 'Lunar flyby',
    dayLabel: 'Flight Day 4',
    status: 'The Moon is filling the windows',
    prompt: 'Listen for the cue flare and tap once near closest approach for a small correction as the Moon bends the return trajectory home.',
    actionLabel: 'Trim the flyby',
    timingHint: 'Let the cue bloom, then tap once.',
    mode: 'timing',
    assistAfterMs: 5400,
    meterSpeed: 0.00064,
    timingWindow: {
      perfectStart: 0.5,
      perfectEnd: 0.6,
      goodStart: 0.4,
      goodEnd: 0.7,
    },
  },
  {
    id: 'return-coast',
    label: 'Return coast',
    dayLabel: 'Flight Day 7',
    status: 'Earth is back on the horizon',
    prompt: 'The free-return path is carrying Orion home. Recovery teams are already planning the splash zone.',
    actionLabel: 'Autopilot active',
    timingHint: 'Autopilot is handling this segment.',
    mode: 'auto',
    autoAdvanceMs: 3400,
  },
  {
    id: 'service-module-jettison',
    label: 'Entry interface',
    dayLabel: 'Flight Day 10',
    status: 'Re-entry heating is building',
    prompt: 'Listen for the cue flare and tap to jettison the service module before Orion commits to atmospheric entry.',
    actionLabel: 'Jettison module',
    timingHint: 'Hit the flare before the heat ramps up.',
    mode: 'timing',
    assistAfterMs: 4800,
    meterSpeed: 0.00076,
    timingWindow: {
      perfectStart: 0.44,
      perfectEnd: 0.54,
      goodStart: 0.35,
      goodEnd: 0.63,
    },
  },
  {
    id: 'parachute-deploy',
    label: 'Parachute deploy',
    dayLabel: 'Flight Day 10',
    status: 'Ocean recovery is in range',
    prompt: 'Listen for the cue flare and tap to open the drogues and mains for the last leg down to the Pacific.',
    actionLabel: 'Deploy chutes',
    timingHint: 'Let the cue bloom, then open the parachutes.',
    mode: 'timing',
    assistAfterMs: 4800,
    meterSpeed: 0.0007,
    timingWindow: {
      perfectStart: 0.49,
      perfectEnd: 0.59,
      goodStart: 0.39,
      goodEnd: 0.69,
    },
  },
  {
    id: 'splashdown',
    label: 'Pacific splashdown',
    dayLabel: 'Flight Day 10',
    status: 'Recovery teams are moving in',
    prompt: 'The capsule is home. Navy recovery vessels close in while Orion settles into the Pacific.',
    actionLabel: 'Mission complete',
    timingHint: 'Sit back. Recovery has the capsule.',
    mode: 'auto',
    autoAdvanceMs: 2600,
  },
] as const

export function getPhaseDefinition(phase: MissionGameplayPhase): MissionPhaseDefinition {
  const definition = PHASE_DEFINITIONS.find((item) => item.id === phase)
  if (!definition) {
    throw new Error(`Unknown mission phase: ${phase}`)
  }
  return definition
}