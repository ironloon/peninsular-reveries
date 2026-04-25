export type RoomSeed = number

export type ItemId = string

export type SpotOnPhase = 'idle' | 'carrying' | 'complete'

/** Template for an item in a room definition (before scatter) */
export interface ItemTemplate {
  readonly id: ItemId
  readonly name: string
  readonly emoji: string
}

/** Template for a surface (grid-based placement zone) in a room definition */
export interface SurfaceTemplate {
  readonly id: string
  readonly label: string
  readonly emoji: string
  readonly type: string
  readonly rows: number
  readonly cols: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** A room theme defining color palette and pools of candidate surfaces & items */
export interface RoomTheme {
  readonly id: string
  readonly name: string
  readonly wallColor: string
  readonly floorColor: string
  readonly surfacePool: readonly SurfaceTemplate[]
  readonly itemPool: readonly ItemTemplate[]
}

/** Runtime item state, including randomized floor scatter position */
export interface ItemState {
  readonly id: ItemId
  readonly name: string
  readonly emoji: string
  readonly placed: boolean
  readonly surfaceId: string | null
  readonly cellIndex: number | null
  readonly floorX: number
  readonly floorY: number
}

/** Runtime cell state within a surface */
export interface CellState {
  readonly row: number
  readonly col: number
  readonly itemId: ItemId | null
}

/** Runtime surface state, including grid cells */
export interface SurfaceState {
  readonly id: string
  readonly label: string
  readonly emoji: string
  readonly type: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly rows: number
  readonly cols: number
  readonly cells: readonly CellState[]
}

/** Room definition — generated from a theme, with positioned surfaces and selected items */
export interface RoomDefinition {
  readonly id: string
  readonly name: string
  readonly theme: string
  readonly wallColor: string
  readonly floorColor: string
  readonly items: readonly ItemTemplate[]
  readonly surfaces: readonly SurfaceTemplate[]
}

/** Full game state */
export interface SpotOnState {
  readonly currentRoomId: string
  readonly phase: SpotOnPhase
  readonly carriedItemId: ItemId | null
  readonly items: readonly ItemState[]
  readonly surfaces: readonly SurfaceState[]
  readonly roomSeed: RoomSeed
}