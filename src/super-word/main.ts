import { PUZZLES, selectPuzzles } from './puzzles.js'
import type { GameState, Puzzle, SceneItem } from './types.js'
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
  setupSettingsModal,
} from './renderer.js'
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
} from './accessibility.js'
import {
  animateCollectPop,
  animateItemShake,
  animateTileAppear,
  animateTileWrongShake,
  setWowMode,
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
} from './sounds.js'

// ── URL Parameter Parsing ─────────────────────────────────
const params = new URLSearchParams(window.location.search)
const startPuzzleParam = parseInt(params.get('puzzle') ?? '0', 10)
const puzzleFilterParam = params.get('puzzles')?.split(',').map(s => s.trim().toUpperCase())
const difficultyParam = params.get('difficulty')?.toLowerCase() as 'easy' | 'medium' | 'hard' | undefined
const countParam = params.get('count') ? parseInt(params.get('count')!, 10) : undefined
const wowModeParam = params.get('wow') === 'true'
const shareParam = params.get('s')
if (shareParam) {
  try {
    const decoded = atob(shareParam)
    console.log('Shared result:', decoded)
  } catch {
    // Invalid share param — ignore silently
  }
}

// ── Puzzle Selection ──────────────────────────────────────
// If specific puzzles requested via URL, use those; otherwise random selection
const validDifficulty = difficultyParam && ['easy', 'medium', 'hard'].includes(difficultyParam)
  ? difficultyParam : undefined

let activePuzzles: readonly Puzzle[] = selectPuzzles({
  answers: puzzleFilterParam,
  difficulty: validDifficulty,
  count: countParam,
})

const hasUrlParams = !!(puzzleFilterParam || validDifficulty || countParam)

// ── State Management ──────────────────────────────────────
let gameState: GameState = createInitialState(activePuzzles.length, wowModeParam)

function getState(): GameState { return gameState }
function setState(newState: GameState): void { gameState = newState }
function currentPuzzle(): Puzzle { return activePuzzles[gameState.currentPuzzleIndex] }

// ── DOM Element References ────────────────────────────────
const sceneEl = document.getElementById('scene')!
const slotsEl = document.getElementById('letter-slots')!
const gameContainer = document.querySelector('.super-word-game') as HTMLElement

// ── Helper: Refresh Game Screen ───────────────────────────
function refreshGameScreen(): void {
  const puzzle = currentPuzzle()
  const state = getState()
  renderScene(puzzle, state, sceneEl)
  renderLetterSlots(state, puzzle, slotsEl)
  renderGameHeader(state, puzzle, state.currentPuzzleIndex, activePuzzles.length)
  setCheckButtonEnabled(state.collectedLetters.length === puzzle.answer.length)
}

// ── Game Flow — InputCallbacks ────────────────────────────

function onStartGame(): void {
  ensureAudioUnlocked()
  sfxButton()
  // Read puzzle creator settings
  const wordsInput = document.getElementById('puzzle-words') as HTMLInputElement | null
  const difficultySelect = document.getElementById('puzzle-difficulty-select') as HTMLSelectElement | null
  const countInput = document.getElementById('puzzle-count-input') as HTMLInputElement | null

  const creatorWords = wordsInput?.value.split(',').map(w => w.trim().toUpperCase()).filter(Boolean) ?? []
  const creatorDifficultyRaw = difficultySelect?.value ?? ''
  const creatorDifficulty = (['easy', 'medium', 'hard'] as const).find(d => d === creatorDifficultyRaw)
  const creatorCount = countInput?.value ? parseInt(countInput.value, 10) : undefined

  const hasCreatorSettings = creatorWords.length > 0 || creatorDifficulty !== undefined || creatorCount !== undefined

  if (hasCreatorSettings || !hasUrlParams) {
    // Re-select puzzles based on creator settings (or re-roll random)
    activePuzzles = selectPuzzles({
      answers: creatorWords.length > 0 ? creatorWords : undefined,
      difficulty: creatorDifficulty,
      count: creatorCount,
    })
  }

  // Reset game state for new puzzle set
  gameState = createInitialState(activePuzzles.length, wowModeParam)

  refreshGameScreen()
  showScreen('game-screen')
  announceNextPuzzle(
    getState().currentPuzzleIndex + 1,
    activePuzzles.length,
    currentPuzzle().prompt,
  )
  moveFocusAfterTransition('scene', 300)
}

