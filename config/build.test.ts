import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const buildScript = readFileSync('build.ts', 'utf-8')

test('build budget tracking includes Story Trail and Squares', () => {
  assert.match(
    buildScript,
    /'story-trail': \[\s*'story-trail\/index\.html',\s*'styles\/story-trail\.css',\s*'client\/shell\.js',\s*'client\/story-trail\/main\.js',?\s*\]/s,
  )
  assert.match(
    buildScript,
    /squares: \[\s*'squares\/index\.html',\s*'styles\/squares\.css',\s*'client\/shell\.js',\s*'client\/squares\/main\.js',?\s*\]/s,
  )
})

test('build script writes the expected static output', () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'peninsular-reveries-build-'))

  try {
    const result = execSync('pnpm build', {
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
      'pixel-passport/index.html',
      'mission-orbit/index.html',
      'chompers/index.html',
      'story-trail/index.html',
      'story-trail/info/index.html',
      'squares/index.html',
      'squares/info/index.html',
      '404.html',
      'styles/main.css',
      'styles/pixel-passport.css',
      'styles/mission-orbit.css',
      'styles/chompers.css',
      'styles/story-trail.css',
      'styles/squares.css',
      'client/shell.js',
      'client/home.js',
      'client/super-word/main.js',
      'client/pixel-passport/main.js',
      'client/mission-orbit/main.js',
      'client/chompers/main.js',
      'client/story-trail/main.js',
      'client/squares/main.js',
      'client/404.js',
      'favicon.svg',
      'favicon-game-super-word.svg',
      'favicon-game-squares.svg',
      'favicon-game-story-trail.svg',
      'manifest.json',
      'super-word/manifest.json',
      'pixel-passport/manifest.json',
      'mission-orbit/manifest.json',
      'chompers/manifest.json',
      'story-trail/manifest.json',
      'squares/manifest.json',
      'sw.js',
      'super-word/sw.js',
      'pixel-passport/sw.js',
      'mission-orbit/sw.js',
      'chompers/sw.js',
      'story-trail/sw.js',
      'squares/sw.js',
    ]) {
      assert.ok(existsSync(join(outputDir, relativePath)), `Expected ${relativePath} to exist in build output`)
    }

    const homeHtml = readFileSync(join(outputDir, 'index.html'), 'utf-8')
    const attributionsHtml = readFileSync(join(outputDir, 'attributions/index.html'), 'utf-8')
    const gameHtml = readFileSync(join(outputDir, 'super-word/index.html'), 'utf-8')
    const passportHtml = readFileSync(join(outputDir, 'pixel-passport/index.html'), 'utf-8')
    const missionOrbitHtml = readFileSync(join(outputDir, 'mission-orbit/index.html'), 'utf-8')
    const chompersHtml = readFileSync(join(outputDir, 'chompers/index.html'), 'utf-8')
    const storyTrailHtml = readFileSync(join(outputDir, 'story-trail/index.html'), 'utf-8')
    const squaresHtml = readFileSync(join(outputDir, 'squares/index.html'), 'utf-8')
    const squaresInfoHtml = readFileSync(join(outputDir, 'squares/info/index.html'), 'utf-8')
    const squaresServiceWorker = readFileSync(join(outputDir, 'squares/sw.js'), 'utf-8')
    const siteServiceWorker = readFileSync(join(outputDir, 'sw.js'), 'utf-8')

    assert.match(homeHtml, /href="\/manifest\.json"/)
    assert.match(attributionsHtml, /Attributions/)
    assert.match(gameHtml, /href="\/super-word\/manifest\.json"/)
    assert.match(gameHtml, /href="\/favicon-game-super-word\.svg"/)
    assert.doesNotMatch(gameHtml, /href="\/styles\/main\.css"/)
    assert.doesNotMatch(gameHtml, /data-service-worker-path=/)
    assert.match(passportHtml, /href="\/pixel-passport\/manifest\.json"/)
    assert.doesNotMatch(passportHtml, /href="\/styles\/main\.css"/)
    assert.doesNotMatch(passportHtml, /data-service-worker-path=/)
    assert.match(missionOrbitHtml, /href="\/mission-orbit\/manifest\.json"/)
    assert.doesNotMatch(missionOrbitHtml, /href="\/styles\/main\.css"/)
    assert.doesNotMatch(missionOrbitHtml, /data-service-worker-path=/)
    assert.match(chompersHtml, /href="\/chompers\/manifest\.json"/)
    assert.doesNotMatch(chompersHtml, /href="\/styles\/main\.css"/)
    assert.doesNotMatch(chompersHtml, /data-service-worker-path=/)
    assert.match(storyTrailHtml, /href="\/story-trail\/manifest\.json"/)
    assert.match(storyTrailHtml, /href="\/favicon-game-story-trail\.svg"/)
    assert.doesNotMatch(storyTrailHtml, /href="\/styles\/main\.css"/)
    assert.doesNotMatch(storyTrailHtml, /data-service-worker-path=/)
    assert.match(squaresHtml, /href="\/squares\/manifest\.json"/)
    assert.match(squaresHtml, /href="\/favicon-game-squares\.svg"/)
    assert.doesNotMatch(squaresHtml, /href="\/styles\/main\.css"/)
    assert.match(squaresHtml, /data-service-worker-path="\/squares\/sw\.js"/)
    assert.match(squaresHtml, /data-service-worker-scope="\/squares\/"/)
    assert.match(squaresInfoHtml, /Squares/)
    assert.match(squaresServiceWorker, /self\.registration\.unregister\(\)/)
    assert.match(squaresServiceWorker, /key\.startsWith\('squares'\)/)
    assert.match(siteServiceWorker, /favicon-game-story-trail\.svg/)
    assert.match(siteServiceWorker, /story-trail\//)
    assert.match(siteServiceWorker, /story-trail\/info\//)
    assert.match(siteServiceWorker, /styles\/story-trail\.css/)
    assert.match(siteServiceWorker, /client\/story-trail\/main\.js/)
    assert.match(siteServiceWorker, /story-trail\/manifest\.json/)
  } finally {
    rmSync(outputDir, { recursive: true, force: true })
  }
})