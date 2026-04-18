import { announce } from '../../client/game-accessibility.js'
import { getGameAudioBuses } from '../../client/game-audio.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { getSfxEnabled } from '../../client/preferences.js'

import { cleanupMusicPadInput, setupMusicPadInput } from './input.js'
import {
  flashPad,
  initRenderer,
  updateLayerIndicator,
  updateModeDisplay,
  updatePlaybackProgress,
  updateRecordButton,
  updateTempoDisplay,
} from './renderer.js'
import { PAD_NAMES, PAD_SOUNDS } from './sounds.js'
import {
  canRecord,
  clearLoop,
  createInitialState,
  cycleTempo,
  getEventsInWindow,
  getLoopDurationMs,
  startRecording,
  stopRecording,
  togglePlayback,
  triggerPad,
} from './state.js'
import type { MusicPadState, PadId } from './types.js'

type ScreenId = 'start-screen' | 'game-screen'

const SCREEN_IDS: ScreenId[] = ['start-screen', 'game-screen']
const LOOKAHEAD_MS = 25

let audio: ReturnType<typeof getGameAudioBuses> | null = null
let state: MusicPadState = createInitialState()
let settingsModal = { open() {}, close() {}, toggle() {} }
let recordStopTimer: number | null = null
let rafHandle: number | null = null
let playbackLoopStart = 0
let scheduleHorizonPerf = 0
let visibilityPausePosition: number | null = null

function byId<T extends HTMLElement>(id: string): T | null {
  const el = document.getElementById(id)
  return el instanceof HTMLElement ? (el as T) : null
}

function isSettingsOpen(): boolean {
  const modal = byId<HTMLElement>('settings-modal')
  return Boolean(modal && !modal.hidden)
}

function showScreen(screenId: ScreenId): void {
  for (const id of SCREEN_IDS) {
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.classList.toggle('active', isActive)
    el.setAttribute('aria-hidden', String(!isActive))
  }
}

function ensureAudio(): ReturnType<typeof getGameAudioBuses> {
  if (!audio) {
    audio = getGameAudioBuses('music-pad')
  }
  return audio
}

function playPadSound(padId: PadId): void {
  if (!getSfxEnabled()) return
  const buses = ensureAudio()
  if (buses.ctx.state === 'suspended') {
    void buses.ctx.resume()
  }
  const sound = PAD_SOUNDS[padId]
  if (sound) sound(buses.sfx, buses.ctx)
}

function refreshUi(): void {
  updateModeDisplay(state.mode)
  updateTempoDisplay(state.tempo)
  updateRecordButton(canRecord(state), state.mode === 'recording')
  updateLayerIndicator(state.layers.length)
}

function clearRecordTimer(): void {
  if (recordStopTimer !== null) {
    window.clearTimeout(recordStopTimer)
    recordStopTimer = null
  }
}

function cancelRaf(): void {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle)
    rafHandle = null
  }
}

function handlePadHit(padId: PadId): void {
  const now = performance.now()
  const result = triggerPad(state, padId, now)
  state = result.state
  playPadSound(padId)
  flashPad(padId)
  const name = PAD_NAMES[padId]
  if (name) announce(name, 'polite')
}

function startRecord(): void {
  if (!canRecord(state)) return
  cancelRaf()
  visibilityPausePosition = null
  state = startRecording(state, performance.now())
  refreshUi()
  const duration = getLoopDurationMs(state.tempo)
  clearRecordTimer()
  recordStopTimer = window.setTimeout(() => {
    recordStopTimer = null
    stopRecord()
  }, duration)
}

function stopRecord(): void {
  if (state.mode !== 'recording') return
  clearRecordTimer()
  state = stopRecording(state)
  refreshUi()
  startPlayback()
}

function togglePlay(): void {
  if (state.mode === 'recording') {
    stopRecord()
    return
  }
  state = togglePlayback(state)
  refreshUi()
  if (state.mode === 'playing') {
    startPlayback()
  } else {
    cancelRaf()
    updatePlaybackProgress(0)
  }
}

function clearAll(): void {
  clearRecordTimer()
  cancelRaf()
  state = clearLoop(state)
  visibilityPausePosition = null
  updatePlaybackProgress(0)
  refreshUi()
  announce('Loop cleared', 'polite')
}

function changeTempo(): void {
  const wasPlaying = state.mode === 'playing'
  if (state.mode === 'recording') {
    stopRecord()
  }
  state = cycleTempo(state)
  refreshUi()
  if (wasPlaying) {
    cancelRaf()
    startPlayback()
  }
}

function startPlayback(): void {
  cancelRaf()
  if (state.layers.length === 0) {
    state = { ...state, mode: 'free' }
    refreshUi()
    return
  }
  const now = performance.now()
  playbackLoopStart = now
  scheduleHorizonPerf = now
  state = { ...state, loopStartTime: now }
  visibilityPausePosition = null
  rafHandle = requestAnimationFrame(tickPlayback)
}

