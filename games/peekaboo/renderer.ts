import type { Target, PeekabooState } from './types.js'
import { SCENE_SCENERY } from './types.js'

// ── Lazy element cache ───────────────────────────────────────
let gameAreaEl: HTMLElement | null = null
function getGameArea(): HTMLElement {
  return gameAreaEl ??= document.getElementById('peekaboo-game-area')!
}

let enterScreenEl: HTMLElement | null = null
function getEnterScreen(): HTMLElement {
  return enterScreenEl ??= document.getElementById('peekaboo-enter-screen')!
}

let foundScreenEl: HTMLElement | null = null
function getFoundScreen(): HTMLElement {
  return foundScreenEl ??= document.getElementById('peekaboo-found-screen')!
}

let sceneLayerEl: HTMLElement | null = null
function getSceneLayer(): HTMLElement {
  return sceneLayerEl ??= document.getElementById('peekaboo-scene-layer')!
}

let fogGridEl: HTMLElement | null = null
function getFogGrid(): HTMLElement {
  return fogGridEl ??= document.getElementById('peekaboo-fog-grid')!
}

let meetTargetEmojiEl: HTMLElement | null = null
function getMeetTargetEmoji(): HTMLElement {
  return meetTargetEmojiEl ??= document.getElementById('peekaboo-meet-target-emoji')!
}

let meetHeadingEl: HTMLElement | null = null
function getMeetHeading(): HTMLElement {
  return meetHeadingEl ??= document.getElementById('peekaboo-meet-heading')!
}

let foundTargetEmojiEl: HTMLElement | null = null
function getFoundTargetEmoji(): HTMLElement {
  return foundTargetEmojiEl ??= document.getElementById('peekaboo-found-target-emoji')!
}

let foundHeadingEl: HTMLElement | null = null
function getFoundHeading(): HTMLElement {
  return foundHeadingEl ??= document.getElementById('peekaboo-found-heading')!
}

// ── Runtime style injection ─────────────────────────────────────
const STYLE_ID = 'peekaboo-runtime-inline-styles'

const RUNTIME_STYLES = `
.peekaboo-runtime-shell {
  --peekaboo-gap: clamp(0.25rem, 0.8vw, 0.45rem);
  --peekaboo-cell-radius: clamp(0.5rem, 1vw, 0.75rem);
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
  gap: var(--peekaboo-gap);
  overflow: hidden;
}
`

function ensureRuntimeStyles(documentRef: Document): void {
  if (documentRef.getElementById(STYLE_ID)) {
    return
  }
  const styleElement = documentRef.createElement('style')
  styleElement.id = STYLE_ID
  styleElement.textContent = RUNTIME_STYLES
  documentRef.head.appendChild(styleElement)
}

// ── Decorative scene emojis ────────────────────────────────────

function randomScenery(): string {
  return SCENE_SCENERY[Math.floor(Math.random() * SCENE_SCENERY.length)]
}

// ── Screen management ─────────────────────────────────────────

export function showScreen(screenId: string): void {
  getGameArea().dataset['activeScreen'] = screenId

  const fullId = `peekaboo-${screenId}`
  for (const screen of Array.from(document.querySelectorAll<HTMLElement>('.screen'))) {
    const isActive = screen.id === fullId
    screen.classList.toggle('active', isActive)
    screen.classList.toggle('leaving', false)
    screen.setAttribute('aria-hidden', String(!isActive))
  }
}

// ── Meet screen ────────────────────────────────────────────────

export function renderMeetScreen(target: Target): void {
  const emojiEl = getMeetTargetEmoji()
  const headingEl = getMeetHeading()
  emojiEl.textContent = target.emoji
  headingEl.textContent = `Find the ${target.name}!`
}

// ── Enter screen animation ────────────────────────────────────

const ENTER_ANIMATION_DURATION = 1200

export function renderEnterAnimation(target: Target): void {
  const screen = getEnterScreen()
  const flyEl = document.createElement('div')
  flyEl.className = 'peekaboo-enter-fly'
  flyEl.textContent = target.emoji
  flyEl.setAttribute('aria-hidden', 'true')
  screen.appendChild(flyEl)

  const removeTimer: number = window.setTimeout(() => {
    flyEl.remove()
  }, ENTER_ANIMATION_DURATION)

  // Store timer so cleanup can clear it
  screen.dataset['peekabooEnterTimer'] = String(removeTimer)
}

// ── Scene layer ───────────────────────────────────────────────

let enterSceneEl: HTMLElement | null = null
function getEnterScene(): HTMLElement {
  return enterSceneEl ??= document.getElementById('peekaboo-enter-scene')!
}

