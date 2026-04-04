import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

test('build script writes the expected static output', () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'peninsular-reveries-build-'))

  try {
    const result = execSync('npx tsx build.ts', {
      encoding: 'utf-8',
      env: {
        ...process.env,
        BUILD_OUTPUT_DIR: outputDir,
        NODE_ENV: 'production',
        SITE_BASE_PATH: '',
        SITE_ORIGIN: 'http://127.0.0.1:4173',
      },
    })

    assert.match(result, /Build complete!/) 

    for (const relativePath of [
      'index.html',
      'attributions/index.html',
      'super-word/index.html',
      '404.html',
      'styles/main.css',
      'client/shell.js',
      'client/home.js',
      'client/super-word/main.js',
      'client/404.js',
      'favicon.svg',
      'favicon-game-super-word.svg',
      'manifest.json',
      'super-word/manifest.json',
      'sw.js',
      'super-word/sw.js',
    ]) {
      assert.ok(existsSync(join(outputDir, relativePath)), `Expected ${relativePath} to exist in build output`)
    }

    const homeHtml = readFileSync(join(outputDir, 'index.html'), 'utf-8')
    const attributionsHtml = readFileSync(join(outputDir, 'attributions/index.html'), 'utf-8')
    const gameHtml = readFileSync(join(outputDir, 'super-word/index.html'), 'utf-8')

    assert.match(homeHtml, /href="\/manifest\.json"/)
    assert.match(attributionsHtml, /Attributions/)
    assert.match(gameHtml, /href="\/super-word\/manifest\.json"/)
    assert.match(gameHtml, /href="\/favicon-game-super-word\.svg"/)
    assert.doesNotMatch(gameHtml, /href="\/styles\/main\.css"/)
    assert.match(gameHtml, /data-service-worker-path="\/super-word\/sw\.js"/)
  } finally {
    rmSync(outputDir, { recursive: true, force: true })
  }
})