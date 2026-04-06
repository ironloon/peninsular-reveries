import { announceCorrect, announceGameOver, announceProblem, announceRound, announceWrong, moveFocusAfterTransition } from './accessibility.js'
import { animateCorrectFeedback, animateHippoChomp, animateNextRound, animateNpcChomp, animateWrongFeedback, spawnPointsPopup } from './animations.js'
import { moveFocusToFirstItem, setupInput, teardownInput } from './input.js'
import { renderAll, renderEndScreen, renderFrenzyEndScreen, renderFrenzyScoreboard, renderHUD, renderHippo, renderNpcHippos, renderProblem, renderRoundTimer, renderScene, setupSettingsModal } from './renderer.js'
import { ensureAudioUnlocked, playFrenzyLose, playFrenzyMusic, playFrenzyWin, playNpcChomp, playNpcScore, playTimerWarning, sfxChomp, sfxCorrect, sfxGameOver, sfxProblemAppear, sfxWrong, stopFrenzyMusic } from './sounds.js'
import { advanceRound, createInitialState, createNpcHippos, getRoundTimerMax, npcSelectTarget, resolveFrenzyRound, resolveChomp, selectAnswer, tickNpcProgress, tickRoundTimer } from './state.js'
import type { Area, AreaLevel, FrenzyConfig, GameState, NpcHippo } from './types.js'
import { FRENZY_COLORS } from './types.js'

let state: GameState

// ── Frenzy module state ───────────────────────────────────────────────────────
let frenzyTickHandle: number | null = null
let frenzyRoundCount = 0
let frenzyPlayerScore = 0
let isResolvingFrenzyRound = false

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

// ── Frenzy helpers ─────────────────────────────────────────────────────────────

function stopFrenzyTick(): void {
  if (frenzyTickHandle !== null) {
    cancelAnimationFrame(frenzyTickHandle)
    frenzyTickHandle = null
  }
}

function assignNpcTargets(): void {
  if (!state.frenzy) return
  const correctIndex = state.sceneItems.findIndex((item) => item.isCorrect)
  const fruitCount = state.sceneItems.length

  const updatedNpcs = state.frenzy.npcs.map((npc) => {
    const { fruitIndex, isCorrect } = npcSelectTarget(npc, fruitCount, correctIndex, Math.random)
    return { ...npc, targetFruitIndex: fruitIndex, targetIsCorrect: isCorrect, chompProgress: 0 }
  })

  state = { ...state, frenzy: { ...state.frenzy, npcs: updatedNpcs } }
}

function startFrenzyTick(): void {
  let lastTime = performance.now()
  let timerWarningPlayed = false

  function tick(now: number): void {
    if (!state.frenzy || isResolvingFrenzyRound) return

    const deltaMs = Math.min(now - lastTime, 100) // cap to avoid huge jumps on tab focus
    lastTime = now

    // Tick NPCs
    const updatedNpcs = state.frenzy.npcs.map((npc) =>
      tickNpcProgress(npc, deltaMs, state.frenzy!.adaptiveDifficulty),
    )

    // Tick timer
    const updatedFrenzy = tickRoundTimer({ ...state.frenzy, npcs: updatedNpcs }, deltaMs)
    state = { ...state, frenzy: updatedFrenzy }

    // Timer warning at 25% remaining
    if (
      !timerWarningPlayed &&
      updatedFrenzy.roundTimerMax > 0 &&
      updatedFrenzy.roundTimer < updatedFrenzy.roundTimerMax * 0.25 &&
      updatedFrenzy.roundTimer > 0
    ) {
      timerWarningPlayed = true
      playTimerWarning()
    }

    // Render frenzy UI
    const arenaEl = document.getElementById('game-arena')
    if (arenaEl) renderNpcHippos(updatedNpcs, arenaEl)
    renderRoundTimer(updatedFrenzy.roundTimer, updatedFrenzy.roundTimerMax)
    renderFrenzyScoreboard(updatedFrenzy, frenzyPlayerScore)

    // Check for first NPC reaching chompProgress >= 1
    const firstCompletedIndex = updatedNpcs.findIndex(
      (n) => n.targetFruitIndex !== null && n.chompProgress >= 1,
    )

    if (firstCompletedIndex !== -1) {
      stopFrenzyTick()
      void handleNpcChomp(updatedNpcs[firstCompletedIndex], firstCompletedIndex)
      return
    }

    // Check timer expired
    if (updatedFrenzy.roundTimer <= 0) {
      stopFrenzyTick()
      void handleFrenzyTimerExpired()
      return
    }

    frenzyTickHandle = requestAnimationFrame(tick)
  }

  frenzyTickHandle = requestAnimationFrame(tick)
}

