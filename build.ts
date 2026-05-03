import * as esbuild from 'esbuild'
import { execSync } from 'node:child_process'
import { cpSync, readFileSync, readdirSync, rmSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createAppRouter } from './app/router.js'

const outputDir = process.env.BUILD_OUTPUT_DIR || 'dist'

// ── Clean output ──────────────────────────────────────────
rmSync(outputDir, { recursive: true, force: true })

// ── Copy static assets ───────────────────────────────────
cpSync('public', outputDir, { recursive: true })

// ── Stamp service workers with git SHA ──────────────────
const sha = execSync('git rev-parse --short HEAD').toString().trim()
const swFiles = [
  'sw.js',
  'chompers/sw.js',
  'mission-orbit/sw.js',
  'super-word/sw.js',
  'pixel-passport/sw.js',
  'story-trail/sw.js',
  'squares/sw.js',
  'waterwall/sw.js',
  'beat-pad/sw.js',
  'train-sounds/sw.js',
  'peekaboo/sw.js',
  'spot-on/sw.js',
  'copycat/sw.js',
  'dragons-crunch/sw.js',
  'mudskipper/sw.js',
  'tuna-piano/sw.js',
  'grow-with-me/sw.js',
  'baking-simulator/sw.js',
]
for (const swFile of swFiles) {
  const swPath = join(outputDir, swFile)
  const content = readFileSync(swPath, 'utf-8')
  const updated = content.replace(/const CACHE_NAME = '[^']+'/g, (match) => {
    const prefixMatch = match.match(/const CACHE_NAME = '(.*)-v\d+'/)
    const prefix = prefixMatch ? prefixMatch[1] : 'site'
    return `const CACHE_NAME = '${prefix}-${sha}'`
  })
  writeFileSync(swPath, updated)
}

mkdirSync(join(outputDir, 'client', 'mission-orbit'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'super-word'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'chompers'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'pixel-passport'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'story-trail'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'squares'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'waterwall'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'beat-pad'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'train-sounds'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'peekaboo'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'spot-on'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'copycat'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'dragons-crunch'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'mudskipper'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'tuna-piano'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'grow-with-me'), { recursive: true })
mkdirSync(join(outputDir, 'client', 'baking-simulator'), { recursive: true })

// ── Minify copied CSS assets ─────────────────────────────
const stylesheetDir = join(outputDir, 'styles')
for (const file of readdirSync(stylesheetDir)) {
  if (!file.endsWith('.css')) continue

  const filePath = join(stylesheetDir, file)
  const source = readFileSync(filePath, 'utf-8')
  const result = await esbuild.transform(source, {
    loader: 'css',
    minify: true,
    legalComments: 'none',
  })
  writeFileSync(filePath, result.code)
}

// ── Bundle client code ───────────────────────────────────
await esbuild.build({
  entryPoints: [
    'client/shell.ts',
    'client/home.ts',
    'client/404.ts',
  ],
  bundle: true,
  outdir: join(outputDir, 'client'),
  format: 'esm',
  target: 'es2022',
  minify: true,
  sourcemap: true,
})

// ── Bundle game code ─────────────────────────────────────
await esbuild.build({
  entryPoints: [
    'games/mission-orbit/main.ts',
    'games/super-word/main.ts',
    'games/chompers/main.ts',
    'games/pixel-passport/main.ts',
    'games/story-trail/main.ts',
    'games/squares/main.ts',
    'games/waterwall/main.ts',
    'games/beat-pad/main.ts',
    'games/train-sounds/main.ts',
    'games/peekaboo/main.ts',
    'games/spot-on/main.ts',
    'games/copycat/main.ts',
    'games/dragons-crunch/main.ts',
    'games/mudskipper/main.ts',
    'games/tuna-piano/main.ts',
    'games/grow-with-me/main.ts',
    'games/baking-simulator/main.ts',
  ],
  bundle: true,
  outbase: 'games',
  outdir: join(outputDir, 'client'),
  format: 'esm',
  target: 'es2022',
  minify: true,
  sourcemap: true,
})

// ── Pre-render HTML from router ──────────────────────────
const router = createAppRouter()