function buildSceneLayer(state: PeekabooState): void {
  const scene = getSceneLayer()
  scene.innerHTML = ''

  // Place scenery as interactive buttons; target is NOT rendered (hides behind scenery)
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const cell = state.scenery[row][col]
      if (cell === null) continue

      const sceneryEl = document.createElement('button')
      sceneryEl.type = 'button'
      sceneryEl.className = 'peekaboo-scene-scenery'
      sceneryEl.textContent = cell.emoji
      sceneryEl.style.gridRow = String(row + 1)
      sceneryEl.style.gridColumn = String(col + 1)
      sceneryEl.dataset['peekabooRow'] = String(row)
      sceneryEl.dataset['peekabooCol'] = String(col)
      sceneryEl.dataset['scenery'] = 'true'
      sceneryEl.setAttribute('aria-label', `Scenery: ${cell.emoji}, row ${row + 1}, column ${col + 1}`)

      // Disabled until fog is cleared; also disabled if already peeked
      const revealed = state.grid[row][col]
      const peeked = state.peeked[row][col]
      sceneryEl.disabled = !revealed || peeked

      if (peeked) {
        sceneryEl.classList.add('peekaboo-scenery--peeked')
      }

      scene.appendChild(sceneryEl)
    }
  }
}

// ── Enter scene ───────────────────────────────────────────────

export function renderEnterScene(state: PeekabooState): void {
  const scene = getEnterScene()
  scene.innerHTML = ''
  scene.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`
  scene.style.gridTemplateRows = `repeat(${state.rows}, 1fr)`

  // Show scenery only — no target, so the player doesn't see the hiding spot
  const occupied = new Set<string>()

  for (let i = 0; i < Math.min(state.rows * state.cols, 12); i++) {
    let row: number
    let col: number
    let key: string
    do {
      row = Math.floor(Math.random() * state.rows)
      col = Math.floor(Math.random() * state.cols)
      key = `${row},${col}`
    } while (occupied.has(key))
    occupied.add(key)

    const sceneryEl = document.createElement('span')
    sceneryEl.className = 'peekaboo-scene-scenery'
    sceneryEl.textContent = randomScenery()
    sceneryEl.style.gridRow = String(row + 1)
    sceneryEl.style.gridColumn = String(col + 1)
    scene.appendChild(sceneryEl)
  }

  // Update the hint text with target name
  const hintEl = document.getElementById('peekaboo-enter-hint')
  if (hintEl) {
    hintEl.textContent = `The ${state.currentTarget.name} is hiding in the scene...`
  }
}

// ── Fog grid ──────────────────────────────────────────────────

export function renderGrid(state: PeekabooState): void {
  // Build scene behind fog
  buildSceneLayer(state)

  const grid = getFogGrid()
  grid.innerHTML = ''
  grid.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`

  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const revealed = state.grid[row][col]
      const cell = document.createElement('button')
      cell.type = 'button'
      cell.className = 'peekaboo-fog-cell'
      cell.dataset['peekabooRow'] = String(row)
      cell.dataset['peekabooCol'] = String(col)
      cell.dataset['revealed'] = String(revealed)
      cell.setAttribute(
        'aria-label',
        revealed ? `Revealed, row ${row + 1}, column ${col + 1}` : `Fog, row ${row + 1}, column ${col + 1}`,
      )
      cell.style.animationDelay = `${(row * state.cols + col) * 40}ms`
      if (revealed) {
        cell.classList.add('peekaboo-fog-cell--revealed')
      }
      grid.appendChild(cell)
    }
  }
}

// ── Cell reveal ───────────────────────────────────────────────

export function revealCellVisual(row: number, col: number): void {
  const grid = getFogGrid()
  const cell = grid.querySelector<HTMLButtonElement>(
    `[data-peekaboo-row="${row}"][data-peekaboo-col="${col}"]`,
  )
  if (!cell) return
  cell.dataset['revealed'] = 'true'
  cell.classList.add('peekaboo-fog-cell--revealed')
  cell.setAttribute('aria-label', `Revealed, row ${row + 1}, column ${col + 1}`)
}

// ── Scenery interaction ───────────────────────────────────────

export function revealSceneryInteractive(row: number, col: number): void {
  const scene = getSceneLayer()
  const sceneryBtn = scene.querySelector<HTMLButtonElement>(
    `[data-peekaboo-row="${row}"][data-peekaboo-col="${col}"][data-scenery="true"]`,
  )
  if (!sceneryBtn) return
  sceneryBtn.disabled = false
}

