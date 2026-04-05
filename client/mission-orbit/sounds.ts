import type { BurnGrade, MissionPhase } from './types.js'
import {
  getBundledMissionOrbitSamples,
  getMissionOrbitSampleVariantId,
  missionOrbitSampleManifest,
  type MissionOrbitPhysicalSampleId,
  type MissionOrbitSampleDefinition,
  type MissionOrbitSampleId,
  type MissionOrbitSampleIntensity,
} from './sample-manifest.js'

let ctx: AudioContext | null = null
let unlocked = false
let musicEnabled = false
let musicPreferenceLoaded = false
let sfxIntensity: SoundIntensityMode = 'heavy'
let sfxIntensityPreferenceLoaded = false
let ambientInterval: number | null = null
let musicBus: GainNode | null = null
let outputBus: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let noiseBuffer: AudioBuffer | null = null
let sampleLoadPromise: Promise<void> | null = null
let ambientMeasureIndex = 0
let countdownRumble: CountdownRumbleHandle | null = null

const decodedSamples = new Map<MissionOrbitSampleId, AudioBuffer>()
const failedSamples = new Set<MissionOrbitSampleId>()

const MUSIC_STORAGE_KEY = 'mission-orbit-music-enabled'
const SFX_INTENSITY_STORAGE_KEY = 'mission-orbit-sfx-intensity'
const AMBIENT_MEASURE_MS = 4800
const COUNTDOWN_RUMBLE_DURATION = 7.2
const SPACE_MUSIC_PHASES = new Set<MissionPhase>([
  'high-earth-orbit',
  'trans-lunar-injection',
  'lunar-flyby',
  'return-coast',
])
const AMBIENT_PROGRESSIONS = [
  {
    chord: [130.81, 196, 293.66],
    drone: 98,
    sparkles: [329.63, 392],
  },
  {
    chord: [146.83, 220, 293.66],
    drone: 110,
    sparkles: [349.23, 440],
  },
  {
    chord: [123.47, 185, 277.18],
    drone: 92.5,
    sparkles: [311.13, 369.99],
  },
  {
    chord: [130.81, 196, 261.63],
    drone: 98,
    sparkles: [329.63, 392],
  },
] as const

interface ToneOptions {
  readonly frequency: number
  readonly duration: number
  readonly type: OscillatorType
  readonly volume: number
  readonly whenOffset?: number
  readonly attack?: number
  readonly release?: number
  readonly detune?: readonly number[]
  readonly filterType?: BiquadFilterType
  readonly filterFrequency?: number
  readonly filterTargetFrequency?: number
  readonly q?: number
}

interface NoiseOptions {
  readonly duration: number
  readonly volume: number
  readonly whenOffset?: number
  readonly attack?: number
  readonly release?: number
  readonly filterType?: BiquadFilterType
  readonly filterFrequency?: number
  readonly filterTargetFrequency?: number
  readonly q?: number
  readonly playbackRate?: number
}

interface SamplePlaybackOptions {
  readonly whenOffset?: number
  readonly volumeScale?: number
  readonly playbackRate?: number
  readonly duration?: number
  readonly attack?: number
  readonly release?: number
}

interface CountdownRumbleHandle {
  readonly mode: Exclude<SoundIntensityMode, 'off'>
  readonly audio: AudioContext
  readonly sources: readonly AudioScheduledSourceNode[]
  readonly gainNodes: readonly GainNode[]
  readonly timeoutId: number
}

export type SoundIntensityMode = 'off' | 'light' | 'heavy'

function getCtx(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }

  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  return ctx
}

function getOutput(audio: AudioContext): AudioNode {
  if (!compressor || !outputBus) {
    compressor = audio.createDynamicsCompressor()
    outputBus = audio.createGain()

    compressor.threshold.value = -18
    compressor.knee.value = 20
    compressor.ratio.value = 4
    compressor.attack.value = 0.004
    compressor.release.value = 0.18
    outputBus.gain.value = 0.92

    compressor.connect(outputBus)
    outputBus.connect(audio.destination)
  }

  return compressor
}

function getMusicBus(audio: AudioContext): GainNode {
  if (!musicBus) {
    musicBus = audio.createGain()
    musicBus.gain.value = 0.0001
    musicBus.connect(getOutput(audio))
  }

  return musicBus
}

function fadeMusicBus(target: number, duration: number): void {
  const audio = getCtx()
  if (!audio) return

  const bus = getMusicBus(audio)
  const safeTarget = Math.max(target, 0.0001)
  const currentValue = Math.max(bus.gain.value, 0.0001)

  bus.gain.cancelScheduledValues(audio.currentTime)
  bus.gain.setValueAtTime(currentValue, audio.currentTime)

  if (safeTarget > currentValue) {
    bus.gain.linearRampToValueAtTime(safeTarget, audio.currentTime + duration)
  } else {
    bus.gain.exponentialRampToValueAtTime(safeTarget, audio.currentTime + duration)
  }
}

