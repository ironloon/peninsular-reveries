export const DESTINATION_IDS = [
  'paris',
  'cairo',
  'tokyo',
  'new-york',
  'rio',
  'sydney',
  'nairobi',
  'reykjavik',
  'beijing',
] as const

export type DestinationId = (typeof DESTINATION_IDS)[number]
export type GamePhase = 'title' | 'globe' | 'travel' | 'explore' | 'memory-collect' | 'room' | 'mystery-clue' | 'mystery-result'
export type GameMode = 'explore' | 'mystery'
export type TransportType = 'bus' | 'train' | 'boat' | 'plane'
export type NavigationDirection = 'next' | 'previous'
export type PipPose = 'wave' | 'guide' | 'cheer' | 'think'
export type VehiclePose = 'bus' | 'train' | 'boat' | 'plane'

export interface PixelArt {
  readonly width: number
  readonly height: number
  readonly palette: readonly string[]
  readonly pixels: readonly number[]
}

export interface DestinationVisualTheme {
  readonly skyTop: string
  readonly skyBottom: string
  readonly glow: string
  readonly accent: string
  readonly horizon: string
}

export interface Destination {
  readonly id: DestinationId
  readonly name: string
  readonly country: string
  readonly continent: 'Europe' | 'Africa' | 'Asia' | 'North America' | 'South America' | 'Oceania'
  readonly markerEmoji: string
  readonly markerColor: string
  readonly coords: {
    readonly x: number
    readonly y: number
  }
  readonly coastal: boolean
  readonly scene: PixelArt
  readonly visualTheme: DestinationVisualTheme
  readonly facts: readonly string[]
  readonly clues: readonly [string, string, string]
  readonly memoryEmoji: string
  readonly memoryLabel: string
}

export interface GameProgress {
  readonly collectedMemories: readonly DestinationId[]
  readonly mysteryCompleted: readonly DestinationId[]
}

export interface GameState {
  readonly phase: GamePhase
  readonly mode: GameMode
  readonly currentLocation: DestinationId | null
  readonly targetDestination: DestinationId | null
  readonly transportType: TransportType | null
  readonly travelProgress: number
  readonly factIndex: number
  readonly collectedMemories: readonly DestinationId[]
  readonly globeSelectedIndex: number
  readonly globeRotationOffset: number
  readonly mysteryTarget: DestinationId | null
  readonly mysteryClueIndex: number
  readonly mysteryGuessesWrong: number
  readonly mysteryCompleted: readonly DestinationId[]
  readonly lastGuessCorrect: boolean | null
  readonly revealedDestination: boolean
  readonly memoryWasNew: boolean
}

export interface MysteryOutcome {
  readonly state: GameState
  readonly outcome: 'correct' | 'wrong' | 'revealed'
}

export interface SpriteSheet {
  readonly wave: PixelArt
  readonly guide: PixelArt
  readonly cheer: PixelArt
  readonly think: PixelArt
}

export interface VehicleSpriteSheet {
  readonly bus: PixelArt
  readonly train: PixelArt
  readonly boat: PixelArt
  readonly plane: PixelArt
}