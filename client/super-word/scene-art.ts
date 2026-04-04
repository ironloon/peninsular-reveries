import type { Difficulty } from './types.js'
import type { WordTheme } from './word-bank.js'

export interface ItemArt {
  readonly emoji: string
  readonly label: string
  readonly zone?: 'sky' | 'ground'
  readonly scale?: number
  readonly themes?: readonly WordTheme[]
}

export interface ScenePosition {
  readonly x: number
  readonly y: number
}

export const TOTAL_ITEMS_BY_DIFFICULTY: Record<Difficulty, number> = {
  starter: 8,
  easy: 8,
  medium: 8,
  hard: 9,
  expert: 9,
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
}

export const LETTER_ART: Partial<Record<string, readonly ItemArt[]>> = {
  A: [
    { emoji: '🍎', label: 'Apple', themes: ['food', 'nature'], scale: 1.04 },
    { emoji: '⚓', label: 'Anchor', themes: ['travel', 'water'], scale: 1.02 },
    { emoji: '🌰', label: 'Acorn', themes: ['nature', 'animals'], scale: 0.98 },
  ],
  B: [
    { emoji: '🎈', label: 'Balloon', themes: ['play', 'everyday'], scale: 1.02 },
    { emoji: '🐝', label: 'Bee', themes: ['animals', 'nature'], scale: 1.02 },
    { emoji: '🚤', label: 'Boat', themes: ['travel', 'water'], scale: 1.02 },
  ],
  C: [
    { emoji: '🦀', label: 'Crab', themes: ['animals', 'water'], scale: 1.02 },
    { emoji: '☁️', label: 'Cloud', themes: ['sky'], scale: 1.02 },
    { emoji: '🐈', label: 'Cat', themes: ['animals', 'home'], scale: 1.02 },
  ],
  D: [
    { emoji: '🥁', label: 'Drum', themes: ['play'], scale: 1.02 },
    { emoji: '🍩', label: 'Donut', themes: ['food'], scale: 1.02 },
    { emoji: '💎', label: 'Diamond', themes: ['play', 'everyday'], scale: 1.02 },
  ],
  E: [
    { emoji: '🥚', label: 'Egg', themes: ['food', 'animals', 'home'], scale: 1.02 },
    { emoji: '🐘', label: 'Elephant', themes: ['animals'], scale: 1.02 },
    { emoji: '🦅', label: 'Eagle', themes: ['animals', 'sky'], scale: 1.02 },
  ],
  F: [
    { emoji: '🌸', label: 'Flower', themes: ['nature'], scale: 1.02 },
    { emoji: '🐟', label: 'Fish', themes: ['animals', 'water'], scale: 1.02 },
    { emoji: '🔥', label: 'Fire', themes: ['nature', 'home'], scale: 1.02 },
  ],
  G: [
    { emoji: '🍇', label: 'Grapes', themes: ['food', 'nature'], scale: 1.02 },
    { emoji: '🎁', label: 'Gift', themes: ['play', 'everyday'], scale: 1.02 },
    { emoji: '🎸', label: 'Guitar', themes: ['play'], scale: 1.02 },
  ],
  H: [
    { emoji: '🏠', label: 'House', themes: ['home'], scale: 1.02 },
    { emoji: '❤️', label: 'Heart', themes: ['everyday'], scale: 1.02 },
    { emoji: '🎩', label: 'Hat', themes: ['home', 'play'], scale: 1.02 },
  ],
  I: [
    { emoji: '🍦', label: 'Ice Cream', themes: ['food'], scale: 1.02 },
    { emoji: '🐞', label: 'Insect', themes: ['animals', 'nature'], scale: 1.02 },
    { emoji: '🏝️', label: 'Island', themes: ['travel', 'water'], scale: 1.02 },
  ],
  J: [
    { emoji: '🍶', label: 'Jam Jar', themes: ['food', 'home'], scale: 1.02 },
    { emoji: '🐠', label: 'Jellyfish', themes: ['animals', 'water'], scale: 1.02 },
    { emoji: '🚙', label: 'Jeep', themes: ['travel'], scale: 1.02 },
  ],
  K: [
    { emoji: '🪁', label: 'Kite', themes: ['play', 'sky'], scale: 1.02 },
    { emoji: '🔑', label: 'Key', themes: ['home'], scale: 1.02 },
    { emoji: '🐨', label: 'Koala', themes: ['animals'], scale: 1.02 },
  ],
  L: [
    { emoji: '🍋', label: 'Lemon', themes: ['food', 'nature'], scale: 1.02 },
    { emoji: '🍃', label: 'Leaf', themes: ['nature'], scale: 1.02 },
    { emoji: '💡', label: 'Lamp', themes: ['home'], scale: 1.02 },
  ],
  M: [
    { emoji: '🍄', label: 'Mushroom', themes: ['nature'], scale: 1.02 },
    { emoji: '🌙', label: 'Moon', themes: ['space', 'sky'], scale: 1.02 },
    { emoji: '🗺️', label: 'Map', themes: ['travel'], scale: 1.02 },
  ],
  N: [
    { emoji: '🌰', label: 'Nut', themes: ['food', 'nature'], scale: 1.02 },
    { emoji: '🐣', label: 'Nest', themes: ['animals', 'nature'], scale: 1.02 },
    { emoji: '📰', label: 'Newspaper', themes: ['home', 'everyday'], scale: 1.02 },
  ],
  O: [
    { emoji: '🍊', label: 'Orange', themes: ['food', 'nature'], scale: 1.02 },
    { emoji: '🦉', label: 'Owl', themes: ['animals', 'sky'], scale: 1.02 },
    { emoji: '🐙', label: 'Octopus', themes: ['animals', 'water'], scale: 1.02 },
  ],
  P: [
    { emoji: '🍐', label: 'Pear', themes: ['food', 'nature'], scale: 1.02 },
    { emoji: '🍕', label: 'Pizza', themes: ['food'], scale: 1.02 },
    { emoji: '🦜', label: 'Parrot', themes: ['animals'], scale: 1.02 },
  ],
  Q: [
    { emoji: '👑', label: 'Queen', themes: ['play', 'everyday'], scale: 1.02 },
    { emoji: '🪶', label: 'Quill', themes: ['home', 'play'], scale: 1.02 },
  ],
  R: [
    { emoji: '🌈', label: 'Rainbow', themes: ['sky', 'play'], scale: 1.02 },
    { emoji: '🚀', label: 'Rocket', themes: ['space', 'travel'], scale: 1.02 },
    { emoji: '🌹', label: 'Rose', themes: ['nature'], scale: 1.02 },
  ],
  S: [
    { emoji: '🐚', label: 'Shell', themes: ['water', 'nature'], scale: 1.02 },
    { emoji: '☀️', label: 'Sun', themes: ['sky'], scale: 1.02 },
    { emoji: '⭐', label: 'Star', themes: ['space', 'sky'], scale: 1.02 },
  ],
  T: [
    { emoji: '🌳', label: 'Tree', themes: ['nature'], scale: 1.02 },
    { emoji: '🌮', label: 'Taco', themes: ['food'], scale: 1.02 },
    { emoji: '🚂', label: 'Train', themes: ['travel'], scale: 1.02 },
  ],
  U: [
    { emoji: '☂️', label: 'Umbrella', themes: ['sky', 'home'], scale: 1.02 },
    { emoji: '🦄', label: 'Unicorn', themes: ['play', 'animals'], scale: 1.02 },
    { emoji: '🛸', label: 'UFO', themes: ['space', 'sky'], scale: 1.02 },
  ],
  V: [
    { emoji: '🎻', label: 'Violin', themes: ['play'], scale: 1.02 },
    { emoji: '🌋', label: 'Volcano', themes: ['nature'], scale: 1.02 },
  ],
  W: [
    { emoji: '🐋', label: 'Whale', themes: ['animals', 'water'], scale: 1.02 },
    { emoji: '🍉', label: 'Watermelon', themes: ['food', 'nature'], scale: 1.02 },
    { emoji: '🌊', label: 'Wave', themes: ['water'], scale: 1.02 },
  ],
  X: [
    { emoji: '✖️', label: 'X Mark', themes: ['play', 'travel'], scale: 1.02 },
    { emoji: '❎', label: 'Cross Mark', themes: ['everyday', 'play'], scale: 1.02 },
  ],
  Y: [
    { emoji: '🧶', label: 'Yarn', themes: ['home'], scale: 1.02 },
    { emoji: '🛥️', label: 'Yacht', themes: ['travel', 'water'], scale: 1.02 },
  ],
  Z: [
    { emoji: '🦓', label: 'Zebra', themes: ['animals'], scale: 1.02 },
    { emoji: '⚡', label: 'Zap', themes: ['sky', 'play'], scale: 1.02 },
  ],
}

