import { writeFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const DEFAULT_SIZE = 16
const DEFAULT_MAX_COLORS = 6
const DEFAULT_ALPHA_THRESHOLD = 0.18
const DEFAULT_FONT_SIZE = 384
const DEFAULT_PADDING = 0.08
const MIN_TOTAL_PALETTE_ENTRIES = 2
const MAX_TOTAL_PALETTE_ENTRIES = 10

export interface PixelSample {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly a: number
}

export interface IndexedPixelArt {
  readonly palette: readonly string[]
  readonly rows: readonly string[]
}

export interface GeneratePixelArtOptions {
  readonly emoji: string
  readonly name: string
  readonly width: number
  readonly height: number
  readonly maxColors: number
  readonly alphaThreshold: number
  readonly fontSize: number
  readonly padding: number
  readonly format: 'ts' | 'json'
  readonly outPath?: string
}

interface ClusterCenter {
  readonly r: number
  readonly g: number
  readonly b: number
}

interface WeightedPoint extends ClusterCenter {
  readonly weight: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function isDirectRun(): boolean {
  const entry = process.argv[1]
  if (!entry) {
    return false
  }

  return import.meta.url === pathToFileURL(entry).href
}

function printHelp(): void {
  console.log(`Generate repo-ready pixel-art rows from an emoji.

Usage:
  npm run generate:pixel-art -- --emoji "🗼" --name parisTower --width 20 --height 14 --max-colors 6
  npm run generate:pixel-art -- --codepoints 1F5FC --name parisTower --width 20 --height 14 --max-colors 6

Options:
  --emoji <value>              Emoji to render.
  --codepoints <value>         Hex codepoints such as 1F5FC or 1F3F0-FE0F.
  --name <value>               Base name for the generated TypeScript snippet. Default: emojiArt
  --grid <number>              Set width and height together.
  --width <number>             Output width in pixels. Default: 16
  --height <number>            Output height in pixels. Default: 16
  --max-colors <number>        Total palette entries including transparent. Range: 2-10. Default: 6
  --alpha-threshold <number>   Transparency cutoff from 0 to 1. Default: 0.18
  --font-size <number>         Source emoji font size before downsampling. Default: 384
  --padding <number>           Extra crop padding from 0 to 1. Default: 0.08
  --format <ts|json>           Output format. Default: ts
  --out <path>                 Write the generated snippet to a file instead of stdout.
  --help                       Show this help.
`)
}

function readRequiredValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}.`)
  }

  return value
}

function parsePositiveInteger(rawValue: string, flag: string): number {
  const value = Number.parseInt(rawValue, 10)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be a positive integer.`)
  }

  return value
}

