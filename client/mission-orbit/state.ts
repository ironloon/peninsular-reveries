import { MISSION_CREW_ROSTER, type MissionCrewProfile } from '../../app/data/mission-orbit-crew.js'
import {
  MISSION_SEQUENCE,
  TOTAL_GAMEPLAY_STEPS,
  getPhaseDefinition,
  type BurnGrade,
  type BurnResult,
  type GameState,
  type MissionGameplayPhase,
  type TimingWindow,
} from './types.js'

export type CueSignalBand = 'idle' | 'building' | 'ready' | 'strike'

export interface CueSignalState {
  readonly band: CueSignalBand
  readonly intensity: number
}

const COUNTDOWN_START = 10
const SAFE_PADDING = 0.12
const SPLASHDOWN_RECOVERY_READY_MS = 6500

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function pickCrew(): readonly MissionCrewProfile[] {
  return [...MISSION_CREW_ROSTER]
}

function phaseIndexOf(phase: MissionGameplayPhase): number {
  return MISSION_SEQUENCE.indexOf(phase)
}

function burnMessage(label: string, grade: BurnGrade): string {
  switch (grade) {
    case 'perfect': return `${label}: perfect. Right on the flight profile.`
    case 'good': return `${label}: good burn. The mission stays sharp.`
    case 'safe': return `${label}: safe burn. Guidance trimmed the edges and kept the path clean.`
    case 'assist': return `${label}: assisted. Guidance held the cue and kept the maneuver on profile.`
  }
}

function centerOf(window: TimingWindow): number {
  return (window.perfectStart + window.perfectEnd) / 2
}

function accuracyPercent(position: number, center: number): number {
  return Math.round(clamp(1 - Math.abs(position - center) * 2.2, 0, 1) * 100)
}

function evaluateWindow(
  position: number,
  window: TimingWindow,
  phase: MissionGameplayPhase,
  label: string,
  safePadding: number = SAFE_PADDING,
): BurnResult {
  const center = centerOf(window)
  const accuracy = accuracyPercent(position, center)

  if (position >= window.perfectStart && position <= window.perfectEnd) {
    return {
      phase,
      label,
      grade: 'perfect',
      accuracy,
      score: 100,
      detail: burnMessage(label, 'perfect'),
    }
  }

  if (position >= window.goodStart && position <= window.goodEnd) {
    return {
      phase,
      label,
      grade: 'good',
      accuracy,
      score: 84,
      detail: burnMessage(label, 'good'),
    }
  }

  const safeStart = clamp(window.goodStart - safePadding, 0, 1)
  const safeEnd = clamp(window.goodEnd + safePadding, 0, 1)
  if (position >= safeStart && position <= safeEnd) {
    return {
      phase,
      label,
      grade: 'safe',
      accuracy,
      score: 66,
      detail: burnMessage(label, 'safe'),
    }
  }

  return {
    phase,
    label,
    grade: 'assist',
    accuracy,
    score: 38,
    detail: burnMessage(label, 'assist'),
  }
}

function createAssistBurn(phase: MissionGameplayPhase, label: string): BurnResult {
  return {
    phase,
    label,
    grade: 'assist',
    accuracy: 0,
    score: 38,
    detail: burnMessage(label, 'assist'),
  }
}

function applyBurnResult(state: GameState, result: BurnResult): GameState {
  return {
    ...state,
    burnResults: [...state.burnResults, result],
    outcomeText: result.detail,
    outcomeGrade: result.grade,
    briefingActive: false,
    stopMoActive: false,
    phaseResolved: true,
    actionHeld: false,
    timingLatched: false,
    serviceModuleDetached: state.phase === 'service-module-jettison' ? true : state.serviceModuleDetached,
    parachuteDeployed: state.phase === 'parachute-deploy' ? true : state.parachuteDeployed,
  }
}

export function createInitialState(): GameState {
  return {
    phase: 'title',
    phaseIndex: -1,
    phaseElapsedMs: 0,
    missionElapsedMs: 0,
    crew: pickCrew(),
    briefingActive: false,
    countdownValue: COUNTDOWN_START,
    actionHeld: false,
    launchProgress: 0,
    timingCursor: 0.08,
    timingDirection: 1,
    timingLatched: false,
    burnResults: [],
    outcomeText: '',
    outcomeGrade: null,
    stopMoActive: false,
    phaseResolved: false,
    serviceModuleDetached: false,
    parachuteDeployed: false,
    missionComplete: false,
  }
}

export function startMission(): GameState {
  return {
    ...createInitialState(),
    crew: pickCrew(),
    phase: 'countdown',
    phaseIndex: 0,
  }
}

export function resetGame(): GameState {
  return createInitialState()
}

export function tickClock(state: GameState, deltaMs: number): GameState {
  if (state.phase === 'title' || state.phase === 'celebration' || state.stopMoActive) {
    return state
  }

  return {
    ...state,
    phaseElapsedMs: state.phaseElapsedMs + deltaMs,
    missionElapsedMs: state.missionElapsedMs + deltaMs,
  }
}

