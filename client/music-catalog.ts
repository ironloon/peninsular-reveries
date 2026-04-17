// ── Shared music catalog — synthesized compositions from all games ─────────────
//
// Each track exposes start(musicBus) / stop(). Only one track plays at a time.
// Music is OFF by default. Selected track persists in localStorage.

import { getAudioContext } from './audio.js'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MusicTrack {
  readonly id: string
  readonly name: string
  start(musicBus: GainNode): void
  stop(): void
}

// ── localStorage key for selected track ───────────────────────────────────────

const TRACK_KEY = 'reveries-music-track'

export function getSelectedTrackId(): string | null {
  return localStorage.getItem(TRACK_KEY)
}

export function setSelectedTrackId(id: string): void {
  localStorage.setItem(TRACK_KEY, id)
}

// ── Snack Break — Pentatonic melody + triangle bass (from Chompers, 120 BPM) ─

const snackBreakState: { timer: number | null } = { timer: null }

function startSnackBreak(musicBus: GainNode): void {
  if (snackBreakState.timer !== null) return

  const pentatonic = [261.63, 293.66, 329.63, 392, 440]
  const melody = [0, 2, 3, 4, 3, 2, 1, 2, 0, 2, 4, 3, 4, 3, 2, 1]
  const beatDuration = 0.25 // 8th note at 120 BPM
  const loopMs = melody.length * beatDuration * 1000

  const scheduleLoop = (): void => {
    const c = getAudioContext()
    const now = c.currentTime + 0.05

    for (let i = 0; i < melody.length; i++) {
      const freq = pentatonic[melody[i]]
      const startTime = now + i * beatDuration

      // Lead — sine
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + beatDuration)
      osc.connect(gain)
      gain.connect(musicBus)
      osc.start(startTime)
      osc.stop(startTime + beatDuration)

      // Bass — triangle on every 4th note at freq/2
      if (i % 4 === 0) {
        const bass = c.createOscillator()
        const bassGain = c.createGain()
        bass.type = 'triangle'
        bass.frequency.setValueAtTime(freq / 2, startTime)
        bassGain.gain.setValueAtTime(0.0001, startTime)
        bassGain.gain.linearRampToValueAtTime(0.05, startTime + 0.02)
        bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 4 * beatDuration)
        bass.connect(bassGain)
        bassGain.connect(musicBus)
        bass.start(startTime)
        bass.stop(startTime + 4 * beatDuration)
      }
    }
  }

  scheduleLoop()
  snackBreakState.timer = window.setInterval(scheduleLoop, loopMs)
}

function stopSnackBreak(): void {
  if (snackBreakState.timer !== null) {
    window.clearInterval(snackBreakState.timer)
    snackBreakState.timer = null
  }
}

export const snackBreak: MusicTrack = {
  id: 'snack-break',
  name: 'Snack Break',
  start: startSnackBreak,
  stop: stopSnackBreak,
}

// ── Driftwood — Warm triangle+sine progression (from Squares chill, 78 BPM) ──

const driftwoodState: { timer: number | null } = { timer: null }

const DRIFTWOOD_EVENTS = [
  { startStep: 0, durationSteps: 6, frequency: 220, gain: 0.065, type: 'triangle' as OscillatorType },
  { startStep: 2, durationSteps: 4, frequency: 277.18, gain: 0.04, type: 'sine' as OscillatorType },
  { startStep: 6, durationSteps: 6, frequency: 329.63, gain: 0.05, type: 'triangle' as OscillatorType },
  { startStep: 8, durationSteps: 4, frequency: 246.94, gain: 0.04, type: 'sine' as OscillatorType },
  { startStep: 10, durationSteps: 4, frequency: 293.66, gain: 0.04, type: 'triangle' as OscillatorType },
  { startStep: 12, durationSteps: 4, frequency: 220, gain: 0.05, type: 'sine' as OscillatorType },
]

