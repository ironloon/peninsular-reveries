import {
  SQUARES_BOARD_SIZE,
  SQUARES_MODES,
  SQUARES_PATTERN_IDS,
  type SquaresBoard,
  type SquaresCellValue,
  type SquaresCoordinate,
  type SquaresHighScoreKey,
  type SquaresModeDefinition,
  type SquaresModeId,
  type SquaresPatternId,
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

const SCRAMBLE_MIN_1X1 = 3
const SCRAMBLE_MAX_1X1 = 5
const SCRAMBLE_MIN_PLUS_X = 3
const SCRAMBLE_MAX_PLUS_X = 4

function cloneCoordinate(coordinate: SquaresCoordinate): SquaresCoordinate {
  return { row: coordinate.row, column: coordinate.column }
}

function cloneBoard(board: SquaresBoard): SquaresBoard {
  return board.map((row) => [...row])
}

function getModeDefinition(modeId: SquaresModeId): SquaresModeDefinition {
  const mode = SQUARES_MODES.find((candidate) => candidate.id === modeId)
  if (!mode) {
    throw new Error(`Unknown Squares mode: ${modeId}`)
  }
  return mode
}

function toggleCellValue(cellValue: SquaresCellValue): SquaresCellValue {
  return cellValue === 'light' ? 'dark' : 'light'
}

function isCoordinateInBounds(board: SquaresBoard, coordinate: SquaresCoordinate): boolean {
  const row = board[coordinate.row]
  return Boolean(row) && coordinate.column >= 0 && coordinate.column < row.length
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function createSolvedBoard(size: number = SQUARES_BOARD_SIZE, cellValue: SquaresCellValue = 'light'): SquaresBoard {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => cellValue))
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

export function toggleSingleCell(board: SquaresBoard, coordinate: SquaresCoordinate): SquaresBoard {
  if (!isCoordinateInBounds(board, coordinate)) {
    return board
  }

  return board.map((row, rowIndex) =>
    row.map((cellValue, columnIndex) =>
      rowIndex === coordinate.row && columnIndex === coordinate.column ? toggleCellValue(cellValue) : cellValue,
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

export function generateRandomBoard(modeId: SquaresModeId): SquaresBoard {
  const size = SQUARES_BOARD_SIZE

  if (modeId === '1x1') {
    const allCoordinates: SquaresCoordinate[] = []
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        allCoordinates.push({ row, column: col })
      }
    }

    let board: SquaresBoard
    do {
      const count = randomInt(SCRAMBLE_MIN_1X1, SCRAMBLE_MAX_1X1)
      const shuffled = [...allCoordinates].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, count)
      board = createSolvedBoard(size)
      for (const coord of selected) {
        board = toggleSingleCell(board, coord)
      }
    } while (isSolvedBoard(board))

    return board
  }

  let board: SquaresBoard
  do {
    const count = randomInt(SCRAMBLE_MIN_PLUS_X, SCRAMBLE_MAX_PLUS_X)
    board = createSolvedBoard(size)
    for (let i = 0; i < count; i++) {
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)
      const patternId = SQUARES_PATTERN_IDS[Math.floor(Math.random() * SQUARES_PATTERN_IDS.length)]
      board = applyPatternToBoard(board, { row, column: col }, patternId)
    }
  } while (isSolvedBoard(board))

  return board
}

export function createInitialState(modeId: SquaresModeId = 'plus-x'): SquaresState {
  void getModeDefinition(modeId)
  const board = generateRandomBoard(modeId)
  const startingBoard = cloneBoard(board)

  return {
    phase: 'ready',
    modeId,
    board: cloneBoard(board),
    startingBoard,
    activePatternId: 'plus',
    moveCount: 0,
    lastMove: null,
  }
}

export function setActivePattern(state: SquaresState, patternId: SquaresPatternId): SquaresState {
  if (state.modeId === '1x1') {
    return state
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
  if (state.modeId === '1x1') {
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

  let nextBoard: SquaresBoard
  let movePatternId: SquaresPatternId | null

  if (state.modeId === '1x1') {
    nextBoard = toggleSingleCell(state.board, coordinate)
    movePatternId = null
  } else {
    movePatternId = state.activePatternId
    nextBoard = applyPatternToBoard(state.board, coordinate, movePatternId)
  }

  if (nextBoard === state.board) {
    return state
  }

  return {
    ...state,
    phase: isSolvedBoard(nextBoard) ? 'solved' : 'playing',
    board: nextBoard,
    moveCount: state.moveCount + 1,
    lastMove: {
      coordinate: cloneCoordinate(coordinate),
      patternId: movePatternId,
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
    activePatternId: 'plus',
    moveCount: 0,
    lastMove: null,
  }
}

export function getHighScoreKey(modeId: SquaresModeId): SquaresHighScoreKey {
  return modeId === '1x1' ? 'squares-high-1x1' : 'squares-high-plusx'
}

export function getModeLabel(modeId: SquaresModeId): string {
  return getModeDefinition(modeId).label
}