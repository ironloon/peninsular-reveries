import { strictEqual, ok } from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  advanceScenePhase,
  advanceToNextScene,
  createInitialState,
  handleHoldEnd,
  handleHoldStart,
  handleTap,
  isMissionComplete,
  isSceneComplete,
  tickState,
} from './state.js'
import { SCENES } from './types.js'
import type { MissionState } from './types.js'

describe('createInitialState', () => {
  test('returns correct initial values', () => {
    const s = createInitialState()
    strictEqual(s.sceneIndex, 0)
    strictEqual(s.scenePhase, 'briefing')
    strictEqual(s.tapCount, 0)
    strictEqual(s.tapTarget, SCENES[0].tapTarget ?? 1)
    strictEqual(s.holdProgress, 0)
    strictEqual(s.holdActive, false)
    strictEqual(s.interactionComplete, false)
    strictEqual(s.elapsedMs, 0)
    strictEqual(s.transitionMs, 0)
  })
})

describe('handleTap', () => {
  test('tap-fast increments tapCount', () => {
    // scene 0 is tap-fast with tapTarget 20
    let s = createInitialState()
    s = { ...s, scenePhase: 'interaction' }
    s = handleTap(s)
    strictEqual(s.tapCount, 1)
    strictEqual(s.interactionComplete, false)
  })

  test('tap-fast completes at tapTarget', () => {
    let s = createInitialState()
    s = { ...s, scenePhase: 'interaction', tapCount: 19 }
    s = handleTap(s)
    strictEqual(s.tapCount, 20)
    strictEqual(s.interactionComplete, true)
  })

  test('tap-single completes immediately', () => {
    // scene 2 (orbit-insertion) is tap-single
    let s = createInitialState()
    s = { ...s, sceneIndex: 2, scenePhase: 'interaction', tapTarget: 1 }
    s = handleTap(s)
    strictEqual(s.interactionComplete, true)
  })

  test('tap is ignored outside interaction phase', () => {
    const s = createInitialState()
    // scenePhase is 'briefing' by default
    const after = handleTap(s)
    strictEqual(after.tapCount, 0)
    strictEqual(after.interactionComplete, false)
  })
})

describe('handleHoldStart / handleHoldEnd', () => {
  test('holdActive becomes true on holdStart', () => {
    let s = createInitialState()
    s = { ...s, sceneIndex: 1, scenePhase: 'interaction' }
    s = handleHoldStart(s)
    strictEqual(s.holdActive, true)
  })

  test('holdActive becomes false on holdEnd', () => {
    let s = createInitialState()
    s = { ...s, sceneIndex: 1, scenePhase: 'interaction', holdActive: true }
    s = handleHoldEnd(s)
    strictEqual(s.holdActive, false)
  })

  test('holdStart is ignored outside interaction phase', () => {
    let s = createInitialState()
    // scenePhase is 'briefing'
    s = handleHoldStart(s)
    strictEqual(s.holdActive, false)
  })
})

describe('tickState — hold progress', () => {
  test('holdProgress increases while holdActive', () => {
    // scene 1 (ascent) is hold, holdDurationMs: 3000
    let s = createInitialState()
    s = { ...s, sceneIndex: 1, scenePhase: 'interaction', holdActive: true }
    s = tickState(s, 1500)
    ok(s.holdProgress > 0, 'holdProgress should be > 0')
    ok(s.holdProgress <= 0.5 + 0.01, 'holdProgress should be ~0.5')
    strictEqual(s.interactionComplete, false)
  })

  test('holdProgress reaches 1 and marks interactionComplete', () => {
    let s = createInitialState()
    s = { ...s, sceneIndex: 1, scenePhase: 'interaction', holdActive: true }
    s = tickState(s, 3000)
    strictEqual(s.holdProgress, 1)
    strictEqual(s.interactionComplete, true)
    strictEqual(s.holdActive, false)
  })

  test('holdProgress decays when not holding', () => {
    let s = createInitialState()
    s = { ...s, sceneIndex: 1, scenePhase: 'interaction', holdProgress: 0.5, holdActive: false }
    s = tickState(s, 100)
    ok(s.holdProgress < 0.5, 'holdProgress should decay when not holding')
  })
})

describe('tickState — briefing auto-advance', () => {
  test('briefing advances to cinematic after 2500ms', () => {
    let s = createInitialState()
    strictEqual(s.scenePhase, 'briefing')
    s = tickState(s, 2500)
    strictEqual(s.scenePhase, 'cinematic')
    strictEqual(s.elapsedMs, 0)
  })

  test('briefing does not advance before 2500ms', () => {
    let s = createInitialState()
    s = tickState(s, 2499)
    strictEqual(s.scenePhase, 'briefing')
  })
})

