import { SCENES } from './types.js'
import {
  createInitialState,
  tickState,
  isSceneComplete,
  advanceScenePhase,
  isMissionComplete,
  handleTap,
  handleHoldStart,
  handleHoldEnd,
} from './state.js'
import {
  renderScene,
  renderNarrativePane,
  renderInteractionArea,
  renderProgress,
  renderHoldProgress,
  renderTapCount,
} from './renderer.js'
import { triggerCompletionFlash } from './animations.js'
import {
  announcePhase,
  announceSceneComplete,
  announceMissionComplete,
} from './accessibility.js'
import {
  playHoldTone,
  playSceneChime,
  playMissionCompleteSound,
} from './sounds.js'
import { setupTabbedModal } from '../../client/modal.js'
import { bindMusicToggle, bindSfxToggle, bindReduceMotionToggle } from '../../client/preferences.js'
import { setupInput, type InputCallbacks } from './input.js'
import { renderCinematic } from './cinematic.js'

// State
let state = createInitialState()
let animFrameId: number | null = null
let lastTimestamp = 0
let settingsModal = { open() {}, close() {}, toggle() {} }

// DOM helpers
function el(id: string): HTMLElement | null {
  return document.getElementById(id)
}

function isGameScreenActive(): boolean {
  return el('game-screen')?.classList.contains('active') ?? false
}

function isSettingsOpen(): boolean {
  const modal = el('settings-modal')
  return modal instanceof HTMLElement && !modal.hasAttribute('hidden')
}

function syncControllerAffordances(): void {
  const continueBtn = el('continue-btn') as HTMLButtonElement | null
  if (continueBtn) {
    continueBtn.dataset.controllerHint = 'Tap or A'
    continueBtn.setAttribute('aria-label', 'Continue when you are ready')
  }

  const tapBtn = el('tap-btn') as HTMLButtonElement | null
  if (!tapBtn) {
    return
  }

  const interactionType = SCENES[state.sceneIndex].interactionType
  if (interactionType === 'hold') {
    tapBtn.dataset.actionMode = 'hold'
    tapBtn.dataset.controllerHint = 'Hold A'
    tapBtn.setAttribute('aria-label', 'Hold A or press and hold to complete the maneuver')
    return
  }

  if (interactionType === 'tap-fast') {
    tapBtn.dataset.actionMode = 'tap'
    tapBtn.dataset.controllerHint = 'Press A'
    tapBtn.setAttribute('aria-label', 'Press A or tap as fast as you can')
    return
  }

  if (interactionType === 'tap-single') {
    tapBtn.dataset.actionMode = 'tap'
    tapBtn.dataset.controllerHint = 'Press A'
    tapBtn.setAttribute('aria-label', 'Press A or tap to fire the maneuver')
    return
  }

  tapBtn.dataset.actionMode = 'none'
  tapBtn.dataset.controllerHint = ''
}

function syncLoopState(): void {
  if (document.visibilityState !== 'visible' || !isGameScreenActive() || isSettingsOpen()) {
    stopLoop()
    return
  }

  startLoop()
}

function showScreen(name: 'start-screen' | 'game-screen' | 'end-screen'): void {
  for (const screen of document.querySelectorAll('.screen')) {
    screen.classList.toggle('active', screen.id === name)
    screen.classList.toggle('leaving', false)
  }
}

// Game loop
function loop(timestamp: number): void {
  const delta = lastTimestamp ? Math.min(timestamp - lastTimestamp, 100) : 16
  lastTimestamp = timestamp

  // Tick state
  state = tickState(state, delta)

  // Render
  renderScene(state)
  const cinematicPane = el('cinematic-pane')
  if (cinematicPane) renderCinematic(state, cinematicPane)
  renderNarrativePane(state)
  renderInteractionArea(state)
  renderProgress(state)
  syncControllerAffordances()

  if (SCENES[state.sceneIndex].interactionType === 'hold') {
    renderHoldProgress(state.holdProgress)
  }
  if (SCENES[state.sceneIndex].interactionType === 'tap-fast') {
    renderTapCount(state.tapCount, state.tapTarget)
  }

  // Auto-advance on interaction complete
  if (isSceneComplete(state) && state.scenePhase === 'interaction') {
    playSceneChime()
    announceSceneComplete(SCENES[state.sceneIndex].title)
    triggerCompletionFlash(el('cinematic-pane') ?? document.body)
    state = advanceScenePhase(state) // → transition
  }

  // Auto-advance from transition to next scene after a brief pause
  if (state.scenePhase === 'transition' && state.transitionMs >= 800) {
    state = advanceScenePhase(state) // → next scene's briefing
    announcePhase(state.sceneIndex, state.scenePhase)
  }

  // Check mission complete
  if (isMissionComplete(state)) {
    playMissionCompleteSound()
    announceMissionComplete()
    stopLoop()
    showScreen('end-screen')
    return
  }

  animFrameId = requestAnimationFrame(loop)
}

