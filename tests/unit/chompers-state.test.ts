import assert from 'node:assert/strict'
import test from 'node:test'
import { attemptChomp, createInitialState, moveHippo, nudgeHippo, spawnItem, tickState } from '../../client/chompers/state'
import { FRUIT_DEFINITIONS, ZEN_ROUND_ITEMS } from '../../client/chompers/types'

test('initial rush state opens with starter fruit and a centered hippo', () => {
  const state = createInitialState('rush')

  assert.equal(state.mode, 'rush')
  assert.equal(state.phase, 'playing')
  assert.equal(state.items.length, 3)
  assert.ok(state.items.every((item) => item.y <= 10))
  assert.equal(state.hippo.x, 50)
  assert.equal(state.timeRemainingMs, 60_000)
})

test('opening chomp catches the centered apple after it drops into range', () => {
  const opening = tickState({
    ...createInitialState('rush'),
    spawnTimerMs: 99_999,
  }, 2_500)
  const result = attemptChomp(opening.state)

  assert.equal(result.hitItem?.kind, 'apple')
  assert.equal(result.scoreDelta, 2)
  assert.equal(result.state.score, 2)
  assert.equal(result.state.itemsChomped, 1)
  assert.equal(result.state.combo, 1)
  assert.equal(result.state.items.length, 2)
})

test('landscape hit testing matches the visible chomp lane instead of a fixed arena percent', () => {
  const state = createInitialState('rush')

  const wideMiss = attemptChomp({
    ...state,
    items: [{
      id: 100,
      kind: 'apple',
      x: 59,
      y: 60,
      speed: 12,
      rotation: 0,
      rotationSpeed: 0,
    }],
  }, { width: 932, height: 430 })

  assert.equal(wideMiss.hitItem, null)

  const centeredHit = attemptChomp({
    ...state,
    items: [{
      id: 101,
      kind: 'apple',
      x: 53,
      y: 60,
      speed: 12,
      rotation: 0,
      rotationSpeed: 0,
    }],
  }, { width: 932, height: 430 })

  assert.equal(centeredHit.hitItem?.id, 101)
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

test('rush difficulty ramps more gently and no longer multiplies fall speed twice', () => {
  const state = createInitialState('rush')
  const result = tickState({
    ...state,
    elapsedMs: 79_900,
    spawnTimerMs: 99_999,
    items: [{
      id: 40,
      kind: 'apple',
      x: 50,
      y: 10,
      speed: 20,
      rotation: 0,
      rotationSpeed: 0,
    }],
  }, 100)

  assert.equal(result.state.difficultyLevel, 3)
  assert.equal(result.state.items[0]?.y, 12)
})

test('spawned fruit avoids a nearby rotten path when a conflict would feel unfair', () => {
  const state = {
    ...createInitialState('rush'),
    items: [{
      id: 99,
      kind: 'rotten' as const,
      x: 50,
      y: 20,
      speed: 18,
      rotation: 0,
      rotationSpeed: 0,
    }],
    spawnTimerMs: 0,
  }

  let probe = state

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const spawned = spawnItem(probe)
    const item = spawned.items[spawned.items.length - 1]

    if (!item) {
      assert.fail('Expected spawnItem to add a falling item')
    }

    if (!FRUIT_DEFINITIONS[item.kind].hazard) {
      assert.ok(Math.abs(item.x - 50) >= 14)
      return
    }

    probe = {
      ...spawned,
      items: state.items,
      spawnTimerMs: 0,
    }
  }

  assert.fail('Expected a collectible spawn while probing overlap avoidance')
})

test('zen mode keeps a flat difficulty and ends after the final fruit resolves', () => {
  const zenState = createInitialState('zen')
  const calmTick = tickState({
    ...zenState,
    items: [],
    spawnTimerMs: 99_999,
  }, 120_000)

  assert.equal(calmTick.state.phase, 'playing')
  assert.equal(calmTick.state.difficultyLevel, 1)
  assert.equal(calmTick.state.timeRemainingMs, 0)

  const completionTick = tickState({
    ...zenState,
    nextItemId: ZEN_ROUND_ITEMS + 1,
    itemsMissed: ZEN_ROUND_ITEMS - 1,
    items: [{
      id: 200,
      kind: 'apple',
      x: 50,
      y: 107,
      speed: 16,
      rotation: 0,
      rotationSpeed: 0,
    }],
    spawnTimerMs: 99_999,
  }, 16)

  assert.equal(completionTick.state.phase, 'gameover')
})