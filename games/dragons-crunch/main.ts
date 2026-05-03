import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { initStage, createDragon, getDragonParts, positionDragonFromBody, createFoodGraphics, updateFoodPosition, createParticleGraphics, updateParticleGraphics, createGround } from './renderer.js'
import { animateChomp, animateFireBreathing, stopFireBreathing, animateIdle, animateBlink } from './animations.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupDragonsCrunchInput } from './input.js'
import { announceScore, announceFoodSpawned, announceChomp, announceDragonJoined, announceCelebration, announceReturnToStart } from './accessibility.js'
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
let currentBodies: MotionBody[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let prevDragonCount = 0
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

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    // Audio handled by global game-audio system
    void enabled
  })

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
      currentBodies = bodies
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

  // Ground
  const ground = createGround(w, h)
  app.stage.addChild(ground)

  // Reset containers
  dragonContainers = []
  foodContainers = new Map()
  particleGraphics = []

  gameState = startGame(createInitialState())
  currentBodies = []
  prevDragonCount = 0
  lastAnnouncedScore = -1
  lastAnnouncedFoodSpawned = -1

  scoreDisplay.textContent = 'Score: 0'
  foodDisplay.textContent = 'Food: 0/100'
  dragonCountDisplay.textContent = 'Dragons: 1'
  gameStatus.textContent = 'Game started! Raise your arms to chomp!'
  celebrationOverlay.hidden = true

  // Demo body if no camera
  if (!cameraGranted) {
    currentBodies = [{ id: 0, normalizedX: 0.5, active: true, armsUp: false }]
  }

  // Expose debug state
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

    // Update game state
    gameState = updateGame(gameState, currentBodies, app.screen.width, app.screen.height, deltaMs)

    // Update dragons from motion bodies
    const expectedDragonCount = cameraGranted ? currentBodies.length : 1

    while (dragonContainers.length < expectedDragonCount) {
      const dragon = createDragon(getDragonColor(dragonContainers.length))
      app.stage.addChild(dragon)
      dragonContainers.push(dragon)
      if (dragonContainers.length > prevDragonCount) {
        gameFeedback.textContent = `Dragon ${dragonContainers.length} joined the feast!`
        announceDragonJoined(dragonContainers.length)
      }
    }

    // Remove extra dragons
    while (dragonContainers.length > expectedDragonCount) {
      const removed = dragonContainers.pop()
      if (removed) {
        stopFireBreathing(removed)
        app.stage.removeChild(removed)
      }
    }

    if (expectedDragonCount !== prevDragonCount) {
      prevDragonCount = expectedDragonCount
      dragonCountDisplay.textContent = `Dragons: ${expectedDragonCount}`
    }

    // Position dragons
    for (let i = 0; i < dragonContainers.length; i++) {
      const container = dragonContainers[i]
      const dragonState = gameState.dragons[i]
      if (!dragonState) continue

      if (cameraGranted && currentBodies[i]) {
        positionDragonFromBody(container, currentBodies[i], app.screen.width, app.screen.height)
      } else {
        // Demo position
        container.x = app.screen.width / 2
        container.y = app.screen.height * 0.82
        container.scale.set(2.8)
      }
    }

    // Animate dragons
    for (let i = 0; i < dragonContainers.length; i++) {
      const container = dragonContainers[i]
      const dState = gameState.dragons[i]
      if (!dState) continue

      const parts = getDragonParts(container)
      if (!parts) continue

      // Idle animation
      const t = now / 1000
      animateIdle(container, t, i)

      // Chomp animation trigger
      if (dState.chomping) {
        animateChomp(container)
      }

      // Fire breathing animation
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

    // Food visuals
    // Add new food
    for (const food of gameState.foods) {
      if (!foodContainers.has(food.id) && !food.eaten) {
        const fc = createFoodGraphics(food)
        app.stage.addChildAt(fc, app.stage.children.length > 0 ? 1 : 0)
        foodContainers.set(food.id, fc)
        if (lastFoodSpawnedVisual !== gameState.foodSpawned) {
          lastFoodSpawnedVisual = gameState.foodSpawned
          sfxFoodSpawn()
        }
      }
    }

    // Update food positions and remove eaten
    for (const [id, fc] of foodContainers) {
      const food = gameState.foods.find((f) => f.id === id)
      if (food) {
        updateFoodPosition(fc, food)
        if (food.eaten && fc.alpha > 0) {
          fc.alpha = 0
        }
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

    // Particles
    // Clean up old particle graphics that aren't in state anymore
    const activeParticleKeys = new Set(gameState.particles.map((_, idx) => idx))
    for (let i = particleGraphics.length - 1; i >= 0; i--) {
      if (!activeParticleKeys.has(i)) {
        const pg = particleGraphics[i]
        if (pg.parent) pg.parent.removeChild(pg)
        pg.destroy()
        particleGraphics.splice(i, 1)
      }
    }

    // Sync particle graphics with state
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

    // HUD updates
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

  // Auto-return to start after a brief moment on end screen
  setTimeout(() => {
    resetToStart()
  }, 3000)
}

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
  currentBodies = []
  prevDragonCount = 0
  lastAnnouncedScore = -1
  lastAnnouncedFoodSpawned = -1

  celebrationOverlay.hidden = true

  showScreen('start-screen')
  gameStatus.textContent = 'Returned to start screen.'

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (bodies) => {
      currentBodies = bodies
    })
  }
}

function handleVisibilityChange(): void {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
  } else {
    app.ticker.start()
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
