import { BASE_LAYOUTS, DISTRACTOR_ART, LETTER_ART, TOTAL_ITEMS_BY_DIFFICULTY } from './scene-art.js'
import type { ItemArt, ScenePosition } from './scene-art.js'
import type { Puzzle, SceneItem } from './types.js'
import type { WordSpec, WordTheme } from './word-bank.js'

export function shuffleList<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function buildPrompt(spec: WordSpec): string {
  return `${spec.hint} Find the ${spec.answer.length} letters to spell it!`
}

function getThemeMatches<T extends { themes?: readonly WordTheme[] }>(entries: readonly T[], theme: WordTheme): readonly T[] {
  const matches = entries.filter((entry) => entry.themes?.includes(theme))
  return matches.length > 0 ? matches : entries
}

function getLetterArt(char: string, theme: WordTheme, variant: number): ItemArt {
  const options = LETTER_ART[char]
  if (!options || options.length === 0) {
    return { emoji: '🔤', label: `Letter ${char}`, scale: 1.04 }
  }

  const themedOptions = getThemeMatches(options, theme)
  return themedOptions[variant % themedOptions.length]
}

function pickFromPool(
  pool: readonly ItemArt[],
  seed: number,
  count: number,
  usedLabels: Set<string>,
  selected: ItemArt[],
): void {
  if (pool.length === 0) return

  const startIndex = seed % pool.length
  for (let offset = 0; selected.length < count && offset < pool.length * 2; offset++) {
    const art = pool[(startIndex + offset) % pool.length]
    if (usedLabels.has(art.label)) continue

    usedLabels.add(art.label)
    selected.push(art)
  }
}

function pickDistractors(answer: string, theme: WordTheme, count: number, usedLabels: Set<string>): ItemArt[] {
  const selected: ItemArt[] = []
  const themedPool = getThemeMatches(DISTRACTOR_ART, theme)

  pickFromPool(themedPool, hashString(`${answer}:${theme}`), count, usedLabels, selected)

  if (selected.length < count) {
    pickFromPool(DISTRACTOR_ART, hashString(answer), count, usedLabels, selected)
  }

  return selected
}

function getZoneBounds(zone: SceneItem['zone']): { minY: number; maxY: number } {
  if (zone === 'sky') {
    return { minY: 16, maxY: 46 }
  }

  if (zone === 'ground') {
    return { minY: 54, maxY: 76 }
  }

  return { minY: 24, maxY: 66 }
}

function mapYToZone(baseY: number, zone: SceneItem['zone']): number {
  const normalized = clamp((baseY - 14) / 64, 0, 1)
  const { minY, maxY } = getZoneBounds(zone)
  return minY + normalized * (maxY - minY)
}

function getVerticalPlacementOffset(item: Pick<SceneItem, 'zone' | 'scale' | 'yOffset'>): number {
  if (item.zone !== 'ground') {
    return item.yOffset ?? 0
  }

  return Math.max(0, (item.scale ?? 1) - 1) * 15 + (item.yOffset ?? 0)
}

export function positionItemY(baseY: number, item: Pick<SceneItem, 'zone' | 'scale' | 'yOffset'>): number {
  const { minY, maxY } = getZoneBounds(item.zone)
  return clamp(mapYToZone(baseY, item.zone) + getVerticalPlacementOffset(item), minY, maxY)
}

function assignBasePositions(items: readonly Omit<SceneItem, 'x' | 'y'>[]): SceneItem[] {
  const layout = BASE_LAYOUTS[items.length] ?? BASE_LAYOUTS[9]
  return items.map((item, index) => ({
    ...item,
    x: layout[index]?.x ?? 50,
    y: positionItemY(layout[index]?.y ?? 50, item),
  }))
}

function classifyLayoutZone(baseY: number): 'sky' | 'middle' | 'ground' {
  if (baseY <= 22) return 'sky'
  if (baseY >= 54) return 'ground'
  return 'middle'
}

function takeLayoutSlot(
  availableSlots: Array<ScenePosition & { readonly layoutZone: 'sky' | 'middle' | 'ground' }>,
  preferredZone: SceneItem['zone'],
): ScenePosition {
  const preferenceOrder = preferredZone === 'sky'
    ? ['sky', 'middle', 'ground'] as const
    : preferredZone === 'ground'
      ? ['ground', 'middle', 'sky'] as const
      : ['middle', 'sky', 'ground'] as const

  for (const layoutZone of preferenceOrder) {
    const slotIndex = availableSlots.findIndex((slot) => slot.layoutZone === layoutZone)
    if (slotIndex !== -1) {
      return availableSlots.splice(slotIndex, 1)[0]
    }
  }

  return availableSlots.splice(0, 1)[0] ?? { x: 50, y: 50 }
}

function randomizeLayout(items: readonly SceneItem[]): SceneItem[] {
  const slots = shuffleList(BASE_LAYOUTS[items.length] ?? BASE_LAYOUTS[9])
    .slice(0, items.length)
    .map((slot) => ({
      ...slot,
      layoutZone: classifyLayoutZone(slot.y),
    }))
  const shuffledItems = shuffleList(items)

  return shuffledItems.map((item) => {
    const slot = takeLayoutSlot(slots, item.zone)
    const { minY, maxY } = getZoneBounds(item.zone)
    const xJitter = item.zone === 'middle' ? 5 : 3.5
    const yJitter = item.zone === 'middle' ? 4 : 2.5

    return {
      ...item,
      x: clamp(slot.x + (Math.random() * (xJitter * 2) - xJitter), 12, 88),
      y: clamp(positionItemY(slot.y, item) + (Math.random() * (yJitter * 2) - yJitter), minY, maxY),
    }
  })
}

export function buildPuzzle(spec: WordSpec): Puzzle {
  const usedLabels = new Set<string>()
  const letters = [...spec.answer].map((char, index) => {
    const art = getLetterArt(char, spec.theme, hashString(`${spec.answer}-${index}`))
    usedLabels.add(art.label)

    return {
      id: `${spec.answer.toLowerCase()}-letter-${index}`,
      type: 'letter' as const,
      zone: 'middle' as const,
      char,
      emoji: art.emoji,
      label: art.label,
      scale: art.scale ?? 1.04,
    }
  })

  const distractorCount = Math.max(0, TOTAL_ITEMS_BY_DIFFICULTY[spec.difficulty] - letters.length)
  const distractors = pickDistractors(spec.answer, spec.theme, distractorCount, usedLabels).map((art, index) => ({
    id: `${spec.answer.toLowerCase()}-distractor-${index}`,
    type: 'distractor' as const,
    zone: art.zone ?? 'ground',
    emoji: art.emoji,
    label: art.label,
    scale: art.scale ?? 1,
    yOffset: art.yOffset,
  }))

  return {
    answer: spec.answer,
    difficulty: spec.difficulty,
    prompt: buildPrompt(spec),
    items: assignBasePositions([...letters, ...distractors]),
  }
}

export function randomizePuzzle(puzzle: Puzzle): Puzzle {
  return {
    ...puzzle,
    items: randomizeLayout(puzzle.items),
  }
}