function startDriftwood(musicBus: GainNode): void {
  if (driftwoodState.timer !== null) return

  const bpm = 78
  const stepsPerBeat = 2
  const loopBeats = 8
  const secPerStep = 60 / bpm / stepsPerBeat
  const loopMs = loopBeats * (60 / bpm) * 1000

  const scheduleLoop = (): void => {
    const c = getAudioContext()
    const now = c.currentTime + 0.05

    for (const ev of DRIFTWOOD_EVENTS) {
      const startTime = now + ev.startStep * secPerStep
      const dur = Math.max(ev.durationSteps * secPerStep, 0.08)

      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = ev.type
      osc.frequency.setValueAtTime(ev.frequency, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.linearRampToValueAtTime(ev.gain, startTime + 0.02)
      gain.gain.setValueAtTime(ev.gain, startTime + dur - 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur)
      osc.connect(gain)
      gain.connect(musicBus)
      osc.start(startTime)
      osc.stop(startTime + dur)
    }
  }

  scheduleLoop()
  driftwoodState.timer = window.setInterval(scheduleLoop, loopMs)
}

function stopDriftwood(): void {
  if (driftwoodState.timer !== null) {
    window.clearInterval(driftwoodState.timer)
    driftwoodState.timer = null
  }
}

export const driftwood: MusicTrack = {
  id: 'driftwood',
  name: 'Driftwood',
  start: startDriftwood,
  stop: stopDriftwood,
}

// ── Ember — Bright sawtooth+triangle (from Squares tense, 96 BPM) ────────────

const emberState: { timer: number | null } = { timer: null }

const EMBER_EVENTS = [
  { startStep: 0, durationSteps: 6, frequency: 196, gain: 0.1, type: 'sawtooth' as OscillatorType },
  { startStep: 4, durationSteps: 4, frequency: 233.08, gain: 0.08, type: 'triangle' as OscillatorType },
  { startStep: 8, durationSteps: 4, frequency: 261.63, gain: 0.08, type: 'sawtooth' as OscillatorType },
  { startStep: 12, durationSteps: 4, frequency: 246.94, gain: 0.08, type: 'triangle' as OscillatorType },
  { startStep: 16, durationSteps: 6, frequency: 174.61, gain: 0.1, type: 'sawtooth' as OscillatorType },
  { startStep: 20, durationSteps: 4, frequency: 220, gain: 0.08, type: 'triangle' as OscillatorType },
  { startStep: 24, durationSteps: 4, frequency: 233.08, gain: 0.08, type: 'sawtooth' as OscillatorType },
  { startStep: 28, durationSteps: 4, frequency: 207.65, gain: 0.08, type: 'triangle' as OscillatorType },
]

function startEmber(musicBus: GainNode): void {
  if (emberState.timer !== null) return

  const bpm = 96
  const stepsPerBeat = 4
  const loopBeats = 8
  const secPerStep = 60 / bpm / stepsPerBeat
  const loopMs = loopBeats * (60 / bpm) * 1000

  const scheduleLoop = (): void => {
    const c = getAudioContext()
    const now = c.currentTime + 0.05

    for (const ev of EMBER_EVENTS) {
      const startTime = now + ev.startStep * secPerStep
      const dur = Math.max(ev.durationSteps * secPerStep, 0.08)

      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = ev.type
      osc.frequency.setValueAtTime(ev.frequency, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.linearRampToValueAtTime(ev.gain, startTime + 0.02)
      gain.gain.setValueAtTime(ev.gain, startTime + dur - 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur)
      osc.connect(gain)
      gain.connect(musicBus)
      osc.start(startTime)
      osc.stop(startTime + dur)
    }
  }

  scheduleLoop()
  emberState.timer = window.setInterval(scheduleLoop, loopMs)
}

function stopEmber(): void {
  if (emberState.timer !== null) {
    window.clearInterval(emberState.timer)
    emberState.timer = null
  }
}

export const ember: MusicTrack = {
  id: 'ember',
  name: 'Ember',
  start: startEmber,
  stop: stopEmber,
}

// ── Starfield — Pad + sparkling bells, 4-chord rotation (from Super Word) ─────

const starfieldState: { timer: number | null } = { timer: null }

const STARFIELD_PROGRESSIONS = [
  { chord: [196, 293.66, 392], sparkles: [493.88, 587.33] },
  { chord: [174.61, 261.63, 392], sparkles: [440, 523.25] },
  { chord: [220, 329.63, 392], sparkles: [493.88, 659.25] },
  { chord: [196, 293.66, 369.99], sparkles: [440, 554.37] },
]

const STARFIELD_MEASURE_MS = 4200

function playStarfieldPad(musicBus: GainNode, freq: number, startTime: number, duration: number, volume: number): void {
  const c = getAudioContext()
  const filter = c.createBiquadFilter()
  const gain = c.createGain()
  const oscA = c.createOscillator()
  const oscB = c.createOscillator()

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1400, startTime)
  filter.Q.value = 0.4

  oscA.type = 'triangle'
  oscB.type = 'sine'
  oscA.frequency.setValueAtTime(freq, startTime)
  oscB.frequency.setValueAtTime(freq * 0.5, startTime)
  oscB.detune.setValueAtTime(6, startTime)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.9)
  gain.gain.linearRampToValueAtTime(volume * 0.72, startTime + Math.max(duration - 1.3, 1))
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscA.connect(filter)
  oscB.connect(filter)
  filter.connect(gain)
  gain.connect(musicBus)

  oscA.start(startTime)
  oscB.start(startTime)
  oscA.stop(startTime + duration)
  oscB.stop(startTime + duration)
}

