import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { initStage, drawBackground, drawTrain, drawPoseIndicator, drawHUD } from './renderer.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame, triggerWhistle, startChugging, stopChugging } from './state.js'
import type { GameState, MotionBody, Pose } from './types.js'
import { setupAllAboardInput } from './input.js'
import { announceWhistle, announceChugging, announceTrip, announceReturnToStart } from './accessibility.js'
import { sfxWhistle, sfxChooChoo, sfxStart, startChuggingSound, stopChuggingSound, speakAllAboard, setMuted } from './sounds.js'

// DOM refs
const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.querySelector('.aa-camera-prompt') as HTMLElement
const scoreDisplay = document.getElementById('score-display')!
const tripDisplay = document.getElementById('trip-display')!
const poseDisplay = document.getElementById('pose-display')!
const gameStatus = document.getElementById('game-status')!

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']

function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    if (isActive) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }
}

// ── Runtime state ────────────────────────────────────────────────────────────

let app: Application | null = null
let gameState: GameState = createInitialState()
let activeBodies: MotionBody[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let lastPose: Pose = 'idle'
let poseHoldTime = 0
let lastWhistleTime = 0
let wasChugging = false
let prevTrips = 0

let bgGfx: Graphics | null = null
let trainContainer: Container | null = null
let poseGfx: Graphics | null = null
let hudContainer: Container | null = null

// ── Boot ─────────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    setMuted(!enabled)
  })

  setupAllAboardInput()

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
    cameraPrompt.textContent = 'Camera access granted! Raise your hand to whistle and rotate your arm to chugga chugga!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Use keyboard: W = whistle, C = chug.'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  // Keyboard events for demo mode
  document.addEventListener('all-aboard:whistle', () => {
    if (gameState.phase !== 'playing') return
    handleWhistle()
  })
  document.addEventListener('all-aboard:chug', () => {
    if (gameState.phase !== 'playing') return
    wasChugging = true
  })
  document.addEventListener('all-aboard:chug-stop', () => {
    wasChugging = false
  })

  document.addEventListener('visibilitychange', () => {
    if (!app) return
    if (document.hidden) {
      app.ticker.stop()
      stopChuggingSound()
    } else {
      app.ticker.start()
    }
  })
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

  // Set up pixi containers
  bgGfx = new Graphics()
  trainContainer = new Container()
  poseGfx = new Graphics()
  hudContainer = new Container()

  app.stage.addChild(bgGfx)
  app.stage.addChild(trainContainer)
  app.stage.addChild(poseGfx)
  app.stage.addChild(hudContainer)

  gameState = startGame(createInitialState())
  prevTrips = 0
  lastPose = 'idle'
  poseHoldTime = 0
  lastWhistleTime = 0
  wasChugging = false

  sfxStart()

  if (!cameraGranted) {
    activeBodies = []
  }

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  gameLoopCallback = (ticker) => {
    if (!app) return
    const dt = Math.min(ticker.deltaMS, 50) / 1000

    const sw = app.screen.width
    const sh = app.screen.height

    // Get primary body or use demo mode
    const primaryBody = cameraGranted ? activeBodies[0] : null
    let currentPose: Pose = 'idle'

    if (primaryBody) {
      // Determine pose from body position and motion
      const topHalfMotion = primaryBody.normalizedY < 0.45
      const wideSpread = primaryBody.spreadX > 0.15

      // Hand up: body center in top region with reasonable spread
      if (topHalfMotion && wideSpread) {
        currentPose = 'hand-up'
      }

      // Check for arm rotation: we look at lateral oscillation in the body
      // This is detected in the motion tracker; if spreadX is oscillating
      // and the body is in upper half, it's arm rotation
      if (primaryBody.normalizedY < 0.55 && primaryBody.spreadX > 0.20) {
        currentPose = 'arm-rotating'
      }

      // Both arms up: very wide spread in upper region
      if (primaryBody.spreadX > 0.35 && primaryBody.normalizedY < 0.5) {
        currentPose = 'both-arms-up'
      }
    }

    // Keyboard override
    if (wasChugging) {
      currentPose = 'arm-rotating'
    }

    // Pose hold timing for stabilization
    if (currentPose !== lastPose) {
      poseHoldTime = 0
      lastPose = currentPose
    } else {
      poseHoldTime += dt
    }

    // Only trigger actions after pose is held for a short time
    const stablePose = poseHoldTime > 0.15 ? currentPose : 'idle'

    // Handle whistle (hand up)
    if (stablePose === 'hand-up' || stablePose === 'both-arms-up') {
      if (gameState.whistleCooldown <= 0) {
        handleWhistle()
      }
    }

    // Handle arm rotating (chugging)
    if (stablePose === 'arm-rotating') {
      if (!gameState.chuggingActive) {
        gameState = startChugging(gameState)
        startChuggingSound()
        if (gameState.chuggaCount === 1) {
          announceChugging()
        }
      }
    } else {
      if (gameState.chuggingActive) {
        gameState = stopChugging(gameState)
        stopChuggingSound()
      }
    }

    // Update game state
    gameState = updateGame(gameState, dt, sw)

    // Trip detection
    if (gameState.trips > prevTrips) {
      prevTrips = gameState.trips
      sfxChooChoo()
      announceTrip(gameState.trips)
    }

    // ── Render ──────────────────────────────────────────────────────────────
    if (bgGfx) {
      drawBackground(bgGfx, sw, sh, gameState.globalTime)
    }

    if (trainContainer) {
      drawTrain(trainContainer, gameState, sw, sh)
    }

    if (poseGfx && primaryBody) {
      const px = (1 - primaryBody.normalizedX) * sw
      const py = primaryBody.normalizedY * sh
      drawPoseIndicator(poseGfx, stablePose, px, py, gameState.globalTime)
    } else if (poseGfx) {
      poseGfx.clear()
    }

    if (hudContainer) {
      drawHUD(hudContainer, gameState, sw)
    }

    // Update HUD text
    scoreDisplay.textContent = `${gameState.score} pts`
    tripDisplay.textContent = `Trips: ${gameState.trips}`
    poseDisplay.textContent = stablePose === 'idle' ? '' : stablePose === 'hand-up' ? '👋 Hand Up!' : stablePose === 'arm-rotating' ? '🔄 Arm Rotating!' : '🙌 Both Arms!'

    // End game after enough trips
    if (gameState.trips >= 5 && gameState.phase === 'playing') {
      endGame()
    }
  }

  app.ticker.add(gameLoopCallback)
}

