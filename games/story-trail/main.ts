import { allStories } from './stories.js'
import type { GameState } from './types.js'
import {
  createInitialState,
  startStory,
  makeChoice,
  toggleEquippedItem,
  completeStory,
  returnToTrailMap,
  isStoryUnlocked,
  getScene,
} from './state.js'
import {
  renderTrailMap,
  renderScene,
  renderStoryComplete,
  renderHint,
  renderItemCollected,
  renderInventoryOverlay,
  updateInventoryBar,
  updateSceneChoices,
  showScreen,
  getHintArea,
  getSceneText,
  getItemFlash,
  getInventoryOverlay,
} from './renderer.js'
import { setupInput } from './input.js'
import {
  announceSceneDescription,
  announceChoiceResult,
  announceItemCleared,
  announceItemEquipped,
  announceHint,
  announceStoryComplete,
  announceTrailMap,
  moveFocusToFirstChoice,
  moveFocusToInventoryBarItem,
  moveFocusToInventoryOverlay,
  moveFocusToTrailMap,
} from './accessibility.js'
import {
  typeText,
  animateItemFlash,
} from './animations.js'
import {
  ensureAudioUnlocked,
  playTypingBlip,
  playChoiceConfirm,
  playHintNudge,
  playItemCollect,
  playStoryComplete,
  playAmbientLoop,
  stopAmbientLoop,
} from './sounds.js'
import { setupTabbedModal } from '../../client/modal.js'
import { bindMusicToggle, bindSfxToggle, bindReduceMotionToggle } from '../../client/preferences.js'

// ── State ─────────────────────────────────────────────────────
let gameState: GameState = createInitialState()

function getState(): GameState { return gameState }

function currentStory() { return allStories.find(s => s.id === gameState.currentStoryId) }

function setState(s: GameState): void {
  gameState = s
  refreshUI()
}

// ── UI Refresh ────────────────────────────────────────────────

function refreshUI(): void {
  const badgeCounter = document.getElementById('badge-counter')
  if (badgeCounter) badgeCounter.textContent = `${gameState.completedStoryIds.length}/5`

  if (gameState.currentStoryId === null) {
    renderTrailMap(allStories, gameState)
  } else {
    const story = currentStory()
    if (story && gameState.currentSceneId) {
      const scene = getScene(story, gameState.currentSceneId)
      if (scene) {
        renderScene(story, scene, gameState)
        if (!getInventoryOverlay().hidden) {
          renderInventoryOverlay(story, gameState)
        }
      }
    }
  }
}

function syncSceneSelectionUI(itemId: string, focusTarget: 'bar' | 'overlay'): void {
  const story = currentStory()
  if (!story || !gameState.currentSceneId) return

  const scene = getScene(story, gameState.currentSceneId)
  if (!scene) return

  updateSceneChoices(scene, gameState)
  updateInventoryBar(story, gameState)
  if (!getInventoryOverlay().hidden) {
    renderInventoryOverlay(story, gameState)
  }

  getHintArea().setAttribute('hidden', '')
  getItemFlash().setAttribute('hidden', '')

  if (focusTarget === 'overlay') {
    moveFocusToInventoryOverlay(itemId)
  } else {
    moveFocusToInventoryBarItem(itemId)
  }
}

function hideInventoryOverlay(): void {
  getInventoryOverlay().setAttribute('hidden', '')
}

// ── Game Flow ─────────────────────────────────────────────────

function onStorySelected(storyId: string): void {
  const storyIndex = allStories.findIndex(s => s.id === storyId)
  if (storyIndex === -1) return
  if (!isStoryUnlocked(gameState, storyIndex)) return
  const story = allStories[storyIndex]

  ensureAudioUnlocked()
  stopAmbientLoop()

  setState(startStory(gameState, storyId, story.startSceneId))
  showScreen('scene-view')

  const scene = getScene(story, story.startSceneId)
  if (!scene) return
  renderScene(story, scene, gameState)

  const textEl = getSceneText()
  typeText(textEl, scene.description, playTypingBlip).then(() => moveFocusToFirstChoice())
  announceSceneDescription(scene.description)
}

