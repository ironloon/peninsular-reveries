import type { Story } from './types.js'

export const theStory: Story = {
  id: 'hidden-garden',
  title: 'The Hidden Garden',
  icon: '🌿',
  theme: 'nature',
  description: 'Find a secret garden and bring it back to life.',
  startSceneId: 'garden-gate',
  badgeEmoji: '🌿',
  badgeName: 'Garden Explorer',
  items: [
    { id: 'garden-gloves', name: 'Garden Gloves', description: 'Thick gloves for thorns and mud.' },
    { id: 'watering-can', name: 'Watering Can', description: 'A red can full of fresh water.' },
    { id: 'lantern', name: 'Lantern', description: 'A warm light for dark places.' },
    { id: 'seed-pouch', name: 'Seed Pouch', description: 'A pouch of tiny flower seeds.' },
    { id: 'bird-whistle', name: 'Bird Whistle', description: 'A small whistle shaped like a bird.' },
  ],
  scenes: [
    // ── Opening ──
    {
      id: 'garden-gate',
      description: 'An old gate hides in the stone wall. You push it open.',
      illustration: '~ 🚪 🌿 ~',
      choices: [
        { text: 'Pick up the gloves', targetSceneId: 'got-gloves', grantsItemId: 'garden-gloves' },
        { text: 'Walk through the gate', targetSceneId: 'mossy-path' },
      ],
    },
    {
      id: 'got-gloves',
      description: 'You put on thick garden gloves. They feel warm!',
      illustration: '~ 🧤 ~',
      choices: [
        { text: 'Walk through the gate', targetSceneId: 'mossy-path' },
      ],
    },

    // ── Fork ──
    {
      id: 'mossy-path',
      description: 'Green moss covers the path. Rain is in the air.',
      illustration: '~ 🌿 🌿 🌿 ~',
      choices: [
        { text: 'Go left to the shed', targetSceneId: 'old-shed' },
        { text: 'Go right to the sun', targetSceneId: 'sunny-clearing' },
      ],
    },

    // ── Shed / Greenhouse branch ──
    {
      id: 'old-shed',
      description: 'A small shed sits under a big oak tree.',
      illustration: '~ 🏚️ 🌳 ~',
      choices: [
        { text: 'Grab the watering can', targetSceneId: 'got-watering-can', grantsItemId: 'watering-can' },
        { text: 'Look inside the shed', targetSceneId: 'dusty-greenhouse' },
      ],
    },
    {
      id: 'got-watering-can',
      description: 'The red can is full of water.',
      illustration: '~ 🚿 ~',
      choices: [
        { text: 'Look inside the shed', targetSceneId: 'dusty-greenhouse' },
        { text: 'Go back to the path', targetSceneId: 'mossy-path' },
      ],
    },
    {
      id: 'dusty-greenhouse',
      description: 'Rain taps on the glass roof. It is dark in here.',
      illustration: '~ 🌧️ 🏠 ~',
      choices: [
        { text: 'Feel around in the dark', targetSceneId: 'found-lantern', grantsItemId: 'lantern' },
        { text: 'Go back outside', targetSceneId: 'mossy-path' },
      ],
    },
    {
      id: 'found-lantern',
      description: 'You find a dusty lantern on a shelf.',
      illustration: '~ 🏮 ~',
      choices: [
        { text: 'Light the lantern', targetSceneId: 'greenhouse-lit', requiredItemId: 'lantern', hint: 'Tap the lantern in your bag.' },
        { text: 'Go back outside', targetSceneId: 'mossy-path' },
      ],
    },
    {
      id: 'greenhouse-lit',
      description: 'Warm light fills the room. Tiny plants sit in pots.',
      illustration: '~ 🌱 🏮 🌱 ~',
      choices: [
        { text: 'Take the seed pouch', targetSceneId: 'got-seeds', grantsItemId: 'seed-pouch' },
        { text: 'Go back outside', targetSceneId: 'rainy-path' },
      ],
    },
    {
      id: 'got-seeds',
      description: 'The pouch is full of tiny flower seeds.',
      illustration: '~ 🌸 ~',
      choices: [
        { text: 'Go back outside', targetSceneId: 'rainy-path' },
      ],
    },

    // ── Weather transition ──
    {
      id: 'rainy-path',
      description: 'Rain falls softly. Puddles shine on the path.',
      illustration: '~ 🌧️ 💧 ~',
      choices: [
        { text: 'Splash through puddles', targetSceneId: 'sunny-clearing' },
        { text: 'Wait for the sun', targetSceneId: 'pond-edge' },
      ],
    },

    // ── Senses branch ──
    {
      id: 'sunny-clearing',
      description: 'Sun warms your face. Birds sing. Flowers smell sweet.',
      illustration: '~ ☀️ 🌼 ~',
      choices: [
        { text: 'Smell the tall flowers', targetSceneId: 'flower-patch' },
        { text: 'Listen to the birds', targetSceneId: 'bird-song' },
      ],
    },
    {
      id: 'flower-patch',
      description: 'Big soft petals brush your cheek. Sweet like honey.',
      illustration: '~ 🌺 🌸 ~',
      choices: [
        { text: 'Walk to the pond', targetSceneId: 'pond-edge' },
        { text: 'Plant seeds here', targetSceneId: 'planted-clearing', requiredItemId: 'seed-pouch', hint: 'You need seeds to plant here.' },
      ],
    },
    {
      id: 'planted-clearing',
      description: 'You drop seeds in the soft dirt. Rain will help them.',
      illustration: '~ 🌱 🌱 🌱 ~',
      choices: [
        { text: 'Walk to the pond', targetSceneId: 'pond-edge' },
        { text: 'Explore the woods', targetSceneId: 'deep-woods' },
      ],
    },
    {
      id: 'bird-song',
      description: 'A small bird sings high in a tree.',
      illustration: '~ 🐦 🎵 ~',
      choices: [
        { text: 'Pick up the whistle', targetSceneId: 'got-whistle', grantsItemId: 'bird-whistle' },
        { text: 'Follow the bird', targetSceneId: 'deep-woods' },
      ],
    },
    {
      id: 'got-whistle',
      description: 'The bird whistle makes a sweet, clear sound.',
      illustration: '~ 🎵 ~',
      choices: [
        { text: 'Follow the bird', targetSceneId: 'deep-woods' },
        { text: 'Walk to the pond', targetSceneId: 'pond-edge' },
      ],
    },

    // ── Habitats branch ──
    {
      id: 'pond-edge',
      description: 'A clear pond is home to frogs and tiny fish.',
      illustration: '~ 💧 🐸 🐟 ~',
      choices: [
        { text: 'Watch the frogs', targetSceneId: 'frog-log' },
        { text: 'Call the birds', targetSceneId: 'birds-help', requiredItemId: 'bird-whistle', hint: 'Maybe a whistle would help.' },
      ],
    },
    {
      id: 'frog-log',
      description: 'A green frog sits on a log. A tiny turtle hides.',
      illustration: '~ 🐸 🪵 🐢 ~',
      choices: [
        { text: 'Help the turtle', targetSceneId: 'turtle-safe' },
        { text: 'Walk to the woods', targetSceneId: 'deep-woods' },
      ],
    },
    {
      id: 'turtle-safe',
      description: 'You help the turtle to the water. It looks up at you.',
      illustration: '~ 🐢 💧 ~',
      choices: [
        { text: 'Walk to the woods', targetSceneId: 'deep-woods' },
        { text: 'Stay by the pond', targetSceneId: 'ending-haven' },
      ],
    },
    {
      id: 'birds-help',
      description: 'You blow the whistle. Birds fly in and drop seeds!',
      illustration: '~ 🐦 🌱 🐦 ~',
      choices: [
        { text: 'Watch the garden grow', targetSceneId: 'ending-bloom' },
      ],
    },

    // ── Deep woods / Gardener branch ──
    {
      id: 'deep-woods',
      description: 'Tall trees stand close. It is quiet and cool here.',
      illustration: '~ 🌲 🌲 🌲 ~',
      choices: [
        { text: 'Clear the brambles', targetSceneId: 'cleared-path', requiredItemId: 'garden-gloves', hint: 'Thorns! You need gloves.' },
        { text: 'Look for a friend', targetSceneId: 'meet-gardener' },
      ],
    },
    {
      id: 'cleared-path',
      description: 'You push the thorns back. A hidden grove is here!',
      illustration: '~ 🌿 ✨ ~',
      choices: [
        { text: 'Step into the grove', targetSceneId: 'secret-grove' },
      ],
    },
    {
      id: 'secret-grove',
      description: 'Flowers of every color fill this hidden place.',
      illustration: '~ 🌷 🌻 🌹 ~',
      choices: [
        { text: 'Water the flowers', targetSceneId: 'ending-bloom', requiredItemId: 'watering-can', hint: 'The flowers look thirsty.' },
        { text: 'Sit and rest here', targetSceneId: 'ending-haven' },
      ],
    },

    // ── Helpers branch ──
    {
      id: 'meet-gardener',
      description: 'A kind gardener smiles at you from a bench.',
      illustration: '~ 🧑‍🌾 ~',
      choices: [
        { text: 'Help pull weeds', targetSceneId: 'helped-gardener' },
        { text: 'Ask about the garden', targetSceneId: 'garden-story' },
      ],
    },
    {
      id: 'helped-gardener',
      description: 'You help pull weeds. The gardener says thank you.',
      illustration: '~ 🌿 ⭐ ~',
      choices: [
        { text: 'Plant seeds together', targetSceneId: 'ending-friend', requiredItemId: 'seed-pouch', hint: 'You need some seeds!' },
        { text: 'Walk to the grove', targetSceneId: 'secret-grove' },
      ],
    },
    {
      id: 'garden-story',
      description: 'The gardener says this garden was here long ago.',
      illustration: '~ 📖 ~',
      choices: [
        { text: 'Help clear the path', targetSceneId: 'cleared-path', requiredItemId: 'garden-gloves', hint: 'Thorns! You need gloves.' },
        { text: 'Walk to the grove', targetSceneId: 'secret-grove' },
      ],
    },

    // ── Endings ──
    {
      id: 'ending-bloom',
      description: 'Flowers bloom everywhere! The garden is alive again!',
      illustration: '~ 🌸 🌻 🌺 ~',
      isEnd: true,
      choices: [],
    },
    {
      id: 'ending-haven',
      description: 'Birds, frogs, and turtles call this place home now.',
      illustration: '~ 🦋 🐸 🐢 ~',
      isEnd: true,
      choices: [],
    },
    {
      id: 'ending-friend',
      description: 'You and the gardener plant seeds side by side.',
      illustration: '~ 🌱 🤝 🌱 ~',
      isEnd: true,
      choices: [],
    },
  ],
}

