import { announce } from '../../client/game-accessibility.js'
import { PAD_NAMES } from './sounds.js'
import { TEMPO_LABELS } from './types.js'
import type { MusicPadMode, PadId, TempoPreset } from './types.js'

const PAD_REPEAT_DEBOUNCE_MS = 200

let lastPadId: PadId | null = null
let lastPadAnnounceAt = 0

export function announcePadHit(padId: PadId): void {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  if (lastPadId === padId && now - lastPadAnnounceAt < PAD_REPEAT_DEBOUNCE_MS) {
    lastPadAnnounceAt = now
    return
  }
  lastPadId = padId
  lastPadAnnounceAt = now
  const name = PAD_NAMES[padId]
  if (name) announce(name, 'polite')
}

export function announceModeChange(mode: MusicPadMode): void {
  switch (mode) {
    case 'recording':
      announce('Recording started', 'assertive')
      return
    case 'playing':
      announce('Recording stopped, playing loop', 'assertive')
      return
    case 'free':
      announce('Playback stopped', 'assertive')
      return
  }
}

export function announceLoopCleared(): void {
  announce('Loop cleared', 'assertive')
}

export function announceTempoChange(tempo: TempoPreset): void {
  announce(`Tempo: ${TEMPO_LABELS[tempo]}`, 'polite')
}

export function announceLayerChange(layerCount: number, maxLayers: number): void {
  if (layerCount >= maxLayers) {
    announce('All layers full', 'polite')
    return
  }
  announce(`Layer ${layerCount} of ${maxLayers}`, 'polite')
}
