import type { GameAttribution } from './types.js'
import { repositoryCodeLicense } from './types.js'

export const pixelPassportAttribution: GameAttribution = {
  slug: 'pixel-passport',
  name: 'Pixel Passport',
  codeLicense: repositoryCodeLicense,
  summary: 'Pixel Passport uses original DOM-rendered pixel scenes, original clue writing, and browser-synthesized travel tones. No third-party art, photo, or audio assets are bundled for the game.',
  entries: [
    {
      title: 'Pixel Passport globe, destination scenes, Pip sprite, and vehicle sprites',
      type: 'illustration',
      usedIn: 'Pixel Passport title screen, globe hub, travel scenes, destination scenes, room shelf, and mystery screens',
      creator: 'Peninsular Reveries',
      source: 'Original DOM-rendered pixel art defined in the repository',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'The globe, landmarks, guide character, and transport forms are rendered as CSS-driven pixel grids in the browser instead of bundled images.',
    },
    {
      title: 'Pixel Passport travel tones and clue chimes',
      type: 'music',
      usedIn: 'Pixel Passport menu taps, travel start cues, travel loops, clue reveals, and memory celebrations',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'All interactive sounds are synthesized at runtime. No external samples or music files are bundled for Pixel Passport.',
    },
  ],
}