describe('isSceneComplete / isMissionComplete', () => {
  test('isSceneComplete returns false initially', () => {
    const s = createInitialState()
    strictEqual(isSceneComplete(s), false)
  })

  test('isSceneComplete returns true when interactionComplete', () => {
    const s = { ...createInitialState(), interactionComplete: true }
    strictEqual(isSceneComplete(s), true)
  })

  test('isMissionComplete returns false on first scene', () => {
    const s = { ...createInitialState(), interactionComplete: true }
    strictEqual(isMissionComplete(s), false)
  })

  test('isMissionComplete returns true on last scene with interactionComplete', () => {
    const s = { ...createInitialState(), sceneIndex: SCENES.length - 1, interactionComplete: true }
    strictEqual(isMissionComplete(s), true)
  })
})

describe('advanceToNextScene', () => {
  test('increments sceneIndex and resets tap/progress fields', () => {
    let s = createInitialState()
    s = { ...s, tapCount: 5, holdProgress: 0.3, interactionComplete: true }
    s = advanceToNextScene(s)
    strictEqual(s.sceneIndex, 1)
    strictEqual(s.scenePhase, 'briefing')
    strictEqual(s.tapCount, 0)
    strictEqual(s.holdProgress, 0)
    strictEqual(s.interactionComplete, false)
    strictEqual(s.elapsedMs, 0)
    strictEqual(s.transitionMs, 0)
  })

  test('tapTarget is set to next scene tapTarget', () => {
    let s = createInitialState()
    s = advanceToNextScene(s)
    const expectedTarget = SCENES[1].tapTarget ?? 1
    strictEqual(s.tapTarget, expectedTarget)
  })

  test('stays on last scene and marks complete when past end', () => {
    let s = createInitialState()
    s = { ...s, sceneIndex: SCENES.length - 1 }
    s = advanceToNextScene(s)
    strictEqual(s.sceneIndex, SCENES.length - 1)
    strictEqual(s.interactionComplete, true)
    strictEqual(s.scenePhase, 'transition')
  })
})

describe('advanceScenePhase', () => {
  test('briefing → cinematic', () => {
    let s = createInitialState()
    s = advanceScenePhase(s)
    strictEqual(s.scenePhase, 'cinematic')
    strictEqual(s.elapsedMs, 0)
  })

  test('cinematic → interaction', () => {
    let s: MissionState = { ...createInitialState(), scenePhase: 'cinematic' as const }
    s = advanceScenePhase(s)
    strictEqual(s.scenePhase, 'interaction')
  })

  test('interaction → transition', () => {
    let s: MissionState = { ...createInitialState(), scenePhase: 'interaction' as const }
    s = advanceScenePhase(s)
    strictEqual(s.scenePhase, 'transition')
  })

  test('transition → next scene briefing', () => {
    let s: MissionState = { ...createInitialState(), scenePhase: 'transition' as const }
    s = advanceScenePhase(s)
    strictEqual(s.scenePhase, 'briefing')
    strictEqual(s.sceneIndex, 1)
  })
})

describe('isSceneComplete / isMissionComplete', () => {
  test('isSceneComplete returns false when interactionComplete is false', () => {
    const s = createInitialState()
    strictEqual(isSceneComplete(s), false)
  })

  test('isSceneComplete returns true when interactionComplete is true', () => {
    const s = { ...createInitialState(), interactionComplete: true }
    strictEqual(isSceneComplete(s), true)
  })

  test('isMissionComplete returns false when on first scene with interaction complete', () => {
    const s = { ...createInitialState(), interactionComplete: true }
    strictEqual(isMissionComplete(s), false)
  })

  test('isMissionComplete returns true when on last scene with interaction complete', () => {
    const s = { ...createInitialState(), sceneIndex: SCENES.length - 1, interactionComplete: true }
    strictEqual(isMissionComplete(s), true)
  })
})

describe('tickState — cinematic auto-advance', () => {
  test('cinematic advances to interaction after 3000ms', () => {
    let s: MissionState = { ...createInitialState(), scenePhase: 'cinematic' as const }
    s = tickState(s, 3000)
    strictEqual(s.scenePhase, 'interaction')
    strictEqual(s.elapsedMs, 0)
  })

  test('cinematic does not advance before 3000ms', () => {
    let s: MissionState = { ...createInitialState(), scenePhase: 'cinematic' as const }
    s = tickState(s, 2999)
    strictEqual(s.scenePhase, 'cinematic')
  })
})