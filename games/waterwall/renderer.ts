import type {
  WaterwallCellType,
  WaterwallConfig,
  WaterwallCoordinate,
  WaterwallCursor,
  WaterwallGrid,
  WaterwallThemeId,
} from './types.js'
import { cursorPulseAlpha } from './animations.js'

// ── Runtime style injection ───────────────────────────────────────────────────

const STYLE_ID = 'waterwall-runtime-inline-styles'

const RUNTIME_STYLES = `
.waterwall-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.waterwall-canvas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
  -webkit-touch-callout: none;
  user-select: none;
  touch-action: manipulation;
}
`

function ensureRuntimeStyles(documentRef: Document): void {
  if (documentRef.getElementById(STYLE_ID)) return

  const styleElement = documentRef.createElement('style')
  styleElement.id = STYLE_ID
  styleElement.textContent = RUNTIME_STYLES
  documentRef.head.appendChild(styleElement)
}

// ── Render model ──────────────────────────────────────────────────────────────

export interface WaterwallRenderModel {
  readonly grid: WaterwallGrid
  readonly cursor: WaterwallCursor | null
  readonly theme: WaterwallThemeId
  readonly reducedMotion: boolean
  readonly barrierCount: number
  readonly maxBarriers: number
}

// ── Theme palettes ────────────────────────────────────────────────────────────

function seededRandom(row: number, column: number): number {
  let h = (row * 374761 + column * 668265) | 0
  h = ((h >> 16) ^ h) * 0x45d9f3b
  h = ((h >> 16) ^ h) * 0x45d9f3b
  h = (h >> 16) ^ h
  return (h & 0xff) / 255
}

function emptyColor(theme: WaterwallThemeId, row: number, column: number): string {
  const seed = seededRandom(row, column)
  switch (theme) {
    case 'rocky': {
      const base = 140 + Math.floor(seed * 30)
      const r = base + 15
      const g = base + 5
      const b = base - 10
      return `rgb(${r},${g},${b})`
    }
    case 'night': {
      const r = 20 + Math.floor(seed * 15)
      const g = 20 + Math.floor(seed * 20)
      const b = 50 + Math.floor(seed * 25)
      return `rgb(${r},${g},${b})`
    }
    case 'earth': {
      const base = 180 + Math.floor(seed * 25)
      const r = base + 10
      const g = base - 5
      const b = base - 40
      return `rgb(${r},${g},${b})`
    }
  }
}

function waterColor(row: number, column: number, timestamp: number, reducedMotion: boolean): string {
  const seed = seededRandom(row, column)
  const r = 25 + Math.floor(seed * 15)
  const g = 140 + Math.floor(seed * 20)
  const b = 230 + Math.floor(seed * 20)

  // Animated flowing texture: sine wave scrolls downward across cells.
  // Negative row term makes the pattern drift downward over time.
  const alpha = reducedMotion
    ? 0.55
    : 0.45 + Math.sin(timestamp * 0.003 - row * 0.45 + column * 0.25) * 0.10

  return `rgba(${r},${g},${b},${alpha})`
}

function barrierColor(row: number, column: number): string {
  const seed = seededRandom(row, column)
  const r = 115 + Math.floor(seed * 15)
  const g = 80 + Math.floor(seed * 10)
  const b = 65 + Math.floor(seed * 15)
  return `rgb(${r},${g},${b})`
}

// ── Night theme star dots ─────────────────────────────────────────────────────

function isStarCell(row: number, column: number): boolean {
  return seededRandom(row * 7 + 3, column * 13 + 7) > 0.92
}

// ── Init ──────────────────────────────────────────────────────────────────────

export interface InitCanvasResult {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  readonly rows: number
  readonly columns: number
}

export function initCanvas(container: HTMLElement, config: WaterwallConfig): InitCanvasResult {
  const documentRef = container.ownerDocument
  ensureRuntimeStyles(documentRef)

  container.classList.add('waterwall-canvas-container')

  const canvas = documentRef.createElement('canvas')
  canvas.style.cssText = '-webkit-touch-callout: none; user-select: none; touch-action: manipulation;'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Waterwall game board')

  container.appendChild(canvas)

  const ctx = canvas.getContext('2d')!

  const { rows, columns } = computeCanvasDimensions(canvas, ctx, container, config)

  const resizeObserver = new ResizeObserver(() => {
    handleResize(canvas, ctx, container, config)
  })
  resizeObserver.observe(container)

  return { canvas, ctx, rows, columns }
}

// ── Resize ────────────────────────────────────────────────────────────────────

function computeCanvasDimensions(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  container: HTMLElement,
  config: WaterwallConfig,
): { rows: number; columns: number } {
  const dpr = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1
  const rect = container.getBoundingClientRect()
  const width = Math.floor(rect.width)
  const height = Math.floor(rect.height)

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const columns = Math.floor(width / config.cellSize)
  const rows = Math.floor(height / config.cellSize)

  return { rows, columns }
}

export function handleResize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  container: HTMLElement,
  config: WaterwallConfig,
): { rows: number; columns: number } {
  return computeCanvasDimensions(canvas, ctx, container, config)
}

// ── Coordinate conversion ─────────────────────────────────────────────────────

export function canvasToGrid(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  config: WaterwallConfig,
): WaterwallCoordinate | null {
  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null

  const column = Math.floor(x / config.cellSize)
  const row = Math.floor(y / config.cellSize)

  return { row, column }
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  model: WaterwallRenderModel,
  timestamp: number,
): void {
  const { grid, cursor, theme, reducedMotion } = model

  // Derive cell size from canvas CSS dimensions divided by grid dimensions
  const canvasWidth = parseFloat(ctx.canvas.style.width) || ctx.canvas.width
  const canvasHeight = parseFloat(ctx.canvas.style.height) || ctx.canvas.height

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  if (grid.rows === 0 || grid.columns === 0) return

  const cw = canvasWidth / grid.columns
  const ch = canvasHeight / grid.rows

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.columns; col++) {
      const cellType: WaterwallCellType = grid.cells[row]?.[col] ?? 'empty'
      const x = col * cw
      const y = row * ch

      switch (cellType) {
        case 'empty':
          ctx.fillStyle = emptyColor(theme, row, col)
          ctx.fillRect(x, y, cw, ch)
          if (theme === 'night' && isStarCell(row, col)) {
            ctx.fillStyle = 'rgba(220,220,255,0.7)'
            ctx.beginPath()
            ctx.arc(x + cw * 0.5, y + ch * 0.5, Math.max(cw * 0.12, 0.5), 0, Math.PI * 2)
            ctx.fill()
          }
          break
        case 'water':
          // Draw the background theme color first so it shows through the translucent water
          ctx.fillStyle = emptyColor(theme, row, col)
          ctx.fillRect(x, y, cw, ch)
          ctx.fillStyle = waterColor(row, col, timestamp, reducedMotion)
          ctx.fillRect(x, y, cw, ch)
          break
        case 'barrier':
          ctx.fillStyle = barrierColor(row, col)
          ctx.fillRect(x, y, cw, ch)
          break
      }
    }
  }

  // Cursor overlay
  if (cursor && cursor.row >= 0 && cursor.row < grid.rows && cursor.column >= 0 && cursor.column < grid.columns) {
    const alpha = cursorPulseAlpha(timestamp, reducedMotion)
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`
    ctx.lineWidth = 2
    ctx.strokeRect(
      cursor.column * cw + 1,
      cursor.row * ch + 1,
      cw - 2,
      ch - 2,
    )
  }
}
