import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import {
  initStage, createDragon,
  computeDragonScale, computeDragonTarget,
  createFoodGraphics, updateFoodPosition,
  createParticleGraphics, updateParticleGraphics,
} from './renderer.js'
import { animateChomp, animateFireBreathing, stopFireBreathing, applyIdle } from './animations.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupDragonsCrunchInput } from './input.js'
import { announceScore, announceFoodSpawned, announceChomp, announceCelebration, announceReturnToStart } from './accessibility.js'
import {
  sfxChomp, sfxFoodSpawn, sfxFoodHitGround, sfxFireBurst, sfxCelebrationStart,
  startEpicMusic, stopEpicMusic, setMuted,
} from './sounds.js'

// DOM refs
const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.querySelector('.dc-camera-prompt') as HTMLElement
const scoreDisplay = document.getElementById('score-display')!
const foodDisplay = document.getElementById('food-display')!
const dragonCountDisplay = document.getElementById('dragon-count')!
const gameStatus = document.getElementById('game-status')!
const gameFeedback = document.getElementById('game-feedback')!
const celebrationOverlay = document.getElementById('celebration-overlay')!
const celebrationCountdown = document.getElementById('celebration-countdown')!
const endScoreMsg = document.getElementById('end-score-msg')!

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']

function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    if (isActive) {
      el.removeAttribute('inert')
    } else {
      el.setAttribute('inert', '')
    }
  }
}

// ── Runtime state ────────────────────────────────────────────────────────────

let app: Application | null = null
let gameState: GameState = createInitialState()
let activeBodies: MotionBody[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let celebrationTimer: number | null = null
let prevLandedCount = 0

let lastAnnouncedScore = -1
let lastAnnouncedFoodSpawned = -1

interface DragonInstance {
  container: Container
  currentX: number
  currentY: number
  targetX: number
  targetY: number
  currentScale: number
  targetScale: number
}

const dragonsById = new Map<number, DragonInstance>()
const foodContainers = new Map<string, Container>()
const particleGraphics: Graphics[] = []

// ── Boot ─────────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the dragon stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    setMuted(!enabled)
    if (!enabled) stopEpicMusic()
    else if (gameState.phase === 'playing' || gameState.phase === 'celebrating') startEpicMusic()
  })

  setupDragonsCrunchInput({ onMenu: () => {
    const modal = document.getElementById('settings-modal')
    if (modal) {
      const isHidden = modal.hasAttribute('hidden')
      modal.toggleAttribute('hidden', !isHidden)
    }
  } })

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
    cameraPrompt.textContent = 'Camera access granted. Press Start to begin!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Press Start for a demo!'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

// ── Game entry ───────────────────────────────────────────────────────────────

