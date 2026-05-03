import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const allAboardAttribution: GameAttribution = {
  slug: 'all-aboard',
  name: 'All Aboard',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'PixiJS',
      type: 'other',
      usedIn: 'All Aboard game rendering via PixiJS',
      creator: 'PixiJS Contributors',
      source: 'https://pixijs.com/',
      sourceUrl: 'https://pixijs.com/',
      license: 'MIT',
      modifications: 'Not applicable',
      notes: '2D WebGL rendering engine used for the game stage.',
    },
    {
      title: 'Web Speech API',
      type: 'other',
      usedIn: 'All Aboard voice synthesis for "All Aboard!" announcement',
      creator: 'W3C / Browser vendors',
      source: 'https://wicg.github.io/speech-api/',
      sourceUrl: 'https://wicg.github.io/speech-api/',
      license: 'W3C Community License',
      modifications: 'Not applicable',
      notes: 'Built-in browser API used for text-to-speech. No external service required.',
    },
  ],
}