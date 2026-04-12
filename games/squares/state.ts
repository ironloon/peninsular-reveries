import {
  SQUARES_BOARD_PRESETS,
  SQUARES_RULESETS,
  type SquaresBoard,
  type SquaresBoardPreset,
  type SquaresBoardPresetId,
  type SquaresCellValue,
  type SquaresCoordinate,
  type SquaresHighScoreBucketKey,
  type SquaresPatternId,
  type SquaresPatternMove,
  type SquaresRulesetDefinition,
  type SquaresRulesetId,
  type SquaresState,
} from './types.js'

interface PatternOffset {
  readonly row: number
  readonly column: number
}

const PATTERN_OFFSETS: Readonly<Record<SquaresPatternId, readonly PatternOffset[]>> = {
  plus: [
    { row: 0, column: 0 },
    { row: -1, column: 0 },
    { row: 1, column: 0 },
    { row: 0, column: -1 },
    { row: 0, column: 1 },
  ],
  x: [
    { row: 0, column: 0 },
    { row: -1, column: -1 },
    { row: -1, column: 1 },
    { row: 1, column: -1 },
    { row: 1, column: 1 },
  ],
}

function cloneCoordinate(coordinate: SquaresCoordinate): SquaresCoordinate {
  return {
    row: coordinate.row,
    column: coordinate.column,
  }
}

function clonePatternMove(move: SquaresPatternMove): SquaresPatternMove {
  return {
    coordinate: cloneCoordinate(move.coordinate),
    patternId: move.patternId,
  }
}

function cloneBoard(board: SquaresBoard): SquaresBoard {
  return board.map((row) => [...row])
}

function getBoardPresetDefinition(presetId: SquaresBoardPresetId): SquaresBoardPreset {
  const preset = SQUARES_BOARD_PRESETS.find((candidate) => candidate.id === presetId)

  if (!preset) {
    throw new Error(`Unknown Squares board preset: ${presetId}`)
  }

  return preset
}

function getRulesetDefinition(rulesetId: SquaresRulesetId): SquaresRulesetDefinition {
  const ruleset = SQUARES_RULESETS.find((candidate) => candidate.id === rulesetId)

  if (!ruleset) {
    throw new Error(`Unknown Squares ruleset: ${rulesetId}`)
  }

  return ruleset
}

function toggleCellValue(cellValue: SquaresCellValue): SquaresCellValue {
  return cellValue === 'light' ? 'dark' : 'light'
}

function isCoordinateInBounds(board: SquaresBoard, coordinate: SquaresCoordinate): boolean {
  const row = board[coordinate.row]
  return Boolean(row) && coordinate.column >= 0 && coordinate.column < row.length
}

function getDefaultPatternId(rulesetId: SquaresRulesetId): SquaresPatternId {
  return getRulesetDefinition(rulesetId).lockedPatternId ?? 'plus'
}

export function createSolvedBoard(preset: SquaresBoardPreset, cellValue: SquaresCellValue = 'light'): SquaresBoard {
  return Array.from({ length: preset.rows }, () => Array.from({ length: preset.columns }, () => cellValue))
}

export function getAffectedCells(
  board: SquaresBoard,
  coordinate: SquaresCoordinate,
  patternId: SquaresPatternId,
): readonly SquaresCoordinate[] {
  if (!isCoordinateInBounds(board, coordinate)) {
    return []
  }

  const affectedCells: SquaresCoordinate[] = []
  const seenCoordinates = new Set<string>()

  for (const offset of PATTERN_OFFSETS[patternId]) {
    const nextCoordinate = {
      row: coordinate.row + offset.row,
      column: coordinate.column + offset.column,
    }

    if (!isCoordinateInBounds(board, nextCoordinate)) {
      continue
    }

    const key = `${nextCoordinate.row}:${nextCoordinate.column}`
    if (seenCoordinates.has(key)) {
      continue
    }

    seenCoordinates.add(key)
    affectedCells.push(nextCoordinate)
  }

  return affectedCells
}

