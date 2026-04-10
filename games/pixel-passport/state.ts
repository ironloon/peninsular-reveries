import { DESTINATION_IDS, type DestinationId, type GameProgress, type GameState, type NavigationDirection, type TransportType } from './types.js'

function uniqueDestinations(ids: readonly DestinationId[]): readonly DestinationId[] {
  return [...new Set(ids)]
}

function wrapIndex(value: number, count: number): number {
  return ((value % count) + count) % count
}

export function createInitialState(progress?: Partial<GameProgress>): GameState {
  const collectedMemories = uniqueDestinations(progress?.collectedMemories ?? [])

  return {
    phase: 'title',
    currentLocation: null,
    targetDestination: null,
    transportType: null,
    travelProgress: 0,
    factIndex: 0,
    collectedMemories,
    globeSelectedIndex: 0,
    globeRotationOffset: 0,
    lastGuessCorrect: null,
    revealedDestination: false,
    memoryWasNew: false,
  }
}

export function startExploreMode(state: GameState): GameState {
  return {
    ...state,
    phase: 'globe',
    targetDestination: null,
    transportType: null,
    travelProgress: 0,
    factIndex: 0,
    lastGuessCorrect: null,
    revealedDestination: false,
    memoryWasNew: false,
  }
}

export function navigateGlobe(state: GameState, direction: NavigationDirection): GameState {
  const offset = direction === 'next' ? 1 : -1
  const nextIndex = wrapIndex(state.globeSelectedIndex + offset, DESTINATION_IDS.length)
  return {
    ...state,
    globeSelectedIndex: nextIndex,
    globeRotationOffset: nextIndex / DESTINATION_IDS.length,
  }
}

export function setSelectedDestinationIndex(state: GameState, destinationId: DestinationId): GameState {
  const nextIndex = DESTINATION_IDS.indexOf(destinationId)
  if (nextIndex < 0) return state

  return {
    ...state,
    globeSelectedIndex: nextIndex,
    globeRotationOffset: nextIndex / DESTINATION_IDS.length,
  }
}

export function prepareTravel(state: GameState, destinationId: DestinationId, transportType: TransportType): GameState {
  return {
    ...state,
    phase: 'travel',
    targetDestination: destinationId,
    transportType,
    travelProgress: 0,
    factIndex: 0,
    lastGuessCorrect: null,
    revealedDestination: false,
  }
}

export function revisitDestination(state: GameState, destinationId: DestinationId): GameState {
  return {
    ...state,
    phase: 'explore',
    currentLocation: destinationId,
    targetDestination: destinationId,
    transportType: null,
    travelProgress: 0,
    factIndex: 0,
    lastGuessCorrect: null,
    revealedDestination: false,
    memoryWasNew: false,
  }
}

export function advanceTravelProgress(state: GameState, deltaMs: number, durationMs: number = 2600): GameState {
  if (state.phase !== 'travel') return state

  return {
    ...state,
    travelProgress: Math.min(1, state.travelProgress + (deltaMs / durationMs)),
  }
}

export function arriveAtDestination(state: GameState): GameState {
  if (!state.targetDestination) return state

  return {
    ...state,
    phase: 'explore',
    currentLocation: state.targetDestination,
    factIndex: 0,
    travelProgress: 1,
  }
}

export function advanceFact(state: GameState, factCount: number): GameState {
  if (state.phase !== 'explore') return state

  return {
    ...state,
    factIndex: Math.min(factCount - 1, state.factIndex + 1),
  }
}

export function finishExplore(state: GameState): GameState {
  if (state.phase !== 'explore') return state

  return {
    ...state,
    phase: 'memory-collect',
  }
}

export function collectMemory(state: GameState): GameState {
  if (!state.targetDestination) return state

  const isNew = !state.collectedMemories.includes(state.targetDestination)
  return {
    ...state,
    collectedMemories: isNew
      ? [...state.collectedMemories, state.targetDestination]
      : state.collectedMemories,
    memoryWasNew: isNew,
  }
}

export function returnToGlobe(state: GameState): GameState {
  const destination = state.targetDestination ?? state.currentLocation
  const nextIndex = destination ? DESTINATION_IDS.indexOf(destination) : 0

  return {
    ...state,
    phase: 'globe',
    currentLocation: destination,
    targetDestination: null,
    transportType: null,
    travelProgress: 0,
    factIndex: 0,
    globeSelectedIndex: nextIndex >= 0 ? nextIndex : 0,
    globeRotationOffset: (nextIndex >= 0 ? nextIndex : 0) / DESTINATION_IDS.length,
    lastGuessCorrect: null,
    revealedDestination: false,
    memoryWasNew: false,
  }
}

export function enterRoom(state: GameState): GameState {
  return { ...state, phase: 'room' }
}

export function exitRoom(state: GameState): GameState {
  return { ...state, phase: 'globe' }
}

export function resetGame(): GameState {
  return createInitialState()
}