import type { GameAttribution } from './types.js'
import { repositoryCodeLicense } from './types.js'

export const superWordAttribution: GameAttribution = {
  slug: 'super-word',
  name: 'Super Word',
  codeLicense: repositoryCodeLicense,
  summary: 'The deployed game shows credits in Settings. Its word bank groups concrete, imageable vocabulary into a research-backed reading progression using public early-literacy references including Dolch sight words (1936), Fry Instant Words (1979), systematic phonics progressions summarized by the National Reading Panel (2000), and Common Core K–3 Foundational Skills patterns. Starter words focus on high-frequency two-letter terms; later tiers move through CVC words, consonant blends, long-vowel patterns, and six-letter fluent-reader vocabulary. No third-party media assets are currently bundled for Super Word.',
  entries: [
    {
      title: 'Ambient synth soundtrack',
      type: 'music',
      usedIn: 'Super Word settings music toggle',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'This soundtrack is synthesized at runtime. No external recording, loop, or sample pack is used.',
    },
    {
      title: 'Word-stage puzzle progression',
      type: 'other',
      usedIn: 'Super Word difficulty tiers and puzzle ordering',
      creator: 'Peninsular Reveries, informed by public literacy research',
      source: 'Original word list grouped using Dolch sight words, Fry Instant Words, systematic phonics scope-and-sequence references, and Common Core K–3 Foundational Skills patterns',
      license: repositoryCodeLicense,
      modifications: 'Grouped concrete, imageable words into five tiers: high-frequency two-letter words, CVC words, four-letter blend and digraph words, five-letter long-vowel and vowel-team words, and six-letter fluent-reader vocabulary. Expanded each tier so random sessions draw from a broader pool while keeping scenes recognizable for children.',
      notes: 'This is a playful reading ramp rather than a formal curriculum. The public references above informed the sequencing, while the final word choices were filtered for kid-friendly meaning, concrete imagery, and scene readability.',
    },
  ],
}