function getNoiseBuffer(audio: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === audio.sampleRate) {
    return noiseBuffer
  }

  const length = audio.sampleRate * 2
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const channel = buffer.getChannelData(0)
  let lastBrown = 0

  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1
    lastBrown = (lastBrown + (0.06 * white)) / 1.06
    channel[index] = lastBrown * 3.1
  }

  noiseBuffer = buffer
  return buffer
}

function createEnvelope(audio: AudioContext, startTime: number, duration: number, volume: number, attack: number, release: number): GainNode {
  const gain = audio.createGain()
  const peakTime = startTime + Math.max(attack, 0.008)
  const releaseStart = Math.max(peakTime + 0.01, startTime + duration - Math.max(release, 0.04))

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, peakTime)
  gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.82, 0.0002), releaseStart)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  return gain
}

function tone(options: ToneOptions): void {
  const audio = getCtx()
  if (!audio) return

  const startTime = audio.currentTime + (options.whenOffset ?? 0)
  const envelope = createEnvelope(
    audio,
    startTime,
    options.duration,
    options.volume,
    options.attack ?? 0.012,
    options.release ?? Math.min(0.18, options.duration * 0.55),
  )
  const filter = audio.createBiquadFilter()
  const detuneStack = options.detune ?? [0]

  filter.type = options.filterType ?? 'lowpass'
  filter.Q.value = options.q ?? 0.9
  filter.frequency.setValueAtTime(options.filterFrequency ?? Math.max(900, options.frequency * 2.6), startTime)
  if (options.filterTargetFrequency) {
    filter.frequency.exponentialRampToValueAtTime(options.filterTargetFrequency, startTime + options.duration)
  }

  filter.connect(envelope)
  envelope.connect(getOutput(audio))

  for (const detune of detuneStack) {
    const oscillator = audio.createOscillator()
    oscillator.type = options.type
    oscillator.frequency.setValueAtTime(options.frequency, startTime)
    oscillator.detune.setValueAtTime(detune, startTime)
    oscillator.connect(filter)
    oscillator.start(startTime)
    oscillator.stop(startTime + options.duration)
  }
}

function noise(options: NoiseOptions): void {
  const audio = getCtx()
  if (!audio) return

  const startTime = audio.currentTime + (options.whenOffset ?? 0)
  const source = audio.createBufferSource()
  const filter = audio.createBiquadFilter()
  const envelope = createEnvelope(
    audio,
    startTime,
    options.duration,
    options.volume,
    options.attack ?? 0.01,
    options.release ?? Math.min(0.22, options.duration * 0.6),
  )

  source.buffer = getNoiseBuffer(audio)
  source.loop = true
  source.playbackRate.setValueAtTime(options.playbackRate ?? 1, startTime)

  filter.type = options.filterType ?? 'lowpass'
  filter.Q.value = options.q ?? 1.1
  filter.frequency.setValueAtTime(options.filterFrequency ?? 800, startTime)
  if (options.filterTargetFrequency) {
    filter.frequency.exponentialRampToValueAtTime(options.filterTargetFrequency, startTime + options.duration)
  }

  source.connect(filter)
  filter.connect(envelope)
  envelope.connect(getOutput(audio))

  source.start(startTime)
  source.stop(startTime + options.duration)
}

async function decodeSample(sample: MissionOrbitSampleDefinition): Promise<void> {
  const audio = getCtx()
  if (!audio || decodedSamples.has(sample.id) || failedSamples.has(sample.id)) return

  try {
    const response = await fetch(sample.url, { cache: 'force-cache' })
    if (!response.ok) {
      failedSamples.add(sample.id)
      return
    }

    const audioData = await response.arrayBuffer()
    const buffer = await audio.decodeAudioData(audioData.slice(0))
    decodedSamples.set(sample.id, buffer)
  } catch {
    failedSamples.add(sample.id)
  }
}

