import { getAudioContext, createSfxBus } from '../audio.js'
import { getSfxEnabled } from '../preferences.js'

let _sfxBus: GainNode | null = null
let holdOscillator: OscillatorNode | null = null































function sfxEnabled(): boolean {
  return getSfxEnabled('mission-orbit')
}

function getCtx(): AudioContext | null {
  try {
    return getAudioContext()
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  if (!_sfxBus) _sfxBus = createSfxBus('mission-orbit')
  return _sfxBus
}

function playOsc(
  audio: AudioContext,
  type: OscillatorType,
  freq: number,
  duration: number,
  gain: number,
  when = 0,
  freqEnd?: number,
): void {
  const osc = audio.createOscillator()
  const gainNode = audio.createGain()
  const startTime = audio.currentTime + when
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration)
  }
  gainNode.gain.setValueAtTime(gain, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.connect(gainNode)
  gainNode.connect(getSfxBusNode())
  osc.start(startTime)
  osc.stop(startTime + duration)
}

function playNoise(audio: AudioContext, duration: number, gain: number): void {
  const bufferSize = Math.ceil(audio.sampleRate * duration)
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = audio.createBufferSource()
  const gainNode = audio.createGain()
  const now = audio.currentTime
  source.buffer = buffer
  gainNode.gain.setValueAtTime(gain, now)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  source.connect(gainNode)
  gainNode.connect(getSfxBusNode())
  source.start(now)
  source.stop(now + duration)
}

function stopHoldTone(): void {
  if (holdOscillator) {
    try {
      holdOscillator.stop()
    } catch {
      // already stopped
    }
    holdOscillator = null
  }
}

export function playSceneSound(cinematicType: string): void {
  if (!sfxEnabled()) return
  try {
    const audio = getCtx()
    if (!audio) return
    switch (cinematicType) {
      case 'launch-pad':
        playOsc(audio, 'sine', 50, 0.3, 0.15)
        break
      case 'ascent':
        playOsc(audio, 'sine', 80, 0.5, 0.12, 0, 200)
        break
      case 'orbit-insertion':
        playOsc(audio, 'sine', 440, 0.15, 0.1)
        break
      case 'trans-lunar-injection':
        playOsc(audio, 'sine', 60, 0.4, 0.12)
        break
      case 'lunar-approach':
        playOsc(audio, 'triangle', 880, 0.3, 0.1)
        break
      case 'lunar-flyby':
        playOsc(audio, 'sine', 220, 0.6, 0.08)
        break
      case 'return':
        playOsc(audio, 'sine', 300, 0.3, 0.1, 0, 150)
        break
      case 'reentry-splashdown':
        playNoise(audio, 0.3, 0.1)
        playOsc(audio, 'sine', 200, 0.4, 0.1)
        break
    }
  } catch {
    // audio is non-critical
  }
}

export function playTapSound(): void {
  if (!sfxEnabled()) return
  try {
    const audio = getCtx()
    if (!audio) return
    playOsc(audio, 'triangle', 800, 0.05, 0.1)
  } catch {
    // audio is non-critical
  }
}

export function playHoldTone(active: boolean): void {
  if (!active) {
    stopHoldTone()
    return
  }
  if (!sfxEnabled()) return
  try {
    const audio = getCtx()
    if (!audio) return
    if (holdOscillator) return
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, audio.currentTime)
    gain.gain.setValueAtTime(0.06, audio.currentTime)
    osc.connect(gain)
    gain.connect(getSfxBusNode())
    osc.start()
    osc.onended = () => { holdOscillator = null }
    holdOscillator = osc
  } catch {
    holdOscillator = null
  }
}

export function playSceneChime(): void {
  if (!sfxEnabled()) return
  try {
    const audio = getCtx()
    if (!audio) return
    const freqs = [523, 659, 784]
    for (let i = 0; i < freqs.length; i++) {
      playOsc(audio, 'triangle', freqs[i], 0.3, 0.08, i * 0.05)
    }
  } catch {
    // audio is non-critical
  }
}

export function playMissionCompleteSound(): void {
  if (!sfxEnabled()) return
  try {
    const audio = getCtx()
    if (!audio) return
    const notes = [261, 330, 392, 523]
    for (let i = 0; i < notes.length; i++) {
      playOsc(audio, 'sine', notes[i], 0.2, 0.1, i * 0.15)
    }
  } catch {
    // audio is non-critical
  }
}