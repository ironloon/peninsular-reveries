import { allStories } from './stories.js'
import type { GameState } from './types.js'
import {
  createInitialState,
  startStory,
  makeChoice,
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
  showScreen,
  getSceneText,
  getItemFlash,
  getInventoryOverlay,
} from './renderer.js'
import { setupInput } from './input.js'
import {
  announceSceneDescription,
  announceChoiceResult,
  announceItemCollected,
  announceHint,
  announceStoryComplete,
  announceTrailMap,
  moveFocusToFirstChoice,
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
      if (scene) renderScene(story, scene, gameState)
    }
  }
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

  if (newState.lastCollectedItem !== null) {
    const item = story.items.find(it => it.id === newState.lastCollectedItem)
    if (item) {
      playItemCollect()
      renderItemCollected(item)
      animateItemFlash(getItemFlash())
      announceItemCollected(item.name)
    }
  }

  setState(newState)

  const newScene = newState.currentSceneId ? getScene(story, newState.currentSceneId) : undefined
  if (!newScene) return

  if (newScene.isEnd) {
    onStoryComplete()
    return
  }

  renderScene(story, newScene, gameState)
  const textEl = getSceneText()
  typeText(textEl, newScene.description, playTypingBlip).then(() => moveFocusToFirstChoice())
  announceChoiceResult(choice.text)
}

function onStoryComplete(): void {
  const story = currentStory()!
  playStoryComplete()
  setState(completeStory(gameState, story.id, story.badgeName))
  renderStoryComplete(story)
  showScreen('completion-view')
  announceStoryComplete(story.badgeName)
  saveProgress()
}

function onBackToTrail(): void {
  setState(returnToTrailMap(gameState))
  renderTrailMap(allStories, gameState)
  showScreen('trail-map')
  playAmbientLoop()
  announceTrailMap(gameState.completedStoryIds.length + 1, allStories.length)
  moveFocusToTrailMap()
}

function onInventoryOpen(): void {
  const overlay = getInventoryOverlay()
  overlay.removeAttribute('hidden')
  const story = currentStory()
  if (story) renderInventoryOverlay(story, gameState)
}

function onInventoryClose(): void {
  getInventoryOverlay().setAttribute('hidden', '')
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
setupInput(getState, { onStorySelected, onChoiceMade, onInventoryOpen, onInventoryClose, onBackToTrail })

// Wire settings
setupTabbedModal('settings-modal')
bindMusicToggle('story-trail', document.getElementById('music-enabled-toggle') as HTMLInputElement | null, document.getElementById('music-enabled-help') as HTMLElement | null)
bindSfxToggle('story-trail', document.getElementById('sfx-enabled-toggle') as HTMLInputElement | null, document.getElementById('sfx-enabled-help') as HTMLElement | null)
bindReduceMotionToggle(document.getElementById('reduce-motion-toggle') as HTMLInputElement | null, document.getElementById('reduce-motion-help') as HTMLElement | null)
