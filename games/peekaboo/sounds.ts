import {
  ensureAudioUnlocked,
  playNotes,
  playTone,
} from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'
import { getSfxEnabled, isReducedMotionEnabled } from '../../client/preferences.js'

export { ensureAudioUnlocked }

// ── Audio bus setup ──────────────────────────────────────────────────────────────

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('peekaboo').sfx
}

export function initPeekabooAudio(): void {
  getGameAudioBuses('peekaboo')
  ensureAudioUnlocked()
}

// ── Sound functions ──────────────────────────────────────────────────────────────

/** Short soft sine tone, pitch slightly random (400-500Hz), duration 0.1s.
 *  Feels like gently lifting a curtain. Functional feedback — plays even with
 *  reduced motion. */
export function playRevealSound(): void {
  if (!getSfxEnabled()) return

  try {
    const frequency = 400 + Math.random() * 100
    playTone(getSfxBusNode(), {
      frequency,
      type: 'sine',
      gain: 0.15,
      duration: 0.1,
      attackTime: 0.01,
      releaseTime: 0.04,
    })
  } catch {
    // Audio is non-critical.
  }
}

/** Bright ascending arpeggio (3-4 notes, major chord, triangle wave), duration
 *  0.6s. Celebration fanfare. Skipped when reduced motion is enabled. */
export function playFoundSound(): void {
  if (!getSfxEnabled()) return
  if (isReducedMotionEnabled()) return

  try {
    playNotes(getSfxBusNode(), [
      { frequency: 523.25, type: 'triangle', gain: 0.12, duration: 0.15, startOffset: 0, attackTime: 0.01, releaseTime: 0.04 },
      { frequency: 659.25, type: 'triangle', gain: 0.12, duration: 0.15, startOffset: 0.1, attackTime: 0.01, releaseTime: 0.04 },
      { frequency: 783.99, type: 'triangle', gain: 0.12, duration: 0.15, startOffset: 0.2, attackTime: 0.01, releaseTime: 0.04 },
      { frequency: 1046.5, type: 'triangle', gain: 0.14, duration: 0.2, startOffset: 0.3, attackTime: 0.01, releaseTime: 0.08 },
    ])
  } catch {
    // Audio is non-critical.
  }
}

/** Gentle click/pop (short square wave burst, 800Hz, 0.05s). Proceeding to next
 *  phase. Functional feedback — plays even with reduced motion. */
export function playAdvanceSound(): void {
  if (!getSfxEnabled()) return

  try {
    playTone(getSfxBusNode(), {
      frequency: 800,
      type: 'square',
      gain: 0.08,
      duration: 0.05,
      attackTime: 0.005,
      releaseTime: 0.02,
    })
  } catch {
    // Audio is non-critical.
  }
}

/** Low rumble pad (sine wave 80-120Hz with slow LFO, duration 0.8s). Fog rolling
 *  in. Fancy/atmospheric — skipped when reduced motion is enabled. */
export function playFogSound(): void {
  if (!getSfxEnabled()) return
  if (isReducedMotionEnabled()) return

  try {
    const { ctx, sfx } = getGameAudioBuses('peekaboo')
    if (sfx.gain.value < 0.001) return

    const now = ctx.currentTime
    const duration = 0.8

    // Main oscillator: sine wave sweeping 80-120Hz
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, now)
    osc.frequency.linearRampToValueAtTime(120, now + duration)

    // Slow LFO for vibrato (3Hz)
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 3

    const lfoDepth = ctx.createGain()
    lfoDepth.gain.value = 10 // +/-10Hz frequency modulation

    // Amplitude envelope with gentle attack and decay
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.001, now)
    env.gain.linearRampToValueAtTime(0.08, now + 0.15)
    env.gain.setValueAtTime(0.08, now + 0.6)
    env.gain.exponentialRampToValueAtTime(0.001, now + duration)

    lfo.connect(lfoDepth)
    lfoDepth.connect(osc.frequency)
    osc.connect(env)
    env.connect(sfx)

    osc.start(now)
    osc.stop(now + duration)
    lfo.start(now)
    lfo.stop(now + duration)
  } catch {
    // Audio is non-critical.
  }
}

/** Pleasant chime (sine wave, 660Hz, 0.15s, gentle attack/decay). New round
 *  starting. Functional feedback — plays even with reduced motion. */
export function playNewRoundSound(): void {
  if (!getSfxEnabled()) return

  try {
    playTone(getSfxBusNode(), {
      frequency: 660,
      type: 'sine',
      gain: 0.12,
      duration: 0.15,
      attackTime: 0.03,
      releaseTime: 0.06,
    })
  } catch {
    // Audio is non-critical.
  }
}

/** Short filtered noise burst (0.15s, bandpass 2kHz). Peeking behind scenery.
 *  Functional feedback — plays even with reduced motion. */
export function playPeekSound(): void {
  if (!getSfxEnabled()) return

  try {
    const { ctx, sfx } = getGameAudioBuses('peekaboo')
    if (sfx.gain.value < 0.001) return

    const now = ctx.currentTime
    const duration = 0.15

    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2000
    filter.Q.value = 1.5

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.001, now)
    env.gain.linearRampToValueAtTime(0.12, now + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, now + duration)

    source.connect(filter)
    filter.connect(env)
    env.connect(sfx)

    source.start(now)
    source.stop(now + duration)
  } catch {
    // Audio is non-critical.
  }
}