function parseBoundedNumber(rawValue: string, flag: string, min: number, max: number): number {
  const value = Number.parseFloat(rawValue)
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${flag} must be between ${min} and ${max}.`)
  }

  return value
}

export function decodeCodepoints(input: string): string {
  const pieces = input
    .split(/[\s,-]+/)
    .map((part) => part.trim().replace(/^U\+/i, ''))
    .filter(Boolean)

  if (pieces.length === 0) {
    throw new Error('No codepoints were provided.')
  }

  return pieces
    .map((part) => {
      const codepoint = Number.parseInt(part, 16)
      if (!Number.isInteger(codepoint) || codepoint < 0) {
        throw new Error(`Invalid codepoint: ${part}`)
      }

      return String.fromCodePoint(codepoint)
    })
    .join('')
}

function parseCliArgs(args: readonly string[]): GeneratePixelArtOptions | null {
  let emoji = ''
  let name = 'emojiArt'
  let width = DEFAULT_SIZE
  let height = DEFAULT_SIZE
  let maxColors = DEFAULT_MAX_COLORS
  let alphaThreshold = DEFAULT_ALPHA_THRESHOLD
  let fontSize = DEFAULT_FONT_SIZE
  let padding = DEFAULT_PADDING
  let format: GeneratePixelArtOptions['format'] = 'ts'
  let outPath: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    switch (arg) {
      case '--help':
        return null
      case '--emoji':
        emoji = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--codepoints':
        emoji = decodeCodepoints(readRequiredValue(args, index, arg))
        index += 1
        break
      case '--name':
        name = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--grid': {
        const size = parsePositiveInteger(readRequiredValue(args, index, arg), arg)
        width = size
        height = size
        index += 1
        break
      }
      case '--width':
        width = parsePositiveInteger(readRequiredValue(args, index, arg), arg)
        index += 1
        break
      case '--height':
        height = parsePositiveInteger(readRequiredValue(args, index, arg), arg)
        index += 1
        break
      case '--max-colors':
        maxColors = parsePositiveInteger(readRequiredValue(args, index, arg), arg)
        index += 1
        break
      case '--alpha-threshold':
        alphaThreshold = parseBoundedNumber(readRequiredValue(args, index, arg), arg, 0, 1)
        index += 1
        break
      case '--font-size':
        fontSize = parsePositiveInteger(readRequiredValue(args, index, arg), arg)
        index += 1
        break
      case '--padding':
        padding = parseBoundedNumber(readRequiredValue(args, index, arg), arg, 0, 1)
        index += 1
        break
      case '--format': {
        const nextFormat = readRequiredValue(args, index, arg)
        if (nextFormat !== 'ts' && nextFormat !== 'json') {
          throw new Error('--format must be ts or json.')
        }

        format = nextFormat
        index += 1
        break
      }
      case '--out':
        outPath = readRequiredValue(args, index, arg)
        index += 1
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!emoji) {
    throw new Error('Provide --emoji or --codepoints.')
  }

  if (maxColors < MIN_TOTAL_PALETTE_ENTRIES || maxColors > MAX_TOTAL_PALETTE_ENTRIES) {
    throw new Error(`--max-colors must stay between ${MIN_TOTAL_PALETTE_ENTRIES} and ${MAX_TOTAL_PALETTE_ENTRIES}.`)
  }

  return {
    emoji,
    name,
    width,
    height,
    maxColors,
    alphaThreshold,
    fontSize,
    padding,
    format,
    outPath,
  }
}

function squaredDistance(left: ClusterCenter, right: ClusterCenter): number {
  const red = left.r - right.r
  const green = left.g - right.g
  const blue = left.b - right.b
  return red * red + green * green + blue * blue
}

function colorLuminance(color: ClusterCenter): number {
  return color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
}

function formatHexColor(color: ClusterCenter): string {
  const red = Math.round(clamp(color.r, 0, 255)).toString(16).padStart(2, '0')
  const green = Math.round(clamp(color.g, 0, 255)).toString(16).padStart(2, '0')
  const blue = Math.round(clamp(color.b, 0, 255)).toString(16).padStart(2, '0')
  return `#${red}${green}${blue}`
}

