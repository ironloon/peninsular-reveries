import type { TrainPresetDefinition, TrainPresetId } from './types.js'

const STEAM_PRESET = {
  id: 'steam',
  name: 'Steam Flyer',
  art: {
    backdrop: 'meadow-morning',
    locomotive: 'steam-classic',
    carriage: 'coach',
    livery: 'burgundy-gold',
    carCount: 1,
  },
  hotspots: [
    {
      id: 'steam-whistle',
      label: 'Whistle',
      ariaDescription: 'the tall pipe on top of the engine',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 14, y: 18, width: 12, height: 14 },
    },
    {
      id: 'steam-bell',
      label: 'Bell',
      ariaDescription: 'the brass bell hanging below the cab',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 24, y: 35, width: 11, height: 13 },
    },
    {
      id: 'steam-rods',
      label: 'Drive Rods',
      ariaDescription: 'the moving bars between the wheels',
      category: 'motion',
      zone: 'engine',
      bounds: { x: 18, y: 61, width: 18, height: 15 },
    },
    {
      id: 'steam-passenger-door',
      label: 'Passenger Door',
      ariaDescription: 'the sliding door on the coach car',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 65, y: 38, width: 14, height: 22 },
    },
  ],
} as const satisfies TrainPresetDefinition

const DIESEL_PRESET = {
  id: 'diesel',
  name: 'Diesel Hauler',
  art: {
    backdrop: 'yard-sunrise',
    locomotive: 'diesel-freight',
    carriage: 'boxcar',
    livery: 'pine-cream',
    carCount: 1,
  },
  hotspots: [
    {
      id: 'diesel-horn',
      label: 'Horn',
      ariaDescription: 'the bright horns on the roof',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 13, y: 20, width: 12, height: 14 },
    },
    {
      id: 'diesel-engine-hum',
      label: 'Engine Hum',
      ariaDescription: 'the low rumble from the engine compartment',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 24, y: 35, width: 18, height: 17 },
    },
    {
      id: 'diesel-brake',
      label: 'Brake',
      ariaDescription: 'the brake lever near the wheels',
      category: 'brake',
      zone: 'engine',
      bounds: { x: 30, y: 60, width: 12, height: 14 },
    },
    {
      id: 'diesel-cargo-latch',
      label: 'Cargo Latch',
      ariaDescription: 'the heavy latch on the boxcar door',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 65, y: 42, width: 13, height: 18 },
    },
  ],
} as const satisfies TrainPresetDefinition

const ELECTRIC_PRESET = {
  id: 'electric',
  name: 'Electric Commuter',
  art: {
    backdrop: 'city-catenary',
    locomotive: 'electric-commuter',
    carriage: 'metro',
    livery: 'amber-slate',
    carCount: 1,
  },
  hotspots: [
    {
      id: 'electric-horn',
      label: 'Horn',
      ariaDescription: 'the twin chime horns on the roof',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 15, y: 21, width: 11, height: 13 },
    },
    {
      id: 'electric-power-hum',
      label: 'Power Hum',
      ariaDescription: 'the transformer hum from under the car',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 27, y: 30, width: 16, height: 16 },
    },
    {
      id: 'electric-brake',
      label: 'Brake',
      ariaDescription: 'the brake rigging near the wheels',
      category: 'brake',
      zone: 'engine',
      bounds: { x: 32, y: 60, width: 12, height: 13 },
    },
    {
      id: 'electric-passenger-door',
      label: 'Passenger Door',
      ariaDescription: 'the sliding door between cars',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 66, y: 37, width: 14, height: 23 },
    },
  ],
} as const satisfies TrainPresetDefinition

const HIGH_SPEED_PRESET = {
  id: 'high-speed',
  name: 'High-Speed Arrow',
  art: {
    backdrop: 'coastal-viaduct',
    locomotive: 'streamliner',
    carriage: 'streamlined-coach',
    livery: 'silver-crimson',
    carCount: 1,
  },
  hotspots: [
    {
      id: 'high-speed-horn',
      label: 'Horn',
      ariaDescription: 'the aerodynamic horn in the nose',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 14, y: 24, width: 12, height: 12 },
    },
    {
      id: 'high-speed-power-hum',
      label: 'Power Hum',
      ariaDescription: 'the quiet motor hum under the floor',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 28, y: 32, width: 18, height: 16 },
    },
    {
      id: 'high-speed-brake',
      label: 'Brake',
      ariaDescription: 'the disc brakes near the wheels',
      category: 'brake',
      zone: 'engine',
      bounds: { x: 33, y: 59, width: 12, height: 13 },
    },
    {
      id: 'high-speed-passenger-door',
      label: 'Passenger Door',
      ariaDescription: 'the automatic door in the streamlined car',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 66, y: 37, width: 13, height: 22 },
    },
  ],
} as const satisfies TrainPresetDefinition

export const TRAIN_PRESET_IDS = ['steam', 'diesel', 'electric', 'high-speed'] as const satisfies readonly TrainPresetId[]

export const DEFAULT_TRAIN_PRESET_ID: TrainPresetId = TRAIN_PRESET_IDS[0]

export const TRAIN_PRESETS_BY_ID: Readonly<Record<TrainPresetId, TrainPresetDefinition>> = {
  steam: STEAM_PRESET,
  diesel: DIESEL_PRESET,
  electric: ELECTRIC_PRESET,
  'high-speed': HIGH_SPEED_PRESET,
}

export const TRAIN_PRESETS: readonly TrainPresetDefinition[] = TRAIN_PRESET_IDS.map(
  (presetId) => TRAIN_PRESETS_BY_ID[presetId],
)

export function getTrainPresetDefinition(presetId: TrainPresetId): TrainPresetDefinition {
  return TRAIN_PRESETS_BY_ID[presetId]
}