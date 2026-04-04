import { selectPuzzles } from './puzzles.js'
import { DIFFICULTIES } from './types.js'
import type { Difficulty, GameState, Puzzle, SceneItem } from './types.js'
import {
  createInitialState,
  collectLetter,
  swapLetters,
  checkAnswer,
  advancePuzzle,
  resetGame,
  selectTile,
} from './state.js'
import {
  renderScene,
  renderLetterSlots,
  renderGameHeader,
  showScreen,
  showCelebrationPopup,
  slideSceneTransition,
  renderWinScreen,
  setCheckButtonEnabled,
} from './renderer.js'
import { setupSettingsModal } from './settings-modal.js'
import { setupInput } from './input.js'
import type { InputCallbacks } from './input.js'
import {
  announceLetterCollected,
  announceDistractorClicked,
  announceLetterSelected,
  announceLettersSwapped,
  announceWrongAnswer,
  announceCorrectAnswer,
  announceNextPuzzle,
  announceGameWin,
  moveFocusAfterTransition,
  moveFocusToFirstSceneItem,
} from './accessibility.js'
import {
  animateCollectPop,
  animateItemShake,
  animateTileAppear,
  animateTileWrongShake,
  animateFlyToNotepad,
  isReducedMotion,
} from './animations.js'
import {
  sfxCollect,
  sfxDistractor,
  sfxCorrect,
  sfxWrong,
  sfxWin,
  sfxButton,
  sfxSwap,
  ensureAudioUnlocked,
  getMusicEnabled,
  setMusicEnabled,
  syncMusicPlayback,
} from './sounds.js'

const DEFAULT_DIFFICULTY: Difficulty = 'easy'

function parseDifficulty(value: string | null | undefined): Difficulty {
  return DIFFICULTIES.find((difficulty) => difficulty === value) ?? DEFAULT_DIFFICULTY
}

// ── Puzzle Selection ──────────────────────────────────────
let activePuzzles: readonly Puzzle[] = selectPuzzles(DEFAULT_DIFFICULTY)
let activeDifficulty: Difficulty = DEFAULT_DIFFICULTY

// ── State Management ──────────────────────────────────────
let gameState: GameState = createInitialState(activePuzzles.length, false)

function getState(): GameState { return gameState }
function setState(newState: GameState): void { gameState = newState }
function currentPuzzle(): Puzzle { return activePuzzles[gameState.currentPuzzleIndex] }

// ── DOM Element References ────────────────────────────────
const sceneEl = document.getElementById('scene')!
const slotsEl = document.getElementById('letter-slots')!
const pendingFlightIndices = new Set<number>()

function renderCollectedLetters(): void {
  renderLetterSlots(getState(), currentPuzzle(), slotsEl, { pendingIndices: pendingFlightIndices })
}

function updateCheckButtonState(): void {
  setCheckButtonEnabled(
    pendingFlightIndices.size === 0
    && getState().collectedLetters.length === currentPuzzle().answer.length,
  )
}

function syncSettingsForm(): void {
  const difficultySelect = document.getElementById('puzzle-difficulty-select') as HTMLSelectElement | null
  const musicToggle = document.getElementById('music-enabled-toggle') as HTMLInputElement | null

  if (difficultySelect) difficultySelect.value = activeDifficulty
  if (musicToggle) musicToggle.checked = getMusicEnabled()
}

// ── Helper: Refresh Game Screen ───────────────────────────
function refreshGameScreen(): void {
  const puzzle = currentPuzzle()
  const state = getState()
  renderScene(puzzle, state, sceneEl)
  renderCollectedLetters()
  renderGameHeader(state, puzzle, state.currentPuzzleIndex, activePuzzles.length)
  updateCheckButtonState()
}

// ── Game Flow — InputCallbacks ────────────────────────────

function onStartGame(): void {
  ensureAudioUnlocked()
  sfxButton()
  const difficultySelect = document.getElementById('puzzle-difficulty-select') as HTMLSelectElement | null

  activeDifficulty = parseDifficulty(difficultySelect?.value)
  activePuzzles = selectPuzzles(activeDifficulty)

  // Reset game state for new puzzle set
  pendingFlightIndices.clear()
  gameState = createInitialState(activePuzzles.length, false)

  refreshGameScreen()
  showScreen('game-screen')
  announceNextPuzzle(
    getState().currentPuzzleIndex + 1,
    activePuzzles.length,
    currentPuzzle().prompt,
  )
  moveFocusToFirstSceneItem(300)
}

