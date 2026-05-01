import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const copycatAttribution: GameAttribution = {
  slug: 'copycat',
  name: 'Copycat',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'PixiJS',
      type: 'other',
      usedIn: 'Copycat game rendering via PixiJS',
      creator: 'PixiJS Contributors',
      source: 'https://pixijs.com/',
      sourceUrl: 'https://pixijs.com/',
      license: 'MIT',
      modifications: 'Not applicable',
      notes: '2D WebGL rendering engine used for the game stage.',
    },
  ],
}
