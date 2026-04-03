export interface AttributionEntry {
  readonly title: string
  readonly type: 'music' | 'sound effect' | 'image' | 'illustration' | 'font' | 'other'
  readonly usedIn: string
  readonly creator: string
  readonly source: string
  readonly sourceUrl?: string
  readonly license: string
  readonly licenseUrl?: string
  readonly modifications: string
  readonly notes?: string
}

export interface GameAttribution {
  readonly slug: string
  readonly name: string
  readonly codeLicense: string
  readonly summary: string
  readonly entries: readonly AttributionEntry[]
}

export const attributionsPagePath = '/attributions/'
export const repositoryCodeLicense = 'GPL-3.0'

export const gameAttributions: readonly GameAttribution[] = [
  {
    slug: 'super-word',
    name: 'Super Word',
    codeLicense: repositoryCodeLicense,
    summary: 'The deployed game shows credits in Settings. No third-party media assets are currently bundled for Super Word.',
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
    ],
  },
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
    '> This file is generated from `app/data/attributions.ts`. Update that file, then run `npm run sync:attributions`.',
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