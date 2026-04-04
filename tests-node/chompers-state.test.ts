import assert from 'node:assert/strict'
import test from 'node:test'
import { attemptChomp, createInitialState, moveHippo, nudgeHippo, spawnItem, tickState } from '../client/chompers/state'

test('initial rush state opens with starter fruit and a centered hippo', () => {
  const state = createInitialState('rush')

  assert.equal(state.mode, 'rush')
  assert.equal(state.phase, 'playing')
  assert.equal(state.items.length, 3)
  assert.equal(state.hippo.x, 50)
  assert.equal(state.timeRemainingMs, 60_000)
})

test('opening chomp catches the centered apple and starts a combo', () => {
  const state = createInitialState('rush')
  const result = attemptChomp(state)

  assert.equal(result.hitItem?.kind, 'apple')
  assert.equal(result.scoreDelta, 2)
  assert.equal(result.state.score, 2)
  assert.equal(result.state.itemsChomped, 1)
  assert.equal(result.state.combo, 1)
  assert.equal(result.state.items.length, 2)
})

test('survival misses cost lives and bombs cost a life on chomp', () => {
  const survivalState = createInitialState('survival')
  const missed = tickState({
    ...survivalState,
    items: [{
      id: 99,
      kind: 'orange',
      x: 50,
      y: 107,
      speed: 18,
      rotation: 0,
      rotationSpeed: 0,
    }],
  }, 16)

  assert.equal(missed.state.lives, 2)
  assert.equal(missed.state.itemsMissed, 1)

  const bombState = createInitialState('survival')
  const bombHit = attemptChomp({
    ...bombState,
    items: [{
      id: 77,
      kind: 'bomb',
      x: 50,
      y: 72,
      speed: 12,
      rotation: 0,
      rotationSpeed: 0,
    }],
  })

  assert.equal(bombHit.hitItem?.kind, 'bomb')
  assert.equal(bombHit.lifeDelta, -1)
  assert.equal(bombHit.state.lives, 2)
  assert.equal(bombHit.state.combo, 0)
})

test('movement clamps to the arena and spawning adds a new falling item', () => {
  const state = createInitialState('rush')
  const moved = moveHippo(state, 120)
  assert.equal(moved.hippo.x, 90)

  const nudged = nudgeHippo(moved, -100)
  assert.equal(nudged.hippo.x, 10)

  const spawned = spawnItem(state)
  assert.equal(spawned.items.length, state.items.length + 1)
  assert.equal(spawned.nextItemId, state.nextItemId + 1)
})