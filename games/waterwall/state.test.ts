import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  bresenhamLine,
  clearAllBarriers,
  computeWaterDistribution,
  createGrid,
  placeBarrier,
  placeBarrierLine,
  removeBarrier,
  resizeGrid,
  simulateTick,
  spawnWater,
} from './state.js'
import { computeMaxBarriers, type WaterwallGrid } from './types.js'

describe('createGrid', () => {
  it('creates a grid of all empty cells', () => {
    const grid = createGrid(5, 8)
    assert.equal(grid.rows, 5)
    assert.equal(grid.columns, 8)
    assert.equal(grid.barrierCount, 0)
    assert.equal(grid.maxBarriers, Math.floor(8 * 0.7))
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        assert.equal(grid.cells[r][c], 'empty')
      }
    }
  })
})

describe('spawnWater', () => {
  it('spawns water across the full top row', () => {
    const grid = createGrid(4, 6)
    const after = spawnWater(grid)
    for (let c = 0; c < 6; c++) {
      assert.equal(after.cells[0][c], 'water', `top row column ${c} should be water`)
    }
    // Row 1 should still be empty
    for (let c = 0; c < 6; c++) {
      assert.equal(after.cells[1][c], 'empty')
    }
  })
})

describe('simulateTick', () => {
  it('water falls one row per tick when nothing is below', () => {
    let grid = createGrid(4, 3)
    grid = spawnWater(grid)
    // Water is in row 0
    const after = simulateTick(grid)
    // Row 0 should be empty, row 1 should have water
    for (let c = 0; c < 3; c++) {
      assert.equal(after.cells[0][c], 'empty', `row 0 col ${c}`)
      assert.equal(after.cells[1][c], 'water', `row 1 col ${c}`)
    }
  })

  it('water drains from the bottom row', () => {
    // Place water manually on the bottom row
    const grid = createGrid(3, 3)
    const cells = grid.cells.map((r) => [...r])
    cells[2][0] = 'water'
    cells[2][1] = 'water'
    cells[2][2] = 'water'
    const withWater: WaterwallGrid = { ...grid, cells }

    const after = simulateTick(withWater)
    for (let c = 0; c < 3; c++) {
      assert.equal(after.cells[2][c], 'empty', `bottom row col ${c} should drain`)
    }
  })

  it('water spreads diagonally around a barrier', () => {
    // 5 rows, 5 columns. Water in center of row 0, barrier directly below at (1,2)
    const grid = createGrid(5, 5)
    const cells = grid.cells.map((r) => [...r])
    cells[0][2] = 'water'
    cells[1][2] = 'barrier'
    const withSetup: WaterwallGrid = { ...grid, cells, barrierCount: 1 }

    const after = simulateTick(withSetup)
    // Water should have moved to (1,1) or (1,3) — one of the diagonals
    const diag = [after.cells[1][1], after.cells[1][3]]
    assert.ok(
      diag.includes('water'),
      `water should spread diagonally: got row 1 = [${after.cells[1].join(',')}]`,
    )
    assert.equal(after.cells[0][2], 'empty', 'origin should be empty after move')
  })

  it('water pools laterally when blocked below and diagonally', () => {
    // 3 rows, 3 columns. Water at (0,1), barriers at (1,0), (1,1), (1,2)
    const grid = createGrid(3, 3)
    const cells = grid.cells.map((r) => [...r])
    cells[0][1] = 'water'
    cells[1][0] = 'barrier'
    cells[1][1] = 'barrier'
    cells[1][2] = 'barrier'
    const withSetup: WaterwallGrid = { ...grid, cells, barrierCount: 3 }

    const after = simulateTick(withSetup)
    // Water can only go laterally to (0,0) or (0,2)
    const lateral = [after.cells[0][0], after.cells[0][2]]
    assert.ok(
      lateral.includes('water'),
      `water should spread laterally: got row 0 = [${after.cells[0].join(',')}]`,
    )
    assert.equal(after.cells[0][1], 'empty', 'origin should be empty after lateral move')
  })
})

