import type { Difficulty, SizeCategory, AnchorPoint, WordTheme } from './types.js'

export interface ItemArt {
  readonly emoji: string
  readonly label: string
  readonly zone?: 'sky' | 'ground'
  readonly scale?: number
  readonly yOffset?: number
  readonly sizeCategory?: SizeCategory
  readonly anchor?: AnchorPoint
  readonly themes?: readonly WordTheme[]
}

export interface ScenePosition {
  readonly x: number
  readonly y: number
}

export const TOTAL_ITEMS_BY_DIFFICULTY: Record<Difficulty, number> = {
  sidekick: 7,
  hero: 8,
  super: 8,
  ultra: 9,
  legend: 10,
}

export const BASE_LAYOUTS: Record<number, readonly ScenePosition[]> = {
  8: [
    { x: 16, y: 18 },
    { x: 46, y: 14 },
    { x: 78, y: 20 },
    { x: 20, y: 42 },
    { x: 58, y: 36 },
    { x: 82, y: 54 },
    { x: 34, y: 68 },
    { x: 68, y: 67 },
  ],
  9: [
    { x: 16, y: 18 },
    { x: 44, y: 14 },
    { x: 76, y: 18 },
    { x: 18, y: 42 },
    { x: 50, y: 36 },
    { x: 82, y: 44 },
    { x: 24, y: 68 },
    { x: 56, y: 62 },
    { x: 80, y: 68 },
  ],
  10: [
    { x: 14, y: 16 }, { x: 40, y: 12 }, { x: 68, y: 16 }, { x: 85, y: 26 },
    { x: 16, y: 42 }, { x: 48, y: 36 }, { x: 78, y: 44 },
    { x: 22, y: 68 }, { x: 50, y: 64 }, { x: 78, y: 70 },
  ],
  11: [
    { x: 12, y: 16 }, { x: 36, y: 12 }, { x: 62, y: 14 }, { x: 84, y: 20 },
    { x: 14, y: 40 }, { x: 44, y: 36 }, { x: 70, y: 40 }, { x: 88, y: 50 },
    { x: 20, y: 66 }, { x: 50, y: 62 }, { x: 76, y: 68 },
  ],
  12: [
    { x: 10, y: 14 }, { x: 32, y: 10 }, { x: 56, y: 12 }, { x: 78, y: 14 }, { x: 92, y: 22 },
    { x: 14, y: 38 }, { x: 40, y: 34 }, { x: 64, y: 38 }, { x: 86, y: 44 },
    { x: 18, y: 64 }, { x: 46, y: 60 }, { x: 74, y: 66 },
  ],
}

// Maps each SizeCategory to a fraction of canvas height used for font-size calculation.
// tiny:0.06 → small:0.10 → medium:0.16 → large:0.26 → huge:0.38
export const SIZE_CATEGORY_FRACTION: Record<SizeCategory, number> = {
  tiny: 0.06,
  small: 0.10,
  medium: 0.16,
  large: 0.26,
  huge: 0.38,
}

