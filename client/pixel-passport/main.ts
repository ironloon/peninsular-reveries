import { bindReduceMotionToggle } from '../preferences.js'
import {
  announceClue,
  announceDestination,
  announceFact,
  announceMarkerSelection,
  announceMemory,
  announceMysteryMiss,
  announceMysteryResult,
  announcePhase,
  announceRoom,
  announceTravel,
  moveFocusAfterTransition,
} from './accessibility.js'
import { animateClass, pulseElement } from './animations.js'
import { DESTINATIONS, getDestination, getTransportType, pickNextMysteryTarget } from './destinations.js'
import { setupInput, type InputCallbacks } from './input.js'
import { focusSelectedMarker, renderGame, syncScreenForState } from './renderer.js'
import {
  advanceFact,
  advanceTravelProgress,
  arriveAtDestination,
  collectMemory,
  continueMysteryRound,
  createInitialState,
  enterRoom,
  exitRoom,
  finishExplore,
  navigateGlobe,
  prepareTravel,
  returnToGlobe,
  setSelectedDestinationIndex,
  startExploreMode,
  startMysteryMode,
  submitMysteryGuess,
} from './state.js'
import {
  ensureAudioUnlocked,
  getSoundEnabled,
  setSoundEnabled,
  sfxArrive,
  sfxButton,
  sfxCorrectGuess,
  sfxMarkerMove,
  sfxMemoryCollect,
  sfxMysteryClue,
  sfxPipSpeak,
  sfxTravelStart,
  sfxWrongGuess,
  startTravelLoop,
  stopTravelLoop,
} from './sounds.js'
import type { DestinationId, GameProgress, GameState, NavigationDirection } from './types.js'

const PROGRESS_STORAGE_KEY = 'pixel-passport-progress'
const MODAL_OPEN_CLASS = 'modal-open'

let state: GameState = createInitialState(loadProgress())
let lastFrame = performance.now()

function loadProgress(): GameProgress {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!stored) {
      return { collectedMemories: [], mysteryCompleted: [] }
    }

    const parsed = JSON.parse(stored) as Partial<GameProgress>
    return {
      collectedMemories: Array.isArray(parsed.collectedMemories) ? parsed.collectedMemories as DestinationId[] : [],
      mysteryCompleted: Array.isArray(parsed.mysteryCompleted) ? parsed.mysteryCompleted as DestinationId[] : [],
    }
  } catch {
    return { collectedMemories: [], mysteryCompleted: [] }
  }
}

