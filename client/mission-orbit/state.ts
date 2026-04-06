import { SCENES, type MissionState, type ScenePhase } from './types.js'

export function createInitialState(): MissionState {
  return {
    sceneIndex: 0,
    scenePhase: 'briefing',
    tapCount: 0,
    tapTarget: SCENES[0].tapTarget ?? 1,
    holdProgress: 0,
    holdActive: false,
    interactionComplete: false,
    elapsedMs: 0,
    transitionMs: 0,
  }
}

export function advanceScenePhase(state: MissionState): MissionState {
  // briefing → cinematic → interaction → transition → (next scene briefing)
  const phaseOrder: ScenePhase[] = ['briefing', 'cinematic', 'interaction', 'transition']
  const current = phaseOrder.indexOf(state.scenePhase)
  if (current === phaseOrder.length - 1) {
    return advanceToNextScene(state)
  }
  return { ...state, scenePhase: phaseOrder[current + 1], elapsedMs: 0 }
}

export function advanceToNextScene(state: MissionState): MissionState {
  const nextIndex = state.sceneIndex + 1
  if (nextIndex >= SCENES.length) {
    // Mission complete — stay on last scene, mark complete
    return { ...state, scenePhase: 'transition', interactionComplete: true }
  }
  const nextScene = SCENES[nextIndex]
  return {
    ...state,
    sceneIndex: nextIndex,
    scenePhase: 'briefing',
    tapCount: 0,
    tapTarget: nextScene.tapTarget ?? 1,
    holdProgress: 0,
    holdActive: false,
    interactionComplete: false,
    elapsedMs: 0,
    transitionMs: 0,
  }
}

export function handleTap(state: MissionState): MissionState {
  if (state.scenePhase !== 'interaction') return state
  const scene = SCENES[state.sceneIndex]
  if (scene.interactionType === 'tap-fast') {
    const newCount = state.tapCount + 1
    const complete = newCount >= state.tapTarget
    return { ...state, tapCount: newCount, interactionComplete: complete }
  }
  if (scene.interactionType === 'tap-single') {
    return { ...state, interactionComplete: true }
  }
  return state
}

export function handleHoldStart(state: MissionState): MissionState {
  if (state.scenePhase !== 'interaction') return state
  return { ...state, holdActive: true }
}

export function handleHoldEnd(state: MissionState): MissionState {
  return { ...state, holdActive: false }
}

export function tickState(state: MissionState, deltaMs: number): MissionState {
  let next = { ...state, elapsedMs: state.elapsedMs + deltaMs }

  // Briefing auto-advances after 2500ms
  if (next.scenePhase === 'briefing' && next.elapsedMs >= 2500) {
    return advanceScenePhase(next)
  }

  // Cinematic auto-advances after 3000ms
  if (next.scenePhase === 'cinematic' && next.elapsedMs >= 3000) {
    return advanceScenePhase(next)
  }

  // Hold interaction: advance holdProgress while holdActive
  const scene = SCENES[next.sceneIndex]
  if (next.scenePhase === 'interaction' && scene.interactionType === 'hold' && next.holdActive) {
    const duration = scene.holdDurationMs ?? 3000
    const progress = Math.min(1, next.holdProgress + deltaMs / duration)
    next = { ...next, holdProgress: progress }
    if (progress >= 1) {
      next = { ...next, interactionComplete: true, holdActive: false }
    }
  }

  // Hold decay when not active (decay at half the rate)
  if (next.scenePhase === 'interaction' && scene.interactionType === 'hold' && !next.holdActive && next.holdProgress > 0 && !next.interactionComplete) {
    const duration = scene.holdDurationMs ?? 3000
    const decay = deltaMs / (duration * 2)
    next = { ...next, holdProgress: Math.max(0, next.holdProgress - decay) }
  }

  // Observe: auto-complete after 4000ms elapsed in interaction
  if (next.scenePhase === 'interaction' && scene.interactionType === 'observe' && next.elapsedMs >= 4000) {
    next = { ...next, interactionComplete: true }
  }

  // Transition phase timer
  if (next.scenePhase === 'transition') {
    next = { ...next, transitionMs: next.transitionMs + deltaMs }
  }

  return next
}

export function isSceneComplete(state: MissionState): boolean {
  return state.interactionComplete
}

export function isMissionComplete(state: MissionState): boolean {
  return state.sceneIndex >= SCENES.length - 1 && state.interactionComplete
}