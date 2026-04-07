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
import { setupTabbedModal } from '../modal.js'
import { bindMusicToggle, bindSfxToggle, bindReduceMotionToggle } from '../preferences.js'
import { setupInput, type InputCallbacks } from './input.js'

// State
let state = createInitialState()
let animFrameId: number | null = null
let lastTimestamp = 0
let settingsModal = { open() {}, close() {}, toggle() {} }

// DOM helpers
function el(id: string): HTMLElement | null {
  return document.getElementById(id)
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
  renderNarrativePane(state)
  renderInteractionArea(state)
  renderProgress(state)

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
    state = advanceScenePhase(state)
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
  startLoop()
}

function onTap(): void {
  state = handleTap(state)
}

function onHoldStart(): void {
  state = handleHoldStart(state)
  playHoldTone(true)
}

function onHoldEnd(): void {
  state = handleHoldEnd(state)
  playHoldTone(false)
}

function onSettings(): void {
  stopLoop()
  settingsModal.open()
}

function onPlayAgain(): void {
  state = createInitialState()
  settingsModal.close()
  showScreen('start-screen')
  stopLoop()
}

const callbacks: InputCallbacks = {
  onStart,
  onTap,
  onHoldStart,
  onHoldEnd,
  onSettings: () => { onSettings() },
  onPlayAgain,
}
setupInput(callbacks)

// Settings close wiring (in addition to what input.ts does)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop()
})

settingsModal = setupTabbedModal()
bindMusicToggle('mission-orbit', document.getElementById('music-enabled-toggle') as HTMLInputElement | null, document.getElementById('music-enabled-help') as HTMLElement | null)
bindSfxToggle('mission-orbit', document.getElementById('sfx-enabled-toggle') as HTMLInputElement | null, document.getElementById('sfx-enabled-help') as HTMLElement | null)
bindReduceMotionToggle(document.getElementById('reduce-motion-toggle') as HTMLInputElement | null, document.getElementById('reduce-motion-help'))

showScreen('start-screen')
