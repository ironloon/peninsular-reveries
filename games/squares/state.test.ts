import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SQUARES_BOARD_PRESETS,
  type SquaresBoard,
  type SquaresCoordinate,
  type SquaresPatternId,
  type SquaresRulesetId,
} from './types.js'
import {
  applyMove,
  applyPatternToBoard,
  buildBoardFromPreset,
  createInitialState,
  createSolvedBoard,
  getActiveHighScoreBucketKey,
  getAffectedCells,
  getHighScoreBucketKey,
  isSolvedBoard,
  restartState,
  setActivePattern,
  toggleActivePattern,
} from './state.js'

function boardFor(rows: number, columns: number, fill: 'light' | 'dark' = 'light'): SquaresBoard {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => fill))
}

function coordinateKey(coordinate: SquaresCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`
}

function applyMovesFromSolved(
  presetId: typeof SQUARES_BOARD_PRESETS[number]['id'],
  moves: readonly { coordinate: SquaresCoordinate; patternId: SquaresPatternId }[],
): SquaresBoard {
  const preset = SQUARES_BOARD_PRESETS.find((candidate) => candidate.id === presetId)
  assert.ok(preset, `missing preset ${presetId}`)

  let board = createSolvedBoard(preset)
  for (const move of moves) {
    board = applyPatternToBoard(board, move.coordinate, move.patternId)
  }

  return board
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

test('classic hybrid mode can switch patterns during play', () => {
  const initialState = createInitialState('pocket-3x3', 'classic-hybrid')
  const switchedState = setActivePattern(initialState, 'x')
  const movedState = applyMove(switchedState, { row: 1, column: 1 })

  assert.equal(initialState.activePatternId, 'plus')
  assert.equal(switchedState.activePatternId, 'x')
  assert.equal(movedState.lastMove?.patternId, 'x')
  assert.equal(toggleActivePattern(switchedState).activePatternId, 'plus')
})

test('easy modes keep their pattern locked', () => {
  const easyPlusState = createInitialState('pocket-3x3', 'easy-plus')
  const easyXState = createInitialState('pocket-3x3', 'easy-x')

  assert.equal(easyPlusState.lockedPatternId, 'plus')
  assert.equal(setActivePattern(easyPlusState, 'x').activePatternId, 'plus')
  assert.equal(toggleActivePattern(easyPlusState).activePatternId, 'plus')

  assert.equal(easyXState.lockedPatternId, 'x')
  assert.equal(setActivePattern(easyXState, 'plus').activePatternId, 'x')
  assert.equal(toggleActivePattern(easyXState).activePatternId, 'x')
})

test('restart restores the original scramble instead of generating a fresh board', () => {
  const initialState = createInitialState('courtyard-4x4', 'classic-hybrid')
  const changedState = applyMove(setActivePattern(initialState, 'x'), { row: 1, column: 1 })
  const restartedState = restartState(changedState)

  assert.deepEqual(restartedState.board, initialState.startingBoard)
  assert.equal(restartedState.moveCount, 0)
  assert.equal(restartedState.lastMove, null)
  assert.equal(restartedState.activePatternId, 'plus')
  assert.notDeepEqual(changedState.board, restartedState.board)
})

test('easy reverse scrambles are built from legal locked-pattern moves', () => {
  const presetId: typeof SQUARES_BOARD_PRESETS[number]['id'] = 'garden-5x5'
  const rulesets: readonly SquaresRulesetId[] = ['easy-plus', 'easy-x']

  for (const rulesetId of rulesets) {
    const { board, scramblePlan } = buildBoardFromPreset(presetId, rulesetId)
    const expectedPatternId: SquaresPatternId = rulesetId === 'easy-plus' ? 'plus' : 'x'

    assert.ok(scramblePlan.length > 0)
    assert.ok(scramblePlan.every((move) => move.patternId === expectedPatternId))
    assert.deepEqual(board, applyMovesFromSolved(presetId, scramblePlan))
    assert.equal(isSolvedBoard(board), false)
  }
})

test('high-score buckets stay separate for each ruleset on the same preset', () => {
  const presetId: typeof SQUARES_BOARD_PRESETS[number]['id'] = 'pocket-3x3'
  const classicKey = getHighScoreBucketKey(presetId, 'classic-hybrid')
  const easyPlusKey = getHighScoreBucketKey(presetId, 'easy-plus')
  const easyXKey = getHighScoreBucketKey(presetId, 'easy-x')

  assert.notEqual(classicKey, easyPlusKey)
  assert.notEqual(classicKey, easyXKey)
  assert.notEqual(easyPlusKey, easyXKey)
  assert.equal(getActiveHighScoreBucketKey(createInitialState(presetId, 'easy-plus')), easyPlusKey)
})