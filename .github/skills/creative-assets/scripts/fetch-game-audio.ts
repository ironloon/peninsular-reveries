import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { relative, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import {
  getDownloadableChompersSamples,
} from '../../../../client/chompers/sample-manifest.js'
import {
  getDownloadableMissionOrbitSamples,
  type MissionOrbitSampleDefinition,
  type MissionOrbitSampleProcessingPlan,
} from '../../../../client/mission-orbit/sample-manifest.js'

interface FreesoundPreviewSet {
  readonly 'preview-hq-ogg'?: string
  readonly 'preview-lq-ogg'?: string
  readonly 'preview-hq-mp3'?: string
  readonly 'preview-lq-mp3'?: string
}

interface FreesoundSoundResponse {
  readonly id: number
  readonly name: string
  readonly username: string
  readonly license: string
  readonly url: string
  readonly previews: FreesoundPreviewSet
}

interface ScriptOptions {
  readonly gameSlug: string | null
  readonly onlySampleId: string | null
  readonly autoApprove: boolean
  readonly listOnly: boolean
}

interface GenericGameAudioSampleDefinition {
  readonly id: string
  readonly fileName: `${string}.ogg`
  readonly source: MissionOrbitSampleDefinition['source']
  readonly processing?: MissionOrbitSampleProcessingPlan
}

interface GameAudioConfig {
  readonly outputDir: string
  readonly getDownloadableSamples: () => readonly GenericGameAudioSampleDefinition[]
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../../../../')
const envPath = join(repoRoot, '.env')

const gameAudioConfigs: Record<string, GameAudioConfig> = {
  chompers: {
    outputDir: join(repoRoot, 'public', 'chompers', 'audio'),
    getDownloadableSamples: () => getDownloadableChompersSamples() as readonly GenericGameAudioSampleDefinition[],
  },
  'mission-orbit': {
    outputDir: join(repoRoot, 'public', 'mission-orbit', 'audio'),
    getDownloadableSamples: () => getDownloadableMissionOrbitSamples() as readonly GenericGameAudioSampleDefinition[],
  },
}

async function loadEnvFile(): Promise<void> {
  try {
    const text = await readFile(envPath, 'utf-8')
    for (const rawLine of text.split(/\r?\n/u)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) continue
      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // Ignore missing .env; validation happens below.
  }
}

function requireApiKey(): string {
  const apiKey = process.env.FREESOUND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Missing FREESOUND_API_KEY in .env')
  }
  return apiKey
}

function ensureFfmpegAvailable(): void {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
  if (result.status !== 0) {
    throw new Error('ffmpeg is not available on PATH')
  }
}

function parseArgs(argv: readonly string[]): ScriptOptions {
  let gameSlug: string | null = null
  let onlySampleId: string | null = null
  let autoApprove = false
  let listOnly = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--yes') {
      autoApprove = true
      continue
    }
    if (arg === '--list') {
      listOnly = true
      continue
    }
    if (arg === '--game') {
      gameSlug = argv[index + 1] ?? null
      index += 1
      continue
    }
    if (arg.startsWith('--game=')) {
      gameSlug = arg.slice('--game='.length)
      continue
    }
    if (arg === '--only') {
      onlySampleId = argv[index + 1] ?? null
      index += 1
      continue
    }
    if (arg.startsWith('--only=')) {
      onlySampleId = arg.slice('--only='.length)
    }
  }

  return { gameSlug, onlySampleId, autoApprove, listOnly }
}

function getGameAudioConfig(gameSlug: string | null): GameAudioConfig {
  if (!gameSlug) {
    throw new Error('Missing --game <slug>')
  }

  const config = gameAudioConfigs[gameSlug]
  if (!config) {
    throw new Error(`Unsupported game slug: ${gameSlug}`)
  }

  return config
}

function buildFilterChain(
  durationSeconds: number | undefined,
  fadeOutStartSeconds: number | undefined,
  fadeOutSeconds: number | undefined,
  filters: readonly string[] | undefined,
  fadeInSeconds: number | undefined,
): string | null {
  const chain: string[] = []
  if (filters) {
    chain.push(...filters)
  }
  if (fadeInSeconds && fadeInSeconds > 0) {
    chain.push(`afade=t=in:d=${fadeInSeconds}`)
  }
  if (fadeOutSeconds && fadeOutSeconds > 0) {
    const fadeStart = fadeOutStartSeconds ?? Math.max((durationSeconds ?? fadeOutSeconds) - fadeOutSeconds, 0)
    chain.push(`afade=t=out:st=${fadeStart}:d=${fadeOutSeconds}`)
  }

  return chain.length > 0 ? chain.join(',') : null
}