function startLoop(): void {
  if (animFrameId !== null) {
    return
  }

  lastTimestamp = 0
  animFrameId = requestAnimationFrame(loop)
}

function stopLoop(): void {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
}

// Callbacks
function onStart(): void {
  state = createInitialState()
  showScreen('game-screen')
  announcePhase(state.sceneIndex, state.scenePhase)
  syncLoopState()
}

function onTap(): void {
  state = handleTap(state)
}

function onHoldStart(): void {
  if (state.scenePhase !== 'interaction' || SCENES[state.sceneIndex].interactionType !== 'hold') {
    return
  }

  state = handleHoldStart(state)
  playHoldTone(true)
}

function onHoldEnd(): void {
  if (SCENES[state.sceneIndex].interactionType !== 'hold') {
    return
  }

  state = handleHoldEnd(state)
  playHoldTone(false)
}

function onSettings(): void {
  settingsModal.open()
}

function onPlayAgain(): void {
  state = createInitialState()
  settingsModal.close()
  showScreen('start-screen')
  stopLoop()
}

function onAdvancePhase(): void {
  if (state.scenePhase === 'briefing' || state.scenePhase === 'cinematic') {
    state = advanceScenePhase(state)
    announcePhase(state.sceneIndex, state.scenePhase)
  }
}

const callbacks: InputCallbacks = {
  onStart,
  onAdvancePhase,
  onTap,
  onHoldStart,
  onHoldEnd,
  onSettings: () => { onSettings() },
  onPlayAgain,
}
setupInput(callbacks)

document.addEventListener('restart', () => {
  onPlayAgain()
})

// Direct click on the continue button — native <button> always fires click on iOS.
const continueBtn = document.getElementById('continue-btn')
if (continueBtn) {
  continueBtn.addEventListener('click', () => onAdvancePhase())
}

// Tapping elsewhere on mission-content also advances briefing/cinematic phases.
const missionContentEl = document.querySelector<HTMLElement>('.mission-content')
if (missionContentEl) {
  missionContentEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.closest('#interaction-area') || target.closest('button') || target.closest('a')) return
    onAdvancePhase()
  })
}

// Space/Enter advances briefing/cinematic (global, skips form elements)
document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName ?? '')) return
  if ((e.key === ' ' || e.key === 'Enter') && (state.scenePhase === 'briefing' || state.scenePhase === 'cinematic')) {
    e.preventDefault()
    onAdvancePhase()
  }
})

settingsModal = setupTabbedModal()
const settingsModalEl = el('settings-modal')
if (settingsModalEl) {
  const observer = new MutationObserver(() => {
    syncLoopState()
  })
  observer.observe(settingsModalEl, { attributes: true, attributeFilter: ['hidden'] })
}

document.addEventListener('visibilitychange', syncLoopState)

bindMusicToggle('mission-orbit', document.getElementById('music-enabled-toggle') as HTMLInputElement | null, document.getElementById('music-enabled-help') as HTMLElement | null)
bindSfxToggle('mission-orbit', document.getElementById('sfx-enabled-toggle') as HTMLInputElement | null, document.getElementById('sfx-enabled-help') as HTMLElement | null)
bindReduceMotionToggle(document.getElementById('reduce-motion-toggle') as HTMLInputElement | null, document.getElementById('reduce-motion-help'))

showScreen('start-screen')
syncControllerAffordances()
