import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getSiteBasePath, getSiteUrl } from './site-config'
import { normalizeBasePath, resolveSiteUrl, withBasePath } from './site-paths'

test('site path helpers produce GitHub Pages-safe URLs', () => {
  assert.equal(normalizeBasePath('/peninsular-reveries/'), '/peninsular-reveries')
  assert.equal(withBasePath('/', '/peninsular-reveries'), '/peninsular-reveries/')
  assert.equal(withBasePath('/styles/main.css', '/peninsular-reveries'), '/peninsular-reveries/styles/main.css')
  assert.equal(resolveSiteUrl('https://jwgeller.github.io/peninsular-reveries', '/og-image.png'), 'https://jwgeller.github.io/peninsular-reveries/og-image.png')
})

test('site config reads environment overrides correctly', () => {
  const previousBasePath = process.env.SITE_BASE_PATH
  const previousSiteOrigin = process.env.SITE_ORIGIN

  process.env.SITE_BASE_PATH = '/peninsular-reveries'
  process.env.SITE_ORIGIN = 'https://jwgeller.github.io'

  try {
    assert.equal(getSiteBasePath(), '/peninsular-reveries')
    assert.equal(getSiteUrl(), 'https://jwgeller.github.io/peninsular-reveries')
  } finally {
    if (previousBasePath === undefined) {
      delete process.env.SITE_BASE_PATH
    } else {
      process.env.SITE_BASE_PATH = previousBasePath
    }

    if (previousSiteOrigin === undefined) {
      delete process.env.SITE_ORIGIN
    } else {
      process.env.SITE_ORIGIN = previousSiteOrigin
    }
  }
})

test('game registry and manifests stay aligned with project-site deployment', () => {
  const gameRegistry = readFileSync('app/data/game-registry.ts', 'utf-8')
  const superWordManifest = readFileSync('public/super-word/manifest.json', 'utf-8')
  const missionOrbitManifest = readFileSync('public/mission-orbit/manifest.json', 'utf-8')
  const pixelPassportManifest = readFileSync('public/pixel-passport/manifest.json', 'utf-8')

  assert.match(gameRegistry, /Mission: Orbit/)
  assert.match(gameRegistry, /Chompers/)
  assert.match(gameRegistry, /Pixel Passport/)
  assert.match(superWordManifest, /"start_url": "\.\/"/)
  assert.match(superWordManifest, /"scope": "\.\/"/)
  assert.match(missionOrbitManifest, /"start_url": "\.\/"/)
  assert.match(missionOrbitManifest, /"scope": "\.\/"/)
  assert.match(pixelPassportManifest, /"start_url": "\.\/"/)
  assert.match(pixelPassportManifest, /"scope": "\.\/"/)
})