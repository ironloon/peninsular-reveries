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
      source: 'Original word list organized by phonemic complexity using Dolch Sight Words (Dolch, 1936), Fry Instant Words (Fry, 1979), National Reading Panel phonics scope-and-sequence summary (NICHD, 2000), and Common Core State Standards K.RF Foundational Skills patterns',
      license: repositoryCodeLicense,
      modifications: 'Grouped words into five difficulty tiers by phonemic complexity: Sidekick (CVC and sight words, Pre-K/K), Hero (consonant blends and digraphs, K–Grade 1), Super (CVCe and vowel teams, Grade 1–2), Ultra (r-controlled vowels and two-syllable words, Grade 2–3), and Legend (complex clusters and multi-syllable vocabulary, Grade 3+). Each tier contains 48–56 unique words filtered for age-appropriate meaning, concrete imagery, and scene readability.',
      notes: 'This is a playful reading ramp rather than a formal curriculum. Sources consulted include the Dolch Pre-Primer through Grade 3 sight word lists, the Fry Instant Words (first 300), and phonics sequence frameworks referenced by the National Reading Panel and CCSS K–3 Foundational Skills. Final word selection was filtered for child-friendly meaning and suitability for a scene-based spelling game.',
    },
  ],
}
