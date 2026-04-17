import { DESTINATION_IDS, type DestinationId, type GameState, type NavigationDirection, type TransportType } from './types.js'

function wrapIndex(value: number, count: number): number {
  return ((value % count) + count) % count
}

export function createInitialState(): GameState {
  return {
    phase: 'title',
    currentLocation: null,
    targetDestination: null,
    transportType: null,
    travelProgress: 0,
    factIndex: 0,
    globeSelectedIndex: 0,
    globeRotationOffset: 0,
    visitCounts: {},
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
  }
}

export function revisitDestination(state: GameState, destinationId: DestinationId): GameState {
  const visitCount = (state.visitCounts[destinationId] ?? 0) + 1
  return {
    ...state,
    phase: 'explore',
    currentLocation: destinationId,
    targetDestination: destinationId,
    transportType: null,
    travelProgress: 0,
    factIndex: 0,
    visitCounts: { ...state.visitCounts, [destinationId]: visitCount },
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

  const visitCount = (state.visitCounts[state.targetDestination] ?? 0) + 1
  return {
    ...state,
    phase: 'explore',
    currentLocation: state.targetDestination,
    factIndex: 0,
    travelProgress: 1,
    visitCounts: { ...state.visitCounts, [state.targetDestination]: visitCount },
  }
}

export function advanceFact(state: GameState, factCount: number): GameState {
  if (state.phase !== 'explore') return state

  return {
    ...state,
    factIndex: Math.min(factCount - 1, state.factIndex + 1),
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
  }
}

export function resetGame(): GameState {
  return createInitialState()
}

export function getDisplayFactIndex(state: GameState, factCount: number): number {
  const destinationId = state.targetDestination ?? state.currentLocation
  if (!destinationId || factCount === 0) return state.factIndex
  const visitCount = state.visitCounts[destinationId] ?? 1
  const offset = (visitCount - 1) % factCount
  return (state.factIndex + offset) % factCount
}