import { DEFAULT_CREW_IDS } from '../../app/data/mission-orbit-crew.js'
import { pulseElement } from './animations.js'
import {
  announceBurnResult,
  announceCountdown,
  announceKeepHolding,
  announceMissionComplete,
  announcePhase,
  announcePhaseReady,
  announceStopMoCue,
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
  endBriefing,
  enterStopMo,
  getCueSignal,
  isRecoveryActionReady,
  getMissionTimeLabel,
  resetGame,
  resolveLaunchRelease,
  resolveTimingAttempt,
  setActionHeld,
  startMission,
  tickClock,
  updateCountdown,
  updateLaunchProgress,
  updateTimingCursor,
  type CueSignalBand,
} from './state.js'
import {
  ensureAudioUnlocked,
  getMusicEnabled,
  getSfxIntensityMode,
  loadSamples,
  setSfxIntensityMode,
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
  sfxStopMo,
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
let lastStopMoActive = false

const crewCheckboxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="mission-crew"]'))
const crewPickerHelp = document.getElementById('crew-picker-help') as HTMLElement | null

function syncCrewPicker(): void {
  if (crewCheckboxes.length === 0) return

  const selectedCount = crewCheckboxes.filter((checkbox) => checkbox.checked).length
  const lockOpenSeats = selectedCount >= 3

  for (const checkbox of crewCheckboxes) {
    checkbox.disabled = !checkbox.checked && lockOpenSeats
  }

  if (!crewPickerHelp) return

  if (selectedCount === 3) {
    crewPickerHelp.textContent = 'Crew locked in. They will appear during boarding, lunar flyby, and recovery.'
    return
  }

  const remaining = Math.max(0, 3 - selectedCount)
  crewPickerHelp.textContent = `Choose ${remaining} more crew member${remaining === 1 ? '' : 's'}, or launch with the defaults.`
}

function readSelectedCrewIds(): string[] {
  const selectedIds = crewCheckboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value)

  const fallbackIds = DEFAULT_CREW_IDS.filter((id) => !selectedIds.includes(id))
  return [...selectedIds, ...fallbackIds].slice(0, 3)
}

for (const checkbox of crewCheckboxes) {
  checkbox.addEventListener('change', syncCrewPicker)
}

syncCrewPicker()

function primeMissionAudio(): void {
  ensureAudioUnlocked()
  void loadSamples()
}

const musicToggle = document.getElementById('music-enabled-toggle') as HTMLInputElement | null
const sfxIntensitySelect = document.getElementById('sound-intensity-select') as HTMLSelectElement | null

if (musicToggle) {
  musicToggle.checked = getMusicEnabled()
  musicToggle.addEventListener('change', () => {
    primeMissionAudio()
    setMusicEnabled(musicToggle.checked)
    syncMusicPlayback(state.phase)
  })
}

