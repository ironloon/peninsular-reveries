import * as esbuild from 'esbuild'
import { cpSync, rmSync, mkdirSync, writeFileSync, statSync } from 'node:fs'
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
const BUDGET_BYTES = 200 * 1024
const pages: Record<string, string[]> = {
  homepage: ['index.html', 'styles/main.css', 'client/shell.js'],
  'super-word': ['super-word/index.html', 'styles/main.css', 'styles/game.css', 'client/shell.js', 'client/super-word/main.js'],
  '404': ['404.html', 'styles/main.css', 'client/shell.js', 'client/404.js'],
}

let budgetFailed = false
for (const [page, files] of Object.entries(pages)) {
  const totalBytes = files.reduce((sum, f) => sum + statSync(join(outputDir, f)).size, 0)
  const totalKB = (totalBytes / 1024).toFixed(1)
  const budgetKB = (BUDGET_BYTES / 1024).toFixed(0)
  if (totalBytes > BUDGET_BYTES) {
    console.error(`❌ ${page}: ${totalKB}KB exceeds ${budgetKB}KB budget`)
    budgetFailed = true
  } else {
    console.log(`✓ ${page}: ${totalKB}KB / ${budgetKB}KB`)
  }
}
if (budgetFailed) {
  process.exit(1)
}

console.log('\nBuild complete!')
