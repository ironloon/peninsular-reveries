import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const missionorbitimmersiveAttribution: GameAttribution = {
  slug: 'mission-orbit-immersive',
  name: 'Mission: Orbit Immersive',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Immersive mode body tracking',
      type: 'other',
      usedIn: 'Mission: Orbit Immersive camera-based input',
      creator: 'Peninsular Reveries',
      source: 'Original implementation',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Uses webcam motion detection for touchless interaction.',
    },
  ],
}