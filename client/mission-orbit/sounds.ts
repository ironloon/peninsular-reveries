import type { BurnGrade, MissionPhase } from './types.js'

let ctx: AudioContext | null = null
let unlocked = false
let musicEnabled = false
let musicPreferenceLoaded = false
let ambientInterval: number | null = null

const MUSIC_STORAGE_KEY = 'mission-orbit-music-enabled'
const SPACE_MUSIC_PHASES = new Set<MissionPhase>([
  'high-earth-orbit',
  'trans-lunar-injection',
  'lunar-flyby',
  'return-coast',
])

function getCtx(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }

  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  return ctx
}

function loadMusicPreference(): void {
  if (musicPreferenceLoaded) return
  musicPreferenceLoaded = true
  try {
    musicEnabled = window.localStorage.getItem(MUSIC_STORAGE_KEY) === 'true'
  } catch {
    musicEnabled = false
  }
}

function tone(frequency: number, duration: number, type: OscillatorType, volume: number, whenOffset: number = 0): void {
  const audio = getCtx()
  if (!audio) return

  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  const startTime = audio.currentTime + whenOffset

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(audio.destination)

  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

function sweep(startFrequency: number, endFrequency: number, duration: number, type: OscillatorType, volume: number): void {
  const audio = getCtx()
  if (!audio) return

  const oscillator = audio.createOscillator()
  const gain = audio.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(startFrequency, audio.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, audio.currentTime + duration)
  gain.gain.setValueAtTime(volume, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)

  oscillator.connect(gain)
  gain.connect(audio.destination)

  oscillator.start()
  oscillator.stop(audio.currentTime + duration)
}

function chord(notes: readonly number[], duration: number, volume: number): void {
  const audio = getCtx()
  if (!audio) return

  for (const frequency of notes) {
    tone(frequency, duration, 'sine', volume)
  }
}

function playAmbientMeasure(): void {
  const audio = getCtx()
  if (!audio || audio.state === 'suspended') return

  chord([174.61, 261.63, 392], 2.8, 0.012)
  tone(523.25, 0.9, 'sine', 0.01, 0.55)
  tone(659.25, 0.8, 'sine', 0.008, 1.45)
}

function startAmbientLoop(): void {
  if (ambientInterval !== null) return
  playAmbientMeasure()
  ambientInterval = window.setInterval(playAmbientMeasure, 2600)
}

function stopAmbientLoop(): void {
  if (ambientInterval !== null) {
    window.clearInterval(ambientInterval)
    ambientInterval = null
  }
}

export function ensureAudioUnlocked(): void {
  if (unlocked) return
  const audio = getCtx()
  if (!audio) return

  const buffer = audio.createBuffer(1, 1, audio.sampleRate)
  const source = audio.createBufferSource()
  source.buffer = buffer
  source.connect(audio.destination)
  source.start()

  unlocked = true
}

export function getMusicEnabled(): boolean {
  loadMusicPreference()
  return musicEnabled
}

export function setMusicEnabled(enabled: boolean): void {
  loadMusicPreference()
  musicEnabled = enabled
  try {
    window.localStorage.setItem(MUSIC_STORAGE_KEY, String(enabled))
  } catch {
    // Ignore localStorage failures.
  }
}

export function syncMusicPlayback(phase: MissionPhase): void {
  loadMusicPreference()
  if (!musicEnabled || document.hidden || !SPACE_MUSIC_PHASES.has(phase)) {
    stopAmbientLoop()
    return
  }

  startAmbientLoop()
}

export function sfxButton(): void {
  tone(620, 0.07, 'sine', 0.05)
}

export function sfxCountdownBeep(value: number): void {
  const frequency = value <= 3 ? 920 : 680
  tone(frequency, 0.09, 'square', 0.05)
}

export function sfxEngineIgnition(): void {
  sweep(90, 170, 0.45, 'sawtooth', 0.08)
}

export function sfxLiftoff(): void {
  sweep(130, 60, 0.65, 'sawtooth', 0.12)
  tone(240, 0.42, 'triangle', 0.04, 0.08)
}

export function sfxBurnPulse(): void {
  sweep(120, 180, 0.22, 'triangle', 0.05)
}

export function sfxBurnWindow(): void {
  tone(460, 0.08, 'sine', 0.045)
  tone(620, 0.08, 'sine', 0.04, 0.08)
}

export function sfxCueApproach(): void {
  tone(520, 0.06, 'sine', 0.03)
}

export function sfxCueReady(): void {
  tone(660, 0.07, 'sine', 0.035)
  tone(880, 0.08, 'triangle', 0.028, 0.05)
}

export function sfxCueStrike(): void {
  chord([659.25, 987.77], 0.12, 0.04)
  tone(1318.51, 0.1, 'sine', 0.03, 0.03)
}

export function sfxSlowMo(): void {
  sweep(740, 280, 0.24, 'triangle', 0.035)
  tone(420, 0.2, 'sine', 0.022, 0.05)
}

export function sfxBurnResult(grade: BurnGrade): void {
  if (grade === 'assist') {
    tone(200, 0.18, 'square', 0.05)
    tone(160, 0.24, 'triangle', 0.035, 0.09)
    return
  }

  if (grade === 'safe') {
    chord([392, 523.25], 0.22, 0.045)
    return
  }

  if (grade === 'good') {
    chord([440, 554.37, 659.25], 0.24, 0.05)
    return
  }

  chord([523.25, 659.25, 783.99], 0.28, 0.055)
  tone(1046.5, 0.24, 'sine', 0.045, 0.06)
}

export function sfxReentry(): void {
  sweep(800, 180, 0.55, 'triangle', 0.05)
}

export function sfxParachute(): void {
  tone(720, 0.08, 'square', 0.04)
  tone(540, 0.2, 'triangle', 0.03, 0.06)
}

export function sfxSplashdown(): void {
  tone(180, 0.16, 'triangle', 0.05)
  sweep(320, 120, 0.25, 'sine', 0.04)
}

export function sfxCelebration(): void {
  chord([392, 523.25, 659.25], 0.35, 0.05)
  tone(783.99, 0.34, 'sine', 0.05, 0.12)
}