export function loadSamples(): Promise<void> {
  const audio = getCtx()
  if (!audio) return Promise.resolve()
  if (sampleLoadPromise) return sampleLoadPromise

  const bundledSamples = getBundledMissionOrbitSamples().filter((sample) => !decodedSamples.has(sample.id) && !failedSamples.has(sample.id))
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

function playSample(sampleId: MissionOrbitSampleId, options: SamplePlaybackOptions = {}): boolean {
  const audio = getCtx()
  const sample = missionOrbitSampleManifest[sampleId]
  const buffer = decodedSamples.get(sampleId)
  if (!audio || !sample || !buffer) return false

  const startTime = audio.currentTime + (options.whenOffset ?? 0)
  const playbackRate = options.playbackRate ?? 1
  const source = audio.createBufferSource()
  const duration = options.duration ?? buffer.duration / playbackRate
  const envelope = createEnvelope(
    audio,
    startTime,
    duration,
    sample.gain * (options.volumeScale ?? 1),
    options.attack ?? 0.01,
    options.release ?? Math.min(0.16, Math.max(duration * 0.45, 0.06)),
  )

  source.buffer = buffer
  source.loop = sample.loop && duration > 0
  source.playbackRate.setValueAtTime(playbackRate, startTime)
  source.connect(envelope)
  envelope.connect(getOutput(audio))

  source.start(startTime)
  source.stop(startTime + duration)
  return true
}

function loadMusicPreference(): void {
  if (musicPreferenceLoaded) return
  musicPreferenceLoaded = true
  try {
    musicEnabled = window.localStorage.getItem(MUSIC_STORAGE_KEY) === 'true'
  } catch {
    musicEnabled = false
  }
}

function loadSfxIntensityPreference(): void {
  if (sfxIntensityPreferenceLoaded) return
  sfxIntensityPreferenceLoaded = true
  try {
    const stored = window.localStorage.getItem(SFX_INTENSITY_STORAGE_KEY)
    sfxIntensity = stored === 'off' || stored === 'light' || stored === 'heavy' ? stored : 'heavy'
  } catch {
    sfxIntensity = 'heavy'
  }
}

function isSfxEnabled(): boolean {
  loadSfxIntensityPreference()
  return sfxIntensity !== 'off'
}

function getPhysicalSampleIntensity(): MissionOrbitSampleIntensity | null {
  loadSfxIntensityPreference()
  if (sfxIntensity === 'off') {
    return null
  }

  return sfxIntensity
}

function getHeavySoundMode(): boolean {
  loadSfxIntensityPreference()
  return sfxIntensity === 'heavy'
}

function playPhysicalSample(sampleId: MissionOrbitPhysicalSampleId, options: SamplePlaybackOptions = {}): boolean {
  const preferredIntensity = getPhysicalSampleIntensity()
  if (!preferredIntensity) {
    return false
  }

  const preferredId = getMissionOrbitSampleVariantId(sampleId, preferredIntensity)
  const fallbackId = getMissionOrbitSampleVariantId(sampleId, preferredIntensity === 'heavy' ? 'light' : 'heavy')

  return playSample(preferredId, options) || playSample(fallbackId, options)
}

function chord(notes: readonly number[], duration: number, volume: number): void {
  for (const frequency of notes) {
    tone({
      frequency,
      duration,
      type: 'triangle',
      volume,
      detune: [-4, 0, 5],
      filterType: 'lowpass',
      filterFrequency: Math.max(900, frequency * 2.1),
      filterTargetFrequency: Math.max(1100, frequency * 2.6),
      attack: 0.02,
      release: Math.min(0.24, duration * 0.5),
    })
  }
}

function playAmbientPad(audio: AudioContext, frequency: number, startTime: number, duration: number, volume: number): void {
  const destination = getMusicBus(audio)
  const filter = audio.createBiquadFilter()
  const gain = audio.createGain()
  const oscA = audio.createOscillator()
  const oscB = audio.createOscillator()

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(860, startTime)
  filter.frequency.linearRampToValueAtTime(1120, startTime + duration * 0.72)
  filter.Q.value = 0.42

  oscA.type = 'triangle'
  oscB.type = 'sine'
  oscA.frequency.setValueAtTime(frequency, startTime)
  oscB.frequency.setValueAtTime(frequency * 0.5, startTime)
  oscB.detune.setValueAtTime(6, startTime)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 1.1)
  gain.gain.linearRampToValueAtTime(volume * 0.74, startTime + Math.max(duration - 1.5, 1.4))
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscA.connect(filter)
  oscB.connect(filter)
  filter.connect(gain)
  gain.connect(destination)

  oscA.start(startTime)
  oscB.start(startTime)
  oscA.stop(startTime + duration)
  oscB.stop(startTime + duration)
}

