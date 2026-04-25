export type TrainPresetId = 'steam' | 'diesel' | 'electric' | 'high-speed'

export type TrainHotspotId =
  | 'steam-whistle'
  | 'steam-bell'
  | 'steam-rods'
  | 'steam-passenger-door'
  | 'diesel-horn'
  | 'diesel-engine-hum'
  | 'diesel-brake'
  | 'diesel-cargo-latch'
  | 'electric-horn'
  | 'electric-power-hum'
  | 'electric-brake'
  | 'electric-passenger-door'
  | 'high-speed-horn'
  | 'high-speed-power-hum'
  | 'high-speed-brake'
  | 'high-speed-passenger-door'

export type TrainHotspotCategory = 'signal' | 'engine' | 'motion' | 'brake' | 'carriage'

export type TrainHotspotZone = 'engine' | 'carriage'

export type TrainBackdropToken = 'meadow-morning' | 'yard-sunrise' | 'city-catenary' | 'coastal-viaduct'

export type TrainLocomotiveToken = 'steam-classic' | 'diesel-freight' | 'electric-commuter' | 'streamliner'

export type TrainCarToken = 'coach' | 'boxcar' | 'metro' | 'streamlined-coach'

export type TrainLiveryToken = 'burgundy-gold' | 'pine-cream' | 'amber-slate' | 'silver-crimson'

export type TrainDirection = 'left' | 'right'

export interface TrainHotspotBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface TrainHotspotDefinition {
  readonly id: TrainHotspotId
  readonly label: string
  readonly ariaDescription: string
  readonly category: TrainHotspotCategory
  readonly zone: TrainHotspotZone
  readonly bounds: TrainHotspotBounds
}

export interface TrainPresetArtTokens {
  readonly backdrop: TrainBackdropToken
  readonly locomotive: TrainLocomotiveToken
  readonly carriage: TrainCarToken
  readonly livery: TrainLiveryToken
  readonly carCount: number
}

export interface TrainPresetDefinition {
  readonly id: TrainPresetId
  readonly name: string
  readonly art: TrainPresetArtTokens
  readonly hotspots: readonly TrainHotspotDefinition[]
}

export interface TrainSoundsState {
  readonly currentPresetId: TrainPresetId
  readonly focusedHotspotId: TrainHotspotId | null
  readonly pressedHotspotId: TrainHotspotId | null
  readonly trainDirection: TrainDirection
  readonly hasRainbow: boolean
  readonly cloudOffset: number
  readonly departing: boolean
}