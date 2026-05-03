export type GamePhase = 'start' | 'playing'

export type HandState = 'open' | 'closed' | 'none'

export interface PianoKey {
  note: string
  noteIndex: number
  frequency: number
  isBlack: boolean
  /** 0–1 position across the keyboard width (left edge of key) */
  x0: number
  /** 0–1 position across the keyboard width (right edge of key) */
  x1: number
  /** 0–1 vertical start (top). Black keys are shorter. */
  y0: number
  /** 0–1 vertical end (bottom). White keys go full height. */
  y1: number
}

export interface MotionHand {
  id: number
  normalizedX: number
  normalizedY: number
  spreadX: number
  spreadY: number
  handState: HandState
}

export interface TunaState {
  /** Whether the tuna is currently being pressed */
  tunaPressed: boolean
}

export interface GameState {
  phase: GamePhase
  tuna: TunaState
  keys: PianoKey[]
}