async function handleNpcChomp(npc: NpcHippo, npcIndex: number): Promise<void> {
  if (!state.frenzy) return
  isResolvingFrenzyRound = true

  const elementId = `npc-hippo-${npcIndex}`
  const sceneItemEls = document.querySelectorAll<HTMLElement>('.scene-item')
  const targetEl =
    npc.targetFruitIndex !== null && npc.targetFruitIndex < sceneItemEls.length
      ? (sceneItemEls[npc.targetFruitIndex] ?? null)
      : null

  // Disable player interaction
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.scene-item')) {
    btn.disabled = true
  }

  animateNpcChomp(elementId, targetEl)
  playNpcChomp()

  await new Promise<void>((resolve) => window.setTimeout(resolve, 400))

  if (npc.targetIsCorrect) {
    playNpcScore()
  }

  const { updatedFrenzy } = resolveFrenzyRound(state.frenzy, null, npc.id)
  state = { ...state, frenzy: updatedFrenzy }
  renderFrenzyScoreboard(updatedFrenzy, frenzyPlayerScore)
  renderHUD(state)

  await new Promise<void>((resolve) => window.setTimeout(resolve, 600))
  isResolvingFrenzyRound = false
  await advanceFrenzyRound()
}

async function handleFrenzyTimerExpired(): Promise<void> {
  if (!state.frenzy) return
  isResolvingFrenzyRound = true

  // Disable player interaction
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.scene-item')) {
    btn.disabled = true
  }

  const { updatedFrenzy } = resolveFrenzyRound(state.frenzy, null, null)
  state = { ...state, frenzy: updatedFrenzy }
  renderFrenzyScoreboard(updatedFrenzy, frenzyPlayerScore)

  await new Promise<void>((resolve) => window.setTimeout(resolve, 1000))
  isResolvingFrenzyRound = false
  await advanceFrenzyRound()
}

async function advanceFrenzyRound(): Promise<void> {
  frenzyRoundCount++

  if (frenzyRoundCount >= 10 || state.lives <= 0) {
    showEndScreen(state)
    return
  }

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

  if (state.frenzy) {
    const timerMax = getRoundTimerMax(state.level)
    state = {
      ...state,
      frenzy: { ...state.frenzy, roundTimer: timerMax, roundTimerMax: timerMax },
    }
    assignNpcTargets()
    startFrenzyTick()
  }
}

// ── Core game flow ─────────────────────────────────────────────────────────────

