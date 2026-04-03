import { pulseElement } from './animations.js'
import {
  announceBurnResult,
  announceCountdown,
  announceKeepHolding,
  announceMissionComplete,
  announcePhase,
  announceSlowMoCue,
  moveFocusAfterTransition,
  updatePhaseDescription,
} from './accessibility.js'
import { setupInput, type InputCallbacks } from './input.js'
import {
  getOutcomeElement,
  renderEndScreen,
  renderMission,
  setupSettingsModal,
  showScreen,
} from './renderer.js'
import {
  advancePhase,
  autoAssistCurrentPhase,
  createInitialState,
  enterSlowMo,
  getCueSignal,
  getMissionTimeLabel,
  resetGame,
  resolveLaunchRelease,
  resolveTimingAttempt,
  setActionHeld,
  startMission,
  tickClock,
  tickSlowMo,
  updateCountdown,
  updateLaunchProgress,
  updateTimingCursor,
  type CueSignalBand,
} from './state.js'
import {
  ensureAudioUnlocked,
  getMusicEnabled,
  setMusicEnabled,
  sfxCueApproach,
  sfxCueReady,
  sfxCueStrike,
  sfxBurnPulse,
  sfxBurnResult,
  sfxBurnWindow,
  sfxButton,
  sfxCelebration,
  sfxCountdownBeep,
  sfxEngineIgnition,
  sfxLiftoff,
  sfxParachute,
  sfxReentry,
  sfxSlowMo,
  sfxSplashdown,
  syncMusicPlayback,
} from './sounds.js'
import { getPhaseDefinition, type GameState, type MissionGameplayPhase } from './types.js'

let state: GameState = createInitialState()
let lastFrame = performance.now()
let phaseAdvanceTimer: number | null = null
let lastCountdownValue = state.countdownValue
let lastPhase: GameState['phase'] = state.phase
let enginePulseBudgetMs = 0
let lastBurnCount = 0
let lastCueBand: CueSignalBand | null = null
let lastSlowMoActive = false

const SLOW_MO_DURATION_MS = 1400

const musicToggle = document.getElementById('music-enabled-toggle') as HTMLInputElement | null

if (musicToggle) {
  musicToggle.checked = getMusicEnabled()
  musicToggle.addEventListener('change', () => {
    ensureAudioUnlocked()
    setMusicEnabled(musicToggle.checked)
    syncMusicPlayback(state.phase)
  })
}

setupSettingsModal()

function currentPhaseDefinition() {
  if (state.phase === 'title' || state.phase === 'celebration') return null
  return getPhaseDefinition(state.phase)
}

function clearAdvanceTimer(): void {
  if (phaseAdvanceTimer !== null) {
    window.clearTimeout(phaseAdvanceTimer)
    phaseAdvanceTimer = null
  }
}

function onPhaseEntered(previousPhase: GameState['phase']): void {
  if (state.phase === previousPhase) return

  lastCueBand = null
  lastSlowMoActive = false

  syncMusicPlayback(state.phase)

  if (state.phase === 'celebration') {
    renderEndScreen(state)
    showScreen('end-screen')
    sfxCelebration()
    announceMissionComplete(getMissionTimeLabel(state))
    moveFocusAfterTransition('replay-btn', 260)
    return
  }

  if (state.phase === 'title') {
    showScreen('start-screen')
    moveFocusAfterTransition('start-btn', 220)
    return
  }

  const definition = getPhaseDefinition(state.phase)
  announcePhase(definition.label, definition.prompt, definition.dayLabel)
  updatePhaseDescription(`${definition.label}. ${definition.prompt}`)

  if (state.phase === 'launch') {
    sfxLiftoff()
  }
  if (definition.mode === 'timing') {
    sfxBurnWindow()
  }
  if (state.phase === 'service-module-jettison') {
    sfxReentry()
  }
  if (state.phase === 'splashdown') {
    sfxSplashdown()
  }

  renderMission(state)

  if (definition.mode === 'hold' || definition.mode === 'timing') {
    moveFocusAfterTransition('mission-action-btn', 180)
  }
}

function goToNextPhase(): void {
  clearAdvanceTimer()
  const previousPhase = state.phase
  state = advancePhase(state)
  lastPhase = state.phase
  onPhaseEntered(previousPhase)
}

function scheduleNextPhase(delayMs: number): void {
  clearAdvanceTimer()
  phaseAdvanceTimer = window.setTimeout(() => {
    phaseAdvanceTimer = null
    goToNextPhase()
  }, delayMs)
}

function handleBurnResolved(): void {
  const latestBurn = state.burnResults[state.burnResults.length - 1]
  if (!latestBurn) return

  sfxBurnResult(latestBurn.grade)
  announceBurnResult(latestBurn)
  if (state.phase === 'parachute-deploy') {
    sfxParachute()
  }
  void pulseElement(
    getOutcomeElement(),
    latestBurn.grade === 'assist' ? 'outcome-pulse-assist' : 'outcome-pulse-success',
  )
  scheduleNextPhase(1100)
}

function resolveCurrentPhase(assisted: boolean): void {
  const previousBurnCount = state.burnResults.length

  if (assisted) {
    state = autoAssistCurrentPhase(state)
  } else if (state.phase === 'launch') {
    state = resolveLaunchRelease(state)
  } else {
    state = resolveTimingAttempt(state)
  }

  renderMission(state)

  if (state.burnResults.length > previousBurnCount) {
    handleBurnResolved()
  }
}

function buildSlowMoMessage(): string {
  if (state.phase === 'launch') {
    return 'Guidance slowed the cutoff moment. Release now.'
  }

  const definition = currentPhaseDefinition()
  return definition
    ? `${definition.label}. Guidance slowed the cue. Act on the flare now.`
    : 'Guidance slowed the cue. Act now.'
}

