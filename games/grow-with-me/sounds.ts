import { getGameAudioBuses } from '../../client/game-audio.js'

let globalMuted = false

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('grow-with-me').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('grow-with-me').sfx
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

export function sfxPlantSeed(): void {
  playTone(523.25, 0.12, 'sine', 0.06) // C5
  playTone(659.25, 0.10, 'sine', 0.05, 0.08) // E5
}

export function sfxSprout(): void {
  playTone(392, 0.15, 'sine', 0.06) // G4
  playTone(523.25, 0.12, 'sine', 0.05, 0.08) // C5
}

export function sfxGrowth(): void {
  playTone(440, 0.2, 'sine', 0.04)
  playTone(554.37, 0.15, 'sine', 0.03, 0.1)
}

export function sfxBloom(): void {
  // Bright chime
  playTone(1046.5, 0.25, 'sine', 0.08) // C6
  playTone(1318.5, 0.2, 'sine', 0.06, 0.08) // E6
  playTone(1568, 0.2, 'sine', 0.05, 0.16) // G6
}

export function sfxRainStart(): void {
  playNoise(0.5, 0.04, 1200)
  playTone(220, 0.3, 'sine', 0.02)
}

export function sfxWaterDrop(): void {
  playTone(880, 0.08, 'sine', 0.04)
  playTone(1100, 0.06, 'sine', 0.03, 0.04)
}

export function sfxWind(): void {
  playNoise(0.6, 0.03, 600)
}

export function sfxSunChime(): void {
  playTone(784, 0.15, 'sine', 0.04) // G5
  playTone(988, 0.12, 'sine', 0.03, 0.06) // B5
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
  ambienceGain.gain.linearRampToValueAtTime(0.025, context.currentTime + 2)
  ambienceGain.connect(getSfxBusNode())

  // Gentler nature ambience
  const freqs = [82, 110, 165]
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