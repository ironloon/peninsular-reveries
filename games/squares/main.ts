import { isReducedMotionEnabled } from '../../client/preferences.js'
import { setupGameMenu } from '../../client/game-menu.js'

import { announceMove, announcePatternChange, announceRestart, announceSolved } from './accessibility.js'
import { playMoveFeedback, playSolvedCelebration, randomCelebrationPatternId } from './animations.js'
import { setupInput } from './input.js'
import {
  createRenderer,
  SQUARES_CELL_SELECTOR,
  SQUARES_PATTERN_TOGGLE_SELECTOR,
  SQUARES_RESTART_BUTTON_SELECTOR,
  type SquaresRenderer,
} from './renderer.js'
import { applyMove, createInitialState, getAffectedCells, getHighScoreKey, getModeLabel, restartState, toggleActivePattern } from './state.js'
import {
  ensureAudioUnlocked,
  playMoveConfirmSound,
  playPatternSwitchSound,
  playWinCue,
  startSquaresMusic,
} from './sounds.js'
import {
  SQUARES_MODES,
  type SquaresCoordinate,
  type SquaresModeId,
  type SquaresState,
} from './types.js'

type ScreenId = 'start-screen' | 'game-screen' | 'win-screen'

interface FocusDescriptor {
  kind: 'cell' | 'pattern-toggle' | 'restart' | 'menu' | 'none'
  coordinate: SquaresCoordinate | null
}

let currentScreen: ScreenId = 'start-screen'
let activeModeId: SquaresModeId = 'plus-x'
let sessionState: SquaresState = createInitialState(activeModeId)
let renderer: SquaresRenderer | null = null
let settingsModal = { open() {}, close() {}, toggle() {} }
let hoveredCoordinate: SquaresCoordinate | null = null
let focusedCoordinate: SquaresCoordinate | null = null
let celebrationLocked = false

function byId<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id)
  return element instanceof HTMLElement ? (element as T) : null
}

function isSettingsOpen(): boolean {
  const modal = byId<HTMLElement>('settings-modal')
  return Boolean(modal && !modal.hidden)
}