function triggerSlowMoRescue(): void {
  const message = buildSlowMoMessage()
  state = enterSlowMo(state, message)
  announceSlowMoCue(message)
  sfxSlowMo()
}

function syncCueAudio(): void {
  const cueSignal = getCueSignal(state)
  const nextCueBand = cueSignal?.band ?? null

  if (state.slowMoActive && !lastSlowMoActive) {
    lastSlowMoActive = true
    lastCueBand = nextCueBand
    return
  }

  if (!state.slowMoActive && nextCueBand !== lastCueBand) {
    if (nextCueBand === 'building') {
      sfxCueApproach()
    } else if (nextCueBand === 'ready') {
      sfxCueReady()
    } else if (nextCueBand === 'strike') {
      sfxCueStrike()
    }
  }

  lastCueBand = nextCueBand
  lastSlowMoActive = state.slowMoActive
}

function startGame(): void {
  ensureAudioUnlocked()
  sfxButton()
  clearAdvanceTimer()
  state = startMission()
  lastPhase = state.phase
  lastCountdownValue = state.countdownValue
  lastBurnCount = 0
  lastCueBand = null
  lastSlowMoActive = false
  showScreen('mission-screen')
  renderMission(state)
  onPhaseEntered('title')
}

function replayGame(): void {
  clearAdvanceTimer()
  sfxButton()
  state = resetGame()
  lastPhase = state.phase
  lastCountdownValue = state.countdownValue
  lastBurnCount = 0
  lastCueBand = null
  lastSlowMoActive = false
  syncMusicPlayback(state.phase)
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 220)
}

const callbacks: InputCallbacks = {
  onStartGame: startGame,
  onActionStart: () => {
    ensureAudioUnlocked()

    if (state.phase === 'title') {
      startGame()
      return
    }

    if (state.phase === 'celebration') {
      replayGame()
      return
    }

    const definition = currentPhaseDefinition()
    if (!definition || state.phaseResolved) return

    if (definition.mode === 'hold') {
      state = setActionHeld(state, true)
      renderMission(state)
      return
    }

    if (definition.mode === 'timing') {
      resolveCurrentPhase(false)
    }
  },
  onActionEnd: () => {
    const definition = currentPhaseDefinition()
    if (!definition || definition.mode !== 'hold' || state.phaseResolved || !state.actionHeld) return

    state = setActionHeld(state, false)

    if (state.launchProgress < 0.35) {
      renderMission(state)
      announceKeepHolding()
      return
    }

    resolveCurrentPhase(false)
  },
  onReplay: replayGame,
}

setupInput(() => state, callbacks)

document.addEventListener('visibilitychange', () => {
  syncMusicPlayback(state.phase)
})

function tick(now: number): void {
  const deltaMs = Math.min(now - lastFrame, 80)
  lastFrame = now

  if (!document.hidden && state.phase !== 'title' && state.phase !== 'celebration') {
    state = tickClock(state, deltaMs)

    if (state.phase === 'countdown') {
      state = updateCountdown(state)

      if (state.countdownValue !== lastCountdownValue) {
        if (state.countdownValue > 0) {
          sfxCountdownBeep(state.countdownValue)
        }
        if (state.countdownValue === 7) {
          sfxEngineIgnition()
        }
        announceCountdown(state.countdownValue)
        lastCountdownValue = state.countdownValue
      }

      if (state.phaseElapsedMs >= 10000) {
        goToNextPhase()
      }
    } else if (state.phase === 'launch') {
      state = updateLaunchProgress(state, deltaMs)

      if (state.actionHeld) {
        enginePulseBudgetMs += deltaMs
        if (enginePulseBudgetMs >= 360) {
          sfxBurnPulse()
          enginePulseBudgetMs = 0
        }
      } else {
        enginePulseBudgetMs = 0
      }

      const definition = getPhaseDefinition('launch')
      if (!state.phaseResolved && state.slowMoActive) {
        state = tickSlowMo(state, deltaMs)
        if (state.slowMoElapsedMs >= SLOW_MO_DURATION_MS) {
          resolveCurrentPhase(true)
        }
      } else if (!state.phaseResolved && ((definition.assistAfterMs && state.phaseElapsedMs >= definition.assistAfterMs) || state.launchProgress >= 1)) {
        triggerSlowMoRescue()
      }
    } else {
      const definition = getPhaseDefinition(state.phase as MissionGameplayPhase)

      if (definition.mode === 'timing' && !state.phaseResolved) {
        state = updateTimingCursor(state, deltaMs, definition.meterSpeed ?? 0.00064)

        if (state.slowMoActive) {
          state = tickSlowMo(state, deltaMs)
          if (state.slowMoElapsedMs >= SLOW_MO_DURATION_MS) {
            resolveCurrentPhase(true)
          }
        } else if (definition.assistAfterMs && state.phaseElapsedMs >= definition.assistAfterMs) {
          triggerSlowMoRescue()
        }
      }

      if (definition.mode === 'auto' && definition.autoAdvanceMs && state.phaseElapsedMs >= definition.autoAdvanceMs) {
        goToNextPhase()
      }
    }

    if (state.phase !== 'celebration') {
      syncCueAudio()
      renderMission(state)
    }
  }

  if (state.phase !== lastPhase) {
    onPhaseEntered(lastPhase)
    lastPhase = state.phase
  }

  if (state.burnResults.length !== lastBurnCount) {
    lastBurnCount = state.burnResults.length
  }

  requestAnimationFrame(tick)
}

requestAnimationFrame(tick)