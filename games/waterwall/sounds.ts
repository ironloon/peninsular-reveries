// ── Waterwall Audio System (Web Audio API — no external files) ────────────────

import {
  ensureAudioUnlocked,
  fadeBusGain,
} from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'
import { getSfxEnabled } from '../../client/preferences.js'

export { ensureAudioUnlocked }

// ── Types ─────────────────────────────────────────────────────────────────────

export type CursorEdge = 'left' | 'right' | 'top' | 'bottom'

// ── Edge cue pan mapping ──────────────────────────────────────────────────────

export const EDGE_CUE_PAN: Record<CursorEdge, number> = {
  left: -1,
  right: 1,
  top: 0,
  bottom: 0,
}

export const EDGE_CUE_FREQUENCY: Record<CursorEdge, number> = {
  left: 400,
  right: 400,
  top: 600,
  bottom: 200,
}

// ── Bus management ────────────────────────────────────────────────────────────

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('waterwall').sfx
}

// ── Water texture (filtered noise loop) ───────────────────────────────────────

let noiseSource: AudioBufferSourceNode | null = null
let noiseGain: GainNode | null = null
let noisePanner: StereoPannerNode | null = null
let noiseRunning = false

export function createWaterTexture(): void {
  if (noiseSource) return

  try {
    const context = getGameAudioBuses('waterwall').ctx
    const bus = getSfxBusNode()

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

    const panner = context.createStereoPanner()
    panner.pan.value = 0

    const gain = context.createGain()
    gain.gain.value = 0.0001

    source.connect(filter)
    filter.connect(panner)
    panner.connect(gain)
    gain.connect(bus)

    source.start()

    noiseSource = source
    noiseGain = gain
    noisePanner = panner
  } catch {
    // Audio is non-critical.
  }
}

export function startWaterTexture(): void {
  if (!getSfxEnabled()) return

  try {
    createWaterTexture()
    if (noiseGain) {
      fadeBusGain(noiseGain, 0.06, 300)
    }
    noiseRunning = true
  } catch {
    // Audio is non-critical.
  }
}

export function stopWaterTexture(): void {
  noiseRunning = false
  try {
    if (noiseGain) {
      fadeBusGain(noiseGain, 0.0001, 300)
    }
  } catch {
    // Audio is non-critical.
  }
}

export function updateWaterPanning(pan: number): void {
  if (!noisePanner) return

  try {
    const context = getGameAudioBuses('waterwall').ctx
    const clamped = Math.max(-1, Math.min(1, pan))
    const now = context.currentTime
    noisePanner.pan.cancelScheduledValues(now)
    noisePanner.pan.setValueAtTime(noisePanner.pan.value, now)
    noisePanner.pan.linearRampToValueAtTime(clamped, now + 0.05)
  } catch {
    // Audio is non-critical.
  }
}

// ── Cursor edge cues ──────────────────────────────────────────────────────────

let lastEdgeCue: CursorEdge | null = null

export function playCursorEdgeCue(edge: CursorEdge): void {
  if (!getSfxEnabled()) return
  if (edge === lastEdgeCue) return

  lastEdgeCue = edge

  try {
    const context = getGameAudioBuses('waterwall').ctx
    const bus = getSfxBusNode()
    const now = context.currentTime

    const osc = context.createOscillator()
    const envGain = context.createGain()
    const panner = context.createStereoPanner()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(EDGE_CUE_FREQUENCY[edge], now)

    panner.pan.setValueAtTime(EDGE_CUE_PAN[edge], now)

    envGain.gain.setValueAtTime(0.0001, now)
    envGain.gain.linearRampToValueAtTime(0.03, now + 0.005)
    envGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)

    osc.connect(panner)
    panner.connect(envGain)
    envGain.connect(bus)

    osc.start(now)
    osc.stop(now + 0.08)
  } catch {
    // Audio is non-critical.
  }
}

export function resetEdgeCue(): void {
  lastEdgeCue = null
}

// ── Barrier SFX ───────────────────────────────────────────────────────────────

export function playBarrierPlaceSound(): void {
  if (!getSfxEnabled()) return

  try {
    const context = getGameAudioBuses('waterwall').ctx
    const bus = getSfxBusNode()
    const now = context.currentTime

    // Soft water-drop plink: pitch slides from 420 Hz down to 220 Hz
    const osc = context.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18)

    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.025, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)

    osc.connect(gain)
    gain.connect(bus)

    osc.start(now)
    osc.stop(now + 0.18)
  } catch {
    // Audio is non-critical.
  }
}

export function playBarrierRemoveSound(): void {
  if (!getSfxEnabled()) return

  try {
    const context = getGameAudioBuses('waterwall').ctx
    const bus = getSfxBusNode()
    const now = context.currentTime

    const bufferSize = Math.ceil(context.sampleRate * 0.06)
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      channel[i] = Math.random() * 2 - 1
    }

    const source = context.createBufferSource()
    source.buffer = buffer

    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1500

    const gain = context.createGain()
    // Slow attack, fast release
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.06, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(bus)

    source.start(now)
    source.stop(now + 0.06)
  } catch {
    // Audio is non-critical.
  }
}

// ── Preference sync ───────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('reveries:sfx-change', (event) => {
    const detail = (event as CustomEvent<{ enabled: boolean }>).detail
    if (!detail.enabled) {
      stopWaterTexture()
    } else if (noiseRunning || noiseSource) {
      startWaterTexture()
    }
  })
}
