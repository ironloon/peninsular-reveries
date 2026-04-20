import { TRAIN_PRESETS_BY_ID } from './catalog.js'
import {
  getBundledTrainSoundsSamples,
  trainSoundsSampleManifest,
  type TrainSoundsSampleDefinition,
  type TrainSoundsSampleId,
} from './sample-manifest.js'
import type { TrainHotspotId, TrainPresetId } from './types.js'
import { ensureAudioUnlocked as baseEnsureAudioUnlocked } from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'

let sampleLoadPromise: Promise<void> | null = null

const decodedSamples = new Map<TrainSoundsSampleId, AudioBuffer>()
const failedSamples = new Set<TrainSoundsSampleId>()
const presetHotspotRouteCache = new Map<
  TrainPresetId,
  ReadonlyMap<TrainHotspotId, TrainHotspotSoundRoute>
>()

interface SamplePlaybackOptions {
  readonly playbackRate?: number
  readonly volumeScale?: number
  readonly whenOffset?: number
  readonly duration?: number
  readonly attack?: number
  readonly release?: number
}

interface SamplePlaybackResult {
  readonly startTime: number
  readonly duration: number
  readonly playbackRate: number
  readonly volumeScale: number
}

export type TrainHotspotPlaybackOptions = SamplePlaybackOptions

export interface TrainHotspotSoundRoute {
  readonly sampleId: TrainSoundsSampleId
  readonly playbackRate?: number
  readonly volumeScale?: number
  readonly attack?: number
  readonly release?: number
  readonly reinforcement?: 'electric-hum-brightener'
}

const TRAIN_PRESET_HOTSPOT_SOUND_ROUTES: Readonly<
  Record<
    TrainPresetId,
    Readonly<Partial<Record<TrainHotspotId, TrainHotspotSoundRoute>>>
  >
> = {
  steam: {
    'steam-whistle': { sampleId: 'steam-whistle' },
    'steam-bell': { sampleId: 'steam-bell', volumeScale: 0.96 },
    'steam-rods': {
      sampleId: 'steam-chuff',
      playbackRate: 0.96,
      volumeScale: 1.04,
      release: 0.08,
    },
    'steam-coupler': { sampleId: 'coupler-clank', playbackRate: 0.94 },
    'steam-passenger-door': {
      sampleId: 'passenger-door-chime',
      playbackRate: 0.94,
      volumeScale: 0.86,
    },
  },
  diesel: {
    'diesel-horn': { sampleId: 'diesel-horn' },
    'diesel-engine-hum': { sampleId: 'diesel-idle' },
    'diesel-brake': {
      sampleId: 'air-brake-hiss',
      playbackRate: 0.98,
      volumeScale: 0.94,
    },
    'diesel-wheels': {
      sampleId: 'diesel-idle',
      playbackRate: 1.08,
      volumeScale: 0.84,
      release: 0.12,
    },
    'diesel-cargo-latch': {
      sampleId: 'coupler-clank',
      playbackRate: 0.88,
      volumeScale: 0.9,
    },
  },
  electric: {
    'electric-horn': { sampleId: 'electric-horn' },
    'electric-power-hum': {
      sampleId: 'electric-hum',
      reinforcement: 'electric-hum-brightener',
    },
    'electric-brake': {
      sampleId: 'air-brake-hiss',
      playbackRate: 1.06,
      volumeScale: 0.86,
    },
    'electric-wheels': {
      sampleId: 'electric-hum',
      playbackRate: 1.18,
      volumeScale: 0.76,
      release: 0.1,
    },
    'electric-passenger-door': {
      sampleId: 'passenger-door-chime',
      playbackRate: 1.02,
      volumeScale: 0.9,
    },
  },
  'high-speed': {
    'high-speed-horn': { sampleId: 'highspeed-horn' },
    'high-speed-power-hum': {
      sampleId: 'highspeed-passby',
      playbackRate: 0.7,
      volumeScale: 0.62,
      release: 0.16,
    },
    'high-speed-brake': {
      sampleId: 'air-brake-hiss',
      playbackRate: 1.12,
      volumeScale: 0.84,
    },
    'high-speed-wheels': {
      sampleId: 'highspeed-passby',
      playbackRate: 1.02,
      volumeScale: 0.98,
    },
    'high-speed-passenger-door': {
      sampleId: 'passenger-door-chime',
      playbackRate: 1.08,
      volumeScale: 0.88,
    },
  },
}

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('train-sounds').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('train-sounds').sfx
}

function createEnvelope(
  context: AudioContext,
  startTime: number,
  duration: number,
  volume: number,
  attack: number = 0.01,
  release: number = Math.min(0.22, duration * 0.55),
): GainNode {
  const gain = context.createGain()
  const peakTime = startTime + Math.max(attack, 0.008)
  const releaseStart = Math.max(
    peakTime + 0.01,
    startTime + duration - Math.max(release, 0.04),
  )

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, peakTime)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(volume * 0.84, 0.0002),
    releaseStart,
  )
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  return gain
}

async function decodeSample(sample: TrainSoundsSampleDefinition): Promise<void> {
  const context = getCtx()
  if (!context || decodedSamples.has(sample.id) || failedSamples.has(sample.id)) return

  try {
    const response = await fetch(sample.url, { cache: 'force-cache' })
    if (!response.ok) {
      failedSamples.add(sample.id)
      return
    }

    const audioData = await response.arrayBuffer()
    const buffer = await context.decodeAudioData(audioData.slice(0))
    decodedSamples.set(sample.id, buffer)
  } catch {
    failedSamples.add(sample.id)
  }
}

