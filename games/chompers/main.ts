import { announceCorrect, announceGameOver, announceProblem, announceRound, announceWrong, moveFocusAfterTransition } from './accessibility.js'
import { animateCorrectFeedback, animateHippoChomp, animateNextRound, animateWrongFeedback, spawnPointsPopup } from './animations.js'
import { moveFocusToFirstItem, setupInput } from './input.js'
import { renderAll, renderEndScreen, renderHUD, renderProblem, renderScene } from './renderer.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { showScreen } from '../../client/game-screens.js'
import { ensureAudioUnlocked, sfxChomp, sfxCorrect, sfxGameOver, sfxProblemAppear, sfxWrong } from './sounds.js'
import { advanceRound, createInitialState, resolveChomp, selectAnswer } from './state.js'
import type { Area, GameState } from './types.js'

let state: GameState

const SCREEN_IDS = ['start-screen', 'game-screen', 'end-screen']
const settingsModal = setupGameMenu()

function show(screenId: string): void {
  showScreen(screenId, SCREEN_IDS)
}

// ── Core game flow ─────────────────────────────────────────────────────────────

async function onSelectAnswer(itemId: string): Promise<void> {
  if (state.phase !== 'playing') return

  state = selectAnswer(state, itemId)

  // Disable all scene items to prevent double-selection
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.scene-item')) {
    btn.disabled = true
  }

  const targetEl = document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)
  const hippoEl = document.getElementById('hippo') as HTMLElement
  const selectedItem = state.sceneItems.find((i) => i.id === itemId)
  if (!selectedItem) return

  sfxChomp()
  await animateHippoChomp(hippoEl, targetEl, selectedItem.isCorrect)

  state = resolveChomp(state)

  if (selectedItem.isCorrect) {
    sfxCorrect()
    if (targetEl) await animateCorrectFeedback(targetEl)
    announceCorrect(selectedItem.value, state.streak)
    spawnPointsPopup(selectedItem.x, selectedItem.y, `+${selectedItem.value}`, 'positive')
  } else {
    sfxWrong()
    if (targetEl) await animateWrongFeedback(targetEl)
    announceWrong(selectedItem.value, state.currentProblem.correctAnswer)
    spawnPointsPopup(selectedItem.x, selectedItem.y, '✗', 'negative')
  }

  renderHUD(state)

  await new Promise<void>((resolve) => window.setTimeout(resolve, 800))

  state = advanceRound(state)

  if (state.phase === 'gameover') {
    showEndScreen(state)
    return
  }

  await animateNextRound()
  renderScene(state)
  renderProblem(state)
  sfxProblemAppear()
  announceProblem(state.currentProblem)
  announceRound(state.round, state.totalRounds)
  moveFocusToFirstItem()
}

function onStartGame(area: Area): void {
  ensureAudioUnlocked()

  state = createInitialState(area, 1, Date.now())

  show('game-screen')
  renderAll(state)
  sfxProblemAppear()
  announceProblem(state.currentProblem)
  moveFocusAfterTransition('scene-items', 100)
  window.setTimeout(() => moveFocusToFirstItem(), 200)
}

function showEndScreen(endState: GameState): void {
  show('end-screen')
  renderEndScreen(endState)
  sfxGameOver()
  announceGameOver(endState)
  moveFocusAfterTransition('replay-btn', 300)
}

function onReplay(): void {
  const replayArea = state?.area ?? 'matching'
  state = createInitialState(replayArea, 1, Date.now())
  show('game-screen')
  renderAll(state)
  sfxProblemAppear()
  announceProblem(state.currentProblem)
  moveFocusAfterTransition('scene-items', 100)
  window.setTimeout(() => moveFocusToFirstItem(), 200)
}

function onReturnToMenu(): void {
  show('start-screen')
  moveFocusAfterTransition('area-picker-grid', 320)
}

document.addEventListener('restart', () => { onReturnToMenu() })

document.addEventListener('DOMContentLoaded', () => {
  setupInput({ onSelectAnswer, onToggleSettings: settingsModal.toggle })

  for (const btn of document.querySelectorAll<HTMLButtonElement>('.area-card-btn')) {
    btn.addEventListener('click', () => {
      const area = (btn.dataset.area ?? 'matching') as Area
      onStartGame(area)
    })
  }

  document.getElementById('replay-btn')?.addEventListener('click', onReplay)
  document.getElementById('menu-btn')?.addEventListener('click', onReturnToMenu)
})