function saveProgress(): void {
  const progress: GameProgress = {
    collectedMemories: [...state.collectedMemories],
    mysteryCompleted: [...state.mysteryCompleted],
  }
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

function getState(): GameState {
  return state
}

function soundToggle(): HTMLInputElement | null {
  return document.getElementById('sound-enabled-toggle') as HTMLInputElement | null
}

function openSettings(): void {
  const modal = document.getElementById('settings-modal')
  if (!modal || !modal.hasAttribute('hidden')) return

  modal.removeAttribute('hidden')
  document.body.classList.add(MODAL_OPEN_CLASS)
  for (const button of document.querySelectorAll<HTMLElement>('[data-settings-open="true"]')) {
    button.setAttribute('aria-expanded', 'true')
  }
  requestAnimationFrame(() => element('settings-close-btn').focus())
}

function closeSettings(): void {
  const modal = document.getElementById('settings-modal')
  if (!modal || modal.hasAttribute('hidden')) return

  modal.setAttribute('hidden', '')
  document.body.classList.remove(MODAL_OPEN_CLASS)
  for (const button of document.querySelectorAll<HTMLElement>('[data-settings-open="true"]')) {
    button.setAttribute('aria-expanded', 'false')
  }
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
    void animateClass(element('explore-guide-text'), 'copy-reveal', 460)
    void animateClass(element('explore-progress'), 'pill-reveal', 420)
  }

  if (
    nextState.phase === 'memory-collect'
    && (
      previousState.phase !== 'memory-collect'
      || previousState.targetDestination !== nextState.targetDestination
      || previousState.memoryWasNew !== nextState.memoryWasNew
    )
  ) {
    void animateClass(element('memory-stage'), 'memory-stage-reveal', 680)
    void animateClass(element('memory-copy'), 'copy-reveal', 460)
  }

  if (
    nextState.phase === 'mystery-result'
    && (
      previousState.phase !== 'mystery-result'
      || previousState.mysteryClueIndex !== nextState.mysteryClueIndex
      || previousState.lastGuessCorrect !== nextState.lastGuessCorrect
      || previousState.revealedDestination !== nextState.revealedDestination
    )
  ) {
    void animateClass(element('mystery-result-heading'), 'result-reveal', 520)
    void animateClass(element('mystery-result-copy'), 'copy-reveal', 520)
    void animateClass(element('mystery-result-btn'), 'pill-reveal', 420)
  }

  if (nextState.phase === 'room' && previousState.phase !== 'room') {
    void animateClass(element('room-stage'), 'card-settle', 560)
    void animateClass(element('room-copy'), 'copy-reveal', 420)
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
  moveFocusAfterTransition('globe-room-btn', 220)
  focusSelectedMarker('globe')
}

function beginMysteryMode(): void {
  ensureAudioUnlocked()
  const target = pickNextMysteryTarget(state.mysteryCompleted)
  if (!target) {
    const previousState = state
    state = startExploreMode(state)
    syncView(previousState)
    announcePhase('You solved every mystery. Spin the globe and travel anywhere.')
    focusSelectedMarker('globe')
    return
  }

  sfxButton()
  const previousState = state
  state = startMysteryMode(state, target)
  syncView(previousState)
  sfxMysteryClue()
  const destination = getDestination(target)
  if (destination) {
    announceClue(destination.clues[state.mysteryClueIndex], state.mysteryClueIndex + 1)
  }
  focusSelectedMarker('mystery-clue')
}

function travelToDestination(destinationId: DestinationId): void {
  const destination = getDestination(destinationId)
  if (!destination) return

  ensureAudioUnlocked()
  const previousState = state
  state = setSelectedDestinationIndex(state, destinationId)
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
    sfxPipSpeak()
    announceFact(destination.facts[state.factIndex])
    void pulseElement(element('explore-guide-text'), 'guide-bubble-pulse')
    return
  }

  const previousState = state
  state = finishExplore(state)
  state = collectMemory(state)
  saveProgress()
  syncView(previousState)

  if (state.memoryWasNew) {
    sfxMemoryCollect()
  }

  announceMemory(destination.memoryLabel, state.memoryWasNew)
  moveFocusAfterTransition('memory-continue-btn', 220)
}

function continueMemorySequence(): void {
  ensureAudioUnlocked()
  sfxButton()

  if (state.mode === 'mystery') {
    const settled = returnToGlobe(state)
    const nextMystery = pickNextMysteryTarget(settled.mysteryCompleted)
    if (nextMystery) {
      const previousState = state
      state = startMysteryMode(settled, nextMystery)
      syncView(previousState)
      sfxMysteryClue()
      const destination = getDestination(nextMystery)
      if (destination) {
        announceClue(destination.clues[0], 1)
      }
      focusSelectedMarker('mystery-clue')
      return
    }

    const previousState = state
    state = startExploreMode(settled)
    syncView(previousState)
    announcePhase('All mysteries are solved. Now you can travel anywhere.')
    focusSelectedMarker('globe')
    return
  }

  const previousState = state
  state = returnToGlobe(state)
  syncView(previousState)
  announcePhase('Back on the globe. Pick another place to visit.')
  focusSelectedMarker('globe')
}

function openRoom(): void {
  ensureAudioUnlocked()
  sfxButton()
  const previousState = state
  state = enterRoom(state)
  syncView(previousState)
  announceRoom(state.collectedMemories.length)
  moveFocusAfterTransition('room-back-btn', 220)
}

function closeRoom(): void {
  ensureAudioUnlocked()
  sfxButton()
  const previousState = state
  state = exitRoom(state)
  syncView(previousState)
  announcePhase('Back on the globe. Pick a place to visit.')
  focusSelectedMarker('globe')
}

