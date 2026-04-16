import {
  computeMaxBarriers,
  type WaterwallCellType,
  type WaterwallCoordinate,
  type WaterwallGrid,
} from './types.js'

function cloneCells(cells: readonly (readonly WaterwallCellType[])[]): WaterwallCellType[][] {
  return cells.map((row) => [...row])
}

export function createGrid(rows: number, columns: number): WaterwallGrid {
  const cells: WaterwallCellType[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => 'empty' as WaterwallCellType),
  )

  return {
    rows,
    columns,
    cells,
    barrierCount: 0,
    maxBarriers: computeMaxBarriers(columns),
    barrierOrder: [],
  }
}

export function spawnWater(grid: WaterwallGrid): WaterwallGrid {
  const nextCells = cloneCells(grid.cells)

  if (grid.rows === 0) {
    return grid
  }

  for (let col = 0; col < grid.columns; col++) {
    if (nextCells[0][col] === 'empty') {
      nextCells[0][col] = 'water'
    }
  }

  return {
    ...grid,
    cells: nextCells,
  }
}

function isSolid(grid: WaterwallGrid, row: number, col: number): boolean {
  if (row < 0 || row >= grid.rows || col < 0 || col >= grid.columns) {
    return true
  }
  return grid.cells[row][col] === 'barrier'
}

function isEmpty(cells: WaterwallCellType[][], row: number, col: number, grid: WaterwallGrid): boolean {
  if (row < 0 || row >= grid.rows || col < 0 || col >= grid.columns) {
    return false
  }
  return cells[row][col] === 'empty'
}

export function simulateTick(grid: WaterwallGrid): WaterwallGrid {
  const nextCells = cloneCells(grid.cells)
  // Track cells that received water this tick so they aren't re-processed
  const settled: boolean[][] = Array.from({ length: grid.rows }, () =>
    Array.from({ length: grid.columns }, () => false),
  )

  // Drain bottom row first
  if (grid.rows > 0) {
    const bottomRow = grid.rows - 1
    for (let col = 0; col < grid.columns; col++) {
      if (nextCells[bottomRow][col] === 'water') {
        nextCells[bottomRow][col] = 'empty'
      }
    }
  }

  // Scan bottom-to-top (skip bottom row since it's already drained)
  for (let row = grid.rows - 2; row >= 0; row--) {
    for (let col = 0; col < grid.columns; col++) {
      if (nextCells[row][col] !== 'water' || settled[row][col]) {
        continue
      }

      const below = row + 1

      // Try directly below
      if (isEmpty(nextCells, below, col, grid) && !isSolid(grid, below, col)) {
        nextCells[below][col] = 'water'
        nextCells[row][col] = 'empty'
        settled[below][col] = true
        continue
      }

      // Try diagonal below-left / below-right with random tie-breaking
      const leftFirst = Math.random() < 0.5
      const diag1Col = leftFirst ? col - 1 : col + 1
      const diag2Col = leftFirst ? col + 1 : col - 1

      if (isEmpty(nextCells, below, diag1Col, grid) && !isSolid(grid, below, diag1Col)) {
        nextCells[below][diag1Col] = 'water'
        nextCells[row][col] = 'empty'
        settled[below][diag1Col] = true
        continue
      }

      if (isEmpty(nextCells, below, diag2Col, grid) && !isSolid(grid, below, diag2Col)) {
        nextCells[below][diag2Col] = 'water'
        nextCells[row][col] = 'empty'
        settled[below][diag2Col] = true
        continue
      }

      // Lateral spread when pooled (blocked below and diagonally)
      const lat1Col = leftFirst ? col - 1 : col + 1
      const lat2Col = leftFirst ? col + 1 : col - 1

      if (isEmpty(nextCells, row, lat1Col, grid) && !isSolid(grid, row, lat1Col)) {
        nextCells[row][lat1Col] = 'water'
        nextCells[row][col] = 'empty'
        settled[row][lat1Col] = true
        continue
      }

      if (isEmpty(nextCells, row, lat2Col, grid) && !isSolid(grid, row, lat2Col)) {
        nextCells[row][lat2Col] = 'water'
        nextCells[row][col] = 'empty'
        settled[row][lat2Col] = true
        continue
      }
    }
  }

  return {
    ...grid,
    cells: nextCells,
  }
}

