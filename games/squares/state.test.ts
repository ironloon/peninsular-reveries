import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARES_BOARD_SIZE,
  SQUARES_MODES,
  type SquaresBoard,
  type SquaresCoordinate,
  type SquaresModeId,
} from './types.js'
import {
  applyMove,
  applyPatternToBoard,
  createInitialState,
  createSolvedBoard,
  generateRandomBoard,
  getAffectedCells,
  getHighScoreKey,
  getModeLabel,
  isSolvedBoard,
  restartState,
  setActivePattern,
  toggleActivePattern,
  toggleSingleCell,
} from './state.js'

function boardFor(rows: number, columns: number, fill: 'light' | 'dark' = 'light'): SquaresBoard {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => fill))
}

function coordinateKey(coordinate: SquaresCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`
}

test('plus pattern toggles the center and orthogonal neighbors', () => {
  const board = boardFor(3, 3)

  assert.deepEqual(applyPatternToBoard(board, { row: 1, column: 1 }, 'plus'), [
    ['light', 'dark', 'light'],
    ['dark', 'dark', 'dark'],
    ['light', 'dark', 'light'],
  ])
})

test('x pattern toggles the center and diagonal neighbors', () => {
  const board = boardFor(3, 3)

  assert.deepEqual(applyPatternToBoard(board, { row: 1, column: 1 }, 'x'), [
    ['dark', 'light', 'dark'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
  ])
})

test('plus pattern clips cleanly at corners', () => {
  const board = boardFor(3, 3)
  const affected = getAffectedCells(board, { row: 0, column: 0 }, 'plus').map(coordinateKey)

  assert.deepEqual(affected, ['0:0', '1:0', '0:1'])
})

test('x pattern clips cleanly at edges', () => {
  const board = boardFor(3, 3)
  const affected = getAffectedCells(board, { row: 0, column: 1 }, 'x').map(coordinateKey)

  assert.deepEqual(affected, ['0:1', '1:0', '1:2'])
})

test('solved detection accepts all-light and all-dark boards', () => {
  assert.equal(isSolvedBoard(boardFor(2, 2, 'light')), true)
  assert.equal(isSolvedBoard(boardFor(2, 2, 'dark')), true)
  assert.equal(
    isSolvedBoard([
      ['light', 'dark'],
      ['dark', 'light'],
    ]),
    false,
  )
})

test('toggleSingleCell toggles only the targeted cell', () => {
  const board = boardFor(3, 3)
  const result = toggleSingleCell(board, { row: 1, column: 1 })
  assert.deepEqual(result, [
    ['light', 'light', 'light'],
    ['light', 'dark', 'light'],
    ['light', 'light', 'light'],
  ])
})

test('toggleSingleCell returns same board for out-of-bounds coordinate', () => {
  const board = boardFor(3, 3)
  assert.equal(toggleSingleCell(board, { row: 5, column: 5 }), board)
})

test('plus-x mode allows pattern switching during play', () => {
  const initialState = createInitialState('plus-x')
  const switchedState = setActivePattern(initialState, 'x')
  const movedState = applyMove(switchedState, { row: 1, column: 1 })

  assert.equal(initialState.activePatternId, 'plus')
  assert.equal(switchedState.activePatternId, 'x')
  assert.equal(movedState.lastMove?.patternId, 'x')
  assert.equal(toggleActivePattern(switchedState).activePatternId, 'plus')
})

test('1x1 mode ignores pattern toggle attempts', () => {
  const state = createInitialState('1x1')
  assert.equal(setActivePattern(state, 'x').activePatternId, 'plus')
  assert.equal(toggleActivePattern(state).activePatternId, 'plus')
})

test('1x1 mode moves record null pattern', () => {
  const state = createInitialState('1x1')
  const movedState = applyMove(state, { row: 0, column: 0 })
  assert.equal(movedState.lastMove?.patternId, null)
  assert.equal(movedState.moveCount, 1)
})

test('generateRandomBoard produces a non-solved 3x3 board for both modes', () => {
  const modes: SquaresModeId[] = ['1x1', 'plus-x']
  for (const modeId of modes) {
    const board = generateRandomBoard(modeId)
    assert.equal(board.length, SQUARES_BOARD_SIZE)
    assert.equal(board[0].length, SQUARES_BOARD_SIZE)
    assert.equal(isSolvedBoard(board), false)
  }
})

test('restart restores the starting board', () => {
  const initialState = createInitialState('plus-x')
  const movedState = applyMove(setActivePattern(initialState, 'x'), { row: 1, column: 1 })
  const restartedState = restartState(movedState)

  assert.deepEqual(restartedState.board, initialState.startingBoard)
  assert.equal(restartedState.moveCount, 0)
  assert.equal(restartedState.lastMove, null)
  assert.equal(restartedState.activePatternId, 'plus')
  assert.notDeepEqual(movedState.board, restartedState.board)
})

test('high-score keys are separate for each mode', () => {
  const key1x1 = getHighScoreKey('1x1')
  const keyPlusX = getHighScoreKey('plus-x')
  assert.notEqual(key1x1, keyPlusX)
  assert.equal(key1x1, 'squares-high-1x1')
  assert.equal(keyPlusX, 'squares-high-plusx')
})

test('mode labels are human-readable', () => {
  assert.equal(getModeLabel('1x1'), '1\u00d71')
  assert.equal(getModeLabel('plus-x'), '+/\u00d7')
})

test('createSolvedBoard produces a uniform board of the specified size', () => {
  const board = createSolvedBoard(3)
  assert.equal(board.length, 3)
  assert.equal(board[0].length, 3)
  assert.equal(isSolvedBoard(board), true)
})

test('createInitialState defaults to plus-x mode', () => {
  const state = createInitialState()
  assert.equal(state.modeId, 'plus-x')
  assert.equal(state.phase, 'ready')
  assert.equal(isSolvedBoard(state.board), false)
})

test('applyMove does not advance a solved game', () => {
  const state = createInitialState('1x1')
  const solvedState = { ...state, phase: 'solved' as const }
  assert.equal(applyMove(solvedState, { row: 0, column: 0 }), solvedState)
})

test('board size is 3 and exactly two modes exist', () => {
  assert.equal(SQUARES_BOARD_SIZE, 3)
  assert.equal(SQUARES_MODES.length, 2)
  assert.deepEqual(SQUARES_MODES.map(m => m.id), ['1x1', 'plus-x'])
})