export function peekBehindVisual(row: number, col: number, found: boolean, target?: Target): void {
  const scene = getSceneLayer()
  const sceneryBtn = scene.querySelector<HTMLButtonElement>(
    `[data-peekaboo-row="${row}"][data-peekaboo-col="${col}"][data-scenery="true"]`,
  )
  if (!sceneryBtn) return

  sceneryBtn.disabled = true

  if (found && target) {
    sceneryBtn.textContent = target.emoji
    sceneryBtn.classList.add('peekaboo-scenery--found')
  } else {
    sceneryBtn.classList.add('peekaboo-scenery--peeked')
  }
}

// ── Found celebration ─────────────────────────────────────────

const CONFETTI_COUNT = 12
const CONFETTI_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']

export function renderFoundCelebration(target: Target): void {
  const emojiEl = getFoundTargetEmoji()
  const headingEl = getFoundHeading()
  emojiEl.textContent = target.emoji
  headingEl.textContent = `You found the ${target.name}!`

  // Add confetti particles
  const screen = getFoundScreen()
  // Remove any previous confetti
  screen.querySelectorAll('.peekaboo-confetti').forEach((el) => el.remove())

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const angle = (2 * Math.PI / CONFETTI_COUNT) * i
    const distance = 10 // rem
    const xPx = Math.cos(angle) * distance
    const yPx = Math.sin(angle) * distance - 2 // -2rem upward bias
    const particle = document.createElement('span')
    particle.className = 'peekaboo-confetti'
    particle.setAttribute('aria-hidden', 'true')
    particle.style.setProperty('--peekaboo-confetti-color', CONFETTI_COLORS[i % CONFETTI_COLORS.length])
    particle.style.setProperty('--peekaboo-confetti-x', `${xPx.toFixed(2)}rem`)
    particle.style.setProperty('--peekaboo-confetti-y', `${yPx.toFixed(2)}rem`)
    particle.style.setProperty('--peekaboo-confetti-delay', `${i * 60}ms`)
    screen.appendChild(particle)
  }
}

// ── Create renderer ───────────────────────────────────────────

export interface PeekabooRenderer {
  readonly root: HTMLElement
  showScreen: (screenId: string) => void
  renderMeetScreen: (target: Target) => void
  renderEnterAnimation: (target: Target) => void
  renderEnterScene: (state: PeekabooState) => void
  renderGrid: (state: PeekabooState) => void
  revealCellVisual: (row: number, col: number) => void
  revealSceneryInteractive: (row: number, col: number) => void
  peekBehindVisual: (row: number, col: number, found: boolean, target?: Target) => void
  renderFoundCelebration: (target: Target) => void
  getCellButton: (row: number, col: number) => HTMLButtonElement | null
  cleanup: () => void
}

export function createRenderer(root: HTMLElement): PeekabooRenderer {
  const documentRef = root.ownerDocument
  ensureRuntimeStyles(documentRef)
  root.classList.add('peekaboo-runtime-shell')

  // The root element becomes the runtime shell that wraps SSR-rendered screens.
  // We do NOT replace children -- the SSR-rendered HTML is already present.
  // The renderer queries and mutates existing DOM elements.

  const enterTimer: number | undefined = undefined

  const cleanup = (): void => {
    if (enterTimer !== undefined) {
      clearTimeout(enterTimer)
    }
    // Clean up confetti
    root.querySelectorAll('.peekaboo-confetti').forEach((el) => el.remove())
    // Clean up enter animation fly element
    root.querySelectorAll('.peekaboo-enter-fly').forEach((el) => el.remove())
    // Clear element cache
    gameAreaEl = null
    enterScreenEl = null
    enterSceneEl = null
    foundScreenEl = null
    sceneLayerEl = null
    fogGridEl = null
    meetTargetEmojiEl = null
    meetHeadingEl = null
    foundTargetEmojiEl = null
    foundHeadingEl = null
  }

  return {
    root,
    showScreen,
    renderMeetScreen,
    renderEnterScene,
    renderEnterAnimation: (target: Target) => {
      // Clear any previous timer
      const screen = getEnterScreen()
      const prevTimer = screen.dataset['peekabooEnterTimer']
      if (prevTimer) {
        clearTimeout(Number(prevTimer))
      }
      renderEnterAnimation(target)
    },
    renderGrid,
    revealCellVisual,
    revealSceneryInteractive,
    peekBehindVisual,
    renderFoundCelebration,
    getCellButton: (row, col) =>
      root.querySelector<HTMLButtonElement>(
        `[data-peekaboo-row="${row}"][data-peekaboo-col="${col}"]`,
      ),
    cleanup,
  }
}