function playStarfieldBell(musicBus: GainNode, freq: number, startTime: number, duration: number, volume: number): void {
  const c = getAudioContext()
  const osc = c.createOscillator()
  const gain = c.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  osc.connect(gain)
  gain.connect(musicBus)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function startStarfield(musicBus: GainNode): void {
  if (starfieldState.timer !== null) return

  let measureIndex = 0

  const scheduleMeasure = (): void => {
    const c = getAudioContext()
    const now = c.currentTime + 0.05
    const progression = STARFIELD_PROGRESSIONS[measureIndex % STARFIELD_PROGRESSIONS.length]

    for (const freq of progression.chord) {
      playStarfieldPad(musicBus, freq, now, 4.5, 0.014)
    }
    for (let i = 0; i < progression.sparkles.length; i++) {
      playStarfieldBell(musicBus, progression.sparkles[i], now + 0.7 + i * 1.1, 1.2, 0.012)
    }
    measureIndex += 1
  }

  scheduleMeasure()
  starfieldState.timer = window.setInterval(scheduleMeasure, STARFIELD_MEASURE_MS)
}

function stopStarfield(): void {
  if (starfieldState.timer !== null) {
    window.clearInterval(starfieldState.timer)
    starfieldState.timer = null
  }
}

export const starfield: MusicTrack = {
  id: 'starfield',
  name: 'Starfield',
  start: startStarfield,
  stop: stopStarfield,
}

// ── Canopy — Breathing D-minor chord bed (from Story Trail) ───────────────────

const canopyState: {
  oscillators: OscillatorNode[]
  gains: GainNode[]
  lfo: OscillatorNode | null
  chordInterval: number | null
} = { oscillators: [], gains: [], lfo: null, chordInterval: null }

const CANOPY_CHORDS = [
  [130.81, 164.81, 196.0],
  [146.83, 174.61, 220.0],
  [110.0, 130.81, 164.81],
  [98.0, 123.47, 146.83],
] as const

function startCanopy(musicBus: GainNode): void {
  if (canopyState.oscillators.length > 0) return

  const c = getAudioContext()
  const t = c.currentTime

  const masterGain = c.createGain()
  masterGain.gain.setValueAtTime(0.015, t)
  masterGain.connect(musicBus)
  canopyState.gains.push(masterGain)

  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.08, t)
  lfoGain.gain.setValueAtTime(0.004, t)
  lfo.connect(lfoGain)
  lfoGain.connect(masterGain.gain)
  lfo.start(t)
  canopyState.lfo = lfo
  canopyState.gains.push(lfoGain)

  for (const freq of CANOPY_CHORDS[0]) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.22, t)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(t)
    canopyState.oscillators.push(osc)
    canopyState.gains.push(gain)
  }

  let chordIndex = 0
  canopyState.chordInterval = window.setInterval(() => {
    chordIndex = (chordIndex + 1) % CANOPY_CHORDS.length
    const when = c.currentTime + 0.05
    const chord = CANOPY_CHORDS[chordIndex]

    chord.forEach((freq, voiceIndex) => {
      const osc = canopyState.oscillators[voiceIndex]
      if (!osc) return
      osc.frequency.cancelScheduledValues(when)
      osc.frequency.setValueAtTime(osc.frequency.value, when)
      osc.frequency.linearRampToValueAtTime(freq, when + 1.8)
    })
  }, 5500)
}

