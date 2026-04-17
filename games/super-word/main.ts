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
import { setupGameMenu } from '../../client/game-menu.js'
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
  syncMusicPlayback,
} from './sounds.js'

const DEFAULT_DIFFICULTY: Difficulty = 'hero'

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
const sceneEl = document.getElementById('scene-wrapper')!
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
  const difficultySelect = document.getElementById('difficulty-select') as HTMLSelectElement | null

  if (difficultySelect) difficultySelect.value = activeDifficulty
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

function onStartGame(difficulty?: string): void {
  ensureAudioUnlocked()
  sfxButton()

  activeDifficulty = parseDifficulty(difficulty ?? activeDifficulty)
  activePuzzles = selectPuzzles(activeDifficulty)

  // Reset game state for new puzzle set
  pendingFlightIndices.clear()
  gameState = createInitialState(activePuzzles.length, false)

  // Show the game screen, then render once the browser has
  // committed layout and the canvas has real dimensions.
  showScreen('game-screen')
  requestAnimationFrame(() => {
    refreshGameScreen()
    syncMusicPlayback()
    announceNextPuzzle(
      getState().currentPuzzleIndex + 1,
      activePuzzles.length,
      currentPuzzle().prompt,
    )
    moveFocusToFirstSceneItem(300)
  })
}

function onLetterCollected(item: SceneItem): void {
  // Guard: don't collect more letters than the answer requires
  if (getState().collectedLetters.length >= currentPuzzle().answer.length) return

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

  // Re-render the canvas so collected items are visually dimmed and their
  // a11y overlay buttons are removed (prevents duplicate taps).
  renderScene(currentPuzzle(), getState(), sceneEl)
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

function focusTile(index: number): void {
  const tile = slotsEl.querySelector(`[data-index="${index}"]`) as HTMLElement | null
  if (tile) tile.focus()
}

function onTileSelected(index: number): void {
  const prevState = getState()
  if (prevState.selectedTileIndex === index) {
    focusTile(index)
    return
  }

  const nextState = selectTile(prevState, index)
  const didSwap = prevState.selectedTileIndex !== null
    && prevState.selectedTileIndex !== index
    && nextState.selectedTileIndex === null

  if (didSwap) {
    sfxSwap()
  }

  setState(nextState)
  renderCollectedLetters()

  focusTile(nextState.selectedTileIndex ?? index)

  if (nextState.selectedTileIndex !== null) {
    announceLetterSelected(
      nextState.collectedLetters[index].char,
      index + 1,
    )
  } else if (didSwap && prevState.selectedTileIndex !== null) {
    const letters = nextState.collectedLetters.map(l => l.char)
    announceLettersSwapped(
      prevState.collectedLetters[prevState.selectedTileIndex].char,
      prevState.collectedLetters[index].char,
      letters,
    )
  }
}

function onLettersSwapped(indexA: number, indexB: number): void {
  sfxSwap()
  const prevLetters = getState().collectedLetters
  setState(swapLetters(getState(), indexA, indexB))
  renderCollectedLetters()

  const letters = getState().collectedLetters.map(l => l.char)
  announceLettersSwapped(prevLetters[indexA].char, prevLetters[indexB].char, letters)

  // Refocus the tile at the swapped position
  focusTile(indexB)
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
  setTimeout(() => requestAnimationFrame(() => {
    document.querySelector<HTMLButtonElement>('.btn-difficulty')?.focus()
  }), 300)
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
setupGameMenu()

// Wire difficulty buttons on start screen
for (const btn of document.querySelectorAll<HTMLButtonElement>('.btn-difficulty[data-difficulty]')) {
  btn.addEventListener('click', () => {
    onStartGame(btn.dataset['difficulty'])
  })
}

window.addEventListener('reveries:music-change', (e) => {
  const event = e as CustomEvent<{ enabled: boolean }>
  if (event.detail.enabled) ensureAudioUnlocked()
  syncMusicPlayback()
})

document.addEventListener('visibilitychange', syncMusicPlayback)
document.addEventListener('restart', () => { onPlayAgain() })

showScreen('start-screen')
