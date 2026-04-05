import { chompersAttribution } from './chompers.js'
import { missionOrbitAttribution } from './mission-orbit.js'
import { pixelPassportAttribution } from './pixel-passport.js'
import { superWordAttribution } from './super-word.js'
import type { GameAttribution } from './types.js'
import { attributionsPagePath, repositoryCodeLicense } from './types.js'

export type { AttributionEntry, GameAttribution } from './types.js'
export { attributionsPagePath, repositoryCodeLicense } from './types.js'

export const gameAttributions: readonly GameAttribution[] = [
  missionOrbitAttribution,
  superWordAttribution,
  chompersAttribution,
  pixelPassportAttribution,
]

export function getGameAttribution(slug: string): GameAttribution {
  const attribution = gameAttributions.find((entry) => entry.slug === slug)
  if (!attribution) {
    throw new Error(`Missing attribution data for game: ${slug}`)
  }
  return attribution
}

export function renderAttributionsMarkdown(): string {
  const lines: string[] = [
    '# Attributions',
    '',
    '> This file is generated from `app/data/attributions/`. Update the per-game files there, then run `npm run sync:attributions`.',
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
