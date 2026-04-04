import type { BurnGrade, MissionPhase } from './types.js'

let ctx: AudioContext | null = null
let unlocked = false
let musicEnabled = false
let musicPreferenceLoaded = false
let ambientInterval: number | null = null
let outputBus: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let noiseBuffer: AudioBuffer | null = null

const MUSIC_STORAGE_KEY = 'mission-orbit-music-enabled'
const SPACE_MUSIC_PHASES = new Set<MissionPhase>([
  'high-earth-orbit',
  'trans-lunar-injection',
  'lunar-flyby',
  'return-coast',
])

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

function loadMusicPreference(): void {
  if (musicPreferenceLoaded) return
  musicPreferenceLoaded = true
  try {
    musicEnabled = window.localStorage.getItem(MUSIC_STORAGE_KEY) === 'true'
  } catch {
    musicEnabled = false
  }
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

function playAmbientMeasure(): void {
  const audio = getCtx()
  if (!audio || audio.state === 'suspended') return

  chord([174.61, 261.63, 392], 2.8, 0.008)
  tone({
    frequency: 233.08,
    duration: 2.5,
    type: 'sine',
    volume: 0.004,
    whenOffset: 0.16,
    detune: [-7, 0, 7],
    filterType: 'lowpass',
    filterFrequency: 780,
    filterTargetFrequency: 1180,
    attack: 0.3,
    release: 0.55,
  })
  tone({
    frequency: 523.25,
    duration: 0.82,
    type: 'triangle',
    volume: 0.006,
    whenOffset: 0.58,
    filterType: 'lowpass',
    filterFrequency: 1700,
    filterTargetFrequency: 1200,
    attack: 0.05,
    release: 0.2,
  })
  tone({
    frequency: 659.25,
    duration: 0.72,
    type: 'triangle',
    volume: 0.005,
    whenOffset: 1.46,
    filterType: 'lowpass',
    filterFrequency: 1600,
    filterTargetFrequency: 1100,
    attack: 0.04,
    release: 0.18,
  })
  noise({
    duration: 2.3,
    volume: 0.0018,
    whenOffset: 0.08,
    filterType: 'bandpass',
    filterFrequency: 680,
    filterTargetFrequency: 420,
    q: 0.6,
    attack: 0.28,
    release: 0.5,
    playbackRate: 0.86,
  })
}

function startAmbientLoop(): void {
  if (ambientInterval !== null) return
  playAmbientMeasure()
  ambientInterval = window.setInterval(playAmbientMeasure, 2600)
}

function stopAmbientLoop(): void {
  if (ambientInterval !== null) {
    window.clearInterval(ambientInterval)
    ambientInterval = null
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

export function setMusicEnabled(enabled: boolean): void {
  loadMusicPreference()
  musicEnabled = enabled
  try {
    window.localStorage.setItem(MUSIC_STORAGE_KEY, String(enabled))
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

export function sfxButton(): void {
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
  noise({
    duration: 0.48,
    volume: 0.05,
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
    volume: 0.018,
    detune: [-11, 0, 9],
    filterType: 'lowpass',
    filterFrequency: 280,
    filterTargetFrequency: 180,
    attack: 0.03,
    release: 0.2,
  })
}

export function sfxLiftoff(): void {
  noise({
    duration: 0.78,
    volume: 0.075,
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
    volume: 0.016,
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
    volume: 0.024,
    detune: [-7, 0, 7],
    filterType: 'lowpass',
    filterFrequency: 220,
    filterTargetFrequency: 140,
    attack: 0.02,
    release: 0.24,
  })
}

export function sfxBurnPulse(): void {
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
  tone({
    frequency: 160,
    duration: 0.18,
    type: 'triangle',
    volume: 0.02,
    detune: [-7, 0, 7],
    filterType: 'lowpass',
    filterFrequency: 520,
    filterTargetFrequency: 260,
    attack: 0.004,
    release: 0.1,
  })
  noise({
    duration: 0.28,
    volume: 0.022,
    whenOffset: 0.02,
    filterType: 'bandpass',
    filterFrequency: 720,
    filterTargetFrequency: 260,
    q: 0.9,
    attack: 0.005,
    release: 0.16,
  })
}

export function sfxCelebration(): void {
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