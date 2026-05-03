import { getGameAudioBuses } from '../../client/game-audio.js'

let globalMuted = false

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('mudskipper').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('mudskipper').sfx
}

function createEnvelope(
  context: AudioContext,
  startTime: number,
  duration: number,
  volume: number,
  attack: number = 0.01,
  release: number = Math.min(0.2, duration * 0.6),
): GainNode {
  const gain = context.createGain()
  const peakTime = startTime + Math.max(attack, 0.008)
  const releaseStart = Math.max(peakTime + 0.01, startTime + duration - Math.max(release, 0.04))

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, peakTime)
  gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.82, 0.0002), releaseStart)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  return gain
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
  filterFreq: number = 800,
): void {
  if (globalMuted) return
  const context = getCtx()
  if (!context) return

  const bufferSize = context.sampleRate * duration
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const noise = context.createBufferSource()
  noise.buffer = buffer

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq

  const gain = createEnvelope(context, context.currentTime, duration, volume, 0.02, 0.15)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(getSfxBusNode())

  noise.start()
  noise.stop(context.currentTime + duration + 0.05)
}

export function sfxJump(): void {
  // Boing + splash
  playTone(220, 0.15, 'sine', 0.08)
  playTone(330, 0.12, 'sine', 0.06, 0.05)
  playNoise(0.18, 0.06, 600)
}

export function sfxSplash(): void {
  playNoise(0.25, 0.08, 700)
  playTone(180, 0.2, 'triangle', 0.05)
}

export function sfxMudRise(): void {
  playNoise(0.4, 0.04, 400)
}

export function sfxGameOver(): void {
  playTone(196, 0.3, 'sawtooth', 0.08)
  playTone(146.8, 0.4, 'sawtooth', 0.08, 0.15)
  playTone(110, 0.5, 'sawtooth', 0.08, 0.35)
}

export function sfxDrain(): void {
  playNoise(1.2, 0.05, 300)
}

let ambienceOscillators: OscillatorNode[] | null = null
let ambienceGain: GainNode | null = null

export function startAmbience(): void {
  if (globalMuted) return
  const context = getCtx()
  if (!context) return

  stopAmbience()

  ambienceGain = context.createGain()
  ambienceGain.gain.setValueAtTime(0.0001, context.currentTime)
  ambienceGain.gain.linearRampToValueAtTime(0.04, context.currentTime + 2)
  ambienceGain.connect(getSfxBusNode())

  const freqs = [60, 90, 120]
  const types: OscillatorType[] = ['sine', 'triangle', 'sine']

  ambienceOscillators = freqs.map((f, i) => {
    const osc = context.createOscillator()
    osc.type = types[i]
    osc.frequency.setValueAtTime(f, context.currentTime)
    osc.connect(ambienceGain!)
    osc.start()
    return osc
  })
}

export function stopAmbience(): void {
  if (ambienceOscillators) {
    for (const osc of ambienceOscillators) {
      try { osc.stop() } catch { /* already stopped */ }
    }
    ambienceOscillators = null
  }
  if (ambienceGain) {
    try { ambienceGain.disconnect() } catch { /* already disconnected */ }
    ambienceGain = null
  }
}

export function setMuted(muted: boolean): void {
  globalMuted = muted
  if (muted) stopAmbience()
}
