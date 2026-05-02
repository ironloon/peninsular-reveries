import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  createInitialState,
  startRound,
  updatePose,
  progressSong,
  completeDance,
  ROUNDS, nextRound,
} from './state.js'

describe('createInitialState', () => {
  it('has one cat and phase start with round config', () => {
    const state = createInitialState()

    assert.strictEqual(state.phase, 'start')
    assert.strictEqual(state.cats.length, 1)
    assert.strictEqual(state.cats[0].id, 'cat-0')
    assert.strictEqual(state.cats[0].delayMs, 0)
    assert.strictEqual(state.songProgress, 0)
    assert.deepStrictEqual(state.poseHistory, [])
    assert.strictEqual(state.round, 1)
    assert.strictEqual(state.maxRounds, 3)
    assert.ok(state.config)
  })
})

describe('progressSong', () => {
  it('spawns a new cat exactly at round 1 thresholds', () => {
    const cfg = ROUNDS[0]
    const thresholds = cfg.thresholds

    for (let i = 0; i < thresholds.length; i++) {
      let state = startRound(createInitialState())
      const deltaMs = thresholds[i] * cfg.durationMs
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
    let state = startRound(createInitialState())
    state = updatePose(state, 'left-paw-up')

    assert.strictEqual(state.cats[0].pose, 'left-paw-up')
  })

  it('gives delayed cats the historical pose closest to their delay', () => {
    let state = startRound(createInitialState())
    const cfg = state.config

    state = progressSong(state, cfg.durationMs)
    // Round 1 has 2 thresholds → 3 cats total
    assert.strictEqual(state.cats.length, cfg.thresholds.length + 1)

    const baseTime = performance.now()

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

    state = updatePose(state, 'idle')      // t=0
    callIndex++
    state = updatePose(state, 'left-paw-up')   // t=200
    callIndex++
    state = updatePose(state, 'right-paw-up')  // t=400
    callIndex++
    state = updatePose(state, 'both-paws-up')  // t=600
    callIndex++
    state = updatePose(state, 'jump')          // t=800
    callIndex++
    state = updatePose(state, 'crouch')        // t=1000
    callIndex++
    state = updatePose(state, 'idle')          // t=1200
    callIndex++

    assert.strictEqual(state.cats[0].pose, 'idle')
    assert.strictEqual(state.cats[1].pose, 'idle')
    assert.strictEqual(state.cats[2].pose, 'idle')

    Object.defineProperty(performance, 'now', {
      value: originalNow,
      configurable: true,
      writable: true,
    })
  })
})

describe('completeDance', () => {
  it('transitions to phase complete', () => {
    let state = startRound(createInitialState())
    state = completeDance(state)

    assert.strictEqual(state.phase, 'complete')
  })
})

describe('nextRound', () => {
  it('advances from round 1 to round 2', () => {
    let state = createInitialState()
    state = startRound(state)
    state = completeDance(state)

    const nextState = nextRound(state)
    assert.ok(nextState)
    assert.strictEqual(nextState!.round, 2)
    assert.strictEqual(nextState!.config.round, 2)
    assert.deepStrictEqual(nextState!.cats, [
      { id: 'cat-0', x: 0, y: 0, scale: 1.2, tint: 0xffffff, pose: 'idle', delayMs: 0, joinTime: 0 },
    ])
  })

  it('returns null after the final round', () => {
    let state = createInitialState()
    state = { ...state, round: 3, config: ROUNDS[2] }
    state = startRound(state)
    state = completeDance(state)

    const nextState = nextRound(state)
    assert.strictEqual(nextState, null)
  })
})
