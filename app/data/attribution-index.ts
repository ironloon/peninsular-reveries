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
import { mudskipperAttribution } from '../../games/mudskipper/attributions.js'
import { mudskipperInfo } from '../../games/mudskipper/info.js'
import { tunaPianoAttribution } from '../../games/tuna-piano/attributions.js'
import { tunaPianoInfo } from '../../games/tuna-piano/info.js'
import { growWithMeAttribution } from '../../games/grow-with-me/attributions.js'
import { growWithMeInfo } from '../../games/grow-with-me/info.js'
import { bakingSimulatorAttribution } from '../../games/baking-simulator/attributions.js'
import { bakingSimulatorInfo } from '../../games/baking-simulator/info.js'
import { allAboardAttribution } from '../../games/all-aboard/attributions.js'
import { allAboardInfo } from '../../games/all-aboard/info.js'
import { blockAttackAttribution } from '../../games/block-attack/attributions.js'
import { blockAttackInfo } from '../../games/block-attack/info.js'
import { chompersImmersiveAttribution } from '../../games/chompers-immersive/attributions.js'
import { chompersImmersiveInfo } from '../../games/chompers-immersive/info.js'
import { beatPadImmersiveAttribution } from '../../games/beat-pad-immersive/attributions.js'
import { beatPadImmersiveInfo } from '../../games/beat-pad-immersive/info.js'
import { missionorbitimmersiveAttribution } from '../../games/mission-orbit-immersive/attributions.js'
import { missionorbitimmersiveInfo } from '../../games/mission-orbit-immersive/info.js'
import { peekabooimmersiveAttribution } from '../../games/peekaboo-immersive/attributions.js'
import { peekabooimmersiveInfo } from '../../games/peekaboo-immersive/info.js'
import { pixelpassportimmersiveAttribution } from '../../games/pixel-passport-immersive/attributions.js'
import { pixelpassportimmersiveInfo } from '../../games/pixel-passport-immersive/info.js'
import { spotonimmersiveAttribution } from '../../games/spot-on-immersive/attributions.js'
import { spotonimmersiveInfo } from '../../games/spot-on-immersive/info.js'
import { squaresimmersiveAttribution } from '../../games/squares-immersive/attributions.js'
import { squaresimmersiveInfo } from '../../games/squares-immersive/info.js'
import { storytrailimmersiveAttribution } from '../../games/story-trail-immersive/attributions.js'
import { storytrailimmersiveInfo } from '../../games/story-trail-immersive/info.js'
import { superwordimmersiveAttribution } from '../../games/super-word-immersive/attributions.js'
import { superwordimmersiveInfo } from '../../games/super-word-immersive/info.js'
import { trainsoundsimmersiveAttribution } from '../../games/train-sounds-immersive/attributions.js'
import { trainsoundsimmersiveInfo } from '../../games/train-sounds-immersive/info.js'
import { waterwallimmersiveAttribution } from '../../games/waterwall-immersive/attributions.js'
import { waterwallimmersiveInfo } from '../../games/waterwall-immersive/info.js'
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
  { attribution: mudskipperAttribution, info: mudskipperInfo },
  { attribution: tunaPianoAttribution, info: tunaPianoInfo },
  { attribution: growWithMeAttribution, info: growWithMeInfo },
  { attribution: bakingSimulatorAttribution, info: bakingSimulatorInfo },
  { attribution: allAboardAttribution, info: allAboardInfo },
  { attribution: blockAttackAttribution, info: blockAttackInfo },
  { attribution: chompersImmersiveAttribution, info: chompersImmersiveInfo },
  { attribution: beatPadImmersiveAttribution, info: beatPadImmersiveInfo },
  { attribution: missionorbitimmersiveAttribution, info: missionorbitimmersiveInfo },
  { attribution: peekabooimmersiveAttribution, info: peekabooimmersiveInfo },
  { attribution: pixelpassportimmersiveAttribution, info: pixelpassportimmersiveInfo },
  { attribution: spotonimmersiveAttribution, info: spotonimmersiveInfo },
  { attribution: squaresimmersiveAttribution, info: squaresimmersiveInfo },
  { attribution: storytrailimmersiveAttribution, info: storytrailimmersiveInfo },
  { attribution: superwordimmersiveAttribution, info: superwordimmersiveInfo },
  { attribution: trainsoundsimmersiveAttribution, info: trainsoundsimmersiveInfo },
  { attribution: waterwallimmersiveAttribution, info: waterwallimmersiveInfo },
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
