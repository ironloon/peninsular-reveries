import { SCENES, type MissionState } from './types.js'

export function renderScene(state: MissionState): void {
  const scene = SCENES[state.sceneIndex]
  const pane = document.getElementById('cinematic-pane')
  if (pane) {
    pane.dataset.cinematic = scene.cinematicType
    pane.dataset.phase = state.scenePhase
  }
}

export function renderNarrativePane(state: MissionState): void {
  const scene = SCENES[state.sceneIndex]
  const titleEl = document.getElementById('scene-title')
  const briefingEl = document.getElementById('briefing-text')
  const promptEl = document.getElementById('interaction-prompt')

  if (titleEl) titleEl.textContent = scene.title
  if (briefingEl) briefingEl.textContent = scene.briefingText
  if (promptEl) {
    if (state.scenePhase === 'interaction') {
      promptEl.textContent = scene.interactionPrompt
      promptEl.removeAttribute('hidden')
    } else {
      promptEl.textContent = ''
      promptEl.setAttribute('hidden', '')
    }
  }
}

export function renderInteractionArea(state: MissionState): void {
  const scene = SCENES[state.sceneIndex]
  const tapBtn = document.getElementById('tap-btn') as HTMLButtonElement | null
  const tapCountDisplay = document.getElementById('tap-count-display') as HTMLElement | null
  const holdProgress = document.getElementById('hold-progress') as HTMLElement | null
  const observeDisplay = document.getElementById('observe-display') as HTMLElement | null

  const isInteraction = state.scenePhase === 'interaction'
  const isTap = scene.interactionType === 'tap-fast' || scene.interactionType === 'tap-single'
  const isHold = scene.interactionType === 'hold'
  const isObserve = scene.interactionType === 'observe'

  if (tapBtn) {
    tapBtn.hidden = !(isInteraction && (isTap || isHold))
    if (isHold) {
      tapBtn.setAttribute('aria-label', 'Hold to complete the maneuver')
      tapBtn.textContent = 'Hold'
    } else {
      tapBtn.setAttribute('aria-label', 'Tap to continue')
      tapBtn.textContent = 'Tap'
    }
  }

  if (tapCountDisplay) {
    tapCountDisplay.hidden = !(isInteraction && scene.interactionType === 'tap-fast')
  }

  if (holdProgress) {
    holdProgress.hidden = !(isInteraction && isHold)
  }

  if (observeDisplay) {
    observeDisplay.hidden = !(isInteraction && isObserve)
    if (isInteraction && isObserve) {
      observeDisplay.textContent = scene.interactionPrompt
    }
  }
}

export function renderProgress(state: MissionState): void {
  const label = document.getElementById('scene-progress-label')
  if (label) {
    label.textContent = `Scene ${state.sceneIndex + 1} of ${SCENES.length}`
  }
}

export function renderHoldProgress(progress: number): void {
  const bar = document.getElementById('hold-progress-bar')
  if (bar) {
    bar.style.width = `${Math.round(progress * 100)}%`
  }
}

export function renderTapCount(count: number, target: number): void {
  const display = document.getElementById('tap-count-display')
  if (display) {
    display.textContent = `${count} / ${target}`
  }
}