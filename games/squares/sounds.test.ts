import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_SQUARES_MUSIC_PROFILE_ID,
  getSquaresMusicProfile,
  SQUARES_MUSIC_PROFILES,
} from './sounds.js'

test('chill is the default Squares music profile', () => {
  assert.equal(DEFAULT_SQUARES_MUSIC_PROFILE_ID, 'chill')
  assert.equal(getSquaresMusicProfile(DEFAULT_SQUARES_MUSIC_PROFILE_ID).label, 'Chill')
})

test('tense Squares music profile is available', () => {
  const tenseProfile = getSquaresMusicProfile('tense')

  assert.equal(tenseProfile.id, 'tense')
  assert.equal(tenseProfile.label, 'Tense')
})

test('Squares music profiles expose deterministic scheduling metadata', () => {
  for (const profile of SQUARES_MUSIC_PROFILES) {
    assert.ok(profile.tempoBpm > 0)
    assert.ok(profile.stepsPerBeat > 0)
    assert.ok(profile.loopBeats > 0)
    assert.ok(profile.events.length > 0)

    let previousStep = -1
    for (const event of profile.events) {
      assert.ok(Number.isInteger(event.startStep))
      assert.ok(Number.isInteger(event.durationSteps))
      assert.ok(event.startStep >= 0)
      assert.ok(event.durationSteps > 0)
      assert.ok(event.frequency > 0)
      assert.ok(event.gain > 0)
      assert.ok(event.startStep >= previousStep)
      previousStep = event.startStep
    }
  }
})