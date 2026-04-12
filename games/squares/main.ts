import { bindMusicToggle, bindReduceMotionToggle, bindSfxToggle, isReducedMotionEnabled } from '../../client/preferences.js'
import { setupTabbedModal } from '../../client/modal.js'

import { announceMove, announcePatternChange, announceRestart, announceSolved } from './accessibility.js'
import { playMoveFeedback, playSolvedCelebration } from './animations.js'
import { setupInput } from './input.js'
import {
  createRenderer,
  SQUARES_CELL_SELECTOR,
  SQUARES_PATTERN_TOGGLE_SELECTOR,
  SQUARES_RESTART_BUTTON_SELECTOR,
  type SquaresRenderer,
} from './renderer.js'
import { applyMove, createInitialState, getAffectedCells, getHighScoreBucketKey, restartState, toggleActivePattern } from './state.js'
import {
  DEFAULT_SQUARES_MUSIC_PROFILE_ID,
  ensureAudioUnlocked,
  playMoveConfirmSound,
  playPatternSwitchSound,
  playWinCue,
  setSquaresMusicProfile,
  startSquaresMusic,
  type SquaresMusicProfileId,
} from './sounds.js'
import {
  SQUARES_BOARD_PRESETS,
  SQUARES_RULESETS,
  SQUARES_THEME_PRESETS,
  type SquaresBoardPresetId,
  type SquaresCoordinate,
  type SquaresRulesetId,
  type SquaresState,
  type SquaresThemePresetId,
} from './types.js'

type ScreenId = 'start-screen' | 'game-screen' | 'win-screen'

interface PendingSetup {
  presetId: SquaresBoardPresetId
  rulesetId: SquaresRulesetId
  themePresetId: SquaresThemePresetId
  musicProfileId: SquaresMusicProfileId
}

interface FocusDescriptor {
  kind: 'cell' | 'pattern-toggle' | 'restart' | 'menu' | 'none'
  coordinate: SquaresCoordinate | null
}

const GAME_SLUG = 'squares'
const HIGH_SCORE_PREFIX = 'squares-high-score:'
const MUSIC_PROFILE_KEY = 'squares-music-profile'

const defaultPreset = SQUARES_BOARD_PRESETS[0]

let currentScreen: ScreenId = 'start-screen'
let pendingSetup: PendingSetup = {
  presetId: defaultPreset.id,
  rulesetId: defaultPreset.recommendedRulesetId,
  themePresetId: defaultPreset.themePresetId,
  musicProfileId: loadStoredMusicProfile(),
}
let sessionState: SquaresState = createInitialState(pendingSetup.presetId, pendingSetup.rulesetId)
let renderer: SquaresRenderer | null = null
let settingsModal = { open() {}, close() {}, toggle() {} }
let hoveredCoordinate: SquaresCoordinate | null = null
let focusedCoordinate: SquaresCoordinate | null = null
let celebrationLocked = false

function loadStoredMusicProfile(): SquaresMusicProfileId {
  const stored = localStorage.getItem(MUSIC_PROFILE_KEY)
  return stored === 'tense' ? 'tense' : DEFAULT_SQUARES_MUSIC_PROFILE_ID
}

function byId<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id)
  return element instanceof HTMLElement ? (element as T) : null
}

function isSettingsOpen(): boolean {
  const modal = byId<HTMLElement>('settings-modal')
  return Boolean(modal && !modal.hidden)
}

function getPresetLabel(presetId: SquaresBoardPresetId): string {
  return SQUARES_BOARD_PRESETS.find((preset) => preset.id === presetId)?.label ?? defaultPreset.label
}

function getRulesetLabel(rulesetId: SquaresRulesetId): string {
  return SQUARES_RULESETS.find((ruleset) => ruleset.id === rulesetId)?.label ?? SQUARES_RULESETS[0].label
}

function getThemeLabel(themePresetId: SquaresThemePresetId): string {
  return SQUARES_THEME_PRESETS.find((preset) => preset.id === themePresetId)?.label ?? SQUARES_THEME_PRESETS[0].label
}

function bucketLabel(presetId: SquaresBoardPresetId, rulesetId: SquaresRulesetId): string {
  return `${getPresetLabel(presetId)} · ${getRulesetLabel(rulesetId)}`
}

function highScoreStorageKey(presetId: SquaresBoardPresetId, rulesetId: SquaresRulesetId): string {
  return `${HIGH_SCORE_PREFIX}${getHighScoreBucketKey(presetId, rulesetId)}`
}

