import type { Story } from './types.js'

export const helpersStory: Story = {
  id: 'helpers',
  title: 'Helper Town',
  icon: '🚒',
  theme: 'helpers',
  description: 'Meet the helpers who take care of our town.',
  startSceneId: 'town-square',
  badgeEmoji: '⭐',
  badgeName: 'Gold Star Badge',
  items: [
    { id: 'tool-kit', name: 'Tool Kit', description: 'Has everything you need to help.' },
    { id: 'helper-badge', name: 'Helper Badge', description: 'Shows you are ready to help.' },
    { id: 'thank-you-card', name: 'Thank You Card', description: 'A card to say thank you.' },
  ],
  scenes: [
    {
      id: 'town-square',
      description: 'You stand in the sunny town square.',
      illustration: '~ 🏙️ ~',
      choices: [
        { text: 'Pick up the tool kit', targetSceneId: 'got-tool-kit', grantsItemId: 'tool-kit' },
        { text: 'Walk to the fire station', targetSceneId: 'fire-station' },
      ],
    },
    {
      id: 'got-tool-kit',
      description: 'You grab the tool kit. Ready to help!',
      illustration: '~ 🧰 ~',
      choices: [
        { text: 'Walk to the fire station', targetSceneId: 'fire-station' },
      ],
    },
    {
      id: 'fire-station',
      description: 'Firefighters wave from a big red truck.',
      illustration: '~ 🚒 ~',
      choices: [
        {
          text: 'Fix the truck',
          targetSceneId: 'got-helper-badge',
          requiredItemId: 'tool-kit',
          hint: 'You need a tool kit to fix it!',
          grantsItemId: 'helper-badge',
        },
        { text: 'Come back with the tool kit', targetSceneId: 'town-square' },
      ],
    },
    {
      id: 'got-helper-badge',
      description: 'They give you a helper badge. Wear it!',
      illustration: '~ ⭐ ~',
      choices: [
        { text: 'Walk to the clinic', targetSceneId: 'clinic' },
      ],
    },
    {
      id: 'clinic',
      description: 'A doctor waits in the small white clinic.',
      illustration: '~ 🏥 ~',
      choices: [
        {
          text: 'Help the doctor',
          targetSceneId: 'school-visit',
          requiredItemId: 'helper-badge',
          hint: 'You need your helper badge!',
        },
        { text: 'Get your badge first', targetSceneId: 'town-square' },
      ],
    },
    {
      id: 'school-visit',
      description: 'Happy kids sit in a sunny classroom.',
      illustration: '~ 📚 ~',
      choices: [
        { text: 'Help the teacher', targetSceneId: 'farm-visit', grantsItemId: 'thank-you-card' },
        { text: 'Go to the farm', targetSceneId: 'farm-visit' },
      ],
    },
    {
      id: 'farm-visit',
      description: 'A farmer plants seeds in dark rich soil.',
      illustration: '~ 🌾 ~',
      choices: [
        { text: 'Help the farmer plant seeds', targetSceneId: 'post-office' },
      ],
    },
    {
      id: 'post-office',
      description: 'Letters wait to be sent to every home.',
      illustration: '~ 📬 ~',
      choices: [
        { text: 'Help with the mail', targetSceneId: 'town-party' },
      ],
    },
    {
      id: 'town-party',
      description: 'The whole town cheers. You helped everyone!',
      illustration: '~ 🎉 ⭐ 🎉 ~',
      isEnd: true,
      choices: [],
    },
  ],
}
