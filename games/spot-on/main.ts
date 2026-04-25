import { setupGameMenu } from '../../client/game-menu.js'
import { showScreen } from '../../client/game-screens.js'

import { announceItemPickedUp, announceItemPlaced, announceItemDropped, announceItemPickedUpFromSurface, announceRoomChange, announceAllPlaced } from './accessibility.js'
import { createInitialState, pickUpItem, placeItem, dropItem, selectNextRoom, getRoomDefinition } from './state.js'
import type { ItemId, SpotOnState } from './types.js'
import { initSpotOnRenderer, type SpotOnRenderer } from './renderer.js'
import { setupSpotOnInput, cleanupSpotOnInput, updateSpotOnInputState, type SpotOnInputCallbacks } from './input.js'
import { playSpotOnSfx, ensureSpotOnAudioUnlocked } from './sounds.js'
import { animateItemPickup, animateItemPlace, animateRoomTransition, animateCompletion } from './animations.js'

type ScreenId = 'start-screen' | 'game-screen'

const SCREEN_IDS: readonly ScreenId[] = ['start-screen', 'game-screen']

let state: SpotOnState = createInitialState()
let renderer: SpotOnRenderer | null = null
let settingsModal: ReturnType<typeof setupGameMenu> = { open() {}, close() {}, toggle() {} }
let initialized = false
let transitioning = false

let startClickHandler: (() => void) | null = null
let newRoomClickHandler: (() => void) | null = null
let restartHandler: (() => void) | null = null

function byId<T extends HTMLElement>(id: string): T | null {
  const el = document.getElementById(id)
  return el instanceof HTMLElement ? (el as T) : null
}

function setActiveScreen(screenId: ScreenId): void {
  showScreen(screenId, [...SCREEN_IDS])

  for (const id of SCREEN_IDS) {
    const screen = byId<HTMLElement>(id)
    if (screen) {
      const isActive = id === screenId
      screen.classList.toggle('active', isActive)
      screen.classList.remove('leaving')
    }
  }
}

function renderState(): void {
  if (!renderer) return
  renderer.render(state)
  updateSpotOnInputState(state)
}

function handlePickUpItem(itemId: ItemId): void {
  const previousPhase = state.phase

  // If carrying and clicking the carried item, drop it
  if (state.phase === 'carrying' && state.carriedItemId === itemId) {
    handleDropItem()
    return
  }

  // Look up item surface info before state change (for accessibility announcements)
  const prevItem = state.items.find((i) => i.id === itemId)
  const prevSurface = prevItem?.surfaceId
    ? state.surfaces.find((s) => s.id === prevItem.surfaceId)
    : null

  state = pickUpItem(state, itemId)
  if (state.phase !== previousPhase && state.carriedItemId !== null) {
    playSpotOnSfx('pickup')
    ensureSpotOnAudioUnlocked()
    const item = state.items.find((i) => i.id === state.carriedItemId)
    if (item) {
      if (prevSurface) {
        announceItemPickedUpFromSurface(item.name, prevSurface.label)
      } else {
        announceItemPickedUp(item.name)
      }
    }

    // Animate the pick-up element
    const carriedEl = renderer?.scene.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)
    animateItemPickup(carriedEl ?? null)
  }
  renderState()
}

function handlePlaceItem(surfaceId: string, cellIndex: number): void {
  if (state.phase !== 'carrying' || state.carriedItemId === null) return

  const carriedItem = state.items.find((i) => i.id === state.carriedItemId)
  const surface = state.surfaces.find((s) => s.id === surfaceId)
  if (!carriedItem || !surface) return

  // Don't allow placing on an occupied cell
  if (cellIndex < 0 || cellIndex >= surface.cells.length) return
  if (surface.cells[cellIndex].itemId !== null) return

  state = placeItem(state, surfaceId, cellIndex)
  playSpotOnSfx('place')
  announceItemPlaced(carriedItem.name, surface.label)

  // Animate the placed element
  const placedEl = renderer?.scene.querySelector<HTMLElement>(`[data-item-id="${carriedItem.id}"]`)
  animateItemPlace(placedEl ?? null)

  if (state.phase === 'complete') {
    announceAllPlaced()
    // Delay completion sound slightly so place sound finishes first
    setTimeout(() => {
      playSpotOnSfx('completion')
    }, 250)
    // Animate completion message
    animateCompletion(renderer?.completionMsg ?? null)
  }
  renderState()
}

function handleDropItem(): void {
  if (state.phase !== 'carrying' || state.carriedItemId === null) return

  const carriedItem = state.items.find((i) => i.id === state.carriedItemId)
  state = dropItem(state)
  playSpotOnSfx('drop')

  if (carriedItem) {
    announceItemDropped(carriedItem.name)
  }
  renderState()
}

function handleNewRoom(): void {
  if (transitioning) return
  transitioning = true

  const doSwap = (): void => {
    state = selectNextRoom(state)
    const room = getRoomDefinition(state.currentRoomId)
    playSpotOnSfx('new-room')
    announceRoomChange(room.name)
    renderState()
    transitioning = false
  }

  if (renderer) {
    animateRoomTransition(renderer.scene, doSwap)
  } else {
    doSwap()
  }
}

function enterGame(): void {
  state = createInitialState()
  renderState()
  setActiveScreen('game-screen')
  renderer?.syncLayout()
  // Ensure audio is unlocked on first interaction
  ensureSpotOnAudioUnlocked()
}

function restart(): void {
  state = createInitialState()
  renderState()
  setActiveScreen('start-screen')
}

function bindRuntimeEvents(): void {
  const startBtn = byId<HTMLButtonElement>('start-btn')
  if (startBtn) {
    startClickHandler = () => enterGame()
    startBtn.addEventListener('click', startClickHandler)
  }

  if (renderer) {
    newRoomClickHandler = () => handleNewRoom()
    renderer.newRoomBtn.addEventListener('click', newRoomClickHandler)
  }

  restartHandler = () => restart()
  document.addEventListener('restart', restartHandler)
}

function unbindRuntimeEvents(): void {
  if (startClickHandler) {
    const startBtn = byId<HTMLButtonElement>('start-btn')
    if (startBtn) startBtn.removeEventListener('click', startClickHandler)
    startClickHandler = null
  }

  if (newRoomClickHandler && renderer) {
    renderer.newRoomBtn.removeEventListener('click', newRoomClickHandler)
    newRoomClickHandler = null
  }

  if (restartHandler) {
    document.removeEventListener('restart', restartHandler)
    restartHandler = null
  }
}

function init(): void {
  if (initialized) return
  initialized = true

  renderer = initSpotOnRenderer()
  settingsModal = setupGameMenu({ musicTrackPicker: false })
  state = createInitialState()

  const inputCallbacks: SpotOnInputCallbacks = {
    onStart: enterGame,
    onPickUpItem: handlePickUpItem,
    onPlaceItem: handlePlaceItem,
    onDropItem: handleDropItem,
    onNewRoom: handleNewRoom,
    onToggleMenu: () => settingsModal.toggle(),
  }

  setupSpotOnInput(inputCallbacks)
  renderState()
  bindRuntimeEvents()
  setActiveScreen('start-screen')
}

export function teardownSpotOn(): void {
  if (!initialized) return
  initialized = false

  cleanupSpotOnInput()
  unbindRuntimeEvents()

  if (renderer) {
    renderer.dispose()
  }
  renderer = null
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}