function getNearestColorIndex(color: ClusterCenter, palette: readonly ClusterCenter[]): number {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < palette.length; index += 1) {
    const distance = squaredDistance(color, palette[index])
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

function weightedAverage(points: readonly WeightedPoint[]): ClusterCenter {
  let totalWeight = 0
  let red = 0
  let green = 0
  let blue = 0

  for (const point of points) {
    totalWeight += point.weight
    red += point.r * point.weight
    green += point.g * point.weight
    blue += point.b * point.weight
  }

  if (totalWeight <= 0) {
    return { r: 0, g: 0, b: 0 }
  }

  return {
    r: red / totalWeight,
    g: green / totalWeight,
    b: blue / totalWeight,
  }
}

function seedCentroids(points: readonly WeightedPoint[], clusterCount: number): ClusterCenter[] {
  const histogram = new Map<string, WeightedPoint>()

  for (const point of points) {
    const key = `${point.r},${point.g},${point.b}`
    const existing = histogram.get(key)
    if (existing) {
      histogram.set(key, {
        r: existing.r,
        g: existing.g,
        b: existing.b,
        weight: existing.weight + point.weight,
      })
      continue
    }

    histogram.set(key, point)
  }

  const ranked = [...histogram.entries()]
    .map(([key, point]) => ({ key, point }))
    .sort((left, right) => right.point.weight - left.point.weight || left.key.localeCompare(right.key))

  const centroids: ClusterCenter[] = [ranked[0]?.point ?? { r: 0, g: 0, b: 0 }]

  while (centroids.length < clusterCount) {
    let bestCandidate = ranked[0]?.point ?? centroids[0]
    let bestScore = -1

    for (const entry of ranked) {
      const distance = Math.min(...centroids.map((center) => squaredDistance(entry.point, center)))
      const score = distance * entry.point.weight
      if (score > bestScore) {
        bestScore = score
        bestCandidate = entry.point
      }
    }

    centroids.push(bestCandidate)
  }

  return centroids
}

function centersConverged(left: readonly ClusterCenter[], right: readonly ClusterCenter[]): boolean {
  return left.every((center, index) => squaredDistance(center, right[index]) < 1)
}

export function buildIndexedPixelArt(
  samples: readonly PixelSample[],
  width: number,
  height: number,
  maxColors: number,
  alphaThreshold: number,
): IndexedPixelArt {
  if (samples.length !== width * height) {
    throw new Error('Sample count does not match the requested art dimensions.')
  }

  const opaquePoints: WeightedPoint[] = []
  const safeThreshold = clamp(alphaThreshold, 0, 1)

  for (const sample of samples) {
    const alpha = sample.a / 255
    if (alpha < safeThreshold) {
      continue
    }

    opaquePoints.push({
      r: sample.r,
      g: sample.g,
      b: sample.b,
      weight: Math.max(alpha, 0.01),
    })
  }

  if (opaquePoints.length === 0) {
    throw new Error('The rendered emoji did not produce any visible pixels.')
  }

  const clusterCount = Math.min(Math.max(maxColors - 1, 1), opaquePoints.length)
  let centers = seedCentroids(opaquePoints, clusterCount)

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const clusters = centers.map(() => [] as WeightedPoint[])

    for (const point of opaquePoints) {
      clusters[getNearestColorIndex(point, centers)].push(point)
    }

    const nextCenters = centers.map((center, index) => {
      if (clusters[index].length === 0) {
        return center
      }

      return weightedAverage(clusters[index])
    })

    if (centersConverged(centers, nextCenters)) {
      centers = nextCenters
      break
    }

    centers = nextCenters
  }

  const clusterUsage = centers.map(() => 0)
  for (const point of opaquePoints) {
    const nearestIndex = getNearestColorIndex(point, centers)
    clusterUsage[nearestIndex] += point.weight
  }

  const orderedClusters = centers
    .map((center, index) => ({
      center,
      index,
      usage: clusterUsage[index],
      hex: formatHexColor(center),
    }))
    .filter((entry) => entry.usage > 0)
    .sort((left, right) => {
      if (right.usage !== left.usage) {
        return right.usage - left.usage
      }

      const luminanceDiff = colorLuminance(left.center) - colorLuminance(right.center)
      if (luminanceDiff !== 0) {
        return luminanceDiff
      }

      return left.hex.localeCompare(right.hex)
    })

  const paletteColors: string[] = []
  const clusterIndexToPaletteIndex = new Map<number, number>()

  for (const cluster of orderedClusters) {
    const existingIndex = paletteColors.indexOf(cluster.hex)
    if (existingIndex >= 0) {
      clusterIndexToPaletteIndex.set(cluster.index, existingIndex + 1)
      continue
    }

    paletteColors.push(cluster.hex)
    clusterIndexToPaletteIndex.set(cluster.index, paletteColors.length)
  }

  if (paletteColors.length + 1 > MAX_TOTAL_PALETTE_ENTRIES) {
    throw new Error(`Generated palette exceeded ${MAX_TOTAL_PALETTE_ENTRIES} total entries.`)
  }

  const rows: string[] = []
  let currentRow = ''

  for (const sample of samples) {
    const alpha = sample.a / 255
    if (alpha < safeThreshold) {
      currentRow += '0'
    } else {
      const clusterIndex = getNearestColorIndex(sample, centers)
      const paletteIndex = clusterIndexToPaletteIndex.get(clusterIndex)
      if (!paletteIndex) {
        throw new Error('Failed to map a rendered pixel to a palette index.')
      }

      currentRow += String(paletteIndex)
    }

    if (currentRow.length === width) {
      rows.push(currentRow)
      currentRow = ''
    }
  }

  return {
    palette: ['transparent', ...paletteColors],
    rows,
  }
}

export function toCamelCaseIdentifier(input: string): string {
  const pieces = input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (pieces.length === 0) {
    return 'emojiArt'
  }

  return pieces
    .map((piece, index) => {
      const normalized = piece.toLowerCase()
      if (index === 0) {
        return /^[0-9]/.test(normalized) ? `art${normalized}` : normalized
      }

      return normalized.charAt(0).toUpperCase() + normalized.slice(1)
    })
    .join('')
}

