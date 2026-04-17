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
export type GamePhase = 'title' | 'globe' | 'travel' | 'explore'
export type TransportType = 'bus' | 'train' | 'boat' | 'plane'
export type NavigationDirection = 'next' | 'previous'
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
  readonly memoryEmoji: string
  readonly memoryLabel: string
}

export interface GameState {
  readonly phase: GamePhase
  readonly currentLocation: DestinationId | null
  readonly targetDestination: DestinationId | null
  readonly transportType: TransportType | null
  readonly travelProgress: number
  readonly factIndex: number
  readonly globeSelectedIndex: number
  readonly globeRotationOffset: number
  readonly visitCounts: Readonly<Record<string, number>>
}

export interface VehicleSpriteSheet {
  readonly bus: PixelArt
  readonly train: PixelArt
  readonly boat: PixelArt
  readonly plane: PixelArt
}