import {
  getBundledSpotOnSamples,
  spotOnSampleManifest,
  type SpotOnSampleDefinition,
  type SpotOnSampleId,
} from './sample-manifest.js'
import { ensureAudioUnlocked as baseEnsureAudioUnlocked, resolveAssetUrl } from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'
import { getSfxEnabled } from '../../client/preferences.js'

// ── Sample decode/play pipeline ───────────────────────────────────────────────

let sampleLoadPromise: Promise<void> | null = null

const decodedSamples = new Map<SpotOnSampleId, AudioBuffer>()
const failedSamples = new Set<SpotOnSampleId>()

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('spot-on').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('spot-on').sfx
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

async function decodeSample(sample: SpotOnSampleDefinition): Promise<void> {
  const context = getCtx()
  if (!context || decodedSamples.has(sample.id) || failedSamples.has(sample.id)) return

  try {
    const response = await fetch(resolveAssetUrl(sample.url), { cache: 'force-cache' })
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

function preloadSpotOnSamples(): Promise<void> {
  const context = getCtx()
  if (!context) return Promise.resolve()
  if (sampleLoadPromise) return sampleLoadPromise

  const toDecode = getBundledSpotOnSamples().filter(
    (sample) => !decodedSamples.has(sample.id) && !failedSamples.has(sample.id),
  )

  if (toDecode.length === 0) {
    return Promise.resolve()
  }

  sampleLoadPromise = Promise.all(toDecode.map((s) => decodeSample(s)))
    .then(() => undefined)
    .finally(() => {
      sampleLoadPromise = null
    })

  return sampleLoadPromise
}

function playSample(sampleId: SpotOnSampleId): boolean {
  if (!getSfxEnabled()) return false

  const context = getCtx()
  const sample = spotOnSampleManifest[sampleId]
  const buffer = decodedSamples.get(sampleId)

  if (!context || !sample) return false

  if (!buffer) {
    void decodeSample(sample)
    return false
  }

  const startTime = context.currentTime
  const duration = Math.min(
    sample.processing.durationSeconds ?? buffer.duration,
    buffer.duration,
  )
  const volume = sample.gain

  const source = context.createBufferSource()
  const envelope = createEnvelope(context, startTime, duration, volume)

  source.buffer = buffer
  source.loop = false
  source.connect(envelope)
  envelope.connect(getSfxBusNode())

  source.start(startTime)
  source.stop(startTime + duration)

  return true
}

// ── Public API ───────────────────────────────────────────────────────────────

export function ensureSpotOnAudioUnlocked(): void {
  baseEnsureAudioUnlocked()
  void preloadSpotOnSamples()
}

export function playSpotOnSfx(name: string): boolean {
  const validNames: Record<string, SpotOnSampleId> = {
    'pickup': 'pick-up-whoosh',
    'place': 'place-thunk',
    'drop': 'drop-put-down',
    'completion': 'completion-chime',
    'new-room': 'room-transition',
  }

  const sampleId = validNames[name]
  if (!sampleId) return false

  return playSample(sampleId)
}