import type { Story } from './types.js'

export const sensesStory: Story = {
  id: 'senses',
  title: 'Super Senses',
  icon: '👃',
  theme: 'senses',
  description: 'Use all five senses to explore the world.',
  startSceneId: 'sense-garden',
  badgeEmoji: '🎭',
  badgeName: 'Senses Badge',
  items: [
    { id: 'magnifying-glass', name: 'Magnifying Glass', description: 'Makes small things look bigger.' },
    { id: 'earplugs', name: 'Earplugs', description: 'Help you notice quiet sounds.' },
    { id: 'blindfold', name: 'Soft Blindfold', description: 'Helps you focus on other senses.' },
  ],
  scenes: [
    {
      id: 'sense-garden',
      description: 'A garden full of things to sense awaits.',
      illustration: '~ 🌸 🌼 🌸 ~',
      choices: [
        { text: 'Pick up magnifying glass', targetSceneId: 'sight-station', grantsItemId: 'magnifying-glass' },
        { text: 'Walk to the sight station', targetSceneId: 'sight-station' },
      ],
    },
    {
      id: 'sight-station',
      description: 'So many colors and shapes all around you.',
      illustration: '~ 👁️ 🎨 ~',
      choices: [
        {
          text: 'Find the tiny bug',
          targetSceneId: 'found-bug',
          requiredItemId: 'magnifying-glass',
          hint: 'Try the magnifying glass!',
        },
        { text: 'Move on to sounds', targetSceneId: 'sound-station' },
      ],
    },
    {
      id: 'found-bug',
      description: 'Tiny green bug hides in a bright red rose.',
      illustration: '~ 🐛 🌹 ~',
      choices: [
        { text: 'Move on to sounds', targetSceneId: 'sound-station' },
      ],
    },
    {
      id: 'sound-station',
      description: 'Loud and soft sounds fill the air here.',
      illustration: '~ 🔔 🎵 ~',
      choices: [
        { text: 'Grab the earplugs to listen', targetSceneId: 'quiet-listen', grantsItemId: 'earplugs' },
        { text: 'Walk to the smell station', targetSceneId: 'smell-station' },
      ],
    },
    {
      id: 'quiet-listen',
      description: 'With earplugs, you hear every tiny sound.',
      illustration: '~ 🤫 ~',
      choices: [
        { text: 'Go to the smell station', targetSceneId: 'smell-station' },
      ],
    },
    {
      id: 'smell-station',
      description: 'Sweet flowers and fresh bread smell great.',
      illustration: '~ 🌺 🍞 ~',
      choices: [
        { text: 'Grab the soft blindfold', targetSceneId: 'taste-station', grantsItemId: 'blindfold' },
        { text: 'Walk to the taste station', targetSceneId: 'taste-station' },
      ],
    },
    {
      id: 'taste-station',
      description: 'Sweet and sour treats wait on the table.',
      illustration: '~ 🍋 🍓 ~',
      choices: [
        { text: 'Move on to touch', targetSceneId: 'touch-station' },
      ],
    },
    {
      id: 'touch-station',
      description: 'Rough rocks and smooth silk sit in a box.',
      illustration: '~ 🪨 🧣 ~',
      choices: [
        { text: 'Head to the celebration', targetSceneId: 'sense-celebration' },
      ],
    },
    {
      id: 'sense-celebration',
      description: 'You used all five senses! Amazing explorer!',
      illustration: '~ 🎭 🎉 🎭 ~',
      isEnd: true,
      choices: [],
    },
  ],
}
