import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advancePhase,
  autoAssistCurrentPhase,
  enterSlowMo,
  getCueSignal,
  getMissionStepLabel,
  resolveLaunchRelease,
  resolveTimingAttempt,
  setActionHeld,
  startMission,
  tickSlowMo,
  tickClock,
  updateCountdown,
  updateLaunchProgress,
  updateTimingCursor,
} from '../client/mission-orbit/state'

test('mission starts in countdown and reports the correct step label', () => {
  let state = startMission()
  assert.equal(state.phase, 'countdown')
  assert.equal(getMissionStepLabel(state), 'Step 1 / 10')

  state = tickClock(state, 1000)
  state = updateCountdown(state)
  assert.equal(state.countdownValue, 9)

  state = advancePhase(state)
  assert.equal(state.phase, 'launch')
  assert.equal(getMissionStepLabel(state), 'Step 2 / 10')
})

test('launch release and timing windows append scored burn results', () => {
  let state = advancePhase(startMission())
  assert.equal(state.phase, 'launch')

  state = setActionHeld(state, true)
  state = updateLaunchProgress(state, 1800)
  state = setActionHeld(state, false)
  state = resolveLaunchRelease(state)

  assert.equal(state.burnResults.length, 1)
  assert.match(state.outcomeText, /Main engine cutoff/)
  assert.equal(state.phaseResolved, true)

  state = advancePhase(state)
  assert.equal(state.phase, 'orbit-insertion')

  state = updateTimingCursor(state, 700, 0.00058)
  state = resolveTimingAttempt(state)

  assert.equal(state.burnResults.length, 2)
  assert.match(state.outcomeText, /Orbit raise burn/)
  assert.equal(state.burnResults[1]?.phase, 'orbit-insertion')
})

test('slow-mo rescue keeps a manual timing window open after the cue misses its normal deadline', () => {
  let state = startMission()
  state = advancePhase(state)
  state = autoAssistCurrentPhase(state)
  state = advancePhase(state)

  state = enterSlowMo(state, 'Orbit raise burn. Guidance slowed the cue. Act on the flare now.')
  state = tickSlowMo(state, 420)

  assert.equal(state.slowMoActive, true)
  assert.equal(state.slowMoElapsedMs, 420)
  assert.equal(getCueSignal(state)?.band, 'idle')

  state = updateTimingCursor(state, 2200, 0.00058)
  assert.notEqual(getCueSignal(state)?.band, 'idle')

  state = resolveTimingAttempt(state)
  assert.equal(state.phaseResolved, true)
  assert.equal(state.slowMoActive, false)
})

test('auto assist keeps the mission moving and final phase advances to celebration', () => {
  let state = startMission()
  state = advancePhase(state)
  state = autoAssistCurrentPhase(state)

  assert.equal(state.burnResults[0]?.grade, 'assist')

  while (state.phase !== 'celebration') {
    state = advancePhase(state)
  }

  assert.equal(state.missionComplete, true)
})