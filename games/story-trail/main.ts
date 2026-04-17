import { theStory } from './stories.js'
import type { GameState, Scene } from './types.js'
import {
  createInitialState,
  startStory,
  makeChoice,
  toggleEquippedItem,
  completeStory,
  getScene,
} from './state.js'
import {
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
  announceItemCollected,
  announceHint,
  announceStoryComplete,
  moveFocusToFirstChoice,
  moveFocusToInventoryBarItem,
  moveFocusToInventoryOverlay,
  moveFocusToPlayAgain,
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
import { setupGameMenu } from '../../client/game-menu.js'

// ── State ─────────────────────────────────────────────────────
let gameState: GameState = createInitialState()

function getState(): GameState { return gameState }

// ── UI Refresh ────────────────────────────────────────────────



function syncSceneSelectionUI(itemId: string, focusTarget: 'bar' | 'overlay'): void {
  if (!gameState.currentSceneId) return

  const scene = getScene(theStory, gameState.currentSceneId)
  if (!scene) return

  updateSceneChoices(scene, gameState)
  updateInventoryBar(theStory, gameState)
  if (!getInventoryOverlay().hidden) {
    renderInventoryOverlay(theStory, gameState)
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

function beginStory(): void {
  hideInventoryOverlay()
  gameState = startStory(gameState, theStory.startSceneId)
  showScreen('scene-view')

  const scene = getScene(theStory, theStory.startSceneId)
  if (!scene) return
  renderScene(theStory, scene, gameState)

  const textEl = getSceneText()
  typeText(textEl, scene.description, playTypingBlip).then(() => moveFocusToFirstChoice())
  announceSceneDescription(scene.description)
}

function onRestart(): void {
  ensureAudioUnlocked()
  stopAmbientLoop()
  beginStory()
  playAmbientLoop()
}

function onChoiceMade(choiceIndex: number): void {
  if (!gameState.currentSceneId) return
  const scene = getScene(theStory, gameState.currentSceneId)
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
    ? theStory.items.find(item => item.id === newState.lastCollectedItem)
    : undefined

  gameState = newState

  const newScene = newState.currentSceneId ? getScene(theStory, newState.currentSceneId) : undefined
  if (!newScene) return

  if (newScene.isEnd) {
    onStoryComplete(newScene)
    return
  }

  renderScene(theStory, newScene, gameState)
  if (collectedItem) {
    playItemCollect()
    renderItemCollected(collectedItem)
    animateItemFlash(getItemFlash())
  }

  const textEl = getSceneText()
  typeText(textEl, newScene.description, playTypingBlip).then(() => moveFocusToFirstChoice())
  if (collectedItem) {
    announceItemCollected(collectedItem.name)
  } else {
    announceChoiceResult(choice.text)
  }
}

function onStoryComplete(endScene: Scene): void {
  playStoryComplete()
  hideInventoryOverlay()
  gameState = completeStory(gameState)
  renderStoryComplete(endScene)
  showScreen('completion-view')
  announceStoryComplete(endScene.description)
  moveFocusToPlayAgain()
}

function onInventoryOpen(): void {
  const overlay = getInventoryOverlay()
  overlay.removeAttribute('hidden')
  renderInventoryOverlay(theStory, gameState)
  updateInventoryBar(theStory, gameState)
  moveFocusToInventoryOverlay(gameState.equippedItemId ?? undefined)
}

function onInventoryClose(): void {
  hideInventoryOverlay()
  updateInventoryBar(theStory, gameState)
  moveFocusToInventoryBarItem(gameState.equippedItemId ?? undefined)
}

function onInventoryItemToggle(itemId: string): void {
  const item = theStory.items.find(entry => entry.id === itemId)
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

// ── Initialization ────────────────────────────────────────────

// Gate story start behind start button click
const startBtn = document.getElementById('start-btn')
startBtn?.addEventListener('click', () => {
  ensureAudioUnlocked()
  beginStory()
  playAmbientLoop()
})

// Wire input
setupInput(getState, {
  onChoiceMade,
  onInventoryOpen,
  onInventoryClose,
  onInventoryItemToggle,
  onRestart,
})

// Wire settings
setupGameMenu()

// Wire restart
document.addEventListener('restart', () => { onRestart() })
