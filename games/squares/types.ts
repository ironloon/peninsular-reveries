export type SquaresCellValue = 'light' | 'dark'
export type SquaresPatternId = 'plus' | 'x'
export type SquaresModeId = '1x1' | 'plus-x'
export type SquaresCelebrationPatternId = 'ripple-ring' | 'cross-bloom' | 'sunburst' | 'checker-flash' | 'column-sweep'
export type SquaresGamePhase = 'ready' | 'playing' | 'solved'
export type SquaresHighScoreKey = 'squares-high-1x1' | 'squares-high-plusx'

export interface SquaresCoordinate {
  readonly row: number
  readonly column: number
}

export interface SquaresModeDefinition {
  readonly id: SquaresModeId
  readonly label: string
  readonly description: string
}

export interface SquaresCelebrationPattern {
  readonly id: SquaresCelebrationPatternId
  readonly label: string
}

export type SquaresBoardRow = readonly SquaresCellValue[]
export type SquaresBoard = readonly SquaresBoardRow[]

export interface SquaresMove {
  readonly coordinate: SquaresCoordinate
  readonly patternId: SquaresPatternId | null
}

export interface SquaresState {
  readonly phase: SquaresGamePhase
  readonly modeId: SquaresModeId
  readonly board: SquaresBoard
  readonly startingBoard: SquaresBoard
  readonly activePatternId: SquaresPatternId
  readonly moveCount: number
  readonly lastMove: SquaresMove | null
}

export const SQUARES_BOARD_SIZE = 3

export const SQUARES_PATTERN_IDS = ['plus', 'x'] as const satisfies readonly SquaresPatternId[]

export const SQUARES_MODES = [
  {
    id: '1x1',
    label: '1\u00d71',
    description: 'Tap toggles only the tapped square.',
  },
  {
    id: 'plus-x',
    label: '+/\u00d7',
    description: 'Tap affects the cross or X pattern. Switch patterns during play.',
  },
] as const satisfies readonly SquaresModeDefinition[]

export const SQUARES_CELEBRATION_PATTERNS = [
  { id: 'ripple-ring', label: 'Ripple Ring' },
  { id: 'cross-bloom', label: 'Cross Bloom' },
  { id: 'sunburst', label: 'Sunburst' },
  { id: 'checker-flash', label: 'Checker Flash' },
  { id: 'column-sweep', label: 'Column Sweep' },
] as const satisfies readonly SquaresCelebrationPattern[]