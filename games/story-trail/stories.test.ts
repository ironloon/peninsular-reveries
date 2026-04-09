import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { allStories } from './stories.js'

describe('allStories', () => {
  it('has exactly 5 stories', () => {
    assert.strictEqual(allStories.length, 5)
  })

  for (const story of allStories) {
    describe(`story "${story.id}"`, () => {
      it('has unique scene IDs', () => {
        const ids = story.scenes.map(s => s.id)
        const unique = new Set(ids)
        assert.strictEqual(unique.size, ids.length, `Duplicate scene IDs found: ${ids.join(', ')}`)
      })

      it('startSceneId references an existing scene', () => {
        const sceneIds = new Set(story.scenes.map(s => s.id))
        assert.ok(sceneIds.has(story.startSceneId), `startSceneId "${story.startSceneId}" not found in scenes`)
      })

      it('every choice.targetSceneId references an existing scene', () => {
        const sceneIds = new Set(story.scenes.map(s => s.id))
        for (const scene of story.scenes) {
          for (const choice of scene.choices) {
            assert.ok(
              sceneIds.has(choice.targetSceneId),
              `Scene "${scene.id}" choice "${choice.text}" has unknown targetSceneId "${choice.targetSceneId}"`
            )
          }
        }
      })

      it('every choice.requiredItemId references a known item', () => {
        const itemIds = new Set(story.items.map(i => i.id))
        for (const scene of story.scenes) {
          for (const choice of scene.choices) {
            if (choice.requiredItemId !== undefined) {
              assert.ok(
                itemIds.has(choice.requiredItemId),
                `Scene "${scene.id}" choice "${choice.text}" has unknown requiredItemId "${choice.requiredItemId}"`
              )
            }
          }
        }
      })

      it('every choice.grantsItemId references a known item', () => {
        const itemIds = new Set(story.items.map(i => i.id))
        for (const scene of story.scenes) {
          for (const choice of scene.choices) {
            if (choice.grantsItemId !== undefined) {
              assert.ok(
                itemIds.has(choice.grantsItemId),
                `Scene "${scene.id}" choice "${choice.text}" has unknown grantsItemId "${choice.grantsItemId}"`
              )
            }
          }
        }
      })

      it('at least one scene has isEnd: true', () => {
        const hasEnd = story.scenes.some(s => s.isEnd === true)
        assert.ok(hasEnd, `Story "${story.id}" has no end scene`)
      })

      it('all items are obtainable via at least one choice', () => {
        const grantableItemIds = new Set<string>()
        for (const scene of story.scenes) {
          for (const choice of scene.choices) {
            if (choice.grantsItemId !== undefined) {
              grantableItemIds.add(choice.grantsItemId)
            }
          }
        }
        for (const item of story.items) {
          assert.ok(
            grantableItemIds.has(item.id),
            `Item "${item.id}" in story "${story.id}" is not granted by any choice`
          )
        }
      })

      it('all scenes are reachable from startSceneId', () => {
        const sceneMap = new Map(story.scenes.map(s => [s.id, s]))
        const visited = new Set<string>()
        const queue: string[] = [story.startSceneId]
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
        for (const scene of story.scenes) {
          assert.ok(
            visited.has(scene.id),
            `Scene "${scene.id}" in story "${story.id}" is not reachable from startSceneId "${story.startSceneId}"`
          )
        }
      })

      it('no dead-end non-end scenes', () => {
        for (const scene of story.scenes) {
          if (scene.isEnd !== true) {
            assert.ok(
              scene.choices.length > 0,
              `Non-end scene "${scene.id}" in story "${story.id}" has no choices`
            )
          }
        }
      })

      it('scene descriptions are at most 80 characters', () => {
        for (const scene of story.scenes) {
          assert.ok(
            scene.description.length <= 80,
            `Scene "${scene.id}" description is ${scene.description.length} chars (max 80): "${scene.description}"`
          )
        }
      })

      it('choice text is at most 30 characters', () => {
        for (const scene of story.scenes) {
          for (const choice of scene.choices) {
            assert.ok(
              choice.text.length <= 30,
              `Scene "${scene.id}" choice text is ${choice.text.length} chars (max 30): "${choice.text}"`
            )
          }
        }
      })

      it('item names are at most 30 characters', () => {
        for (const item of story.items) {
          assert.ok(
            item.name.length <= 30,
            `Item "${item.id}" name is ${item.name.length} chars (max 30): "${item.name}"`
          )
        }
      })
    })
  }
})
