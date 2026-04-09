import { repositoryCodeLicense } from '../../app/data/attribution-types.js'
import type { GameAttribution } from '../../app/data/attribution-types.js'

export const storyTrailAttribution: GameAttribution = {
  slug: 'story-trail',
  name: 'Story Trail',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Ambient synth soundtrack',
      type: 'music',
      usedIn: 'Story Trail trail map ambient music',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Procedurally generated ambient pad using triangle and sine oscillators.'
    },
    {
      title: 'Sound effects',
      type: 'sound effect',
      usedIn: 'Story Trail typing blips, item collect chimes, choice confirms, and story complete fanfare',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'All sound effects are synthesized in real-time.'
    },
  ],
}