function onLetterCollected(item: SceneItem): void {
  ensureAudioUnlocked()
  sfxCollect()
  setState(collectLetter(getState(), item.char!, item.id))

  const sceneItem = sceneEl.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement | null
  sceneItem?.classList.add('collected')
  const collectedIndex = getState().collectedLetters.length - 1
  const shouldAnimateFlight = !isReducedMotion() && !!sceneItem

  if (shouldAnimateFlight) {
    pendingFlightIndices.add(collectedIndex)
    sceneItem?.classList.add('is-flying-letter')
  }

  renderCollectedLetters()
  const newTile = slotsEl.querySelector(`[data-index="${collectedIndex}"]`) as HTMLElement | null

  if (isReducedMotion()) {
    // Instant collection — no flight animation
    if (newTile) animateTileAppear(newTile)
  } else if (sceneItem && newTile) {
    animateFlyToNotepad(sceneItem, newTile).then(() => {
      pendingFlightIndices.delete(collectedIndex)
      sceneItem.classList.remove('is-flying-letter')
      renderCollectedLetters()
      const arrivedTile = slotsEl.querySelector(`[data-index="${collectedIndex}"]`) as HTMLElement | null
      if (arrivedTile) animateTileAppear(arrivedTile)
      updateCheckButtonState()
    })
  } else if (sceneItem) {
    pendingFlightIndices.delete(collectedIndex)
    sceneItem.classList.remove('is-flying-letter')
    renderCollectedLetters()
    animateCollectPop(sceneItem)
    const arrivedTile = slotsEl.querySelector(`[data-index="${collectedIndex}"]`) as HTMLElement | null
    if (arrivedTile) animateTileAppear(arrivedTile)
  }

  announceLetterCollected(
    item.char!,
    item.label,
    getState().collectedLetters.length,
    currentPuzzle().answer.length,
  )

  updateCheckButtonState()
  renderGameHeader(getState(), currentPuzzle(), getState().currentPuzzleIndex, activePuzzles.length)

  // Keep focus on current position — don't auto-advance
  // The collected item becomes pointer-events:none, so update tabindex on remaining items
  if (sceneItem) {
    sceneItem.tabIndex = -1
    // Focus nearest uncollected item without auto-advancing
    const uncollected = Array.from(sceneEl.querySelectorAll('.scene-item:not(.collected)')) as HTMLElement[]
    if (uncollected.length > 0) {
      for (const el of uncollected) el.tabIndex = -1
      const nextLetter = uncollected.find((el) => el.dataset.itemType === 'letter') ?? uncollected[0]
      nextLetter.tabIndex = 0
    }
  }
}

function onDistractorClicked(item: SceneItem): void {
  sfxDistractor()
  if (isReducedMotion()) {
    // No animation fallback — accessibility announcement handles feedback
  } else {
    const sceneItem = sceneEl.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement | null
    const card = sceneItem?.querySelector('.scene-visual') as HTMLElement | null
    if (card) animateItemShake(card)
  }
  announceDistractorClicked(item.label)
}

function onTileSelected(index: number): void {
  const prevState = getState()
  setState(selectTile(prevState, index))
  renderCollectedLetters()

  if (getState().selectedTileIndex !== null) {
    announceLetterSelected(
      getState().collectedLetters[index].char,
      index + 1,
    )
  } else if (prevState.selectedTileIndex !== null && prevState.selectedTileIndex !== index) {
    // A swap happened through selectTile
    const letters = getState().collectedLetters.map(l => l.char)
    announceLettersSwapped(
      letters[prevState.selectedTileIndex],
      letters[index],
      letters,
    )
  }
}

function onLettersSwapped(indexA: number, indexB: number): void {
  sfxSwap()
  setState(swapLetters(getState(), indexA, indexB))
  renderCollectedLetters()

  const letters = getState().collectedLetters.map(l => l.char)
  announceLettersSwapped(letters[indexA], letters[indexB], letters)

  // Refocus the tile at the swapped position
  requestAnimationFrame(() => {
    const tile = slotsEl.querySelector(`[data-index="${indexB}"]`) as HTMLElement | null
    if (tile) tile.focus()
  })
}

function onCheckAnswer(): void {
  const { correct, newState } = checkAnswer(getState(), currentPuzzle())
  setState(newState)

  if (!correct) {
    sfxWrong()
    if (isReducedMotion()) {
      // No animation fallback — accessibility announcement handles feedback
    } else {
      const tiles = Array.from(slotsEl.querySelectorAll('.letter-tile')) as HTMLElement[]
      animateTileWrongShake(tiles)
    }
    announceWrongAnswer()
    return
  }

  sfxCorrect()
  announceCorrectAnswer(currentPuzzle().answer)

  const isLastPuzzle = getState().currentPuzzleIndex >= activePuzzles.length - 1
  if (isLastPuzzle) {
    sfxWin()
    renderWinScreen(getState())
    showScreen('win-screen')
    announceGameWin(getState().score)
    moveFocusAfterTransition('replay-btn', 300)
  } else {
    const solvedWord = currentPuzzle().answer
    showCelebrationPopup(solvedWord, () => {
      slideSceneTransition(
        () => {
          pendingFlightIndices.clear()
          setState(advancePuzzle(getState()))
          refreshGameScreen()
        },
        () => {
          announceNextPuzzle(
            getState().currentPuzzleIndex + 1,
            activePuzzles.length,
            currentPuzzle().prompt,
          )
          moveFocusToFirstSceneItem(300)
        },
      )
    })
  }
}

function onNextPuzzle(): void {
  pendingFlightIndices.clear()
  setState(advancePuzzle(getState()))
  refreshGameScreen()
  showScreen('game-screen')
  announceNextPuzzle(
    getState().currentPuzzleIndex + 1,
    activePuzzles.length,
    currentPuzzle().prompt,
  )
  moveFocusToFirstSceneItem(300)
}

function onPlayAgain(): void {
  sfxButton()
  pendingFlightIndices.clear()
  setState(resetGame(getState()))
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 300)
}

// ── Initialization ────────────────────────────────────────

const callbacks: InputCallbacks = {
  onStartGame,
  onLetterCollected,
  onDistractorClicked,
  onTileSelected,
  onLettersSwapped,
  onCheckAnswer,
  onNextPuzzle,
  onPlayAgain,
}

syncSettingsForm()
setupInput(getState, setState, currentPuzzle, callbacks)
setupSettingsModal()

const musicToggle = document.getElementById('music-enabled-toggle') as HTMLInputElement | null
if (musicToggle) {
  musicToggle.addEventListener('change', () => {
    if (musicToggle.checked) ensureAudioUnlocked()
    setMusicEnabled(musicToggle.checked)
  })
}

document.addEventListener('visibilitychange', syncMusicPlayback)

showScreen('start-screen')
