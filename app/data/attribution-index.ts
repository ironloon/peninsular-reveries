import { chompersAttribution } from '../../games/chompers/attributions.js'
import { chompersInfo } from '../../games/chompers/info.js'
import { missionOrbitAttribution } from '../../games/mission-orbit/attributions.js'
import { missionOrbitInfo } from '../../games/mission-orbit/info.js'
import { pixelPassportAttribution } from '../../games/pixel-passport/attributions.js'
import { pixelPassportInfo } from '../../games/pixel-passport/info.js'
import { squaresAttribution } from '../../games/squares/attributions.js'
import { squaresInfo } from '../../games/squares/info.js'
import { superWordAttribution } from '../../games/super-word/attributions.js'
import { superWordInfo } from '../../games/super-word/info.js'
import { storyTrailAttribution } from '../../games/story-trail/attributions.js'
import { storyTrailInfo } from '../../games/story-trail/info.js'
import { trainSoundsAttribution } from '../../games/train-sounds/attributions.js'
import { trainSoundsInfo } from '../../games/train-sounds/info.js'
import { waterwallAttribution } from '../../games/waterwall/attributions.js'
import { waterwallInfo } from '../../games/waterwall/info.js'
import { beatPadAttribution } from '../../games/beat-pad/attributions.js'
import { beatPadInfo } from '../../games/beat-pad/info.js'
import { spotOnAttribution } from '../../games/spot-on/attributions.js'
import { spotOnInfo } from '../../games/spot-on/info.js'
import { peekabooAttribution } from '../../games/peekaboo/attributions.js'
import { peekabooInfo } from '../../games/peekaboo/info.js'
import { copycatAttribution } from '../../games/copycat/attributions.js'
import { copycatInfo } from '../../games/copycat/info.js'
import { dragonsCrunchAttribution } from '../../games/dragons-crunch/attributions.js'
import { dragonsCrunchInfo } from '../../games/dragons-crunch/info.js'
import type { GameAttribution, GameInfo } from './attribution-types.js'
import { attributionsPagePath, repositoryCodeLicense } from './attribution-types.js'

export type { AttributionEntry, GameAttribution, GameInfo } from './attribution-types.js'
export { attributionsPagePath, repositoryCodeLicense } from './attribution-types.js'

export interface GameAttributionWithInfo extends GameAttribution {
  readonly summary: string
}

const gameEntries: readonly { attribution: GameAttribution; info: GameInfo }[] = [
  { attribution: missionOrbitAttribution, info: missionOrbitInfo },
  { attribution: superWordAttribution, info: superWordInfo },
  { attribution: chompersAttribution, info: chompersInfo },
  { attribution: pixelPassportAttribution, info: pixelPassportInfo },
  { attribution: storyTrailAttribution, info: storyTrailInfo },
  { attribution: squaresAttribution, info: squaresInfo },
  { attribution: waterwallAttribution, info: waterwallInfo },
  { attribution: beatPadAttribution, info: beatPadInfo },
  { attribution: trainSoundsAttribution, info: trainSoundsInfo },
  { attribution: spotOnAttribution, info: spotOnInfo },
  { attribution: peekabooAttribution, info: peekabooInfo },
  { attribution: copycatAttribution, info: copycatInfo },
  { attribution: dragonsCrunchAttribution, info: dragonsCrunchInfo },
]

export const gameAttributions: readonly GameAttributionWithInfo[] = gameEntries.map(
  ({ attribution, info }) => ({ ...attribution, summary: info.summary })
)

export function getGameAttribution(slug: string): GameAttributionWithInfo {
  const entry = gameAttributions.find((g) => g.slug === slug)
  if (!entry) {
    throw new Error(`Missing attribution data for game: ${slug}`)
  }
  return entry
}

export function getGameInfo(slug: string): GameInfo {
  const entry = gameEntries.find((g) => g.attribution.slug === slug)
  if (!entry) {
    throw new Error(`Missing info data for game: ${slug}`)
  }
  return entry.info
}

export function renderAttributionsMarkdown(): string {
  const lines: string[] = [
    '# Attributions',
    '',
    '> This file is generated from per-game files in `games/*/attributions.ts`. Run `pnpm sync:attributions` after changes.',
    '',
    '## Repository',
    '',
    `- Code license: ${repositoryCodeLicense}`,
    `- Public page: ${attributionsPagePath}`,
    '- Attribution policy: deployed games should surface their own credits in the UI when they use third-party or notable media resources.',
    '',
    '## Games',
    '',
  ]

  for (const game of gameAttributions) {
    lines.push(`### ${game.name}`)
    lines.push('')
    lines.push(`- Slug: ${game.slug}`)
    lines.push(`- Code license: ${game.codeLicense}`)
    lines.push(`- Summary: ${game.summary}`)
    lines.push('')

    if (game.entries.length === 0) {
      lines.push('- No attribution entries recorded.')
      lines.push('')
      continue
    }

    lines.push('#### Entries')
    lines.push('')

    for (const entry of game.entries) {
      lines.push(`##### ${entry.title}`)
      lines.push('')
      lines.push(`- Type: ${entry.type}`)
      lines.push(`- Used in: ${entry.usedIn}`)
      lines.push(`- Creator: ${entry.creator}`)
      lines.push(`- Source: ${entry.source}${entry.sourceUrl ? ` (${entry.sourceUrl})` : ''}`)
      lines.push(`- License: ${entry.license}${entry.licenseUrl ? ` (${entry.licenseUrl})` : ''}`)
      lines.push(`- Modifications: ${entry.modifications}`)
      if (entry.notes) {
        lines.push(`- Notes: ${entry.notes}`)
      }
      lines.push('')
    }
  }

  return `${lines.join('\n').trimEnd()}\n`
}
