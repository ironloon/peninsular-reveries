import { DEFAULT_TRAIN_PRESET_ID, TRAIN_PRESET_IDS, getTrainPresetDefinition } from './catalog.js'
import type { TrainHotspotId, TrainPresetDefinition, TrainPresetId, TrainSoundsState } from './types.js'

function getPresetIndex(presetId: TrainPresetId): number {
  const presetIndex = TRAIN_PRESET_IDS.indexOf(presetId)
  return presetIndex >= 0 ? presetIndex : 0
}

function clearTransientHotspotState(state: TrainSoundsState, presetId: TrainPresetId): TrainSoundsState {
  return {
    ...state,
    currentPresetId: presetId,
    focusedHotspotId: null,
    pressedHotspotId: null,
  }
}

function hasHotspot(preset: TrainPresetDefinition, hotspotId: TrainHotspotId): boolean {
  return preset.hotspots.some((hotspot) => hotspot.id === hotspotId)
}

export function createInitialTrainSoundsState(): TrainSoundsState {
  return {
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: null,
    pressedHotspotId: null,
  }
}

export function getCurrentPreset(state: TrainSoundsState): TrainPresetDefinition {
  return getTrainPresetDefinition(state.currentPresetId)
}

export function selectNextTrain(state: TrainSoundsState): TrainSoundsState {
  const currentPresetIndex = getPresetIndex(state.currentPresetId)
  const nextPresetId = TRAIN_PRESET_IDS[(currentPresetIndex + 1) % TRAIN_PRESET_IDS.length]
  return clearTransientHotspotState(state, nextPresetId)
}

export function selectPreviousTrain(state: TrainSoundsState): TrainSoundsState {
  const currentPresetIndex = getPresetIndex(state.currentPresetId)
  const previousPresetId = TRAIN_PRESET_IDS[(currentPresetIndex - 1 + TRAIN_PRESET_IDS.length) % TRAIN_PRESET_IDS.length]
  return clearTransientHotspotState(state, previousPresetId)
}

export function selectHotspot(state: TrainSoundsState, hotspotId: TrainHotspotId): TrainSoundsState {
  const preset = getCurrentPreset(state)

  if (!hasHotspot(preset, hotspotId)) {
    return state
  }

  if (state.focusedHotspotId === hotspotId && state.pressedHotspotId === hotspotId) {
    return state
  }

  return {
    ...state,
    focusedHotspotId: hotspotId,
    pressedHotspotId: hotspotId,
  }
}

export function resetTrainSoundsState(): TrainSoundsState {
  return createInitialTrainSoundsState()
}