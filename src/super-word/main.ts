import { PUZZLES, selectPuzzles } from './puzzles.js'
import type { GameState, Puzzle, SceneItem } from './types.js'
import {
  createInitialState,
  collectLetter,
  swapLetters,
  checkAnswer,
  useHint,
  advancePuzzle,
  resetGame,
  selectTile,
} from './state.js'
import {
  renderScene,
  renderLetterSlots,
  renderGameHeader,
  showScreen,
  showToast,
  showCelebrationPopup,
  slideSceneTransition,
  renderWinScreen,
  setCheckButtonEnabled,
  renderPuzzleCreator,
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
  announceHint,
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

const activePuzzles: readonly Puzzle[] = selectPuzzles({
  answers: puzzleFilterParam,
  difficulty: validDifficulty,
  count: countParam,
})

const clampedStart = Math.max(0, Math.min(startPuzzleParam, activePuzzles.length - 1))

// ── State Management ──────────────────────────────────────
let gameState: GameState = createInitialState(activePuzzles.length, wowModeParam)
const hintUsedPerPuzzle: boolean[] = []

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

  // Reset hint display for new puzzle
  const hintEl = document.getElementById('hint-text')
  const hintBtnEl = document.getElementById('hint-btn')
  if (hintEl) {
    hintEl.hidden = true
    hintEl.textContent = ''
    hintEl.classList.remove('hint-visible')
  }
  if (hintBtnEl) hintBtnEl.textContent = '💡 Hint'
}

// ── Game Flow — InputCallbacks ────────────────────────────

function onStartGame(): void {
  if (clampedStart > 0) {
    setState({ ...getState(), currentPuzzleIndex: clampedStart })
  }
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
  setState(collectLetter(getState(), item.char!, item.id))

  const sceneItem = sceneEl.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement | null
  sceneItem?.classList.add('collected')

  renderLetterSlots(getState(), currentPuzzle(), slotsEl)

  const tiles = slotsEl.querySelectorAll('.letter-tile')
  const newTile = tiles.length > 0 ? tiles[tiles.length - 1] as HTMLElement : null

  if (isReducedMotion()) {
    // Instant collection — no flight animation
    if (sceneItem) sceneItem.style.display = 'none'
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
  showToast('Got it! ✨', 1200)

  setCheckButtonEnabled(getState().collectedLetters.length === currentPuzzle().answer.length)
  renderGameHeader(getState(), currentPuzzle(), getState().currentPuzzleIndex, activePuzzles.length)

  // Move focus to nearest remaining uncollected item
  const nextItem = sceneEl.querySelector('.scene-item:not(.collected)') as HTMLElement | null
  if (nextItem) {
    const allItems = sceneEl.querySelectorAll('.scene-item')
    for (const el of allItems) (el as HTMLElement).tabIndex = -1
    nextItem.tabIndex = 0
    nextItem.focus()
  }
}

function onDistractorClicked(item: SceneItem): void {
  if (isReducedMotion()) {
    showToast(`Not a letter — ${item.label} is a distractor`, 1500)
  } else {
    const sceneItem = sceneEl.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement | null
    const card = sceneItem?.querySelector('.item-card') as HTMLElement | null
    if (card) animateItemShake(card)
    showToast('Not a letter! Try another! 🤔', 1500)
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
  const hintWasUsed = getState().hintUsed
  setState(newState)

  if (!correct) {
    if (isReducedMotion()) {
      showToast('Not quite! Rearrange the letters', 1500)
    } else {
      const tiles = Array.from(slotsEl.querySelectorAll('.letter-tile')) as HTMLElement[]
      animateTileWrongShake(tiles)
      showToast('Not quite — try rearranging! 🔄', 1500)
    }
    announceWrongAnswer()
    return
  }

  hintUsedPerPuzzle.push(hintWasUsed)
  announceCorrectAnswer(currentPuzzle().answer)

  const isLastPuzzle = getState().currentPuzzleIndex >= activePuzzles.length - 1
  if (isLastPuzzle) {
    renderWinScreen(getState(), hintUsedPerPuzzle)
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

function onHintRequested(): void {
  setState(useHint(getState()))
  const puzzle = currentPuzzle()
  announceHint(puzzle.hint)

  const hintEl = document.getElementById('hint-text')
  const hintBtnEl = document.getElementById('hint-btn')
  if (hintEl) {
    const isVisible = !hintEl.hidden
    if (isVisible) {
      hintEl.hidden = true
      hintEl.classList.remove('hint-visible')
      if (hintBtnEl) hintBtnEl.textContent = '💡 Hint'
    } else {
      hintEl.textContent = puzzle.hintEmoji + ' ' + puzzle.hint
      hintEl.hidden = false
      hintEl.classList.add('hint-visible')
      if (hintBtnEl) hintBtnEl.textContent = '💡 Hide Hint'
    }
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
  hintUsedPerPuzzle.length = 0
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
  onHintRequested,
  onNextPuzzle,
  onPlayAgain,
}

setupInput(getState, setState, currentPuzzle, callbacks)
renderPuzzleCreator()
showScreen('start-screen')
