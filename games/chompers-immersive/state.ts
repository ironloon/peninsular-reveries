// Re-export state logic from original chompers game
export {
  createInitialState,
  selectAnswer,
  resolveChomp,
  advanceRound,
} from '../chompers/state.js'

export type { Area, GameState } from '../chompers/types.js'