function stopCanopy(): void {
  if (canopyState.chordInterval !== null) {
    window.clearInterval(canopyState.chordInterval)
    canopyState.chordInterval = null
  }
  for (const osc of canopyState.oscillators) {
    try { osc.stop(); osc.disconnect() } catch { /* already stopped */ }
  }
  if (canopyState.lfo) {
    try { canopyState.lfo.stop(); canopyState.lfo.disconnect() } catch { /* already stopped */ }
    canopyState.lfo = null
  }
  for (const gain of canopyState.gains) {
    try { gain.disconnect() } catch { /* already disconnected */ }
  }
  canopyState.oscillators = []
  canopyState.gains = []
}

export const canopy: MusicTrack = {
  id: 'canopy',
  name: 'Canopy',
  start: startCanopy,
  stop: stopCanopy,
}

// ── Boulevard — Low sawtooth engine drone (from Pixel Passport bus) ───────────

const boulevardState: { stopper: (() => void) | null } = { stopper: null }

function startBoulevard(musicBus: GainNode): void {
  if (boulevardState.stopper) return

  const ctx = getAudioContext()
  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  gain.connect(musicBus)

  const oscillators: OscillatorNode[] = []

  const osc1 = ctx.createOscillator()
  osc1.type = 'sawtooth'
  osc1.frequency.value = 85
  const g1 = ctx.createGain()
  g1.gain.value = 0.025
  osc1.connect(g1)
  g1.connect(gain)
  osc1.start()
  oscillators.push(osc1)

  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.value = 170
  const g2 = ctx.createGain()
  g2.gain.value = 0.012
  osc2.connect(g2)
  g2.connect(gain)
  osc2.start()
  oscillators.push(osc2)

  gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.12)

  boulevardState.stopper = () => {
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
    window.setTimeout(() => {
      oscillators.forEach((o) => { try { o.stop() } catch { /* */ } })
      gain.disconnect()
    }, 220)
  }
}

function stopBoulevard(): void {
  boulevardState.stopper?.()
  boulevardState.stopper = null
}

export const boulevard: MusicTrack = {
  id: 'boulevard',
  name: 'Boulevard',
  start: startBoulevard,
  stop: stopBoulevard,
}

// ── Sleeper Car — Square wave rail hum (from Pixel Passport train) ────────────

const sleeperCarState: { stopper: (() => void) | null } = { stopper: null }

function startSleeperCar(musicBus: GainNode): void {
  if (sleeperCarState.stopper) return

  const ctx = getAudioContext()
  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  gain.connect(musicBus)

  const oscillators: OscillatorNode[] = []

  const osc1 = ctx.createOscillator()
  osc1.type = 'square'
  osc1.frequency.value = 92
  const g1 = ctx.createGain()
  g1.gain.value = 0.02
  osc1.connect(g1)
  g1.connect(gain)
  osc1.start()
  oscillators.push(osc1)

  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.value = 184
  const g2 = ctx.createGain()
  g2.gain.value = 0.015
  osc2.connect(g2)
  g2.connect(gain)
  osc2.start()
  oscillators.push(osc2)

  gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.12)

  sleeperCarState.stopper = () => {
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
    window.setTimeout(() => {
      oscillators.forEach((o) => { try { o.stop() } catch { /* */ } })
      gain.disconnect()
    }, 220)
  }
}

function stopSleeperCar(): void {
  sleeperCarState.stopper?.()
  sleeperCarState.stopper = null
}

export const sleeperCar: MusicTrack = {
  id: 'sleeper-car',
  name: 'Sleeper Car',
  start: startSleeperCar,
  stop: stopSleeperCar,
}

// ── Harbor — Sine wave harbor tone (from Pixel Passport boat) ─────────────────

const harborState: { stopper: (() => void) | null } = { stopper: null }

