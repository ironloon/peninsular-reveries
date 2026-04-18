import assert from 'node:assert/strict'
import test from 'node:test'
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
import { LOOP_BARS, MAX_LAYERS, TEMPO_BPM, type LoopEvent } from './types.js'

test('createInitialState returns free mode, medium tempo, empty layers', () => {
  const state = createInitialState()
  assert.equal(state.mode, 'free')
  assert.equal(state.tempo, 'medium')
  assert.deepEqual(state.layers, [])
  assert.equal(state.activeLayer, 0)
  assert.deepEqual(state.currentEvents, [])
})

test('getLoopDurationMs returns expected ms for each tempo', () => {
  const expectedSlow = (LOOP_BARS * 4 * 60_000) / TEMPO_BPM.slow
  const expectedMedium = (LOOP_BARS * 4 * 60_000) / TEMPO_BPM.medium
  const expectedFast = (LOOP_BARS * 4 * 60_000) / TEMPO_BPM.fast
  assert.equal(getLoopDurationMs('slow'), expectedSlow)
  assert.equal(getLoopDurationMs('slow'), 6000)
  assert.equal(getLoopDurationMs('medium'), expectedMedium)
  assert.ok(Math.abs(getLoopDurationMs('medium') - 4363.636) < 1)
  assert.equal(getLoopDurationMs('fast'), expectedFast)
  assert.ok(Math.abs(getLoopDurationMs('fast') - 3428.571) < 1)
})

test('triggerPad in free mode returns state unchanged and no event', () => {
  const state = createInitialState()
  const result = triggerPad(state, 0, 1000)
  assert.equal(result.state, state)
  assert.equal(result.event, undefined)
})

test('triggerPad in recording mode captures event with correct timeOffset', () => {
  const initial = startRecording(createInitialState(), 1000)
  const result = triggerPad(initial, 3, 1250)
  assert.ok(result.event)
  assert.equal(result.event?.padId, 3)
  assert.equal(result.event?.timeOffset, 250)
  assert.equal(result.state.currentEvents.length, 1)
  assert.deepEqual(result.state.currentEvents[0], { padId: 3, timeOffset: 250 })
})

test('startRecording sets mode to recording and clears currentEvents', () => {
  const seed = createInitialState()
  const recording = startRecording(seed, 5000)
  const withEvent = triggerPad(recording, 1, 5100).state
  const restarted = startRecording(withEvent, 9000)
  assert.equal(restarted.mode, 'recording')
  assert.equal(restarted.recordStartTime, 9000)
  assert.deepEqual(restarted.currentEvents, [])
})

test('stopRecording pushes currentEvents into layers, sets playing, increments activeLayer', () => {
  let state = startRecording(createInitialState(), 0)
  state = triggerPad(state, 0, 100).state
  state = triggerPad(state, 1, 200).state
  const stopped = stopRecording(state)
  assert.equal(stopped.mode, 'playing')
  assert.equal(stopped.layers.length, 1)
  assert.equal(stopped.layers[0].length, 2)
  assert.equal(stopped.activeLayer, 1)
  assert.deepEqual(stopped.currentEvents, [])
})

test('stopRecording does not exceed MAX_LAYERS', () => {
  let state = createInitialState()
  for (let i = 0; i < MAX_LAYERS; i += 1) {
    state = startRecording(state, i * 1000)
    state = triggerPad(state, 0, i * 1000 + 100).state
    state = stopRecording(state)
  }
  assert.equal(state.layers.length, MAX_LAYERS)
  state = startRecording(state, 99_000)
  state = triggerPad(state, 2, 99_100).state
  const overflowed = stopRecording(state)
  assert.equal(overflowed.layers.length, MAX_LAYERS)
  assert.equal(overflowed.mode, 'playing')
  assert.deepEqual(overflowed.currentEvents, [])
})

test('togglePlayback transitions free<->playing only when layers exist', () => {
  const empty = createInitialState()
  assert.equal(togglePlayback(empty).mode, 'free')

  let withLayer = startRecording(empty, 0)
  withLayer = triggerPad(withLayer, 0, 100).state
  withLayer = stopRecording(withLayer)
  assert.equal(withLayer.mode, 'playing')

  const toFree = togglePlayback(withLayer)
  assert.equal(toFree.mode, 'free')

  const backToPlaying = togglePlayback(toFree)
  assert.equal(backToPlaying.mode, 'playing')
})

test('clearLoop resets layers, mode, and activeLayer', () => {
  let state = startRecording(createInitialState(), 0)
  state = triggerPad(state, 0, 100).state
  state = stopRecording(state)
  const cleared = clearLoop(state)
  assert.equal(cleared.mode, 'free')
  assert.deepEqual(cleared.layers, [])
  assert.equal(cleared.activeLayer, 0)
  assert.deepEqual(cleared.currentEvents, [])
})

test('cycleTempo cycles slow -> medium -> fast -> slow', () => {
  let state = createInitialState()
  assert.equal(state.tempo, 'medium')
  state = cycleTempo(state)
  assert.equal(state.tempo, 'fast')
  state = cycleTempo(state)
  assert.equal(state.tempo, 'slow')
  state = cycleTempo(state)
  assert.equal(state.tempo, 'medium')
})

test('canRecord is true when layers < MAX_LAYERS and not recording', () => {
  const initial = createInitialState()
  assert.equal(canRecord(initial), true)

  const recording = startRecording(initial, 0)
  assert.equal(canRecord(recording), false)

  let filled = initial
  for (let i = 0; i < MAX_LAYERS; i += 1) {
    let next = startRecording(filled, i * 1000)
    next = triggerPad(next, 0, i * 1000 + 50).state
    filled = stopRecording(next)
  }
  assert.equal(canRecord(filled), false)
})

test('getEventsInWindow returns events within window without wrap-around', () => {
  const layer: LoopEvent[] = [
    { padId: 0, timeOffset: 100 },
    { padId: 1, timeOffset: 500 },
    { padId: 2, timeOffset: 900 },
  ]
  const events = getEventsInWindow([layer], 200, 800, 1000)
  assert.equal(events.length, 1)
  assert.equal(events[0].padId, 1)
})

test('getEventsInWindow handles wrap-around windows', () => {
  const layer: LoopEvent[] = [
    { padId: 0, timeOffset: 50 },
    { padId: 1, timeOffset: 500 },
    { padId: 2, timeOffset: 950 },
  ]
  // Window crossing the loop boundary: from 900 to 1100 (i.e. 900..1000 then 0..100)
  const events = getEventsInWindow([layer], 900, 1100, 1000)
  const ids = events.map((event) => event.padId).sort()
  assert.deepEqual(ids, [0, 2])
})
