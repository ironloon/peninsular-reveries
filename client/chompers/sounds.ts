let audioContext: AudioContext | null = null
let audioUnlocked = false

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    try {
      audioContext = new AudioContext()
    } catch {
      return null
    }
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  return audioContext
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1,
  delay: number = 0,
): void {
  const context = getAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay)
  gain.gain.setValueAtTime(volume, context.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start(context.currentTime + delay)
  oscillator.stop(context.currentTime + delay + duration)
}

function playSweep(
  startFrequency: number,
  endFrequency: number,
  duration: number,
  type: OscillatorType = 'triangle',
  volume: number = 0.08,
): void {
  const context = getAudioContext()
  if (!context) return

  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(startFrequency, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + duration)
  gain.gain.setValueAtTime(volume, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start(context.currentTime)
  oscillator.stop(context.currentTime + duration)
}

export function ensureAudioUnlocked(): void {
  if (audioUnlocked) return
  const context = getAudioContext()
  if (!context) return

  const buffer = context.createBuffer(1, 1, context.sampleRate)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start()
  audioUnlocked = true
}

export function sfxButton(): void {
  playTone(620, 0.06, 'sine', 0.05)
}

export function sfxChomp(): void {
  playTone(170, 0.08, 'triangle', 0.11)
  playTone(130, 0.1, 'square', 0.06, 0.03)
}

export function sfxCollect(points: number): void {
  playTone(520 + points * 60, 0.12, 'sine', 0.09)
  playTone(760 + points * 40, 0.12, 'sine', 0.07, 0.05)
}

export function sfxHazard(): void {
  playSweep(260, 120, 0.22, 'square', 0.08)
  playTone(92, 0.18, 'sawtooth', 0.03, 0.04)
}

export function sfxMiss(): void {
  playSweep(220, 90, 0.18, 'triangle', 0.07)
}

export function sfxCountdown(seconds: number): void {
  const frequency = seconds <= 3 ? 900 : 640
  playTone(frequency, 0.1, 'sine', 0.08)
}

export function sfxGameOver(): void {
  playTone(220, 0.16, 'triangle', 0.08)
  playTone(165, 0.22, 'triangle', 0.07, 0.08)
  playTone(131, 0.3, 'triangle', 0.06, 0.18)
}