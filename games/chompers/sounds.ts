import { chompersSampleManifest, getBundledChompersSamples, type ChompersSampleDefinition, type ChompersSampleId } from './sample-manifest.js'
import { ensureAudioUnlocked as baseEnsureAudioUnlocked } from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'

let sampleLoadPromise: Promise<void> | null = null

const decodedSamples = new Map<ChompersSampleId, AudioBuffer>()
const failedSamples = new Set<ChompersSampleId>()

interface SamplePlaybackOptions {
  readonly playbackRate?: number
  readonly volumeScale?: number
  readonly whenOffset?: number
  readonly duration?: number
  readonly attack?: number
  readonly release?: number
}

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('chompers').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('chompers').sfx
}

function createEnvelope(
  context: AudioContext,
  startTime: number,
  duration: number,
  volume: number,
  attack: number = 0.01,
  release: number = Math.min(0.2, duration * 0.6),
): GainNode {
  const gain = context.createGain()
  const peakTime = startTime + Math.max(attack, 0.008)
  const releaseStart = Math.max(peakTime + 0.01, startTime + duration - Math.max(release, 0.04))

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, peakTime)
  gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.82, 0.0002), releaseStart)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  return gain
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1,
  delay: number = 0,
): void {
  const context = getCtx()
  if (!context) return

  const startTime = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = createEnvelope(context, startTime, duration, volume)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.connect(gain)
  gain.connect(getSfxBusNode())

  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

function playSweep(
  startFrequency: number,
  endFrequency: number,
  duration: number,
  type: OscillatorType = 'triangle',
  volume: number = 0.08,
): void {
  const context = getCtx()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = createEnvelope(context, context.currentTime, duration, volume)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(startFrequency, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + duration)

  oscillator.connect(gain)
  gain.connect(getSfxBusNode())

  oscillator.start(context.currentTime)
  oscillator.stop(context.currentTime + duration)
}

async function decodeSample(sample: ChompersSampleDefinition): Promise<void> {
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

function loadSamples(): Promise<void> {
  const context = getCtx()
  if (!context) return Promise.resolve()
  if (sampleLoadPromise) return sampleLoadPromise

  const bundledSamples = getBundledChompersSamples().filter((sample) => !decodedSamples.has(sample.id) && !failedSamples.has(sample.id))
  if (bundledSamples.length === 0) {
    return Promise.resolve()
  }

  sampleLoadPromise = Promise.all(bundledSamples.map((sample) => decodeSample(sample)))
    .then(() => undefined)
    .finally(() => {
      sampleLoadPromise = null
    })

  return sampleLoadPromise
}

function playSample(sampleId: ChompersSampleId, options: SamplePlaybackOptions = {}): boolean {
  const context = getCtx()
  const sample = chompersSampleManifest[sampleId]
  const buffer = decodedSamples.get(sampleId)
  if (!context || !sample || !buffer) return false

  const startTime = context.currentTime + (options.whenOffset ?? 0)
  const playbackRate = options.playbackRate ?? 1
  const duration = options.duration ?? buffer.duration / playbackRate
  const source = context.createBufferSource()
  const gain = createEnvelope(
    context,
    startTime,
    duration,
    sample.gain * (options.volumeScale ?? 1),
    options.attack ?? 0.008,
    options.release ?? Math.min(0.16, Math.max(duration * 0.42, 0.05)),
  )

  source.buffer = buffer
  source.loop = sample.loop && duration > 0
  source.playbackRate.setValueAtTime(playbackRate, startTime)
  source.connect(gain)
  gain.connect(getSfxBusNode())

  source.start(startTime)
  source.stop(startTime + duration)
  return true
}

export function ensureAudioUnlocked(): void {
  baseEnsureAudioUnlocked()
  void loadSamples()
}

export function sfxChomp(): void {
  const layered = playSample('chomp-splash', { playbackRate: 0.92, volumeScale: 1.06 })
  playTone(170, 0.08, 'triangle', layered ? 0.07 : 0.11)
  playTone(130, 0.1, 'square', layered ? 0.035 : 0.06, 0.03)
}

export function sfxCorrect(): void {
  const layered = playSample('collect-pop', { playbackRate: 1.04, volumeScale: 1 })
  playSweep(520, 680, 0.2, 'sine', layered ? 0.04 : 0.08)
}

export function sfxWrong(): void {
  const layered = playSample('hazard-snap', { playbackRate: 0.96, volumeScale: 0.9 })
  playSweep(260, 120, 0.2, 'sine', layered ? 0.04 : 0.08)
}

export function sfxProblemAppear(): void {
  playSample('ui-tap', { playbackRate: 1.02, volumeScale: 0.9 })
}

export function sfxHippoWiggle(): void {
  playSweep(440, 550, 0.15, 'sine', 0.06)
}

export function sfxGameOver(): void {
  const layered = playSample('miss-plop', { playbackRate: 0.72, volumeScale: 0.88 })
  playSample('ui-tap', { whenOffset: 0.14, playbackRate: 0.84, volumeScale: 0.6 })
  playTone(220, 0.16, 'triangle', layered ? 0.04 : 0.08)
  playTone(165, 0.22, 'triangle', layered ? 0.035 : 0.07, 0.08)
  playTone(131, 0.3, 'triangle', layered ? 0.03 : 0.06, 0.18)
}

// ── "Snack Break" melody (preserve for shared music catalog — LEG-6) ──────────
// Pentatonic scale: C D E G A (261, 294, 329, 392, 440 Hz)
// Melody indices:   [0, 2, 3, 4, 3, 2, 1, 2, 0, 2, 4, 3, 4, 3, 2, 1]
// Beat duration:    0.25s (8th note at 120 BPM)
// Lead voice:       sine oscillator, gain envelope 0→0.08→0.0001 per note
// Bass voice:       triangle oscillator on every 4th note at freq/2,
//                   gain envelope 0→0.05→0.0001, duration = 4 beats
// Both routed through music bus.

