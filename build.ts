import * as esbuild from 'esbuild'
import { cpSync, readFileSync, rmSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createAppRouter } from './app/router.js'

const outputDir = process.env.BUILD_OUTPUT_DIR || 'dist'

// ── Clean output ──────────────────────────────────────────
rmSync(outputDir, { recursive: true, force: true })

// ── Copy static assets ───────────────────────────────────
cpSync('public', outputDir, { recursive: true })
mkdirSync(join(outputDir, 'client', 'super-word'), { recursive: true })

// ── Bundle client code ───────────────────────────────────
await esbuild.build({
  entryPoints: [
    'client/shell.ts',
    'client/404.ts',
    'client/super-word/main.ts',
  ],
  bundle: true,
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
  { url: 'http://localhost/super-word/', outPath: 'super-word/index.html' },
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

// ── Performance budget ───────────────────────────────────
const budgetConfig = JSON.parse(readFileSync('budget.json', 'utf-8')) as Array<{
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
  homepage: ['index.html', 'styles/main.css', 'client/shell.js'],
  attributions: ['attributions/index.html', 'styles/main.css', 'client/shell.js'],
  'super-word': ['super-word/index.html', 'styles/game.css', 'client/shell.js', 'client/super-word/main.js'],
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
