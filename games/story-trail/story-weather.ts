import type { Story } from './types.js'

export const weatherStory: Story = {
  id: 'weather',
  title: 'Weather Watcher',
  icon: '🌦️',
  theme: 'weather',
  description: 'Learn about different kinds of weather.',
  startSceneId: 'sunny-park',
  badgeEmoji: '🌈',
  badgeName: 'Rainbow Badge',
  items: [
    { id: 'umbrella', name: 'Umbrella', description: 'Keeps you dry in the rain.' },
    { id: 'warm-coat', name: 'Warm Coat', description: 'Keeps you cozy in the cold.' },
    { id: 'sun-hat', name: 'Sun Hat', description: 'Keeps the sun off your head.' },
  ],
  scenes: [
    {
      id: 'sunny-park',
      description: 'It is a bright and sunny day at the park.',
      illustration: '~ ☀️ ☀️ ☀️ ~',
      choices: [
        { text: 'Put on your sun hat', targetSceneId: 'cloudy-sky', grantsItemId: 'sun-hat' },
        { text: 'Look at the cloudy sky', targetSceneId: 'cloudy-sky' },
      ],
    },
    {
      id: 'cloudy-sky',
      description: 'Big gray clouds fill the sky above you.',
      illustration: '~ ☁️ ☁️ ☁️ ~',
      choices: [
        { text: 'Grab an umbrella', targetSceneId: 'rainy-path', grantsItemId: 'umbrella' },
        { text: 'Walk into the rain', targetSceneId: 'rainy-path' },
      ],
    },
    {
      id: 'rainy-path',
      description: 'Rain falls hard on the path ahead.',
      illustration: '~ 💧 💧 💧 ~',
      choices: [
        {
          text: 'Cross with the umbrella',
          targetSceneId: 'windy-hill',
          requiredItemId: 'umbrella',
          hint: 'You need an umbrella to cross!',
        },
        { text: 'Go back for the umbrella', targetSceneId: 'cloudy-sky' },
      ],
    },
    {
      id: 'windy-hill',
      description: 'Cold wind blows hard on the tall hill.',
      illustration: '~ 💨 💨 💨 ~',
      choices: [
        { text: 'Put on the warm coat', targetSceneId: 'got-warm-coat', grantsItemId: 'warm-coat' },
        { text: 'Look at the snowy field', targetSceneId: 'snowy-field' },
      ],
    },
    {
      id: 'got-warm-coat',
      description: 'You put on a warm coat. You feel cozy!',
      illustration: '~ 🧥 ~',
      choices: [
        { text: 'Walk to the snowy field', targetSceneId: 'snowy-field' },
      ],
    },
    {
      id: 'snowy-field',
      description: 'White snow covers the cold, quiet ground.',
      illustration: '~ ❄️ ❄️ ❄️ ~',
      choices: [
        {
          text: 'Walk through the snow',
          targetSceneId: 'after-storm',
          requiredItemId: 'warm-coat',
          hint: 'You need a warm coat for the snow!',
        },
        { text: 'Go back for a coat', targetSceneId: 'windy-hill' },
      ],
    },
    {
      id: 'after-storm',
      description: 'The storm is done. The sun comes back!',
      illustration: '~ 🌤️ ~',
      choices: [
        { text: 'Look for the rainbow', targetSceneId: 'rainbow-end' },
      ],
    },
    {
      id: 'rainbow-end',
      description: 'A bright rainbow fills the sky. Hooray!',
      illustration: '~ 🌈 🌈 🌈 ~',
      isEnd: true,
      choices: [],
    },
  ],
}
