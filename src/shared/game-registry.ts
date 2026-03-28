export interface GameEntry {
  slug: string
  name: string
  description: string
}

export const games: GameEntry[] = [
  {
    slug: 'super-word',
    name: 'Super Word',
    description: 'Find hidden letters and spell the secret word.',
  },
]
