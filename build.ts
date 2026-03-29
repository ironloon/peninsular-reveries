import * as esbuild from 'esbuild'
import { cpSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Clean output
rmSync('dist', { recursive: true, force: true })

// Copy static assets verbatim
cpSync('public', 'dist', { recursive: true })

// Bundle TypeScript entry points
await esbuild.build({
  entryPoints: ['src/shared/shell.ts', 'src/pages/home.ts', 'src/super-word/main.ts', 'src/pages/404.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'es2022',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
})

// Performance budget: 200KB per page (HTML + CSS + JS, excluding sourcemaps)
const BUDGET_BYTES = 200 * 1024
const pages: Record<string, string[]> = {
  homepage: ['index.html', 'styles/main.css', 'shared/shell.js', 'pages/home.js'],
  'super-word': ['super-word/index.html', 'styles/main.css', 'super-word/game.css', 'shared/shell.js', 'super-word/main.js'],
  '404': ['404.html', 'styles/main.css', 'shared/shell.js', 'pages/404.js'],
}

let budgetFailed = false
for (const [page, files] of Object.entries(pages)) {
  const totalBytes = files.reduce((sum, f) => sum + statSync(join('dist', f)).size, 0)
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
