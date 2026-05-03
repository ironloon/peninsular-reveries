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
    icon: '🪄',
    status: 'live',
  },
  {
    slug: 'chompers',
    name: 'Chompers',
    description: 'Solve math problems and feed a hungry hippo the right answer!',
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
  {
    slug: 'story-trail',
    name: 'Story Trail',
    description: 'Read, explore, and solve puzzles on five adventure trails.',
    icon: '📖',
    status: 'live',
  },
  {
    slug: 'squares',
    name: 'Squares',
    description: 'Make the whole board match by flipping tiles with plus and X patterns.',
    icon: '🔳',
    status: 'live',
  },
  {
    slug: 'waterwall',
    name: 'Waterwall',
    description: 'A zen waterfall sandbox. Place barriers, redirect water, listen.',
    icon: '🌊',
    status: 'live',
  },
  {
    slug: 'beat-pad',
    name: 'Beat Pad',
    description: 'Tap, loop, and layer beats and bass on a neon beat pad.',
    icon: '🎵',
    status: 'live',
  },
  {
    slug: 'train-sounds',
    name: 'Train Sounds',
    description: 'Tap different parts of a train to hear it come alive.',
    icon: '🚆',
    status: 'live',
  },
  {
    slug: 'spot-on',
    name: 'Spot On',
    description:
      'Tidy up cozy rooms by picking up items and finding the right spot for each one.',
    icon: '🧹',
    status: 'live',
  },
  {
    slug: 'peekaboo',
    name: 'Peekaboo',
    description: "Find the hidden character! Look through the fog to discover who's hiding.",
    icon: '🙈',
    status: 'live',
  },
  {
    slug: 'copycat',
    name: 'Copycat',
    description: 'Mirror the dancer\'s moves using your camera.',
    icon: '🐱',
    status: 'live',
  },
  {
    slug: 'dragons-crunch',
    name: "Dragon's Crunch",
    description: 'Be a dragon and chomp falling food using your camera. Then breathe fire to celebrate!',
    icon: '🐉',
    status: 'live',
  },
  {
    slug: 'mudskipper',
    name: 'Mudskipper',
    description: 'Jump to make your mudskipper splash in the mud before the screen fills up!',
    icon: '🐟',
    status: 'live',
  },
]
