export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge'
export type AnchorPoint = 'bottom' | 'center'

export interface SceneItem {
  readonly id: string
  readonly type: 'letter' | 'distractor'
  readonly zone?: 'sky' | 'ground' | 'middle'
  readonly scale?: number
  readonly yOffset?: number
  readonly sizeCategory?: SizeCategory
  readonly anchor?: AnchorPoint
  readonly char?: string
  readonly emoji: string
  readonly label: string
  readonly x: number
  readonly y: number
}

export const DIFFICULTIES = ['sidekick', 'hero', 'super', 'ultra', 'legend'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

export type WordTheme =
  | 'animals'
  | 'everyday'
  | 'food'
  | 'home'
  | 'nature'
  | 'play'
  | 'sky'
  | 'space'
  | 'travel'
  | 'water'

export interface WordSpec {
  readonly answer: string
  readonly difficulty: Difficulty
  readonly hint: string
  readonly theme?: string
  readonly phonemicPattern: string
  readonly gradeAlign: string
  readonly sources: readonly string[]
}

export interface Puzzle {
  readonly answer: string
  readonly difficulty: Difficulty
  readonly prompt: string
  readonly items: readonly SceneItem[]
}

export interface CollectedLetter {
  readonly char: string
  readonly sourceId: string
}

export interface DragState {
  readonly pointerId: number
  readonly sourceIndex: number
  readonly startX: number
  readonly startY: number
  ghost: HTMLElement | null
}

export interface GameState {
  readonly currentPuzzleIndex: number
  readonly collectedLetters: readonly CollectedLetter[]
  readonly score: number
  readonly selectedTileIndex: number | null
  readonly dragState: DragState | null
  readonly completed: readonly boolean[]
  readonly wowMode: boolean
}
