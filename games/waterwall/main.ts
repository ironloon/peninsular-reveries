import { bindReduceMotionToggle, bindSfxToggle, isReducedMotionEnabled } from '../../client/preferences.js'
import { setupTabbedModal } from '../../client/modal.js'

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
  resizeGrid,
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

const GAME_SLUG = 'waterwall'
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
    reducedMotion: isReducedMotionEnabled(),
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

function processAction(action: WaterwallAction): void {
  if (isSettingsOpen() && action.type !== 'menu') return

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

  if (getSfxEnabled(GAME_SLUG)) {
    startWaterTexture()
  }
}

function gameLoop(timestamp: number): void {
  for (let i = 0; i < config.ticksPerFrame; i++) {
    grid = simulateTick(grid)
  }
  grid = spawnWater(grid)

  renderFrame(ctx, buildRenderModel(), timestamp)

  if (timestamp - lastPanUpdate > 200) {
    lastPanUpdate = timestamp
    const dist = computeWaterDistribution(grid)
    updateWaterPanning(dist.centerOfMass)
  }

  requestAnimationFrame(gameLoop)
}

function restart(): void {
  const { rows, columns } = grid
  grid = createGrid(rows, columns)
  grid = spawnWater(grid)
  updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
  announceBarriersCleared()
  cursor = null
  dragAnchor = null
}

document.addEventListener('DOMContentLoaded', () => {
  container = byId<HTMLElement>('waterwall-canvas-container')!

  const result = initCanvas(container, config)
  canvas = result.canvas
  ctx = result.ctx
  grid = createGrid(result.rows, result.columns)
  grid = spawnWater(grid)

  updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)

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
  settingsModal = setupTabbedModal('settings-modal')

  // Restart
  const restartBtn = byId<HTMLButtonElement>('restart-btn')
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      restart()
      settingsModal.close()
      syncModalState()
    })
  }

  // Preferences
  bindSfxToggle(GAME_SLUG, byId<HTMLInputElement>('sfx-toggle'))
  bindReduceMotionToggle(byId<HTMLInputElement>('reduce-motion-toggle'))

  // SFX preference events
  window.addEventListener('reveries:sfx-change', ((e: CustomEvent<{ gameSlug: string; enabled: boolean }>) => {
    if (e.detail.gameSlug !== GAME_SLUG) return
    if (e.detail.enabled) {
      startWaterTexture()
    } else {
      stopWaterTexture()
    }
  }) as EventListener)

  // Resize handling
  const resizeObserver = new ResizeObserver(() => {
    const newDims = handleResize(canvas, ctx, container, config)
    grid = resizeGrid(grid, newDims.rows, newDims.columns)
    grid = spawnWater(grid)
    updateCanvasLabel(canvas, grid.barrierCount, grid.maxBarriers, currentTheme)
  })
  resizeObserver.observe(container)

  // Start game loop
  requestAnimationFrame(gameLoop)
})
