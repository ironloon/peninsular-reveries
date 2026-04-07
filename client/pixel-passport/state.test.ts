import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceTravelProgress,
  collectMemory,
  continueMysteryRound,
  createInitialState,
  navigateGlobe,
  prepareTravel,
  returnToGlobe,
  startExploreMode,
  startMysteryMode,
  submitMysteryGuess,
} from './state'

test('initial state preserves saved memories and solved mysteries', () => {
  const state = createInitialState({
    collectedMemories: ['paris', 'tokyo'],
    mysteryCompleted: ['paris'],
  })

  assert.equal(state.phase, 'title')
  assert.deepEqual(state.collectedMemories, ['paris', 'tokyo'])
  assert.deepEqual(state.mysteryCompleted, ['paris'])
})

test('explore mode opens the globe and mystery mode avoids selecting the answer by default', () => {
  const exploreState = startExploreMode(createInitialState())
  assert.equal(exploreState.phase, 'globe')

  const mysteryState = startMysteryMode(createInitialState(), 'paris')
  assert.equal(mysteryState.phase, 'mystery-clue')
  assert.equal(mysteryState.mysteryTarget, 'paris')
  assert.equal(mysteryState.globeSelectedIndex, 4)
})

test('travel progress clamps and returning to the globe settles the current location', () => {
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

test('mystery guesses handle correct answers, retries, and reveals after three misses', () => {
  const opening = startMysteryMode(createInitialState(), 'paris')
  const wrong = submitMysteryGuess(opening, 'cairo')
  assert.equal(wrong.outcome, 'wrong')
  assert.equal(wrong.state.phase, 'mystery-result')
  assert.equal(wrong.state.mysteryClueIndex, 1)

  const clueTwo = continueMysteryRound(wrong.state)
  const secondWrong = submitMysteryGuess(clueTwo, 'tokyo')
  const clueThree = continueMysteryRound(secondWrong.state)
  const revealed = submitMysteryGuess(clueThree, 'rio')

  assert.equal(revealed.outcome, 'revealed')
  assert.equal(revealed.state.revealedDestination, true)
  assert.deepEqual(revealed.state.mysteryCompleted, ['paris'])

  const correct = submitMysteryGuess(startMysteryMode(createInitialState(), 'tokyo'), 'tokyo')
  assert.equal(correct.outcome, 'correct')
  assert.equal(correct.state.lastGuessCorrect, true)
  assert.deepEqual(correct.state.mysteryCompleted, ['tokyo'])
})

test('globe navigation wraps at both ends', () => {
  const state = startExploreMode(createInitialState())
  const previous = navigateGlobe(state, 'previous')
  assert.equal(previous.globeSelectedIndex, 8)

  const wrapped = navigateGlobe(previous, 'next')
  assert.equal(wrapped.globeSelectedIndex, 0)
})

test('switching to mystery mode preserves collected memories', () => {
  const base = createInitialState({ collectedMemories: ['paris', 'tokyo'] })
  const inMystery = startMysteryMode(base, 'cairo')

  assert.deepEqual(inMystery.collectedMemories, ['paris', 'tokyo'])
  assert.equal(inMystery.mysteryTarget, 'cairo')
  assert.equal(inMystery.phase, 'mystery-clue')
})

test('mysteryCompleted accumulates after solving multiple mysteries', () => {
  let state = createInitialState()

  const first = submitMysteryGuess(startMysteryMode(state, 'paris'), 'paris')
  assert.equal(first.outcome, 'correct')
  assert.deepEqual(first.state.mysteryCompleted, ['paris'])

  state = createInitialState({ mysteryCompleted: first.state.mysteryCompleted })
  const second = submitMysteryGuess(startMysteryMode(state, 'cairo'), 'cairo')
  assert.equal(second.outcome, 'correct')
  assert.ok(second.state.mysteryCompleted.includes('cairo'))
})