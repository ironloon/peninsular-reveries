export type MissionOrbitSampleIntensity = 'light' | 'heavy'

export type MissionOrbitPhysicalSampleId =
  | 'launch-rumble'
  | 'burn-thrust-pulse'
  | 'reentry-texture'
  | 'parachute-deploy'
  | 'splashdown'
  | 'space-ambience'
  | 'celebration-accent'

export type MissionOrbitSampleId = `${MissionOrbitPhysicalSampleId}-${MissionOrbitSampleIntensity}`

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

interface DiySource {
  readonly provider: 'diy'
  readonly notes: string
}

export interface MissionOrbitSampleProcessingPlan {
  readonly startSeconds?: number
  readonly durationSeconds?: number
  readonly mono: boolean
  readonly bitrateKbps: number
  readonly filters?: readonly string[]
  readonly fadeInSeconds?: number
  readonly fadeOutSeconds?: number
  readonly fadeOutStartSeconds?: number
}

export interface MissionOrbitSampleDefinition {
  readonly id: MissionOrbitSampleId
  readonly url: `/mission-orbit/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource | DiySource
  readonly processing?: MissionOrbitSampleProcessingPlan
}

export const missionOrbitSampleVariants: Record<MissionOrbitPhysicalSampleId, Record<MissionOrbitSampleIntensity, MissionOrbitSampleId>> = {
  'launch-rumble': {
    light: 'launch-rumble-light',
    heavy: 'launch-rumble-heavy',
  },
  'burn-thrust-pulse': {
    light: 'burn-thrust-pulse-light',
    heavy: 'burn-thrust-pulse-heavy',
  },
  'reentry-texture': {
    light: 'reentry-texture-light',
    heavy: 'reentry-texture-heavy',
  },
  'parachute-deploy': {
    light: 'parachute-deploy-light',
    heavy: 'parachute-deploy-heavy',
  },
  splashdown: {
    light: 'splashdown-light',
    heavy: 'splashdown-heavy',
  },
  'space-ambience': {
    light: 'space-ambience-light',
    heavy: 'space-ambience-heavy',
  },
  'celebration-accent': {
    light: 'celebration-accent-light',
    heavy: 'celebration-accent-heavy',
  },
}

export function getMissionOrbitSampleVariantId(
  baseId: MissionOrbitPhysicalSampleId,
  intensity: MissionOrbitSampleIntensity,
): MissionOrbitSampleId {
  return missionOrbitSampleVariants[baseId][intensity]
}

export const missionOrbitSampleManifest: Record<string, MissionOrbitSampleDefinition> = {}

export function getBundledMissionOrbitSamples(): readonly MissionOrbitSampleDefinition[] {
  return Object.values(missionOrbitSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableMissionOrbitSamples(): readonly MissionOrbitSampleDefinition[] {
  return Object.values(missionOrbitSampleManifest).filter((sample) => sample.source.provider === 'freesound')
}

export function getDiyMissionOrbitSamples(): readonly MissionOrbitSampleDefinition[] {
  return Object.values(missionOrbitSampleManifest).filter((sample) => sample.source.provider === 'diy')
}