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
]
