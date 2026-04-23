export type GamePhase = 'meet' | 'enter' | 'playing' | 'found'

export interface Target {
  readonly emoji: string
  readonly name: string
}

export const TARGET_POOL = [
  { emoji: '🐶', name: 'Dog' },
  { emoji: '🐱', name: 'Cat' },
  { emoji: '🐉', name: 'Dragon' },
  { emoji: '🧑', name: 'Person' },
  { emoji: '🐸', name: 'Frog' },
  { emoji: '🦉', name: 'Owl' },
] as const satisfies readonly Target[]

export type PeekabooGrid = readonly (readonly boolean[])[]

export interface PeekabooState {
  readonly phase: GamePhase
  readonly currentTarget: Target
  readonly targetRow: number
  readonly targetCol: number
  readonly grid: PeekabooGrid
  readonly round: number
  readonly cols: number
  readonly rows: number
}