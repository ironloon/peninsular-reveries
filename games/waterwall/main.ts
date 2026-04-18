import { setupGameMenu } from '../../client/game-menu.js'

import { announceBarrierPlaced, announceBarrierRemoved, announceBarriersCleared, announceCursorPosition, updateCanvasLabel } from './accessibility.js'
import { initCanvas, renderFrame, handleResize, canvasToGrid, type WaterwallRenderModel } from './renderer.js'
import {
  createGrid,
  spawnWater,
  simulateTick,
  placeBarrier,
  removeBarrier,
  placeBarrierLine,
  computeWaterDistribution,
  getTitleBarrierCoordinates,
  placeTitleBarriers,
  dissolveBarrierCells,
} from './state.js'
import {
  ensureAudioUnlocked,
  startWaterTexture,
  stopWaterTexture,
  updateWaterPanning,
  playCursorEdgeCue,
  resetEdgeCue,
  playBarrierPlaceSound,
  playBarrierRemoveSound,
} from './sounds.js'
import { setupPointerInput, setupKeyboardInput, startGamepadPolling, getEdgeZone } from './input.js'
import {
  WATERWALL_DEFAULT_CONFIG,
  WATERWALL_THEMES,
  type WaterwallConfig,
  type WaterwallCursor,
  type WaterwallGrid,
  type WaterwallThemeId,
} from './types.js'
import type { WaterwallAction } from './input.js'
import { getSfxEnabled } from '../../client/preferences.js'

const THEME_STORAGE_KEY = 'waterwall:theme'

const config: WaterwallConfig = WATERWALL_DEFAULT_CONFIG

let grid: WaterwallGrid
let cursor: WaterwallCursor | null = null
let currentTheme: WaterwallThemeId = loadStoredTheme()
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let container: HTMLElement
let lastPanUpdate = 0
let audioUnlocked = false
let dragAnchor: { row: number; column: number } | null = null

// ── Game phase ────────────────────────────────────────────────────────────────

type GamePhase = 'title' | 'dissolving' | 'playing'

const DISSOLVE_MAX_MS = 12000
const DISSOLVE_EROSION_BASE = 0.04
const DISSOLVE_EROSION_VARIANCE = 0.02
const DISSOLVE_COLUMN_SPREAD_MS = 150

let phase: GamePhase = 'title'
let dissolveStartTime = 0
let titleCoordSet: Set<string> = new Set()
let titleErosionResistance: Map<string, number> = new Map()
let columnDelays: number[] = []

let settingsModal = { open() {}, close() {}, toggle() {} }

function loadStoredTheme(): WaterwallThemeId {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored && WATERWALL_THEMES.some((t) => t.id === stored)) {
    return stored as WaterwallThemeId
  }
  return WATERWALL_THEMES[0].id
}

function byId<T extends HTMLElement>(id: string): T | null {
  const el = document.getElementById(id)
  return el instanceof HTMLElement ? (el as T) : null
}

function isSettingsOpen(): boolean {
  const modal = byId<HTMLElement>('settings-modal')
  return Boolean(modal && !modal.hidden)
}

function syncModalState(): void {
  document.body.classList.toggle('modal-open', isSettingsOpen())
}

function buildRenderModel(): WaterwallRenderModel {
  return {
    grid,
    cursor,
    theme: currentTheme,
    barrierCount: grid.barrierCount,
    maxBarriers: grid.maxBarriers,
  }
}

function clampCursor(row: number, column: number): { row: number; column: number } {
  return {
    row: Math.max(0, Math.min(grid.rows - 1, row)),
    column: Math.max(0, Math.min(grid.columns - 1, column)),
  }
}

