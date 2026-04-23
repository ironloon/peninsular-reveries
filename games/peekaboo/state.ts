import {
  type GamePhase,
  type Target,
  TARGET_POOL,
  type PeekabooGrid,
  type PeekabooState,
} from './types.js'

const GRID_COLS = 6
const GRID_ROWS = 4

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function randomTarget(): Target {
  return TARGET_POOL[randomInt(0, TARGET_POOL.length - 1)]
}

function createGrid(rows: number, cols: number, fill: boolean): PeekabooGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill))
}

export function initState(): PeekabooState {
  const target = randomTarget()
  const targetRow = randomInt(0, GRID_ROWS - 1)
  const targetCol = randomInt(0, GRID_COLS - 1)

  return {
    phase: 'meet',
    currentTarget: target,
    targetRow,
    targetCol,
    grid: createGrid(GRID_ROWS, GRID_COLS, false),
    round: 1,
    cols: GRID_COLS,
    rows: GRID_ROWS,
  }
}

const PHASE_SEQUENCE: readonly GamePhase[] = ['meet', 'enter', 'playing']

export function advancePhase(state: PeekabooState): PeekabooState {
  const currentIndex = PHASE_SEQUENCE.indexOf(state.phase)
  if (currentIndex === -1 || currentIndex === PHASE_SEQUENCE.length - 1) {
    return state
  }

  return {
    ...state,
    phase: PHASE_SEQUENCE[currentIndex + 1],
  }
}

export function revealCell(state: PeekabooState, row: number, col: number): PeekabooState {
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) {
    return state
  }

  if (state.grid[row][col]) {
    return state
  }

  const newGrid = state.grid.map((gridRow, rowIndex) =>
    gridRow.map((cell, colIndex) =>
      rowIndex === row && colIndex === col ? true : cell,
    ),
  )

  const foundTarget = row === state.targetRow && col === state.targetCol

  return {
    ...state,
    phase: foundTarget ? 'found' : state.phase,
    grid: newGrid,
  }
}

export function nextRound(state: PeekabooState): PeekabooState {
  const target = randomTarget()
  const targetRow = randomInt(0, GRID_ROWS - 1)
  const targetCol = randomInt(0, GRID_COLS - 1)

  return {
    ...state,
    phase: 'meet',
    currentTarget: target,
    targetRow,
    targetCol,
    grid: createGrid(GRID_ROWS, GRID_COLS, false),
    round: state.round + 1,
  }
}