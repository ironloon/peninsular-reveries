import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createInitialState,
  startStory,
  makeChoice,
  collectItem,
  toggleEquippedItem,
  completeStory,
  getScene,
  getItem,
} from './state.js'
import type { Choice, Story } from './types.js'

const testStory: Story = {
  id: 'test',
  title: 'Test Story',
  icon: '🌿',
  theme: 'nature',
  description: 'A test story.',
  startSceneId: 'start',
  scenes: [
    {
      id: 'start',
      description: 'The sky looks cloudy. What do you do?',
      choices: [
        { text: 'Grab an umbrella', targetSceneId: 'park', grantsItemId: 'umbrella' },
        { text: 'Head out anyway', targetSceneId: 'rain', requiredItemId: 'umbrella', hint: 'You might need an umbrella.' },
      ],
    },
    {
      id: 'park',
      description: 'You arrive at the park safely.',
      choices: [],
      isEnd: true,
    },
    {
      id: 'rain',
      description: 'It starts to rain heavily.',
      choices: [],
      isEnd: true,
    },
  ],
  items: [
    { id: 'umbrella', name: 'Umbrella', description: 'Keeps you dry in the rain.' },
    { id: 'watering-can', name: 'Watering Can', description: 'Used to water plants.' },
  ],
  badgeEmoji: '🌈',
  badgeName: 'Test Badge',
}

describe('createInitialState', () => {
  it('returns null scene with empty arrays', () => {
    const state = createInitialState()
    assert.equal(state.currentSceneId, null)
    assert.deepEqual(state.inventory, [])
    assert.equal(state.equippedItemId, null)
    assert.equal(state.lastHint, null)
    assert.equal(state.lastCollectedItem, null)
  })
})

describe('startStory', () => {
  it('sets sceneId, clears inventory, equipped item, and hints', () => {
    const initial = {
      ...createInitialState(),
      inventory: ['umbrella'] as readonly string[],
      equippedItemId: 'umbrella',
      lastHint: 'some hint',
      lastCollectedItem: 'umbrella',
    }
    const state = startStory(initial, 'start')
    assert.equal(state.currentSceneId, 'start')
    assert.deepEqual(state.inventory, [])
    assert.equal(state.equippedItemId, null)
    assert.equal(state.lastHint, null)
    assert.equal(state.lastCollectedItem, null)
  })
})