function playAmbientBell(audio: AudioContext, frequency: number, startTime: number, duration: number, volume: number): void {
  const destination = getMusicBus(audio)
  const filter = audio.createBiquadFilter()
  const gain = audio.createGain()
  const osc = audio.createOscillator()

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1560, startTime)
  filter.frequency.exponentialRampToValueAtTime(1040, startTime + duration)
  filter.Q.value = 0.34

  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, startTime)

  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(destination)

  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playAmbientMeasure(): void {
  const audio = getCtx()
  if (!audio || audio.state === 'suspended') return

  const measure = AMBIENT_PROGRESSIONS[ambientMeasureIndex % AMBIENT_PROGRESSIONS.length]
  const startTime = audio.currentTime + 0.05
  const measureDuration = 5.2
  const physicalIntensity = getPhysicalSampleIntensity()

  if (physicalIntensity) {
    playPhysicalSample('space-ambience', {
      duration: 2.7,
      volumeScale: physicalIntensity === 'heavy' ? 0.24 : 0.12,
      playbackRate: physicalIntensity === 'heavy' ? 0.76 : 0.7,
      attack: 0.48,
      release: 0.78,
    })
  }

  playAmbientPad(audio, measure.drone, startTime, measureDuration, 0.0064)

  for (const frequency of measure.chord) {
    playAmbientPad(audio, frequency, startTime, measureDuration, 0.0094)
  }

  playAmbientBell(audio, measure.sparkles[0], startTime + 1.18, 1.8, 0.0046)
  playAmbientBell(audio, measure.sparkles[1], startTime + 3.12, 1.55, 0.0039)
  ambientMeasureIndex += 1
}

function startAmbientLoop(): void {
  if (ambientInterval !== null || document.hidden) return

  ambientMeasureIndex = 0
  fadeMusicBus(0.068, 1.4)
  playAmbientMeasure()
  ambientInterval = window.setInterval(playAmbientMeasure, AMBIENT_MEASURE_MS)
}

function stopAmbientLoop(): void {
  if (ambientInterval !== null) {
    window.clearInterval(ambientInterval)
    ambientInterval = null
  }

  fadeMusicBus(0.0001, 0.9)
}

function restartAmbientLoop(): void {
  if (ambientInterval === null || !musicEnabled || document.hidden) {
    return
  }

  stopAmbientLoop()
  startAmbientLoop()
}

function stopCountdownRumble(): void {
  if (!countdownRumble) {
    return
  }

  window.clearTimeout(countdownRumble.timeoutId)

  const fadeStart = countdownRumble.audio.currentTime
  const stopTime = fadeStart + 0.08

  for (const gain of countdownRumble.gainNodes) {
    const currentValue = Math.max(gain.gain.value, 0.0001)
    gain.gain.cancelScheduledValues(fadeStart)
    gain.gain.setValueAtTime(currentValue, fadeStart)
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  }

  for (const source of countdownRumble.sources) {
    try {
      source.stop(stopTime + 0.02)
    } catch {
      // Ignore nodes that already stopped.
    }
  }

  countdownRumble = null
}

