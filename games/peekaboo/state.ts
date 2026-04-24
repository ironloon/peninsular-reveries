import {
  type GamePhase,
  type Target,
  TARGET_POOL,
  SCENE_SCENERY,
  type PeekabooGrid,
  type SceneryGrid,
  type SceneryCell,
  type PeekedGrid,
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

function createSceneryGrid(rows: number, cols: number, targetRow: number, targetCol: number): SceneryGrid {
  const grid: (SceneryCell | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  )

  // Always place scenery at the target cell with hasTarget: true
  const targetSceneryEmoji = SCENE_SCENERY[randomInt(0, SCENE_SCENERY.length - 1)]
  grid[targetRow][targetCol] = { emoji: targetSceneryEmoji, hasTarget: true }

  const occupied = new Set<string>()
  occupied.add(`${targetRow},${targetCol}`)

  // Place up to 12 additional decorative scenery items
  const maxScenery = Math.min(rows * cols - 1, 13)
  const count = randomInt(8, maxScenery)
  for (let i = 0; i < count; i++) {
    let row: number
    let col: number
    let key: string
    do {
      row = randomInt(0, rows - 1)
      col = randomInt(0, cols - 1)
      key = `${row},${col}`
    } while (occupied.has(key))
    occupied.add(key)

    grid[row][col] = {
      emoji: SCENE_SCENERY[randomInt(0, SCENE_SCENERY.length - 1)],
      hasTarget: false,
    }
  }

  return grid
}

function createPeekedGrid(rows: number, cols: number): PeekedGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
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
    scenery: createSceneryGrid(GRID_ROWS, GRID_COLS, targetRow, targetCol),
    peeked: createPeekedGrid(GRID_ROWS, GRID_COLS),
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

  return {
    ...state,
    grid: newGrid,
  }
}

export function peekBehind(state: PeekabooState, row: number, col: number): PeekabooState {
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) {
    return state
  }

  if (state.phase !== 'playing') {
    return state
  }

  if (!state.grid[row][col]) {
    return state
  }

  const sceneryCell = state.scenery[row][col]
  if (sceneryCell === null) {
    return state
  }

  if (state.peeked[row][col]) {
    return state
  }

  const newPeeked = state.peeked.map((peekedRow, rowIndex) =>
    peekedRow.map((cell, colIndex) =>
      rowIndex === row && colIndex === col ? true : cell,
    ),
  )

  const found = sceneryCell.hasTarget

  return {
    ...state,
    phase: found ? 'found' : state.phase,
    peeked: newPeeked,
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
    scenery: createSceneryGrid(GRID_ROWS, GRID_COLS, targetRow, targetCol),
    peeked: createPeekedGrid(GRID_ROWS, GRID_COLS),
    round: state.round + 1,
  }
}