describe('placeBarrier', () => {
  it('succeeds when budget allows', () => {
    const grid = createGrid(5, 4)
    // maxBarriers = floor(4 * 0.7) = 2; placing first barrier is fine
    const after = placeBarrier(grid, { row: 2, column: 1 })
    assert.notEqual(after, grid)
    assert.equal(after.cells[2][1], 'barrier')
    assert.equal(after.barrierCount, 1)
  })

  it('evicts the oldest barrier (FIFO) when at max', () => {
    let grid = createGrid(5, 5) // maxBarriers = floor(5 * 0.7) = 3
    grid = placeBarrier(grid, { row: 0, column: 0 })
    grid = placeBarrier(grid, { row: 0, column: 1 })
    grid = placeBarrier(grid, { row: 0, column: 2 })
    assert.equal(grid.barrierCount, 3)
    assert.equal(grid.maxBarriers, 3)

    // Placing a 4th evicts the first-placed barrier at (0,0)
    const after = placeBarrier(grid, { row: 0, column: 3 })
    assert.notEqual(after, grid, 'should evict and place rather than block')
    assert.equal(after.cells[0][0], 'empty', 'oldest barrier should be evicted')
    assert.equal(after.cells[0][3], 'barrier', 'new barrier should be placed')
    assert.equal(after.barrierCount, 3, 'count stays at max')
  })

  it('no-ops when cell is a barrier', () => {
    let grid = createGrid(3, 10)
    grid = placeBarrier(grid, { row: 1, column: 1 })
    const again = placeBarrier(grid, { row: 1, column: 1 })
    assert.equal(again, grid, 'placing on existing barrier returns same grid')
  })

  it('succeeds when cell contains water', () => {
    const grid = spawnWater(createGrid(3, 10))
    // Top row is full of water after spawnWater
    const after = placeBarrier(grid, { row: 0, column: 5 })
    assert.notEqual(after, grid, 'should place barrier in water cell')
    assert.equal(after.cells[0][5], 'barrier')
    assert.equal(after.barrierCount, 1)
  })
})

describe('barrier budget', () => {
  it('computes Math.floor(columns * 0.7) for various column counts', () => {
    const cases: [number, number][] = [
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 2],
      [5, 3],
      [10, 7],
      [7, 4],
    ]
    for (const [columns, expected] of cases) {
      assert.equal(computeMaxBarriers(columns), expected, `columns=${columns}`)
      const grid = createGrid(3, columns)
      assert.equal(grid.maxBarriers, expected, `grid maxBarriers for columns=${columns}`)
    }
  })
})

describe('removeBarrier', () => {
  it('removes a barrier cell', () => {
    let grid = createGrid(3, 3)
    grid = placeBarrier(grid, { row: 1, column: 1 })
    assert.equal(grid.barrierCount, 1)

    const after = removeBarrier(grid, { row: 1, column: 1 })
    assert.equal(after.cells[1][1], 'empty')
    assert.equal(after.barrierCount, 0)
  })

  it('no-ops on empty cells', () => {
    const grid = createGrid(3, 3)
    const after = removeBarrier(grid, { row: 0, column: 0 })
    assert.equal(after, grid)
  })

  it('no-ops on water cells', () => {
    const grid = createGrid(3, 3)
    const withWater = spawnWater(grid)
    const after = removeBarrier(withWater, { row: 0, column: 0 })
    assert.equal(after, withWater)
  })
})

describe('bresenhamLine', () => {
  it('produces connected diagonal coordinates', () => {
    const line = bresenhamLine({ row: 0, column: 0 }, { row: 4, column: 4 })
    assert.equal(line.length, 5)
    assert.deepEqual(line[0], { row: 0, column: 0 })
    assert.deepEqual(line[4], { row: 4, column: 4 })

    // Check connectedness: each step differs by at most 1 in both row and column
    for (let i = 1; i < line.length; i++) {
      const dr = Math.abs(line[i].row - line[i - 1].row)
      const dc = Math.abs(line[i].column - line[i - 1].column)
      assert.ok(dr <= 1 && dc <= 1, `step ${i} should be connected: dr=${dr} dc=${dc}`)
      assert.ok(dr + dc > 0, `step ${i} should move`)
    }
  })

  it('handles horizontal line', () => {
    const line = bresenhamLine({ row: 2, column: 0 }, { row: 2, column: 5 })
    assert.equal(line.length, 6)
    for (const coord of line) {
      assert.equal(coord.row, 2)
    }
  })

  it('handles vertical line', () => {
    const line = bresenhamLine({ row: 0, column: 3 }, { row: 4, column: 3 })
    assert.equal(line.length, 5)
    for (const coord of line) {
      assert.equal(coord.column, 3)
    }
  })
})

describe('placeBarrierLine', () => {
  it('places all coordinates when line fits within budget', () => {
    const grid = createGrid(5, 10) // maxBarriers = floor(10 * 0.7) = 7; placing 5 is fine
    const result = placeBarrierLine(grid, { row: 2, column: 0 }, { row: 2, column: 4 })

    assert.equal(result.placed.length, 5)
    assert.equal(result.grid.barrierCount, 5)
  })

  it('slides FIFO window when line exceeds budget', () => {
    const grid = createGrid(10, 5) // maxBarriers = floor(5 * 0.7) = 3
    // Draw a vertical line of 10 cells; FIFO evicts oldest each step past budget
    const result = placeBarrierLine(grid, { row: 0, column: 0 }, { row: 9, column: 0 })

    // All 10 were "placed" (each evicted the prior oldest)
    assert.equal(result.placed.length, 10, 'should report all as placed')
    // Only the last 3 cells of the line remain as barriers
    assert.equal(result.grid.barrierCount, 3, 'count stays at maxBarriers')
    assert.equal(result.grid.cells[9][0], 'barrier', 'last cell in line is a barrier')
    assert.equal(result.grid.cells[0][0], 'empty', 'first cell was evicted')
  })
})

