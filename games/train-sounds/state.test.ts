import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_TRAIN_PRESET_ID,
  TRAIN_PRESET_IDS,
} from './catalog.js'
import {
  createInitialTrainSoundsState,
  resetTrainSoundsState,
  selectHotspot,
  selectNextTrain,
  selectPreviousTrain,
} from './state.js'
import type { TrainSoundsState } from './types.js'

test('createInitialTrainSoundsState starts on the default preset with no hotspot focus', () => {
  assert.deepEqual(createInitialTrainSoundsState(), {
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: null,
    pressedHotspotId: null,
  })
})

test('selectNextTrain wraps from the last preset back to the default preset and clears hotspot state', () => {
  const state: TrainSoundsState = {
    currentPresetId: TRAIN_PRESET_IDS[TRAIN_PRESET_IDS.length - 1],
    focusedHotspotId: 'high-speed-brake',
    pressedHotspotId: 'high-speed-brake',
  }

  assert.deepEqual(selectNextTrain(state), {
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: null,
    pressedHotspotId: null,
  })
})

test('selectPreviousTrain wraps from the default preset to the last preset and clears hotspot state', () => {
  const state: TrainSoundsState = {
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: 'steam-bell',
    pressedHotspotId: 'steam-bell',
  }

  assert.deepEqual(selectPreviousTrain(state), {
    currentPresetId: TRAIN_PRESET_IDS[TRAIN_PRESET_IDS.length - 1],
    focusedHotspotId: null,
    pressedHotspotId: null,
  })
})

test('selectHotspot focuses and presses a hotspot on the active preset', () => {
  const nextState = selectHotspot(createInitialTrainSoundsState(), 'steam-whistle')

  assert.deepEqual(nextState, {
    currentPresetId: DEFAULT_TRAIN_PRESET_ID,
    focusedHotspotId: 'steam-whistle',
    pressedHotspotId: 'steam-whistle',
  })
})

test('selectHotspot ignores hotspots that are not part of the active preset and repeated active selections', () => {
  const initialState = createInitialTrainSoundsState()
  const invalidHotspotState = selectHotspot(initialState, 'diesel-horn')
  const selectedState = selectHotspot(initialState, 'steam-whistle')

  assert.equal(invalidHotspotState, initialState)
  assert.equal(selectHotspot(selectedState, 'steam-whistle'), selectedState)
})

test('resetTrainSoundsState restores the initial preset and clears hotspot state', () => {
  const state: TrainSoundsState = {
    currentPresetId: 'electric',
    focusedHotspotId: 'electric-power-hum',
    pressedHotspotId: 'electric-power-hum',
  }

  assert.deepEqual(resetTrainSoundsState(), createInitialTrainSoundsState())
  assert.notDeepEqual(state, resetTrainSoundsState())
})