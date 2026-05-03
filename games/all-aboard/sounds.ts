import { getGameAudioBuses } from '../../client/game-audio.js'

let globalMuted = false

function getCtx(): AudioContext | null {
  try {
    return getGameAudioBuses('all-aboard').ctx
  } catch {
    return null
  }
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('all-aboard').sfx
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

// ── Chugging: rhythmic "chugga chugga" sound ──
let chugInterval: ReturnType<typeof setInterval> | null = null

export function startChuggingSound(): void {
  if (globalMuted || chugInterval) return
  let toggle = false
  chugInterval = setInterval(() => {
    if (globalMuted) return
    if (toggle) {
      playTone(120, 0.08, 'sawtooth', 0.12)
      playTone(80, 0.1, 'triangle', 0.08)
    } else {
      playTone(180, 0.06, 'square', 0.08)
      playTone(100, 0.08, 'triangle', 0.06)
    }
    toggle = !toggle
  }, 250)
}

export function stopChuggingSound(): void {
  if (chugInterval) {
    clearInterval(chugInterval)
    chugInterval = null
  }
}

// ── Whistle: "All Aboard!" sound effect ──
export function sfxWhistle(): void {
  if (globalMuted) return
  // Steam whistle: rising tone
  const context = getCtx()
  if (!context) return

  const startTime = context.currentTime

  // Whistle whoosh
  const whistle = context.createOscillator()
  whistle.type = 'sine'
  whistle.frequency.setValueAtTime(600, startTime)
  whistle.frequency.linearRampToValueAtTime(900, startTime + 0.15)
  whistle.frequency.setValueAtTime(900, startTime + 0.5)
  whistle.frequency.linearRampToValueAtTime(700, startTime + 0.8)

  const whistleGain = context.createGain()
  whistleGain.gain.setValueAtTime(0.0001, startTime)
  whistleGain.gain.linearRampToValueAtTime(0.18, startTime + 0.15)
  whistleGain.gain.setValueAtTime(0.18, startTime + 0.5)
  whistleGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85)

  whistle.connect(whistleGain)
  whistleGain.connect(getSfxBusNode())
  whistle.start(startTime)
  whistle.stop(startTime + 0.9)

  // Steam hiss
  const buffer = context.createBuffer(1, context.sampleRate * 0.6, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3
  }
  const noise = context.createBufferSource()
  noise.buffer = buffer

  const noiseFilter = context.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.value = 3000
  noiseFilter.Q.value = 0.5

  const noiseGain = context.createGain()
  noiseGain.gain.setValueAtTime(0.0001, startTime + 0.05)
  noiseGain.gain.linearRampToValueAtTime(0.08, startTime + 0.2)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7)

  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(getSfxBusNode())
  noise.start(startTime + 0.05)
  noise.stop(startTime + 0.75)
}

// ── "Choo choo!" final blast ──
export function sfxChooChoo(): void {
  if (globalMuted) return
  playTone(400, 0.3, 'sawtooth', 0.15)
  playTone(600, 0.2, 'sine', 0.1, 0.1)
  playTone(800, 0.25, 'sine', 0.12, 0.35)
  playTone(500, 0.35, 'sawtooth', 0.1, 0.5)
}

export function sfxClick(): void {
  playTone(440, 0.04, 'sine', 0.08)
}

export function sfxStart(): void {
  const notes = [330, 392, 523, 659]
  for (let i = 0; i < notes.length; i++) {
    playTone(notes[i], 0.2, 'triangle', 0.1, i * 0.12)
  }
}

// ── Speech synthesis for "All Aboard!" ──
let speechEnabled = true

export function speakAllAboard(): void {
  if (!speechEnabled) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance('All Aboard!')
  utterance.rate = 0.9
  utterance.pitch = 0.8
  utterance.volume = 1

  // Try to find a good voice
  const voices = window.speechSynthesis.getVoices()
  const englishVoice = voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'))
    ?? voices.find((v) => v.lang.startsWith('en'))
  if (englishVoice) utterance.voice = englishVoice

  window.speechSynthesis.speak(utterance)
}

export function setMuted(muted: boolean): void {
  globalMuted = muted
  if (muted) {
    stopChuggingSound()
    speechEnabled = false
    window.speechSynthesis?.cancel()
  } else {
    speechEnabled = true
  }
}