function tickPlayback(): void {
  if (state.mode !== 'playing') {
    rafHandle = null
    return
  }
  const duration = getLoopDurationMs(state.tempo)
  if (duration <= 0 || state.layers.length === 0) {
    rafHandle = null
    return
  }
  const now = performance.now()
  const targetHorizon = now + LOOKAHEAD_MS
  if (targetHorizon > scheduleHorizonPerf) {
    scheduleEvents(scheduleHorizonPerf, targetHorizon, duration)
    scheduleHorizonPerf = targetHorizon
  }
  const elapsed = now - playbackLoopStart
  const position = ((elapsed % duration) + duration) % duration
  updatePlaybackProgress(position / duration)
  rafHandle = requestAnimationFrame(tickPlayback)
}

function scheduleEvents(fromPerfMs: number, toPerfMs: number, duration: number): void {
  const fromCycle = Math.max(0, Math.floor((fromPerfMs - playbackLoopStart) / duration))
  const toCycle = Math.max(0, Math.floor((toPerfMs - playbackLoopStart) / duration))
  for (let cycle = fromCycle; cycle <= toCycle; cycle++) {
    const cycleStartPerf = playbackLoopStart + cycle * duration
    const fromPos = Math.max(0, fromPerfMs - cycleStartPerf)
    const toPos = Math.min(duration, toPerfMs - cycleStartPerf)
    if (toPos <= fromPos) continue
    const events = getEventsInWindow(state.layers, fromPos, toPos, duration)
    for (const event of events) {
      const eventPerf = cycleStartPerf + event.timeOffset
      scheduleAt(event.padId, eventPerf)
    }
  }
}

function scheduleAt(padId: PadId, eventPerfMs: number): void {
  const buses = ensureAudio()
  if (buses.ctx.state === 'suspended') {
    void buses.ctx.resume()
  }
  const nowPerf = performance.now()
  const delayMs = Math.max(0, eventPerfMs - nowPerf)
  const sound = PAD_SOUNDS[padId]
  window.setTimeout(() => {
    if (state.mode !== 'playing') return
    if (getSfxEnabled() && sound) {
      sound(buses.sfx, buses.ctx)
    }
    flashPad(padId)
  }, delayMs)
}

function bindPads(): void {
  for (let i = 0; i < 8; i++) {
    const padId = i as PadId
    const btn = byId<HTMLButtonElement>(`pad-${i}`)
    if (!btn) continue
    btn.addEventListener('click', () => {
      handlePadHit(padId)
    })
  }
}

function handleRecordButton(): void {
  if (state.mode === 'recording') {
    stopRecord()
  } else {
    startRecord()
  }
}

function bindControls(): void {
  byId<HTMLButtonElement>('record-btn')?.addEventListener('click', handleRecordButton)
  byId<HTMLButtonElement>('play-btn')?.addEventListener('click', togglePlay)
  byId<HTMLButtonElement>('clear-btn')?.addEventListener('click', clearAll)
  byId<HTMLButtonElement>('tempo-btn')?.addEventListener('click', changeTempo)
}

function bindStartButton(): void {
  byId<HTMLButtonElement>('start-btn')?.addEventListener('click', () => {
    enterGame()
  })
}

function wireInputModule(): void {
  setupMusicPadInput({
    onPadTrigger: handlePadHit,
    onRecord: handleRecordButton,
    onPlayStop: togglePlay,
    onClear: clearAll,
    onTempo: changeTempo,
    onMenu: () => settingsModal.toggle(),
  })
}

function enterGame(): void {
  ensureAudio()
  showScreen('game-screen')
  refreshUi()
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('pad-0')?.focus({ preventScroll: true })
  })
}

function returnToStart(): void {
  clearRecordTimer()
  cancelRaf()
  state = createInitialState()
  visibilityPausePosition = null
  updatePlaybackProgress(0)
  showScreen('start-screen')
  refreshUi()
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('start-btn')?.focus({ preventScroll: true })
  })
}

function bindEscapeKey(): void {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    if (isSettingsOpen()) {
      settingsModal.close()
      event.preventDefault()
    }
  })
}

function bindRestart(): void {
  document.addEventListener('restart', () => {
    returnToStart()
  })
}

function bindVisibility(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.mode === 'playing') {
        const duration = getLoopDurationMs(state.tempo)
        const elapsed = performance.now() - playbackLoopStart
        visibilityPausePosition =
          duration > 0 ? ((elapsed % duration) + duration) % duration : 0
        cancelRaf()
      } else if (state.mode === 'recording') {
        clearRecordTimer()
        state = { ...state, mode: 'free', currentEvents: [] }
        refreshUi()
      }
    } else if (state.mode === 'playing' && visibilityPausePosition !== null) {
      const now = performance.now()
      playbackLoopStart = now - visibilityPausePosition
      scheduleHorizonPerf = now
      visibilityPausePosition = null
      rafHandle = requestAnimationFrame(tickPlayback)
    }
  })
}

function init(): void {
  initRenderer()
  settingsModal = setupGameMenu({ musicTrackPicker: false })
  bindPads()
  bindControls()
  bindStartButton()
  bindEscapeKey()
  bindRestart()
  bindVisibility()
  wireInputModule()
  showScreen('start-screen')
  refreshUi()
}

export function teardownMusicPad(): void {
  cleanupMusicPadInput()
  clearRecordTimer()
  cancelRaf()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
