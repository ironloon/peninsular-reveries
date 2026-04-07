import assert from 'node:assert/strict'
import test from 'node:test'
import { BASE_LAYOUTS, DISTRACTOR_ART, LETTER_ART, SIZE_CATEGORY_FRACTION } from './scene-art'
import { positionItemY } from './scene-builder'

test('distractor art keeps a noticeably wider size spread for large ground objects', () => {
  const castle = DISTRACTOR_ART.find((item) => item.label === 'Castle')
  const mountain = DISTRACTOR_ART.find((item) => item.label === 'Mountain')
  const butterfly = DISTRACTOR_ART.find((item) => item.label === 'Butterfly')
  const snowflake = DISTRACTOR_ART.find((item) => item.label === 'Snowflake')

  assert.ok(castle)
  assert.ok(mountain)
  assert.ok(butterfly)
  assert.ok(snowflake)
  assert.ok((castle.scale ?? 1) >= 2.0)
  assert.ok((mountain.scale ?? 1) >= 1.3)
  assert.ok((butterfly.scale ?? 1) <= 0.75)
  assert.ok((snowflake.scale ?? 1) <= 0.7)
})

test('larger ground objects sit lower when they share the same layout slot', () => {
  const smallGroundY = positionItemY(60, { zone: 'ground', scale: 0.82 })
  const largeGroundY = positionItemY(60, { zone: 'ground', scale: 1.38 })
  const extraGroundedY = positionItemY(60, { zone: 'ground', scale: 1.38, yOffset: 1.5 })

  assert.ok(largeGroundY > smallGroundY)
  assert.ok(extraGroundedY > largeGroundY)
  assert.ok(extraGroundedY <= 76)
})

test('SIZE_CATEGORY_FRACTION huge value is >= 4x tiny value', () => {
  assert.ok(SIZE_CATEGORY_FRACTION.huge >= SIZE_CATEGORY_FRACTION.tiny * 4)
})

test('SIZE_CATEGORY_FRACTION: all categories present and values in 0-1 range', () => {
  const categories = ['tiny', 'small', 'medium', 'large', 'huge'] as const
  for (const cat of categories) {
    assert.ok(SIZE_CATEGORY_FRACTION[cat] > 0, `${cat} fraction must be > 0`)
    assert.ok(SIZE_CATEGORY_FRACTION[cat] <= 1, `${cat} fraction must be <= 1`)
  }
})

test('BASE_LAYOUTS covers entries for 8 through 12', () => {
  for (let count = 8; count <= 12; count++) {
    const layout = BASE_LAYOUTS[count]
    assert.ok(layout, `BASE_LAYOUTS missing entry for ${count}`)
    assert.strictEqual(layout.length, count)
  }
})

test('LETTER_ART entries all have sizeCategory medium', () => {
  for (const [letter, options] of Object.entries(LETTER_ART)) {
    if (!options) continue
    for (const art of options) {
      assert.strictEqual(art.sizeCategory, 'medium', `${letter}: expected sizeCategory 'medium', got '${art.sizeCategory}'`)
    }
  }
})

test('DISTRACTOR_ART entries all have sizeCategory defined', () => {
  for (const art of DISTRACTOR_ART) {
    assert.ok(art.sizeCategory != null, `${art.label} is missing sizeCategory`)
  }
})

test('DISTRACTOR_ART entries all have anchor defined', () => {
  for (const art of DISTRACTOR_ART) {
    assert.ok(art.anchor != null, `${art.label} is missing anchor`)
  }
})