function readHighScore(presetId: SquaresBoardPresetId, rulesetId: SquaresRulesetId): number | null {
  const stored = localStorage.getItem(highScoreStorageKey(presetId, rulesetId))
  if (!stored) {
    return null
  }

  const parsed = Number.parseInt(stored, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function writeHighScore(presetId: SquaresBoardPresetId, rulesetId: SquaresRulesetId, moveCount: number): boolean {
  const previous = readHighScore(presetId, rulesetId)
  if (previous !== null && previous <= moveCount) {
    return false
  }

  localStorage.setItem(highScoreStorageKey(presetId, rulesetId), String(moveCount))
  return true
}

function resetHighScore(presetId: SquaresBoardPresetId, rulesetId: SquaresRulesetId): void {
  localStorage.removeItem(highScoreStorageKey(presetId, rulesetId))
}

function formatHighScore(moveCount: number | null): string {
  return moveCount === null ? 'No high score yet' : `${moveCount} moves`
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

function applyTheme(themePresetId: SquaresThemePresetId): void {
  document.body.dataset['squaresTheme'] = themePresetId
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
    highScoreSummary: `High score: ${formatHighScore(readHighScore(sessionState.presetId, sessionState.rulesetId))}`,
  })
  restoreRuntimeFocus(previousFocus)
}

function updateHud(): void {
  const setupLabel = bucketLabel(sessionState.presetId, sessionState.rulesetId)
  const highScoreValue = formatHighScore(readHighScore(sessionState.presetId, sessionState.rulesetId))

  const setupNode = byId<HTMLElement>('hud-setup-label')
  const highScoreNode = byId<HTMLElement>('hud-high-score-value')
  const moveCountNode = byId<HTMLElement>('hud-move-count')
  const contextNode = byId<HTMLElement>('hud-high-score-context')

  if (setupNode) {
    setupNode.textContent = setupLabel
  }
  if (highScoreNode) {
    highScoreNode.textContent = highScoreValue
  }
  if (moveCountNode) {
    moveCountNode.textContent = String(sessionState.moveCount)
  }
  if (contextNode) {
    contextNode.textContent = `High score bucket: ${setupLabel}`
  }
}

function updateStartSummary(): void {
  const label = bucketLabel(pendingSetup.presetId, pendingSetup.rulesetId)
  const startSetupLabel = byId<HTMLElement>('start-setup-label')
  const startThemeLabel = byId<HTMLElement>('start-theme-label')
  const startHighScoreLabel = byId<HTMLElement>('start-high-score-label')
  const startHighScoreValue = byId<HTMLElement>('start-high-score-value')

  if (startSetupLabel) {
    startSetupLabel.textContent = label
  }
  if (startThemeLabel) {
    startThemeLabel.textContent = getThemeLabel(pendingSetup.themePresetId)
  }
  if (startHighScoreLabel) {
    startHighScoreLabel.textContent = `High score for ${label}`
  }
  if (startHighScoreValue) {
    startHighScoreValue.textContent = formatHighScore(readHighScore(pendingSetup.presetId, pendingSetup.rulesetId))
  }
}

function updateSettingsSummary(): void {
  const label = bucketLabel(pendingSetup.presetId, pendingSetup.rulesetId)
  const highScoreLabel = byId<HTMLElement>('settings-high-score-label')
  const highScoreValue = byId<HTMLElement>('settings-high-score-value')

  if (highScoreLabel) {
    highScoreLabel.textContent = `High score for ${label}`
  }
  if (highScoreValue) {
    highScoreValue.textContent = formatHighScore(readHighScore(pendingSetup.presetId, pendingSetup.rulesetId))
  }
}

function updateWinSummary(isNewHighScore = false): void {
  const label = bucketLabel(sessionState.presetId, sessionState.rulesetId)
  const winSummary = byId<HTMLElement>('win-summary')
  const winHighScoreContext = byId<HTMLElement>('win-high-score-context')
  const winHighScoreValue = byId<HTMLElement>('win-high-score-value')

  if (winSummary) {
    winSummary.textContent = isNewHighScore
      ? `Solved in ${sessionState.moveCount} moves. New high score.`
      : `Solved in ${sessionState.moveCount} moves.`
  }
  if (winHighScoreContext) {
    winHighScoreContext.textContent = `High score for ${label}`
  }
  if (winHighScoreValue) {
    winHighScoreValue.textContent = formatHighScore(readHighScore(sessionState.presetId, sessionState.rulesetId))
  }
}

function syncSelectors(): void {
  const boardPresetSelect = byId<HTMLSelectElement>('board-preset-select')
  const rulesetSelect = byId<HTMLSelectElement>('ruleset-select')
  const themePresetSelect = byId<HTMLSelectElement>('theme-preset-select')
  const musicProfileSelect = byId<HTMLSelectElement>('music-profile-select')

  if (boardPresetSelect) {
    boardPresetSelect.value = pendingSetup.presetId
  }
  if (rulesetSelect) {
    rulesetSelect.value = pendingSetup.rulesetId
  }
  if (themePresetSelect) {
    themePresetSelect.value = pendingSetup.themePresetId
  }
  if (musicProfileSelect) {
    musicProfileSelect.value = pendingSetup.musicProfileId
  }
}

function refreshHighScoreUi(): void {
  updateStartSummary()
  updateSettingsSummary()
  updateHud()
  updateWinSummary()
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
  sessionState = createInitialState(pendingSetup.presetId, pendingSetup.rulesetId)
  focusedCoordinate = { row: 0, column: 0 }
  hoveredCoordinate = null
  celebrationLocked = false
  applyTheme(pendingSetup.themePresetId)
  setSquaresMusicProfile(pendingSetup.musicProfileId)
  startSquaresMusic(pendingSetup.musicProfileId)
  showScreen('game-screen')
  renderGameBoard()
  refreshHighScoreUi()
  setStatusMessage(`High score for ${bucketLabel(sessionState.presetId, sessionState.rulesetId)} is ${formatHighScore(readHighScore(sessionState.presetId, sessionState.rulesetId))}.`)
  requestAnimationFrame(() => {
    focusGameBoard()
  })
}

function replayCurrentScramble(): void {
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
  updateStartSummary()
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('start-btn')?.focus({ preventScroll: true })
  })
}