function handleWhistle(): void {
  if (gameState.whistleCooldown > 0) return
  const now = performance.now()
  if (now - lastWhistleTime < 3000) return
  lastWhistleTime = now

  gameState = triggerWhistle(gameState)
  sfxWhistle()
  speakAllAboard()
  announceWhistle()
}

// ── End game ────────────────────────────────────────────────────────────────

function endGame(): void {
  if (!app) return
  if (gameLoopCallback) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopChuggingSound()
  stopMotionTracking()

  showScreen('end-screen')

  const endScoreMsg = document.getElementById('end-score-msg')!
  endScoreMsg.textContent = `Great ride! You scored ${gameState.score} points across ${gameState.trips} trip${gameState.trips !== 1 ? 's' : ''}!`
  gameStatus.textContent = `Game complete! Final score: ${gameState.score}`
  announceReturnToStart()

  setTimeout(() => resetToStart(), 8000)
}

// ── Reset ────────────────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback && app) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopChuggingSound()

  if (app) {
    app.stage.removeChildren()
  }

  bgGfx = null
  trainContainer = null
  poseGfx = null
  hudContainer = null

  gameState = createInitialState()
  activeBodies = []
  lastPose = 'idle'
  poseHoldTime = 0
  prevTrips = 0

  showScreen('start-screen')
  gameStatus.textContent = 'Ready to board the train!'

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
  }
}

// ── Boot entry ───────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}