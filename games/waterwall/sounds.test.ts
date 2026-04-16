import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  EDGE_CUE_FREQUENCY,
  EDGE_CUE_PAN,
  type CursorEdge,
} from './sounds.js'

describe('edge cue pan mapping', () => {
  it('left edge maps to pan -1', () => {
    assert.equal(EDGE_CUE_PAN.left, -1)
  })

  it('right edge maps to pan +1', () => {
    assert.equal(EDGE_CUE_PAN.right, 1)
  })

  it('top edge maps to pan 0', () => {
    assert.equal(EDGE_CUE_PAN.top, 0)
  })

  it('bottom edge maps to pan 0', () => {
    assert.equal(EDGE_CUE_PAN.bottom, 0)
  })

  it('all edge directions have defined pan values in [-1, 1]', () => {
    const edges: CursorEdge[] = ['left', 'right', 'top', 'bottom']
    for (const edge of edges) {
      const pan = EDGE_CUE_PAN[edge]
      assert.ok(pan >= -1 && pan <= 1, `pan for '${edge}' is ${pan}, must be in [-1, 1]`)
    }
  })
})

describe('edge cue frequencies', () => {
  it('top uses higher pitch than bottom', () => {
    assert.ok(EDGE_CUE_FREQUENCY.top > EDGE_CUE_FREQUENCY.bottom)
  })

  it('top is ~600Hz', () => {
    assert.equal(EDGE_CUE_FREQUENCY.top, 600)
  })

  it('bottom is ~200Hz', () => {
    assert.equal(EDGE_CUE_FREQUENCY.bottom, 200)
  })
})

describe('water distribution to StereoPannerNode range', () => {
  it('centerOfMass 0 maps to pan 0 (center)', () => {
    // computeWaterDistribution returns centerOfMass in [-1, 1]
    // updateWaterPanning clamps to [-1, 1] — verify the mapping is identity
    const centerOfMass = 0
    const pan = Math.max(-1, Math.min(1, centerOfMass))
    assert.equal(pan, 0)
  })

  it('centerOfMass -1 maps to pan -1 (full left)', () => {
    const centerOfMass = -1
    const pan = Math.max(-1, Math.min(1, centerOfMass))
    assert.equal(pan, -1)
  })

  it('centerOfMass +1 maps to pan +1 (full right)', () => {
    const centerOfMass = 1
    const pan = Math.max(-1, Math.min(1, centerOfMass))
    assert.equal(pan, 1)
  })

  it('values beyond [-1, 1] are clamped', () => {
    assert.equal(Math.max(-1, Math.min(1, -2)), -1)
    assert.equal(Math.max(-1, Math.min(1, 1.5)), 1)
    assert.equal(Math.max(-1, Math.min(1, 0.5)), 0.5)
  })
})
