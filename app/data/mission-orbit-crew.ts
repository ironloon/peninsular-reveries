export interface MissionCrewProfile {
  readonly id: string
  readonly name: string
  readonly role: string
  readonly agency: string
  readonly badge: string
  readonly accent: string
  readonly accentSoft: string
}

export const MISSION_CREW_ROSTER: readonly MissionCrewProfile[] = [
  {
    id: 'wiseman',
    name: 'Reid Wiseman',
    role: 'Commander',
    agency: 'NASA',
    badge: 'RW',
    accent: '#ff8a65',
    accentSoft: '#ffe4d8',
  },
  {
    id: 'glover',
    name: 'Victor Glover',
    role: 'Pilot',
    agency: 'NASA',
    badge: 'VG',
    accent: '#7ec8ff',
    accentSoft: '#e1f4ff',
  },
  {
    id: 'koch',
    name: 'Christina Koch',
    role: 'Mission Specialist',
    agency: 'NASA',
    badge: 'CK',
    accent: '#ffd166',
    accentSoft: '#fff1c4',
  },
  {
    id: 'hansen',
    name: 'Jeremy Hansen',
    role: 'Mission Specialist',
    agency: 'CSA',
    badge: 'JH',
    accent: '#b8f2a7',
    accentSoft: '#e8ffdf',
  },
]
