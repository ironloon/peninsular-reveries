import { getGameAudioBuses } from '../../client/game-audio.js'

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

export function sfxChomp(value: number): void {
  const freq = value >= 5 ? 880 : 660
  playTone(freq, 0.08, 'square', 0.12)
  setTimeout(() => {
    playTone(freq * 0.75, 0.1, 'square', 0.08)
  }, 60)
}

export function sfxFoodSpawn(): void {
  playTone(440, 0.04, 'sine', 0.04)
}

export function sfxFireBurst(): void {
  playTone(220, 0.15, 'sawtooth', 0.1)
}

export function sfxCelebrationStart(): void {
  const notes = [523, 659, 784, 1047]
  for (let i = 0; i < notes.length; i++) {
    setTimeout(() => {
      playTone(notes[i], 0.2, 'square', 0.1)
    }, i * 120)
  }
}

export function sfxMenuOpen(): void {
  playTone(330, 0.06, 'sine', 0.06)
}