export function formatTypeScriptSnippet(name: string, art: IndexedPixelArt): string {
  const baseName = toCamelCaseIdentifier(name)
  const paletteName = `${baseName}Palette`
  const rowsName = `${baseName}Rows`
  const artName = `${baseName}Art`
  const paletteValues = art.palette.map((color) => `'${color}'`).join(', ')
  const rowLines = art.rows.map((row) => `  '${row}',`).join('\n')

  return `const ${paletteName} = [${paletteValues}] as const

const ${rowsName} = [
${rowLines}
] as const

const ${artName} = buildSceneArt(${paletteName}, ${rowsName})
`
}

function formatOutput(options: GeneratePixelArtOptions, art: IndexedPixelArt): string {
  if (options.format === 'json') {
    return `${JSON.stringify({ palette: art.palette, rows: art.rows }, null, 2)}\n`
  }

  return formatTypeScriptSnippet(options.name, art)
}

async function renderEmojiSamples(options: GeneratePixelArtOptions): Promise<PixelSample[]> {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage({ viewport: { width: 640, height: 640 }, deviceScaleFactor: 1 })

    return await page.evaluate(({ emoji, width, height, fontSize, padding }) => {
      const sourceSize = Math.max(512, fontSize + 128)
      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = sourceSize
      sourceCanvas.height = sourceSize

      const sourceContext = sourceCanvas.getContext('2d')
      if (!sourceContext) {
        throw new Error('Browser 2D canvas support is unavailable.')
      }

      sourceContext.clearRect(0, 0, sourceSize, sourceSize)
      sourceContext.textAlign = 'center'
      sourceContext.textBaseline = 'middle'
      sourceContext.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`
      sourceContext.fillText(emoji, sourceSize / 2, sourceSize / 2)

      const sourcePixels = sourceContext.getImageData(0, 0, sourceSize, sourceSize).data
      let minX = sourceSize
      let minY = sourceSize
      let maxX = -1
      let maxY = -1

      for (let y = 0; y < sourceSize; y += 1) {
        for (let x = 0; x < sourceSize; x += 1) {
          const alpha = sourcePixels[(y * sourceSize + x) * 4 + 3]
          if (alpha === 0) {
            continue
          }

          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }

      if (maxX < 0 || maxY < 0) {
        throw new Error('The emoji did not render visible pixels. Try a different emoji or ensure color emoji fonts are installed.')
      }

      const contentWidth = maxX - minX + 1
      const contentHeight = maxY - minY + 1
      const paddingPx = Math.max(1, Math.round(Math.max(contentWidth, contentHeight) * padding))
      const cropX = Math.max(0, minX - paddingPx)
      const cropY = Math.max(0, minY - paddingPx)
      const cropWidth = Math.min(sourceSize - cropX, contentWidth + paddingPx * 2)
      const cropHeight = Math.min(sourceSize - cropY, contentHeight + paddingPx * 2)

      const targetCanvas = document.createElement('canvas')
      targetCanvas.width = width
      targetCanvas.height = height

      const targetContext = targetCanvas.getContext('2d')
      if (!targetContext) {
        throw new Error('Browser 2D canvas support is unavailable for downsampling.')
      }

      targetContext.clearRect(0, 0, width, height)
      targetContext.imageSmoothingEnabled = true
      targetContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height)

      const targetPixels = targetContext.getImageData(0, 0, width, height).data
      return Array.from({ length: width * height }, (_, index) => {
        const offset = index * 4
        return {
          r: targetPixels[offset],
          g: targetPixels[offset + 1],
          b: targetPixels[offset + 2],
          a: targetPixels[offset + 3],
        }
      })
    }, options)
  } finally {
    await browser.close()
  }
}

export async function generatePixelArt(options: GeneratePixelArtOptions): Promise<IndexedPixelArt> {
  const samples = await renderEmojiSamples(options)
  return buildIndexedPixelArt(samples, options.width, options.height, options.maxColors, options.alphaThreshold)
}

export async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  const options = parseCliArgs(args)
  if (!options) {
    printHelp()
    return
  }

  const output = formatOutput(options, await generatePixelArt(options))
  if (options.outPath) {
    writeFileSync(options.outPath, output, 'utf-8')
    console.log(`Wrote ${options.outPath}`)
    return
  }

  process.stdout.write(output)
}

if (isDirectRun()) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  })
}