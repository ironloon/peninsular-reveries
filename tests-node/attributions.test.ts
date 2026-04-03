import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getGameAttribution, renderAttributionsMarkdown, repositoryCodeLicense } from '../app/data/attributions'

test('super word attribution data is available for deployed UI', () => {
  const attribution = getGameAttribution('super-word')

  assert.equal(attribution.codeLicense, repositoryCodeLicense)
  assert.match(attribution.summary, /deployed game shows credits/i)
  assert.equal(attribution.entries[0]?.title, 'Ambient synth soundtrack')
})

test('ATTRIBUTIONS.md stays synced with the attribution source data', () => {
  const markdownOnDisk = readFileSync(new URL('../ATTRIBUTIONS.md', import.meta.url), 'utf-8')

  assert.equal(markdownOnDisk, renderAttributionsMarkdown())
})