import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  createInitialState,
  startDance,
  updatePose,
  progressSong,
  completeDance,
} from './state.js'

describe('createInitialState', () => {
  it('has one cat and phase start', () => {
    const state = createInitialState()

    assert.strictEqual(state.phase, 'start')
    assert.strictEqual(state.cats.length, 1)
    assert.strictEqual(state.cats[0].id, 'cat-0')
    assert.strictEqual(state.cats[0].delayMs, 0)
    assert.strictEqual(state.songProgress, 0)
    assert.deepStrictEqual(state.poseHistory, [])
  })
})

describe('progressSong', () => {
  it('spawns a new cat exactly at progress 0.2, 0.4, 0.6, 0.8', () => {
    const thresholds = [0.2, 0.4, 0.6, 0.8]

    for (let i = 0; i < thresholds.length; i++) {
      let state = startDance(createInitialState())
      const deltaMs = thresholds[i] * 30000
      state = progressSong(state, deltaMs)

      const expectedCats = i + 2
      assert.strictEqual(
        state.cats.length,
        expectedCats,
        `expected ${expectedCats} cats at progress ${thresholds[i]} but got ${state.cats.length}`,
      )
    }
  })
})

describe('updatePose', () => {
  it('updates the player cat immediately', () => {
    let state = startDance(createInitialState())
    state = updatePose(state, 'left-paw-up')

    assert.strictEqual(state.cats[0].pose, 'left-paw-up')
  })

  it('gives delayed cats the historical pose closest to their delay', () => {
    let state = startDance(createInitialState())

    // Spawn two delayed cats so we have a cat with delayMs = 400
    state = progressSong(state, 0.6 * 30000)
    assert.strictEqual(state.cats.length, 4)

    // Seed the pose history with known timestamps.
    // We will simulate updatePose calls at specific times.
    const baseTime = performance.now()

    // Override performance.now for determinism in this test.
    // The implementation calls performance.now() once per updatePose.
    // We'll step forward in 100ms increments.
    let callIndex = 0
    const times = [baseTime, baseTime + 100, baseTime + 200, baseTime + 300, baseTime + 400]
    const originalNow = performance.now.bind(performance)
    Object.defineProperty(performance, 'now', {
      value: () => times[callIndex] ?? originalNow(),
      configurable: true,
      writable: true,
    })

    // First pose update at baseTime
    state = updatePose(state, 'idle')
    callIndex++

    // Second pose update at baseTime + 100
    state = updatePose(state, 'left-paw-up')
    callIndex++

    // Third pose update at baseTime + 200
    state = updatePose(state, 'right-paw-up')
    callIndex++

    // Fourth pose update at baseTime + 300
    state = updatePose(state, 'both-paws-up')
    callIndex++

    // Fifth pose update at baseTime + 400
    state = updatePose(state, 'jump')
    callIndex++

    // Player cat (delayMs = 0) should have the latest pose
    assert.strictEqual(state.cats[0].pose, 'jump')

    // Cat 1 has delayMs = 200; at time baseTime + 400 it wants the pose
    // closest to baseTime + 200, which is the one recorded at baseTime + 200
    assert.strictEqual(state.cats[1].pose, 'right-paw-up')

    // Cat 2 has delayMs = 400; at time baseTime + 400 it wants the pose
    // closest to baseTime + 0, which is 'idle'
    assert.strictEqual(state.cats[2].pose, 'idle')

    // Cat 3 has delayMs = 600; at time baseTime + 400 it wants the pose
    // closest to baseTime - 200. The closest available is baseTime + 0 ('idle')
    assert.strictEqual(state.cats[3].pose, 'idle')

    Object.defineProperty(performance, 'now', {
      value: originalNow,
      configurable: true,
      writable: true,
    })
  })
})

describe('completeDance', () => {
  it('transitions to phase complete', () => {
    let state = startDance(createInitialState())
    state = completeDance(state)

    assert.strictEqual(state.phase, 'complete')
  })
})
