import type {
  Destination,
  DestinationId,
  PixelArt,
  SpriteSheet,
  TransportType,
  VehicleSpriteSheet,
} from './types.js'

function buildPixelArt(palette: readonly string[], rows: readonly string[]): PixelArt {
  const width = rows[0]?.length ?? 0
  const height = rows.length
  const pixels = rows.flatMap((row) => Array.from(row, (value) => Number.parseInt(value, 10)))
  return { width, height, palette, pixels }
}

function createGlobeArt(): PixelArt {
  const width = 40
  const height = 18
  const pixels = Array.from({ length: width * height }, () => 0)

  const paint = (x: number, y: number, shape: readonly string[], color: number): void => {
    shape.forEach((row, rowIndex) => {
      Array.from(row).forEach((cell, cellIndex) => {
        if (cell !== '1') return
        const targetX = x + cellIndex
        const targetY = y + rowIndex
        if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) return
        pixels[targetY * width + targetX] = color
      })
    })
  }

  paint(3, 4, [
    '011100',
    '111110',
    '111100',
    '011110',
    '001110',
  ], 1)
  paint(15, 3, [
    '00110',
    '01110',
    '11110',
    '01110',
    '01100',
    '01100',
  ], 2)
  paint(20, 4, [
    '0111100',
    '1111110',
    '1111111',
    '0111110',
    '0011110',
  ], 1)
  paint(31, 6, [
    '0111110',
    '1111111',
    '0111110',
    '0011110',
  ], 2)
  paint(27, 13, [
    '01110',
    '11111',
    '01110',
  ], 1)
  paint(10, 14, [
    '111111111111111111',
  ], 3)

  return {
    width,
    height,
    palette: ['#3a79bf', '#7acb64', '#d9cc74', '#eef5ff'],
    pixels,
  }
}

const pipPalette = ['transparent', '#2f2242', '#f8c8a8', '#ffde73', '#ef6f6c', '#5d8ff1', '#ffffff']
const vehiclePalette = ['transparent', '#22304a', '#f15f5c', '#ffd166', '#8ed1fc', '#ffffff', '#6ecb63']

export const GLOBE_ART = createGlobeArt()

export const PIP_SPRITES: SpriteSheet = {
  wave: buildPixelArt(pipPalette, [
    '001100',
    '012210',
    '011110',
    '043340',
    '045540',
    '405504',
    '046640',
    '040040',
  ]),
  guide: buildPixelArt(pipPalette, [
    '001100',
    '012210',
    '011110',
    '043340',
    '045540',
    '045540',
    '046640',
    '040040',
  ]),
  cheer: buildPixelArt(pipPalette, [
    '001100',
    '012210',
    '011110',
    '403304',
    '045540',
    '405504',
    '040040',
    '440044',
  ]),
  think: buildPixelArt(pipPalette, [
    '001100',
    '012210',
    '011110',
    '043340',
    '045540',
    '005540',
    '046040',
    '040040',
  ]),
}

export const VEHICLE_SPRITES: VehicleSpriteSheet = {
  bus: buildPixelArt(vehiclePalette, [
    '0000000000',
    '0022222200',
    '0233553320',
    '0233553320',
    '0022222200',
    '0004000400',
  ]),
  train: buildPixelArt(vehiclePalette, [
    '0000000000',
    '0022222220',
    '0233555532',
    '0233555532',
    '0222222220',
    '0404000404',
  ]),
  boat: buildPixelArt(vehiclePalette, [
    '0000300000',
    '0000300000',
    '0003500000',
    '0023553000',
    '0222222220',
    '0004444000',
  ]),
  plane: buildPixelArt(vehiclePalette, [
    '0000500000',
    '0005550000',
    '2255555522',
    '0005550000',
    '0000505000',
    '0000400400',
  ]),
}

const parisPalette = ['transparent', '#b9d7ff', '#cfd8ea', '#5e6a8a', '#6ac46c', '#d0a676']
const cairoPalette = ['transparent', '#98d4ff', '#f4d37d', '#d99a53', '#8c5f37', '#f6efc2']
const tokyoPalette = ['transparent', '#bfe4ff', '#ffd1dc', '#d86f8f', '#a44c5b', '#5fb36b', '#b05a3c']
const newYorkPalette = ['transparent', '#b8d9ff', '#7fb1ff', '#95e3f0', '#74c86a', '#88a4c9', '#5f758f']
const rioPalette = ['transparent', '#9ed6ff', '#6bc0e8', '#7cc96b', '#507a4a', '#cfd2d8', '#e1b55d']
const sydneyPalette = ['transparent', '#bce6ff', '#63b8e2', '#ffffff', '#8ecb70', '#5172a5', '#ffcf66']
const nairobiPalette = ['transparent', '#f7d274', '#e7b448', '#86c56e', '#5a7f47', '#74543a', '#ffffff']
const reykjavikPalette = ['transparent', '#0f2048', '#53d6b7', '#7cc4ff', '#ffffff', '#6a78d1']
const beijingPalette = ['transparent', '#cbe6ff', '#c74d4d', '#7a2c2c', '#9dcf68', '#cfb37a', '#8d6b41']

