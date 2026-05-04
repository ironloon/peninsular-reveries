import { getGameAudioBuses } from '../../client/game-audio.js'
import { ensureAudioUnlocked as unlockAudio } from '../../client/audio.js'

let globalMuted = false

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('block-attack').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('block-attack').sfx
}

function createEnvelope(
  context: AudioContext,
  startTime: number,
  duration: number,
  volume: number,
  attack: number = 0.008,
  release: number = Math.min(0.15, duration * 0.5),
): GainNode {
  const gain = context.createGain()
  const peakTime = startTime + Math.max(attack, 0.005)
  const releaseStart = Math.max(peakTime + 0.005, startTime + duration - Math.max(release, 0.03))

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, peakTime)
  gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.8, 0.0002), releaseStart)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  return gain
}

// Background music — building tension rhythm
let bassOscillators: OscillatorNode[] | null = null
let bassGain: GainNode | null = null
let rhythmInterval: number | null = null

export function startActionMusic(): void {
  if (globalMuted) return
  const context = getCtx()
  if (!context) return

  stopActionMusic()

  bassGain = context.createGain()
  bassGain.gain.setValueAtTime(0.0001, context.currentTime)
  bassGain.gain.linearRampToValueAtTime(0.04, context.currentTime + 1.0)
  bassGain.connect(getSfxBusNode())

  const freqs = [55, 82.4, 110]
  const types: OscillatorType[] = ['sawtooth', 'triangle', 'sawtooth']

  bassOscillators = freqs.map((f, i) => {
    const osc = context.createOscillator()
    osc.type = types[i]
    osc.frequency.setValueAtTime(f, context.currentTime)
    osc.connect(bassGain!)
    osc.start()
    return osc
  })

  // Punctuated rhythm hits
  let beatCount = 0
  rhythmInterval = window.setInterval(() => {
    if (globalMuted) return
    beatCount++
    sfxRhythmHit(beatCount % 4 === 0)
  }, 600)
}

export function stopActionMusic(): void {
  const context = getCtx()
  if (!context) return

  if (bassGain) {
    try {
      bassGain.gain.cancelScheduledValues(context.currentTime)
      bassGain.gain.setValueAtTime(bassGain.gain.value, context.currentTime)
      bassGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5)
    } catch { /* ignore */ }
  }
  if (bassOscillators) {
    for (const osc of bassOscillators) {
      try { osc.stop(context.currentTime + 0.6) } catch { /* ignore */ }
    }
  }
  bassOscillators = null
  if (rhythmInterval !== null) {
    clearInterval(rhythmInterval)
    rhythmInterval = null
  }
  setTimeout(() => { bassGain = null }, 600)
}

export function setMuted(muted: boolean): void {
  globalMuted = muted
  if (muted) stopActionMusic()
}

export function ensureAudioUnlocked(): void {
  unlockAudio()
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1,
  delay: number = 0,
): void {
  if (globalMuted) return
  const context = getCtx()
  if (!context) return

  const startTime = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = createEnvelope(context, startTime, duration, volume)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.connect(gain)
  gain.connect(getSfxBusNode())

  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.05)
}

function playNoise(
  duration: number,
  volume: number = 0.1,
  delay: number = 0,
): void {
  if (globalMuted) return
  const context = getCtx()
  if (!context) return

  const startTime = context.currentTime + delay
  const bufferSize = Math.max(1, Math.ceil(context.sampleRate * duration))
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }

  const source = context.createBufferSource()
  source.buffer = buffer

  const gain = createEnvelope(context, startTime, duration, volume)

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(800, startTime)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(getSfxBusNode())

  source.start(startTime)
  source.stop(startTime + duration + 0.05)
}

export function sfxBlockHit(): void {
  playTone(180, 0.08, 'square', 0.12)
  playNoise(0.1, 0.15)
  playTone(90, 0.12, 'sawtooth', 0.08)
}

export function sfxBigSmash(): void {
  playTone(80, 0.2, 'sawtooth', 0.14)
  playTone(120, 0.15, 'square', 0.1)
  playNoise(0.2, 0.2)
  playTone(60, 0.25, 'triangle', 0.06, 0.03)
}

export function sfxWaveStart(): void {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      playTone(220 + i * 55, 0.12, 'triangle', 0.08)
    }, i * 80)
  }
}

export function sfxRhythmHit(accent: boolean): void {
  if (accent) {
    playTone(110, 0.08, 'square', 0.05)
    playNoise(0.05, 0.04)
  } else {
    playNoise(0.03, 0.02)
  }
}

export function sfxCombo(count: number): void {
  const baseFreq = 440 + count * 60
  playTone(baseFreq, 0.1, 'triangle', 0.1)
  playTone(baseFreq * 1.5, 0.08, 'sine', 0.06, 0.03)
}

export function sfxGameOver(): void {
  for (let i = 0; i < 4; i++) {
    playTone(330 - i * 40, 0.25, 'sawtooth', 0.1, i * 0.15)
  }
  playNoise(0.5, 0.06)
}

export function sfxMenuOpen(): void {
  playTone(330, 0.06, 'sine', 0.06)
}