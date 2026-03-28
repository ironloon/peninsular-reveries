export interface SceneItem {
  readonly id: string
  readonly type: 'letter' | 'distractor'
  readonly char?: string
  readonly emoji: string
  readonly label: string
  readonly x: number
  readonly y: number
}

export interface Puzzle {
  readonly answer: string
  readonly prompt: string
  readonly hint: string
  readonly hintEmoji: string
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
  readonly hintUsed: boolean
  readonly selectedTileIndex: number | null
  readonly dragState: DragState | null
  readonly completed: readonly boolean[]
  readonly wowMode: boolean
}