function moveCursor(direction: 'up' | 'down' | 'left' | 'right'): void {
  if (!cursor) {
    cursor = { row: 0, column: 0, dragging: false }
  }

  let { row, column } = cursor
  switch (direction) {
    case 'up': row--; break
    case 'down': row++; break
    case 'left': column--; break
    case 'right': column++; break
  }

  const clamped = clampCursor(row, column)
  cursor = { ...cursor, row: clamped.row, column: clamped.column }

  announceCursorPosition(cursor.row, cursor.column, grid.rows, grid.columns)

  const edge = getEdgeZone(cursor.row, cursor.column, grid.rows, grid.columns)
  if (edge) {
    playCursorEdgeCue(edge)
  } else {
    resetEdgeCue()
  }
}

function handlePlace(): void {
  if (!cursor) return

  const nextGrid = placeBarrier(grid, { row: cursor.row, column: cursor.column })
  if (nextGrid !== grid) {
    grid = nextGrid
    playBarrierPlaceSound()
    announceBarrierPlaced()
    updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
  }
}

function handleRemove(): void {
  if (!cursor) return

  const nextGrid = removeBarrier(grid, { row: cursor.row, column: cursor.column })
  if (nextGrid !== grid) {
    grid = nextGrid
    playBarrierRemoveSound()
    announceBarrierRemoved()
    updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
  }
}

function handleDragExtend(direction: 'up' | 'down' | 'left' | 'right'): void {
  if (!cursor) {
    cursor = { row: 0, column: 0, dragging: true }
  }

  if (!dragAnchor) {
    dragAnchor = { row: cursor.row, column: cursor.column }
  }

  moveCursor(direction)

  const result = placeBarrierLine(grid, dragAnchor, { row: cursor.row, column: cursor.column })
  if (result.placed.length > 0) {
    grid = result.grid
    playBarrierPlaceSound()
    announceBarrierPlaced()
    updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
  }

  dragAnchor = { row: cursor.row, column: cursor.column }
}

function handlePointerAction(coordinate: { row: number; column: number }, mode: 'place' | 'remove'): void {
  if (mode === 'place') {
    const nextGrid = placeBarrier(grid, coordinate)
    if (nextGrid !== grid) {
      grid = nextGrid
      playBarrierPlaceSound()
      announceBarrierPlaced()
      updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
    }
  } else {
    const nextGrid = removeBarrier(grid, coordinate)
    if (nextGrid !== grid) {
      grid = nextGrid
      playBarrierRemoveSound()
      announceBarrierRemoved()
      updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
    }
  }
}

// ── Title dissolve ────────────────────────────────────────────────────────────

function initTitleGrid(rows: number, columns: number): void {
  grid = createGrid(rows, columns)
  const coords = getTitleBarrierCoordinates(rows, columns)
  grid = placeTitleBarriers(grid, coords)
  titleCoordSet = new Set(coords.map((c) => `${c.row},${c.column}`))
  titleErosionResistance = new Map(
    coords.map((c) => [`${c.row},${c.column}`, DISSOLVE_EROSION_BASE + (Math.random() - 0.5) * 2 * DISSOLVE_EROSION_VARIANCE]),
  )
}

function startDissolve(): void {
  if (phase !== 'title') return
  phase = 'dissolving'
  dissolveStartTime = performance.now()
  unlockAudioOnce()

  columnDelays = Array.from({ length: grid.columns }, () => Math.random() * DISSOLVE_COLUMN_SPREAD_MS)

  if (getSfxEnabled()) {
    startWaterTexture()
  }

  const playBtn = byId<HTMLButtonElement>('waterwall-play-btn')
  if (playBtn) playBtn.classList.add('fading')
}

function transitionToPlaying(): void {
  if (titleCoordSet.size > 0) {
    const remaining = Array.from(titleCoordSet).map((key) => {
      const sep = key.indexOf(',')
      return { row: Number(key.slice(0, sep)), column: Number(key.slice(sep + 1)) }
    })
    grid = dissolveBarrierCells(grid, remaining)
    titleCoordSet.clear()
  }

  phase = 'playing'

  const playBtn = byId<HTMLButtonElement>('waterwall-play-btn')
  if (playBtn) playBtn.hidden = true

  updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
}

