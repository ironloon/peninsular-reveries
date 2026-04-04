import type { Difficulty, Puzzle } from './types.js'
import { buildPuzzle, randomizePuzzle, shuffleList } from './scene-builder.js'
import { WORD_BANK } from './word-bank.js'

/** Full puzzle pool — all difficulties combined */
export const PUZZLES: readonly Puzzle[] = Object.values(WORD_BANK)
  .flatMap((specs) => specs.map((spec) => buildPuzzle(spec)))

/** Number of puzzles to randomly select for a session when no filter is provided */
export const DEFAULT_SESSION_SIZE = 5

/**
 * Select a shuffled five-puzzle round for the requested difficulty.
 */
export function selectPuzzles(difficulty: Difficulty): Puzzle[] {
  const filtered = PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty)
  const pool = filtered.length > 0 ? filtered : PUZZLES

  return shuffleList(pool)
    .slice(0, Math.min(DEFAULT_SESSION_SIZE, pool.length))
    .map((puzzle) => randomizePuzzle(puzzle))
}