function startCountdownRumble(mode: Exclude<SoundIntensityMode, 'off'>): void {
  const audio = getCtx()
  if (!audio || audio.state === 'suspended') return

  stopCountdownRumble()

  const startTime = audio.currentTime + 0.01
  const stopTime = startTime + COUNTDOWN_RUMBLE_DURATION
  const sources: AudioScheduledSourceNode[] = []
  const gainNodes: GainNode[] = []

  const bodyNoise = audio.createBufferSource()
  const bodyFilter = audio.createBiquadFilter()
  const bodyGain = audio.createGain()

  bodyNoise.buffer = getNoiseBuffer(audio)
  bodyNoise.loop = true
  bodyNoise.playbackRate.setValueAtTime(mode === 'heavy' ? 0.42 : 0.5, startTime)

  bodyFilter.type = 'lowpass'
  bodyFilter.Q.value = 0.92
  bodyFilter.frequency.setValueAtTime(mode === 'heavy' ? 160 : 190, startTime)
  bodyFilter.frequency.exponentialRampToValueAtTime(mode === 'heavy' ? 380 : 310, stopTime)

  bodyGain.gain.setValueAtTime(0.0001, startTime)
  bodyGain.gain.linearRampToValueAtTime(mode === 'heavy' ? 0.028 : 0.014, startTime + 1.6)
  bodyGain.gain.linearRampToValueAtTime(mode === 'heavy' ? 0.046 : 0.024, stopTime - 0.08)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, stopTime)

  bodyNoise.connect(bodyFilter)
  bodyFilter.connect(bodyGain)
  bodyGain.connect(getOutput(audio))
  bodyNoise.start(startTime)
  bodyNoise.stop(stopTime)
  sources.push(bodyNoise)
  gainNodes.push(bodyGain)

  const subFilter = audio.createBiquadFilter()
  const subGain = audio.createGain()
  const subOscA = audio.createOscillator()
  const subOscB = audio.createOscillator()

  subFilter.type = 'lowpass'
  subFilter.Q.value = 0.55
  subFilter.frequency.setValueAtTime(mode === 'heavy' ? 210 : 260, startTime)
  subFilter.frequency.exponentialRampToValueAtTime(mode === 'heavy' ? 140 : 170, stopTime)

  subGain.gain.setValueAtTime(0.0001, startTime)
  subGain.gain.linearRampToValueAtTime(mode === 'heavy' ? 0.013 : 0.008, startTime + 2.2)
  subGain.gain.linearRampToValueAtTime(mode === 'heavy' ? 0.022 : 0.012, stopTime - 0.04)
  subGain.gain.exponentialRampToValueAtTime(0.0001, stopTime)

  subOscA.type = 'sawtooth'
  subOscA.frequency.setValueAtTime(mode === 'heavy' ? 38 : 46, startTime)
  subOscA.detune.setValueAtTime(-5, startTime)
  subOscB.type = 'triangle'
  subOscB.frequency.setValueAtTime(mode === 'heavy' ? 56 : 68, startTime)
  subOscB.detune.setValueAtTime(4, startTime)

  subOscA.connect(subFilter)
  subOscB.connect(subFilter)
  subFilter.connect(subGain)
  subGain.connect(getOutput(audio))
  subOscA.start(startTime)
  subOscB.start(startTime)
  subOscA.stop(stopTime)
  subOscB.stop(stopTime)
  sources.push(subOscA, subOscB)
  gainNodes.push(subGain)

  if (mode === 'heavy') {
    const textureNoise = audio.createBufferSource()
    const textureFilter = audio.createBiquadFilter()
    const textureGain = audio.createGain()
    const growlFilter = audio.createBiquadFilter()
    const growlGain = audio.createGain()
    const growl = audio.createOscillator()

    textureNoise.buffer = getNoiseBuffer(audio)
    textureNoise.loop = true
    textureNoise.playbackRate.setValueAtTime(0.84, startTime)

    textureFilter.type = 'bandpass'
    textureFilter.Q.value = 0.62
    textureFilter.frequency.setValueAtTime(620, startTime)
    textureFilter.frequency.exponentialRampToValueAtTime(980, stopTime)

    textureGain.gain.setValueAtTime(0.0001, startTime)
    textureGain.gain.linearRampToValueAtTime(0.006, startTime + 1.2)
    textureGain.gain.linearRampToValueAtTime(0.011, stopTime - 0.04)
    textureGain.gain.exponentialRampToValueAtTime(0.0001, stopTime)

    textureNoise.connect(textureFilter)
    textureFilter.connect(textureGain)
    textureGain.connect(getOutput(audio))
    textureNoise.start(startTime)
    textureNoise.stop(stopTime)
    sources.push(textureNoise)
    gainNodes.push(textureGain)

    growlFilter.type = 'lowpass'
    growlFilter.Q.value = 0.48
    growlFilter.frequency.setValueAtTime(420, startTime)
    growlFilter.frequency.exponentialRampToValueAtTime(260, stopTime)

    growlGain.gain.setValueAtTime(0.0001, startTime)
    growlGain.gain.linearRampToValueAtTime(0.01, startTime + 2.5)
    growlGain.gain.linearRampToValueAtTime(0.017, stopTime - 0.04)
    growlGain.gain.exponentialRampToValueAtTime(0.0001, stopTime)

    growl.type = 'triangle'
    growl.frequency.setValueAtTime(84, startTime)
    growl.detune.setValueAtTime(7, startTime)

    growl.connect(growlFilter)
    growlFilter.connect(growlGain)
    growlGain.connect(getOutput(audio))
    growl.start(startTime)
    growl.stop(stopTime)
    sources.push(growl)
    gainNodes.push(growlGain)
  }

  const timeoutId = window.setTimeout(() => {
    if (countdownRumble?.audio === audio && countdownRumble.mode === mode) {
      countdownRumble = null
    }
  }, Math.ceil((COUNTDOWN_RUMBLE_DURATION + 0.3) * 1000))

  countdownRumble = {
    mode,
    audio,
    sources,
    gainNodes,
    timeoutId,
  }
}

export function ensureAudioUnlocked(): void {
  if (unlocked) return
  const audio = getCtx()
  if (!audio) return

  const buffer = audio.createBuffer(1, 1, audio.sampleRate)
  const source = audio.createBufferSource()
  source.buffer = buffer
  source.connect(audio.destination)
  source.start()

  unlocked = true
}

export function getMusicEnabled(): boolean {
  loadMusicPreference()
  return musicEnabled
}

export function getSfxIntensityMode(): SoundIntensityMode {
  loadSfxIntensityPreference()
  return sfxIntensity
}

