// ── Sound Effects (Web Audio API — no external files) ─────────

import { getAudioContext, createMusicBus, createSfxBus, ensureAudioUnlocked } from '../../client/audio.js'
import { getMusicEnabled, getSfxEnabled } from '../../client/preferences.js'

export { ensureAudioUnlocked }

let _musicBus: GainNode | null = null
let _sfxBus: GainNode | null = null

function getMusicBusNode(): GainNode {
  return _musicBus ??= createMusicBus('story-trail')
}

function getSfxBusNode(): GainNode {
  return _sfxBus ??= createSfxBus('story-trail')
}

// ── Ambient loop state ────────────────────────────────────────
let ambientOscillators: OscillatorNode[] = []
let ambientGains: GainNode[] = []
let ambientLfo: OscillatorNode | null = null
let ambientChordInterval: number | null = null

// ── SFX ───────────────────────────────────────────────────────

export function playTypingBlip(): void {
  if (!getSfxEnabled('story-trail')) return
  try {
    const c = getAudioContext()
    const bus = getSfxBusNode()
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = c.currentTime
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800 + Math.random() * 400, t)
    gain.gain.setValueAtTime(0.05, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.025)
    osc.connect(gain)
    gain.connect(bus)
    osc.start(t)
    osc.stop(t + 0.025)
  } catch {
    // AudioContext unavailable
  }
}

export function playItemCollect(): void {
  if (!getSfxEnabled('story-trail')) return
  try {
    const c = getAudioContext()
    const bus = getSfxBusNode()
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
      gain.connect(bus)
      osc.start(t)
      osc.stop(t + 0.2)
    }
  } catch {
    // AudioContext unavailable
  }
}

export function playChoiceConfirm(): void {
  if (!getSfxEnabled('story-trail')) return
  try {
    const c = getAudioContext()
    const bus = getSfxBusNode()
    const t = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, t)
    gain.gain.setValueAtTime(0.08, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.03)
    osc.connect(gain)
    gain.connect(bus)
    osc.start(t)
    osc.stop(t + 0.03)
  } catch {
    // AudioContext unavailable
  }
}

export function playHintNudge(): void {
  if (!getSfxEnabled('story-trail')) return
  try {
    const c = getAudioContext()
    const bus = getSfxBusNode()
    const t = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, t)
    osc.frequency.linearRampToValueAtTime(310, t + 0.15)
    gain.gain.setValueAtTime(0.1, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.15)
    osc.connect(gain)
    gain.connect(bus)
    osc.start(t)
    osc.stop(t + 0.15)
  } catch {
    // AudioContext unavailable
  }
}

export function playStoryComplete(): void {
  if (!getSfxEnabled('story-trail')) return
  try {
    const c = getAudioContext()
    const bus = getSfxBusNode()
    const t = c.currentTime
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    for (let i = 0; i < notes.length; i++) {
      const startTime = t + i * 0.1
      for (const oscType of ['sine', 'triangle'] as OscillatorType[]) {
        const osc = c.createOscillator()
        const gain = c.createGain()
        osc.type = oscType
        osc.frequency.setValueAtTime(notes[i], startTime)
        gain.gain.setValueAtTime(0.0001, startTime)
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1)
        osc.connect(gain)
        gain.connect(bus)
        osc.start(startTime)
        osc.stop(startTime + 0.1)
      }
    }
  } catch {
    // AudioContext unavailable
  }
}

// ── Ambient music ─────────────────────────────────────────────

export function playAmbientLoop(): void {
  if (!getMusicEnabled('story-trail')) return
  if (ambientOscillators.length > 0) return
  try {
    const c = getAudioContext()
    const bus = getMusicBusNode()
    const chordProgression = [
      [130.81, 164.81, 196.0],
      [146.83, 174.61, 220.0],
      [110.0, 130.81, 164.81],
      [98.0, 123.47, 146.83],
    ] as const
    const t = c.currentTime

    // Master gain with a subtle LFO so the chord bed breathes instead of pulsing.
    const masterGain = c.createGain()
    masterGain.gain.setValueAtTime(0.015, t)
    masterGain.connect(bus)
    ambientGains.push(masterGain)

    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(0.08, t)
    lfoGain.gain.setValueAtTime(0.004, t)
    lfo.connect(lfoGain)
    lfoGain.connect(masterGain.gain)
    lfo.start(t)
    ambientLfo = lfo
    ambientGains.push(lfoGain)

    for (const freq of chordProgression[0]) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.22, t)
      osc.connect(gain)
      gain.connect(masterGain)
      osc.start(t)
      ambientOscillators.push(osc)
      ambientGains.push(gain)
    }

    let chordIndex = 0
    ambientChordInterval = window.setInterval(() => {
      chordIndex = (chordIndex + 1) % chordProgression.length
      const when = c.currentTime + 0.05
      const chord = chordProgression[chordIndex]

      chord.forEach((freq, voiceIndex) => {
        const osc = ambientOscillators[voiceIndex]
        if (!osc) return
        osc.frequency.cancelScheduledValues(when)
        osc.frequency.setValueAtTime(osc.frequency.value, when)
        osc.frequency.linearRampToValueAtTime(freq, when + 1.8)
      })
    }, 5500)
  } catch {
    // AudioContext unavailable
  }
}

export function stopAmbientLoop(): void {
  if (ambientChordInterval !== null) {
    window.clearInterval(ambientChordInterval)
    ambientChordInterval = null
  }
  for (const osc of ambientOscillators) {
    try { osc.stop(); osc.disconnect() } catch { /* already stopped */ }
  }
  if (ambientLfo) {
    try { ambientLfo.stop(); ambientLfo.disconnect() } catch { /* already stopped */ }
    ambientLfo = null
  }
  for (const gain of ambientGains) {
    try { gain.disconnect() } catch { /* already disconnected */ }
  }
  ambientOscillators = []
  ambientGains = []
}