function startHarbor(musicBus: GainNode): void {
  if (harborState.stopper) return

  const ctx = getAudioContext()
  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  gain.connect(musicBus)

  const oscillators: OscillatorNode[] = []

  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.value = 110
  const g1 = ctx.createGain()
  g1.gain.value = 0.018
  osc1.connect(g1)
  g1.connect(gain)
  osc1.start()
  oscillators.push(osc1)

  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.value = 220
  const g2 = ctx.createGain()
  g2.gain.value = 0.01
  osc2.connect(g2)
  g2.connect(gain)
  osc2.start()
  oscillators.push(osc2)

  gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.12)

  harborState.stopper = () => {
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
    window.setTimeout(() => {
      oscillators.forEach((o) => { try { o.stop() } catch { /* */ } })
      gain.disconnect()
    }, 220)
  }
}

function stopHarbor(): void {
  harborState.stopper?.()
  harborState.stopper = null
}

export const harbor: MusicTrack = {
  id: 'harbor',
  name: 'Harbor',
  start: startHarbor,
  stop: stopHarbor,
}

// ── Contrails — Higher sawtooth soar (from Pixel Passport plane) ──────────────

const contrailsState: { stopper: (() => void) | null } = { stopper: null }

function startContrails(musicBus: GainNode): void {
  if (contrailsState.stopper) return

  const ctx = getAudioContext()
  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  gain.connect(musicBus)

  const oscillators: OscillatorNode[] = []

  const osc1 = ctx.createOscillator()
  osc1.type = 'sawtooth'
  osc1.frequency.value = 140
  const g1 = ctx.createGain()
  g1.gain.value = 0.018
  osc1.connect(g1)
  g1.connect(gain)
  osc1.start()
  oscillators.push(osc1)

  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.value = 280
  const g2 = ctx.createGain()
  g2.gain.value = 0.012
  osc2.connect(g2)
  g2.connect(gain)
  osc2.start()
  oscillators.push(osc2)

  gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.12)

  contrailsState.stopper = () => {
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
    window.setTimeout(() => {
      oscillators.forEach((o) => { try { o.stop() } catch { /* */ } })
      gain.disconnect()
    }, 220)
  }
}

function stopContrails(): void {
  contrailsState.stopper?.()
  contrailsState.stopper = null
}

export const contrails: MusicTrack = {
  id: 'contrails',
  name: 'Contrails',
  start: startContrails,
  stop: stopContrails,
}

// ── Tideline — Bandpass-filtered white noise (from Waterwall) ─────────────────

const tidelineState: {
  source: AudioBufferSourceNode | null
  gain: GainNode | null
} = { source: null, gain: null }

function startTideline(musicBus: GainNode): void {
  if (tidelineState.source) return

  const context = getAudioContext()
  const sampleRate = context.sampleRate
  const bufferLength = Math.ceil(sampleRate * 2)
  const buffer = context.createBuffer(1, bufferLength, sampleRate)
  const channel = buffer.getChannelData(0)
  for (let i = 0; i < bufferLength; i++) {
    channel[i] = Math.random() * 2 - 1
  }

  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800
  filter.Q.value = 1.5

  const gain = context.createGain()
  gain.gain.value = 0.0001

  source.connect(filter)
  filter.connect(gain)
  gain.connect(musicBus)

  source.start()

  const now = context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(0.06, now + 0.3)

  tidelineState.source = source
  tidelineState.gain = gain
}

function stopTideline(): void {
  if (tidelineState.gain) {
    const context = getAudioContext()
    const now = context.currentTime
    tidelineState.gain.gain.cancelScheduledValues(now)
    tidelineState.gain.gain.setValueAtTime(tidelineState.gain.gain.value, now)
    tidelineState.gain.gain.linearRampToValueAtTime(0.0001, now + 0.3)
  }

  const src = tidelineState.source
  if (src) {
    window.setTimeout(() => {
      try { src.stop(); src.disconnect() } catch { /* already stopped */ }
    }, 350)
  }

  tidelineState.source = null
  tidelineState.gain = null
}

export const tideline: MusicTrack = {
  id: 'tideline',
  name: 'Tideline',
  start: startTideline,
  stop: stopTideline,
}

// ── Catalog export ────────────────────────────────────────────────────────────

export const MUSIC_TRACKS: readonly MusicTrack[] = [
  snackBreak,
  driftwood,
  ember,
  starfield,
  canopy,
  boulevard,
  sleeperCar,
  harbor,
  contrails,
  tideline,
]