function spawnWaterDelayed(elapsed: number): void {
  if (grid.rows === 0) return
  const nextCells = grid.cells.map((row) => [...row])
  for (let col = 0; col < grid.columns; col++) {
    if (elapsed >= columnDelays[col] && nextCells[0][col] === 'empty') {
      nextCells[0][col] = 'water'
    }
  }
  grid = { ...grid, cells: nextCells }
}

function hasAdjacentWater(row: number, col: number): boolean {
  const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
  for (const [dr, dc] of offsets) {
    const r = row + dr
    const c = col + dc
    if (r >= 0 && r < grid.rows && c >= 0 && c < grid.columns && grid.cells[r]?.[c] === 'water') {
      return true
    }
  }
  return false
}

function dissolveWaterAdjacent(): void {
  const toDissolve: { row: number; column: number }[] = []
  for (const key of titleCoordSet) {
    const sep = key.indexOf(',')
    const row = Number(key.slice(0, sep))
    const col = Number(key.slice(sep + 1))
    if (!hasAdjacentWater(row, col)) continue
    const resistance = titleErosionResistance.get(key) ?? DISSOLVE_EROSION_BASE
    if (Math.random() < resistance) {
      toDissolve.push({ row, column: col })
    }
  }
  if (toDissolve.length > 0) {
    grid = dissolveBarrierCells(grid, toDissolve)
    for (const coord of toDissolve) {
      const k = `${coord.row},${coord.column}`
      titleCoordSet.delete(k)
      titleErosionResistance.delete(k)
    }
  }
}

// ── Input processing ──────────────────────────────────────────────────────────

function processAction(action: WaterwallAction): void {
  if (isSettingsOpen() && action.type !== 'menu') return

  // Title phase: only menu and play trigger (gamepad A / keyboard Enter)
  if (phase === 'title') {
    if (action.type === 'menu') {
      settingsModal.toggle()
      syncModalState()
    } else if (action.type === 'place') {
      startDissolve()
    }
    return
  }

  // Dissolving phase: allow barrier placement + menu
  if (phase === 'dissolving') {
    if (action.type === 'menu') {
      settingsModal.toggle()
      syncModalState()
      return
    }
    // Fall through to normal input handling so players can place barriers
  }

  switch (action.type) {
    case 'move':
      moveCursor(action.direction)
      dragAnchor = null
      break
    case 'place':
      handlePlace()
      break
    case 'remove':
      handleRemove()
      break
    case 'drag-start':
      if (cursor) {
        dragAnchor = { row: cursor.row, column: cursor.column }
      }
      break
    case 'drag-extend':
      handleDragExtend(action.direction)
      break
    case 'menu':
      settingsModal.toggle()
      syncModalState()
      break
    case 'pointer':
      handlePointerAction(action.coordinate, action.mode)
      break
    case 'pointer-move':
      cursor = { row: action.coordinate.row, column: action.coordinate.column, dragging: false }
      break
    case 'pointer-up':
      dragAnchor = null
      break
  }
}

function unlockAudioOnce(): void {
  if (audioUnlocked) return
  audioUnlocked = true

  ensureAudioUnlocked()
}

function gameLoop(timestamp: number): void {
  switch (phase) {
    case 'title':
      break

    case 'dissolving': {
      const elapsed = timestamp - dissolveStartTime
      for (let i = 0; i < config.ticksPerFrame; i++) {
        grid = simulateTick(grid)
      }
      spawnWaterDelayed(elapsed)
      if (titleCoordSet.size === 0) {
        transitionToPlaying()
      } else if (elapsed >= DISSOLVE_MAX_MS) {
        transitionToPlaying()
      } else {
        dissolveWaterAdjacent()
      }
      break
    }

    case 'playing':
      for (let i = 0; i < config.ticksPerFrame; i++) {
        grid = simulateTick(grid)
      }
      grid = spawnWater(grid)

      if (timestamp - lastPanUpdate > 200) {
        lastPanUpdate = timestamp
        const dist = computeWaterDistribution(grid)
        updateWaterPanning(dist.centerOfMass)
      }
      break
  }

  renderFrame(ctx, buildRenderModel(), timestamp)
  requestAnimationFrame(gameLoop)
}