const staticRoutes: Array<{ url: string; outPath: string }> = [
  { url: 'http://localhost/', outPath: 'index.html' },
  { url: 'http://localhost/attributions/', outPath: 'attributions/index.html' },
  { url: 'http://localhost/mission-orbit/', outPath: 'mission-orbit/index.html' },
  { url: 'http://localhost/mission-orbit/info/', outPath: 'mission-orbit/info/index.html' },
  { url: 'http://localhost/super-word/', outPath: 'super-word/index.html' },
  { url: 'http://localhost/super-word/info/', outPath: 'super-word/info/index.html' },
  { url: 'http://localhost/chompers/', outPath: 'chompers/index.html' },
  { url: 'http://localhost/chompers/info/', outPath: 'chompers/info/index.html' },
  { url: 'http://localhost/pixel-passport/', outPath: 'pixel-passport/index.html' },
  { url: 'http://localhost/pixel-passport/info/', outPath: 'pixel-passport/info/index.html' },
  { url: 'http://localhost/story-trail/', outPath: 'story-trail/index.html' },
  { url: 'http://localhost/story-trail/info/', outPath: 'story-trail/info/index.html' },
  { url: 'http://localhost/squares/', outPath: 'squares/index.html' },
  { url: 'http://localhost/squares/info/', outPath: 'squares/info/index.html' },
  { url: 'http://localhost/waterwall/', outPath: 'waterwall/index.html' },
  { url: 'http://localhost/waterwall/info/', outPath: 'waterwall/info/index.html' },
  { url: 'http://localhost/beat-pad/', outPath: 'beat-pad/index.html' },
  { url: 'http://localhost/beat-pad/info/', outPath: 'beat-pad/info/index.html' },
  { url: 'http://localhost/train-sounds/', outPath: 'train-sounds/index.html' },
  { url: 'http://localhost/train-sounds/info/', outPath: 'train-sounds/info/index.html' },
  { url: 'http://localhost/peekaboo/', outPath: 'peekaboo/index.html' },
  { url: 'http://localhost/peekaboo/info/', outPath: 'peekaboo/info/index.html' },
  { url: 'http://localhost/spot-on/', outPath: 'spot-on/index.html' },
  { url: 'http://localhost/spot-on/info/', outPath: 'spot-on/info/index.html' },
  { url: 'http://localhost/copycat/', outPath: 'copycat/index.html' },
  { url: 'http://localhost/copycat/info/', outPath: 'copycat/info/index.html' },
  { url: 'http://localhost/dragons-crunch/', outPath: 'dragons-crunch/index.html' },
  { url: 'http://localhost/dragons-crunch/info/', outPath: 'dragons-crunch/info/index.html' },
  { url: 'http://localhost/mudskipper/', outPath: 'mudskipper/index.html' },
  { url: 'http://localhost/mudskipper/info/', outPath: 'mudskipper/info/index.html' },
  { url: 'http://localhost/tuna-piano/', outPath: 'tuna-piano/index.html' },
  { url: 'http://localhost/tuna-piano/info/', outPath: 'tuna-piano/info/index.html' },
  { url: 'http://localhost/grow-with-me/', outPath: 'grow-with-me/index.html' },
  { url: 'http://localhost/grow-with-me/info/', outPath: 'grow-with-me/info/index.html' },
  { url: 'http://localhost/baking-simulator/', outPath: 'baking-simulator/index.html' },
  { url: 'http://localhost/baking-simulator/info/', outPath: 'baking-simulator/info/index.html' },
  { url: 'http://localhost/404.html', outPath: '404.html' },
]

for (const { url, outPath } of staticRoutes) {
  const response = await router.fetch(new Request(url))
  const html = await response.text()
  const fullPath = join(outputDir, outPath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, html)
  console.log(`  rendered ${outPath}`)
}

// ── Stamp HTML files with git SHA ───────────────────────
for (const htmlFile of readdirSync(outputDir, { recursive: true }) as string[]) {
  if (!htmlFile.endsWith('.html')) continue
  const htmlPath = join(outputDir, htmlFile)
  if (statSync(htmlPath).isDirectory()) continue
  const htmlContent = readFileSync(htmlPath, 'utf-8')
  // Cache-bust CSS and JS: append git SHA as query parameter
  let cacheBusted = htmlContent.replace(
    /href="([^"]*\/styles\/[^"]*\.css)"/g,
    (match, href) => {
      const separator = href.includes('?') ? '&' : '?'
      return `href="${href}${separator}v=${sha}"`
    },
  )
  cacheBusted = cacheBusted.replace(
    /src="([^"]*\.js)"/g,
    (match, src) => {
      const separator = src.includes('?') ? '&' : '?'
      return `src="${src}${separator}v=${sha}"`
    },
  )
  const updated = cacheBusted.replaceAll('__BUILD_SHA__', sha)
  writeFileSync(htmlPath, updated)
}

// ── Performance budget ───────────────────────────────────
const budgetConfig = JSON.parse(readFileSync('config/budget.json', 'utf-8')) as Array<{
  resourceSizes?: Array<{
    resourceType: 'document' | 'stylesheet' | 'script' | 'total'
    budget: number
  }>
}>

const resourceBudgetBytes = new Map(
  (budgetConfig[0]?.resourceSizes ?? []).map(({ resourceType, budget }) => [resourceType, budget * 1024]),
)