export function preloadTrainSoundSamples(): Promise<void> {
  const context = getCtx()
  if (!context) return Promise.resolve()
  if (sampleLoadPromise) return sampleLoadPromise

  const bundledSamples = getBundledTrainSoundsSamples().filter(
    (sample) => !decodedSamples.has(sample.id) && !failedSamples.has(sample.id),
  )
  if (bundledSamples.length === 0) {
    return Promise.resolve()
  }

  sampleLoadPromise = Promise.all(
    bundledSamples.map((sample) => decodeSample(sample)),
  )
    .then(() => undefined)
    .finally(() => {
      sampleLoadPromise = null
    })

  return sampleLoadPromise
}

function playSample(
  sampleId: TrainSoundsSampleId,
  options: SamplePlaybackOptions = {},
): SamplePlaybackResult | null {
  const context = getCtx()
  const sample = trainSoundsSampleManifest[sampleId]
  const buffer = decodedSamples.get(sampleId)

  if (!context || !sample) return null
  if (!buffer) {
    void decodeSample(sample)
    return null
  }

  const playbackRate = options.playbackRate ?? 1
  const startTime = context.currentTime + (options.whenOffset ?? 0)
  const duration = options.duration ?? buffer.duration / playbackRate
  const volumeScale = options.volumeScale ?? 1
  const source = context.createBufferSource()
  const gain = createEnvelope(
    context,
    startTime,
    duration,
    sample.gain * volumeScale,
    options.attack ?? 0.01,
    options.release ?? Math.min(0.18, Math.max(duration * 0.45, 0.05)),
  )

  source.buffer = buffer
  source.loop = sample.loop && duration > buffer.duration
  source.playbackRate.setValueAtTime(playbackRate, startTime)
  source.connect(gain)
  gain.connect(getSfxBusNode())

  source.start(startTime)
  source.stop(startTime + duration)

  return {
    startTime,
    duration,
    playbackRate,
    volumeScale,
  }
}

function playElectricHumReinforcement(
  startTime: number,
  duration: number,
  playbackRate: number,
  volumeScale: number,
): void {
  const context = getCtx()
  if (!context) return

  const body = context.createOscillator()
  const overtone = context.createOscillator()
  const filter = context.createBiquadFilter()
  const gain = createEnvelope(
    context,
    startTime,
    duration,
    0.014 * volumeScale,
    0.03,
    Math.min(0.22, duration * 0.4),
  )

  body.type = 'triangle'
  overtone.type = 'sine'
  body.frequency.setValueAtTime(240 * playbackRate, startTime)
  overtone.frequency.setValueAtTime(480 * playbackRate, startTime)

  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(980 * playbackRate, startTime)
  filter.Q.value = 0.9

  body.connect(filter)
  overtone.connect(filter)
  filter.connect(gain)
  gain.connect(getSfxBusNode())

  body.start(startTime)
  overtone.start(startTime)
  body.stop(startTime + duration)
  overtone.stop(startTime + duration)
}

export function ensureTrainSoundsAudioUnlocked(): void {
  baseEnsureAudioUnlocked()
  void preloadTrainSoundSamples()
}

export function getTrainPresetHotspotSoundMap(
  presetId: TrainPresetId,
): ReadonlyMap<TrainHotspotId, TrainHotspotSoundRoute> {
  const cached = presetHotspotRouteCache.get(presetId)
  if (cached) return cached

  const preset = TRAIN_PRESETS_BY_ID[presetId]
  const routes = new Map<TrainHotspotId, TrainHotspotSoundRoute>()

  for (const hotspot of preset.hotspots) {
    const route = TRAIN_PRESET_HOTSPOT_SOUND_ROUTES[presetId][hotspot.id]
    if (!route) {
      throw new Error(
        `Missing train sound route for preset "${presetId}" hotspot "${hotspot.id}".`,
      )
    }

    routes.set(hotspot.id, route)
  }

  presetHotspotRouteCache.set(presetId, routes)
  return routes
}

export function getTrainHotspotSoundRoute(
  presetId: TrainPresetId,
  hotspotId: TrainHotspotId,
): TrainHotspotSoundRoute | null {
  return getTrainPresetHotspotSoundMap(presetId).get(hotspotId) ?? null
}

export function getTrainHotspotSampleId(
  presetId: TrainPresetId,
  hotspotId: TrainHotspotId,
): TrainSoundsSampleId | null {
  return getTrainHotspotSoundRoute(presetId, hotspotId)?.sampleId ?? null
}

export function playTrainHotspotSound(
  presetId: TrainPresetId,
  hotspotId: TrainHotspotId,
  options: TrainHotspotPlaybackOptions = {},
): boolean {
  const route = getTrainHotspotSoundRoute(presetId, hotspotId)
  if (!route) return false

  const playback = playSample(route.sampleId, {
    playbackRate: options.playbackRate ?? route.playbackRate,
    volumeScale: (route.volumeScale ?? 1) * (options.volumeScale ?? 1),
    whenOffset: options.whenOffset,
    duration: options.duration,
    attack: options.attack ?? route.attack,
    release: options.release ?? route.release,
  })

  if (!playback) {
    void preloadTrainSoundSamples()
    return false
  }

  if (route.reinforcement === 'electric-hum-brightener') {
    playElectricHumReinforcement(
      playback.startTime,
      playback.duration,
      playback.playbackRate,
      playback.volumeScale,
    )
  }

  return true
}