async function settleSolvedState(): Promise<void> {
  if (!renderer) {
    return
  }

  celebrationLocked = true
  const isNewHighScore = writeHighScore(sessionState.presetId, sessionState.rulesetId, sessionState.moveCount)
  updateHud()
  updateSettingsSummary()
  updateStartSummary()
  playWinCue()
  announceSolved(sessionState.moveCount, isNewHighScore)

  const preset = SQUARES_BOARD_PRESETS.find((candidate) => candidate.id === sessionState.presetId) ?? defaultPreset
  const cells = Array.from(renderer.boardElement.querySelectorAll<HTMLElement>(SQUARES_CELL_SELECTOR)).map((element) => ({
    coordinate: {
      row: Number.parseInt(element.dataset['row'] ?? '0', 10),
      column: Number.parseInt(element.dataset['column'] ?? '0', 10),
    },
    element,
  }))

  await playSolvedCelebration(cells, sessionState.board, preset.celebrationPatternId, {
    reducedMotion: isReducedMotionEnabled(),
  })

  hoveredCoordinate = null
  focusedCoordinate = null
  renderGameBoard()
  updateWinSummary(isNewHighScore)
  showScreen('win-screen')
  celebrationLocked = false
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('play-again-btn')?.focus({ preventScroll: true })
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

  const affectedCoordinates = getAffectedCells(sessionState.board, coordinate, sessionState.lastMove?.patternId ?? sessionState.activePatternId)
  const affectedCells = affectedCoordinates
    .map((affectedCoordinate) => renderer?.getCellButton(affectedCoordinate) ?? null)
    .filter((cell): cell is HTMLButtonElement => cell instanceof HTMLButtonElement)

  playMoveConfirmSound()
  await playMoveFeedback(affectedCells, { reducedMotion: isReducedMotionEnabled() })
  announceMove(sessionState.lastMove?.patternId ?? sessionState.activePatternId, sessionState.moveCount)
  updateHud()

  if (sessionState.phase === 'solved') {
    await settleSolvedState()
  }
}

