import type { GameState, Choice, Story, Scene, Item } from './types.js'

export function createInitialState(): GameState {
  return {
    currentStoryId: null,
    currentSceneId: null,
    inventory: [],
    completedStoryIds: [],
    earnedBadges: [],
    lastHint: null,
    lastCollectedItem: null,
  }
}

export function startStory(state: GameState, storyId: string, startSceneId: string): GameState {
  return {
    ...state,
    currentStoryId: storyId,
    currentSceneId: startSceneId,
    inventory: [],
    lastHint: null,
    lastCollectedItem: null,
  }
}

export function makeChoice(state: GameState, choice: Choice): GameState {
  if (choice.requiredItemId && !state.inventory.includes(choice.requiredItemId)) {
    return {
      ...state,
      lastHint: choice.hint ?? 'You need something for that.',
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

export function completeStory(state: GameState, storyId: string, badgeName: string): GameState {
  const completedStoryIds = state.completedStoryIds.includes(storyId)
    ? state.completedStoryIds
    : [...state.completedStoryIds, storyId]

  const earnedBadges = state.earnedBadges.includes(badgeName)
    ? state.earnedBadges
    : [...state.earnedBadges, badgeName]

  return {
    ...state,
    currentStoryId: null,
    currentSceneId: null,
    inventory: [],
    completedStoryIds,
    earnedBadges,
    lastHint: null,
    lastCollectedItem: null,
  }
}

export function returnToTrailMap(state: GameState): GameState {
  return {
    ...state,
    currentStoryId: null,
    currentSceneId: null,
    inventory: [],
    lastHint: null,
    lastCollectedItem: null,
  }
}

export function isStoryUnlocked(state: GameState, storyIndex: number): boolean {
  return storyIndex === 0 || state.completedStoryIds.length >= storyIndex
}

export function getScene(story: Story, sceneId: string): Scene | undefined {
  return story.scenes.find(s => s.id === sceneId)
}

export function getItem(story: Story, itemId: string): Item | undefined {
  return story.items.find(i => i.id === itemId)
}