export function updateCountdown(state: GameState): GameState {
  if (state.phase !== 'countdown') return state

  const nextValue = Math.max(0, COUNTDOWN_START - Math.floor(state.phaseElapsedMs / 1000))
  if (nextValue === state.countdownValue) return state

  return {
    ...state,
    countdownValue: nextValue,
  }
}

export function setActionHeld(state: GameState, held: boolean): GameState {
  if (state.actionHeld === held) return state
  return {
    ...state,
    actionHeld: held,
  }
}

export function updateLaunchProgress(state: GameState, deltaMs: number): GameState {
  if (state.phase !== 'launch' || state.briefingActive || state.phaseResolved || state.stopMoActive) return state

  const nextProgress = clamp(
    state.launchProgress + (state.actionHeld ? deltaMs / 2500 : -deltaMs / 4500),
    0,
    1,
  )

  if (nextProgress === state.launchProgress) return state
  return {
    ...state,
    launchProgress: nextProgress,
  }
}

export function updateTimingCursor(state: GameState, deltaMs: number, speed: number): GameState {
  if (state.phase === 'title' || state.phase === 'celebration' || state.phase === 'countdown' || state.phase === 'launch') {
    return state
  }
  if (state.briefingActive || state.phaseResolved || state.stopMoActive || state.timingLatched) return state

  const definition = getPhaseDefinition(state.phase)
  if (!definition.timingWindow) return state

  const latchPoint = centerOf(definition.timingWindow)
  const speedScale = state.timingCursor >= definition.timingWindow.goodStart ? 0.24 : 1
  const nextPosition = state.timingCursor + deltaMs * speed * speedScale

  if (nextPosition >= latchPoint) {
    return {
      ...state,
      timingCursor: latchPoint,
      timingDirection: 1,
      timingLatched: true,
    }
  }

  return {
    ...state,
    timingCursor: clamp(nextPosition, 0, 1),
    timingDirection: 1,
  }
}

export function resolveLaunchRelease(state: GameState): GameState {
  if (state.phase !== 'launch' || state.briefingActive || state.phaseResolved) return state

  return {
    ...state,
    actionHeld: false,
    launchProgress: 1,
    outcomeText: 'Orbit reached. Orion is moving around Earth.',
    outcomeGrade: null,
    briefingActive: false,
    phaseResolved: true,
    stopMoActive: false,
    timingLatched: false,
  }
}

function narrativeOutcome(phase: MissionGameplayPhase): string {
  switch (phase) {
    case 'orbit-insertion':
      return 'Orbit set. Orion settles into its path around Earth.'
    case 'trans-lunar-injection':
      return 'Burn complete. Orion is on the way to the Moon.'
    case 'lunar-flyby':
      return 'Flyby complete. Orion is turning back toward Earth.'
    case 'service-module-jettison':
      return 'Service module clear. The crew capsule keeps falling home.'
    case 'parachute-deploy':
      return 'Parachutes open. Orion slows for splashdown.'
    default:
      return getPhaseDefinition(phase).prompt
  }
}

export function resolveNarrativePhase(state: GameState): GameState {
  if (
    state.phase === 'title'
    || state.phase === 'celebration'
    || state.phase === 'countdown'
    || state.phase === 'launch'
    || state.phase === 'high-earth-orbit'
    || state.phase === 'return-coast'
    || state.phase === 'splashdown'
    || state.briefingActive
    || state.phaseResolved
  ) {
    return state
  }

  return {
    ...state,
    actionHeld: false,
    outcomeText: narrativeOutcome(state.phase),
    outcomeGrade: null,
    briefingActive: false,
    phaseResolved: true,
    stopMoActive: false,
    timingLatched: false,
    serviceModuleDetached: state.phase === 'service-module-jettison' ? true : state.serviceModuleDetached,
    parachuteDeployed: state.phase === 'parachute-deploy' ? true : state.parachuteDeployed,
  }
}

export function resolveTimingAttempt(state: GameState): GameState {
  if (
    state.phase === 'title'
    || state.phase === 'celebration'
    || state.phase === 'countdown'
    || state.phase === 'launch'
    || state.briefingActive
    || state.phaseResolved
  ) {
    return state
  }

  const definition = getPhaseDefinition(state.phase)
  if (definition.mode !== 'hold' || !definition.timingWindow) return state

  if (state.stopMoActive) {
    return applyBurnResult(state, createAssistBurn(state.phase, definition.label))
  }

  const result = evaluateWindow(state.timingCursor, definition.timingWindow, state.phase, definition.label)
  return applyBurnResult(state, result)
}