function handlePatternToggle(): void {
  if (currentScreen !== 'game-screen' || celebrationLocked || isSettingsOpen()) {
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

  replayCurrentScramble()
}

function handleSetupChange(): void {
  const boardPresetSelect = byId<HTMLSelectElement>('board-preset-select')
  const rulesetSelect = byId<HTMLSelectElement>('ruleset-select')
  const themePresetSelect = byId<HTMLSelectElement>('theme-preset-select')
  const musicProfileSelect = byId<HTMLSelectElement>('music-profile-select')

  const nextPresetId = (boardPresetSelect?.value as SquaresBoardPresetId | undefined) ?? pendingSetup.presetId
  const nextRulesetId = (rulesetSelect?.value as SquaresRulesetId | undefined) ?? pendingSetup.rulesetId
  const nextThemePresetId = (themePresetSelect?.value as SquaresThemePresetId | undefined)
    ?? (SQUARES_BOARD_PRESETS.find((preset) => preset.id === nextPresetId)?.themePresetId ?? pendingSetup.themePresetId)
  const nextMusicProfileId = (musicProfileSelect?.value as SquaresMusicProfileId | undefined) ?? pendingSetup.musicProfileId

  pendingSetup = {
    presetId: nextPresetId,
    rulesetId: nextRulesetId,
    themePresetId: nextThemePresetId,
    musicProfileId: nextMusicProfileId,
  }

  localStorage.setItem(MUSIC_PROFILE_KEY, pendingSetup.musicProfileId)
  applyTheme(pendingSetup.themePresetId)
  setSquaresMusicProfile(pendingSetup.musicProfileId)
  syncSelectors()
  updateStartSummary()
  updateSettingsSummary()
  setStatusMessage(`High score for ${bucketLabel(pendingSetup.presetId, pendingSetup.rulesetId)} is ${formatHighScore(readHighScore(pendingSetup.presetId, pendingSetup.rulesetId))}.`)
}

function bindSetupSelectors(): void {
  const boardPresetSelect = byId<HTMLSelectElement>('board-preset-select')
  const rulesetSelect = byId<HTMLSelectElement>('ruleset-select')
  const themePresetSelect = byId<HTMLSelectElement>('theme-preset-select')
  const musicProfileSelect = byId<HTMLSelectElement>('music-profile-select')

  boardPresetSelect?.addEventListener('change', () => {
    const selectedPreset = SQUARES_BOARD_PRESETS.find((preset) => preset.id === boardPresetSelect.value)
    if (selectedPreset) {
      const themeSelect = byId<HTMLSelectElement>('theme-preset-select')
      if (themeSelect) {
        themeSelect.value = selectedPreset.themePresetId
      }
    }
    handleSetupChange()
  })
  rulesetSelect?.addEventListener('change', handleSetupChange)
  themePresetSelect?.addEventListener('change', handleSetupChange)
  musicProfileSelect?.addEventListener('change', () => {
    ensureAudioUnlocked()
    handleSetupChange()
    if (currentScreen === 'game-screen' || currentScreen === 'win-screen') {
      startSquaresMusic(pendingSetup.musicProfileId)
    }
  })
}

function bindScreenButtons(): void {
  byId<HTMLButtonElement>('start-over-btn')?.addEventListener('click', () => {
    ensureAudioUnlocked()
    returnToStart()
  })

  byId<HTMLButtonElement>('high-score-reset-btn')?.addEventListener('click', () => {
    resetHighScore(pendingSetup.presetId, pendingSetup.rulesetId)
    updateStartSummary()
    updateSettingsSummary()
    updateHud()
    updateWinSummary()
    setStatusMessage(`High score cleared for ${bucketLabel(pendingSetup.presetId, pendingSetup.rulesetId)}.`, 'game-feedback')
  })

  document.addEventListener('restart', () => {
    if (currentScreen === 'start-screen') {
      returnToStart()
      return
    }

    replayCurrentScramble()
  })
}

function bindRuntimeToggles(): void {
  bindMusicToggle(GAME_SLUG, byId<HTMLInputElement>('music-enabled-toggle'), byId<HTMLElement>('music-enabled-help'))
  bindSfxToggle(GAME_SLUG, byId<HTMLInputElement>('sfx-enabled-toggle'), byId<HTMLElement>('sfx-enabled-help'))
  bindReduceMotionToggle(byId<HTMLInputElement>('reduce-motion-toggle'), byId<HTMLElement>('reduce-motion-help'))

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
  settingsModal = setupTabbedModal()

  applyTheme(pendingSetup.themePresetId)
  setSquaresMusicProfile(pendingSetup.musicProfileId)
  syncSelectors()
  bindSetupSelectors()
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
  renderGameBoard()
  refreshHighScoreUi()
  syncModalState()
  syncMenuRestartAvailability()
  requestAnimationFrame(() => {
    byId<HTMLButtonElement>('start-btn')?.focus({ preventScroll: true })
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}