const BUDGET_BYTES = resourceBudgetBytes.get('total') ?? 200 * 1024
const strictBudgetEnforcement = process.env.STRICT_BUILD_BUDGETS === '1'
const pages: Record<string, string[]> = {
  homepage: ['index.html', 'styles/main.css', 'client/shell.js', 'client/home.js'],
  attributions: ['attributions/index.html', 'styles/main.css', 'client/shell.js'],
  'mission-orbit': ['mission-orbit/index.html', 'styles/mission-orbit.css', 'client/shell.js', 'client/mission-orbit/main.js'],
  'super-word': ['super-word/index.html', 'styles/game.css', 'client/shell.js', 'client/super-word/main.js'],
  chompers: ['chompers/index.html', 'styles/chompers.css', 'client/shell.js', 'client/chompers/main.js'],
  'pixel-passport': ['pixel-passport/index.html', 'styles/pixel-passport.css', 'client/shell.js', 'client/pixel-passport/main.js'],
  'story-trail': ['story-trail/index.html', 'styles/story-trail.css', 'client/shell.js', 'client/story-trail/main.js'],
  squares: ['squares/index.html', 'styles/squares.css', 'client/shell.js', 'client/squares/main.js'],
  waterwall: ['waterwall/index.html', 'styles/waterwall.css', 'client/shell.js', 'client/waterwall/main.js'],
  'beat-pad': ['beat-pad/index.html', 'styles/beat-pad.css', 'client/shell.js', 'client/beat-pad/main.js'],
  'train-sounds': ['train-sounds/index.html', 'styles/train-sounds.css', 'client/shell.js', 'client/train-sounds/main.js'],
  peekaboo: ['peekaboo/index.html', 'styles/peekaboo.css', 'client/shell.js', 'client/peekaboo/main.js'],
  'spot-on': ['spot-on/index.html', 'styles/spot-on.css', 'client/shell.js', 'client/spot-on/main.js'],
  copycat: ['copycat/index.html', 'styles/copycat.css', 'client/shell.js', 'client/copycat/main.js'],
  'dragons-crunch': ['dragons-crunch/index.html', 'styles/dragons-crunch.css', 'client/shell.js', 'client/dragons-crunch/main.js'],
  mudskipper: ['mudskipper/index.html', 'styles/mudskipper.css', 'client/shell.js', 'client/mudskipper/main.js'],
  'tuna-piano': ['tuna-piano/index.html', 'styles/tuna-piano.css', 'client/shell.js', 'client/tuna-piano/main.js'],
  'grow-with-me': ['grow-with-me/index.html', 'styles/grow-with-me.css', 'client/shell.js', 'client/grow-with-me/main.js'],
  'baking-simulator': ['baking-simulator/index.html', 'styles/baking-simulator.css', 'client/shell.js', 'client/baking-simulator/main.js'],
  '404': ['404.html', 'styles/main.css', 'client/shell.js', 'client/404.js'],
}

function resourceTypeForFile(path: string): 'document' | 'stylesheet' | 'script' | null {
  if (path.endsWith('.html')) return 'document'
  if (path.endsWith('.css')) return 'stylesheet'
  if (path.endsWith('.js')) return 'script'
  return null
}

let budgetWarningCount = 0
for (const [page, files] of Object.entries(pages)) {
  const resourceTotals = {
    document: 0,
    stylesheet: 0,
    script: 0,
    total: 0,
  }

  for (const file of files) {
    const size = statSync(join(outputDir, file)).size
    resourceTotals.total += size

    const resourceType = resourceTypeForFile(file)
    if (resourceType) {
      resourceTotals[resourceType] += size
    }
  }

  const totalBytes = resourceTotals.total
  const totalKB = (totalBytes / 1024).toFixed(1)
  const budgetKB = (BUDGET_BYTES / 1024).toFixed(0)

  for (const [resourceType, budgetBytes] of resourceBudgetBytes.entries()) {
    if (resourceType === 'total') continue

    const actualBytes = resourceTotals[resourceType]
    if (actualBytes <= budgetBytes) continue

    const actualKB = (actualBytes / 1024).toFixed(1)
    const resourceBudgetKB = (budgetBytes / 1024).toFixed(0)
    console.warn(`⚠ ${page}: ${resourceType} ${actualKB}KB exceeds ${resourceBudgetKB}KB budget`)
    budgetWarningCount += 1
  }

  if (totalBytes > BUDGET_BYTES) {
    console.warn(`⚠ ${page}: ${totalKB}KB exceeds ${budgetKB}KB budget`)
    budgetWarningCount += 1
  } else {
    console.log(`✓ ${page}: ${totalKB}KB / ${budgetKB}KB`)
  }
}
if (budgetWarningCount > 0 && strictBudgetEnforcement) {
  process.exit(1)
}

if (budgetWarningCount > 0) {
  console.warn(`\nBudget warnings: ${budgetWarningCount}. Set STRICT_BUILD_BUDGETS=1 to fail the build.`)
}

console.log('\nBuild complete!')