function onChoiceMade(choiceIndex: number): void {
  const story = currentStory()
  if (!story || !gameState.currentSceneId) return
  const scene = getScene(story, gameState.currentSceneId)
  if (!scene) return
  const choice = scene.choices[choiceIndex]
  if (!choice) return

  playChoiceConfirm()
  const newState = makeChoice(gameState, choice)

  if (newState.lastHint !== null) {
    renderHint(newState.lastHint)
    playHintNudge()
    announceHint(newState.lastHint)
    gameState = newState
    return
  }

  const collectedItem = newState.lastCollectedItem
    ? story.items.find(item => item.id === newState.lastCollectedItem)
    : undefined

  setState(newState)

  const newScene = newState.currentSceneId ? getScene(story, newState.currentSceneId) : undefined
  if (!newScene) return

  if (newScene.isEnd) {
    onStoryComplete()
    return
  }

  renderScene(story, newScene, gameState)
  if (collectedItem) {
    playItemCollect()
    renderItemCollected(collectedItem)
    animateItemFlash(getItemFlash())
  }

  const textEl = getSceneText()
  typeText(textEl, newScene.description, playTypingBlip).then(() => moveFocusToFirstChoice())
  if (collectedItem) {
    announceItemEquipped(collectedItem.name)
  } else {
    announceChoiceResult(choice.text)
  }
}

function onStoryComplete(): void {
  const story = currentStory()!
  playStoryComplete()
  hideInventoryOverlay()
  setState(completeStory(gameState, story.id, story.badgeName))
  renderStoryComplete(story)
  showScreen('completion-view')
  announceStoryComplete(story.badgeName)
  saveProgress()
}

function onBackToTrail(): void {
  hideInventoryOverlay()
  setState(returnToTrailMap(gameState))
  renderTrailMap(allStories, gameState)
  showScreen('trail-map')
  playAmbientLoop()
  announceTrailMap(gameState.completedStoryIds.length + 1, allStories.length)
  moveFocusToTrailMap()
}

function onInventoryOpen(): void {
  const story = currentStory()
  if (!story) return

  const overlay = getInventoryOverlay()
  overlay.removeAttribute('hidden')
  renderInventoryOverlay(story, gameState)
  updateInventoryBar(story, gameState)
  moveFocusToInventoryOverlay(gameState.equippedItemId ?? undefined)
}

function onInventoryClose(): void {
  hideInventoryOverlay()
  const story = currentStory()
  if (!story) return

  updateInventoryBar(story, gameState)
  moveFocusToInventoryBarItem(gameState.equippedItemId ?? undefined)
}

function onInventoryItemToggle(itemId: string): void {
  const story = currentStory()
  if (!story) return

  const item = story.items.find(entry => entry.id === itemId)
  if (!item) return

  const focusTarget = (document.activeElement as HTMLElement | null)?.closest('#inventory-overlay')
    ? 'overlay'
    : 'bar'
  const nextState = toggleEquippedItem(gameState, itemId)
  if (nextState === gameState) return

  const clearedItem = nextState.equippedItemId === null
  gameState = nextState
  syncSceneSelectionUI(itemId, focusTarget)

  if (clearedItem) {
    announceItemCleared(item.name)
  } else {
    announceItemEquipped(item.name)
  }
}

function saveProgress(): void {
  localStorage.setItem('story-trail-progress', JSON.stringify({
    completedStoryIds: gameState.completedStoryIds,
    earnedBadges: gameState.earnedBadges,
  }))
}

// ── Initialization ────────────────────────────────────────────

// Load saved progress
const saved = localStorage.getItem('story-trail-progress')
if (saved) {
  try {
    const data = JSON.parse(saved) as { completedStoryIds: readonly string[], earnedBadges: readonly string[] }
    gameState = { ...gameState, completedStoryIds: data.completedStoryIds ?? [], earnedBadges: data.earnedBadges ?? [] }
  } catch { /* ignore */ }
}

// Initial render
renderTrailMap(allStories, gameState)
showScreen('trail-map')
playAmbientLoop()
announceTrailMap(gameState.completedStoryIds.length + 1, allStories.length)

// Wire input
setupInput(getState, {
  onStorySelected,
  onChoiceMade,
  onInventoryOpen,
  onInventoryClose,
  onInventoryItemToggle,
  onBackToTrail,
})

// Wire settings
setupTabbedModal('settings-modal')
bindMusicToggle('story-trail', document.getElementById('music-enabled-toggle') as HTMLInputElement | null, document.getElementById('music-enabled-help') as HTMLElement | null)
bindSfxToggle('story-trail', document.getElementById('sfx-enabled-toggle') as HTMLInputElement | null, document.getElementById('sfx-enabled-help') as HTMLElement | null)
bindReduceMotionToggle(document.getElementById('reduce-motion-toggle') as HTMLInputElement | null, document.getElementById('reduce-motion-help') as HTMLElement | null)
