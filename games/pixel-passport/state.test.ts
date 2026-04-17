import assert from 'node:assert/strict'
import test from 'node:test'
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
  startExploreMode,
} from './state'
import { DESTINATION_IDS } from './types'

test('initial state starts on the title screen with empty visit history', () => {
  const state = createInitialState()
  assert.equal(state.phase, 'title')
  assert.deepEqual(state.visitCounts, {})
  assert.equal(state.currentLocation, null)
})

test('explore mode opens the globe', () => {
  const state = startExploreMode(createInitialState())
  assert.equal(state.phase, 'globe')
})

test('travel progress clamps and returning to the globe settles the current location', () => {
  const state = prepareTravel(startExploreMode(createInitialState()), 'rio', 'boat')
  const progressed = advanceTravelProgress(state, 999_999)
  assert.equal(progressed.travelProgress, 1)

  const arrived = arriveAtDestination(progressed)
  const returned = returnToGlobe(arrived)

  assert.equal(returned.phase, 'globe')
  assert.equal(returned.currentLocation, 'rio')
  assert.equal(returned.targetDestination, null)
  assert.equal(returned.globeSelectedIndex, DESTINATION_IDS.indexOf('rio'))
})

test('arriving at a destination increments visit count', () => {
  const traveling = prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane')
  const arrived = arriveAtDestination(advanceTravelProgress(traveling, 999_999))
  assert.equal(arrived.visitCounts['paris'], 1)

  const returned = returnToGlobe(arrived)
  const traveling2 = prepareTravel(returned, 'paris', 'plane')
  const arrived2 = arriveAtDestination(advanceTravelProgress(traveling2, 999_999))
  assert.equal(arrived2.visitCounts['paris'], 2)
})

test('revisiting the current destination reopens explore without travel', () => {
  const arrived = arriveAtDestination(
    advanceTravelProgress(
      prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
      999_999,
    ),
  )
  const returned = returnToGlobe(arrived)
  const revisited = revisitDestination(returned, 'paris')

  assert.equal(revisited.phase, 'explore')
  assert.equal(revisited.currentLocation, 'paris')
  assert.equal(revisited.targetDestination, 'paris')
  assert.equal(revisited.transportType, null)
  assert.equal(revisited.travelProgress, 0)
  assert.equal(revisited.factIndex, 0)
})

test('revisiting increments visit count', () => {
  const arrived = arriveAtDestination(
    advanceTravelProgress(
      prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
      999_999,
    ),
  )
  assert.equal(arrived.visitCounts['paris'], 1)

  const returned = returnToGlobe(arrived)
  const revisited = revisitDestination(returned, 'paris')
  assert.equal(revisited.visitCounts['paris'], 2)
})

test('getDisplayFactIndex rotates facts on revisit', () => {
  const factCount = 3

  const arrived = arriveAtDestination(
    advanceTravelProgress(
      prepareTravel(startExploreMode(createInitialState()), 'tokyo', 'plane'),
      999_999,
    ),
  )

  assert.equal(getDisplayFactIndex(arrived, factCount), 0)
  assert.equal(getDisplayFactIndex({ ...arrived, factIndex: 1 }, factCount), 1)
  assert.equal(getDisplayFactIndex({ ...arrived, factIndex: 2 }, factCount), 2)

  const returned = returnToGlobe(arrived)
  const revisited = revisitDestination(returned, 'tokyo')

  assert.equal(getDisplayFactIndex(revisited, factCount), 1)
  assert.equal(getDisplayFactIndex({ ...revisited, factIndex: 1 }, factCount), 2)
  assert.equal(getDisplayFactIndex({ ...revisited, factIndex: 2 }, factCount), 0)

  const returned2 = returnToGlobe(revisited)
  const revisited2 = revisitDestination(returned2, 'tokyo')

  assert.equal(getDisplayFactIndex(revisited2, factCount), 2)
  assert.equal(getDisplayFactIndex({ ...revisited2, factIndex: 1 }, factCount), 0)
  assert.equal(getDisplayFactIndex({ ...revisited2, factIndex: 2 }, factCount), 1)
})

test('returning from a revisit keeps the current location selected on the globe', () => {
  const arrived = arriveAtDestination(
    advanceTravelProgress(
      prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
      999_999,
    ),
  )

  const returned = returnToGlobe(revisitDestination(returnToGlobe(arrived), 'paris'))

  assert.equal(returned.phase, 'globe')
  assert.equal(returned.currentLocation, 'paris')
  assert.equal(returned.targetDestination, null)
  assert.equal(returned.globeSelectedIndex, DESTINATION_IDS.indexOf('paris'))
})

test('resetGame clears visit history and trip bookkeeping', () => {
  const arrived = arriveAtDestination(
    advanceTravelProgress(
      prepareTravel(startExploreMode(createInitialState()), 'paris', 'plane'),
      999_999,
    ),
  )
  assert.equal(arrived.visitCounts['paris'], 1)

  const restarted = resetGame()

  assert.equal(restarted.phase, 'title')
  assert.deepEqual(restarted.visitCounts, {})
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

test('advanceFact clamps at the last fact', () => {
  const factCount = 3
  const exploring = arriveAtDestination(
    advanceTravelProgress(
      prepareTravel(startExploreMode(createInitialState()), 'cairo', 'plane'),
      999_999,
    ),
  )
  const advanced1 = advanceFact(exploring, factCount)
  assert.equal(advanced1.factIndex, 1)
  const advanced2 = advanceFact(advanced1, factCount)
  assert.equal(advanced2.factIndex, 2)
  const advanced3 = advanceFact(advanced2, factCount)
  assert.equal(advanced3.factIndex, 2)
})

test('state shape has visit tracking but no memory collection fields', () => {
  const state = createInitialState()
  assert.ok('visitCounts' in state, 'Expected visitCounts in state')
  assert.ok(!('memories' in state), 'State should not have memories field')
  assert.ok(!('collection' in state), 'State should not have collection field')
  assert.ok(!('memoryCount' in state), 'State should not have memoryCount field')
})