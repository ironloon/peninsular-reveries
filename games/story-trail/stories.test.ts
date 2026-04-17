import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { theStory } from './stories.js'

describe('theStory', () => {
  it('has unique scene IDs', () => {
    const ids = theStory.scenes.map(s => s.id)
    const unique = new Set(ids)
    assert.strictEqual(unique.size, ids.length, `Duplicate scene IDs found: ${ids.join(', ')}`)
  })

  it('startSceneId references an existing scene', () => {
    const sceneIds = new Set(theStory.scenes.map(s => s.id))
    assert.ok(sceneIds.has(theStory.startSceneId), `startSceneId "${theStory.startSceneId}" not found in scenes`)
  })

  it('every choice.targetSceneId references an existing scene', () => {
    const sceneIds = new Set(theStory.scenes.map(s => s.id))
    for (const scene of theStory.scenes) {
      for (const choice of scene.choices) {
        assert.ok(
          sceneIds.has(choice.targetSceneId),
          `Scene "${scene.id}" choice "${choice.text}" has unknown targetSceneId "${choice.targetSceneId}"`,
        )
      }
    }
  })

  it('every choice.requiredItemId references a known item', () => {
    const itemIds = new Set(theStory.items.map(i => i.id))
    for (const scene of theStory.scenes) {
      for (const choice of scene.choices) {
        if (choice.requiredItemId !== undefined) {
          assert.ok(
            itemIds.has(choice.requiredItemId),
            `Scene "${scene.id}" choice "${choice.text}" has unknown requiredItemId "${choice.requiredItemId}"`,
          )
        }
      }
    }
  })

  it('every choice.grantsItemId references a known item', () => {
    const itemIds = new Set(theStory.items.map(i => i.id))
    for (const scene of theStory.scenes) {
      for (const choice of scene.choices) {
        if (choice.grantsItemId !== undefined) {
          assert.ok(
            itemIds.has(choice.grantsItemId),
            `Scene "${scene.id}" choice "${choice.text}" has unknown grantsItemId "${choice.grantsItemId}"`,
          )
        }
      }
    }
  })

  it('has at least 3 end scenes', () => {
    const ends = theStory.scenes.filter(s => s.isEnd === true)
    assert.ok(ends.length >= 3, `Expected at least 3 endings, found ${ends.length}`)
  })

  it('all items are obtainable via at least one choice', () => {
    const grantableItemIds = new Set<string>()
    for (const scene of theStory.scenes) {
      for (const choice of scene.choices) {
        if (choice.grantsItemId !== undefined) {
          grantableItemIds.add(choice.grantsItemId)
        }
      }
    }
    for (const item of theStory.items) {
      assert.ok(
        grantableItemIds.has(item.id),
        `Item "${item.id}" is not granted by any choice`,
      )
    }
  })

  it('all scenes are reachable from startSceneId', () => {
    const sceneMap = new Map(theStory.scenes.map(s => [s.id, s]))
    const visited = new Set<string>()
    const queue: string[] = [theStory.startSceneId]
    while (queue.length > 0) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      const scene = sceneMap.get(id)
      if (scene === undefined) continue
      for (const choice of scene.choices) {
        if (!visited.has(choice.targetSceneId)) {
          queue.push(choice.targetSceneId)
        }
      }
    }
    for (const scene of theStory.scenes) {
      assert.ok(
        visited.has(scene.id),
        `Scene "${scene.id}" is not reachable from startSceneId "${theStory.startSceneId}"`,
      )
    }
  })

  it('no dead-end non-end scenes', () => {
    for (const scene of theStory.scenes) {
      if (scene.isEnd !== true) {
        assert.ok(
          scene.choices.length > 0,
          `Non-end scene "${scene.id}" has no choices`,
        )
      }
    }
  })

  it('scene descriptions are at most 80 characters', () => {
    for (const scene of theStory.scenes) {
      assert.ok(
        scene.description.length <= 80,
        `Scene "${scene.id}" description is ${scene.description.length} chars (max 80): "${scene.description}"`,
      )
    }
  })

  it('choice text is at most 30 characters', () => {
    for (const scene of theStory.scenes) {
      for (const choice of scene.choices) {
        assert.ok(
          choice.text.length <= 30,
          `Scene "${scene.id}" choice text is ${choice.text.length} chars (max 30): "${choice.text}"`,
        )
      }
    }
  })

  it('item names are at most 30 characters', () => {
    for (const item of theStory.items) {
      assert.ok(
        item.name.length <= 30,
        `Item "${item.id}" name is ${item.name.length} chars (max 30): "${item.name}"`,
      )
    }
  })

  it('has more scenes than the old individual stories (>10)', () => {
    assert.ok(theStory.scenes.length > 10, `Expected >10 scenes, got ${theStory.scenes.length}`)
  })

  it('has at least 5 items', () => {
    assert.ok(theStory.items.length >= 5, `Expected >=5 items, got ${theStory.items.length}`)
  })

  it('every ending is reachable via at least one path', () => {
    const endSceneIds = theStory.scenes.filter(s => s.isEnd === true).map(s => s.id)
    const sceneMap = new Map(theStory.scenes.map(s => [s.id, s]))

    for (const endId of endSceneIds) {
      // Check that at least one scene has a choice pointing to this end
      let reachable = false
      for (const scene of theStory.scenes) {
        for (const choice of scene.choices) {
          if (choice.targetSceneId === endId) {
            reachable = true
          }
        }
      }
      // Also check if it's the start (unlikely for ends)
      if (endId === theStory.startSceneId) reachable = true
      assert.ok(reachable, `End scene "${endId}" has no incoming choice`)
    }
    void sceneMap
  })

  it('at least one gated choice per item exists', () => {
    for (const item of theStory.items) {
      let found = false
      for (const scene of theStory.scenes) {
        for (const choice of scene.choices) {
          if (choice.requiredItemId === item.id) {
            found = true
          }
        }
      }
      assert.ok(found, `Item "${item.id}" is never required by any gated choice`)
    }
  })

  it('is the single deep story with id "hidden-garden"', () => {
    assert.equal(theStory.id, 'hidden-garden')
    assert.equal(theStory.title, 'The Hidden Garden')
  })
})
