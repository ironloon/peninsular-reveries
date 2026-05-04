import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const storytrailimmersiveAttribution: GameAttribution = {
  slug: 'story-trail-immersive',
  name: 'Story Trail Immersive',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Immersive mode body tracking',
      type: 'other',
      usedIn: 'Story Trail Immersive camera-based input',
      creator: 'Peninsular Reveries',
      source: 'Original implementation',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Uses webcam motion detection for touchless interaction.',
    },
  ],
}