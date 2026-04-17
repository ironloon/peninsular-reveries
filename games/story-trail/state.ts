import type { GameState, Choice, Story, Scene, Item } from './types.js'

export function createInitialState(): GameState {
  return {
    currentSceneId: null,
    inventory: [],
    equippedItemId: null,
    lastHint: null,
    lastCollectedItem: null,
  }
}

export function startStory(state: GameState, startSceneId: string): GameState {
  return {
    currentSceneId: startSceneId,
    inventory: [],
    equippedItemId: null,
    lastHint: null,
    lastCollectedItem: null,
  }
}

export function makeChoice(state: GameState, choice: Choice): GameState {
  if (choice.requiredItemId) {
    const ownsRequiredItem = state.inventory.includes(choice.requiredItemId)
    if (!ownsRequiredItem) {
      return {
        ...state,
        lastHint: choice.hint ?? 'You need something for that.',
      }
    }

    if (state.equippedItemId !== choice.requiredItemId) {
      return {
        ...state,
        lastHint: 'Pick it in your bag first.',
      }
    }
  }

  let inventory = state.inventory
  let lastCollectedItem = state.lastCollectedItem

  if (choice.grantsItemId && !inventory.includes(choice.grantsItemId)) {
    inventory = [...inventory, choice.grantsItemId]
    lastCollectedItem = choice.grantsItemId
  }

  return {
    ...state,
    currentSceneId: choice.targetSceneId,
    inventory,
    lastCollectedItem,
    lastHint: null,
  }
}

export function toggleEquippedItem(state: GameState, itemId: string): GameState {
  if (!state.inventory.includes(itemId)) {
    return state
  }

  return {
    ...state,
    equippedItemId: state.equippedItemId === itemId ? null : itemId,
    lastHint: null,
  }
}

export function collectItem(state: GameState, itemId: string): GameState {
  if (state.inventory.includes(itemId)) {
    return state
  }
  return {
    ...state,
    inventory: [...state.inventory, itemId],
    lastCollectedItem: itemId,
  }
}

export function completeStory(_state: GameState): GameState {
  return {
    currentSceneId: null,
    inventory: [],
    equippedItemId: null,
    lastHint: null,
    lastCollectedItem: null,
  }
}

export function getScene(story: Story, sceneId: string): Scene | undefined {
  return story.scenes.find(s => s.id === sceneId)
}

export function getItem(story: Story, itemId: string): Item | undefined {
  return story.items.find(i => i.id === itemId)
}
