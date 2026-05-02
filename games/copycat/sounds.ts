import { getGameAudioBuses } from '../../client/game-audio.js'
import {
  ensureAudioUnlocked as baseEnsureAudioUnlocked,
  fadeBusGain,
} from '../../client/audio.js'
import type { RoundConfig } from './types.js'

// ── State ───────────────────────────────────────────────────────────────────

interface TrackedNode {
  stop?(): void
  disconnect(): void
}

let musicTimer: number | null = null
const scheduledNodes: TrackedNode[] = []
let currentRoundConfig: RoundConfig | null = null

function track(...nodes: AudioNode[]): void {
  for (const node of nodes) {
    scheduledNodes.push(node as TrackedNode)
  }
}

function clearScheduledNodes(): void {
  for (const node of scheduledNodes) {
    try { node.stop?.() } catch { /* already stopped */ }
    try { node.disconnect() } catch { /* already disconnected */ }
  }
  scheduledNodes.length = 0
}

export function ensureAudioUnlocked(): void {
  baseEnsureAudioUnlocked()
}

// ── Music loop ──────────────────────────────────────────────────────────────

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.00]

function scheduleDanceBatch(): void {
  const { music, ctx } = getGameAudioBuses('copycat')
  const cfg = currentRoundConfig
  if (!cfg) return

  const bpm = cfg.bpm
  const BEAT_DUR = 60 / bpm
  const EIGHTH_DUR = BEAT_DUR / 2
  const LOOP_BEATS = 10
  const now = ctx.currentTime + 0.05

  // Kick — sine sweep, on beats 1 and 3
  for (let beat = 0; beat < LOOP_BEATS; beat += 2) {
    const t = now + beat * BEAT_DUR
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, t)
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12)
    gain.gain.setValueAtTime(1.0, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    osc.connect(gain)
    gain.connect(music)
    osc.start(t)
    osc.stop(t + 0.12)
    track(osc, gain)
  }

  // Snare — band-passed noise, on beats 2, 4, 6, 8, 10
  const snareBeats = [1, 3, 5, 7, 9]
  for (const beat of snareBeats) {
    const t = now + beat * BEAT_DUR
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.08), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1500
    filter.Q.value = 1.5
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1.0, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(music)
    noise.start(t)
    noise.stop(t + 0.08)
    track(noise, filter, gain)
  }

  // Hi-hat — high-passed noise, every 8th note
  const numEighths = LOOP_BEATS * 2
  for (let i = 0; i < numEighths; i++) {
    const t = now + i * EIGHTH_DUR
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.04), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let j = 0; j < data.length; j++) data[j] = Math.random() * 2 - 1

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 6000
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.6, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(music)
    noise.start(t)
    noise.stop(t + 0.04)
    track(noise, filter, gain)
  }

  // Melody — triangle wave, pentatonic, per-round seed
  const melody = cfg.melodySeed
  for (let i = 0; i < melody.length; i++) {
    const freq = PENTATONIC[melody[i]]
    const t = now + i * EIGHTH_DUR
    const dur = EIGHTH_DUR
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.08, t + 0.02)
    gain.gain.setValueAtTime(0.08, t + dur - 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(music)
    osc.start(t)
    osc.stop(t + dur)
    track(osc, gain)
  }

  // Bass — root notes on beat 1
  const bassBeats = [0, 4, 8]
  for (const beat of bassBeats) {
    const t = now + beat * BEAT_DUR
    const dur = BEAT_DUR * 2
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(PENTATONIC[0] / 2, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.05, t + 0.03)
    gain.gain.setValueAtTime(0.05, t + dur - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(music)
    osc.start(t)
    osc.stop(t + dur)
    track(osc, gain)
  }
}

export function getLoopMsForRound(config: RoundConfig): number {
  const BEAT_DUR = 60 / config.bpm
  return Math.round(10 * BEAT_DUR * 1000)
}

export function startDanceMusic(config: RoundConfig): void {
  // Always restart: stop any existing timer so a new round gets fresh music
  stopDanceMusic()
  currentRoundConfig = config
  scheduleDanceBatch()
  const loopMs = getLoopMsForRound(config)
  musicTimer = window.setInterval(scheduleDanceBatch, loopMs)
}

export function stopDanceMusic(): void {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer)
    musicTimer = null
  }
  clearScheduledNodes()
  currentRoundConfig = null
}

export function fadeOutMusic(): void {
  const { music } = getGameAudioBuses('copycat')
  fadeBusGain(music, 0.0001, 1500)
}

// ── SFX ───────────────────────────────────────────────────────────────────────

export function sfxCatJoin(): void {
  const { sfx, ctx } = getGameAudioBuses('copycat')
  if (sfx.gain.value < 0.001) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, now)
  osc.frequency.linearRampToValueAtTime(900, now + 0.12)
  gain.gain.setValueAtTime(1.0, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
  osc.connect(gain)
  gain.connect(sfx)
  osc.start(now)
  osc.stop(now + 0.12)
}
