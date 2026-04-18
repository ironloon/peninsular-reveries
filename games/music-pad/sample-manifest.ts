import type { MissionOrbitSampleProcessingPlan } from '../mission-orbit/sample-manifest.js'

export type MusicPadSampleId = 'loop-shaker' | 'loop-tambourine'

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

export interface MusicPadSampleDefinition {
  readonly id: MusicPadSampleId
  readonly url: `/music-pad/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource
  readonly processing: MissionOrbitSampleProcessingPlan
}

// Placeholder entries — actual CC0 sample sourcing is deferred to a later
// pass via the creative-assets workflow. Keep `bundled: false` so the build
// does not expect these files to exist on disk yet.
export const musicPadSampleManifest: Record<MusicPadSampleId, MusicPadSampleDefinition> = {
  'loop-shaker': {
    id: 'loop-shaker',
    url: '/music-pad/audio/loop-shaker.ogg',
    fileName: 'loop-shaker.ogg',
    gain: 0.4,
    loop: true,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — shaker loop placeholder',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 2.0,
      mono: true,
      bitrateKbps: 64,
      filters: [],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 1.95,
      fadeOutSeconds: 0.05,
    },
  },
  'loop-tambourine': {
    id: 'loop-tambourine',
    url: '/music-pad/audio/loop-tambourine.ogg',
    fileName: 'loop-tambourine.ogg',
    gain: 0.4,
    loop: true,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — tambourine loop placeholder',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 2.0,
      mono: true,
      bitrateKbps: 64,
      filters: [],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 1.95,
      fadeOutSeconds: 0.05,
    },
  },
}

export function getBundledMusicPadSamples(): readonly MusicPadSampleDefinition[] {
  return Object.values(musicPadSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableMusicPadSamples(): readonly MusicPadSampleDefinition[] {
  return Object.values(musicPadSampleManifest)
}
