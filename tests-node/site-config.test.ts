import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getSiteBasePath, getSiteUrl } from '../app/site-config'
import { normalizeBasePath, resolveSiteUrl, withBasePath } from '../app/site-paths'

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

test('planning notes and manifest stay aligned with project-site deployment', () => {
  const planningDoc = readFileSync('docs/game-ideas.md', 'utf-8')
  const gameRegistry = readFileSync('app/data/game-registry.ts', 'utf-8')
  const manifest = readFileSync('public/manifest.json', 'utf-8')

  assert.match(planningDoc, /Mission: Orbit/)
  assert.doesNotMatch(gameRegistry, /Mission: Orbit/)
  assert.match(manifest, /"start_url": "\.\/"/)
  assert.match(manifest, /"scope": "\.\/"/)
})