function readHighScore(modeId: SquaresModeId): number | null {
  const stored = localStorage.getItem(getHighScoreKey(modeId))
  if (!stored) {
    return null
  }
  const parsed = Number.parseInt(stored, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function writeHighScore(modeId: SquaresModeId, moveCount: number): boolean {
  const previous = readHighScore(modeId)
  if (previous !== null && previous <= moveCount) {
    return false
  }
  localStorage.setItem(getHighScoreKey(modeId), String(moveCount))
  return true
}

function resetHighScore(modeId: SquaresModeId): void {
  localStorage.removeItem(getHighScoreKey(modeId))
}

function formatHighScore(moveCount: number | null): string {
  return moveCount === null ? 'No record yet' : `${moveCount} moves`
}

function sameCoordinate(left: SquaresCoordinate | null, right: SquaresCoordinate | null): boolean {
  if (left === null && right === null) {
    return true
  }
  return Boolean(left && right && left.row === right.row && left.column === right.column)
}

function setStatusMessage(message: string, regionId: 'game-status' | 'game-feedback' = 'game-status'): void {
  const region = byId<HTMLElement>(regionId)
  if (!region) {
    return
  }
  region.textContent = ''
  requestAnimationFrame(() => {
    region.textContent = message
  })
}

function syncModalState(): void {
  document.body.classList.toggle('modal-open', isSettingsOpen())
}

function syncMenuRestartAvailability(): void {
  const restartButton = byId<HTMLButtonElement>('restart-btn')
  if (restartButton) {
    restartButton.disabled = currentScreen === 'start-screen'
  }
}

function showScreen(screenId: ScreenId): void {
  currentScreen = screenId
  document.body.dataset['squaresScreen'] = screenId

  for (const screen of Array.from(document.querySelectorAll<HTMLElement>('.screen'))) {
    const isActive = screen.id === screenId
    screen.classList.toggle('active', isActive)
    screen.classList.toggle('leaving', false)
    screen.setAttribute('aria-hidden', String(!isActive))
  }

  syncMenuRestartAvailability()
}

function describeActiveElement(): FocusDescriptor {
  const activeElement = document.activeElement
  if (!(activeElement instanceof HTMLElement)) {
    return { kind: 'none', coordinate: null }
  }

  if (activeElement.matches(SQUARES_CELL_SELECTOR)) {
    const row = Number.parseInt(activeElement.dataset['row'] ?? '', 10)
    const column = Number.parseInt(activeElement.dataset['column'] ?? '', 10)
    if (Number.isFinite(row) && Number.isFinite(column)) {
      return { kind: 'cell', coordinate: { row, column } }
    }
  }

  if (activeElement.matches(SQUARES_PATTERN_TOGGLE_SELECTOR)) {
    return { kind: 'pattern-toggle', coordinate: null }
  }

  if (activeElement.matches(SQUARES_RESTART_BUTTON_SELECTOR)) {
    return { kind: 'restart', coordinate: null }
  }

  if (activeElement.matches('[data-squares-menu-button="true"]')) {
    return { kind: 'menu', coordinate: null }
  }

  return { kind: 'none', coordinate: null }
}

function restoreRuntimeFocus(previousFocus: FocusDescriptor): void {
  if (!renderer || currentScreen !== 'game-screen') {
    return
  }

  switch (previousFocus.kind) {
    case 'cell':
      if (previousFocus.coordinate) {
        renderer.getCellButton(previousFocus.coordinate)?.focus({ preventScroll: true })
      }
      break
    case 'pattern-toggle':
      renderer.patternToggleButton.focus({ preventScroll: true })
      break
    case 'restart':
      renderer.restartButton.focus({ preventScroll: true })
      break
    default:
      break
  }
}

function renderGameBoard(): void {
  if (!renderer) {
    return
  }

  const previousFocus = describeActiveElement()
  renderer.render({
    state: sessionState,
    focusedCoordinate,
    hoveredCoordinate,
    reducedMotion: isReducedMotionEnabled(),
    highScoreSummary: `Best: ${formatHighScore(readHighScore(sessionState.modeId))}`,
  })
  restoreRuntimeFocus(previousFocus)
}

function updateHud(): void {
  const modeLabel = getModeLabel(sessionState.modeId)
  const highScoreValue = formatHighScore(readHighScore(sessionState.modeId))

  const modeLabelNode = byId<HTMLElement>('hud-mode-label')
  const highScoreNode = byId<HTMLElement>('hud-high-score-value')
  const moveCountNode = byId<HTMLElement>('hud-move-count')

  if (modeLabelNode) {
    modeLabelNode.textContent = modeLabel
  }
  if (highScoreNode) {
    highScoreNode.textContent = highScoreValue
  }
  if (moveCountNode) {
    moveCountNode.textContent = String(sessionState.moveCount)
  }
}

function refreshAllHighScores(): void {
  for (const mode of SQUARES_MODES) {
    const value = formatHighScore(readHighScore(mode.id))
    const startNode = byId<HTMLElement>(`start-high-${mode.id}`)
    const settingsNode = byId<HTMLElement>(`settings-high-${mode.id === '1x1' ? '1x1' : 'plusx'}`)
    if (startNode) {
      startNode.textContent = value
    }
    if (settingsNode) {
      settingsNode.textContent = value
    }
  }
  updateHud()
}

function updateWinSummary(isNewHighScore = false): void {
  const winSummary = byId<HTMLElement>('win-summary')
  const winHighScoreValue = byId<HTMLElement>('win-high-score-value')

  if (winSummary) {
    winSummary.textContent = isNewHighScore
      ? `Solved in ${sessionState.moveCount} moves. New record!`
      : `Solved in ${sessionState.moveCount} moves.`
  }
  if (winHighScoreValue) {
    winHighScoreValue.textContent = formatHighScore(readHighScore(sessionState.modeId))
  }
}

function focusGameBoard(): void {
  if (!renderer) {
    return
  }

  const firstCell = renderer.getCellButton({ row: 0, column: 0 })
  firstCell?.focus({ preventScroll: true })
}

function startSession(): void {
  ensureAudioUnlocked()
  sessionState = createInitialState(activeModeId)
  focusedCoordinate = { row: 0, column: 0 }
  hoveredCoordinate = null
  celebrationLocked = false
  startSquaresMusic()
  showScreen('game-screen')
  renderGameBoard()
  refreshAllHighScores()
  setStatusMessage(`${getModeLabel(activeModeId)} mode. Best: ${formatHighScore(readHighScore(activeModeId))}.`)
  requestAnimationFrame(() => {
    focusGameBoard()
  })
}

function replayCurrentPuzzle(): void {
  ensureAudioUnlocked()
  sessionState = restartState(sessionState)
  focusedCoordinate = { row: 0, column: 0 }
  hoveredCoordinate = null
  celebrationLocked = false
  showScreen('game-screen')
  renderGameBoard()
  updateHud()
  announceRestart()
  requestAnimationFrame(() => {
    focusGameBoard()
  })
}

function returnToStart(): void {
  celebrationLocked = false
  showScreen('start-screen')
  refreshAllHighScores()
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('start-plus-x-btn')?.focus({ preventScroll: true })
  })
}