export function placeBarrier(grid: WaterwallGrid, coordinate: WaterwallCoordinate): WaterwallGrid {
  const { row, column } = coordinate

  if (row < 0 || row >= grid.rows || column < 0 || column >= grid.columns) {
    return grid
  }

  if (grid.cells[row][column] === 'barrier') {
    return grid
  }

  const nextCells = cloneCells(grid.cells)
  const nextOrder = [...grid.barrierOrder, { row, column }]
  let nextCount = grid.barrierCount + 1

  // FIFO eviction: when at budget, remove the oldest barrier before placing
  if (grid.barrierCount >= grid.maxBarriers) {
    const oldest = grid.barrierOrder[0]
    if (oldest) {
      nextCells[oldest.row][oldest.column] = 'empty'
      nextOrder.shift()
      nextCount = grid.barrierCount // net zero: evict one, place one
    }
  }

  nextCells[row][column] = 'barrier'

  return {
    ...grid,
    cells: nextCells,
    barrierCount: nextCount,
    barrierOrder: nextOrder,
  }
}

export function removeBarrier(grid: WaterwallGrid, coordinate: WaterwallCoordinate): WaterwallGrid {
  const { row, column } = coordinate

  if (row < 0 || row >= grid.rows || column < 0 || column >= grid.columns) {
    return grid
  }

  if (grid.cells[row][column] !== 'barrier') {
    return grid
  }

  const nextCells = cloneCells(grid.cells)
  nextCells[row][column] = 'empty'
  const nextOrder = grid.barrierOrder.filter(
    (c) => !(c.row === row && c.column === column),
  )

  return {
    ...grid,
    cells: nextCells,
    barrierCount: grid.barrierCount - 1,
    barrierOrder: nextOrder,
  }
}

export function bresenhamLine(from: WaterwallCoordinate, to: WaterwallCoordinate): WaterwallCoordinate[] {
  const coordinates: WaterwallCoordinate[] = []

  let x0 = from.column
  let y0 = from.row
  const x1 = to.column
  const y1 = to.row

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    coordinates.push({ row: y0, column: x0 })

    if (x0 === x1 && y0 === y1) {
      break
    }

    const e2 = 2 * err

    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }

    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }

  return coordinates
}

export function placeBarrierLine(
  grid: WaterwallGrid,
  from: WaterwallCoordinate,
  to: WaterwallCoordinate,
): { readonly grid: WaterwallGrid; readonly placed: readonly WaterwallCoordinate[] } {
  const lineCoordinates = bresenhamLine(from, to)
  const placed: WaterwallCoordinate[] = []
  let currentGrid = grid

  for (const coordinate of lineCoordinates) {
    const nextGrid = placeBarrier(currentGrid, coordinate)
    if (nextGrid !== currentGrid) {
      placed.push(coordinate)
      currentGrid = nextGrid
    }
  }

  return { grid: currentGrid, placed }
}

export function clearAllBarriers(grid: WaterwallGrid): WaterwallGrid {
  const nextCells = grid.cells.map((row) =>
    row.map((cell) => (cell === 'barrier' ? 'empty' as WaterwallCellType : cell)),
  )

  return {
    ...grid,
    cells: nextCells,
    barrierCount: 0,
    barrierOrder: [],
  }
}

export function computeWaterDistribution(grid: WaterwallGrid): {
  readonly leftFraction: number
  readonly rightFraction: number
  readonly centerOfMass: number
} {
  let totalWater = 0
  let weightedColumnSum = 0

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.columns; col++) {
      if (grid.cells[row][col] === 'water') {
        totalWater++
        weightedColumnSum += col
      }
    }
  }

  if (totalWater === 0 || grid.columns <= 1) {
    return { leftFraction: 0, rightFraction: 0, centerOfMass: 0 }
  }

  // Map average column position to [-1, 1] range
  const averageColumn = weightedColumnSum / totalWater
  const midpoint = (grid.columns - 1) / 2
  const centerOfMass = (averageColumn - midpoint) / midpoint

  const leftFraction = Math.max(0, -centerOfMass)
  const rightFraction = Math.max(0, centerOfMass)

  return { leftFraction, rightFraction, centerOfMass }
}

export function resizeGrid(oldGrid: WaterwallGrid, newRows: number, newColumns: number): WaterwallGrid {
  const newMaxBarriers = computeMaxBarriers(newColumns)
  let barrierCount = 0

  const cells: WaterwallCellType[][] = Array.from({ length: newRows }, (_, row) =>
    Array.from({ length: newColumns }, (_, col) => {
      if (row < oldGrid.rows && col < oldGrid.columns && oldGrid.cells[row][col] === 'barrier') {
        barrierCount++
        return 'barrier' as WaterwallCellType
      }
      return 'empty' as WaterwallCellType
    }),
  )

  // Keep order of barriers that still fit in the new dimensions
  const barrierOrder = oldGrid.barrierOrder.filter(
    (c) => c.row < newRows && c.column < newColumns && cells[c.row]?.[c.column] === 'barrier',
  )

  return {
    rows: newRows,
    columns: newColumns,
    cells,
    barrierCount,
    maxBarriers: newMaxBarriers,
    barrierOrder,
  }
}
