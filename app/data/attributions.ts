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
    slug: 'mission-orbit',
    name: 'Mission: Orbit',
    codeLicense: repositoryCodeLicense,
    summary: 'Mission: Orbit uses original visuals, browser-synthesized ambience, a bundled set of curated CC0 light/heavy sound-effect variants, and public-domain Artemis II crew information from NASA. Its in-game settings panel surfaces the same credit summary used here.',
    entries: [
      {
        title: 'Mission ambience and interface synth bed',
        type: 'music',
        usedIn: 'Mission: Orbit countdown, mission transitions, calm interface accents, and optional coast-phase ambience',
        creator: 'Peninsular Reveries',
        source: 'Generated in-browser with the Web Audio API',
        license: repositoryCodeLicense,
        modifications: 'Not applicable',
        notes: 'The synthesized sounds sit alongside bundled CC0 light/heavy sample variants for launch, burn-thrust pulse, reentry, parachute deployment, splashdown, cabin ambience, and celebration. The settings panel defaults to the heavier physical-sound mix.',
      },
      {
        title: 'Artemis II crew information',
        type: 'other',
        usedIn: 'Mission: Orbit start screen crew roster and in-mission crew overlays',
        creator: 'NASA',
        source: 'Our Artemis Crew',
        sourceUrl: 'https://www.nasa.gov/feature/our-artemis-crew/',
        license: 'Public domain (U.S. government work)',
        modifications: 'Condensed into short crew cards naming the four Artemis II astronauts and their roles.',
        notes: 'Crew roster matches Reid Wiseman, Victor Glover, Christina Koch, and Jeremy Hansen.',
      },
      {
        title: 'Rocket Launch Rumble at Canaveral',
        type: 'sound effect',
        usedIn: 'Mission: Orbit launch ignition and liftoff light/heavy variants',
        creator: 'felix.blume',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/felix.blume/sounds/613855/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Rendered into light/heavy mono OGG variants with distinct trims, low-pass filters, fades, and level matching for in-game use.',
      },
      {
        title: 'Compressed Air-Short-6',
        type: 'sound effect',
        usedIn: 'Mission: Orbit burn-thrust pulse light mix',
        creator: 'wavecal22',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/wavecal22/sounds/753135/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed to a short mono OGG puff, filtered, faded, and level-matched for the gentler burn-thrust variant.',
      },
      {
        title: 'Compressed Air-Short-9',
        type: 'sound effect',
        usedIn: 'Mission: Orbit burn-thrust pulse heavy mix',
        creator: 'wavecal22',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/wavecal22/sounds/753138/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed to a slightly fuller mono OGG burst, filtered, faded, and level-matched for the heavier burn-thrust variant.',
      },
      {
        title: 'burning-towels.aif',
        type: 'sound effect',
        usedIn: 'Mission: Orbit reentry light/heavy variants',
        creator: 'alienistcog',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/alienistcog/sounds/124579/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Rendered into light/heavy mono OGG variants with different trims, high-pass filtering, fades, and level matching for reentry.',
      },
      {
        title: 'G39-19-Parachute Swish Snap.wav',
        type: 'sound effect',
        usedIn: 'Mission: Orbit parachute deployment light/heavy variants',
        creator: 'craigsmith',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/craigsmith/sounds/438636/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Rendered into light/heavy mono OGG canopy-snap variants with distinct trims, fades, and level matching.',
      },
      {
        title: 'WATRSplsh_Stick Throw Into Water_Jaku5.wav',
        type: 'sound effect',
        usedIn: 'Mission: Orbit splashdown light mix',
        creator: 'jakubp.jp',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/jakubp.jp/sounds/554595/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed to a compact water impact, converted to mono OGG, and faded for in-game use.',
      },
      {
        title: 'Water_Paddle_impact_001.wav',
        type: 'sound effect',
        usedIn: 'Mission: Orbit splashdown heavy mix',
        creator: 'EpicWizard',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/EpicWizard/sounds/316572/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed to a stronger impact excerpt, converted to mono OGG, and faded for in-game use.',
      },
      {
        title: 'Electric machine engine large air-conditioner hum noise',
        type: 'sound effect',
        usedIn: 'Mission: Orbit optional space ambience light mix',
        creator: 'kentspublicdomain',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/kentspublicdomain/sounds/324665/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed into a shorter mono OGG cabin-hum loop, filtered, faded, and level-matched for the gentler ambience variant.',
      },
      {
        title: 'Refridgerator electric machine engine noise',
        type: 'sound effect',
        usedIn: 'Mission: Orbit optional space ambience heavy mix',
        creator: 'kentspublicdomain',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/kentspublicdomain/sounds/324666/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed into a fuller mono OGG cabin-hum loop, filtered, faded, and level-matched for the heavier ambience variant.',
      },
      {
        title: 'Kalimba (C-note)',
        type: 'sound effect',
        usedIn: 'Mission: Orbit celebration accent light mix',
        creator: 'foochie_foochie',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/foochie_foochie/sounds/331047/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed into a softer mono OGG kalimba accent, low-pass filtered, faded, and level-matched for the gentler celebration variant.',
      },
      {
        title: 'MUSCTnprc-Blue Snowball Microphone, CU_Kalimba, Duo Note_Nicholas Judy_TDC',
        type: 'sound effect',
        usedIn: 'Mission: Orbit celebration accent heavy mix',
        creator: 'designerschoice',
        source: 'Freesound',
        sourceUrl: 'https://freesound.org/people/designerschoice/sounds/824972/',
        license: 'Creative Commons 0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        modifications: 'Trimmed into a fuller mono OGG kalimba accent, low-pass filtered, faded, and level-matched for the heavier celebration variant.',
      },
    ],
  },
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
  {
    slug: 'chompers',
    name: 'Chompers',
    codeLicense: repositoryCodeLicense,
    summary: 'Chompers uses geometric CSS artwork and browser-synthesized Web Audio effects. The in-game settings panel shows the same credits summary surfaced here.',
    entries: [
      {
        title: 'Fruit-chomping soundtrack and effects',
        type: 'music',
        usedIn: 'Chompers start screen, gameplay chomps, countdown cues, and game-over stingers',
        creator: 'Peninsular Reveries',
        source: 'Generated in-browser with the Web Audio API',
        license: repositoryCodeLicense,
        modifications: 'Not applicable',
        notes: 'The game synthesizes its sounds at runtime. No downloaded loops, recorded samples, or image assets are bundled.',
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