if (sfxIntensitySelect) {
  sfxIntensitySelect.value = getSfxIntensityMode()
  sfxIntensitySelect.addEventListener('change', () => {
    primeMissionAudio()
    setSfxIntensityMode(sfxIntensitySelect.value === 'light' ? 'light' : 'heavy')
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

function playPhaseActivationAudio(): void {
  if (state.phase === 'title' || state.phase === 'celebration') return

  const definition = getPhaseDefinition(state.phase)

  if (definition.mode === 'timing') {
    sfxBurnWindow()
  }
  if (state.phase === 'service-module-jettison') {
    sfxReentry()
  }
  if (state.phase === 'splashdown') {
    sfxSplashdown()
  }
}

function buildPhaseReadyMessage(): string {
  const definition = currentPhaseDefinition()
  if (!definition) return ''

  if (definition.mode === 'hold') {
    return `${definition.label}. Action live. ${definition.timingHint}`
  }

  if (definition.mode === 'timing') {
    return `${definition.label}. Action live. ${definition.timingHint}`
  }

  return `${definition.label}. Segment under way.`
}

function finishBriefing(): void {
  if (!state.briefingActive) return

  state = endBriefing(state)
  playPhaseActivationAudio()

  const readyMessage = buildPhaseReadyMessage()
  if (readyMessage) {
    announcePhaseReady(readyMessage)
  }
}

function onPhaseEntered(previousPhase: GameState['phase']): void {
  if (state.phase === previousPhase) return

  lastCueBand = null
  lastStopMoActive = false

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

  if (!state.briefingActive) {
    playPhaseActivationAudio()
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
  scheduleNextPhase(2200)
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

function buildStopMoMessage(): string {
  if (state.phase === 'launch') {
    return 'Guidance is holding main engine cutoff. Let go when you are ready.'
  }

  const definition = currentPhaseDefinition()
  return definition
    ? `${definition.label}. Guidance is holding the cue. Act when you are ready.`
    : 'Guidance is holding the cue. Act when you are ready.'
}

function triggerStopMoRescue(): void {
  const message = buildStopMoMessage()
  state = enterStopMo(state, message)
  announceStopMoCue(message)
  sfxStopMo()
}

function syncCueAudio(): void {
  const cueSignal = getCueSignal(state)
  const nextCueBand = cueSignal?.band ?? null

  if (state.stopMoActive && !lastStopMoActive) {
    lastStopMoActive = true
    lastCueBand = nextCueBand
    return
  }

  if (!state.stopMoActive && nextCueBand !== lastCueBand) {
    if (nextCueBand === 'building') {
      sfxCueApproach()
    } else if (nextCueBand === 'ready') {
      sfxCueReady()
    } else if (nextCueBand === 'strike') {
      sfxCueStrike()
    }
  }

  lastCueBand = nextCueBand
  lastStopMoActive = state.stopMoActive
}

function startGame(): void {
  primeMissionAudio()
  sfxButton()
  clearAdvanceTimer()
  state = startMission(readSelectedCrewIds())
  lastPhase = state.phase
  lastCountdownValue = state.countdownValue
  lastBurnCount = 0
  lastCueBand = null
  lastStopMoActive = false
  enginePulseBudgetMs = 0
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
  lastStopMoActive = false
  enginePulseBudgetMs = 0
  syncMusicPlayback(state.phase)
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 220)
}

const callbacks: InputCallbacks = {
  onStartGame: startGame,
  onActionStart: () => {
    primeMissionAudio()

    if (state.phase === 'title') {
      startGame()
      return
    }

    if (state.phase === 'celebration') {
      replayGame()
      return
    }

    if (state.phase === 'splashdown' && !state.briefingActive) {
      if (isRecoveryActionReady(state)) {
        sfxButton()
        goToNextPhase()
      }
      return
    }

    const definition = currentPhaseDefinition()
    if (!definition || state.phaseResolved) return

    if (state.briefingActive) {
      finishBriefing()

      if (definition.mode === 'hold') {
        state = setActionHeld(state, true)
      }

      renderMission(state)
      return
    }

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

    if (!state.stopMoActive && state.launchProgress < 0.35) {
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

    const definition = currentPhaseDefinition()
    if (definition && state.briefingActive && definition.briefingMs && state.phaseElapsedMs >= definition.briefingMs) {
      finishBriefing()
    }

    if (state.phase === 'countdown') {
      state = updateCountdown(state)

      if (state.countdownValue !== lastCountdownValue) {
        if (state.countdownValue > 0) {
          sfxCountdownBeep(state.countdownValue)
        }
        if (state.countdownValue === 7) {
          sfxEngineIgnition()
        }
        if (state.countdownValue === 0) {
          sfxLiftoff()
        }
        announceCountdown(state.countdownValue)
        lastCountdownValue = state.countdownValue
      }

      if (state.phaseElapsedMs >= 10000) {
        goToNextPhase()
      }
    } else if (state.phase === 'launch') {
      state = updateLaunchProgress(state, deltaMs)

      if (state.actionHeld && !state.stopMoActive) {
        enginePulseBudgetMs += deltaMs
        if (enginePulseBudgetMs >= 360) {
          sfxBurnPulse()
          enginePulseBudgetMs = 0
        }
      } else {
        enginePulseBudgetMs = 0
      }

      const definition = getPhaseDefinition('launch')
      if (!state.briefingActive && !state.phaseResolved && !state.stopMoActive && ((definition.assistAfterMs && state.phaseElapsedMs >= definition.assistAfterMs) || state.launchProgress >= 1)) {
        triggerStopMoRescue()
      }
    } else {
      const definition = getPhaseDefinition(state.phase as MissionGameplayPhase)

      if (!state.briefingActive && definition.mode === 'timing' && !state.phaseResolved) {
        state = updateTimingCursor(state, deltaMs, definition.meterSpeed ?? 0.00064)

        if (!state.stopMoActive && definition.assistAfterMs && state.phaseElapsedMs >= definition.assistAfterMs) {
          triggerStopMoRescue()
        }
      }

      if (!state.briefingActive && definition.mode === 'auto' && definition.autoAdvanceMs && state.phaseElapsedMs >= definition.autoAdvanceMs) {
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