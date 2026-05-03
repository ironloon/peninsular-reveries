import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { initStage, createDragon, getDragonParts, positionDragonOverlay, createFoodGraphics, updateFoodPosition, createParticleGraphics, updateParticleGraphics } from './renderer.js'
import { animateChomp, animateFireBreathing, stopFireBreathing, animateIdle, animateBlink } from './animations.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupDragonsCrunchInput } from './input.js'
import { announceScore, announceFoodSpawned, announceChomp, announceCelebration, announceReturnToStart } from './accessibility.js'
import { sfxChomp, sfxCelebrationStart, sfxFoodSpawn } from './sounds.js'

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
let dragonContainers: Container[] = []
let foodContainers: Map<string, Container> = new Map()
let particleGraphics: Graphics[] = []
let activeBodies: MotionBody[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let lastAnnouncedScore = -1
let lastAnnouncedFoodSpawned = -1
let celebrationTimer: number | null = null

// ── Stage init ───────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the dragon stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  setupDragonsCrunchInput({ onMenu: () => {
    const modal = document.getElementById('settings-modal')
    if (modal) {
      const isHidden = modal.hasAttribute('hidden')
      if (isHidden) {
        modal.removeAttribute('hidden')
      } else {
        modal.setAttribute('hidden', '')
      }
    }
  } })

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
    cameraPrompt.textContent = 'Camera access granted. Press Start to begin!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Press Start to play with demo dragons!'
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
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(resolve, 600)
    }))
  })

  const rect = pixiStage.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
  const h = Math.max(1, Math.round(rect.height)) || window.innerHeight

  app.renderer.resize(w, h)
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.display = 'block'

  // Clear stage
  app.stage.removeChildren()

  dragonContainers = []
  foodContainers = new Map()
  particleGraphics = []

  gameState = startGame(createInitialState())
  activeBodies = []
  lastAnnouncedScore = -1
  lastAnnouncedFoodSpawned = -1

  scoreDisplay.textContent = 'Score: 0'
  foodDisplay.textContent = 'Food: 0/100'
  dragonCountDisplay.textContent = 'Dragons: 0'
  gameStatus.textContent = 'Game started! Raise your arms to chomp!'
  celebrationOverlay.hidden = true

  // Demo body if no camera
  if (!cameraGranted) {
    activeBodies = [{
      id: 0,
      normalizedX: 0.5,
      normalizedY: 0.65,
      spreadX: 0.2,
      spreadY: 0.5,
      pixelCount: 200,
      active: true,
      armsUp: false,
    }]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__dragonsCrunchDebug = {
    app,
    canvas: app.canvas,
    screen: { w: app.screen.width, h: app.screen.height },
    buildSha: 'dev',
    rendererType: app.renderer.type,
  }

  if (gameLoopCallback) {
    app.ticker.remove(gameLoopCallback)
  }

  let lastFoodSpawnedVisual = 0

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)
    const now = performance.now()

    // Use bodies from camera (or demo)
    const bodiesToUse = cameraGranted ? activeBodies.slice(0, 6) : activeBodies.slice(0, 1)

    // Update game state
    gameState = updateGame(gameState, bodiesToUse, app.screen.width, app.screen.height, deltaMs)

    // ── Sync dragons (bottom layer: cover people) ──────────────────────
    const dragonStates = gameState.dragons

    // Add dragons for new bodies
    while (dragonContainers.length < dragonStates.length) {
      const idx = dragonContainers.length
      const dragon = createDragon(dragonStates[idx]?.tint ?? getDragonColor(idx))
      // Dragons go at bottom so they cover the camera/person behind them
      app.stage.addChildAt(dragon, 0)
      dragonContainers.push(dragon)
    }

    // Remove extra dragons
    while (dragonContainers.length > dragonStates.length) {
      const removed = dragonContainers.pop()
      if (removed) {
        stopFireBreathing(removed)
        app.stage.removeChild(removed)
      }
    }

    // Position and animate dragons
    dragonCountDisplay.textContent = `Dragons: ${dragonStates.length}`
    if (gameFeedback && dragonStates.length > 0) {
      gameFeedback.textContent = `${dragonStates.length} dragon${dragonStates.length > 1 ? 's' : ''} detected`
    }

    for (let i = 0; i < dragonContainers.length; i++) {
      const container = dragonContainers[i]
      const dState = dragonStates[i]
      if (!dState) continue

      // Find matching body for positioning
      const body = bodiesToUse[i]
      if (body) {
        positionDragonOverlay(container, body, app.screen.width, app.screen.height)
      }

      const parts = getDragonParts(container)
      if (!parts) continue

      // Idle animation
      const t = now / 1000
      animateIdle(container, t, i)

      // Chomp animation
      if (dState.chomping) {
        animateChomp(container)
      }

      // Fire breathing
      if (dState.breathingFire) {
        animateFireBreathing(container, dState.fireIntensity)
      } else {
        stopFireBreathing(container)
      }

      // Blink
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blink = (container as any).__blinkState
      if (blink) {
        if (now > blink.nextBlink) {
          blink.open = !blink.open
          const dur = blink.open ? 2000 + Math.random() * 3000 : 120
          blink.nextBlink = now + dur
        }
        animateBlink(container, blink.open)
      }
    }

    // ── Food visuals (middle layer: on top of dragons) ───────────────
    for (const food of gameState.foods) {
      if (!foodContainers.has(food.id) && !food.eaten) {
        const fc = createFoodGraphics(food)
        // Food goes on top of all dragons but below particles
        const insertIdx = Math.min(dragonContainers.length, app.stage.children.length)
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

    // Chomp announcements and sfx
    for (const food of gameState.foods) {
      if (food.eaten && !food.announced) {
        food.announced = true
        announceChomp(food.value)
        sfxChomp(food.value)
      }
    }

    // ── Particles (top layer) ──────────────────────────────────────────
    const activeParticleKeys = new Set(gameState.particles.map((_, idx) => idx))
    for (let i = particleGraphics.length - 1; i >= 0; i--) {
      if (!activeParticleKeys.has(i)) {
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

    // ── HUD updates ────────────────────────────────────────────────────
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

    // Celebration transition
    if (gameState.phase === 'celebrating') {
      celebrationOverlay.hidden = false
      const secs = Math.ceil(gameState.celebrationTimeLeft / 1000)
      celebrationCountdown.textContent = String(Math.max(0, secs))
      announceCelebration()
      sfxCelebrationStart()

      if (celebrationTimer === null) {
        celebrationTimer = window.setTimeout(() => {
          endGame()
        }, gameState.celebrationDuration)
      }
    }

    // End phase
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
  showScreen('end-screen')
  endScoreMsg.textContent = `Final score: ${gameState.score}`
  gameStatus.textContent = `Game complete! Final score: ${gameState.score}`
  announceReturnToStart()

  setTimeout(() => {
    resetToStart()
  }, 4000)
}

// ── Reset to start ──────────────────────────────────────────────────────────

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

  if (app) {
    for (const dragon of dragonContainers) {
      stopFireBreathing(dragon)
      app.stage.removeChild(dragon)
    }
    for (const fc of foodContainers.values()) {
      app.stage.removeChild(fc)
    }
    for (const pg of particleGraphics) {
      if (pg.parent) pg.parent.removeChild(pg)
      pg.destroy()
    }
    app.stage.removeChildren()
  }

  dragonContainers = []
  foodContainers = new Map()
  particleGraphics = []
  gameState = createInitialState()
  activeBodies = []
  lastAnnouncedScore = -1
  lastAnnouncedFoodSpawned = -1

  celebrationOverlay.hidden = true

  showScreen('start-screen')
  gameStatus.textContent = 'Returned to start screen.'

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
  }
}

// ── Visibility handling ─────────────────────────────────────────────────────

function handleVisibilityChange(): void {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
  } else {
    app.ticker.start()
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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