describe('makeChoice', () => {
  it('sets lastHint when required item is missing', () => {
    const state = createInitialState()
    const choice: Choice = {
      text: 'Cross the bridge',
      targetSceneId: 'other-side',
      requiredItemId: 'umbrella',
      hint: 'You need an umbrella.',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.lastHint, 'You need an umbrella.')
    assert.equal(next.currentSceneId, null)
  })

  it('uses default hint when hint field is absent', () => {
    const state = createInitialState()
    const choice: Choice = {
      text: 'Cross the bridge',
      targetSceneId: 'other-side',
      requiredItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.lastHint, 'You need something for that.')
  })

  it('requires the matching item to be equipped, not just owned', () => {
    const state = {
      ...createInitialState(),
      currentSceneId: 'rainy-path',
      inventory: ['umbrella'] as readonly string[],
    }
    const choice: Choice = {
      text: 'Head out',
      targetSceneId: 'rain',
      requiredItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.currentSceneId, 'rainy-path')
    assert.equal(next.lastHint, 'Pick it in your bag first.')
    assert.deepEqual(next.inventory, ['umbrella'])
  })

  it('moves to target scene when the required item is equipped', () => {
    const state = {
      ...createInitialState(),
      currentSceneId: 'rainy-path',
      inventory: ['umbrella'] as readonly string[],
      equippedItemId: 'umbrella',
    }
    const choice: Choice = {
      text: 'Head out',
      targetSceneId: 'rain',
      requiredItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.currentSceneId, 'rain')
    assert.equal(next.lastHint, null)
  })

  it('adds grantsItemId to inventory without auto-equipping', () => {
    const state = createInitialState()
    const choice: Choice = {
      text: 'Grab an umbrella',
      targetSceneId: 'park',
      grantsItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.currentSceneId, 'park')
    assert.ok(next.inventory.includes('umbrella'))
    assert.equal(next.equippedItemId, null, 'should not auto-equip')
    assert.equal(next.lastCollectedItem, 'umbrella')
  })

  it('keeps required items in inventory after they are used', () => {
    const state = {
      ...createInitialState(),
      currentSceneId: 'rainy-path',
      inventory: ['umbrella', 'watering-can'] as readonly string[],
      equippedItemId: 'umbrella',
    }
    const choice: Choice = {
      text: 'Head out',
      targetSceneId: 'rain',
      requiredItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.deepEqual(next.inventory, ['umbrella', 'watering-can'])
    assert.equal(next.equippedItemId, 'umbrella')
  })

  it('does not duplicate item already in inventory from grantsItemId', () => {
    const state = { ...createInitialState(), inventory: ['umbrella'] as readonly string[] }
    const choice: Choice = {
      text: 'Grab an umbrella',
      targetSceneId: 'park',
      grantsItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.inventory.filter(id => id === 'umbrella').length, 1)
  })

  it('does not mutate original state', () => {
    const state = createInitialState()
    const choice: Choice = { text: 'Go', targetSceneId: 'park', grantsItemId: 'umbrella' }
    const next = makeChoice(state, choice)
    assert.notEqual(next, state)
    assert.deepEqual(state.inventory, [])
  })

  it('preserves existing equippedItemId when granting a new item', () => {
    const state = {
      ...createInitialState(),
      inventory: ['watering-can'] as readonly string[],
      equippedItemId: 'watering-can',
    }
    const choice: Choice = {
      text: 'Grab an umbrella',
      targetSceneId: 'park',
      grantsItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.equippedItemId, 'watering-can', 'should keep previously equipped item')
    assert.ok(next.inventory.includes('umbrella'))
    assert.ok(next.inventory.includes('watering-can'))
  })
})

describe('toggleEquippedItem', () => {
  it('selects an owned item and clears the last hint', () => {
    const state = {
      ...createInitialState(),
      inventory: ['umbrella'] as readonly string[],
      lastHint: 'Pick it in your bag first.',
    }

    const next = toggleEquippedItem(state, 'umbrella')

    assert.equal(next.equippedItemId, 'umbrella')
    assert.equal(next.lastHint, null)
  })

  it('clears the equipped item when the same item is toggled again', () => {
    const state = {
      ...createInitialState(),
      inventory: ['umbrella'] as readonly string[],
      equippedItemId: 'umbrella',
    }

    const next = toggleEquippedItem(state, 'umbrella')

    assert.equal(next.equippedItemId, null)
  })
})

describe('collectItem', () => {
  it('adds item to inventory and sets lastCollectedItem', () => {
    const state = createInitialState()
    const next = collectItem(state, 'umbrella')
    assert.ok(next.inventory.includes('umbrella'))
    assert.equal(next.lastCollectedItem, 'umbrella')
  })

  it('is idempotent for duplicate collects', () => {
    const state = collectItem(createInitialState(), 'umbrella')
    const next = collectItem(state, 'umbrella')
    assert.equal(next, state)
    assert.equal(next.inventory.length, 1)
  })
})

describe('completeStory', () => {
  it('clears all state to initial values', () => {
    const state = {
      ...createInitialState(),
      currentSceneId: 'park',
      inventory: ['umbrella'] as readonly string[],
      equippedItemId: 'umbrella',
    }
    const next = completeStory(state)
    assert.equal(next.currentSceneId, null)
    assert.deepEqual(next.inventory, [])
    assert.equal(next.equippedItemId, null)
    assert.equal(next.lastHint, null)
    assert.equal(next.lastCollectedItem, null)
  })
})

describe('getScene', () => {
  it('returns the correct scene by id', () => {
    const scene = getScene(testStory, 'park')
    assert.ok(scene)
    assert.equal(scene.id, 'park')
  })

  it('returns undefined for unknown sceneId', () => {
    const scene = getScene(testStory, 'nowhere')
    assert.equal(scene, undefined)
  })
})

describe('getItem', () => {
  it('returns the correct item by id', () => {
    const item = getItem(testStory, 'umbrella')
    assert.ok(item)
    assert.equal(item.id, 'umbrella')
    assert.equal(item.name, 'Umbrella')
  })

  it('returns undefined for unknown itemId', () => {
    const item = getItem(testStory, 'magic-wand')
    assert.equal(item, undefined)
  })
})

describe('branching', () => {
  it('different choices from the same scene lead to different destinations', () => {
    const state = startStory(createInitialState(), 'start')
    const goLeft: Choice = { text: 'Go left', targetSceneId: 'park' }
    const goRight: Choice = { text: 'Go right', targetSceneId: 'rain' }
    const afterLeft = makeChoice(state, goLeft)
    const afterRight = makeChoice(state, goRight)
    assert.notEqual(afterLeft.currentSceneId, afterRight.currentSceneId)
  })
})