export const DESTINATIONS: readonly Destination[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    continent: 'Europe',
    markerEmoji: '🗼',
    markerColor: '#f08a5d',
    coords: { x: 43, y: 34 },
    coastal: true,
    scene: buildPixelArt(parisPalette, [
      '00000000110000000000',
      '00000000110000000000',
      '00000001221000000000',
      '00000012222100000000',
      '00000002222000000000',
      '00000012222100000000',
      '00000122222210000000',
      '00001222222221000000',
      '00001221111221000000',
      '00012221111222100000',
      '00112221111222110000',
      '11111111111111111111',
      '44444444455544444444',
      '44444444555554444444',
    ]),
    facts: ['This is Paris.', 'The tower is tall.', 'People say bonjour.'],
    clues: ['A giant iron tower stands here.', 'People here say bonjour.', 'This city is in France.'],
    memoryEmoji: '🎨',
    memoryLabel: 'beret',
  },
  {
    id: 'cairo',
    name: 'Cairo',
    country: 'Egypt',
    continent: 'Africa',
    markerEmoji: '🔺',
    markerColor: '#e9b44c',
    coords: { x: 55, y: 42 },
    coastal: false,
    scene: buildPixelArt(cairoPalette, [
      '00000000000000000000',
      '00000000005000000000',
      '00000000055500000000',
      '00000000555550000000',
      '00000000000500000000',
      '00000022200002220000',
      '00000222220022222000',
      '00002222222222222200',
      '00022222222222222220',
      '00222222222222222222',
      '33333333333333333333',
      '33333334333333333333',
      '33333344443333333333',
      '33333344443333333333',
    ]),
    facts: ['This is Cairo.', 'Big pyramids stand here.', 'The sand feels warm.'],
    clues: ['Huge pyramids stand here.', 'The air is hot and sandy.', 'This city is in Egypt.'],
    memoryEmoji: '🪲',
    memoryLabel: 'scarab',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    continent: 'Asia',
    markerEmoji: '🌸',
    markerColor: '#e97da2',
    coords: { x: 84, y: 39 },
    coastal: true,
    scene: buildPixelArt(tokyoPalette, [
      '00000000000000000000',
      '00000000022000000000',
      '00000000222200000000',
      '00000002555200000000',
      '00000025555520000000',
      '00000066666600000000',
      '00000066446600000000',
      '00200066446600000020',
      '02220044444400000222',
      '00222044444440002220',
      '00044444444444444400',
      '00044444444444444400',
      '55555555555555555555',
      '55555555555555555555',
    ]),
    facts: ['This is Tokyo.', 'Pink flowers bloom here.', 'People bow to say hi.'],
    clues: ['Pink blossoms fall here.', 'Many people bow to say hi.', 'This city is in Japan.'],
    memoryEmoji: '🎐',
    memoryLabel: 'wind chime',
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'USA',
    continent: 'North America',
    markerEmoji: '🗽',
    markerColor: '#56c2a6',
    coords: { x: 22, y: 39 },
    coastal: true,
    scene: buildPixelArt(newYorkPalette, [
      '00000000000000000000',
      '00000000000000000000',
      '00000000020000000000',
      '00000000020000000000',
      '00000000023000000000',
      '00000000023000000000',
      '00000000023000000000',
      '00000000023000000000',
      '00000000023300000000',
      '00000550023300550000',
      '00005555023305555000',
      '55555555555555555555',
      '44444444444444444444',
      '44444444444444444444',
    ]),
    facts: ['This is New York.', 'A green statue holds a torch.', 'Tall buildings shine here.'],
    clues: ['A green statue holds a torch.', 'Very tall buildings crowd this city.', 'This city is in America.'],
    memoryEmoji: '🗽',
    memoryLabel: 'torch',
  },
  {
    id: 'rio',
    name: 'Rio',
    country: 'Brazil',
    continent: 'South America',
    markerEmoji: '🎭',
    markerColor: '#f36b6b',
    coords: { x: 32, y: 68 },
    coastal: true,
    scene: buildPixelArt(rioPalette, [
      '00000000000000000000',
      '00000000000000000000',
      '00000000000000000000',
      '00000000005000000000',
      '00000000055500000000',
      '00000000555550000000',
      '00000005552555000000',
      '00000055522555500000',
      '00033333322233333000',
      '00333333322233333300',
      '03333333333333333330',
      '44444444444444444444',
      '11111111111111111111',
      '11111111111111111111',
    ]),
    facts: ['This is Rio.', 'A giant statue stands high.', 'Bright parades dance here.'],
    clues: ['A giant statue looks over the city.', 'Colorful parades dance here.', 'This city is in Brazil.'],
    memoryEmoji: '🎭',
    memoryLabel: 'carnival mask',
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    continent: 'Oceania',
    markerEmoji: '🪃',
    markerColor: '#7b9df7',
    coords: { x: 86, y: 73 },
    coastal: true,
    scene: buildPixelArt(sydneyPalette, [
      '00000000000000000000',
      '00000000000000000000',
      '00000000000000000000',
      '00000000000300000000',
      '00000000003330000000',
      '00000000033333000000',
      '00000000333333300000',
      '00000003330033330000',
      '00000033300003333000',
      '00000333000000333300',
      '00003330000000033330',
      '55555555555555555555',
      '11111111111111111111',
      '11111111111111111111',
    ]),
    facts: ['This is Sydney.', 'White sails shine here.', 'Kangaroos hop nearby.'],
    clues: ['White roof sails sparkle here.', 'Kangaroos live nearby.', 'This city is in Australia.'],
    memoryEmoji: '🪃',
    memoryLabel: 'boomerang',
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    continent: 'Africa',
    markerEmoji: '🦁',
    markerColor: '#d27f45',
    coords: { x: 60, y: 58 },
    coastal: false,
    scene: buildPixelArt(nairobiPalette, [
      '00000000000000000000',
      '00000000000000000000',
      '00000000000000000000',
      '00000004000000000000',
      '00000044000000000000',
      '00000044000000000000',
      '00000044444400000000',
      '00000040040000000000',
      '00000000000000055000',
      '00000000000000555500',
      '00000000000000550500',
      '11111111111111111111',
      '22222222222222222222',
      '22222222222222222222',
    ]),
    facts: ['This is Nairobi.', 'Lions roam nearby.', 'Tall grass sways here.'],
    clues: ['Lions and elephants roam nearby.', 'Golden grass waves here.', 'This city is in Kenya.'],
    memoryEmoji: '📿',
    memoryLabel: 'beaded bracelet',
  },
  {
    id: 'reykjavik',
    name: 'Reykjavik',
    country: 'Iceland',
    continent: 'Europe',
    markerEmoji: '🔮',
    markerColor: '#78dce8',
    coords: { x: 38, y: 20 },
    coastal: true,
    scene: buildPixelArt(reykjavikPalette, [
      '00000000000000000000',
      '02000000050000000020',
      '00220000555000002200',
      '00022205555502220000',
      '00000225555222000000',
      '00000002555200000000',
      '00000000222000000000',
      '00000000022000000000',
      '00000440022004400000',
      '00004444022044440000',
      '00044444444444444000',
      '33333333333333333333',
      '44444444444444444444',
      '44444444444444444444',
    ]),
    facts: ['This is Reykjavik.', 'Green lights dance at night.', 'Hot water pops from the ground.'],
    clues: ['Green lights dance in the sky.', 'Hot water pops from the ground.', 'This city is in Iceland.'],
    memoryEmoji: '🔮',
    memoryLabel: 'snow globe',
  },
  {
    id: 'beijing',
    name: 'Beijing',
    country: 'China',
    continent: 'Asia',
    markerEmoji: '🏮',
    markerColor: '#c75252',
    coords: { x: 72, y: 35 },
    coastal: false,
    scene: buildPixelArt(beijingPalette, [
      '00000000000000000000',
      '00000000000000000000',
      '00000000000000000000',
      '00002200000000000000',
      '00022220000000000000',
      '00222222000000022000',
      '02222222200000222200',
      '00222222220002222200',
      '00022222222222222000',
      '00002222222222200000',
      '00000222222222000000',
      '44444444444444444444',
      '55555555555555555555',
      '55555555555555555555',
    ]),
    facts: ['This is Beijing.', 'A long wall climbs hills here.', 'Red lanterns glow here.'],
    clues: ['A very long wall climbs the hills.', 'Red lanterns glow here.', 'This city is in China.'],
    memoryEmoji: '🏮',
    memoryLabel: 'paper lantern',
  },
] as const

export function getDestination(destinationId: DestinationId | null): Destination | null {
  if (!destinationId) return null
  return DESTINATIONS.find((destination) => destination.id === destinationId) ?? null
}

export function getDestinationIndex(destinationId: DestinationId): number {
  return DESTINATIONS.findIndex((destination) => destination.id === destinationId)
}

export function pickNextMysteryTarget(completed: readonly DestinationId[]): DestinationId | null {
  return DESTINATIONS.find((destination) => !completed.includes(destination.id))?.id ?? null
}

export function getTransportType(from: Destination | null, to: Destination): TransportType {
  if (!from) return 'plane'

  const distance = Math.hypot(to.coords.x - from.coords.x, to.coords.y - from.coords.y)

  if (from.continent === to.continent) {
    return distance < 15 ? 'bus' : 'train'
  }

  if (from.coastal && to.coastal && distance < 34) {
    return 'boat'
  }

  return 'plane'
}