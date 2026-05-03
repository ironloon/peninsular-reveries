import { getGameAudioBuses } from '../../client/game-audio.js'

let globalMuted = false

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('dragons-crunch').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('dragons-crunch').sfx
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

// Layered drone for dramatic ambience
let droneOscillators: OscillatorNode[] | null = null
let droneGain: GainNode | null = null

export function startEpicMusic(): void {
  if (globalMuted) return
  const context = getCtx()
  if (!context) return

  stopEpicMusic()

  droneGain = context.createGain()
  droneGain.gain.setValueAtTime(0.0001, context.currentTime)
  droneGain.gain.linearRampToValueAtTime(0.06, context.currentTime + 1.5)
  droneGain.connect(getSfxBusNode())

  const freqs = [55, 82.4, 110, 164.8] // low drone: A1, E2, A2, E3
  const types: OscillatorType[] = ['sawtooth', 'triangle', 'sawtooth', 'triangle']

  droneOscillators = freqs.map((f, i) => {
    const osc = context.createOscillator()
    osc.type = types[i]
    osc.frequency.setValueAtTime(f, context.currentTime)
    osc.connect(droneGain!)
    osc.start()
    return osc
  })
}

export function stopEpicMusic(): void {
  const context = getCtx()
  if (!context) return

  if (droneGain) {
    try {
      droneGain.gain.cancelScheduledValues(context.currentTime)
      droneGain.gain.setValueAtTime(droneGain.gain.value, context.currentTime)
      droneGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8)
    } catch {
      // ignore
    }
  }
  if (droneOscillators) {
    for (const osc of droneOscillators) {
      try { osc.stop(context.currentTime + 0.9) } catch { /* ignore */ }
    }
  }
  droneOscillators = null
  setTimeout(() => { droneGain = null }, 1000)
}

export function setMuted(muted: boolean): void {
  globalMuted = muted
  if (muted) stopEpicMusic()
}

export function sfxChomp(value: number): void {
  const freq = value >= 5 ? 320 : 260
  playTone(freq, 0.12, 'sawtooth', 0.18)
  setTimeout(() => {
    playTone(freq * 0.6, 0.14, 'square', 0.12)
  }, 50)
}

export function sfxFoodSpawn(): void {
  playTone(660, 0.05, 'sine', 0.05)
  setTimeout(() => playTone(990, 0.04, 'sine', 0.04), 40)
}

export function sfxFoodHitGround(): void {
  playTone(120, 0.12, 'triangle', 0.08)
  playTone(80, 0.18, 'sine', 0.06, 0.03)
}

export function sfxFireBurst(): void {
  playTone(165, 0.2, 'sawtooth', 0.14)
  playTone(220, 0.15, 'square', 0.1, 0.02)
  playTone(110, 0.25, 'triangle', 0.08, 0.05)
}

export function sfxCelebrationStart(): void {
  const notes = [440, 554, 659, 784, 880]
  for (let i = 0; i < notes.length; i++) {
    setTimeout(() => {
      playTone(notes[i], 0.35, 'triangle', 0.12)
    }, i * 150)
  }
}

export function sfxMenuOpen(): void {
  playTone(330, 0.06, 'sine', 0.06)
}