export const LETTER_ART: Partial<Record<string, readonly ItemArt[]>> = {
  A: [
    { emoji: '🍎', label: 'Apple', themes: ['food', 'nature'], scale: 1.04, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '⚓', label: 'Anchor', themes: ['travel', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🌰', label: 'Acorn', themes: ['nature', 'animals'], scale: 0.98, sizeCategory: 'medium', anchor: 'center' },
  ],
  B: [
    { emoji: '🎈', label: 'Balloon', themes: ['play', 'everyday'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐝', label: 'Bee', themes: ['animals', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🚤', label: 'Boat', themes: ['travel', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  C: [
    { emoji: '🦀', label: 'Crab', themes: ['animals', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '☁️', label: 'Cloud', themes: ['sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐈', label: 'Cat', themes: ['animals', 'home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  D: [
    { emoji: '🥁', label: 'Drum', themes: ['play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🍩', label: 'Donut', themes: ['food'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '💎', label: 'Diamond', themes: ['play', 'everyday'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  E: [
    { emoji: '🥚', label: 'Egg', themes: ['food', 'animals', 'home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐘', label: 'Elephant', themes: ['animals'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🦅', label: 'Eagle', themes: ['animals', 'sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  F: [
    { emoji: '🌸', label: 'Flower', themes: ['nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐟', label: 'Fish', themes: ['animals', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🔥', label: 'Fire', themes: ['nature', 'home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  G: [
    { emoji: '🍇', label: 'Grapes', themes: ['food', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🎁', label: 'Gift', themes: ['play', 'everyday'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🎸', label: 'Guitar', themes: ['play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  H: [
    { emoji: '🏠', label: 'House', themes: ['home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '❤️', label: 'Heart', themes: ['everyday'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🎩', label: 'Hat', themes: ['home', 'play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  I: [
    { emoji: '🍦', label: 'Ice Cream', themes: ['food'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐞', label: 'Insect', themes: ['animals', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🏝️', label: 'Island', themes: ['travel', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  J: [
    { emoji: '🍶', label: 'Jam Jar', themes: ['food', 'home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐠', label: 'Jellyfish', themes: ['animals', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🚙', label: 'Jeep', themes: ['travel'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  K: [
    { emoji: '🪁', label: 'Kite', themes: ['play', 'sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🔑', label: 'Key', themes: ['home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐨', label: 'Koala', themes: ['animals'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  L: [
    { emoji: '🍋', label: 'Lemon', themes: ['food', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🍃', label: 'Leaf', themes: ['nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '💡', label: 'Lamp', themes: ['home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  M: [
    { emoji: '🍄', label: 'Mushroom', themes: ['nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🌙', label: 'Moon', themes: ['space', 'sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🗺️', label: 'Map', themes: ['travel'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  N: [
    { emoji: '🌰', label: 'Nut', themes: ['food', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐣', label: 'Nest', themes: ['animals', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '📰', label: 'Newspaper', themes: ['home', 'everyday'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  O: [
    { emoji: '🍊', label: 'Orange', themes: ['food', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🦉', label: 'Owl', themes: ['animals', 'sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🐙', label: 'Octopus', themes: ['animals', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  P: [
    { emoji: '🍐', label: 'Pear', themes: ['food', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🍕', label: 'Pizza', themes: ['food'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🦜', label: 'Parrot', themes: ['animals'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  Q: [
    { emoji: '👑', label: 'Queen', themes: ['play', 'everyday'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🪶', label: 'Quill', themes: ['home', 'play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  R: [
    { emoji: '🌈', label: 'Rainbow', themes: ['sky', 'play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🚀', label: 'Rocket', themes: ['space', 'travel'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🌹', label: 'Rose', themes: ['nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  S: [
    { emoji: '🐚', label: 'Shell', themes: ['water', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '☀️', label: 'Sun', themes: ['sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '⭐', label: 'Star', themes: ['space', 'sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  T: [
    { emoji: '🌳', label: 'Tree', themes: ['nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🌮', label: 'Taco', themes: ['food'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🚂', label: 'Train', themes: ['travel'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  U: [
    { emoji: '☂️', label: 'Umbrella', themes: ['sky', 'home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🦄', label: 'Unicorn', themes: ['play', 'animals'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🛸', label: 'UFO', themes: ['space', 'sky'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  V: [
    { emoji: '🎻', label: 'Violin', themes: ['play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🌋', label: 'Volcano', themes: ['nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  W: [
    { emoji: '🐋', label: 'Whale', themes: ['animals', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🍉', label: 'Watermelon', themes: ['food', 'nature'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🌊', label: 'Wave', themes: ['water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  X: [
    { emoji: '✖️', label: 'X Mark', themes: ['play', 'travel'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '❎', label: 'Cross Mark', themes: ['everyday', 'play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  Y: [
    { emoji: '🧶', label: 'Yarn', themes: ['home'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '🛥️', label: 'Yacht', themes: ['travel', 'water'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
  Z: [
    { emoji: '🦓', label: 'Zebra', themes: ['animals'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
    { emoji: '⚡', label: 'Zap', themes: ['sky', 'play'], scale: 1.02, sizeCategory: 'medium', anchor: 'center' },
  ],
}

export const DISTRACTOR_ART: readonly ItemArt[] = [
  // ── Sky zone ────────────────────────────────────────────────
  { emoji: '🦋', label: 'Butterfly', zone: 'sky', scale: 0.74, sizeCategory: 'small', anchor: 'center', themes: ['animals', 'nature'] },
  { emoji: '🎆', label: 'Fireworks', zone: 'sky', scale: 0.88, sizeCategory: 'medium', anchor: 'center', themes: ['play', 'sky'] },
  { emoji: '🍂', label: 'Feather', zone: 'sky', scale: 0.68, sizeCategory: 'tiny', anchor: 'center', themes: ['animals', 'nature', 'sky'] },
  { emoji: '🌎', label: 'Planet', zone: 'sky', scale: 1.12, sizeCategory: 'medium', anchor: 'center', themes: ['space', 'travel'] },
  { emoji: '❄️', label: 'Snowflake', zone: 'sky', scale: 0.66, sizeCategory: 'tiny', anchor: 'center', themes: ['sky'] },
  { emoji: '⛵', label: 'Sailboat', zone: 'sky', scale: 0.84, sizeCategory: 'medium', anchor: 'center', themes: ['travel', 'water'] },
  { emoji: '🎵', label: 'Music Note', zone: 'sky', scale: 0.7, sizeCategory: 'tiny', anchor: 'center', themes: ['play'] },
  { emoji: '🪁', label: 'Spare Kite', zone: 'sky', scale: 0.94, sizeCategory: 'small', anchor: 'center', themes: ['play', 'sky'] },
  { emoji: '🌈', label: 'Bright Rainbow', zone: 'sky', scale: 1.1, sizeCategory: 'huge', anchor: 'center', themes: ['sky', 'play'] },
  { emoji: '☁️', label: 'Soft Cloud', zone: 'sky', scale: 1.14, sizeCategory: 'medium', anchor: 'center', themes: ['sky'] },
  { emoji: '🌙', label: 'Crescent Moon', zone: 'sky', scale: 0.96, sizeCategory: 'small', anchor: 'center', themes: ['space', 'sky'] },
  { emoji: '🎈', label: 'Party Balloon', zone: 'sky', scale: 0.96, sizeCategory: 'small', anchor: 'center', themes: ['play', 'everyday'] },
  { emoji: '✈️', label: 'Airplane', zone: 'sky', scale: 0.9, sizeCategory: 'medium', anchor: 'center', themes: ['travel'] },
  { emoji: '🛰️', label: 'Satellite', zone: 'sky', scale: 0.72, sizeCategory: 'small', anchor: 'center', themes: ['space', 'sky'] },
  { emoji: '🚁', label: 'Helicopter', zone: 'sky', scale: 0.88, sizeCategory: 'medium', anchor: 'center', themes: ['travel', 'sky'] },
  // ── Ground zone ──────────────────────────────────────────────
  { emoji: '🌷', label: 'Tulip', zone: 'ground', scale: 0.84, sizeCategory: 'small', anchor: 'bottom', themes: ['nature'] },
  { emoji: '🏰', label: 'Castle', zone: 'ground', scale: 2.2, yOffset: 4.0, sizeCategory: 'huge', anchor: 'bottom', themes: ['play', 'travel'] },
  { emoji: '🏔️', label: 'Mountain', zone: 'ground', scale: 1.48, yOffset: 2.5, sizeCategory: 'large', anchor: 'bottom', themes: ['nature', 'travel'] },
  { emoji: '🐢', label: 'Turtle', zone: 'ground', scale: 0.9, sizeCategory: 'small', anchor: 'bottom', themes: ['animals', 'water'] },
  { emoji: '📷', label: 'Camera', zone: 'ground', scale: 0.78, sizeCategory: 'small', anchor: 'bottom', themes: ['travel', 'everyday'] },
  { emoji: '✏️', label: 'Pencil', zone: 'ground', scale: 0.76, sizeCategory: 'small', anchor: 'bottom', themes: ['home', 'play', 'everyday'] },
  { emoji: '🔔', label: 'Bell', zone: 'ground', scale: 0.8, sizeCategory: 'small', anchor: 'bottom', themes: ['home', 'play'] },
  { emoji: '🧸', label: 'Teddy Bear', zone: 'ground', scale: 0.96, sizeCategory: 'small', anchor: 'bottom', themes: ['home', 'play'] },
  { emoji: '🗿', label: 'Rock', zone: 'ground', scale: 1.08, sizeCategory: 'small', anchor: 'bottom', themes: ['nature'] },
  { emoji: '🌵', label: 'Cactus', zone: 'ground', scale: 0.96, sizeCategory: 'medium', anchor: 'bottom', themes: ['nature'] },
  { emoji: '🍯', label: 'Honey', zone: 'ground', scale: 0.8, sizeCategory: 'small', anchor: 'bottom', themes: ['food', 'animals'] },
  { emoji: '🎒', label: 'Backpack', zone: 'ground', scale: 0.96, sizeCategory: 'small', anchor: 'bottom', themes: ['travel', 'everyday'] },
  { emoji: '🌻', label: 'Sunflower', zone: 'ground', scale: 1.08, sizeCategory: 'medium', anchor: 'bottom', themes: ['nature'] },
  { emoji: '🧭', label: 'Compass', zone: 'ground', scale: 0.78, sizeCategory: 'small', anchor: 'bottom', themes: ['travel'] },
  { emoji: '🧁', label: 'Cupcake', zone: 'ground', scale: 0.8, sizeCategory: 'small', anchor: 'bottom', themes: ['food', 'play'] },
  { emoji: '🧃', label: 'Juice Box', zone: 'ground', scale: 0.78, sizeCategory: 'tiny', anchor: 'bottom', themes: ['food', 'everyday'] },
  { emoji: '🎯', label: 'Target', zone: 'ground', scale: 0.96, sizeCategory: 'small', anchor: 'bottom', themes: ['play'] },
  { emoji: '🌺', label: 'Hibiscus', zone: 'ground', scale: 0.98, sizeCategory: 'small', anchor: 'bottom', themes: ['nature'] },
  { emoji: '🍪', label: 'Cookie', zone: 'ground', scale: 0.74, sizeCategory: 'tiny', anchor: 'bottom', themes: ['food', 'home'] },
  { emoji: '🎢', label: 'Slide', zone: 'ground', scale: 1.26, yOffset: 1, sizeCategory: 'large', anchor: 'bottom', themes: ['play'] },
  { emoji: '🎨', label: 'Paint Palette', zone: 'ground', scale: 0.92, sizeCategory: 'small', anchor: 'bottom', themes: ['play', 'home'] },
  { emoji: '⚽', label: 'Soccer Ball', zone: 'ground', scale: 0.82, sizeCategory: 'small', anchor: 'bottom', themes: ['play'] },
  { emoji: '🧊', label: 'Ice Cube', zone: 'ground', scale: 0.72, sizeCategory: 'tiny', anchor: 'bottom', themes: ['food', 'home'] },
  { emoji: '⚓', label: 'Anchor', zone: 'ground', scale: 1.04, sizeCategory: 'small', anchor: 'bottom', themes: ['travel', 'water'] },
  { emoji: '🐚', label: 'Seashell', zone: 'ground', scale: 0.82, sizeCategory: 'tiny', anchor: 'bottom', themes: ['water', 'nature'] },
  { emoji: '🍄', label: 'Mushroom', zone: 'ground', scale: 0.84, sizeCategory: 'small', anchor: 'bottom', themes: ['nature'] },
  { emoji: '🪺', label: 'Nest', zone: 'ground', scale: 0.84, sizeCategory: 'small', anchor: 'bottom', themes: ['animals', 'nature'] },
  { emoji: '🍓', label: 'Strawberry', zone: 'ground', scale: 0.78, sizeCategory: 'tiny', anchor: 'bottom', themes: ['food', 'nature'] },
  { emoji: '📚', label: 'Book Stack', zone: 'ground', scale: 0.96, sizeCategory: 'small', anchor: 'bottom', themes: ['home', 'everyday'] },
  { emoji: '🪴', label: 'Potted Plant', zone: 'ground', scale: 0.94, sizeCategory: 'small', anchor: 'bottom', themes: ['home', 'nature'] },
  { emoji: '🚲', label: 'Bicycle', zone: 'ground', scale: 0.92, sizeCategory: 'medium', anchor: 'bottom', themes: ['travel', 'everyday'] },
  { emoji: '🏕️', label: 'Campfire', zone: 'ground', scale: 0.84, sizeCategory: 'medium', anchor: 'bottom', themes: ['nature', 'play'] },
  { emoji: '🗼', label: 'Lighthouse', zone: 'ground', scale: 1.3, sizeCategory: 'large', anchor: 'bottom', themes: ['travel', 'water'] },
  { emoji: '📦', label: 'Treasure Chest', zone: 'ground', scale: 0.88, sizeCategory: 'medium', anchor: 'bottom', themes: ['play', 'travel'] },
  { emoji: '🛒', label: 'Wagon', zone: 'ground', scale: 0.86, sizeCategory: 'medium', anchor: 'bottom', themes: ['play', 'everyday'] },
  { emoji: '🌿', label: 'Garden', zone: 'ground', scale: 1.0, sizeCategory: 'large', anchor: 'bottom', themes: ['nature'] },
]