function restart(): void {
  const { rows, columns } = grid
  initTitleGrid(rows, columns)
  phase = 'title'
  cursor = null
  dragAnchor = null

  const playBtn = byId<HTMLButtonElement>('waterwall-play-btn')
  if (playBtn) {
    playBtn.hidden = false
    playBtn.classList.remove('fading')
  }

  stopWaterTexture()
  updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
  announceBarriersCleared()
}

// ── Gamepad hint ──────────────────────────────────────────────────────────────

function updateGamepadHint(): void {
  const hint = byId<HTMLElement>('waterwall-gamepad-hint')
  if (!hint) return
  const gamepads = navigator.getGamepads?.() ?? []
  hint.hidden = !Array.from(gamepads).some((gp) => gp !== null)
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  container = byId<HTMLElement>('waterwall-canvas-container')!

  const result = initCanvas(container, config)
  canvas = result.canvas
  ctx = result.ctx
  initTitleGrid(result.rows, result.columns)

  updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)

  // Play button
  const playBtn = byId<HTMLButtonElement>('waterwall-play-btn')
  if (playBtn) {
    playBtn.addEventListener('click', () => startDissolve())
  }

  // Theme select
  const themeSelect = byId<HTMLSelectElement>('waterwall-theme-select')
  if (themeSelect) {
    themeSelect.value = currentTheme
    themeSelect.addEventListener('change', () => {
      const value = themeSelect.value as WaterwallThemeId
      if (WATERWALL_THEMES.some((t) => t.id === value)) {
        currentTheme = value
        localStorage.setItem(THEME_STORAGE_KEY, value)
        updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
      }
    })
  }

  // Input
  setupPointerInput(canvas, config, (action) => {
    unlockAudioOnce()
    processAction(action)
  }, canvasToGrid, (coord) => grid.cells[coord.row]?.[coord.column] ?? 'empty')

  setupKeyboardInput(
    (action) => {
      unlockAudioOnce()
      processAction(action)
    },
    () => {
      if (!cursor) return 'empty'
      return grid.cells[cursor.row]?.[cursor.column] ?? 'empty'
    },
  )

  startGamepadPolling(
    (action) => {
      unlockAudioOnce()
      processAction(action)
    },
    () => {
      if (!cursor) return 'empty'
      return grid.cells[cursor.row]?.[cursor.column] ?? 'empty'
    },
  )

  // Modal
  settingsModal = setupGameMenu()

  // Restart
  document.addEventListener('restart', () => {
    restart()
    syncModalState()
  })

  // Preferences — SFX preference events
  window.addEventListener('reveries:sfx-change', ((e: CustomEvent<{ enabled: boolean }>) => {
    if (e.detail.enabled && phase !== 'title') {
      startWaterTexture()
    } else if (!e.detail.enabled) {
      stopWaterTexture()
    }
  }) as EventListener)

  // Gamepad hint
  window.addEventListener('gamepadconnected', updateGamepadHint)
  window.addEventListener('gamepaddisconnected', updateGamepadHint)

  // Resize handling
  const resizeObserver = new ResizeObserver(() => {
    const newDims = handleResize(canvas, ctx, container, config)
    if (phase === 'title') {
      initTitleGrid(newDims.rows, newDims.columns)
    } else {
      grid = createGrid(newDims.rows, newDims.columns)
      grid = spawnWater(grid)
    }
    updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
  })
  resizeObserver.observe(container)

  // Start game loop
  requestAnimationFrame(gameLoop)
})
