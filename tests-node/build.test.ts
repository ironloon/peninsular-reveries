import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
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
      'super-word/index.html',
      '404.html',
      'styles/main.css',
      'client/shell.js',
      'client/super-word/main.js',
      'client/404.js',
      'favicon.svg',
      'manifest.json',
      'sw.js',
    ]) {
      assert.ok(existsSync(join(outputDir, relativePath)), `Expected ${relativePath} to exist in build output`)
    }
  } finally {
    rmSync(outputDir, { recursive: true, force: true })
  }
})