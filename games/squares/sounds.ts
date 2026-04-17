import {
  ensureAudioUnlocked,
  playNotes,
  playTone,
  type NoteSequence,
} from '../../client/audio.js'
import { getGameAudioBuses } from '../../client/game-audio.js'
import { getMusicEnabled, getSfxEnabled } from '../../client/preferences.js'

export { ensureAudioUnlocked }

export type SquaresMusicProfileId = 'chill' | 'tense'

export interface SquaresMusicEvent {
  readonly startStep: number
  readonly durationSteps: number
  readonly frequency: number
  readonly gain: number
  readonly type: OscillatorType
}

export interface SquaresMusicProfileDefinition {
  readonly id: SquaresMusicProfileId
  readonly label: string
  readonly tempoBpm: number
  readonly stepsPerBeat: number
  readonly loopBeats: number
  readonly events: readonly SquaresMusicEvent[]
}

export const DEFAULT_SQUARES_MUSIC_PROFILE_ID: SquaresMusicProfileId = 'chill'

export const SQUARES_MUSIC_PROFILES = [
  {
    id: 'chill',
    label: 'Chill',
    tempoBpm: 78,
    stepsPerBeat: 2,
    loopBeats: 8,
    events: [
      { startStep: 0, durationSteps: 6, frequency: 220, gain: 0.065, type: 'triangle' },
      { startStep: 2, durationSteps: 4, frequency: 277.18, gain: 0.04, type: 'sine' },
      { startStep: 6, durationSteps: 6, frequency: 329.63, gain: 0.05, type: 'triangle' },
      { startStep: 8, durationSteps: 4, frequency: 246.94, gain: 0.04, type: 'sine' },
      { startStep: 10, durationSteps: 4, frequency: 293.66, gain: 0.04, type: 'triangle' },
      { startStep: 12, durationSteps: 4, frequency: 220, gain: 0.05, type: 'sine' },
    ],
  },
  {
    id: 'tense',
    label: 'Tense',
    tempoBpm: 96,
    stepsPerBeat: 4,
    loopBeats: 8,
    events: [
      { startStep: 0, durationSteps: 6, frequency: 196, gain: 0.1, type: 'sawtooth' },
      { startStep: 4, durationSteps: 4, frequency: 233.08, gain: 0.08, type: 'triangle' },
      { startStep: 8, durationSteps: 4, frequency: 261.63, gain: 0.08, type: 'sawtooth' },
      { startStep: 12, durationSteps: 4, frequency: 246.94, gain: 0.08, type: 'triangle' },
      { startStep: 16, durationSteps: 6, frequency: 174.61, gain: 0.1, type: 'sawtooth' },
      { startStep: 20, durationSteps: 4, frequency: 220, gain: 0.08, type: 'triangle' },
      { startStep: 24, durationSteps: 4, frequency: 233.08, gain: 0.08, type: 'sawtooth' },
      { startStep: 28, durationSteps: 4, frequency: 207.65, gain: 0.08, type: 'triangle' },
    ],
  },
] as const satisfies readonly SquaresMusicProfileDefinition[]

let musicLoopTimer: number | null = null
let activeProfileId: SquaresMusicProfileId = DEFAULT_SQUARES_MUSIC_PROFILE_ID
let musicRequested = false

function getMusicBusNode(): GainNode {
  return getGameAudioBuses('squares').music
}

function getSfxBusNode(): GainNode {
  return getGameAudioBuses('squares').sfx
}

function getProfile(profileId: SquaresMusicProfileId): SquaresMusicProfileDefinition {
  const profile = SQUARES_MUSIC_PROFILES.find((candidate) => candidate.id === profileId)

  if (!profile) {
    throw new Error(`Unknown Squares music profile: ${profileId}`)
  }

  return profile
}

function stepDurationSeconds(profile: SquaresMusicProfileDefinition): number {
  return 60 / profile.tempoBpm / profile.stepsPerBeat
}

function profileLoopDurationMs(profile: SquaresMusicProfileDefinition): number {
  return profile.loopBeats * (60 / profile.tempoBpm) * 1000
}

function toNoteSequence(profile: SquaresMusicProfileDefinition): NoteSequence {
  const secondsPerStep = stepDurationSeconds(profile)
  return profile.events.map((event) => ({
    frequency: event.frequency,
    gain: event.gain,
    type: event.type,
    startOffset: event.startStep * secondsPerStep,
    duration: Math.max(event.durationSteps * secondsPerStep, 0.08),
    attackTime: 0.02,
    releaseTime: 0.08,
  }))
}

