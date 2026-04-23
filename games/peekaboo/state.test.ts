import assert from 'node:assert/strict'
import test from 'node:test'
import { TARGET_POOL, type PeekabooState } from './types.js'
import { initState, advancePhase, revealCell, nextRound } from './state.js'

function makeState(overrides: Partial<PeekabooState> = {}): PeekabooState {
  const base = initState()
  return { ...base, ...overrides }
}

test('initState returns a valid initial state', () => {
  const state = initState()

  assert.equal(state.phase, 'meet')
  assert.equal(state.round, 1)
  assert.equal(state.cols, 6)
  assert.equal(state.rows, 4)
  assert.equal(state.grid.length, 4)
  assert.equal(state.grid[0].length, 6)
  assert.ok(TARGET_POOL.some((t) => t.emoji === state.currentTarget.emoji && t.name === state.currentTarget.name))
  assert.ok(state.targetRow >= 0 && state.targetRow < state.rows)
  assert.ok(state.targetCol >= 0 && state.targetCol < state.cols)
})

test('initState has all cells unrevealed', () => {
  const state = initState()

  for (const row of state.grid) {
    for (const cell of row) {
      assert.equal(cell, false)
    }
  }
})

test('advancePhase transitions meet to enter', () => {
  const state = makeState({ phase: 'meet' })
  const next = advancePhase(state)
  assert.equal(next.phase, 'enter')
})

test('advancePhase transitions enter to playing', () => {
  const state = makeState({ phase: 'enter' })
  const next = advancePhase(state)
  assert.equal(next.phase, 'playing')
})

test('advancePhase does not advance past playing', () => {
  const state = makeState({ phase: 'playing' })
  const next = advancePhase(state)
  assert.equal(next.phase, 'playing')
})

test('advancePhase does not change found phase', () => {
  const state = makeState({ phase: 'found' })
  const next = advancePhase(state)
  assert.equal(next.phase, 'found')
})

test('revealCell reveals an unrevealed cell', () => {
  const state = makeState({ phase: 'playing' })
  const next = revealCell(state, 0, 0)

  assert.equal(next.grid[0][0], true)
  assert.equal(next.phase, 'playing')
})

test('revealCell at target position transitions to found', () => {
  const state = makeState({ phase: 'playing', targetRow: 2, targetCol: 3 })
  const next = revealCell(state, 2, 3)

  assert.equal(next.phase, 'found')
  assert.equal(next.grid[2][3], true)
})

test('revealCell at non-target position does not transition to found', () => {
  const state = makeState({ phase: 'playing', targetRow: 2, targetCol: 3 })
  const next = revealCell(state, 0, 0)

  assert.equal(next.phase, 'playing')
  assert.equal(next.grid[0][0], true)
})

test('revealCell on already-revealed cell returns same state', () => {
  let state = makeState({ phase: 'playing' })
  state = revealCell(state, 0, 0)
  const again = revealCell(state, 0, 0)

  assert.equal(again, state)
})

test('revealCell out of bounds returns same state', () => {
  const state = makeState({ phase: 'playing' })
  assert.equal(revealCell(state, -1, 0), state)
  assert.equal(revealCell(state, 0, -1), state)
  assert.equal(revealCell(state, 4, 0), state)
  assert.equal(revealCell(state, 0, 6), state)
})

test('revealCell does not mutate other cells', () => {
  const state = makeState({ phase: 'playing' })
  const next = revealCell(state, 2, 3)

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (r !== 2 || c !== 3) {
        assert.equal(next.grid[r][c], false)
      }
    }
  }
})

test('nextRound resets to meet phase with new target and grid', () => {
  const state = makeState({ phase: 'found' })
  const next = nextRound(state)

  assert.equal(next.phase, 'meet')
  assert.equal(next.round, state.round + 1)
  assert.equal(next.cols, state.cols)
  assert.equal(next.rows, state.rows)
  assert.equal(next.grid.length, state.rows)
  assert.equal(next.grid[0].length, state.cols)
  assert.ok(next.targetRow >= 0 && next.targetRow < next.rows)
  assert.ok(next.targetCol >= 0 && next.targetCol < next.cols)
})

test('nextRound has all cells unrevealed', () => {
  const state = makeState({ phase: 'found' })
  const next = nextRound(state)

  for (const row of next.grid) {
    for (const cell of row) {
      assert.equal(cell, false)
    }
  }
})

test('revealCell on found phase reveals cell but stays found', () => {
  const state = makeState({ phase: 'found', targetRow: 0, targetCol: 0 })
  // Already found — reveal a different cell should still reveal but stay found
  const next = revealCell(state, 1, 1)
  assert.equal(next.phase, 'found')
  assert.equal(next.grid[1][1], true)
})

test('TARGET_POOL has at least 6 entries', () => {
  assert.ok(TARGET_POOL.length >= 6)
})

test('all target pool entries have emoji and name', () => {
  for (const target of TARGET_POOL) {
    assert.ok(typeof target.emoji === 'string' && target.emoji.length > 0)
    assert.ok(typeof target.name === 'string' && target.name.length > 0)
  }
})