async function settleSolvedState(): Promise<void> {
  if (!renderer) {
    return
  }

  celebrationLocked = true
  const isNewHighScore = writeHighScore(sessionState.modeId, sessionState.moveCount)
  updateHud()
  refreshAllHighScores()
  playWinCue()
  announceSolved(sessionState.moveCount, isNewHighScore)

  const celebrationPatternId = randomCelebrationPatternId()
  const cells = Array.from(renderer.boardElement.querySelectorAll<HTMLElement>(SQUARES_CELL_SELECTOR)).map((element) => ({
    coordinate: {
      row: Number.parseInt(element.dataset['row'] ?? '0', 10),
      column: Number.parseInt(element.dataset['column'] ?? '0', 10),
    },
    element,
  }))

  await playSolvedCelebration(cells, sessionState.board, celebrationPatternId, {
    reducedMotion: isReducedMotionEnabled(),
  })

  hoveredCoordinate = null
  focusedCoordinate = null
  renderGameBoard()
  updateWinSummary(isNewHighScore)
  showScreen('win-screen')
  celebrationLocked = false
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('replay-btn')?.focus({ preventScroll: true })
  })
}

async function handleMove(coordinate: SquaresCoordinate): Promise<void> {
  if (currentScreen !== 'game-screen' || celebrationLocked || isSettingsOpen()) {
    return
  }

  const nextState = applyMove(sessionState, coordinate)
  if (nextState === sessionState) {
    return
  }

  sessionState = nextState
  focusedCoordinate = coordinate
  hoveredCoordinate = coordinate
  renderGameBoard()

  const patternId = sessionState.lastMove?.patternId
  if (patternId) {
    const affectedCoordinates = getAffectedCells(sessionState.board, coordinate, patternId)
    const affectedCells = affectedCoordinates
      .map((affectedCoordinate) => renderer?.getCellButton(affectedCoordinate) ?? null)
      .filter((cell): cell is HTMLButtonElement => cell instanceof HTMLButtonElement)
    await playMoveFeedback(affectedCells, { reducedMotion: isReducedMotionEnabled() })
  } else {
    const singleCell = renderer?.getCellButton(coordinate)
    if (singleCell) {
      await playMoveFeedback([singleCell], { reducedMotion: isReducedMotionEnabled() })
    }
  }

  playMoveConfirmSound()

  if (sessionState.modeId === '1x1') {
    setStatusMessage(`Move ${sessionState.moveCount}.`)
  } else {
    announceMove(sessionState.lastMove?.patternId ?? sessionState.activePatternId, sessionState.moveCount)
  }

  updateHud()

  if (sessionState.phase === 'solved') {
    await settleSolvedState()
  }
}