async function enterGame(): Promise<void> {
  if (!app) return
  showScreen('game-screen')

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 600)))
  })

  const rect = pixiStage.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
  const h = Math.max(1, Math.round(rect.height)) || window.innerHeight

  app.renderer.resize(w, h)
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.display = 'block'

  app.stage.removeChildren()
  dragonsById.clear()
  foodContainers.clear()
  particleGraphics.length = 0

  gameState = startGame(createInitialState())
  lastAnnouncedScore = -1
  lastAnnouncedFoodSpawned = -1
  prevLandedCount = 0
  celebrationOverlay.hidden = true

  if (!cameraGranted) {
    activeBodies = [{
      id: 99,
      normalizedX: 0.5,
      normalizedY: 0.55,
      spreadX: 0.22,
      spreadY: 0.55,
      pixelCount: 200,
      active: true,
      armsUp: false,
    }]
  }

  startEpicMusic()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__dragonsCrunchDebug = { app, canvas: app.canvas, screen: { w, h }, buildSha: 'dev', rendererType: app.renderer.type }

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  let lastFoodSpawnedVisual = 0

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)
    const now = performance.now()

    const bodiesToUse = cameraGranted ? activeBodies.slice(0, 6) : activeBodies.slice(0, 1)
    gameState = updateGame(gameState, bodiesToUse, app.screen.width, app.screen.height, deltaMs)

    // ── Dragons ──────────────────────────────────────────────────────────
    const dragonStates = gameState.dragons
    const seenIds = new Set<number>()

    for (const body of bodiesToUse) {
      seenIds.add(body.id)
      let inst = dragonsById.get(body.id)

      if (!inst) {
        const container = createDragon(getDragonColor(body.id))
        app.stage.addChildAt(container, 0)
        const scale = computeDragonScale(body, app.screen.width, app.screen.height)
        const { x, y } = computeDragonTarget(body, scale, app.screen.width, app.screen.height)
        inst = {
          container,
          currentX: x, currentY: y,
          targetX: x, targetY: y,
          currentScale: scale, targetScale: scale,
        }
        dragonsById.set(body.id, inst)
      }

      inst.targetScale = computeDragonScale(body, app.screen.width, app.screen.height)
      const target = computeDragonTarget(body, inst.targetScale, app.screen.width, app.screen.height)
      inst.targetX = target.x
      inst.targetY = target.y
    }

    for (const [id, inst] of dragonsById) {
      if (!seenIds.has(id)) {
        stopFireBreathing(inst.container)
        app.stage.removeChild(inst.container)
        dragonsById.delete(id)
      }
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const smoothT = Math.min(0.16, deltaMs * 0.0025)

    dragonCountDisplay.textContent = `Dragons: ${dragonsById.size}`
    if (gameFeedback && dragonsById.size > 0) {
      gameFeedback.textContent = `${dragonsById.size} dragon${dragonsById.size > 1 ? 's' : ''} spotted`
    }

    for (let i = 0; i < dragonStates.length; i++) {
      const dState = dragonStates[i]
      const inst = dragonsById.get(dState.id)
      if (!inst) continue

      inst.currentX = lerp(inst.currentX, inst.targetX, smoothT)
      inst.currentY = lerp(inst.currentY, inst.targetY, smoothT)
      inst.currentScale = lerp(inst.currentScale, inst.targetScale, smoothT)

      inst.container.x = inst.currentX
      inst.container.y = inst.currentY
      inst.container.scale.set(inst.currentScale)

      if (inst.currentX < app.screen.width * 0.5) {
        inst.container.scale.x = -Math.abs(inst.container.scale.x)
      } else {
        inst.container.scale.x = Math.abs(inst.container.scale.x)
      }

      applyIdle(inst.container, now / 1000, i)

      if (dState.chomping) animateChomp(inst.container)
      if (dState.breathingFire) animateFireBreathing(inst.container, dState.fireIntensity)
      else stopFireBreathing(inst.container)
    }

    // ── Food ─────────────────────────────────────────────────────────────
    for (const food of gameState.foods) {
      if (!foodContainers.has(food.id) && !food.eaten) {
        const fc = createFoodGraphics(food)
        const insertIdx = Math.min(dragonsById.size, app.stage.children.length)
        app.stage.addChildAt(fc, insertIdx)
        foodContainers.set(food.id, fc)
        if (lastFoodSpawnedVisual !== gameState.foodSpawned) {
          lastFoodSpawnedVisual = gameState.foodSpawned
          sfxFoodSpawn()
        }
      }
    }

    for (const [id, fc] of foodContainers) {
      const food = gameState.foods.find((f) => f.id === id)
      if (food) {
        updateFoodPosition(fc, food)
      } else {
        app.stage.removeChild(fc)
        foodContainers.delete(id)
      }
    }

    // Food hit ground sound
    const landedCount = gameState.landedFood?.length ?? 0
    if (landedCount > prevLandedCount) {
      sfxFoodHitGround()
      prevLandedCount = landedCount
    }

    // Chomp announcements + sfx
    for (const food of gameState.foods) {
      if (food.eaten && !food.announced) {
        food.announced = true
        announceChomp(food.value)
        sfxChomp(food.value)
      }
    }

    // ── Particles ──────────────────────────────────────────────────────────
    const activeKeys = new Set(gameState.particles.map((_, idx) => idx))
    for (let i = particleGraphics.length - 1; i >= 0; i--) {
      if (!activeKeys.has(i)) {
        const pg = particleGraphics[i]
        if (pg.parent) pg.parent.removeChild(pg)
        pg.destroy()
        particleGraphics.splice(i, 1)
      }
    }

    for (let i = 0; i < gameState.particles.length; i++) {
      const p = gameState.particles[i]
      let pg = particleGraphics[i]
      if (!pg) {
        pg = createParticleGraphics(p)
        app.stage.addChild(pg)
        particleGraphics[i] = pg
      }
      updateParticleGraphics(pg, p)
    }

    // ── HUD ────────────────────────────────────────────────────────────────
    if (gameState.score !== lastAnnouncedScore) {
      lastAnnouncedScore = gameState.score
      scoreDisplay.textContent = `Score: ${gameState.score}`
      announceScore(gameState.score)
    }

    if (gameState.foodSpawned !== lastAnnouncedFoodSpawned) {
      lastAnnouncedFoodSpawned = gameState.foodSpawned
      foodDisplay.textContent = `Food: ${gameState.foodSpawned}/${gameState.maxFood}`
      announceFoodSpawned(gameState.foodSpawned, gameState.maxFood)
    }

    // Celebration
    if (gameState.phase === 'celebrating') {
      celebrationOverlay.hidden = false
      const secs = Math.ceil(gameState.celebrationTimeLeft / 1000)
      celebrationCountdown.textContent = String(Math.max(0, secs))
      announceCelebration()
      sfxCelebrationStart()
      sfxFireBurst()

      if (celebrationTimer === null) {
        celebrationTimer = window.setTimeout(() => endGame(), gameState.celebrationDuration)
      }
    }

    if (gameState.phase === 'end') {
      endGame()
    }
  }

  app.ticker.add(gameLoopCallback)
}