export function setMusicEnabled(enabled: boolean): void {
  loadMusicPreference()
  if (musicEnabled !== enabled) {
    ambientMeasureIndex = 0
  }
  musicEnabled = enabled
  try {
    window.localStorage.setItem(MUSIC_STORAGE_KEY, String(enabled))
  } catch {
    // Ignore localStorage failures.
  }
}

export function setSfxIntensityMode(mode: SoundIntensityMode): void {
  loadSfxIntensityPreference()
  const nextMode = mode === 'off' || mode === 'light' || mode === 'heavy' ? mode : 'heavy'
  if (sfxIntensity === nextMode) {
    return
  }

  sfxIntensity = nextMode
  stopCountdownRumble()
  restartAmbientLoop()
  try {
    window.localStorage.setItem(SFX_INTENSITY_STORAGE_KEY, sfxIntensity)
  } catch {
    // Ignore localStorage failures.
  }
}

export function syncMusicPlayback(phase: MissionPhase): void {
  loadMusicPreference()
  if (!musicEnabled || document.hidden || !SPACE_MUSIC_PHASES.has(phase)) {
    stopAmbientLoop()
    return
  }

  startAmbientLoop()
}

export function syncCountdownRumble(phase: MissionPhase, countdownValue: number): void {
  const intensity = getPhysicalSampleIntensity()
  if (phase !== 'countdown' || countdownValue > 7 || countdownValue <= 0 || document.hidden || !intensity) {
    stopCountdownRumble()
    return
  }

  if (countdownRumble?.mode === intensity) {
    return
  }

  startCountdownRumble(intensity)
}

export function sfxButton(): void {
  if (!isSfxEnabled()) {
    return
  }

  tone({
    frequency: 620,
    duration: 0.09,
    type: 'triangle',
    volume: 0.034,
    detune: [-5, 0, 6],
    filterType: 'lowpass',
    filterFrequency: 2200,
    filterTargetFrequency: 1200,
    attack: 0.008,
    release: 0.05,
  })
}

export function sfxCountdownBeep(value: number): void {
  if (!isSfxEnabled()) {
    return
  }

  const frequency = value <= 3 ? 920 : 680
  tone({
    frequency,
    duration: 0.11,
    type: 'square',
    volume: 0.03,
    detune: [0, 4],
    filterType: 'lowpass',
    filterFrequency: 2200,
    filterTargetFrequency: 1400,
    attack: 0.004,
    release: 0.07,
  })
}

export function sfxEngineIgnition(): void {
  if (!isSfxEnabled()) {
    return
  }

  const samplePlayed = playPhysicalSample('launch-rumble', { playbackRate: 0.9, duration: 0.52 })
  const heavyMode = getHeavySoundMode()

  noise({
    duration: 0.48,
    volume: samplePlayed ? (heavyMode ? 0.028 : 0.018) : 0.05,
    filterType: 'lowpass',
    filterFrequency: 180,
    filterTargetFrequency: 420,
    q: 0.9,
    attack: 0.02,
    release: 0.16,
    playbackRate: 0.82,
  })
  tone({
    frequency: 84,
    duration: 0.52,
    type: 'sawtooth',
    volume: samplePlayed ? (heavyMode ? 0.012 : 0.008) : 0.018,
    detune: [-11, 0, 9],
    filterType: 'lowpass',
    filterFrequency: 280,
    filterTargetFrequency: 180,
    attack: 0.03,
    release: 0.2,
  })
}

export function sfxLiftoff(): void {
  stopCountdownRumble()
  if (!isSfxEnabled()) {
    return
  }

  const samplePlayed = playPhysicalSample('launch-rumble', { playbackRate: 1, duration: 0.78 })
  const heavyMode = getHeavySoundMode()

  noise({
    duration: 0.78,
    volume: samplePlayed ? (heavyMode ? 0.04 : 0.025) : 0.075,
    filterType: 'lowpass',
    filterFrequency: 220,
    filterTargetFrequency: 900,
    q: 0.8,
    attack: 0.015,
    release: 0.24,
    playbackRate: 0.78,
  })
  noise({
    duration: 0.62,
    volume: samplePlayed ? (heavyMode ? 0.01 : 0.006) : 0.016,
    whenOffset: 0.06,
    filterType: 'highpass',
    filterFrequency: 1200,
    filterTargetFrequency: 1800,
    q: 0.7,
    attack: 0.03,
    release: 0.16,
  })
  tone({
    frequency: 62,
    duration: 0.7,
    type: 'sawtooth',
    volume: samplePlayed ? (heavyMode ? 0.015 : 0.01) : 0.024,
    detune: [-7, 0, 7],
    filterType: 'lowpass',
    filterFrequency: 220,
    filterTargetFrequency: 140,
    attack: 0.02,
    release: 0.24,
  })
}