function handlePatternToggle(): void {
  if (currentScreen !== 'game-screen' || celebrationLocked || isSettingsOpen()) {
    return
  }

  if (sessionState.modeId === '1x1') {
    return
  }

  const nextState = toggleActivePattern(sessionState)
  if (nextState === sessionState) {
    return
  }

  sessionState = nextState
  renderGameBoard()
  playPatternSwitchSound()
  announcePatternChange(sessionState.activePatternId)
}

function handleManagedRestart(): void {
  if (currentScreen === 'start-screen') {
    startSession()
    return
  }

  replayCurrentPuzzle()
}

function bindScreenButtons(): void {
  byId<HTMLButtonElement>('start-1x1-btn')?.addEventListener('click', () => {
    activeModeId = '1x1'
    startSession()
  })

  byId<HTMLButtonElement>('start-plus-x-btn')?.addEventListener('click', () => {
    activeModeId = 'plus-x'
    startSession()
  })

  byId<HTMLButtonElement>('replay-btn')?.addEventListener('click', () => {
    replayCurrentPuzzle()
  })

  byId<HTMLButtonElement>('new-puzzle-btn')?.addEventListener('click', () => {
    startSession()
  })

  byId<HTMLButtonElement>('change-mode-btn')?.addEventListener('click', () => {
    returnToStart()
  })

  byId<HTMLButtonElement>('high-score-reset-1x1-btn')?.addEventListener('click', () => {
    resetHighScore('1x1')
    refreshAllHighScores()
    setStatusMessage('1\u00d71 record cleared.', 'game-feedback')
  })

  byId<HTMLButtonElement>('high-score-reset-plusx-btn')?.addEventListener('click', () => {
    resetHighScore('plus-x')
    refreshAllHighScores()
    setStatusMessage('+/\u00d7 record cleared.', 'game-feedback')
  })

  document.addEventListener('restart', () => {
    if (currentScreen === 'start-screen') {
      returnToStart()
      return
    }

    replayCurrentPuzzle()
  })
}

function bindRuntimeToggles(): void {
  window.addEventListener('reveries:reduce-motion-change', () => {
    renderGameBoard()
  })
}

function bindModalObservers(): void {
  const modal = byId<HTMLElement>('settings-modal')
  if (!modal) {
    return
  }

  const observer = new MutationObserver(() => {
    syncModalState()
    syncMenuRestartAvailability()
  })
  observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] })
}

function init(): void {
  renderer = createRenderer(byId<HTMLElement>('squares-runtime-root') ?? document.body)
  settingsModal = setupGameMenu()

  bindRuntimeToggles()
  bindScreenButtons()
  bindModalObservers()

  setupInput({
    onMoveFocus: (coordinate) => {
      const focusChanged = !sameCoordinate(focusedCoordinate, coordinate)
      focusedCoordinate = coordinate
      if (currentScreen === 'game-screen' && coordinate && focusChanged) {
        renderGameBoard()
      }
    },
    onPlayCell: (coordinate) => {
      void handleMove(coordinate)
    },
    onTogglePattern: () => {
      ensureAudioUnlocked()
      handlePatternToggle()
    },
    onOpenMenu: () => {
      ensureAudioUnlocked()
      if (!isSettingsOpen()) {
        settingsModal.open()
      }
    },
    onRestartCurrentPuzzle: () => {
      handleManagedRestart()
    },
    onPreviewCoordinateChange: (coordinate) => {
      const hoverChanged = !sameCoordinate(hoveredCoordinate, coordinate)
      hoveredCoordinate = coordinate
      if (currentScreen === 'game-screen' && hoverChanged) {
        renderGameBoard()
      }
    },
    onGamepadConnectionChange: (connected) => {
      document.body.dataset['squaresGamepad'] = String(connected)
    },
  })

  showScreen('start-screen')
  refreshAllHighScores()
  syncModalState()
  syncMenuRestartAvailability()
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('start-plus-x-btn')?.focus({ preventScroll: true })
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}