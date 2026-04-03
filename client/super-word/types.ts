export interface SceneItem {
  readonly id: string
  readonly type: 'letter' | 'distractor'
  readonly char?: string
  readonly emoji: string
  readonly label: string
  readonly x: number
  readonly y: number
}

export const DIFFICULTIES = ['starter', 'easy', 'medium', 'hard', 'expert'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

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
