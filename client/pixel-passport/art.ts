import type { PixelArt, SpriteSheet, VehicleSpriteSheet } from './types.js'

export interface PixelOverlay {
  readonly x: number
  readonly y: number
  readonly rows: readonly string[]
}

function buildPixelArt(palette: readonly string[], rows: readonly string[]): PixelArt {
  const width = rows[0]?.length ?? 0
  const height = rows.length
  const pixels = rows.flatMap((row) => Array.from(row, (value) => Number.parseInt(value, 10)))
  return { width, height, palette, pixels }
}

function applyPixelOverlays(art: PixelArt, overlays: readonly PixelOverlay[]): PixelArt {
  if (overlays.length === 0) {
    return art
  }

  const pixels = [...art.pixels]

  for (const overlay of overlays) {
    overlay.rows.forEach((row, rowIndex) => {
      Array.from(row).forEach((cell, cellIndex) => {
        if (cell === '.' || cell === ' ') {
          return
        }

        const targetX = overlay.x + cellIndex
        const targetY = overlay.y + rowIndex
        if (targetX < 0 || targetX >= art.width || targetY < 0 || targetY >= art.height) {
          return
        }

        const colorIndex = Number.parseInt(cell, 10)
        if (Number.isNaN(colorIndex)) {
          return
        }

        pixels[targetY * art.width + targetX] = colorIndex
      })
    })
  }

  return {
    ...art,
    pixels,
  }
}

export function buildSceneArt(
  palette: readonly string[],
  rows: readonly string[],
  overlays: readonly PixelOverlay[] = [],
): PixelArt {
  return applyPixelOverlays(buildPixelArt(palette, rows), overlays)
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
  wave: buildSceneArt(pipPalette, [
    '001100',
    '012210',
    '011110',
    '043340',
    '045540',
    '405504',
    '046640',
    '040040',
  ]),
  guide: buildSceneArt(pipPalette, [
    '001100',
    '012210',
    '011110',
    '043340',
    '045540',
    '045540',
    '046640',
    '040040',
  ]),
  cheer: buildSceneArt(pipPalette, [
    '001100',
    '012210',
    '011110',
    '403304',
    '045540',
    '405504',
    '040040',
    '440044',
  ]),
  think: buildSceneArt(pipPalette, [
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
  bus: buildSceneArt(vehiclePalette, [
    '0000000000',
    '0022222200',
    '0233553320',
    '0233553320',
    '0022222200',
    '0004000400',
  ]),
  train: buildSceneArt(vehiclePalette, [
    '0000000000',
    '0022222220',
    '0233555532',
    '0233555532',
    '0222222220',
    '0404000404',
  ]),
  boat: buildSceneArt(vehiclePalette, [
    '0000300000',
    '0000300000',
    '0003500000',
    '0023553000',
    '0222222220',
    '0004444000',
  ]),
  plane: buildSceneArt(vehiclePalette, [
    '0000500000',
    '0005550000',
    '2255555522',
    '0005550000',
    '0000505000',
    '0000400400',
  ]),
}