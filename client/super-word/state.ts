import type { GameState, Puzzle } from './types.js'

export function createInitialState(puzzleCount: number, wowMode: boolean): GameState {
  return {
    currentPuzzleIndex: 0,
    collectedLetters: [],
    score: 0,
    selectedTileIndex: null,
    dragState: null,
    completed: Array(puzzleCount).fill(false) as readonly boolean[],
    wowMode,
  }
}

export function collectLetter(state: GameState, char: string, sourceId: string): GameState {
  return {
    ...state,
    collectedLetters: [...state.collectedLetters, { char, sourceId }],
    selectedTileIndex: null,
  }
}

export function swapLetters(state: GameState, indexA: number, indexB: number): GameState {
  const letters = [...state.collectedLetters]
  const temp = letters[indexA]
  letters[indexA] = letters[indexB]
  letters[indexB] = temp
  return {
    ...state,
    collectedLetters: letters,
    selectedTileIndex: null,
  }
}

export function selectTile(state: GameState, index: number): GameState {
  if (state.selectedTileIndex === null) {
    return { ...state, selectedTileIndex: index }
  }
  if (state.selectedTileIndex === index) {
    return { ...state, selectedTileIndex: null }
  }
  return swapLetters(state, state.selectedTileIndex, index)
}

export function checkAnswer(state: GameState, puzzle: Puzzle): { correct: boolean; newState: GameState } {
  const word = state.collectedLetters.map(l => l.char).join('').toUpperCase()
  const correct = word === puzzle.answer
  if (!correct) {
    return { correct, newState: state }
  }
  const points = 10
  const completed = state.completed.map((v, i) => (i === state.currentPuzzleIndex ? true : v))
  return {
    correct,
    newState: {
      ...state,
      score: state.score + points,
      completed,
    },
  }
}

export function advancePuzzle(state: GameState): GameState {
  return {
    ...state,
    currentPuzzleIndex: state.currentPuzzleIndex + 1,
    collectedLetters: [],
    selectedTileIndex: null,
  }
}

export function resetGame(state: GameState): GameState {
  return createInitialState(state.completed.length, state.wowMode)
}
