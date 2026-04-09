import type { Story } from './types.js'

export const habitatsStory: Story = {
  id: 'habitats',
  title: 'Animal Homes',
  icon: '🏡',
  theme: 'habitats',
  description: 'Find where each animal lives.',
  startSceneId: 'trail-start',
  badgeEmoji: '🦋',
  badgeName: 'Butterfly Badge',
  items: [
    { id: 'binoculars', name: 'Binoculars', description: 'Helps you see things far away.' },
    { id: 'net', name: 'Field Net', description: 'Great for exploring near water.' },
    { id: 'map', name: 'Trail Map', description: 'Shows you where to go.' },
  ],
  scenes: [
    {
      id: 'trail-start',
      description: 'A nature trail begins here. Explore!',
      illustration: '~ 🌳 🌳 🌳 ~',
      choices: [
        { text: 'Grab binoculars and go', targetSceneId: 'forest-path', grantsItemId: 'binoculars' },
        { text: 'Walk into the forest', targetSceneId: 'forest-path' },
      ],
    },
    {
      id: 'forest-path',
      description: 'Tall trees line the forest around you.',
      illustration: '~ 🌲 🌲 ~',
      choices: [
        {
          text: 'Spot bird with binoculars',
          targetSceneId: 'bird-nest',
          requiredItemId: 'binoculars',
          hint: 'You need binoculars to see it!',
        },
        { text: 'Look for the fox den', targetSceneId: 'fox-den' },
      ],
    },
    {
      id: 'bird-nest',
      description: 'A robin sits in her cozy nest up high.',
      illustration: '~ 🐦 🪺 ~',
      choices: [
        { text: 'Walk to the pond', targetSceneId: 'pond-path' },
      ],
    },
    {
      id: 'fox-den',
      description: 'A red fox peeks out from its warm den.',
      illustration: '~ 🦊 ~',
      choices: [
        { text: 'Walk to the pond', targetSceneId: 'pond-path' },
      ],
    },
    {
      id: 'pond-path',
      description: 'A clear blue pond shines in the sun.',
      illustration: '~ 💧 🌿 ~',
      choices: [
        { text: 'Grab the field net and look', targetSceneId: 'frog-watch', grantsItemId: 'net' },
        { text: 'Watch the pond', targetSceneId: 'frog-watch' },
      ],
    },
    {
      id: 'frog-watch',
      description: 'A frog and fish share the cool pond.',
      illustration: '~ 🐸 🐟 ~',
      choices: [
        { text: 'Pick up the trail map', targetSceneId: 'got-map', grantsItemId: 'map' },
        { text: 'Walk toward the desert', targetSceneId: 'desert-path' },
      ],
    },
    {
      id: 'got-map',
      description: 'You find the trail map. Now you know!',
      illustration: '~ 🗺️ ~',
      choices: [
        { text: 'Walk to the desert', targetSceneId: 'desert-path' },
      ],
    },
    {
      id: 'desert-path',
      description: 'Hot, dry sand stretches wide ahead.',
      illustration: '~ ☀️ 🏜️ ~',
      choices: [
        {
          text: 'Follow the map to a lizard',
          targetSceneId: 'nature-center',
          requiredItemId: 'map',
          hint: 'Better check the map first!',
        },
        { text: 'Go back for the map', targetSceneId: 'frog-watch' },
      ],
    },
    {
      id: 'nature-center',
      description: 'You found all the animal homes. Amazing!',
      illustration: '~ 🦋 🌸 🦋 ~',
      isEnd: true,
      choices: [],
    },
  ],
}
