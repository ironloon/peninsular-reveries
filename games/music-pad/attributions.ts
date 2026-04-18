import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const musicPadAttribution: GameAttribution = {
  slug: 'music-pad',
  name: 'Music Pad',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Music Pad synthesized drum sounds',
      type: 'sound effect',
      usedIn: 'Music Pad pad triggers across all eight color-coded pads',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Drum and percussion voices are synthesized at runtime with deterministic envelopes. No bundled audio files ship with the game.',
    },
    {
      title: 'Music Pad synthesized sound effects',
      type: 'sound effect',
      usedIn: 'Music Pad UI feedback for record, play, stop, and clear',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'All UI sound effects are synthesized at runtime unless a future implementation proves external media necessary.',
    },
    {
      title: 'Music Pad CC0 sample placeholder',
      type: 'sound effect',
      usedIn: 'Reserved slot for future CC0 percussion samples if needed',
      creator: 'To be determined',
      source: 'Sourcing deferred to a later leg',
      license: 'CC0',
      modifications: 'To be determined',
      notes: 'Placeholder entry. No external samples ship today; sourcing is deferred and will be replaced with a real attribution if a CC0 sample is later adopted.',
    },
  ],
}
