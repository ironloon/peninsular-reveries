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

    // Spawn four cats so we have cats with delayMs = 600, 1200, 1800
    // (the first is the player at delay 0)
    state = progressSong(state, 0.8 * 30000)
    assert.strictEqual(state.cats.length, 5)

    // Seed the pose history with known timestamps.
    // We simulate updatePose calls at 200ms increments.
    const baseTime = performance.now()

    // Override performance.now for determinism.
    let callIndex = 0
    const times = [
      baseTime, baseTime + 200, baseTime + 400, baseTime + 600,
      baseTime + 800, baseTime + 1000, baseTime + 1200,
    ]
    const originalNow = performance.now.bind(performance)
    Object.defineProperty(performance, 'now', {
      value: () => times[callIndex] ?? originalNow(),
      configurable: true,
      writable: true,
    })

    state = updatePose(state, 'idle')      // t=0     history: idle
    callIndex++
    state = updatePose(state, 'left-paw-up')   // t=200   history: idle, left
    callIndex++
    state = updatePose(state, 'right-paw-up')  // t=400   history: idle, left, right
    callIndex++
    state = updatePose(state, 'both-paws-up')  // t=600   history: idle, left, right, both
    callIndex++
    state = updatePose(state, 'jump')          // t=800   history: idle, left, right, both, jump
    callIndex++
    state = updatePose(state, 'crouch')        // t=1000  history: ..., crouch
    callIndex++
    state = updatePose(state, 'idle')          // t=1200  history: ..., idle
    callIndex++

    // Player cat (delayMs = 0) gets the latest pose
    assert.strictEqual(state.cats[0].pose, 'idle')

    // Cat 1 delay 600 — at t=1200 wants pose closest to t=600 → both-paws-up
    assert.strictEqual(state.cats[1].pose, 'both-paws-up')

    // Cat 2 delay 1200 — at t=1200 wants pose closest to t=0 → idle
    assert.strictEqual(state.cats[2].pose, 'idle')

    // Cat 3 delay 1800 — at t=1200 wants pose closest to t=-600
    // Closest available is t=0 → idle
    assert.strictEqual(state.cats[3].pose, 'idle')

    // Cat 4 delay 2400 — same as above → idle
    assert.strictEqual(state.cats[4].pose, 'idle')

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
