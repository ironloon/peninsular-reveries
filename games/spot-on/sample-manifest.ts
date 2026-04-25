import type { MissionOrbitSampleProcessingPlan } from '../mission-orbit/sample-manifest.js'

export type SpotOnSampleId =
  | 'pick-up-whoosh'
  | 'place-thunk'
  | 'drop-put-down'
  | 'completion-chime'
  | 'room-transition'

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

export interface SpotOnSampleDefinition {
  readonly id: SpotOnSampleId
  readonly url: `/spot-on/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource
  readonly processing: MissionOrbitSampleProcessingPlan
}

export const spotOnSampleManifest: Record<SpotOnSampleId, SpotOnSampleDefinition> = {
  'pick-up-whoosh': {
    id: 'pick-up-whoosh',
    url: '/spot-on/audio/pick-up-whoosh.ogg',
    fileName: 'pick-up-whoosh.ogg',
    gain: 2.8,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 414,
      title: 'whoosh.wav',
      creator: 'patchywolf',
      sourceUrl: 'https://freesound.org/people/patchywolf/sounds/414/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.48,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=300', 'lowpass=f=5000', 'volume=0.9'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.28,
      fadeOutSeconds: 0.2,
    },
  },
  'place-thunk': {
    id: 'place-thunk',
    url: '/spot-on/audio/place-thunk.ogg',
    fileName: 'place-thunk.ogg',
    gain: 2.6,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 33508,
      title: 'thud.wav',
      creator: 'goldsounds',
      sourceUrl: 'https://freesound.org/people/goldsounds/sounds/33508/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.36,
      mono: true,
      bitrateKbps: 40,
      filters: ['highpass=f=80', 'lowpass=f=2800', 'volume=0.92'],
      fadeInSeconds: 0.005,
      fadeOutStartSeconds: 0.18,
      fadeOutSeconds: 0.18,
    },
  },
  'completion-chime': {
    id: 'completion-chime',
    url: '/spot-on/audio/completion-chime.ogg',
    fileName: 'completion-chime.ogg',
    gain: 2.8,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 395,
      title: 'chime.aif',
      creator: 'carmen_mireles_barrios',
      sourceUrl: 'https://freesound.org/people/carmen_mireles_barrios/sounds/395/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 1.2,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=400', 'lowpass=f=6000', 'volume=0.85'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.8,
      fadeOutSeconds: 0.4,
    },
  },
  'drop-put-down': {
    id: 'drop-put-down',
    url: '/spot-on/audio/drop-put-down.ogg',
    fileName: 'drop-put-down.ogg',
    gain: 2.6,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 171939,
      title: 'Put Down Glass Object.flac',
      creator: 'qubodup',
      sourceUrl: 'https://freesound.org/people/qubodup/sounds/171939/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.4,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=80', 'lowpass=f=2800', 'volume=0.9'],
      fadeInSeconds: 0.005,
      fadeOutStartSeconds: 0.2,
      fadeOutSeconds: 0.2,
    },
  },
  'room-transition': {
    id: 'room-transition',
    url: '/spot-on/audio/room-transition.ogg',
    fileName: 'room-transition.ogg',
    gain: 2.7,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 17787,
      title: 'swoosh.wav',
      creator: 'fotosettile',
      sourceUrl: 'https://freesound.org/people/fotosettile/sounds/17787/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.56,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=200', 'lowpass=f=4400', 'volume=0.88'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.3,
      fadeOutSeconds: 0.26,
    },
  },
}

export function getBundledSpotOnSamples(): readonly SpotOnSampleDefinition[] {
  return Object.values(spotOnSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableSpotOnSamples(): readonly SpotOnSampleDefinition[] {
  return Object.values(spotOnSampleManifest)
}

export function getSpotOnSampleDefinition(
  sampleId: SpotOnSampleId,
): SpotOnSampleDefinition {
  return spotOnSampleManifest[sampleId]
}