function runFfmpeg(rawInputPath: string, outputPath: string, sampleId: string, processing: MissionOrbitSampleProcessingPlan): void {
  const args = ['-y']

  if (processing.startSeconds !== undefined) {
    args.push('-ss', String(processing.startSeconds))
  }
  if (processing.durationSeconds !== undefined) {
    args.push('-t', String(processing.durationSeconds))
  }

  args.push('-i', rawInputPath)

  if (processing.mono) {
    args.push('-ac', '1')
  }
  args.push('-ar', '48000')

  const filterChain = buildFilterChain(
    processing.durationSeconds,
    processing.fadeOutStartSeconds,
    processing.fadeOutSeconds,
    processing.filters,
    processing.fadeInSeconds,
  )
  if (filterChain) {
    args.push('-af', filterChain)
  }

  args.push('-c:a', 'libvorbis', '-b:a', `${processing.bitrateKbps}k`, outputPath)

  const result = spawnSync('ffmpeg', args, {
    cwd: repoRoot,
    encoding: 'utf-8',
  })

  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${sampleId}: ${result.stderr || result.stdout}`)
  }

  verifyRenderedOutput(outputPath, sampleId)
}

function verifyRenderedOutput(outputPath: string, sampleId: string): void {
  const result = spawnSync('ffmpeg', ['-i', outputPath, '-af', 'volumedetect', '-f', 'null', '-'], {
    cwd: repoRoot,
    encoding: 'utf-8',
  })

  const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const maxVolumeMatch = combinedOutput.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/u)
  const maxVolume = maxVolumeMatch ? Number(maxVolumeMatch[1]) : Number.NaN

  if (!Number.isFinite(maxVolume) || maxVolume <= -70) {
    throw new Error(`Processed output for ${sampleId} is effectively silent (max_volume=${maxVolumeMatch?.[1] ?? 'unavailable'} dB)`)
  }
}

async function fetchFreesoundMetadata(soundId: number, apiKey: string): Promise<FreesoundSoundResponse> {
  const response = await fetch(`https://freesound.org/apiv2/sounds/${soundId}/?fields=id,name,username,license,url,previews`, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Freesound metadata request failed for ${soundId}: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<FreesoundSoundResponse>
}

async function downloadPreview(previewUrl: string, destinationPath: string): Promise<void> {
  const response = await fetch(previewUrl)
  if (!response.ok) {
    throw new Error(`Preview download failed: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(destinationPath, buffer)
}

async function confirm(rl: ReturnType<typeof createInterface>, prompt: string): Promise<boolean> {
  const answer = (await rl.question(prompt)).trim().toLowerCase()
  return answer === 'y' || answer === 'yes'
}

function isCc0License(license: string): boolean {
  return /creative commons 0|publicdomain\/zero/u.test(license.toLowerCase())
}

function listSamples(gameSlug: string, config: GameAudioConfig): void {
  for (const sample of config.getDownloadableSamples()) {
    if (sample.source.provider !== 'freesound') continue
    console.log(`${gameSlug}: ${sample.id} -> ${sample.source.soundId} (${sample.source.title} by ${sample.source.creator})`)
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const config = getGameAudioConfig(options.gameSlug)
  const gameSlug = options.gameSlug as string

  if (options.listOnly) {
    listSamples(gameSlug, config)
    return
  }

  await loadEnvFile()
  ensureFfmpegAvailable()
  const apiKey = requireApiKey()

  const stagingDir = resolve(scriptDir, '../.sound-staging', gameSlug)

  await mkdir(stagingDir, { recursive: true })
  await mkdir(config.outputDir, { recursive: true })

  const rl = createInterface({ input, output })

  try {
    const selectedSamples = config.getDownloadableSamples().filter((sample) => {
      if (!options.onlySampleId) return true
      return sample.id === options.onlySampleId
    })

    if (options.onlySampleId && selectedSamples.length === 0) {
      throw new Error(`Unknown sample id for ${gameSlug}: ${options.onlySampleId}`)
    }

    for (const sample of selectedSamples) {
      if (!sample.processing || sample.source.provider !== 'freesound') continue

      const relativeOutputPath = relative(repoRoot, join(config.outputDir, sample.fileName)).replace(/\\/gu, '/')

      console.log(`\nPlanned sample: ${sample.id}`)
      console.log(`  Game: ${gameSlug}`)
      console.log(`  Source: ${sample.source.title} by ${sample.source.creator}`)
      console.log(`  URL: ${sample.source.sourceUrl}`)
      console.log(`  Output: ${relativeOutputPath}`)

      const shouldDownload = options.autoApprove
        ? true
        : await confirm(rl, 'Download and process this sample now? [y/N] ')
      if (!shouldDownload) {
        continue
      }

      const metadata = await fetchFreesoundMetadata(sample.source.soundId, apiKey)
      const previewUrl = metadata.previews['preview-hq-ogg'] ?? metadata.previews['preview-lq-ogg']
      if (!previewUrl) {
        throw new Error(`No OGG preview returned for ${sample.id}`)
      }
      if (!isCc0License(metadata.license)) {
        throw new Error(`Refusing to process non-CC0 sound for ${sample.id}: ${metadata.license}`)
      }

      const rawInputPath = join(stagingDir, `${sample.id}-raw.ogg`)
      const finalOutputPath = join(config.outputDir, sample.fileName)

      console.log(`  Downloading preview for ${metadata.name}...`)
      await downloadPreview(previewUrl, rawInputPath)

      console.log(`  Processing ${sample.fileName} with ffmpeg...`)
      runFfmpeg(rawInputPath, finalOutputPath, sample.id, sample.processing)

      console.log('  Complete.')
      console.log(`  Attribution: ${metadata.name} by ${metadata.username}`)
      console.log(`  License: ${metadata.license}`)
      console.log(`  Source page: ${metadata.url}`)

      const continueToNext = options.autoApprove
        ? true
        : await confirm(rl, 'Proceed to the next sound? [y/N] ')
      if (!continueToNext) {
        break
      }
    }
  } finally {
    rl.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
