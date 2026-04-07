import type { TransportType } from './types.js'
import { getAudioContext, createSfxBus } from '../audio.js'
import { getSfxEnabled } from '../preferences.js'

let _sfxBus: GainNode | null = null
let travelLoopStopper: (() => void) | null = null

function getCtx(): AudioContext | null {
  try {
    return getAudioContext()
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  if (!_sfxBus) _sfxBus = createSfxBus('pixel-passport')
  return _sfxBus
}

function canPlay(): boolean {
  return getSfxEnabled('pixel-passport')
}

function tone(frequency: number, durationMs: number, options?: { type?: OscillatorType; volume?: number; detune?: number }): void {
  if (!canPlay()) return

  const ctx = getCtx()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = options?.type ?? 'triangle'
  oscillator.frequency.value = frequency
  oscillator.detune.value = options?.detune ?? 0
  gain.gain.value = 0.0001
  oscillator.connect(gain)
  gain.connect(getSfxBusNode())

  const now = ctx.currentTime
  const volume = options?.volume ?? 0.04
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  oscillator.start(now)
  oscillator.stop(now + durationMs / 1000 + 0.02)
}

function chord(frequencies: readonly number[], durationMs: number, volume: number = 0.035): void {
  frequencies.forEach((frequency, index) => {
    tone(frequency, durationMs, {
      type: 'triangle',
      volume,
      detune: index === 1 ? -4 : index === 2 ? 5 : 0,
    })
  })
}

function createTravelLoop(transport: TransportType): () => void {
  const ctx = getCtx()
  if (!ctx) return () => undefined

  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  gain.connect(getSfxBusNode())

  const oscillators: OscillatorNode[] = []
  const addOscillator = (frequency: number, type: OscillatorType, volume: number): void => {
    const oscillator = ctx.createOscillator()
    oscillator.type = type
    oscillator.frequency.value = frequency
    const nodeGain = ctx.createGain()
    nodeGain.gain.value = volume
    oscillator.connect(nodeGain)
    nodeGain.connect(gain)
    oscillator.start()
    oscillators.push(oscillator)
  }

  if (transport === 'bus') {
    addOscillator(85, 'sawtooth', 0.025)
    addOscillator(170, 'triangle', 0.012)
  } else if (transport === 'train') {
    addOscillator(92, 'square', 0.02)
    addOscillator(184, 'triangle', 0.015)
  } else if (transport === 'boat') {
    addOscillator(110, 'sine', 0.018)
    addOscillator(220, 'triangle', 0.01)
  } else {
    addOscillator(140, 'sawtooth', 0.018)
    addOscillator(280, 'triangle', 0.012)
  }

  gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.12)

  return () => {
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
    window.setTimeout(() => {
      oscillators.forEach((oscillator) => oscillator.stop())
      gain.disconnect()
    }, 220)
  }
}

export { ensureAudioUnlocked } from '../audio.js'

export function sfxButton(): void {
  tone(660, 110, { volume: 0.03 })
}

export function sfxMarkerMove(): void {
  tone(540, 120, { type: 'square', volume: 0.02 })
}

export function sfxTravelStart(transport: TransportType): void {
  if (transport === 'boat') {
    chord([220, 330], 220, 0.026)
    return
  }

  if (transport === 'plane') {
    chord([330, 440, 660], 260, 0.024)
    return
  }

  if (transport === 'train') {
    chord([196, 294], 220, 0.026)
    return
  }

  chord([262, 392], 200, 0.026)
}

export function startTravelLoop(transport: TransportType): void {
  if (!canPlay()) return
  stopTravelLoop()
  travelLoopStopper = createTravelLoop(transport)
}

export function stopTravelLoop(): void {
  travelLoopStopper?.()
  travelLoopStopper = null
}

export function sfxArrive(): void {
  chord([392, 523, 659], 260, 0.03)
}

export function sfxPipSpeak(): void {
  tone(720, 90, { volume: 0.02 })
}

export function sfxMemoryCollect(): void {
  chord([392, 523, 784], 300, 0.03)
}

export function sfxMysteryClue(): void {
  tone(294, 120, { type: 'square', volume: 0.025 })
  window.setTimeout(() => tone(220, 160, { type: 'square', volume: 0.024 }), 90)
}

export function sfxCorrectGuess(): void {
  chord([440, 554, 659], 280, 0.03)
}

export function sfxWrongGuess(): void {
  tone(220, 160, { type: 'square', volume: 0.025 })
  window.setTimeout(() => tone(185, 180, { type: 'square', volume: 0.02 }), 80)
}