function onLetterCollected(item: SceneItem): void {
  ensureAudioUnlocked()
  sfxCollect()
  setState(collectLetter(getState(), item.char!, item.id))

  const sceneItem = sceneEl.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement | null
  sceneItem?.classList.add('collected')

  renderLetterSlots(getState(), currentPuzzle(), slotsEl)

  const tiles = slotsEl.querySelectorAll('.letter-tile')
  const newTile = tiles.length > 0 ? tiles[tiles.length - 1] as HTMLElement : null

  if (isReducedMotion()) {
    // Instant collection — no flight animation
    if (newTile) animateTileAppear(newTile)
  } else if (sceneItem && newTile) {
    animateFlyToNotepad(sceneItem, newTile).then(() => {
      if (newTile) animateTileAppear(newTile)
    })
  } else if (sceneItem) {
    animateCollectPop(sceneItem)
    if (newTile) animateTileAppear(newTile)
  }

  announceLetterCollected(
    item.char!,
    item.label,
    getState().collectedLetters.length,
    currentPuzzle().answer.length,
  )

  setCheckButtonEnabled(getState().collectedLetters.length === currentPuzzle().answer.length)
  renderGameHeader(getState(), currentPuzzle(), getState().currentPuzzleIndex, activePuzzles.length)

  // Keep focus on current position — don't auto-advance
  // The collected item becomes pointer-events:none, so update tabindex on remaining items
  if (sceneItem) {
    sceneItem.tabIndex = -1
    // Focus nearest uncollected item without auto-advancing
    const uncollected = Array.from(sceneEl.querySelectorAll('.scene-item:not(.collected)')) as HTMLElement[]
    if (uncollected.length > 0) {
      for (const el of uncollected) el.tabIndex = -1
      uncollected[0].tabIndex = 0
    }
  }
}

function onDistractorClicked(item: SceneItem): void {
  sfxDistractor()
  if (isReducedMotion()) {
    // No animation fallback — accessibility announcement handles feedback
  } else {
    const sceneItem = sceneEl.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement | null
    const card = sceneItem?.querySelector('.item-card') as HTMLElement | null
    if (card) animateItemShake(card)
  }
  announceDistractorClicked(item.label)
}

function onTileSelected(index: number): void {
  const prevState = getState()
  setState(selectTile(prevState, index))
  renderLetterSlots(getState(), currentPuzzle(), slotsEl)

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
  renderLetterSlots(getState(), currentPuzzle(), slotsEl)

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
          setState(advancePuzzle(getState()))
          refreshGameScreen()
        },
        () => {
          announceNextPuzzle(
            getState().currentPuzzleIndex + 1,
            activePuzzles.length,
            currentPuzzle().prompt,
          )
          moveFocusAfterTransition('scene', 300)
        },
      )
    })
  }
}

function onNextPuzzle(): void {
  setState(advancePuzzle(getState()))
  refreshGameScreen()
  showScreen('game-screen')
  announceNextPuzzle(
    getState().currentPuzzleIndex + 1,
    activePuzzles.length,
    currentPuzzle().prompt,
  )
  moveFocusAfterTransition('scene', 300)
}

function onPlayAgain(): void {
  sfxButton()
  setState(resetGame(getState()))
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 300)
}

// ── Initialization ────────────────────────────────────────
setWowMode(gameContainer, wowModeParam)
if (isReducedMotion()) {
  setWowMode(gameContainer, false)
}

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

setupInput(getState, setState, currentPuzzle, callbacks)
setupSettingsModal(onStartGame)

showScreen('start-screen')
