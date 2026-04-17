// ── Shared SFX catalog — reusable synthesized sound effects ───────────────────
//
// Each SFX is a named function taking an sfxBus: GainNode parameter.
// Game-specific SFX that aren't reusable stay in per-game sounds.ts files.

import { getAudioContext } from './audio.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function playOsc(
  bus: GainNode,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.08,
  delay: number = 0,
  freqEnd?: number,
): void {
  const c = getAudioContext()
  const startTime = c.currentTime + delay

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration)
  }
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain)
  gain.connect(bus)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playEnvelopedOsc(
  bus: GainNode,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  delay: number = 0,
): void {
  const c = getAudioContext()
  const startTime = c.currentTime + delay
  const attackTime = 0.01
  const releaseTime = 0.05

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + attackTime)
  gain.gain.setValueAtTime(volume, startTime + duration - releaseTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.connect(gain)
  gain.connect(bus)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playNoiseBurst(
  bus: GainNode,
  duration: number = 0.09,
  peakGain: number = 0.035,
  filterFreq: number = 780,
): void {
  const c = getAudioContext()
  const bufferSize = Math.ceil(c.sampleRate * duration)
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    channel[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }

  const source = c.createBufferSource()
  const filter = c.createBiquadFilter()
  const gain = c.createGain()
  const now = c.currentTime

  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(filterFreq, now)
  filter.Q.setValueAtTime(0.8, now)
  gain.gain.setValueAtTime(peakGain, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  source.buffer = buffer
  source.connect(filter)
  filter.connect(gain)
  gain.connect(bus)
  source.start(now)
  source.stop(now + duration)
}

// ── Click / tap ───────────────────────────────────────────────────────────────

export function sfxClick(sfxBus: GainNode): void {
  playOsc(sfxBus, 660, 0.06, 'sine', 0.08)
}

// ── Correct / success ─────────────────────────────────────────────────────────

export function sfxCorrect(sfxBus: GainNode): void {
  playOsc(sfxBus, 520, 0.2, 'sine', 0.08)
  playOsc(sfxBus, 680, 0.15, 'sine', 0.06, 0.1)
}

// ── Wrong / error ─────────────────────────────────────────────────────────────

export function sfxWrong(sfxBus: GainNode): void {
  playOsc(sfxBus, 260, 0.2, 'sine', 0.08)
  playOsc(sfxBus, 120, 0.2, 'sine', 0.06, 0.05)
}

// ── Celebration / win ─────────────────────────────────────────────────────────

export function sfxCelebration(sfxBus: GainNode): void {
  const notes = [261.63, 329.63, 392, 523.25]
  for (let i = 0; i < notes.length; i++) {
    playEnvelopedOsc(sfxBus, notes[i], 0.16, 'triangle', 0.08, i * 0.1)
  }
  playEnvelopedOsc(sfxBus, 523.25, 0.26, 'sine', 0.09, 0.32)
}

// ── Whoosh / swap ─────────────────────────────────────────────────────────────

export function sfxWhoosh(sfxBus: GainNode): void {
  playOsc(sfxBus, 400, 0.08, 'triangle', 0.08)
  playOsc(sfxBus, 500, 0.08, 'triangle', 0.06, 0.04)
}

// ── Splash / noise burst ──────────────────────────────────────────────────────

export function sfxSplash(sfxBus: GainNode): void {
  playNoiseBurst(sfxBus, 0.12, 0.04, 600)
}

// ── Chime / collect ───────────────────────────────────────────────────────────

export function sfxChime(sfxBus: GainNode): void {
  const c = getAudioContext()
  const t = c.currentTime
  for (const freq of [523, 659]) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    osc.connect(gain)
    gain.connect(sfxBus)
    osc.start(t)
    osc.stop(t + 0.2)
  }
}

// ── Blip / typing ─────────────────────────────────────────────────────────────

export function sfxBlip(sfxBus: GainNode): void {
  const c = getAudioContext()
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800 + Math.random() * 400, t)
  gain.gain.setValueAtTime(0.05, t)
  gain.gain.linearRampToValueAtTime(0, t + 0.025)
  osc.connect(gain)
  gain.connect(sfxBus)
  osc.start(t)
  osc.stop(t + 0.025)
}

// ── Descending tone / game-over accent ────────────────────────────────────────

export function sfxDescend(sfxBus: GainNode): void {
  playEnvelopedOsc(sfxBus, 220, 0.16, 'triangle', 0.08)
  playEnvelopedOsc(sfxBus, 165, 0.22, 'triangle', 0.07, 0.08)
  playEnvelopedOsc(sfxBus, 131, 0.3, 'triangle', 0.06, 0.18)
}

// ── Ascending arpeggio ────────────────────────────────────────────────────────

export function sfxAscend(sfxBus: GainNode): void {
  const notes: [number, number][] = [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.2]]
  let offset = 0
  for (const [freq, dur] of notes) {
    playOsc(sfxBus, freq, dur, 'sine', 0.12, offset)
    offset += dur * 0.7
  }
}

// ── Soft noise tap (move confirm) ─────────────────────────────────────────────

export function sfxNoiseTap(sfxBus: GainNode): void {
  playNoiseBurst(sfxBus, 0.08, 0.028)
  playEnvelopedOsc(sfxBus, 196, 0.12, 'triangle', 0.08)
}

// ── Buzz / distractor ─────────────────────────────────────────────────────────

export function sfxBuzz(sfxBus: GainNode): void {
  playOsc(sfxBus, 180, 0.2, 'square', 0.08)
}

// ── Nudge / hint ──────────────────────────────────────────────────────────────

export function sfxNudge(sfxBus: GainNode): void {
  const c = getAudioContext()
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, t)
  osc.frequency.linearRampToValueAtTime(310, t + 0.15)
  gain.gain.setValueAtTime(0.1, t)
  gain.gain.linearRampToValueAtTime(0, t + 0.15)
  osc.connect(gain)
  gain.connect(sfxBus)
  osc.start(t)
  osc.stop(t + 0.15)
}

// ── Plink / water-drop ───────────────────────────────────────────────────────

export function sfxPlink(sfxBus: GainNode): void {
  const c = getAudioContext()
  const now = c.currentTime
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(420, now)
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.18)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.04, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  osc.connect(gain)
  gain.connect(sfxBus)
  osc.start(now)
  osc.stop(now + 0.18)
}
