import type { Difficulty, Puzzle, SceneItem } from './types.js'

interface WordSpec {
  readonly answer: string
  readonly difficulty: Difficulty
  readonly hint: string
}

interface ItemArt {
  readonly emoji: string
  readonly label: string
}

interface ScenePosition {
  readonly x: number
  readonly y: number
}

const TOTAL_ITEMS_BY_DIFFICULTY: Record<Difficulty, number> = {
  starter: 8,
  easy: 8,
  medium: 8,
  hard: 9,
  expert: 9,
}

const BASE_LAYOUTS: Record<number, readonly ScenePosition[]> = {
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

const LETTER_ART: Partial<Record<string, readonly ItemArt[]>> = {
  A: [{ emoji: '🍎', label: 'Apple' }, { emoji: '⚓', label: 'Anchor' }, { emoji: '🌰', label: 'Acorn' }],
  B: [{ emoji: '🎈', label: 'Balloon' }, { emoji: '🐝', label: 'Bee' }, { emoji: '🚤', label: 'Boat' }],
  C: [{ emoji: '🦀', label: 'Crab' }, { emoji: '☁️', label: 'Cloud' }, { emoji: '🐈', label: 'Cat' }],
  D: [{ emoji: '🥁', label: 'Drum' }, { emoji: '🍩', label: 'Donut' }, { emoji: '💎', label: 'Diamond' }],
  E: [{ emoji: '🥚', label: 'Egg' }, { emoji: '🐘', label: 'Elephant' }, { emoji: '🦅', label: 'Eagle' }],
  F: [{ emoji: '🌸', label: 'Flower' }, { emoji: '🐟', label: 'Fish' }, { emoji: '🔥', label: 'Fire' }],
  G: [{ emoji: '🍇', label: 'Grapes' }, { emoji: '🎁', label: 'Gift' }, { emoji: '🎸', label: 'Guitar' }],
  H: [{ emoji: '🏠', label: 'House' }, { emoji: '❤️', label: 'Heart' }, { emoji: '🎩', label: 'Hat' }],
  I: [{ emoji: '🍦', label: 'Ice Cream' }, { emoji: '🪲', label: 'Insect' }, { emoji: '🏝️', label: 'Island' }],
  J: [{ emoji: '🫙', label: 'Jam Jar' }, { emoji: '🪼', label: 'Jellyfish' }, { emoji: '🛻', label: 'Jeep' }],
  K: [{ emoji: '🪁', label: 'Kite' }, { emoji: '🔑', label: 'Key' }, { emoji: '🐨', label: 'Koala' }],
  L: [{ emoji: '🍋', label: 'Lemon' }, { emoji: '🍃', label: 'Leaf' }, { emoji: '💡', label: 'Lamp' }],
  M: [{ emoji: '🍄', label: 'Mushroom' }, { emoji: '🌙', label: 'Moon' }, { emoji: '🗺️', label: 'Map' }],
  N: [{ emoji: '🌰', label: 'Nut' }, { emoji: '🪺', label: 'Nest' }, { emoji: '📰', label: 'Newspaper' }],
  O: [{ emoji: '🍊', label: 'Orange' }, { emoji: '🦉', label: 'Owl' }, { emoji: '🐙', label: 'Octopus' }],
  P: [{ emoji: '🍐', label: 'Pear' }, { emoji: '🍕', label: 'Pizza' }, { emoji: '🦜', label: 'Parrot' }],
  R: [{ emoji: '🌈', label: 'Rainbow' }, { emoji: '🚀', label: 'Rocket' }, { emoji: '🌹', label: 'Rose' }],
  S: [{ emoji: '🐚', label: 'Shell' }, { emoji: '☀️', label: 'Sun' }, { emoji: '⭐', label: 'Star' }],
  T: [{ emoji: '🌳', label: 'Tree' }, { emoji: '🌮', label: 'Taco' }, { emoji: '🚂', label: 'Train' }],
  U: [{ emoji: '☂️', label: 'Umbrella' }, { emoji: '🦄', label: 'Unicorn' }, { emoji: '🛸', label: 'UFO' }],
  V: [{ emoji: '🎻', label: 'Violin' }, { emoji: '🌋', label: 'Volcano' }],
  W: [{ emoji: '🐋', label: 'Whale' }, { emoji: '🍉', label: 'Watermelon' }, { emoji: '🌊', label: 'Wave' }],
  Y: [{ emoji: '🧶', label: 'Yarn' }, { emoji: '🛥️', label: 'Yacht' }],
}

const DISTRACTOR_ART: readonly ItemArt[] = [
  { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🌷', label: 'Tulip' },
  { emoji: '🏰', label: 'Castle' },
  { emoji: '🏔️', label: 'Mountain' },
  { emoji: '🐢', label: 'Turtle' },
  { emoji: '🎆', label: 'Fireworks' },
  { emoji: '📷', label: 'Camera' },
  { emoji: '✏️', label: 'Pencil' },
  { emoji: '🔔', label: 'Bell' },
  { emoji: '🧸', label: 'Teddy Bear' },
  { emoji: '🪶', label: 'Feather' },
  { emoji: '🪨', label: 'Rock' },
  { emoji: '🌵', label: 'Cactus' },
  { emoji: '🪐', label: 'Planet' },
  { emoji: '🍯', label: 'Honey' },
  { emoji: '🎒', label: 'Backpack' },
  { emoji: '❄️', label: 'Snowflake' },
  { emoji: '🌻', label: 'Sunflower' },
  { emoji: '🧭', label: 'Compass' },
  { emoji: '⛵', label: 'Sailboat' },
  { emoji: '🧁', label: 'Cupcake' },
  { emoji: '🧃', label: 'Juice Box' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '🌺', label: 'Hibiscus' },
  { emoji: '🍪', label: 'Cookie' },
  { emoji: '🛝', label: 'Slide' },
  { emoji: '🎨', label: 'Paint Palette' },
  { emoji: '🎵', label: 'Music Note' },
  { emoji: '⚽', label: 'Soccer Ball' },
  { emoji: '🪁', label: 'Spare Kite' },
  { emoji: '🧊', label: 'Ice Cube' },
  { emoji: '🌈', label: 'Bright Rainbow' },
]

function wordSpecs(difficulty: Difficulty, entries: ReadonlyArray<readonly [string, string]>): WordSpec[] {
  return entries.map(([answer, hint]) => ({ answer, difficulty, hint }))
}

const WORD_BANK: Readonly<Record<Difficulty, readonly WordSpec[]>> = {
  starter: wordSpecs('starter', [
    ['GO', 'Time to move from here to there.'],
    ['UP', 'The opposite of down.'],
    ['IN', 'The opposite of out.'],
    ['ON', 'What a light is after you switch it.'],
    ['NO', 'The opposite of yes.'],
    ['HI', 'A friendly hello.'],
    ['ME', 'A word for yourself.'],
    ['WE', 'A word for you and me together.'],
    ['DO', 'A tiny word that means to act.'],
    ['TO', 'A tiny helper word for going somewhere.'],
    ['BE', 'A tiny word that means to exist.'],
    ['MY', 'A word that shows something belongs to you.'],
    ['BY', 'A tiny word for being near something.'],
    ['IT', 'A tiny word for a thing.'],
    ['AM', 'A tiny word you use about yourself right now.'],
    ['US', 'A word for a group that includes me.'],
    ['OR', 'A tiny word for choosing this or that.'],
  ]),
  easy: wordSpecs('easy', [
    ['CAT', 'A furry pet that purrs.'],
    ['SUN', 'The big bright thing in the daytime sky.'],
    ['DOG', 'A loyal pet that loves fetch.'],
    ['BUG', 'A tiny crawly creature with six legs.'],
    ['HAT', 'Something you wear on your head.'],
    ['PIG', 'A pink farm animal that oinks.'],
    ['CUP', 'Something you drink from.'],
    ['BEE', 'A buzzy insect that makes honey.'],
    ['BED', 'The cozy place where you sleep.'],
    ['HEN', 'A farm bird that lays eggs.'],
    ['MAP', 'A guide that helps you find the way.'],
    ['COW', 'A farm animal that says moo.'],
    ['FOX', 'A clever orange animal with a fluffy tail.'],
    ['JAM', 'A sweet fruit spread for toast.'],
    ['BOX', 'A shape with sides that can hold toys.'],
    ['NUT', 'A crunchy snack with a shell.'],
    ['RUG', 'A soft mat for the floor.'],
    ['CAR', 'A vehicle that drives on roads.'],
    ['BUS', 'A big vehicle for many riders.'],
    ['SKY', 'The blue space high above you.'],
    ['WEB', 'A sticky spider net.'],
    ['LOG', 'A piece of a fallen tree trunk.'],
    ['ANT', 'A tiny worker insect.'],
    ['FIN', 'A fish part that helps it swim.'],
  ]),
  medium: wordSpecs('medium', [
    ['FROG', 'A green jumper that says ribbit.'],
    ['STAR', 'A tiny twinkle in the night sky.'],
    ['BOOK', 'Something with pages full of stories.'],
    ['FISH', 'A shiny swimmer with fins.'],
    ['CAKE', 'A sweet treat for birthdays.'],
    ['BIRD', 'A feathered friend that sings.'],
    ['TREE', 'A tall plant with a trunk and leaves.'],
    ['MOON', 'A bright circle in the night sky.'],
    ['BEAR', 'A big furry animal that loves honey.'],
    ['RAIN', 'Water drops that fall from clouds.'],
    ['BOAT', 'Something that floats on the water.'],
    ['LION', 'A big cat with a mighty roar.'],
    ['WOLF', 'A wild animal that howls.'],
    ['SNOW', 'Soft white flakes in winter.'],
    ['FARM', 'A place where crops grow and animals live.'],
    ['KITE', 'A toy that flies in the wind.'],
    ['SHIP', 'A huge boat for the sea.'],
    ['LAMP', 'A light that sits on a table.'],
    ['ROSE', 'A flower with petals and thorns.'],
    ['DUCK', 'A water bird with a bill.'],
    ['LEAF', 'A green part that grows on a branch.'],
    ['MILK', 'A drink that can come from a cow.'],
    ['COAT', 'A jacket you wear outside.'],
    ['WIND', 'Moving air you can feel.'],
  ]),
  hard: wordSpecs('hard', [
    ['OCEAN', 'A giant body of salty water.'],
    ['MOUSE', 'A tiny squeaky animal with big ears.'],
    ['TIGER', 'A striped big cat.'],
    ['CLOUD', 'A fluffy shape floating in the sky.'],
    ['PLANT', 'A living green thing that grows in soil.'],
    ['SNAKE', 'A long slithery reptile with no legs.'],
    ['HORSE', 'A fast animal you can ride.'],
    ['TRAIN', 'A choo-choo vehicle on tracks.'],
    ['LEMON', 'A sour yellow fruit.'],
    ['DREAM', 'A story your mind makes while you sleep.'],
    ['BEACH', 'A sandy place by the water.'],
    ['APPLE', 'A crunchy fruit that can be red or green.'],
    ['FLAME', 'A hot flicker from a fire.'],
    ['HEART', 'The part of your body that pumps blood.'],
    ['LIGHT', 'What helps you see in the dark.'],
    ['RIVER', 'Water that flows between two banks.'],
    ['SHEEP', 'A woolly farm animal that says baa.'],
    ['STONE', 'A hard little rock.'],
    ['GRASS', 'Green blades that cover a lawn.'],
    ['HOUSE', 'The place where people live.'],
  ]),
  expert: wordSpecs('expert', [
    ['FLOWER', 'A colorful bloom with petals.'],
    ['GARDEN', 'A place where flowers and veggies grow.'],
    ['CANDLE', 'A wax light with a little flame.'],
    ['ROCKET', 'A vehicle that blasts into space.'],
    ['PLANET', 'A huge world that circles a star.'],
    ['BRIDGE', 'A structure that helps you cross over.'],
    ['SPRING', 'The season when flowers begin to bloom.'],
    ['WINTER', 'The cold season for coats and snow.'],
    ['AUTUMN', 'The season of colorful falling leaves.'],
    ['TURTLE', 'A shelled animal that moves slowly.'],
    ['CASTLE', 'A giant stone home with towers.'],
    ['KITTEN', 'A baby cat.'],
    ['SUMMER', 'The hot season with sunny days.'],
    ['POCKET', 'A little pouch in your clothes.'],
    ['BUBBLE', 'A wobbly round sphere of soap.'],
  ]),
}

function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
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

function getLetterArt(char: string, variant: number): ItemArt {
  const options = LETTER_ART[char]
  if (!options || options.length === 0) {
    return { emoji: '🔤', label: `Letter ${char}` }
  }
  return options[variant % options.length]
}

function pickDistractors(answer: string, count: number, usedLabels: Set<string>): ItemArt[] {
  const startIndex = hashString(answer) % DISTRACTOR_ART.length
  const selected: ItemArt[] = []

  for (let offset = 0; selected.length < count && offset < DISTRACTOR_ART.length * 2; offset++) {
    const art = DISTRACTOR_ART[(startIndex + offset) % DISTRACTOR_ART.length]
    if (usedLabels.has(art.label)) continue

    usedLabels.add(art.label)
    selected.push(art)
  }

  return selected
}

function assignBasePositions(items: readonly Omit<SceneItem, 'x' | 'y'>[]): SceneItem[] {
  const layout = BASE_LAYOUTS[items.length] ?? BASE_LAYOUTS[9]
  return items.map((item, index) => ({
    ...item,
    x: layout[index]?.x ?? 50,
    y: layout[index]?.y ?? 50,
  }))
}

function randomizeLayout(items: readonly SceneItem[]): SceneItem[] {
  const layout = shuffle(BASE_LAYOUTS[items.length] ?? BASE_LAYOUTS[9]).slice(0, items.length)
  const shuffledItems = shuffle(items)

  return shuffledItems.map((item, index) => ({
    ...item,
    x: clamp(layout[index].x + (Math.random() * 8 - 4), 12, 88),
    y: clamp(layout[index].y + (Math.random() * 8 - 4), 14, 78),
  }))
}

function buildPuzzle(spec: WordSpec): Puzzle {
  const usedLabels = new Set<string>()
  const letters = [...spec.answer].map((char, index) => {
    const art = getLetterArt(char, hashString(`${spec.answer}-${index}`))
    usedLabels.add(art.label)

    return {
      id: `${spec.answer.toLowerCase()}-letter-${index}`,
      type: 'letter' as const,
      char,
      emoji: art.emoji,
      label: art.label,
    }
  })

  const distractorCount = Math.max(0, TOTAL_ITEMS_BY_DIFFICULTY[spec.difficulty] - letters.length)
  const distractors = pickDistractors(spec.answer, distractorCount, usedLabels).map((art, index) => ({
    id: `${spec.answer.toLowerCase()}-distractor-${index}`,
    type: 'distractor' as const,
    emoji: art.emoji,
    label: art.label,
  }))

  return {
    answer: spec.answer,
    difficulty: spec.difficulty,
    prompt: buildPrompt(spec),
    items: assignBasePositions([...letters, ...distractors]),
  }
}

/** Full puzzle pool — all difficulties combined */
export const PUZZLES: readonly Puzzle[] = Object.values(WORD_BANK)
  .flatMap((specs) => specs.map((spec) => buildPuzzle(spec)))

/** Number of puzzles to randomly select for a session when no filter is provided */
export const DEFAULT_SESSION_SIZE = 5

/**
 * Select a shuffled five-puzzle round for the requested difficulty.
 */
export function selectPuzzles(difficulty: Difficulty): Puzzle[] {
  const filtered = PUZZLES.filter((puzzle) => puzzle.difficulty === difficulty)
  const pool = filtered.length > 0 ? filtered : PUZZLES

  return shuffle(pool)
    .slice(0, Math.min(DEFAULT_SESSION_SIZE, pool.length))
    .map((puzzle) => ({
      ...puzzle,
      items: randomizeLayout(puzzle.items),
    }))
}
