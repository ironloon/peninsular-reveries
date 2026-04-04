import { pulseElement } from './animations.js'
import {
  announceCountdown,
  announceKeepHolding,
  announceMissionComplete,
  announcePhase,
  announcePhaseReady,
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
  createInitialState,
  endBriefing,
  getMissionTimeLabel,
  isRecoveryActionReady,
  resetGame,
  resolveLaunchRelease,
  resolveNarrativePhase,
  setActionHeld,
  startMission,
  tickClock,
  updateCountdown,
  updateLaunchProgress,
} from './state.js'
import {
  ensureAudioUnlocked,
  getMusicEnabled,
  getSfxIntensityMode,
  loadSamples,
  setMusicEnabled,
  setSfxIntensityMode,
  sfxBurnPulse,
  sfxButton,
  sfxCelebration,
  sfxCountdownBeep,
  sfxEngineIgnition,
  sfxLiftoff,
  sfxParachute,
  sfxReentry,
  sfxSplashdown,
  syncMusicPlayback,
} from './sounds.js'
import { getPhaseDefinition, type GameState, type MissionGameplayPhase, type MissionPhaseDefinition } from './types.js'

let state: GameState = createInitialState()
let lastFrame = performance.now()
let phaseAdvanceTimer: number | null = null
let lastCountdownValue = state.countdownValue
let lastPhase: GameState['phase'] = state.phase
let enginePulseBudgetMs = 0

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

function currentPhaseDefinition(): MissionPhaseDefinition | null {
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

  if (state.phase === 'splashdown') {
    sfxSplashdown()
  }
}

function buildPhaseReadyMessage(): string {
  const definition = currentPhaseDefinition()
  if (!definition) return ''

  if (definition.mode === 'hold' || definition.mode === 'narrative') {
    return `${definition.label}. ${definition.timingHint}`
  }

  return `${definition.label}. ${definition.prompt}`
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

  if (definition.mode === 'hold' || definition.mode === 'narrative') {
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

function resolveCurrentPhase(): void {
  const definition = currentPhaseDefinition()
  if (!definition || state.phaseResolved) return

  if (state.phase === 'launch') {
    state = resolveLaunchRelease(state)
    renderMission(state)
    void pulseElement(getOutcomeElement(), 'outcome-pulse-success')
    scheduleNextPhase(1400)
    return
  }

  if (definition.mode !== 'narrative') return

  state = resolveNarrativePhase(state)
  renderMission(state)

  if (state.phase === 'service-module-jettison') {
    sfxReentry()
  }

  if (state.phase === 'parachute-deploy') {
    sfxParachute()
  }

  void pulseElement(getOutcomeElement(), 'outcome-pulse-success')
  scheduleNextPhase(definition.autoAdvanceMs ?? 3600)
}

function startGame(): void {
  primeMissionAudio()
  sfxButton()
  clearAdvanceTimer()
  state = startMission()
  lastPhase = state.phase
  lastCountdownValue = state.countdownValue
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
      renderMission(state)
      return
    }

    if (definition.mode === 'hold') {
      state = setActionHeld(state, true)
      renderMission(state)
      return
    }

    if (definition.mode === 'narrative') {
      sfxButton()
      resolveCurrentPhase()
    }
  },
  onActionEnd: () => {
    const definition = currentPhaseDefinition()
    if (!definition || definition.mode !== 'hold' || state.phaseResolved || !state.actionHeld) return

    state = setActionHeld(state, false)
    renderMission(state)

    if (state.launchProgress < 1) {
      announceKeepHolding()
    }
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

      if (state.actionHeld) {
        enginePulseBudgetMs += deltaMs
        if (enginePulseBudgetMs >= 360) {
          sfxBurnPulse()
          enginePulseBudgetMs = 0
        }
      } else {
        enginePulseBudgetMs = 0
      }

      if (!state.phaseResolved && state.launchProgress >= 1) {
        resolveCurrentPhase()
      }
    } else {
      const liveDefinition = getPhaseDefinition(state.phase as MissionGameplayPhase)

      if (!state.briefingActive && liveDefinition.mode === 'auto' && liveDefinition.autoAdvanceMs && state.phaseElapsedMs >= liveDefinition.autoAdvanceMs) {
        goToNextPhase()
      }
    }

    if (state.phase !== 'celebration') {
      renderMission(state)
    }
  }

  if (state.phase !== lastPhase) {
    onPhaseEntered(lastPhase)
    lastPhase = state.phase
  }

  requestAnimationFrame(tick)
}

requestAnimationFrame(tick)
