import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  getBundledMissionOrbitSamples,
  getDiyMissionOrbitSamples,
  getDownloadableMissionOrbitSamples,
  missionOrbitSampleManifest,
} from '../../client/mission-orbit/sample-manifest.js'

test('mission orbit sample manifest keeps expected CC0 and DIY split', () => {
  const bundled = getBundledMissionOrbitSamples()
  const downloadable = getDownloadableMissionOrbitSamples()
  const diy = getDiyMissionOrbitSamples()

  assert.equal(bundled.length, 14)
  assert.equal(downloadable.length, 14)
  assert.equal(diy.length, 0)

  for (const sample of downloadable) {
    assert.equal(sample.source.provider, 'freesound')
    assert.equal(sample.source.license, 'Creative Commons 0')
    assert.match(sample.url, /^\/mission-orbit\/audio\/.+\.ogg$/u)
    assert.match(sample.id, /-(light|heavy)$/u)
  }

  assert.deepEqual(diy, [])
})

test('mission orbit bundled samples exist on disk', () => {
  for (const sample of Object.values(missionOrbitSampleManifest)) {
    const filePath = fileURLToPath(new URL(`../../public${sample.url}`, import.meta.url))
    assert.equal(existsSync(filePath), sample.bundled)
  }
})