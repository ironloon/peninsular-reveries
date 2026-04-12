import { getAffectedCells } from './state.js'
import type {
  SquaresCoordinate,
  SquaresPatternId,
  SquaresState,
} from './types.js'

export const SQUARES_CELL_SELECTOR = '[data-squares-cell="true"]'
export const SQUARES_PATTERN_TOGGLE_SELECTOR = '[data-squares-pattern-toggle="true"]'
export const SQUARES_MENU_BUTTON_SELECTOR = '[data-squares-menu-button="true"]'
export const SQUARES_RESTART_BUTTON_SELECTOR = '[data-squares-restart-button="true"]'

const STYLE_ID = 'squares-runtime-inline-styles'

const RUNTIME_STYLES = `
.squares-runtime-shell {
  --squares-gap: clamp(0.7rem, 1.8vw, 1.1rem);
  --squares-cell-radius: clamp(0.9rem, 1.6vw, 1.4rem);
  --squares-light: #f2ebd6;
  --squares-light-edge: rgba(255, 255, 255, 0.72);
  --squares-dark: #254653;
  --squares-dark-edge: rgba(12, 31, 40, 0.82);
  --squares-preview: #f59e0b;
  --squares-preview-soft: rgba(245, 158, 11, 0.22);
  --squares-bg-top: #f4efe2;
  --squares-bg-bottom: #d9ead8;
  min-height: 100svh;
  height: 100dvh;
  padding:
    max(0.9rem, env(safe-area-inset-top))
    max(0.9rem, env(safe-area-inset-right))
    max(1rem, env(safe-area-inset-bottom))
    max(0.9rem, env(safe-area-inset-left));
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--squares-gap);
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.88), transparent 38%),
    linear-gradient(180deg, var(--squares-bg-top) 0%, var(--squares-bg-bottom) 100%);
  color: #17313a;
}

.squares-runtime-shell[data-phase="solved"] {
  --squares-preview: #3c9a6a;
  --squares-preview-soft: rgba(60, 154, 106, 0.22);
}

.squares-runtime-toolbar {
  display: grid;
  gap: 0.75rem;
}

.squares-runtime-headline {
  display: flex;
  justify-content: space-between;
  gap: 0.9rem;
  align-items: start;
  flex-wrap: wrap;
}

.squares-runtime-copy {
  display: grid;
  gap: 0.2rem;
}

.squares-runtime-copy h2,
.squares-runtime-copy p,
.squares-runtime-status,
.squares-runtime-score {
  margin: 0;
}

.squares-runtime-controls {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.squares-runtime-control {
  appearance: none;
  border: 1px solid rgba(24, 49, 58, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: inherit;
  min-height: 44px;
  padding: 0.72rem 1rem;
  font: inherit;
  touch-action: manipulation;
  box-shadow: 0 0.2rem 0.6rem rgba(28, 53, 62, 0.08);
}

.squares-runtime-control:focus-visible,
.squares-board-cell:focus-visible {
  outline: 3px solid rgba(18, 81, 106, 0.9);
  outline-offset: 3px;
}

.squares-runtime-board-wrap {
  min-height: 0;
  display: grid;
  align-items: stretch;
}

.squares-board {
  min-height: 0;
  display: grid;
  gap: clamp(0.35rem, 1.1vw, 0.7rem);
  align-content: center;
  justify-content: stretch;
  background: rgba(255, 255, 255, 0.34);
  border-radius: clamp(1.1rem, 2vw, 1.8rem);
  padding: clamp(0.65rem, 1.4vw, 1rem);
  box-shadow: inset 0 0 0 1px rgba(27, 56, 66, 0.08);
}

.squares-board-row {
  display: grid;
  gap: clamp(0.35rem, 1.1vw, 0.7rem);
}

.squares-board-cell {
  appearance: none;
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 1;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--squares-cell-radius);
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: var(--squares-light);
  color: #18313a;
  box-shadow:
    inset 0 1px 0 var(--squares-light-edge),
    0 0.35rem 0.85rem rgba(23, 49, 58, 0.1);
  touch-action: manipulation;
  overflow: hidden;
  transition: transform 140ms ease, filter 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
}

.squares-board-cell[data-cell-value="dark"] {
  background: var(--squares-dark);
  color: #f5f7f8;
  border-color: rgba(14, 28, 34, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0.35rem 0.85rem rgba(10, 22, 29, 0.18);
}

.squares-board-cell[data-preview-role="anchor"]::after,
.squares-board-cell[data-preview-role="affected"]::after {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: calc(var(--squares-cell-radius) - 0.25rem);
  pointer-events: none;
  transition: transform 180ms ease, opacity 180ms ease, inset 180ms ease;
}

.squares-board-cell[data-preview-role="anchor"]::after {
  inset: 8%;
  border: 3px solid var(--squares-preview);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), var(--squares-preview-soft));
}

.squares-board-cell[data-preview-role="affected"]::after {
  border: 2px solid rgba(245, 158, 11, 0.78);
  background: var(--squares-preview-soft);
}

.squares-board-cell[data-preview-pattern="plus"][data-preview-role="anchor"]::before,
.squares-board-cell[data-preview-pattern="x"][data-preview-role="anchor"]::before {
  content: attr(data-pattern-glyph);
  position: absolute;
  font-size: clamp(1rem, 2vw, 1.3rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.9;
}

.squares-board-cell[data-focused="true"] {
  transform: translateY(-1px);
}

.squares-runtime-shell[data-reduced-motion="true"] .squares-board-cell,
.squares-runtime-shell[data-reduced-motion="true"] .squares-board-cell::after {
  transition-duration: 80ms;
}

.squares-runtime-shell[data-reduced-motion="true"] .squares-board-cell[data-preview-role="anchor"]::after {
  background: rgba(245, 158, 11, 0.28);
}

.squares-runtime-shell[data-reduced-motion="true"] .squares-board-cell[data-preview-role="affected"]::after {
  background: rgba(245, 158, 11, 0.16);
}

@media (orientation: landscape) and (max-height: 540px) {
  .squares-runtime-shell {
    --squares-gap: 0.6rem;
  }

  .squares-runtime-copy h2 {
    font-size: 1.05rem;
  }

  .squares-runtime-control {
    padding-block: 0.6rem;
  }
}
`