export function autoAssistCurrentPhase(state: GameState): GameState {
  if (
    state.phase === 'title'
    || state.phase === 'celebration'
    || state.phase === 'countdown'
    || state.briefingActive
    || state.phaseResolved
  ) {
    return state
  }

  if (state.phase === 'launch') {
    return applyBurnResult(state, createAssistBurn('launch', 'Main engine cutoff'))
  }

  const definition = getPhaseDefinition(state.phase)
  return applyBurnResult(state, createAssistBurn(state.phase, definition.label))
}

export function clearOutcome(state: GameState): GameState {
  if (!state.outcomeText && !state.outcomeGrade) return state
  return {
    ...state,
    outcomeText: '',
    outcomeGrade: null,
  }
}

export function endBriefing(state: GameState): GameState {
  if (state.phase === 'title' || state.phase === 'celebration' || state.phase === 'countdown' || !state.briefingActive) {
    return state
  }

  return {
    ...state,
    briefingActive: false,
    phaseElapsedMs: 0,
  }
}

export function enterStopMo(state: GameState, message: string): GameState {
  if (
    state.phase === 'title'
    || state.phase === 'celebration'
    || state.phase === 'countdown'
    || state.briefingActive
    || state.phaseResolved
    || state.stopMoActive
  ) {
    return state
  }

  const definition = getPhaseDefinition(state.phase)
  const cueCenter = definition.timingWindow ? centerOf(definition.timingWindow) : null

  return {
    ...state,
    stopMoActive: true,
    launchProgress: state.phase === 'launch' && cueCenter !== null
      ? Math.max(state.launchProgress, cueCenter)
      : state.launchProgress,
    timingCursor: state.phase !== 'launch' && cueCenter !== null
      ? cueCenter
      : state.timingCursor,
    timingLatched: state.phase !== 'launch' && cueCenter !== null ? true : state.timingLatched,
    outcomeText: message,
    outcomeGrade: null,
  }
}

export function getCueSignal(state: GameState): CueSignalState | null {
  if (
    state.phase === 'title'
    || state.phase === 'celebration'
    || state.phase === 'countdown'
    || state.briefingActive
    || state.phaseResolved
  ) {
    return null
  }

  const definition = getPhaseDefinition(state.phase)
  if (definition.mode !== 'hold' || !definition.timingWindow) {
    return null
  }

  if (state.stopMoActive) {
    return { band: 'strike', intensity: 1 }
  }

  const position = state.phase === 'launch' ? state.launchProgress : state.timingCursor
  const center = centerOf(definition.timingWindow)
  const reach = 0.24
  const intensity = clamp(1 - Math.abs(position - center) / reach, 0, 1)

  if (position >= definition.timingWindow.perfectStart && position <= definition.timingWindow.perfectEnd) {
    return { band: 'strike', intensity: 1 }
  }

  if (position >= definition.timingWindow.goodStart && position <= definition.timingWindow.goodEnd) {
    return { band: 'ready', intensity: Math.max(0.7, intensity) }
  }

  if (intensity > 0) {
    return { band: 'building', intensity }
  }

  return { band: 'idle', intensity: 0 }
}

export function advancePhase(state: GameState): GameState {
  if (state.phase === 'title' || state.phase === 'celebration') return state

  const currentIndex = phaseIndexOf(state.phase)
  const nextPhase = MISSION_SEQUENCE[currentIndex + 1]
  if (!nextPhase) {
    return {
      ...state,
      phase: 'celebration',
      missionComplete: true,
      actionHeld: false,
      timingLatched: false,
      outcomeText: '',
      outcomeGrade: null,
      briefingActive: false,
      stopMoActive: false,
      phaseResolved: false,
    }
  }

  const nextDefinition = getPhaseDefinition(nextPhase)

  return {
    ...state,
    phase: nextPhase,
    phaseIndex: currentIndex + 1,
    phaseElapsedMs: 0,
    briefingActive: Boolean(nextDefinition.briefingMs),
    countdownValue: nextPhase === 'countdown' ? COUNTDOWN_START : state.countdownValue,
    actionHeld: false,
    launchProgress: nextPhase === 'launch' ? 0 : state.launchProgress,
    timingCursor: 0.08,
    timingDirection: 1,
    timingLatched: false,
    outcomeText: '',
    outcomeGrade: null,
    stopMoActive: false,
    phaseResolved: false,
    parachuteDeployed: nextPhase === 'parachute-deploy' ? false : state.parachuteDeployed,
  }
}

export function getMissionTimeLabel(state: GameState): string {
  const totalSeconds = Math.floor(state.missionElapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getMissionStepLabel(state: GameState): string {
  const step = state.phaseIndex < 0 ? 0 : Math.min(state.phaseIndex + 1, TOTAL_GAMEPLAY_STEPS)
  return `Step ${step} / ${TOTAL_GAMEPLAY_STEPS}`
}

export function isRecoveryActionReady(state: GameState): boolean {
  return state.phase === 'splashdown' && !state.briefingActive && state.phaseElapsedMs >= SPLASHDOWN_RECOVERY_READY_MS
}