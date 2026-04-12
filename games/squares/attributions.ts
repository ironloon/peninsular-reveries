import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const squaresAttribution: GameAttribution = {
  slug: 'squares',
  name: 'Squares',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Squares music profiles',
      type: 'music',
      usedIn: 'Squares chill and tense menu and play music profiles',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Both music profiles are synthesized at runtime with deterministic note schedules. No bundled music files ship with the game.',
    },
    {
      title: 'Squares sound effects',
      type: 'sound effect',
      usedIn: 'Squares move confirmations, pattern switches, and win cue',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'All sound effects are synthesized at runtime unless a future implementation proves external media necessary.',
    },
  ],
}