import assert from 'node:assert/strict'
import test from 'node:test'
import { DISTRACTOR_ART } from './scene-art'
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