export function applyPatternToBoard(
  board: SquaresBoard,
  coordinate: SquaresCoordinate,
  patternId: SquaresPatternId,
): SquaresBoard {
  const affectedCells = getAffectedCells(board, coordinate, patternId)

  if (affectedCells.length === 0) {
    return board
  }

  const affectedKeys = new Set(affectedCells.map((cell) => `${cell.row}:${cell.column}`))

  return board.map((row, rowIndex) =>
    row.map((cellValue, columnIndex) =>
      affectedKeys.has(`${rowIndex}:${columnIndex}`) ? toggleCellValue(cellValue) : cellValue,
    ),
  )
}

export function isSolvedBoard(board: SquaresBoard): boolean {
  if (board.length === 0 || board[0]?.length === 0) {
    return false
  }

  const firstCellValue = board[0][0]
  return board.every((row) => row.every((cellValue) => cellValue === firstCellValue))
}

export function buildBoardFromPreset(
  presetId: SquaresBoardPresetId,
  rulesetId: SquaresRulesetId,
): {
  readonly board: SquaresBoard
  readonly scramblePlan: readonly SquaresPatternMove[]
} {
  const preset = getBoardPresetDefinition(presetId)
  const scramblePlan = preset.scramblePlans[rulesetId].map(clonePatternMove)

  let board = createSolvedBoard(preset)
  for (const move of scramblePlan) {
    board = applyPatternToBoard(board, move.coordinate, move.patternId)
  }

  return {
    board,
    scramblePlan,
  }
}

export function createInitialState(
  presetId: SquaresBoardPresetId = SQUARES_BOARD_PRESETS[0].id,
  rulesetId: SquaresRulesetId = getBoardPresetDefinition(presetId).recommendedRulesetId,
): SquaresState {
  const ruleset = getRulesetDefinition(rulesetId)
  const { board, scramblePlan } = buildBoardFromPreset(presetId, rulesetId)
  const startingBoard = cloneBoard(board)

  return {
    phase: isSolvedBoard(board) ? 'solved' : 'ready',
    presetId,
    rulesetId,
    board: cloneBoard(board),
    startingBoard,
    scramblePlan,
    activePatternId: getDefaultPatternId(rulesetId),
    lockedPatternId: ruleset.lockedPatternId,
    moveCount: 0,
    lastMove: null,
  }
}

export function setActivePattern(state: SquaresState, patternId: SquaresPatternId): SquaresState {
  if (state.lockedPatternId !== null) {
    if (state.activePatternId === state.lockedPatternId) {
      return state
    }

    return {
      ...state,
      activePatternId: state.lockedPatternId,
    }
  }

  if (state.activePatternId === patternId) {
    return state
  }

  return {
    ...state,
    activePatternId: patternId,
  }
}

export function toggleActivePattern(state: SquaresState): SquaresState {
  if (state.lockedPatternId !== null) {
    return state
  }

  return {
    ...state,
    activePatternId: state.activePatternId === 'plus' ? 'x' : 'plus',
  }
}

export function applyMove(state: SquaresState, coordinate: SquaresCoordinate): SquaresState {
  if (state.phase === 'solved') {
    return state
  }

  const patternId = state.lockedPatternId ?? state.activePatternId
  const nextBoard = applyPatternToBoard(state.board, coordinate, patternId)

  if (nextBoard === state.board) {
    return state
  }

  return {
    ...state,
    phase: isSolvedBoard(nextBoard) ? 'solved' : 'playing',
    board: nextBoard,
    activePatternId: patternId,
    moveCount: state.moveCount + 1,
    lastMove: {
      coordinate: cloneCoordinate(coordinate),
      patternId,
    },
  }
}

export function restartState(state: SquaresState): SquaresState {
  const startingBoard = cloneBoard(state.startingBoard)

  return {
    ...state,
    phase: isSolvedBoard(startingBoard) ? 'solved' : 'ready',
    board: startingBoard,
    startingBoard: cloneBoard(state.startingBoard),
    activePatternId: getDefaultPatternId(state.rulesetId),
    moveCount: 0,
    lastMove: null,
  }
}

export function getHighScoreBucketKey(
  presetId: SquaresBoardPresetId,
  rulesetId: SquaresRulesetId,
): SquaresHighScoreBucketKey {
  return `squares:${presetId}:${rulesetId}`
}

export function getActiveHighScoreBucketKey(state: SquaresState): SquaresHighScoreBucketKey {
  return getHighScoreBucketKey(state.presetId, state.rulesetId)
}