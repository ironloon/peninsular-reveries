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

export const SCENE_SCENERY = ['🌳', '☁️', '🌿', '🪨', '🌸', '🍄', '🍃', '⛰️'] as const

export type PeekabooGrid = readonly (readonly boolean[])[]

export interface SceneryCell {
  readonly emoji: string
  readonly hasTarget: boolean
}

export type SceneryGrid = readonly (readonly (SceneryCell | null)[])[]

export type PeekedGrid = readonly (readonly boolean[])[]

export interface PeekabooState {
  readonly phase: GamePhase
  readonly currentTarget: Target
  readonly targetRow: number
  readonly targetCol: number
  readonly grid: PeekabooGrid
  readonly scenery: SceneryGrid
  readonly peeked: PeekedGrid
  readonly round: number
  readonly cols: number
  readonly rows: number
}