export interface SquaresRenderModel {
  readonly state: SquaresState
  readonly focusedCoordinate?: SquaresCoordinate | null
  readonly hoveredCoordinate?: SquaresCoordinate | null
  readonly reducedMotion?: boolean
  readonly highScoreSummary?: string | null
}

export interface SquaresRenderer {
  readonly root: HTMLElement
  readonly boardElement: HTMLElement
  readonly patternToggleButton: HTMLButtonElement
  readonly menuButton: HTMLButtonElement
  readonly restartButton: HTMLButtonElement
  render: (model: SquaresRenderModel) => void
  getCellButton: (coordinate: SquaresCoordinate) => HTMLButtonElement | null
}

function coordinateKey(coordinate: SquaresCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`
}

function sameCoordinate(left: SquaresCoordinate | null | undefined, right: SquaresCoordinate | null | undefined): boolean {
  return Boolean(left && right && left.row === right.row && left.column === right.column)
}

function previewCoordinateFor(model: SquaresRenderModel): SquaresCoordinate | null {
  return model.hoveredCoordinate ?? model.focusedCoordinate ?? null
}

function activePatternFor(state: SquaresState): SquaresPatternId {
  return state.lockedPatternId ?? state.activePatternId
}

function previewKeysFor(model: SquaresRenderModel): ReadonlySet<string> {
  const previewCoordinate = previewCoordinateFor(model)
  if (!previewCoordinate) {
    return new Set<string>()
  }

  return new Set(
    getAffectedCells(model.state.board, previewCoordinate, activePatternFor(model.state)).map(coordinateKey),
  )
}

function ensureRuntimeStyles(documentRef: Document): void {
  if (documentRef.getElementById(STYLE_ID)) {
    return
  }

  const styleElement = documentRef.createElement('style')
  styleElement.id = STYLE_ID
  styleElement.textContent = RUNTIME_STYLES
  documentRef.head.appendChild(styleElement)
}

function applyViewportGuard(documentRef: Document): void {
  documentRef.documentElement.style.height = '100%'
  documentRef.documentElement.style.overflow = 'hidden'
  documentRef.body.style.height = '100%'
  documentRef.body.style.margin = '0'
  documentRef.body.style.overflow = 'hidden'
}

function getCellButtonId(coordinate: SquaresCoordinate): string {
  return `squares-cell-r${coordinate.row}-c${coordinate.column}`
}

export function createRenderer(root: HTMLElement): SquaresRenderer {
  const documentRef = root.ownerDocument
  ensureRuntimeStyles(documentRef)
  applyViewportGuard(documentRef)

  const toolbar = documentRef.createElement('header')
  toolbar.className = 'squares-runtime-toolbar'

  const headline = documentRef.createElement('div')
  headline.className = 'squares-runtime-headline'

  const copy = documentRef.createElement('div')
  copy.className = 'squares-runtime-copy'

  const title = documentRef.createElement('h2')
  title.textContent = 'Squares'
  const status = documentRef.createElement('p')
  status.className = 'squares-runtime-status'
  const score = documentRef.createElement('p')
  score.className = 'squares-runtime-score'
  copy.append(title, status, score)

  const controls = documentRef.createElement('div')
  controls.className = 'squares-runtime-controls'

  const patternToggleButton = documentRef.createElement('button')
  patternToggleButton.type = 'button'
  patternToggleButton.className = 'squares-runtime-control'
  patternToggleButton.dataset['squaresPatternToggle'] = 'true'

  const menuButton = documentRef.createElement('button')
  menuButton.type = 'button'
  menuButton.className = 'squares-runtime-control'
  menuButton.dataset['squaresMenuButton'] = 'true'
  menuButton.textContent = 'Menu'

  const restartButton = documentRef.createElement('button')
  restartButton.type = 'button'
  restartButton.className = 'squares-runtime-control'
  restartButton.dataset['squaresRestartButton'] = 'true'
  restartButton.textContent = 'Restart'

  controls.append(patternToggleButton, menuButton, restartButton)
  headline.append(copy, controls)
  toolbar.append(headline)

  const boardWrap = documentRef.createElement('section')
  boardWrap.className = 'squares-runtime-board-wrap'

  const boardElement = documentRef.createElement('div')
  boardElement.className = 'squares-board'
  boardElement.id = 'squares-board'
  boardElement.setAttribute('aria-label', 'Squares board')
  boardWrap.append(boardElement)

  root.classList.add('squares-runtime-shell')
  root.replaceChildren(toolbar, boardWrap)

  const render = (model: SquaresRenderModel): void => {
    const previewCoordinate = previewCoordinateFor(model)
    const previewKeys = previewKeysFor(model)
    const previewPatternId = activePatternFor(model.state)

    root.dataset['phase'] = model.state.phase
    root.dataset['reducedMotion'] = String(Boolean(model.reducedMotion))
    boardElement.dataset['activePattern'] = previewPatternId
    status.textContent = `Moves: ${model.state.moveCount}`
    score.textContent = model.highScoreSummary ?? ''
    patternToggleButton.textContent = `Pattern: ${previewPatternId === 'plus' ? 'Plus' : 'X'}`
    patternToggleButton.disabled = model.state.lockedPatternId !== null
    patternToggleButton.setAttribute('aria-pressed', model.state.lockedPatternId === null ? 'false' : 'true')
    patternToggleButton.setAttribute('aria-label', `Pattern ${previewPatternId === 'plus' ? 'Plus' : 'X'}`)

    const rowElements = model.state.board.map((row, rowIndex) => {
      const rowElement = documentRef.createElement('div')
      rowElement.className = 'squares-board-row'
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, minmax(0, 1fr))`

      const cellButtons = row.map((cellValue, columnIndex) => {
        const coordinate = { row: rowIndex, column: columnIndex }
        const cellButton = documentRef.createElement('button')
        const isPreviewAnchor = sameCoordinate(previewCoordinate, coordinate)
        const isFocused = sameCoordinate(model.focusedCoordinate, coordinate)
        const previewRole = isPreviewAnchor ? 'anchor' : previewKeys.has(coordinateKey(coordinate)) ? 'affected' : 'none'

        cellButton.type = 'button'
        cellButton.className = 'squares-board-cell'
        cellButton.id = getCellButtonId(coordinate)
        cellButton.dataset['squaresCell'] = 'true'
        cellButton.dataset['row'] = String(rowIndex)
        cellButton.dataset['column'] = String(columnIndex)
        cellButton.dataset['cellValue'] = cellValue
        cellButton.dataset['previewRole'] = previewRole
        cellButton.dataset['previewPattern'] = previewPatternId
        cellButton.dataset['patternGlyph'] = previewPatternId === 'plus' ? '+' : 'x'
        cellButton.dataset['focused'] = String(isFocused)
        cellButton.tabIndex = isFocused || (!model.focusedCoordinate && rowIndex === 0 && columnIndex === 0) ? 0 : -1
        cellButton.setAttribute(
          'aria-label',
          `Row ${rowIndex + 1}, column ${columnIndex + 1}, ${cellValue}${isPreviewAnchor ? `, ${previewPatternId} target` : ''}`,
        )
        if (model.state.phase === 'solved') {
          cellButton.disabled = true
        }

        rowElement.appendChild(cellButton)
        return cellButton
      })

      void cellButtons
      return rowElement
    })

    boardElement.replaceChildren(...rowElements)
  }

  return {
    root,
    boardElement,
    patternToggleButton,
    menuButton,
    restartButton,
    render,
    getCellButton: (coordinate) => boardElement.querySelector(`#${getCellButtonId(coordinate)}`),
  }
}
