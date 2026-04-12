export type SquaresCellValue = 'light' | 'dark'
export type SquaresPatternId = 'plus' | 'x'
export type SquaresRulesetId = 'classic-hybrid' | 'easy-plus' | 'easy-x'
export type SquaresThemePresetId = 'harbor-dawn' | 'paper-meadow' | 'midnight-slate'
export type SquaresCelebrationPatternId = 'ripple-ring' | 'cross-bloom' | 'sunburst'
export type SquaresGamePhase = 'ready' | 'playing' | 'solved'
export type SquaresBoardPresetId = 'pocket-3x3' | 'courtyard-4x4' | 'garden-5x5'
export type SquaresHighScoreBucketKey = `squares:${SquaresBoardPresetId}:${SquaresRulesetId}`

export interface SquaresCoordinate {
  readonly row: number
  readonly column: number
}

export interface SquaresPatternMove {
  readonly coordinate: SquaresCoordinate
  readonly patternId: SquaresPatternId
}

export interface SquaresRulesetDefinition {
  readonly id: SquaresRulesetId
  readonly label: string
  readonly description: string
  readonly lockedPatternId: SquaresPatternId | null
}

export interface SquaresThemePreset {
  readonly id: SquaresThemePresetId
  readonly label: string
}

export interface SquaresCelebrationPattern {
  readonly id: SquaresCelebrationPatternId
  readonly label: string
}

export interface SquaresBoardPreset {
  readonly id: SquaresBoardPresetId
  readonly label: string
  readonly rows: number
  readonly columns: number
  readonly recommendedRulesetId: SquaresRulesetId
  readonly themePresetId: SquaresThemePresetId
  readonly celebrationPatternId: SquaresCelebrationPatternId
  readonly scramblePlans: Readonly<Record<SquaresRulesetId, readonly SquaresPatternMove[]>>
}

export type SquaresBoardRow = readonly SquaresCellValue[]
export type SquaresBoard = readonly SquaresBoardRow[]

export interface SquaresMove {
  readonly coordinate: SquaresCoordinate
  readonly patternId: SquaresPatternId
}

export interface SquaresHighScoreBucketDescriptor {
  readonly presetId: SquaresBoardPresetId
  readonly rulesetId: SquaresRulesetId
  readonly key: SquaresHighScoreBucketKey
}

export interface SquaresState {
  readonly phase: SquaresGamePhase
  readonly presetId: SquaresBoardPresetId
  readonly rulesetId: SquaresRulesetId
  readonly board: SquaresBoard
  readonly startingBoard: SquaresBoard
  readonly scramblePlan: readonly SquaresPatternMove[]
  readonly activePatternId: SquaresPatternId
  readonly lockedPatternId: SquaresPatternId | null
  readonly moveCount: number
  readonly lastMove: SquaresMove | null
}

export const SQUARES_PATTERN_IDS = ['plus', 'x'] as const satisfies readonly SquaresPatternId[]

export const SQUARES_RULESETS = [
  {
    id: 'classic-hybrid',
    label: 'Classic Hybrid',
    description: 'Switch between plus and X on each turn.',
    lockedPatternId: null,
  },
  {
    id: 'easy-plus',
    label: 'Easy Plus',
    description: 'Guaranteed-solvable boards with the plus pattern locked on.',
    lockedPatternId: 'plus',
  },
  {
    id: 'easy-x',
    label: 'Easy X',
    description: 'Guaranteed-solvable boards with the X pattern locked on.',
    lockedPatternId: 'x',
  },
] as const satisfies readonly SquaresRulesetDefinition[]

export const SQUARES_THEME_PRESETS = [
  { id: 'harbor-dawn', label: 'Harbor Dawn' },
  { id: 'paper-meadow', label: 'Paper Meadow' },
  { id: 'midnight-slate', label: 'Midnight Slate' },
] as const satisfies readonly SquaresThemePreset[]

export const SQUARES_CELEBRATION_PATTERNS = [
  { id: 'ripple-ring', label: 'Ripple Ring' },
  { id: 'cross-bloom', label: 'Cross Bloom' },
  { id: 'sunburst', label: 'Sunburst' },
] as const satisfies readonly SquaresCelebrationPattern[]

export const SQUARES_BOARD_PRESETS = [
  {
    id: 'pocket-3x3',
    label: 'Pocket 3x3',
    rows: 3,
    columns: 3,
    recommendedRulesetId: 'classic-hybrid',
    themePresetId: 'harbor-dawn',
    celebrationPatternId: 'ripple-ring',
    scramblePlans: {
      'classic-hybrid': [
        { coordinate: { row: 1, column: 1 }, patternId: 'plus' },
        { coordinate: { row: 0, column: 0 }, patternId: 'x' },
        { coordinate: { row: 2, column: 1 }, patternId: 'plus' },
      ],
      'easy-plus': [
        { coordinate: { row: 1, column: 1 }, patternId: 'plus' },
        { coordinate: { row: 0, column: 2 }, patternId: 'plus' },
      ],
      'easy-x': [
        { coordinate: { row: 1, column: 1 }, patternId: 'x' },
        { coordinate: { row: 0, column: 1 }, patternId: 'x' },
      ],
    },
  },
  {
    id: 'courtyard-4x4',
    label: 'Courtyard 4x4',
    rows: 4,
    columns: 4,
    recommendedRulesetId: 'classic-hybrid',
    themePresetId: 'paper-meadow',
    celebrationPatternId: 'cross-bloom',
    scramblePlans: {
      'classic-hybrid': [
        { coordinate: { row: 1, column: 1 }, patternId: 'plus' },
        { coordinate: { row: 2, column: 2 }, patternId: 'x' },
        { coordinate: { row: 0, column: 3 }, patternId: 'plus' },
        { coordinate: { row: 3, column: 0 }, patternId: 'x' },
      ],
      'easy-plus': [
        { coordinate: { row: 1, column: 1 }, patternId: 'plus' },
        { coordinate: { row: 2, column: 2 }, patternId: 'plus' },
        { coordinate: { row: 0, column: 0 }, patternId: 'plus' },
      ],
      'easy-x': [
        { coordinate: { row: 1, column: 1 }, patternId: 'x' },
        { coordinate: { row: 2, column: 2 }, patternId: 'x' },
        { coordinate: { row: 0, column: 2 }, patternId: 'x' },
      ],
    },
  },
  {
    id: 'garden-5x5',
    label: 'Garden 5x5',
    rows: 5,
    columns: 5,
    recommendedRulesetId: 'classic-hybrid',
    themePresetId: 'midnight-slate',
    celebrationPatternId: 'sunburst',
    scramblePlans: {
      'classic-hybrid': [
        { coordinate: { row: 2, column: 2 }, patternId: 'plus' },
        { coordinate: { row: 1, column: 1 }, patternId: 'x' },
        { coordinate: { row: 3, column: 3 }, patternId: 'x' },
        { coordinate: { row: 0, column: 4 }, patternId: 'plus' },
      ],
      'easy-plus': [
        { coordinate: { row: 2, column: 2 }, patternId: 'plus' },
        { coordinate: { row: 0, column: 2 }, patternId: 'plus' },
        { coordinate: { row: 4, column: 2 }, patternId: 'plus' },
      ],
      'easy-x': [
        { coordinate: { row: 2, column: 2 }, patternId: 'x' },
        { coordinate: { row: 0, column: 0 }, patternId: 'x' },
        { coordinate: { row: 4, column: 4 }, patternId: 'x' },
      ],
    },
  },
] as const satisfies readonly SquaresBoardPreset[]