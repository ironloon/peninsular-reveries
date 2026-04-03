export interface GameEntry {
  slug: string
  name: string
  description: string
  icon: string
  status: 'live' | 'coming-soon'
}

export const games: GameEntry[] = [
  {
    slug: 'super-word',
    name: 'Super Word',
    description: 'Find hidden letters and spell the secret word.',
    icon: '✦',
    status: 'live',
  },
  {
    slug: 'mission-orbit',
    name: 'Mission: Orbit',
    description: 'Launch a spacecraft, orbit Earth, fly past the Moon, and explore the solar system. Inspired by Artemis II and The Magic School Bus.',
    icon: '🚀',
    status: 'coming-soon',
  },
]
