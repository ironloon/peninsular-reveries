import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  getBundledMissionOrbitSamples,
  getDiyMissionOrbitSamples,
  getDownloadableMissionOrbitSamples,
  missionOrbitSampleManifest,
} from './sample-manifest.js'

test('mission orbit sample manifest is empty (pure synth sounds)', () => {
  const bundled = getBundledMissionOrbitSamples()
  const downloadable = getDownloadableMissionOrbitSamples()
  const diy = getDiyMissionOrbitSamples()

  assert.equal(bundled.length, 0)
  assert.equal(downloadable.length, 0)
  assert.equal(diy.length, 0)
})

test('mission orbit bundled samples exist on disk', () => {
  for (const sample of Object.values(missionOrbitSampleManifest)) {
    const filePath = fileURLToPath(new URL(`../../public${sample.url}`, import.meta.url))
    assert.equal(existsSync(filePath), sample.bundled)
  }
})