export function sfxBurnPulse(): void {
  if (!isSfxEnabled()) {
    return
  }

  if (playPhysicalSample('burn-thrust-pulse')) {
    return
  }

  noise({
    duration: 0.24,
    volume: 0.03,
    filterType: 'bandpass',
    filterFrequency: 320,
    filterTargetFrequency: 420,
    q: 1.2,
    attack: 0.01,
    release: 0.12,
    playbackRate: 0.9,
  })
  tone({
    frequency: 132,
    duration: 0.18,
    type: 'triangle',
    volume: 0.015,
    detune: [-4, 0, 4],
    filterType: 'lowpass',
    filterFrequency: 420,
    filterTargetFrequency: 520,
    attack: 0.005,
    release: 0.09,
  })
}

export function sfxBurnWindow(): void {
  if (!isSfxEnabled()) {
    return
  }

  tone({
    frequency: 460,
    duration: 0.1,
    type: 'triangle',
    volume: 0.024,
    detune: [-5, 0, 5],
    filterType: 'lowpass',
    filterFrequency: 1800,
    filterTargetFrequency: 1300,
    attack: 0.008,
    release: 0.06,
  })
  tone({
    frequency: 620,
    duration: 0.12,
    type: 'sine',
    volume: 0.018,
    whenOffset: 0.07,
    detune: [0, 7],
    filterType: 'lowpass',
    filterFrequency: 2400,
    filterTargetFrequency: 1500,
    attack: 0.008,
    release: 0.08,
  })
}

export function sfxCueApproach(): void {
  if (!isSfxEnabled()) {
    return
  }

  tone({
    frequency: 520,
    duration: 0.07,
    type: 'triangle',
    volume: 0.016,
    detune: [-4, 0, 4],
    filterType: 'lowpass',
    filterFrequency: 1800,
    filterTargetFrequency: 1400,
    attack: 0.004,
    release: 0.05,
  })
}

export function sfxCueReady(): void {
  if (!isSfxEnabled()) {
    return
  }

  tone({
    frequency: 660,
    duration: 0.08,
    type: 'triangle',
    volume: 0.02,
    detune: [-6, 0, 6],
    filterType: 'lowpass',
    filterFrequency: 2100,
    filterTargetFrequency: 1500,
    attack: 0.004,
    release: 0.06,
  })
  tone({
    frequency: 880,
    duration: 0.1,
    type: 'sine',
    volume: 0.014,
    whenOffset: 0.04,
    detune: [0, 7],
    filterType: 'lowpass',
    filterFrequency: 2600,
    filterTargetFrequency: 1700,
    attack: 0.004,
    release: 0.07,
  })
}

export function sfxCueStrike(): void {
  if (!isSfxEnabled()) {
    return
  }

  chord([659.25, 987.77], 0.16, 0.015)
  tone({
    frequency: 1318.51,
    duration: 0.12,
    type: 'sine',
    volume: 0.018,
    whenOffset: 0.03,
    detune: [-3, 0, 3],
    filterType: 'lowpass',
    filterFrequency: 2800,
    filterTargetFrequency: 1800,
    attack: 0.006,
    release: 0.08,
  })
}

export function sfxStopMo(): void {
  if (!isSfxEnabled()) {
    return
  }

  tone({
    frequency: 740,
    duration: 0.08,
    type: 'triangle',
    volume: 0.018,
    detune: [-8, 0, 7],
    filterType: 'bandpass',
    filterFrequency: 1600,
    filterTargetFrequency: 900,
    q: 1.4,
    attack: 0.005,
    release: 0.06,
  })
  noise({
    duration: 0.2,
    volume: 0.012,
    whenOffset: 0.03,
    filterType: 'bandpass',
    filterFrequency: 900,
    filterTargetFrequency: 380,
    q: 1.5,
    attack: 0.01,
    release: 0.1,
  })
  tone({
    frequency: 320,
    duration: 0.2,
    type: 'sine',
    volume: 0.014,
    whenOffset: 0.05,
    detune: [-5, 0, 5],
    filterType: 'lowpass',
    filterFrequency: 820,
    filterTargetFrequency: 420,
    attack: 0.01,
    release: 0.12,
  })
}

