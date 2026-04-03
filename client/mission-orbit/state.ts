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

const COUNTDOWN_START = 10

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function phaseIndexOf(phase: MissionGameplayPhase): number {
  return MISSION_SEQUENCE.indexOf(phase)
}

function burnMessage(label: string, grade: BurnGrade): string {
  switch (grade) {
    case 'perfect': return `${label}: perfect. Right on the flight profile.`
    case 'good': return `${label}: good burn. The mission stays sharp.`
    case 'safe': return `${label}: safe burn. Guidance trimmed the edges and kept the path clean.`
    case 'assist': return `${label}: assisted. Autopilot nudged the maneuver back onto profile.`
  }
}

function centerOf(window: TimingWindow): number {
  return (window.perfectStart + window.perfectEnd) / 2
}

function accuracyPercent(position: number, center: number): number {
  return Math.round(clamp(1 - Math.abs(position - center) * 2.2, 0, 1) * 100)
}

function evaluateWindow(position: number, window: TimingWindow, phase: MissionGameplayPhase, label: string): BurnResult {
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

  const safeStart = clamp(window.goodStart - 0.08, 0, 1)
  const safeEnd = clamp(window.goodEnd + 0.08, 0, 1)
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
    phaseResolved: true,
    actionHeld: false,
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
    countdownValue: COUNTDOWN_START,
    actionHeld: false,
    launchProgress: 0,
    timingCursor: 0.08,
    timingDirection: 1,
    burnResults: [],
    outcomeText: '',
    outcomeGrade: null,
    phaseResolved: false,
    serviceModuleDetached: false,
    parachuteDeployed: false,
    missionComplete: false,
  }
}

export function startMission(): GameState {
  return {
    ...createInitialState(),
    phase: 'countdown',
    phaseIndex: 0,
  }
}

export function resetGame(): GameState {
  return createInitialState()
}

export function tickClock(state: GameState, deltaMs: number): GameState {
  if (state.phase === 'title' || state.phase === 'celebration') {
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
  if (state.phase !== 'launch' || state.phaseResolved) return state

  const poweredClimb = state.actionHeld ? deltaMs / 2300 : -deltaMs / 6000
  const passiveClimb = deltaMs / 18000
  const nextProgress = clamp(state.launchProgress + poweredClimb + passiveClimb, 0, 1)

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
  if (state.phaseResolved) return state

  let nextPosition = state.timingCursor + deltaMs * speed * state.timingDirection
  let nextDirection = state.timingDirection

  while (nextPosition > 1 || nextPosition < 0) {
    if (nextPosition > 1) {
      nextPosition = 1 - (nextPosition - 1)
      nextDirection = -1
    } else if (nextPosition < 0) {
      nextPosition = -nextPosition
      nextDirection = 1
    }
  }

  return {
    ...state,
    timingCursor: clamp(nextPosition, 0, 1),
    timingDirection: nextDirection,
  }
}

export function resolveLaunchRelease(state: GameState): GameState {
  if (state.phase !== 'launch' || state.phaseResolved) return state

  const definition = getPhaseDefinition('launch')
  const result = evaluateWindow(state.launchProgress, definition.timingWindow!, 'launch', 'Main engine cutoff')
  return applyBurnResult(state, result)
}

export function resolveTimingAttempt(state: GameState): GameState {
  if (
    state.phase === 'title'
    || state.phase === 'celebration'
    || state.phase === 'countdown'
    || state.phase === 'launch'
    || state.phaseResolved
  ) {
    return state
  }

  const definition = getPhaseDefinition(state.phase)
  if (definition.mode !== 'timing' || !definition.timingWindow) return state

  const result = evaluateWindow(state.timingCursor, definition.timingWindow, state.phase, definition.label)
  return applyBurnResult(state, result)
}

export function autoAssistCurrentPhase(state: GameState): GameState {
  if (
    state.phase === 'title'
    || state.phase === 'celebration'
    || state.phase === 'countdown'
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
      outcomeText: '',
      outcomeGrade: null,
      phaseResolved: false,
    }
  }

  return {
    ...state,
    phase: nextPhase,
    phaseIndex: currentIndex + 1,
    phaseElapsedMs: 0,
    countdownValue: nextPhase === 'countdown' ? COUNTDOWN_START : state.countdownValue,
    actionHeld: false,
    launchProgress: nextPhase === 'launch' ? 0 : state.launchProgress,
    timingCursor: 0.08,
    timingDirection: 1,
    outcomeText: '',
    outcomeGrade: null,
    phaseResolved: false,
    parachuteDeployed: nextPhase === 'parachute-deploy' ? false : state.parachuteDeployed,
  }
}

export function getMissionRating(results: readonly BurnResult[]): string {
  if (results.length === 0) return 'awaiting burns'

  const average = results.reduce((total, result) => total + result.score, 0) / results.length
  if (average >= 90) return 'crisp and clean'
  if (average >= 75) return 'steady hands'
  if (average >= 60) return 'safe return'
  return 'guidance-assisted'
}

export function getMissionSummary(results: readonly BurnResult[]): string {
  if (results.length === 0) return 'No burns logged yet.'

  const counts = {
    perfect: 0,
    good: 0,
    safe: 0,
    assist: 0,
  }

  for (const result of results) {
    counts[result.grade] += 1
  }

  const parts: string[] = []
  if (counts.perfect > 0) parts.push(`${counts.perfect} perfect`)
  if (counts.good > 0) parts.push(`${counts.good} good`)
  if (counts.safe > 0) parts.push(`${counts.safe} safe`)
  if (counts.assist > 0) parts.push(`${counts.assist} assisted`)

  return parts.join(' - ')
}

export function getMissionScore(results: readonly BurnResult[]): number {
  return results.reduce((total, result) => total + result.score, 0)
}

export function getMissionTimeLabel(state: GameState): string {
  const totalSeconds = Math.floor(state.missionElapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getBurnCards(results: readonly BurnResult[]): readonly string[] {
  if (results.length === 0) {
    return ['No manual burns were logged.']
  }

  return results.map((result) => `${result.label} - ${result.grade} (${result.accuracy}%)`)
}

export function getMissionStepLabel(state: GameState): string {
  const step = state.phaseIndex < 0 ? 0 : Math.min(state.phaseIndex + 1, TOTAL_GAMEPLAY_STEPS)
  return `Step ${step} / ${TOTAL_GAMEPLAY_STEPS}`
}