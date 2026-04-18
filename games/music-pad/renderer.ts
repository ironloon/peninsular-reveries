import { isReducedMotionEnabled } from '../../client/preferences.js'

import {
  MAX_LAYERS,
  TEMPO_LABELS,
  type MusicPadMode,
  type PadId,
  type TempoPreset,
} from './types.js'

interface RendererRefs {
  pads: (HTMLButtonElement | null)[]
  recordBtn: HTMLButtonElement | null
  playBtn: HTMLButtonElement | null
  clearBtn: HTMLButtonElement | null
  tempoBtn: HTMLButtonElement | null
  modeIndicator: HTMLElement | null
  tempoDisplay: HTMLElement | null
  progressBar: HTMLElement | null
  layerIndicator: HTMLElement | null
}

let refs: RendererRefs | null = null

const FLASH_DURATION_MS = 120

function byId<T extends HTMLElement>(id: string): T | null {
  const el = document.getElementById(id)
  return el instanceof HTMLElement ? (el as T) : null
}

export function initRenderer(): void {
  refs = {
    pads: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => byId<HTMLButtonElement>(`pad-${i}`)),
    recordBtn: byId<HTMLButtonElement>('record-btn'),
    playBtn: byId<HTMLButtonElement>('play-btn'),
    clearBtn: byId<HTMLButtonElement>('clear-btn'),
    tempoBtn: byId<HTMLButtonElement>('tempo-btn'),
    modeIndicator: byId<HTMLElement>('mode-indicator'),
    tempoDisplay: byId<HTMLElement>('tempo-display'),
    progressBar: byId<HTMLElement>('progress-bar'),
    layerIndicator: byId<HTMLElement>('layer-indicator'),
  }
}

export function flashPad(padId: PadId): void {
  const pad = refs?.pads[padId]
  if (!pad) return
  if (isReducedMotionEnabled()) {
    pad.classList.add('hit')
    pad.classList.remove('hit')
    return
  }
  requestAnimationFrame(() => {
    pad.classList.add('hit')
    window.setTimeout(() => {
      pad.classList.remove('hit')
    }, FLASH_DURATION_MS)
  })
}

export function updateModeDisplay(mode: MusicPadMode): void {
  if (!refs) return
  const { modeIndicator, recordBtn, playBtn } = refs
  const label =
    mode === 'recording' ? 'Recording' : mode === 'playing' ? 'Playing' : 'Idle'
  if (modeIndicator) {
    modeIndicator.textContent = label
    modeIndicator.setAttribute('aria-label', `Mode: ${label}`)
  }
  if (recordBtn) {
    const isRecording = mode === 'recording'
    recordBtn.classList.toggle('recording', isRecording)
    recordBtn.setAttribute('aria-pressed', String(isRecording))
    recordBtn.textContent = isRecording ? 'Stop' : 'Record'
  }
  if (playBtn) {
    const isPlaying = mode === 'playing'
    playBtn.classList.toggle('active', isPlaying)
    playBtn.setAttribute('aria-pressed', String(isPlaying))
    playBtn.textContent = isPlaying ? 'Stop' : 'Play'
  }
}

export function updateTempoDisplay(tempo: TempoPreset): void {
  if (!refs) return
  const { tempoBtn, tempoDisplay } = refs
  const label = TEMPO_LABELS[tempo]
  if (tempoBtn) {
    tempoBtn.textContent = `Tempo: ${label}`
    tempoBtn.setAttribute('aria-label', `Tempo ${label}, change tempo`)
  }
  if (tempoDisplay) {
    tempoDisplay.textContent = label
  }
}

export function updatePlaybackProgress(progress: number): void {
  const bar = refs?.progressBar
  if (!bar) return
  const clamped = Math.max(0, Math.min(1, progress))
  if (isReducedMotionEnabled()) {
    bar.style.width = `${clamped * 100}%`
    bar.style.transition = 'none'
    return
  }
  bar.style.width = `${clamped * 100}%`
}

export function updateRecordButton(canRecord: boolean, isRecording: boolean): void {
  const btn = refs?.recordBtn
  if (!btn) return
  btn.disabled = !canRecord && !isRecording
  btn.setAttribute(
    'aria-label',
    isRecording ? 'Stop recording' : canRecord ? 'Record loop layer' : 'Record (maximum layers reached)',
  )
}

export function updateLayerIndicator(layerCount: number, maxLayers: number = MAX_LAYERS): void {
  const el = refs?.layerIndicator
  if (!el) return
  el.textContent = `Layer ${layerCount}/${maxLayers}`
}
