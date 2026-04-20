import type { TrainPresetDefinition, TrainPresetId } from './types.js'

const STEAM_PRESET = {
  id: 'steam',
  name: 'Steam Flyer',
  art: {
    backdrop: 'meadow-morning',
    locomotive: 'steam-classic',
    carriage: 'coach',
    livery: 'burgundy-gold',
    carCount: 2,
  },
  hotspots: [
    {
      id: 'steam-whistle',
      label: 'Whistle',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 14, y: 18, width: 12, height: 14 },
    },
    {
      id: 'steam-bell',
      label: 'Bell',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 24, y: 35, width: 11, height: 13 },
    },
    {
      id: 'steam-rods',
      label: 'Drive Rods',
      category: 'motion',
      zone: 'engine',
      bounds: { x: 18, y: 61, width: 18, height: 15 },
    },
    {
      id: 'steam-coupler',
      label: 'Coupler',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 39, y: 55, width: 12, height: 13 },
    },
    {
      id: 'steam-passenger-door',
      label: 'Passenger Door',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 55, y: 38, width: 14, height: 22 },
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
    carCount: 2,
  },
  hotspots: [
    {
      id: 'diesel-horn',
      label: 'Horn',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 13, y: 20, width: 12, height: 14 },
    },
    {
      id: 'diesel-engine-hum',
      label: 'Engine Hum',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 22, y: 35, width: 18, height: 17 },
    },
    {
      id: 'diesel-brake',
      label: 'Brake',
      category: 'brake',
      zone: 'engine',
      bounds: { x: 30, y: 60, width: 12, height: 14 },
    },
    {
      id: 'diesel-wheels',
      label: 'Wheels',
      category: 'motion',
      zone: 'engine',
      bounds: { x: 16, y: 63, width: 20, height: 14 },
    },
    {
      id: 'diesel-cargo-latch',
      label: 'Cargo Latch',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 60, y: 42, width: 13, height: 18 },
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
    carCount: 2,
  },
  hotspots: [
    {
      id: 'electric-horn',
      label: 'Horn',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 15, y: 21, width: 11, height: 13 },
    },
    {
      id: 'electric-power-hum',
      label: 'Power Hum',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 25, y: 27, width: 16, height: 16 },
    },
    {
      id: 'electric-brake',
      label: 'Brake',
      category: 'brake',
      zone: 'engine',
      bounds: { x: 32, y: 60, width: 12, height: 13 },
    },
    {
      id: 'electric-wheels',
      label: 'Wheels',
      category: 'motion',
      zone: 'engine',
      bounds: { x: 18, y: 63, width: 20, height: 14 },
    },
    {
      id: 'electric-passenger-door',
      label: 'Passenger Door',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 58, y: 37, width: 14, height: 23 },
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
    carCount: 2,
  },
  hotspots: [
    {
      id: 'high-speed-horn',
      label: 'Horn',
      category: 'signal',
      zone: 'engine',
      bounds: { x: 14, y: 24, width: 12, height: 12 },
    },
    {
      id: 'high-speed-power-hum',
      label: 'Power Hum',
      category: 'engine',
      zone: 'engine',
      bounds: { x: 26, y: 31, width: 18, height: 16 },
    },
    {
      id: 'high-speed-brake',
      label: 'Brake',
      category: 'brake',
      zone: 'engine',
      bounds: { x: 33, y: 59, width: 12, height: 13 },
    },
    {
      id: 'high-speed-wheels',
      label: 'Wheels',
      category: 'motion',
      zone: 'engine',
      bounds: { x: 20, y: 63, width: 21, height: 13 },
    },
    {
      id: 'high-speed-passenger-door',
      label: 'Passenger Door',
      category: 'carriage',
      zone: 'carriage',
      bounds: { x: 60, y: 37, width: 13, height: 22 },
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