// ── End game ────────────────────────────────────────────────────────────────

function endGame(): void {
  if (!app) return
  if (gameLoopCallback) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopMotionTracking()
  stopEpicMusic()
  showScreen('end-screen')
  endScoreMsg.textContent = `Final score: ${gameState.score}`
  gameStatus.textContent = `Game complete! Final score: ${gameState.score}`
  announceReturnToStart()

  setTimeout(() => resetToStart(), 4000)
}

// ── Reset ────────────────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback && app) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  if (celebrationTimer !== null) {
    clearTimeout(celebrationTimer)
    celebrationTimer = null
  }

  stopMotionTracking()
  stopEpicMusic()

  if (app) {
    for (const inst of dragonsById.values()) {
      stopFireBreathing(inst.container)
      app.stage.removeChild(inst.container)
    }
    for (const fc of foodContainers.values()) app.stage.removeChild(fc)
    for (const pg of particleGraphics) {
      if (pg.parent) pg.parent.removeChild(pg)
      pg.destroy()
    }
    app.stage.removeChildren()
  }

  dragonsById.clear()
  foodContainers.clear()
  particleGraphics.length = 0
  gameState = createInitialState()
  activeBodies = []
  lastAnnouncedScore = -1
  lastAnnouncedFoodSpawned = -1
  prevLandedCount = 0
  celebrationOverlay.hidden = true

  showScreen('start-screen')
  gameStatus.textContent = 'Returned to start screen.'

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
  }
}

function handleVisibilityChange(): void {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
    stopEpicMusic()
  } else {
    app.ticker.start()
    if (gameState.phase === 'playing' || gameState.phase === 'celebrating') {
      startEpicMusic()
    }
  }
}

function getDragonColor(index: number): number {
  const colors = [
    0x2e7d32, 0x1565c0, 0xc62828, 0x6a1b9a, 0xe65100, 0x00695c, 0xad1457, 0x455a64,
  ]
  return colors[index % colors.length]
}

// ── Boot ─────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
