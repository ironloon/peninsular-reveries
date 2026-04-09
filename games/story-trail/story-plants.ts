import type { Story } from './types.js'

export const plantsStory: Story = {
  id: 'plants',
  title: 'Tiny Seed',
  icon: '🌱',
  theme: 'plants',
  description: 'Watch a tiny seed grow into a flower.',
  startSceneId: 'garden-start',
  badgeEmoji: '🌻',
  badgeName: 'Sunflower Badge',
  items: [
    { id: 'shovel', name: 'Little Shovel', description: 'Digs a hole in the soil.' },
    { id: 'watering-can', name: 'Watering Can', description: 'Gives water to plants.' },
    { id: 'seeds', name: 'Seeds', description: 'Tiny packets of life ready to grow.' },
  ],
  scenes: [
    {
      id: 'garden-start',
      description: 'You are at a sunny garden today.',
      illustration: '~ 🌞 ~',
      choices: [
        { text: 'Find the little shovel', targetSceneId: 'got-shovel', grantsItemId: 'shovel' },
        { text: 'Walk to the soil', targetSceneId: 'dig-hole' },
      ],
    },
    {
      id: 'got-shovel',
      description: 'You find the little shovel. Time to dig!',
      illustration: '~ ⛏️ ~',
      choices: [
        { text: 'Walk to the soil', targetSceneId: 'dig-hole' },
      ],
    },
    {
      id: 'dig-hole',
      description: 'Soft dark soil sits in the garden bed.',
      illustration: '~ 🟫 ~',
      choices: [
        {
          text: 'Dig a hole',
          targetSceneId: 'plant-seed',
          requiredItemId: 'shovel',
          hint: 'You need a shovel to dig here!',
          grantsItemId: 'seeds',
        },
        { text: 'Go get the shovel first', targetSceneId: 'garden-start' },
      ],
    },
    {
      id: 'plant-seed',
      description: 'You dug a hole. Now plant a seed!',
      illustration: '~ 🌱 ~',
      choices: [
        { text: 'Drop a seed in the hole', targetSceneId: 'water-soil' },
      ],
    },
    {
      id: 'water-soil',
      description: 'The little seed needs water to grow.',
      illustration: '~ 💧 ~',
      choices: [
        {
          text: 'Pour water on the seed',
          targetSceneId: 'watch-roots',
          requiredItemId: 'watering-can',
          hint: 'You need the watering can!',
        },
        { text: 'Find the watering can', targetSceneId: 'got-watering-can', grantsItemId: 'watering-can' },
      ],
    },
    {
      id: 'got-watering-can',
      description: 'You find the watering can. Fill it up!',
      illustration: '~ 🪣 ~',
      choices: [
        { text: 'Pour water on the seed', targetSceneId: 'watch-roots' },
      ],
    },
    {
      id: 'watch-roots',
      description: 'Tiny white roots grow deep in the soil.',
      illustration: '~ 🌿 ~',
      choices: [
        { text: 'Watch the stem grow', targetSceneId: 'stem-grows' },
      ],
    },
    {
      id: 'stem-grows',
      description: 'A green stem pokes up toward the sun!',
      illustration: '~ 🌱 🌱 ~',
      choices: [
        { text: 'Wait for the leaves', targetSceneId: 'leaves-appear' },
      ],
    },
    {
      id: 'leaves-appear',
      description: 'Two small green leaves open wide.',
      illustration: '~ 🍃 ~',
      choices: [
        { text: 'Wait for the flower', targetSceneId: 'flower-blooms' },
      ],
    },
    {
      id: 'flower-blooms',
      description: 'A bright yellow flower! You grew a plant!',
      illustration: '~ 🌻 🌻 🌻 ~',
      isEnd: true,
      choices: [],
    },
  ],
}
