import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getGameAttribution, renderAttributionsMarkdown, repositoryCodeLicense } from './attributions'

test('super word attribution data is available for deployed UI', () => {
  const attribution = getGameAttribution('super-word')

  assert.equal(attribution.codeLicense, repositoryCodeLicense)
  assert.match(attribution.summary, /reading progression/i)
  assert.equal(attribution.entries[0]?.title, 'Ambient synth soundtrack')
  assert.equal(attribution.entries[1]?.title, 'Word-stage puzzle progression')
})

test('chompers attribution data lists the bundled CC0 audio layers', () => {
  const attribution = getGameAttribution('chompers')

  assert.equal(attribution.codeLicense, repositoryCodeLicense)
  assert.match(attribution.summary, /curated cc0 sample set/i)
  assert.equal(attribution.entries[0]?.title, 'Fruit-chomping synth bed')
  assert.equal(attribution.entries[1]?.title, 'Kalimba (C-note)')
  assert.equal(attribution.entries.at(-1)?.title, 'WATRSplsh_Stick Throw Into Water_Jaku5.wav')
})

test('pixel passport attribution data stays fully in-repo and sample-free', () => {
  const attribution = getGameAttribution('pixel-passport')

  assert.equal(attribution.codeLicense, repositoryCodeLicense)
  assert.match(attribution.summary, /no third-party art, photo, or audio assets/i)
  assert.equal(attribution.entries[0]?.title, 'Pixel Passport globe, destination scenes, Pip sprite, and vehicle sprites')
  assert.equal(attribution.entries[1]?.title, 'Pixel Passport travel tones and clue chimes')
})

test('ATTRIBUTIONS.md stays synced with the attribution source data', () => {
  const markdownOnDisk = readFileSync(new URL('../../ATTRIBUTIONS.md', import.meta.url), 'utf-8')

  assert.equal(markdownOnDisk, renderAttributionsMarkdown())
})