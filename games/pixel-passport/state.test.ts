import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceTravelProgress,
  collectMemory,
  createInitialState,
  navigateGlobe,
  prepareTravel,
  resetGame,
  returnToGlobe,
  revisitDestination,
  startExploreMode,
} from './state'
import { DESTINATION_IDS } from './types'

test('initial state preserves saved memories', () => {
  const state = createInitialState({
    collectedMemories: ['paris', 'tokyo'],
  })

  assert.equal(state.phase, 'title')
  assert.deepEqual(state.collectedMemories, ['paris', 'tokyo'])
})

test('explore mode opens the globe', () => {
  const state = startExploreMode(createInitialState())
  assert.equal(state.phase, 'globe')
})

test('travel progress clamps and returning to the globe settles the current location for a new trip', () => {
  const state = prepareTravel(startExploreMode(createInitialState()), 'rio', 'boat')
  const progressed = advanceTravelProgress(state, 999_999)
  assert.equal(progressed.travelProgress, 1)

  const returned = returnToGlobe({
    ...progressed,
    phase: 'memory-collect',
    memoryWasNew: true,
  })

  assert.equal(returned.phase, 'globe')
  assert.equal(returned.currentLocation, 'rio')
  assert.equal(returned.targetDestination, null)
  assert.equal(returned.globeSelectedIndex, DESTINATION_IDS.indexOf('rio'))
})

test('collecting a memory records whether it was new', () => {
  const firstPass = collectMemory({
    ...prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
    phase: 'memory-collect',
  })

  assert.deepEqual(firstPass.collectedMemories, ['paris'])
  assert.equal(firstPass.memoryWasNew, true)

  const revisit = collectMemory({
    ...firstPass,
    targetDestination: 'paris',
    phase: 'memory-collect',
  })

  assert.deepEqual(revisit.collectedMemories, ['paris'])
  assert.equal(revisit.memoryWasNew, false)
})

test('revisiting the current destination reopens explore without travel state', () => {
  const visitedParis = returnToGlobe(collectMemory({
    ...prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
    phase: 'memory-collect',
  }))

  const revisited = revisitDestination(visitedParis, 'paris')

  assert.equal(revisited.phase, 'explore')
  assert.equal(revisited.currentLocation, 'paris')
  assert.equal(revisited.targetDestination, 'paris')
  assert.equal(revisited.transportType, null)
  assert.equal(revisited.travelProgress, 0)
  assert.equal(revisited.factIndex, 0)
  assert.equal(revisited.memoryWasNew, false)
})

test('returning from a revisit keeps the current location selected on the globe', () => {
  const visitedParis = returnToGlobe(collectMemory({
    ...prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
    phase: 'memory-collect',
  }))

  const returned = returnToGlobe(collectMemory({
    ...revisitDestination(visitedParis, 'paris'),
    phase: 'memory-collect',
  }))

  assert.equal(returned.phase, 'globe')
  assert.equal(returned.currentLocation, 'paris')
  assert.equal(returned.targetDestination, null)
  assert.equal(returned.globeSelectedIndex, DESTINATION_IDS.indexOf('paris'))
  assert.deepEqual(returned.collectedMemories, ['paris'])
})

test('resetGame clears memories and trip bookkeeping for a fresh start', () => {
  const restoredState = createInitialState({
    collectedMemories: ['paris', 'tokyo'],
  })

  assert.deepEqual(restoredState.collectedMemories, ['paris', 'tokyo'])

  const restarted = resetGame()

  assert.equal(restarted.phase, 'title')
  assert.deepEqual(restarted.collectedMemories, [])
  assert.equal(restarted.currentLocation, null)
  assert.equal(restarted.targetDestination, null)
  assert.equal(restarted.transportType, null)
  assert.equal(restarted.travelProgress, 0)
})

test('globe navigation wraps at both ends', () => {
  const state = startExploreMode(createInitialState())
  const previous = navigateGlobe(state, 'previous')
  assert.equal(previous.globeSelectedIndex, 8)

  const wrapped = navigateGlobe(previous, 'next')
  assert.equal(wrapped.globeSelectedIndex, 0)
})