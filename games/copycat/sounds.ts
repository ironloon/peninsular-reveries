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

// ── Shared synth helpers ────────────────────────────────────────────────────

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.00]

function makeNoise(ctx: AudioContext, durSec: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * durSec), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function playKick(ctx: AudioContext, music: GainNode, t: number, gain = 1.0): void {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.12)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
  osc.connect(g)
  g.connect(music)
  osc.start(t)
  osc.stop(t + 0.12)
  track(osc, g)
}

function playSnare(ctx: AudioContext, music: GainNode, t: number, gain = 1.0): void {
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoise(ctx, 0.08)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1500
  filter.Q.value = 1.5
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
  noise.connect(filter)
  filter.connect(g)
  g.connect(music)
  noise.start(t)
  noise.stop(t + 0.08)
  track(noise, filter, g)
}

function playHiHat(ctx: AudioContext, music: GainNode, t: number, gain = 0.6): void {
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoise(ctx, 0.04)
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 6000
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
  noise.connect(filter)
  filter.connect(g)
  g.connect(music)
  noise.start(t)
  noise.stop(t + 0.04)
  track(noise, filter, g)
}

function playMelodyNote(ctx: AudioContext, music: GainNode, t: number, freq: number, dur: number, gain = 0.08): void {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.02)
  g.gain.setValueAtTime(gain, t + dur - 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(music)
  osc.start(t)
  osc.stop(t + dur)
  track(osc, g)
}

function playBass(ctx: AudioContext, music: GainNode, t: number, freq: number, dur: number, gain = 0.05): void {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.03)
  g.gain.setValueAtTime(gain, t + dur - 0.05)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(music)
  osc.start(t)
  osc.stop(t + dur)
  track(osc, g)
}

// ── Song arrangers ────────────────────────────────────────────────────────

function scheduleGroove(cfg: RoundConfig): void {
  const { music, ctx } = getGameAudioBuses('copycat')
  const bpm = cfg.bpm
  const BEAT = 60 / bpm
  const EIGHTH = BEAT / 2
  const now = ctx.currentTime + 0.05

  // Four-on-the-floor kick
  for (let beat = 0; beat < 10; beat++) {
    playKick(ctx, music, now + beat * BEAT, 0.9)
  }

  // Snare on 2 and 4 only
  for (const beat of [2, 4, 6, 8]) {
    playSnare(ctx, music, now + beat * BEAT, 0.9)
  }

  // Light hi-hat on every other 8th
  for (let i = 0; i < 20; i += 2) {
    playHiHat(ctx, music, now + i * EIGHTH, 0.35)
  }

  // Simple pentatonic melody
  const melody = cfg.melodySeed
  for (let i = 0; i < melody.length; i++) {
    playMelodyNote(ctx, music, now + i * EIGHTH, PENTATONIC[melody[i]], EIGHTH, 0.09)
  }

  // Warm bass on 1 and 5
  for (const beat of [0, 4, 8]) {
    playBass(ctx, music, now + beat * BEAT, PENTATONIC[0] / 2, BEAT * 2, 0.06)
  }
}

function scheduleDrive(cfg: RoundConfig): void {
  const { music, ctx } = getGameAudioBuses('copycat')
  const bpm = cfg.bpm
  const BEAT = 60 / bpm
  const EIGHTH = BEAT / 2
  const now = ctx.currentTime + 0.05

  // Driving kick on 1 and 3
  for (let beat = 0; beat < 10; beat += 2) {
    playKick(ctx, music, now + beat * BEAT, 1.0)
  }

  // Hard snare on every off-beat
  for (let beat = 1; beat < 10; beat += 2) {
    playSnare(ctx, music, now + beat * BEAT, 1.0)
  }

  // Busy hi-hat every 8th
  for (let i = 0; i < 20; i++) {
    playHiHat(ctx, music, now + i * EIGHTH, 0.55)
  }

  // Fuller melody
  const melody = cfg.melodySeed
  for (let i = 0; i < melody.length; i++) {
    playMelodyNote(ctx, music, now + i * EIGHTH, PENTATONIC[melody[i]], EIGHTH, 0.10)
  }

  // Punchy bass every beat
  for (let beat = 0; beat < 10; beat += 2) {
    const root = beat % 4 === 0 ? PENTATONIC[0] / 2 : PENTATONIC[3] / 2
    playBass(ctx, music, now + beat * BEAT, root, BEAT * 2, 0.07)
  }
}

