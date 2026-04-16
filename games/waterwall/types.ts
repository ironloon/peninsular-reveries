export type WaterwallCellType = 'empty' | 'water' | 'barrier'

export type WaterwallThemeId = 'rocky' | 'night' | 'earth'

export interface WaterwallCoordinate {
  readonly row: number
  readonly column: number
}

export interface WaterwallGrid {
  readonly rows: number
  readonly columns: number
  readonly cells: readonly (readonly WaterwallCellType[])[]
  readonly barrierCount: number
  readonly maxBarriers: number
  /** Placement order, oldest first. Used for FIFO eviction when budget is full. */
  readonly barrierOrder: readonly WaterwallCoordinate[]
}

export interface WaterwallTheme {
  readonly id: WaterwallThemeId
  readonly label: string
}

export interface WaterwallConfig {
  readonly cellSize: number
  readonly sourceWidth: number
  readonly ticksPerFrame: number
}

export interface WaterwallCursor {
  readonly row: number
  readonly column: number
  readonly dragging: boolean
}

export const WATERWALL_THEMES = [
  { id: 'rocky', label: 'Rocky' },
  { id: 'night', label: 'Night' },
  { id: 'earth', label: 'Earth' },
] as const satisfies readonly WaterwallTheme[]

export const WATERWALL_DEFAULT_CONFIG: WaterwallConfig = {
  cellSize: 4,
  sourceWidth: 1.0,
  ticksPerFrame: 1,
}

export function computeMaxBarriers(columns: number): number {
  return Math.floor(columns * 1.5)
}
