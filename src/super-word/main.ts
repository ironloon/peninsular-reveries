import { PUZZLES } from './puzzles.js'
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
  renderCompleteScreen,
  renderWinScreen,
  setCheckButtonEnabled,
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
  animateSolvedLetters,
  setWowMode,
  animateFlyToNotepad,
} from './animations.js'

// ── URL Parameter Parsing ─────────────────────────────────
const params = new URLSearchParams(window.location.search)
const startPuzzleParam = parseInt(params.get('puzzle') ?? '0', 10)
const puzzleFilterParam = params.get('puzzles')?.split(',').map(s => s.trim().toUpperCase())
const wowModeParam = params.get('wow') === 'true'

// ── Puzzle Filtering ──────────────────────────────────────
let activePuzzles: readonly Puzzle[] = PUZZLES
if (puzzleFilterParam && puzzleFilterParam.length > 0) {
  const filtered = PUZZLES.filter(p => puzzleFilterParam.includes(p.answer))
  if (filtered.length > 0) activePuzzles = filtered
}

const clampedStart = Math.max(0, Math.min(startPuzzleParam, activePuzzles.length - 1))

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

  renderLetterSlots(getState(), currentPuzzle(), slotsEl)

  const tiles = slotsEl.querySelectorAll('.letter-tile')
  const newTile = tiles.length > 0 ? tiles[tiles.length - 1] as HTMLElement : null

  if (sceneItem && newTile) {
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
  const sceneItem = sceneEl.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement | null
  const card = sceneItem?.querySelector('.item-card') as HTMLElement | null
  if (card) animateItemShake(card)

  announceDistractorClicked(item.label)
  showToast('Not a letter! Try another! 🤔', 1500)
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
  setState(newState)

  if (!correct) {
    const tiles = Array.from(slotsEl.querySelectorAll('.letter-tile')) as HTMLElement[]
    animateTileWrongShake(tiles)
    announceWrongAnswer()
    showToast('Not quite — try rearranging! 🔄', 1500)
    return
  }

  announceCorrectAnswer(currentPuzzle().answer)

  const isLastPuzzle = getState().currentPuzzleIndex >= activePuzzles.length - 1
  if (isLastPuzzle) {
    renderWinScreen(getState())
    showScreen('win-screen')
    announceGameWin(getState().score)
    moveFocusAfterTransition('replay-btn', 300)
  } else {
    renderCompleteScreen(currentPuzzle(), getState())
    showScreen('complete-screen')
    animateSolvedLetters(document.getElementById('solved-word')!)
    moveFocusAfterTransition('next-btn', 300)
  }
}

function onHintRequested(): void {
  setState(useHint(getState()))
  announceHint(currentPuzzle().hint)
  showToast('💡 ' + currentPuzzle().hint, 3000)
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
  setState(resetGame(getState()))
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 300)
}

// ── Initialization ────────────────────────────────────────
setWowMode(gameContainer, wowModeParam)

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
showScreen('start-screen')