export function sfxBurnResult(grade: BurnGrade): void {
  if (!isSfxEnabled()) {
    return
  }

  if (grade === 'assist') {
    tone({
      frequency: 200,
      duration: 0.2,
      type: 'triangle',
      volume: 0.02,
      detune: [-8, 0, 6],
      filterType: 'lowpass',
      filterFrequency: 700,
      filterTargetFrequency: 420,
      attack: 0.008,
      release: 0.12,
    })
    noise({
      duration: 0.16,
      volume: 0.01,
      whenOffset: 0.05,
      filterType: 'bandpass',
      filterFrequency: 580,
      filterTargetFrequency: 340,
      q: 1.2,
      attack: 0.01,
      release: 0.08,
    })
    return
  }

  if (grade === 'safe') {
    chord([392, 523.25], 0.24, 0.013)
    return
  }

  if (grade === 'good') {
    chord([440, 554.37, 659.25], 0.26, 0.013)
    return
  }

  chord([523.25, 659.25, 783.99], 0.3, 0.014)
  tone({
    frequency: 1046.5,
    duration: 0.24,
    type: 'sine',
    volume: 0.012,
    whenOffset: 0.05,
    detune: [-4, 0, 4],
    filterType: 'lowpass',
    filterFrequency: 2600,
    filterTargetFrequency: 1800,
    attack: 0.01,
    release: 0.08,
  })
}

export function sfxReentry(): void {
  if (!isSfxEnabled()) {
    return
  }

  if (playPhysicalSample('reentry-texture')) {
    return
  }

  noise({
    duration: 0.62,
    volume: 0.048,
    filterType: 'bandpass',
    filterFrequency: 1800,
    filterTargetFrequency: 520,
    q: 1.8,
    attack: 0.015,
    release: 0.2,
    playbackRate: 1.08,
  })
  tone({
    frequency: 170,
    duration: 0.48,
    type: 'triangle',
    volume: 0.012,
    detune: [-6, 0, 6],
    filterType: 'lowpass',
    filterFrequency: 620,
    filterTargetFrequency: 240,
    attack: 0.02,
    release: 0.18,
  })
}

export function sfxParachute(): void {
  if (!isSfxEnabled()) {
    return
  }

  if (playPhysicalSample('parachute-deploy')) {
    return
  }

  noise({
    duration: 0.22,
    volume: 0.018,
    filterType: 'highpass',
    filterFrequency: 1400,
    filterTargetFrequency: 760,
    q: 0.8,
    attack: 0.004,
    release: 0.14,
  })
  tone({
    frequency: 540,
    duration: 0.22,
    type: 'triangle',
    volume: 0.014,
    whenOffset: 0.03,
    detune: [-5, 0, 5],
    filterType: 'lowpass',
    filterFrequency: 1100,
    filterTargetFrequency: 640,
    attack: 0.01,
    release: 0.12,
  })
}

export function sfxSplashdown(): void {
  if (!isSfxEnabled()) {
    return
  }

  const heavyMode = getHeavySoundMode()
  if (playPhysicalSample('splashdown', { playbackRate: heavyMode ? 0.96 : 1, attack: 0.008, release: heavyMode ? 0.16 : 0.1 })) {
    return
  }

  tone({
    frequency: 160,
    duration: heavyMode ? 0.26 : 0.18,
    type: 'triangle',
    volume: heavyMode ? 0.028 : 0.02,
    detune: [-7, 0, 7],
    filterType: 'lowpass',
    filterFrequency: heavyMode ? 440 : 520,
    filterTargetFrequency: heavyMode ? 180 : 260,
    attack: 0.004,
    release: heavyMode ? 0.14 : 0.1,
  })
  noise({
    duration: heavyMode ? 0.42 : 0.28,
    volume: heavyMode ? 0.034 : 0.022,
    whenOffset: 0.02,
    filterType: 'bandpass',
    filterFrequency: heavyMode ? 560 : 720,
    filterTargetFrequency: heavyMode ? 180 : 260,
    q: heavyMode ? 0.8 : 0.9,
    attack: 0.005,
    release: heavyMode ? 0.22 : 0.16,
  })

  if (heavyMode) {
    tone({
      frequency: 104,
      duration: 0.34,
      type: 'sine',
      volume: 0.018,
      whenOffset: 0.03,
      detune: [-4, 0, 4],
      filterType: 'lowpass',
      filterFrequency: 260,
      filterTargetFrequency: 140,
      attack: 0.01,
      release: 0.18,
    })
  }
}

export function sfxCelebration(): void {
  if (!isSfxEnabled()) {
    return
  }

  if (playPhysicalSample('celebration-accent', { attack: 0.01, release: 0.18 })) {
    return
  }

  chord([392, 523.25, 659.25], 0.36, 0.015)
  tone({
    frequency: 783.99,
    duration: 0.34,
    type: 'sine',
    volume: 0.014,
    whenOffset: 0.1,
    detune: [-3, 0, 3],
    filterType: 'lowpass',
    filterFrequency: 2400,
    filterTargetFrequency: 1700,
    attack: 0.01,
    release: 0.1,
  })
}