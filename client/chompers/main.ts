import { announceCorrect, announceGameOver, announceProblem, announceRound, announceWrong, moveFocusAfterTransition } from './accessibility.js'
import { animateCorrectFeedback, animateHippoChomp, animateNextRound, animateWrongFeedback, spawnPointsPopup } from './animations.js'
import { moveFocusToFirstItem, setupInput, teardownInput } from './input.js'
import { renderAll, renderEndScreen, renderHUD, renderHippo, renderProblem, renderScene, setupSettingsModal } from './renderer.js'
import { ensureAudioUnlocked, sfxChomp, sfxCorrect, sfxGameOver, sfxProblemAppear, sfxWrong } from './sounds.js'
import { advanceRound, createInitialState, resolveChomp, selectAnswer } from './state.js'
import type { Area, AreaLevel, GameState } from './types.js'

let state: GameState

const settingsModal = setupSettingsModal()

function showScreen(screenId: string): void {
  for (const id of ['start-screen', 'game-screen', 'end-screen']) {
    const el = document.getElementById(id)
    if (!el) continue
    if (id === screenId) {
      el.hidden = false
      el.removeAttribute('aria-hidden')
    } else {
      el.hidden = true
      el.setAttribute('aria-hidden', 'true')
    }
  }
}

async function onSelectAnswer(itemId: string): Promise<void> {
  if (state.phase !== 'playing') return

  state = selectAnswer(state, itemId)
  renderHippo(state)

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

function onOpenSettings(): void {
  settingsModal.open()
}

function onStartGame(): void {
  ensureAudioUnlocked()
  const areaInput = document.querySelector<HTMLInputElement>('input[name="area"]:checked')
  const area = (areaInput?.value ?? 'matching') as Area
  const levelInput = document.querySelector<HTMLInputElement>(`input[name="level-${area}"]:checked`)
  const level = (Number(levelInput?.value ?? '1') || 1) as AreaLevel
  const safeLevel = ([1, 2, 3].includes(level) ? level : 1) as AreaLevel
  state = createInitialState(area, safeLevel, Date.now())
  showScreen('game-screen')
  renderAll(state)
  sfxProblemAppear()
  setupInput({ onSelectAnswer, onOpenSettings })
  announceProblem(state.currentProblem)
  moveFocusAfterTransition('scene-items', 100)
  window.setTimeout(() => moveFocusToFirstItem(), 200)
}

function showEndScreen(endState: GameState): void {
  showScreen('end-screen')
  renderEndScreen(endState)
  teardownInput()
  sfxGameOver()
  announceGameOver(endState)
  moveFocusAfterTransition('replay-btn', 300)
}

function onReplay(): void {
  teardownInput()
  const replayArea = state?.area ?? 'matching'
  const replayLevel = state?.level ?? 1
  const areaInput = document.querySelector<HTMLInputElement>('input[name="area"]:checked')
  if (areaInput) areaInput.value = replayArea
  state = createInitialState(replayArea, replayLevel, Date.now())
  showScreen('game-screen')
  renderAll(state)
  sfxProblemAppear()
  setupInput({ onSelectAnswer, onOpenSettings })
  announceProblem(state.currentProblem)
  moveFocusAfterTransition('scene-items', 100)
  window.setTimeout(() => moveFocusToFirstItem(), 200)
}

function onReturnToMenu(): void {
  teardownInput()
  showScreen('start-screen')
  moveFocusAfterTransition('start-btn', 320)
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-btn')?.addEventListener('click', () => {
    onStartGame()
  })

  document.getElementById('replay-btn')?.addEventListener('click', onReplay)
  document.getElementById('menu-btn')?.addEventListener('click', onReturnToMenu)

  document.getElementById('restart-btn')?.addEventListener('click', () => {
    settingsModal.close()
    onReturnToMenu()
  })

  document.getElementById('settings-close-btn')?.addEventListener('click', () => {
    settingsModal.close()
  })

  const settingsBtn = document.getElementById('settings-btn')
  settingsBtn?.addEventListener('click', () => settingsModal.open(settingsBtn))
})