function moveSelection(direction: NavigationDirection): void {
  state = navigateGlobe(state, direction)
  renderGame(state)
  sfxMarkerMove()
  const selectedIcon = document.querySelector<HTMLElement>(
    state.phase === 'mystery-clue'
      ? '#mystery-screen .destination-marker.is-selected .destination-marker-icon'
      : '#globe-screen .destination-marker.is-selected .destination-marker-icon',
  )
  void pulseElement(selectedIcon, 'marker-pulse', 320)
  announceMarkerSelection(getDestination(selectedDestinationId())?.name ?? 'Destination')
  focusSelectedMarker(state.phase === 'mystery-clue' ? 'mystery-clue' : 'globe')
}

function submitGuess(destinationId: DestinationId): void {
  const destination = getDestination(destinationId)
  if (!destination) return

  ensureAudioUnlocked()
  const previousState = state
  state = setSelectedDestinationIndex(state, destinationId)
  const result = submitMysteryGuess(state, destinationId)
  state = result.state
  syncView(previousState)

  if (result.outcome === 'correct') {
    sfxCorrectGuess()
    announceMysteryResult(destination.name, false)
    moveFocusAfterTransition('mystery-result-btn', 220)
    return
  }

  if (result.outcome === 'revealed') {
    sfxCorrectGuess()
    const target = getDestination(state.mysteryTarget)
    if (target) {
      announceMysteryResult(target.name, true)
    }
    moveFocusAfterTransition('mystery-result-btn', 220)
    return
  }

  sfxWrongGuess()
  announceMysteryMiss(state.mysteryClueIndex + 1)
  moveFocusAfterTransition('mystery-result-btn', 220)
}

function continueMysteryResult(): void {
  ensureAudioUnlocked()
  sfxButton()

  if (!state.lastGuessCorrect && !state.revealedDestination) {
    const previousState = state
    state = continueMysteryRound(state)
    syncView(previousState)
    const destination = getDestination(state.mysteryTarget)
    if (destination) {
      sfxMysteryClue()
      announceClue(destination.clues[state.mysteryClueIndex], state.mysteryClueIndex + 1)
    }
    focusSelectedMarker('mystery-clue')
    return
  }

  if (state.mysteryTarget) {
    travelToDestination(state.mysteryTarget)
  }
}

const callbacks: InputCallbacks = {
  onStartExplore: beginExploreMode,
  onStartMystery: beginMysteryMode,
  onSelectDestination: travelToDestination,
  onAdvanceFact: continueFactSequence,
  onContinueMemory: continueMemorySequence,
  onEnterRoom: openRoom,
  onExitRoom: closeRoom,
  onNavigateGlobe: moveSelection,
  onSubmitGuess: submitGuess,
  onMysteryResultContinue: continueMysteryResult,
}

function setupSettingsModal(): void {
  document.querySelectorAll<HTMLElement>('[data-settings-open="true"]').forEach((button) => {
    button.addEventListener('click', () => openSettings())
  })

  element('settings-close-btn').addEventListener('click', () => closeSettings())

  const restartBtn = document.getElementById('restart-btn')
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      closeSettings()
      const previousState = state
      state = returnToGlobe(state)
      syncView(previousState)
      announcePhase('Back on the globe. Pick a place to visit.')
      focusSelectedMarker('globe')
    })
  }

  element('settings-modal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      closeSettings()
    }
  })

  window.__pixelPassportSettingsToggle = () => {
    const modal = document.getElementById('settings-modal')
    if (!modal || modal.hasAttribute('hidden')) {
      openSettings()
    } else {
      closeSettings()
    }
  }
}

function bindSettingsControls(): void {
  bindReduceMotionToggle(
    document.getElementById('reduce-motion-toggle') as HTMLInputElement | null,
    document.getElementById('reduce-motion-help'),
  )

  const toggle = soundToggle()
  if (!toggle) return

  toggle.checked = getSoundEnabled()
  toggle.addEventListener('change', () => {
    ensureAudioUnlocked()
    setSoundEnabled(toggle.checked)
  })
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
        sfxPipSpeak()
        announceFact(destination.facts[0])
      }

      moveFocusAfterTransition('explore-next-btn', 220)
    }
  }

  requestAnimationFrame(tick)
}

setupSettingsModal()
bindSettingsControls()
setupInput(getState, callbacks)
syncView()
requestAnimationFrame(tick)

if (state.collectedMemories.length > 0) {
  announcePhase('Welcome back. Choose a place or solve a mystery.')
}