describe('clearAllBarriers', () => {
  it('removes all barriers and resets count', () => {
    let grid = createGrid(5, 5)
    grid = placeBarrier(grid, { row: 0, column: 0 })
    grid = placeBarrier(grid, { row: 1, column: 1 })
    grid = placeBarrier(grid, { row: 2, column: 2 })
    assert.equal(grid.barrierCount, 3)

    const cleared = clearAllBarriers(grid)
    assert.equal(cleared.barrierCount, 0)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        assert.notEqual(cleared.cells[r][c], 'barrier')
      }
    }
  })
})

describe('computeWaterDistribution', () => {
  it('returns -1 centerOfMass for all-left-column water', () => {
    const grid = createGrid(3, 5)
    const cells = grid.cells.map((r) => [...r])
    cells[0][0] = 'water'
    cells[1][0] = 'water'
    cells[2][0] = 'water'
    const withWater: WaterwallGrid = { ...grid, cells }

    const dist = computeWaterDistribution(withWater)
    assert.equal(dist.centerOfMass, -1, 'all water in left column → centerOfMass = -1')
    assert.equal(dist.leftFraction, 1)
    assert.equal(dist.rightFraction, 0)
  })

  it('returns +1 centerOfMass for all-right-column water', () => {
    const grid = createGrid(3, 5)
    const cells = grid.cells.map((r) => [...r])
    cells[0][4] = 'water'
    cells[1][4] = 'water'
    cells[2][4] = 'water'
    const withWater: WaterwallGrid = { ...grid, cells }

    const dist = computeWaterDistribution(withWater)
    assert.equal(dist.centerOfMass, 1, 'all water in right column → centerOfMass = +1')
    assert.equal(dist.rightFraction, 1)
    assert.equal(dist.leftFraction, 0)
  })

  it('returns 0 centerOfMass for centered water', () => {
    const grid = createGrid(3, 5)
    const cells = grid.cells.map((r) => [...r])
    // Symmetric water at columns 0 and 4
    cells[0][0] = 'water'
    cells[0][4] = 'water'
    const withWater: WaterwallGrid = { ...grid, cells }

    const dist = computeWaterDistribution(withWater)
    assert.equal(dist.centerOfMass, 0, 'symmetric water → centerOfMass = 0')
    assert.equal(dist.leftFraction, 0)
    assert.equal(dist.rightFraction, 0)
  })

  it('returns zeros when no water present', () => {
    const grid = createGrid(3, 5)
    const dist = computeWaterDistribution(grid)
    assert.equal(dist.centerOfMass, 0)
    assert.equal(dist.leftFraction, 0)
    assert.equal(dist.rightFraction, 0)
  })
})

describe('resizeGrid', () => {
  it('preserves in-bounds barriers', () => {
    let grid = createGrid(5, 5)
    grid = placeBarrier(grid, { row: 1, column: 1 })
    grid = placeBarrier(grid, { row: 3, column: 3 })

    const resized = resizeGrid(grid, 4, 4)
    assert.equal(resized.rows, 4)
    assert.equal(resized.columns, 4)
    assert.equal(resized.cells[1][1], 'barrier')
    assert.equal(resized.cells[3][3], 'barrier')
    assert.equal(resized.barrierCount, 2)
    assert.equal(resized.maxBarriers, computeMaxBarriers(4))
  })

  it('drops out-of-bounds barriers', () => {
    let grid = createGrid(5, 5)
    grid = placeBarrier(grid, { row: 1, column: 1 })
    grid = placeBarrier(grid, { row: 4, column: 4 }) // will be out of bounds

    const resized = resizeGrid(grid, 3, 3)
    assert.equal(resized.cells[1][1], 'barrier')
    assert.equal(resized.barrierCount, 1, 'out-of-bounds barrier should be dropped')
  })

  it('grows grid with empty cells', () => {
    let grid = createGrid(3, 3)
    grid = placeBarrier(grid, { row: 0, column: 0 })

    const resized = resizeGrid(grid, 6, 6)
    assert.equal(resized.rows, 6)
    assert.equal(resized.columns, 6)
    assert.equal(resized.cells[0][0], 'barrier')
    assert.equal(resized.barrierCount, 1)
    assert.equal(resized.cells[5][5], 'empty')
    assert.equal(resized.maxBarriers, computeMaxBarriers(6))
  })
})