export const DISTRACTOR_ART: readonly ItemArt[] = [
  { emoji: '🦋', label: 'Butterfly', zone: 'sky', scale: 0.88, themes: ['animals', 'nature'] },
  { emoji: '🌷', label: 'Tulip', zone: 'ground', scale: 0.92, themes: ['nature'] },
  { emoji: '🏰', label: 'Castle', zone: 'ground', scale: 1.08, themes: ['play', 'travel'] },
  { emoji: '🏔️', label: 'Mountain', zone: 'ground', scale: 1.14, themes: ['nature', 'travel'] },
  { emoji: '🐢', label: 'Turtle', zone: 'ground', scale: 0.94, themes: ['animals', 'water'] },
  { emoji: '🎆', label: 'Fireworks', zone: 'sky', scale: 0.96, themes: ['play', 'sky'] },
  { emoji: '📷', label: 'Camera', zone: 'ground', scale: 0.88, themes: ['travel', 'everyday'] },
  { emoji: '✏️', label: 'Pencil', zone: 'ground', scale: 0.9, themes: ['home', 'play', 'everyday'] },
  { emoji: '🔔', label: 'Bell', zone: 'ground', scale: 0.9, themes: ['home', 'play'] },
  { emoji: '🧸', label: 'Teddy Bear', zone: 'ground', scale: 0.96, themes: ['home', 'play'] },
  { emoji: '🍂', label: 'Feather', zone: 'sky', scale: 0.8, themes: ['animals', 'nature', 'sky'] },
  { emoji: '🗿', label: 'Rock', zone: 'ground', scale: 1, themes: ['nature'] },
  { emoji: '🌵', label: 'Cactus', zone: 'ground', scale: 0.96, themes: ['nature'] },
  { emoji: '🌎', label: 'Planet', zone: 'sky', scale: 1.02, themes: ['space', 'travel'] },
  { emoji: '🍯', label: 'Honey', zone: 'ground', scale: 0.88, themes: ['food', 'animals'] },
  { emoji: '🎒', label: 'Backpack', zone: 'ground', scale: 0.96, themes: ['travel', 'everyday'] },
  { emoji: '❄️', label: 'Snowflake', zone: 'sky', scale: 0.8, themes: ['sky'] },
  { emoji: '🌻', label: 'Sunflower', zone: 'ground', scale: 1.02, themes: ['nature'] },
  { emoji: '🧭', label: 'Compass', zone: 'ground', scale: 0.9, themes: ['travel'] },
  { emoji: '⛵', label: 'Sailboat', zone: 'sky', scale: 0.92, themes: ['travel', 'water'] },
  { emoji: '🧁', label: 'Cupcake', zone: 'ground', scale: 0.88, themes: ['food', 'play'] },
  { emoji: '🧃', label: 'Juice Box', zone: 'ground', scale: 0.88, themes: ['food', 'everyday'] },
  { emoji: '🎯', label: 'Target', zone: 'ground', scale: 0.96, themes: ['play'] },
  { emoji: '🌺', label: 'Hibiscus', zone: 'ground', scale: 0.98, themes: ['nature'] },
  { emoji: '🍪', label: 'Cookie', zone: 'ground', scale: 0.86, themes: ['food', 'home'] },
  { emoji: '🎢', label: 'Slide', zone: 'ground', scale: 1.08, themes: ['play'] },
  { emoji: '🎨', label: 'Paint Palette', zone: 'ground', scale: 0.92, themes: ['play', 'home'] },
  { emoji: '🎵', label: 'Music Note', zone: 'sky', scale: 0.8, themes: ['play'] },
  { emoji: '⚽', label: 'Soccer Ball', zone: 'ground', scale: 0.9, themes: ['play'] },
  { emoji: '🪁', label: 'Spare Kite', zone: 'sky', scale: 0.94, themes: ['play', 'sky'] },
  { emoji: '🧊', label: 'Ice Cube', zone: 'ground', scale: 0.84, themes: ['food', 'home'] },
  { emoji: '🌈', label: 'Bright Rainbow', zone: 'sky', scale: 1, themes: ['sky', 'play'] },
  { emoji: '☁️', label: 'Soft Cloud', zone: 'sky', scale: 1.02, themes: ['sky'] },
  { emoji: '🌙', label: 'Crescent Moon', zone: 'sky', scale: 0.96, themes: ['space', 'sky'] },
  { emoji: '⚓', label: 'Anchor', zone: 'ground', scale: 0.96, themes: ['travel', 'water'] },
  { emoji: '🐚', label: 'Seashell', zone: 'ground', scale: 0.88, themes: ['water', 'nature'] },
  { emoji: '🍄', label: 'Mushroom', zone: 'ground', scale: 0.9, themes: ['nature'] },
  { emoji: '🪺', label: 'Nest', zone: 'ground', scale: 0.9, themes: ['animals', 'nature'] },
  { emoji: '🍓', label: 'Strawberry', zone: 'ground', scale: 0.88, themes: ['food', 'nature'] },
  { emoji: '📚', label: 'Book Stack', zone: 'ground', scale: 0.96, themes: ['home', 'everyday'] },
  { emoji: '🪴', label: 'Potted Plant', zone: 'ground', scale: 0.94, themes: ['home', 'nature'] },
  { emoji: '🎈', label: 'Party Balloon', zone: 'sky', scale: 0.96, themes: ['play', 'everyday'] },
]