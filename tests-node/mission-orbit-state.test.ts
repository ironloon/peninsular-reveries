import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advancePhase,
  autoAssistCurrentPhase,
  endBriefing,
  enterStopMo,
  getCueSignal,
  getMissionStepLabel,
  isRecoveryActionReady,
  resolveLaunchRelease,
  resolveTimingAttempt,
  setActionHeld,
  startMission,
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
  assert.equal(state.briefingActive, true)

  state = endBriefing(state)

  state = setActionHeld(state, true)
  state = updateLaunchProgress(state, 1800)
  state = setActionHeld(state, false)
  state = resolveLaunchRelease(state)

  assert.equal(state.burnResults.length, 1)
  assert.match(state.outcomeText, /Main engine cutoff/)
  assert.equal(state.phaseResolved, true)

  state = advancePhase(state)
  assert.equal(state.phase, 'orbit-insertion')
  state = endBriefing(state)

  state = updateTimingCursor(state, 700, 0.00035)
  state = resolveTimingAttempt(state)

  assert.equal(state.burnResults.length, 2)
  assert.match(state.outcomeText, /Orbit raise burn/)
  assert.equal(state.burnResults[1]?.phase, 'orbit-insertion')
})

test('briefing pauses launch motion until the phase is activated', () => {
  let state = advancePhase(startMission())
  assert.equal(state.phase, 'launch')
  assert.equal(state.briefingActive, true)
  assert.equal(getCueSignal(state), null)

  const briefingClock = tickClock(state, 900)
  assert.equal(briefingClock.phaseElapsedMs, 900)

  const frozenProgress = updateLaunchProgress(briefingClock, 900)
  assert.equal(frozenProgress.launchProgress, 0)

  state = endBriefing(briefingClock)
  assert.equal(state.briefingActive, false)
  assert.equal(state.phaseElapsedMs, 0)

  state = setActionHeld(state, true)
  state = updateLaunchProgress(state, 900)
  assert.notEqual(state.launchProgress, 0)
})

test('stop-mo rescue freezes a manual timing window until the player acts', () => {
  let state = startMission()
  state = advancePhase(state)
  state = endBriefing(state)
  state = autoAssistCurrentPhase(state)
  state = advancePhase(state)
  state = endBriefing(state)

  state = enterStopMo(state, 'Orbit raise burn. Guidance froze the cue window. Tap when ready.')

  assert.equal(state.stopMoActive, true)
  assert.equal(getCueSignal(state)?.band, 'strike')

  const frozenState = tickClock(state, 420)
  assert.equal(frozenState.phaseElapsedMs, state.phaseElapsedMs)

  state = updateTimingCursor(state, 2200, 0.00035)
  assert.equal(state.stopMoActive, true)

  state = resolveTimingAttempt(state)
  assert.equal(state.phaseResolved, true)
  assert.equal(state.stopMoActive, false)
  assert.equal(state.burnResults[1]?.grade, 'assist')
})

test('timing cursor eases in once and latches at the cue instead of bouncing back out', () => {
  let state = startMission()
  state = advancePhase(state)
  state = endBriefing(state)
  state = autoAssistCurrentPhase(state)
  state = advancePhase(state)
  state = endBriefing(state)

  let previousCursor = state.timingCursor
  for (let index = 0; index < 12; index += 1) {
    state = updateTimingCursor(state, 700, 0.00035)
    assert.ok(state.timingCursor >= previousCursor)
    previousCursor = state.timingCursor
    if (state.timingLatched) break
  }

  assert.equal(state.timingLatched, true)
  const latchedCursor = state.timingCursor
  state = updateTimingCursor(state, 2800, 0.00035)
  assert.equal(state.timingCursor, latchedCursor)
})

test('recovery phase becomes manually completable before the celebration screen', () => {
  let state = startMission()

  while (state.phase !== 'splashdown') {
    state = advancePhase(state)
  }

  state = endBriefing(state)
  assert.equal(isRecoveryActionReady(state), false)

  state = tickClock(state, 3600)
  assert.equal(isRecoveryActionReady(state), true)
})

test('auto assist keeps the mission moving and final phase advances to celebration', () => {
  let state = startMission()
  state = advancePhase(state)
  state = endBriefing(state)
  state = autoAssistCurrentPhase(state)

  assert.equal(state.burnResults[0]?.grade, 'assist')

  while (state.phase !== 'celebration') {
    state = advancePhase(state)
  }

  assert.equal(state.missionComplete, true)
})