export interface MissionCrewProfile {
  readonly id: string
  readonly name: string
  readonly role: string
  readonly badge: string
  readonly accent: string
  readonly accentSoft: string
}

export const MISSION_CREW_ROSTER: readonly MissionCrewProfile[] = [
  {
    id: 'vega',
    name: 'Rowan Vega',
    role: 'Commander',
    badge: 'RV',
    accent: '#ff8a65',
    accentSoft: '#ffe4d8',
  },
  {
    id: 'okafor',
    name: 'Mae Okafor',
    role: 'Pilot',
    badge: 'MO',
    accent: '#7ec8ff',
    accentSoft: '#e1f4ff',
  },
  {
    id: 'chen',
    name: 'Imani Chen',
    role: 'Flight Engineer',
    badge: 'IC',
    accent: '#ffd166',
    accentSoft: '#fff1c4',
  },
  {
    id: 'alvarez',
    name: 'Tomas Alvarez',
    role: 'Mission Specialist',
    badge: 'TA',
    accent: '#b8f2a7',
    accentSoft: '#e8ffdf',
  },
  {
    id: 'patel',
    name: 'Asha Patel',
    role: 'Flight Medic',
    badge: 'AP',
    accent: '#f7a8d8',
    accentSoft: '#ffe7f5',
  },
  {
    id: 'holm',
    name: 'Niko Holm',
    role: 'Guidance Lead',
    badge: 'NH',
    accent: '#c3b6ff',
    accentSoft: '#f0ebff',
  },
]

export const DEFAULT_CREW_IDS = ['vega', 'okafor', 'chen'] as const