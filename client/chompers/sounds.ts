import { chompersSampleManifest, getBundledChompersSamples, type ChompersSampleDefinition, type ChompersSampleId } from './sample-manifest.js'

let audioContext: AudioContext | null = null
let audioUnlocked = false
let outputBus: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
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

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
    } catch {
      return null
    }
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  return audioContext
}

function getOutput(context: AudioContext): AudioNode {
  if (!compressor || !outputBus) {
    compressor = context.createDynamicsCompressor()
    outputBus = context.createGain()

    compressor.threshold.value = -18
    compressor.knee.value = 16
    compressor.ratio.value = 3.5
    compressor.attack.value = 0.006
    compressor.release.value = 0.16
    outputBus.gain.value = 0.92

    compressor.connect(outputBus)
    outputBus.connect(context.destination)
  }

  return compressor
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
  const context = getAudioContext()
  if (!context) return

  const startTime = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = createEnvelope(context, startTime, duration, volume)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.connect(gain)
  gain.connect(getOutput(context))

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
  const context = getAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = createEnvelope(context, context.currentTime, duration, volume)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(startFrequency, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + duration)

  oscillator.connect(gain)
  gain.connect(getOutput(context))

  oscillator.start(context.currentTime)
  oscillator.stop(context.currentTime + duration)
}

async function decodeSample(sample: ChompersSampleDefinition): Promise<void> {
  const context = getAudioContext()
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
  const context = getAudioContext()
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
  const context = getAudioContext()
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
  gain.connect(getOutput(context))

  source.start(startTime)
  source.stop(startTime + duration)
  return true
}

export function ensureAudioUnlocked(): void {
  if (audioUnlocked) return
  const context = getAudioContext()
  if (!context) return

  const buffer = context.createBuffer(1, 1, context.sampleRate)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start()
  audioUnlocked = true
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

// ── Frenzy sounds ──────────────────────────────────────────────────────────────

function getMusicEnabled(): boolean {
  return true // no music toggle in Chompers yet; wired for future use
}

const PENTATONIC_FREQS = [261, 294, 329, 392, 440] as const
const FRENZY_MELODY = [0, 2, 3, 4, 3, 2, 1, 2, 0, 2, 4, 3, 4, 3, 2, 1] as const
const BEAT_DUR = 0.25 // 8th note at 120 BPM
const SCHEDULE_AHEAD = 0.1 // schedule this many seconds ahead
const SCHEDULE_INTERVAL = 25 // ms between scheduler checks

let frenzyMusicActive = false
let frenzyMusicScheduler: number | null = null
let frenzyNextNoteTime = 0
let frenzyNoteIndex = 0

function scheduleFrenzyNote(context: AudioContext): void {
  const freq = PENTATONIC_FREQS[FRENZY_MELODY[frenzyNoteIndex % FRENZY_MELODY.length]]
  const noteTime = frenzyNextNoteTime

  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, noteTime)
  gain.gain.setValueAtTime(0.0001, noteTime)
  gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + BEAT_DUR * 0.85)
  osc.connect(gain)
  gain.connect(getOutput(context))
  osc.start(noteTime)
  osc.stop(noteTime + BEAT_DUR)

  // Triangle bass on every 4th note (beat)
  if (frenzyNoteIndex % 4 === 0) {
    const bassOsc = context.createOscillator()
    const bassGain = context.createGain()
    bassOsc.type = 'triangle'
    bassOsc.frequency.setValueAtTime(freq / 2, noteTime)
    bassGain.gain.setValueAtTime(0.0001, noteTime)
    bassGain.gain.linearRampToValueAtTime(0.05, noteTime + 0.01)
    bassGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + BEAT_DUR * 4 * 0.9)
    bassOsc.connect(bassGain)
    bassGain.connect(getOutput(context))
    bassOsc.start(noteTime)
    bassOsc.stop(noteTime + BEAT_DUR * 4)
  }

  frenzyNoteIndex++
  frenzyNextNoteTime += BEAT_DUR
}

function frenzySchedulerLoop(): void {
  const context = getAudioContext()
  if (!context || !frenzyMusicActive) return

  while (frenzyNextNoteTime < context.currentTime + SCHEDULE_AHEAD) {
    scheduleFrenzyNote(context)
  }

  frenzyMusicScheduler = window.setTimeout(frenzySchedulerLoop, SCHEDULE_INTERVAL)
}

export function playFrenzyMusic(): void {
  if (frenzyMusicActive) return
  if (!getMusicEnabled()) return
  const context = getAudioContext()
  if (!context) return

  frenzyMusicActive = true
  frenzyNoteIndex = 0
  frenzyNextNoteTime = context.currentTime + 0.05
  frenzySchedulerLoop()
}

export function stopFrenzyMusic(): void {
  frenzyMusicActive = false
  if (frenzyMusicScheduler !== null) {
    window.clearTimeout(frenzyMusicScheduler)
    frenzyMusicScheduler = null
  }
}

export function playFrenzyCountdown(): void {
  // 3-2-1 beeps, increasing pitch, 500ms apart
  playTone(440, 0.15, 'sine', 0.1, 0)
  playTone(550, 0.15, 'sine', 0.1, 0.5)
  playTone(660, 0.2, 'sine', 0.12, 1.0)
}

export function playNpcChomp(): void {
  // Lower pitch chomp for NPC
  playTone(120, 0.07, 'triangle', 0.08)
  playTone(90, 0.1, 'square', 0.04, 0.03)
}

export function playNpcScore(): void {
  // Short boop
  playTone(440, 0.08, 'sine', 0.06)
  playTone(550, 0.08, 'sine', 0.05, 0.06)
}

export function playTimerWarning(): void {
  // 4 rapid ticks
  for (let i = 0; i < 4; i++) {
    playTone(880, 0.05, 'square', 0.06, i * 0.15)
  }
}

export function playFrenzyWin(): void {
  // Ascending arpeggio: C E G C' E'
  const freqs = [261, 329, 392, 523, 659]
  for (let i = 0; i < freqs.length; i++) {
    playTone(freqs[i], 0.2, 'sine', 0.1, i * 0.1)
  }
}

export function playFrenzyLose(): void {
  // Descending wah-wah (two overlapping sweeps)
  const context = getAudioContext()
  if (!context) return

  const startTime = context.currentTime

  const osc1 = context.createOscillator()
  const gain1 = context.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(440, startTime)
  osc1.frequency.exponentialRampToValueAtTime(110, startTime + 0.8)
  gain1.gain.setValueAtTime(0.0001, startTime)
  gain1.gain.linearRampToValueAtTime(0.1, startTime + 0.05)
  gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8)
  osc1.connect(gain1)
  gain1.connect(getOutput(context))
  osc1.start(startTime)
  osc1.stop(startTime + 0.8)

  const delay2 = 0.2
  const osc2 = context.createOscillator()
  const gain2 = context.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(330, startTime + delay2)
  osc2.frequency.exponentialRampToValueAtTime(82, startTime + delay2 + 0.8)
  gain2.gain.setValueAtTime(0.0001, startTime + delay2)
  gain2.gain.linearRampToValueAtTime(0.07, startTime + delay2 + 0.05)
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + delay2 + 0.8)
  osc2.connect(gain2)
  gain2.connect(getOutput(context))
  osc2.start(startTime + delay2)
  osc2.stop(startTime + delay2 + 0.8)
}
