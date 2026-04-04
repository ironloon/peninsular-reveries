import { announceChomp, announceGameOver, announceGameStart, announceHazard, announceMiss, announceTimeWarning, moveFocusAfterTransition } from './accessibility.js'
import { pulseElement, spawnPointsPopup } from './animations.js'
import { setupInput } from './input.js'
import type { InputCallbacks } from './input.js'
import { renderEndScreen, renderGame, setupSettingsModal, showScreen } from './renderer.js'
import { attemptChomp, createInitialState, isGameOver, moveHippo, nudgeHippo, tickState } from './state.js'
import { ensureAudioUnlocked, sfxButton, sfxChomp, sfxCollect, sfxCountdown, sfxGameOver, sfxHazard, sfxMiss } from './sounds.js'
import { FRUIT_DEFINITIONS } from './types.js'
import type { GameMode, GameState } from './types.js'

let gameState: GameState = createInitialState('rush')
let frameHandle = 0
let lastFrame = 0

function setSelectedMode(mode: GameMode): void {
  const radio = document.querySelector<HTMLInputElement>(`input[name="game-mode"][value="${mode}"]`)
  if (radio) {
    radio.checked = true
  }
}

function getState(): GameState {
  return gameState
}

function setState(nextState: GameState): void {
  gameState = nextState
}

function stopLoop(): void {
  if (frameHandle !== 0) {
    cancelAnimationFrame(frameHandle)
    frameHandle = 0
  }
  lastFrame = 0
}

function startLoop(): void {
  stopLoop()
  frameHandle = requestAnimationFrame(tick)
}

function finishGame(): void {
  stopLoop()
  renderGame(getState())
  renderEndScreen(getState())
  showScreen('end-screen')
  sfxGameOver()
  announceGameOver(getState())
  moveFocusAfterTransition('replay-btn', 320)
}

function returnToMenu(): void {
  stopLoop()
  setSelectedMode(getState().mode)
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 320)
}

function startGame(mode: GameMode): void {
  ensureAudioUnlocked()
  sfxButton()
  setSelectedMode(mode)
  setState(createInitialState(mode))
  renderGame(getState())
  showScreen('game-screen')
  announceGameStart(mode)
  moveFocusAfterTransition('chomp-btn', 320)
  startLoop()
}

function handleMissedItems(state: GameState, missedItems: readonly GameState['items'][number][]): void {
  if (missedItems.length === 0) return

  if (state.mode !== 'zen') {
    sfxMiss()
  }

  announceMiss(state.mode, missedItems.length, state.lives)

  for (const item of missedItems) {
    const tone = state.mode === 'survival' && !FRUIT_DEFINITIONS[item.kind].hazard
      ? 'danger'
      : state.mode === 'zen'
        ? 'positive'
        : 'warning'
    const text = state.mode === 'survival' && !FRUIT_DEFINITIONS[item.kind].hazard
      ? '-1♥'
      : state.mode === 'zen'
        ? 'PASS'
        : 'MISS'
    spawnPointsPopup(item.x, 90, text, tone)
  }

  const combo = document.getElementById('combo-readout')
  if (combo) pulseElement(combo, 'is-reset', 260)
}

function tick(now: number): void {
  if (!lastFrame) {
    lastFrame = now
  }

  const deltaMs = Math.min(now - lastFrame, 80)
  lastFrame = now

  const result = tickState(getState(), deltaMs)
  setState(result.state)
  renderGame(getState())

  for (const seconds of result.countdownWarnings) {
    sfxCountdown(seconds)
    announceTimeWarning(seconds)
  }

  handleMissedItems(getState(), result.missedItems)

  if (isGameOver(getState())) {
    finishGame()
    return
  }

  frameHandle = requestAnimationFrame(tick)
}

const settingsModal = setupSettingsModal()

const callbacks: InputCallbacks = {
  onStartGame(mode) {
    startGame(mode)
  },
  onReplay() {
    startGame(getState().mode)
  },
  onReturnToMenu() {
    returnToMenu()
  },
  onMoveHippo(x) {
    setState(moveHippo(getState(), x))
    if (frameHandle === 0) {
      renderGame(getState())
    }
  },
  onNudgeHippo(delta) {
    setState(nudgeHippo(getState(), delta))
    if (frameHandle === 0) {
      renderGame(getState())
    }
  },
  onChomp() {
    if (settingsModal.isOpen()) return

    ensureAudioUnlocked()
    sfxChomp()
    const result = attemptChomp(getState())
    setState(result.state)
    renderGame(getState())

    const chompButton = document.getElementById('chomp-btn')
    if (chompButton) pulseElement(chompButton, 'is-fired', 180)

    if (result.hitItem) {
      const item = FRUIT_DEFINITIONS[result.hitItem.kind]
      if (item.hazard) {
        sfxHazard()
        announceHazard(result.hitItem.kind, getState().mode, getState().lives)
        const label = result.hitItem.kind === 'bomb' ? 'BOOM' : `${result.scoreDelta}`
        spawnPointsPopup(result.hitItem.x, result.hitItem.y, label, result.hitItem.kind === 'bomb' ? 'danger' : 'warning')
      } else {
        sfxCollect(result.scoreDelta)
        announceChomp(result.hitItem.kind, result.scoreDelta, getState().combo)
        const tone = result.hitItem.kind === 'star' ? 'bonus' : 'positive'
        spawnPointsPopup(result.hitItem.x, result.hitItem.y, `+${result.scoreDelta}`, tone)

        if (getState().combo > 1) {
          const combo = document.getElementById('combo-readout')
          if (combo) pulseElement(combo, 'is-hot', 320)
        }
      }
    } else if (result.comboBroken) {
      const combo = document.getElementById('combo-readout')
      if (combo) pulseElement(combo, 'is-reset', 260)
    }

    if (isGameOver(getState())) {
      finishGame()
    }
  },
}

setupInput(getState, callbacks, settingsModal.isOpen)
renderGame(getState())
showScreen('start-screen')