function scheduleSwing(cfg: RoundConfig): void {
  const { music, ctx } = getGameAudioBuses('copycat')
  const bpm = cfg.bpm
  const BEAT = 60 / bpm
  const now = ctx.currentTime + 0.05

  // Jazz kick: 1, 2+, 4
  playKick(ctx, music, now + 0 * BEAT, 0.8)
  playKick(ctx, music, now + 1.5 * BEAT, 0.7)
  playKick(ctx, music, now + 3 * BEAT, 0.8)
  playKick(ctx, music, now + 4 * BEAT, 0.8)
  playKick(ctx, music, now + 5.5 * BEAT, 0.7)
  playKick(ctx, music, now + 7 * BEAT, 0.8)
  playKick(ctx, music, now + 8 * BEAT, 0.8)

  // Light snare on 2 and 4
  for (const beat of [1.5, 3.5, 5.5, 7.5, 9.5]) {
    if (beat < 10) playSnare(ctx, music, now + beat * BEAT, 0.6)
  }

  // Brushed hi-hat on every triplet
  for (let i = 0; i < 30; i++) {
    const t = now + i * (BEAT / 3)
    if (t < now + 10 * BEAT) {
      playHiHat(ctx, music, t, 0.25)
    }
  }

  // Swung melody
  const melody = cfg.melodySeed
  for (let i = 0; i < melody.length; i++) {
    const swing = i % 2 === 1 ? BEAT / 6 : 0
    playMelodyNote(ctx, music, now + i * (BEAT / 2) + swing, PENTATONIC[melody[i]], BEAT / 2, 0.08)
  }

  // Walking bass on every beat
  for (let beat = 0; beat < 10; beat++) {
    const note = PENTATONIC[(beat * 2) % 5] / 2
    playBass(ctx, music, now + beat * BEAT, note, BEAT, 0.05)
  }
}

function scheduleHalf(cfg: RoundConfig): void {
  const { music, ctx } = getGameAudioBuses('copycat')
  const bpm = cfg.bpm
  const BEAT = 60 / bpm
  const now = ctx.currentTime + 0.05

  // Half-time: kick on 1 only (every 2 beats)
  for (let beat = 0; beat < 10; beat += 2) {
    playKick(ctx, music, now + beat * BEAT, 1.1)
  }

  // Huge snare on 3 (beat 2 in half-time)
  for (let beat = 2; beat < 10; beat += 4) {
    playSnare(ctx, music, now + beat * BEAT, 1.1)
    playSnare(ctx, music, now + (beat + 0.5) * BEAT, 0.7)
  }

  // Crash-like hi-hat
  for (let i = 0; i < 10; i += 2) {
    playHiHat(ctx, music, now + i * BEAT, 0.7)
    playHiHat(ctx, music, now + (i + 1.5) * BEAT, 0.4)
  }

  // Slow heavy melody
  const melody = cfg.melodySeed
  for (let i = 0; i < melody.length; i += 2) {
    playMelodyNote(ctx, music, now + i * BEAT, PENTATONIC[melody[i]], BEAT * 2, 0.11)
  }

  // Deep sub-bass on 1
  for (let beat = 0; beat < 10; beat += 2) {
    playBass(ctx, music, now + beat * BEAT, PENTATONIC[0] / 4, BEAT * 4, 0.10)
  }
}

function scheduleBreak(cfg: RoundConfig): void {
  const { music, ctx } = getGameAudioBuses('copycat')
  const bpm = cfg.bpm
  const BEAT = 60 / bpm
  const EIGHTH = BEAT / 2
  const SIXTEENTH = BEAT / 4
  const now = ctx.currentTime + 0.05

  // Breakbeat kick: syncopated
  const kickBeats = [0, 0.75, 2, 2.75, 4, 5.5, 6, 6.75, 8, 8.75]
  for (const beat of kickBeats) {
    if (beat < 10) playKick(ctx, music, now + beat * BEAT, 1.0)
  }

  // Fast snare fills
  for (let beat = 1; beat < 10; beat += 2) {
    playSnare(ctx, music, now + beat * BEAT, 0.9)
    playSnare(ctx, music, now + (beat + 0.5) * BEAT, 0.6)
  }

  // Rapid hi-hat every 16th
  for (let i = 0; i < 40; i++) {
    const t = now + i * SIXTEENTH
    if (t < now + 10 * BEAT) {
      playHiHat(ctx, music, t, i % 2 === 0 ? 0.5 : 0.3)
    }
  }

  // Frantic melody
  const melody = cfg.melodySeed
  for (let i = 0; i < melody.length; i++) {
    playMelodyNote(ctx, music, now + i * EIGHTH, PENTATONIC[melody[i]], EIGHTH, 0.09)
  }

  // Aggressive bass
  for (let beat = 0; beat < 10; beat += 1) {
    const root = beat % 2 === 0 ? PENTATONIC[0] / 2 : PENTATONIC[2] / 2
    playBass(ctx, music, now + beat * BEAT, root, BEAT, 0.08)
  }
}

// ── Public API ────────────────────────────────────────────────────────────

function scheduleForStyle(cfg: RoundConfig): void {
  switch (cfg.songStyle) {
    case 'groove': scheduleGroove(cfg); break
    case 'drive': scheduleDrive(cfg); break
    case 'swing': scheduleSwing(cfg); break
    case 'half': scheduleHalf(cfg); break
    case 'break': scheduleBreak(cfg); break
    default: scheduleGroove(cfg)
  }
}

export function getLoopMsForRound(config: RoundConfig): number {
  const BEAT_DUR = 60 / config.bpm
  return Math.round(10 * BEAT_DUR * 1000)
}

export function startDanceMusic(config: RoundConfig): void {
  stopDanceMusic()
  scheduleForStyle(config)
  const loopMs = getLoopMsForRound(config)
  musicTimer = window.setInterval(() => scheduleForStyle(config), loopMs)
}

export function stopDanceMusic(): void {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer)
    musicTimer = null
  }
  clearScheduledNodes()
}

export function fadeOutMusic(): void {
  const { music } = getGameAudioBuses('copycat')
  fadeBusGain(music, 0.0001, 1500)
}

// ── SFX ─────────────────────────────────────────────────────────────────────

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
