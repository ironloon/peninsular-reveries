import { setupGameMenu } from '../../client/game-menu.js'
import {
  announceDestination,
  announceFact,
  announceMarkerSelection,
  announcePhase,
  announceRevisit,
  announceTravel,
  moveFocusAfterTransition,
} from './accessibility.js'
import { animateClass, pulseElement } from './animations.js'
import { DESTINATIONS, getDestination, getTransportType } from './destinations.js'
import { setupInput, type InputCallbacks } from './input.js'
import { focusSelectedMarker, renderGame, syncScreenForState } from './renderer.js'
import {
  advanceFact,
  advanceTravelProgress,
  arriveAtDestination,
  createInitialState,
  getDisplayFactIndex,
  navigateGlobe,
  prepareTravel,
  resetGame,
  returnToGlobe,
  revisitDestination,
  setSelectedDestinationIndex,
  startExploreMode,
} from './state.js'
import {
  ensureAudioUnlocked,
  sfxArrive,
  sfxButton,
  sfxMarkerMove,
  sfxTravelStart,
  startTravelLoop,
  stopTravelLoop,
} from './sounds.js'
import type { DestinationId, GameState, NavigationDirection } from './types.js'

let state: GameState = createInitialState()
let lastFrame = performance.now()

function getState(): GameState {
  return state
}

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

function animateStateChange(previousState: GameState | undefined, nextState: GameState): void {
  if (!previousState) {
    return
  }

  if (nextState.phase === 'travel' && previousState.phase !== 'travel') {
    void animateClass(element('travel-stage'), 'travel-stage-reveal', 620)
    void animateClass(element('travel-copy'), 'copy-reveal', 460)
  }

  if (
    nextState.phase === 'explore'
    && (
      previousState.phase !== 'explore'
      || previousState.targetDestination !== nextState.targetDestination
      || previousState.factIndex !== nextState.factIndex
    )
  ) {
    void animateClass(element('explore-scene'), 'scene-reveal', 620)
    void animateClass(element('explore-fact-text'), 'copy-reveal', 460)
    void animateClass(element('explore-progress'), 'pill-reveal', 420)
  }
}

function syncView(previousState?: GameState): void {
  renderGame(state)
  syncScreenForState(state)
  animateStateChange(previousState, state)
}

function selectedDestinationId(): DestinationId {
  return DESTINATIONS[state.globeSelectedIndex]?.id ?? DESTINATIONS[0].id
}

function beginExploreMode(): void {
  ensureAudioUnlocked()
  sfxButton()
  const previousState = state
  state = startExploreMode(state)
  syncView(previousState)
  announcePhase('Spin the globe and pick a place to visit.')
  focusSelectedMarker()
}

function travelToDestination(destinationId: DestinationId): void {
  const destination = getDestination(destinationId)
  if (!destination) return

  ensureAudioUnlocked()
  const previousState = state
  state = setSelectedDestinationIndex(state, destinationId)

  if (state.currentLocation === destinationId) {
    sfxButton()
    state = revisitDestination(state, destinationId)
    syncView(previousState)
    announceRevisit(destination.name, destination.country)
    const displayIndex = getDisplayFactIndex(state, destination.facts.length)
    announceFact(destination.facts[displayIndex])
    moveFocusAfterTransition('explore-next-btn', 220)
    return
  }

  const origin = getDestination(state.currentLocation)
  const transport = getTransportType(origin, destination)
  state = prepareTravel(state, destinationId, transport)
  syncView(previousState)

  sfxTravelStart(transport)
  startTravelLoop(transport)
  announceTravel(origin?.name ?? 'Home', destination.name, transport)
}

function continueFactSequence(): void {
  const destination = getDestination(state.targetDestination)
  if (!destination) return

  ensureAudioUnlocked()
  sfxButton()

  if (state.factIndex < destination.facts.length - 1) {
    const previousState = state
    state = advanceFact(state, destination.facts.length)
    syncView(previousState)
    const displayIndex = getDisplayFactIndex(state, destination.facts.length)
    announceFact(destination.facts[displayIndex])
    void pulseElement(element('explore-fact-text'), 'guide-bubble-pulse')
    return
  }

  const previousState = state
  state = returnToGlobe(state)
  syncView(previousState)
  announcePhase('Back on the globe. Pick a place to visit or read again.')
  focusSelectedMarker()
}

function moveSelection(direction: NavigationDirection): void {
  state = navigateGlobe(state, direction)
  renderGame(state)
  sfxMarkerMove()
  const selectedIcon = document.querySelector<HTMLElement>(
    '#globe-screen .destination-marker.is-selected .destination-marker-icon',
  )
  void pulseElement(selectedIcon, 'marker-pulse', 320)
  const destination = getDestination(selectedDestinationId())
  announceMarkerSelection(destination?.name ?? 'Destination', destination?.id === state.currentLocation)
  focusSelectedMarker()
}

const callbacks: InputCallbacks = {
  onStartExplore: beginExploreMode,
  onSelectDestination: travelToDestination,
  onAdvanceFact: continueFactSequence,
  onNavigateGlobe: moveSelection,
}

function tick(now: number): void {
  const deltaMs = now - lastFrame
  lastFrame = now

  if (state.phase === 'travel') {
    const previousProgress = state.travelProgress
    state = advanceTravelProgress(state, deltaMs)
    renderGame(state)

    if (previousProgress < 1 && state.travelProgress >= 1) {
      stopTravelLoop()
      const previousState = state
      state = arriveAtDestination(state)
      syncView(previousState)
      sfxArrive()

      const destination = getDestination(state.targetDestination)
      if (destination) {
        announceDestination(destination.name, destination.country)
        const displayIndex = getDisplayFactIndex(state, destination.facts.length)
        announceFact(destination.facts[displayIndex])
      }

      moveFocusAfterTransition('explore-next-btn', 220)
    }
  }

  requestAnimationFrame(tick)
}

document.addEventListener('restart', () => {
  stopTravelLoop()
  const previousState = state
  state = resetGame()
  syncView(previousState)
  announcePhase('Fresh trip. Press Explore to start.')
  moveFocusAfterTransition('start-explore-btn', 220)
})

setupGameMenu()
setupInput(getState, callbacks)
syncView()
requestAnimationFrame(tick)