import type { MissionOrbitSampleProcessingPlan } from '../mission-orbit/sample-manifest.js'

export type TrainSoundsSampleId =
  | 'steam-whistle'
  | 'steam-bell'
  | 'steam-chuff'
  | 'diesel-horn'
  | 'diesel-idle'
  | 'air-brake-hiss'
  | 'electric-horn'
  | 'electric-hum'
  | 'passenger-door-chime'
  | 'highspeed-horn'
  | 'highspeed-passby'
  | 'coupler-clank'

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

export interface TrainSoundsSampleDefinition {
  readonly id: TrainSoundsSampleId
  readonly url: `/train-sounds/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource
  readonly processing: MissionOrbitSampleProcessingPlan
}

export const trainSoundsSampleManifest: Record<TrainSoundsSampleId, TrainSoundsSampleDefinition> = {
  'steam-whistle': {
    id: 'steam-whistle',
    url: '/train-sounds/audio/steam-whistle.ogg',
    fileName: 'steam-whistle.ogg',
    gain: 3.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 188240,
      title: 'steam-train-whistle.wav',
      creator: 'gadzooks',
      sourceUrl: 'https://freesound.org/people/gadzooks/sounds/188240/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 1.42,
      mono: true,
      bitrateKbps: 60,
      filters: ['highpass=f=180', 'lowpass=f=3200', 'volume=0.88'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 1.18,
      fadeOutSeconds: 0.24,
    },
  },
  'steam-bell': {
    id: 'steam-bell',
    url: '/train-sounds/audio/steam-bell.ogg',
    fileName: 'steam-bell.ogg',
    gain: 2.6,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 705377,
      title: 'EMD Steel Bell',
      creator: 'chungus43A',
      sourceUrl: 'https://freesound.org/people/chungus43A/sounds/705377/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.38,
      durationSeconds: 0.82,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=320', 'lowpass=f=4200', 'volume=0.82'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.64,
      fadeOutSeconds: 0.18,
    },
  },
  'steam-chuff': {
    id: 'steam-chuff',
    url: '/train-sounds/audio/steam-chuff.ogg',
    fileName: 'steam-chuff.ogg',
    gain: 3.2,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 623817,
      title: 'single steam train chuff',
      creator: 'birdOfTheNorth',
      sourceUrl: 'https://freesound.org/people/birdOfTheNorth/sounds/623817/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.03,
      durationSeconds: 0.66,
      mono: true,
      bitrateKbps: 44,
      filters: ['highpass=f=140', 'lowpass=f=2600', 'volume=0.92'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.22,
      fadeOutSeconds: 0.12,
    },
  },
  'diesel-horn': {
    id: 'diesel-horn',
    url: '/train-sounds/audio/diesel-horn.ogg',
    fileName: 'diesel-horn.ogg',
    gain: 3.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 662553,
      title: 'Diesel Locomotive Horn - 2300 Class.wav',
      creator: 'JotrainG',
      sourceUrl: 'https://freesound.org/people/JotrainG/sounds/662553/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.84,
      mono: true,
      bitrateKbps: 36,
      filters: ['highpass=f=150', 'lowpass=f=2600', 'volume=0.84'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.56,
      fadeOutSeconds: 0.16,
    },
  },
  'diesel-idle': {
    id: 'diesel-idle',
    url: '/train-sounds/audio/diesel-idle.ogg',
    fileName: 'diesel-idle.ogg',
    gain: 3.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 705386,
      title: 'Diesel engine idling',
      creator: 'chungus43A',
      sourceUrl: 'https://freesound.org/people/chungus43A/sounds/705386/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.24,
      durationSeconds: 0.92,
      mono: true,
      bitrateKbps: 44,
      filters: ['highpass=f=90', 'lowpass=f=1800', 'volume=0.94'],
      fadeInSeconds: 0.02,
      fadeOutStartSeconds: 0.74,
      fadeOutSeconds: 0.18,
    },
  },
  'air-brake-hiss': {
    id: 'air-brake-hiss',
    url: '/train-sounds/audio/air-brake-hiss.ogg',
    fileName: 'air-brake-hiss.ogg',
    gain: 2.8,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 457294,
      title: 'Air (or steam) pressure release',
      creator: 'brunoboselli',
      sourceUrl: 'https://freesound.org/people/brunoboselli/sounds/457294/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.96,
      mono: true,
      bitrateKbps: 32,
      filters: ['highpass=f=260', 'lowpass=f=4800', 'volume=0.9'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.66,
      fadeOutSeconds: 0.18,
    },
  },
  'electric-horn': {
    id: 'electric-horn',
    url: '/train-sounds/audio/electric-horn.ogg',
    fileName: 'electric-horn.ogg',
    // BLOCKER: electric-horn.ogg is completely silent (all-zero samples, peak
    // -inf dB / observed peak -91 dB). No gain value can make this audible.
    // The source audio must be regenerated — likely the ffmpeg trim/encode
    // step at startSeconds=0.68 produced a silent clip. Gain kept at 2.9 as
    // placeholder; the file is effectively inaudible until the audio is fixed.
    gain: 2.9,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 783760,
      title: 'Moscow Metro 81-717 two chime horn',
      creator: 'chungus43A',
      sourceUrl: 'https://freesound.org/people/chungus43A/sounds/783760/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.68,
      durationSeconds: 0.52,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=220', 'lowpass=f=3400', 'volume=0.84'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.38,
      fadeOutSeconds: 0.14,
    },
  },
  'electric-hum': {
    id: 'electric-hum',
    url: '/train-sounds/audio/electric-hum.ogg',
    fileName: 'electric-hum.ogg',
    gain: 2.8,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 733740,
      title: '200/300Hz 81-717 BPSN hum sound',
      creator: 'chungus43A',
      sourceUrl: 'https://freesound.org/people/chungus43A/sounds/733740/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.96,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=110', 'lowpass=f=1700', 'volume=1.0'],
      fadeInSeconds: 0.02,
      fadeOutStartSeconds: 0.78,
      fadeOutSeconds: 0.18,
    },
  },
  'passenger-door-chime': {
    id: 'passenger-door-chime',
    url: '/train-sounds/audio/passenger-door-chime.ogg',
    fileName: 'passenger-door-chime.ogg',
    gain: 3.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 720572,
      title: 'Old Toronto Subway Chime',
      creator: 'chungus43A',
      sourceUrl: 'https://freesound.org/people/chungus43A/sounds/720572/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.68,
      mono: true,
      bitrateKbps: 44,
      filters: ['highpass=f=450', 'lowpass=f=3600', 'volume=0.8'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.48,
      fadeOutSeconds: 0.2,
    },
  },
  'highspeed-horn': {
    id: 'highspeed-horn',
    url: '/train-sounds/audio/highspeed-horn.ogg',
    fileName: 'highspeed-horn.ogg',
    gain: 3.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 141273,
      title: 'Train horn, Departs',
      creator: 'OroborosNZ',
      sourceUrl: 'https://freesound.org/people/OroborosNZ/sounds/141273/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.08,
      durationSeconds: 0.82,
      mono: true,
      bitrateKbps: 36,
      filters: ['highpass=f=180', 'lowpass=f=3200', 'volume=0.84'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.66,
      fadeOutSeconds: 0.16,
    },
  },
  'highspeed-passby': {
    id: 'highspeed-passby',
    url: '/train-sounds/audio/highspeed-passby.ogg',
    fileName: 'highspeed-passby.ogg',
    // Gain elevated from 3.2 to 7.2: raw file peaks at only -16.4 dB;
    // at gain 3.2 the post-chain peak was -24.7 dB (below -18 dB threshold).
    // Gain 7.2 yields post-chain peak ≈ -17.6 dB which meets the audibility threshold.
    gain: 7.2,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 844230,
      title: 'TRNHspd_High Speed, Pass-By, Passenger Train, Mono Mix, Recording_02_JW Audio',
      creator: 'JW_Audio',
      sourceUrl: 'https://freesound.org/people/JW_Audio/sounds/844230/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.4,
      durationSeconds: 1.34,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=120', 'lowpass=f=2400', 'volume=0.94'],
      fadeInSeconds: 0.02,
      fadeOutStartSeconds: 1.08,
      fadeOutSeconds: 0.26,
    },
  },
  'coupler-clank': {
    id: 'coupler-clank',
    url: '/train-sounds/audio/coupler-clank.ogg',
    fileName: 'coupler-clank.ogg',
    // Gain elevated from 3.1 to 22: raw file peak is only -26.0 dB (very brief
    // transient clank — peak count of ~2 samples); at gain 3.1 the post-chain
    // peak was -34.6 dB, far below audibility. Gain 22 yields post-chain peak
    // ≈ -17.6 dB. Consider normalizing the source audio to reduce this extreme
    // gain requirement — SNR will be poor at this amplification level.
    gain: 22,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 480819,
      title: 'R20-33-Train Cars Coupling.wav',
      creator: 'craigsmith',
      sourceUrl: 'https://freesound.org/people/craigsmith/sounds/480819/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.14,
      durationSeconds: 0.64,
      mono: true,
      bitrateKbps: 36,
      filters: ['highpass=f=180', 'lowpass=f=3200', 'volume=0.9'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.26,
      fadeOutSeconds: 0.14,
    },
  },
}

export function getBundledTrainSoundsSamples(): readonly TrainSoundsSampleDefinition[] {
  return Object.values(trainSoundsSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableTrainSoundsSamples(): readonly TrainSoundsSampleDefinition[] {
  return Object.values(trainSoundsSampleManifest)
}

export function getTrainSoundsSampleDefinition(
  sampleId: TrainSoundsSampleId,
): TrainSoundsSampleDefinition {
  return trainSoundsSampleManifest[sampleId]
}