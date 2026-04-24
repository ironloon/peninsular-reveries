import assert from 'node:assert/strict'
import test from 'node:test'
import { TARGET_POOL, type PeekabooState } from './types.js'
import { initState, advancePhase, revealCell, peekBehind, nextRound } from './state.js'

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

test('initState has scenery at the target cell with hasTarget true', () => {
  const state = initState()
  const sceneryCell = state.scenery[state.targetRow][state.targetCol]
  assert.ok(sceneryCell !== null)
  assert.equal(sceneryCell.hasTarget, true)
})

test('initState has no other cells with hasTarget true', () => {
  const state = initState()
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (r === state.targetRow && c === state.targetCol) continue
      const cell = state.scenery[r][c]
      if (cell !== null) {
        assert.equal(cell.hasTarget, false, `Cell (${r},${c}) should not have target`)
      }
    }
  }
})

test('initState peeked grid is all false', () => {
  const state = initState()
  for (const row of state.peeked) {
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

test('revealCell does not transition to found', () => {
  const state = makeState({ phase: 'playing' })
  const next = revealCell(state, state.targetRow, state.targetCol)

  assert.equal(next.phase, 'playing')
  assert.equal(next.grid[state.targetRow][state.targetCol], true)
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

test('peekBehind on revealed cell with target scenery transitions to found', () => {
  const state = makeState({ phase: 'playing' })
  // Reveal the target cell first
  const revealed = revealCell(state, state.targetRow, state.targetCol)
  const next = peekBehind(revealed, state.targetRow, state.targetCol)

  assert.equal(next.phase, 'found')
  assert.equal(next.peeked[state.targetRow][state.targetCol], true)
})

test('peekBehind on revealed cell with non-target scenery stays playing', () => {
  const state = makeState({ phase: 'playing' })
  // Find a cell with scenery but no target
  let testRow = -1
  let testCol = -1
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = state.scenery[r][c]
      if (cell !== null && !cell.hasTarget) {
        testRow = r
        testCol = c
        break
      }
    }
    if (testRow >= 0) break
  }
  assert.ok(testRow >= 0, 'Should find a non-target scenery cell')

  const revealed = revealCell(state, testRow, testCol)
  const next = peekBehind(revealed, testRow, testCol)

  assert.equal(next.phase, 'playing')
  assert.equal(next.peeked[testRow][testCol], true)
})

test('peekBehind on unrevealed cell returns same state', () => {
  const state = makeState({ phase: 'playing' })
  const next = peekBehind(state, 0, 0)
  assert.equal(next, state)
})

test('peekBehind on cell without scenery returns same state', () => {
  const state = makeState({ phase: 'playing' })
  // Find a cell without scenery
  let emptyRow = -1
  let emptyCol = -1
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (state.scenery[r][c] === null) {
        emptyRow = r
        emptyCol = c
        break
      }
    }
    if (emptyRow >= 0) break
  }
  if (emptyRow < 0) return // all cells have scenery, skip

  const revealed = revealCell(state, emptyRow, emptyCol)
  const next = peekBehind(revealed, emptyRow, emptyCol)
  assert.equal(next, revealed)
})

test('peekBehind on already-peeked cell returns same state', () => {
  const state = makeState({ phase: 'playing' })
  const revealed = revealCell(state, state.targetRow, state.targetCol)
  const peeked = peekBehind(revealed, state.targetRow, state.targetCol)
  const again = peekBehind(peeked, state.targetRow, state.targetCol)
  assert.equal(again, peeked)
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
  // Scenery should have target at the new position
  const newScenery = next.scenery[next.targetRow][next.targetCol]
  assert.ok(newScenery !== null)
  assert.equal(newScenery.hasTarget, true)
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

test('nextRound has fresh peeked grid', () => {
  const state = makeState({ phase: 'found' })
  const next = nextRound(state)

  for (const row of next.peeked) {
    for (const cell of row) {
      assert.equal(cell, false)
    }
  }
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