export interface GameEntry {
  slug: string
  name: string
  description: string
  icon: string
  status: 'live' | 'coming-soon'
}

export const games: GameEntry[] = [
  {
    slug: 'mission-orbit',
    name: 'Mission: Orbit',
    description: 'Time the key Artemis II burns from liftoff to splashdown.',
    icon: '🚀',
    status: 'live',
  },
  {
    slug: 'super-word',
    name: 'Super Word',
    description: 'Find hidden letters and spell the secret word.',
    icon: '✦',
    status: 'live',
  },
  {
    slug: 'chompers',
    name: 'Chompers',
    description: 'Guide a hungry hippo and chomp falling fruit before it splats.',
    icon: '🦛',
    status: 'live',
  },
  {
    slug: 'pixel-passport',
    name: 'Pixel Passport',
    description: 'Hop on the magic bus, explore the world, and solve gentle clue-based mysteries.',
    icon: '🌍',
    status: 'live',
  },
]
