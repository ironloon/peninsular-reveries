import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createInitialState,
  startStory,
  makeChoice,
  collectItem,
  toggleEquippedItem,
  completeStory,
  returnToTrailMap,
  isStoryUnlocked,
  getScene,
  getItem,
} from './state.js'
import type { Choice, Story } from './types.js'

const testStory: Story = {
  id: 'weather',
  title: 'Weather Walk',
  icon: '🌦️',
  theme: 'weather',
  description: 'A short walk in changing weather.',
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
  badgeName: 'Weather Watcher',
}

describe('createInitialState', () => {
  it('returns null story and scene with empty arrays', () => {
    const state = createInitialState()
    assert.equal(state.currentStoryId, null)
    assert.equal(state.currentSceneId, null)
    assert.deepEqual(state.inventory, [])
    assert.equal(state.equippedItemId, null)
    assert.deepEqual(state.completedStoryIds, [])
    assert.deepEqual(state.earnedBadges, [])
    assert.equal(state.lastHint, null)
    assert.equal(state.lastCollectedItem, null)
  })
})

describe('startStory', () => {
  it('sets storyId and sceneId, clears inventory, equipped item, and hints', () => {
    const initial = {
      ...createInitialState(),
      inventory: ['umbrella'],
      equippedItemId: 'umbrella',
      lastHint: 'some hint',
      lastCollectedItem: 'umbrella',
    }
    const state = startStory(initial, 'weather', 'start')
    assert.equal(state.currentStoryId, 'weather')
    assert.equal(state.currentSceneId, 'start')
    assert.deepEqual(state.inventory, [])
    assert.equal(state.equippedItemId, null)
    assert.equal(state.lastHint, null)
    assert.equal(state.lastCollectedItem, null)
  })

  it('does not change completedStoryIds', () => {
    const initial = { ...createInitialState(), completedStoryIds: ['plants'] }
    const state = startStory(initial, 'weather', 'start')
    assert.deepEqual(state.completedStoryIds, ['plants'])
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

  it('adds grantsItemId to inventory, auto-equips it, and sets lastCollectedItem', () => {
    const state = createInitialState()
    const choice: Choice = {
      text: 'Grab an umbrella',
      targetSceneId: 'park',
      grantsItemId: 'umbrella',
    }
    const next = makeChoice(state, choice)
    assert.equal(next.currentSceneId, 'park')
    assert.ok(next.inventory.includes('umbrella'))
    assert.equal(next.equippedItemId, 'umbrella')
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
  it('adds storyId and badgeName, clears current state', () => {
    const state = {
      ...createInitialState(),
      currentStoryId: 'weather',
      currentSceneId: 'park',
      inventory: ['umbrella'] as readonly string[],
      equippedItemId: 'umbrella',
    }
    const next = completeStory(state, 'weather', 'Weather Watcher')
    assert.ok(next.completedStoryIds.includes('weather'))
    assert.ok(next.earnedBadges.includes('Weather Watcher'))
    assert.equal(next.currentStoryId, null)
    assert.equal(next.currentSceneId, null)
    assert.deepEqual(next.inventory, [])
    assert.equal(next.equippedItemId, null)
  })

  it('does not duplicate storyId or badgeName on repeat completion', () => {
    const state = completeStory(createInitialState(), 'weather', 'Weather Watcher')
    const next = completeStory(state, 'weather', 'Weather Watcher')
    assert.equal(next.completedStoryIds.filter(id => id === 'weather').length, 1)
    assert.equal(next.earnedBadges.filter(b => b === 'Weather Watcher').length, 1)
  })
})

describe('isStoryUnlocked', () => {
  it('index 0 is always unlocked', () => {
    assert.ok(isStoryUnlocked(createInitialState(), 0))
  })

  it('index 1 is locked with no completions', () => {
    assert.equal(isStoryUnlocked(createInitialState(), 1), false)
  })

  it('index 1 is unlocked after 1 completion', () => {
    const state = completeStory(createInitialState(), 'weather', 'Weather Watcher')
    assert.ok(isStoryUnlocked(state, 1))
  })

  it('index 2 is locked after only 1 completion', () => {
    const state = completeStory(createInitialState(), 'weather', 'Weather Watcher')
    assert.equal(isStoryUnlocked(state, 2), false)
  })
})

describe('returnToTrailMap', () => {
  it('clears current story, scene, and inventory', () => {
    const state = {
      ...createInitialState(),
      currentStoryId: 'weather',
      currentSceneId: 'start',
      inventory: ['umbrella'] as readonly string[],
      equippedItemId: 'umbrella',
      lastHint: 'some hint',
    }
    const next = returnToTrailMap(state)
    assert.equal(next.currentStoryId, null)
    assert.equal(next.currentSceneId, null)
    assert.deepEqual(next.inventory, [])
    assert.equal(next.equippedItemId, null)
    assert.equal(next.lastHint, null)
  })

  it('preserves completedStoryIds and earnedBadges', () => {
    const state = {
      ...createInitialState(),
      completedStoryIds: ['weather'] as readonly string[],
      earnedBadges: ['Weather Watcher'] as readonly string[],
      currentStoryId: 'plants',
      currentSceneId: 'start',
    }
    const next = returnToTrailMap(state)
    assert.deepEqual(next.completedStoryIds, ['weather'])
    assert.deepEqual(next.earnedBadges, ['Weather Watcher'])
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