async function onSelectAnswer(itemId: string): Promise<void> {
  if (state.phase !== 'playing') return

  // In frenzy mode, stop NPC ticking while resolving player answer
  if (state.mode === 'frenzy') {
    stopFrenzyTick()
    isResolvingFrenzyRound = true
  }

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

    if (state.mode === 'frenzy' && state.frenzy) {
      frenzyPlayerScore++
      const { updatedFrenzy } = resolveFrenzyRound(state.frenzy, { fruitIndex: 0, isCorrect: true }, null)
      state = { ...state, frenzy: updatedFrenzy }
      renderFrenzyScoreboard(updatedFrenzy, frenzyPlayerScore)
    }
  } else {
    sfxWrong()
    if (targetEl) await animateWrongFeedback(targetEl)
    announceWrong(selectedItem.value, state.currentProblem.correctAnswer)
    spawnPointsPopup(selectedItem.x, selectedItem.y, '✗', 'negative')

    if (state.mode === 'frenzy' && state.frenzy) {
      // resolveChomp already decremented lives; use resolveFrenzyRound only for frenzy state
      const { updatedFrenzy } = resolveFrenzyRound(state.frenzy, { fruitIndex: 0, isCorrect: false }, null)
      state = { ...state, frenzy: updatedFrenzy }
    }
  }

  renderHUD(state)

  if (state.mode === 'frenzy') {
    isResolvingFrenzyRound = false
  }

  await new Promise<void>((resolve) => window.setTimeout(resolve, 800))

  if (state.mode === 'frenzy') {
    await advanceFrenzyRound()
    return
  }

  // Normal mode path (unchanged)
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

  const isFrenzy = document.getElementById('mode-frenzy-btn')?.getAttribute('aria-pressed') === 'true'

  state = createInitialState(area, safeLevel, Date.now())

  if (isFrenzy) {
    const npcCountRaw = Number(
      (document.querySelector<HTMLInputElement>('input[name="npc-count"]:checked')?.value) ?? '1',
    )
    const npcCount = ([1, 3, 5].includes(npcCountRaw) ? npcCountRaw : 1) as 1 | 3 | 5

    const teamModeRaw = document.querySelector<HTMLInputElement>('input[name="team-mode"]:checked')?.value
    const teamMode = (teamModeRaw === 'team' ? 'team' : 'ffa') as FrenzyConfig['teamMode']

    const activeSwatch = document.querySelector<HTMLElement>('.color-swatch.active')
    const playerColor = activeSwatch?.dataset.color ?? FRENZY_COLORS[0]

    const availableColors = (FRENZY_COLORS as unknown as string[]).filter((c) => c !== playerColor)
    const npcColors = Array.from({ length: npcCount }, (_, i) => availableColors[i % availableColors.length])

    const frenzyConfig: FrenzyConfig = { npcCount, teamMode, playerColor, npcColors }
    const timerMax = getRoundTimerMax(safeLevel)

    state = {
      ...state,
      mode: 'frenzy',
      frenzy: {
        config: frenzyConfig,
        npcs: createNpcHippos(frenzyConfig),
        roundTimer: timerMax,
        roundTimerMax: timerMax,
        adaptiveDifficulty: 1,
        playerAnswerTimes: [],
        playerWins: [],
        teamScores: { a: 0, b: 0 },
      },
    }

    frenzyRoundCount = 0
    frenzyPlayerScore = 0
  }

  showScreen('game-screen')
  renderAll(state)
  sfxProblemAppear()
  setupInput({ onSelectAnswer, onOpenSettings })
  announceProblem(state.currentProblem)
  moveFocusAfterTransition('scene-items', 100)
  window.setTimeout(() => moveFocusToFirstItem(), 200)

  if (isFrenzy && state.frenzy) {
    playFrenzyMusic()
    assignNpcTargets()
    startFrenzyTick()
  }
}

function showEndScreen(endState: GameState): void {
  stopFrenzyTick()
  showScreen('end-screen')
  renderEndScreen(endState)

  if (endState.mode === 'frenzy' && endState.frenzy) {
    renderFrenzyEndScreen(endState.frenzy, frenzyPlayerScore)
    stopFrenzyMusic()
    const topNpcScore = endState.frenzy.npcs.reduce((max, n) => Math.max(max, n.score), 0)
    if (frenzyPlayerScore > topNpcScore) {
      playFrenzyWin()
    } else {
      playFrenzyLose()
    }
  } else {
    sfxGameOver()
  }

  teardownInput()
  announceGameOver(endState)
  moveFocusAfterTransition('replay-btn', 300)
}

function onReplay(): void {
  stopFrenzyTick()
  stopFrenzyMusic()
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
  stopFrenzyTick()
  stopFrenzyMusic()
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

  // Mode toggle
  const modeNormalBtn = document.getElementById('mode-normal-btn')
  const modeFrenzyBtn = document.getElementById('mode-frenzy-btn')
  const frenzyConfigEl = document.getElementById('frenzy-config')

  modeNormalBtn?.addEventListener('click', () => {
    modeNormalBtn.setAttribute('aria-pressed', 'true')
    modeFrenzyBtn?.setAttribute('aria-pressed', 'false')
    if (frenzyConfigEl) frenzyConfigEl.hidden = true
  })

  modeFrenzyBtn?.addEventListener('click', () => {
    modeFrenzyBtn.setAttribute('aria-pressed', 'true')
    modeNormalBtn?.setAttribute('aria-pressed', 'false')
    if (frenzyConfigEl) frenzyConfigEl.hidden = false
  })

  // Color picker
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('.color-swatch')
    if (!target) return
    document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('active'))
    target.classList.add('active')
  })
})