function clearMusicLoop(): void {
  if (musicLoopTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(musicLoopTimer)
  }
  musicLoopTimer = null
}

function playNoiseBurst(duration = 0.09, peakGain = 0.035): void {
  if (!getSfxEnabled()) {
    return
  }

  try {
    const context = getGameAudioBuses('squares').ctx
    const bufferSize = Math.ceil(context.sampleRate * duration)
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let index = 0; index < bufferSize; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize)
    }

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gainNode = context.createGain()
    const now = context.currentTime

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(780, now)
    filter.Q.setValueAtTime(0.8, now)
    gainNode.gain.setValueAtTime(peakGain, now)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    source.buffer = buffer
    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(getSfxBusNode())
    source.start(now)
    source.stop(now + duration)
  } catch {
    // Audio is non-critical.
  }
}

function scheduleProfile(profileId: SquaresMusicProfileId): void {
  const profile = getProfile(profileId)
  playNotes(getMusicBusNode(), toNoteSequence(profile))
}

function syncMusicRequest(): void {
  if (!musicRequested || !getMusicEnabled() || typeof window === 'undefined') {
    clearMusicLoop()
    return
  }

  const profile = getProfile(activeProfileId)
  clearMusicLoop()
  scheduleProfile(activeProfileId)
  musicLoopTimer = window.setInterval(() => scheduleProfile(activeProfileId), profileLoopDurationMs(profile))
}

if (typeof window !== 'undefined') {
  window.addEventListener('reveries:music-change', () => {
    syncMusicRequest()
  })
}

export function getSquaresMusicProfile(profileId: SquaresMusicProfileId): SquaresMusicProfileDefinition {
  return getProfile(profileId)
}

export function setSquaresMusicProfile(profileId: SquaresMusicProfileId): void {
  activeProfileId = profileId
  syncMusicRequest()
}

export function startSquaresMusic(profileId: SquaresMusicProfileId = activeProfileId): void {
  activeProfileId = profileId
  musicRequested = true
  syncMusicRequest()
}

export function stopSquaresMusic(): void {
  musicRequested = false
  clearMusicLoop()
}

export function playMoveConfirmSound(): void {
  if (!getSfxEnabled()) {
    return
  }

  try {
    const bus = getSfxBusNode()
    playNoiseBurst(0.08, 0.028)
    playTone(bus, {
      frequency: 196,
      type: 'triangle',
      gain: 0.08,
      duration: 0.12,
      attackTime: 0.01,
      releaseTime: 0.05,
    })
    playTone(bus, {
      frequency: 138.59,
      type: 'sine',
      gain: 0.04,
      duration: 0.1,
      attackTime: 0.01,
      releaseTime: 0.05,
    })
  } catch {
    // Audio is non-critical.
  }
}

export function playPatternSwitchSound(): void {
  if (!getSfxEnabled()) {
    return
  }

  try {
    playNotes(getSfxBusNode(), [
      {
        frequency: 392,
        type: 'triangle',
        gain: 0.07,
        duration: 0.08,
        startOffset: 0,
        attackTime: 0.01,
        releaseTime: 0.04,
      },
      {
        frequency: 523.25,
        type: 'square',
        gain: 0.065,
        duration: 0.1,
        startOffset: 0.05,
        attackTime: 0.01,
        releaseTime: 0.05,
      },
    ])
  } catch {
    // Audio is non-critical.
  }
}

export function playWinCue(): void {
  if (!getSfxEnabled()) {
    return
  }

  try {
    playNotes(getSfxBusNode(), [
      {
        frequency: 261.63,
        type: 'triangle',
        gain: 0.08,
        duration: 0.16,
        startOffset: 0,
        attackTime: 0.02,
        releaseTime: 0.08,
      },
      {
        frequency: 329.63,
        type: 'triangle',
        gain: 0.08,
        duration: 0.16,
        startOffset: 0.1,
        attackTime: 0.02,
        releaseTime: 0.08,
      },
      {
        frequency: 392,
        type: 'triangle',
        gain: 0.08,
        duration: 0.18,
        startOffset: 0.2,
        attackTime: 0.02,
        releaseTime: 0.08,
      },
      {
        frequency: 523.25,
        type: 'sine',
        gain: 0.09,
        duration: 0.26,
        startOffset: 0.32,
        attackTime: 0.02,
        releaseTime: 0.12,
      },
    ])
  } catch {
    // Audio is non-critical.
  }
}