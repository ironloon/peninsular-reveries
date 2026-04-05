import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSceneArt } from './art'

test('scene overlays add accents without changing art bounds', () => {
  const art = buildSceneArt(
    ['transparent', '#aaccee', '#ffee99'],
    [
      '0000',
      '0110',
      '0000',
    ],
    [
      { x: 0, y: 0, rows: ['.2..', '22..'] },
    ],
  )

  assert.equal(art.width, 4)
  assert.equal(art.height, 3)
  assert.deepEqual(art.pixels, [
    0, 2, 0, 0,
    2, 2, 1, 0,
    0, 0, 0, 0,
  ])
})