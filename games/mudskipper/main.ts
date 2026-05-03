import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import {
  initStage,
  createMudskipper,
  createMudGraphics,
  updateMudGraphics,
  createSplashGraphics,
  updateSplashGraphics,
  createSplatterGraphics,
  createSkyGraphics,
} from './renderer.js'
import { animateJump, applyIdle, setEyeBlink } from './animations.js'
import { requestCamera } from './camera.js'
import { startMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupMudskipperInput } from './input.js'
import {
  announceJump,
  announceGameOver,
  announceStart,
  announcePlaying,
  manageFocus,
} from './accessibility.js'
import {
  sfxJump,
  sfxSplash,
  sfxGameOver,
  startAmbience,
  stopAmbience,
  setMuted,
} from './sounds.js'

// DOM refs
const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement
const mudLevelDisplay = document.getElementById('mud-level-display')!
const skipperCountDisplay = document.getElementById('skipper-count-display')!
const gameStatus = document.getElementById('game-status')!

const ALL_SCREENS = ['start-screen', 'game-screen', 'gameover-screen']

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
let lastAnnouncedCoverage = -1
let gameoverAnnounced = false

// Single mudskipper instance
let skipperContainer: Container | null = null

// Rendering state
const particleGraphics: Graphics[] = []
const splatterGraphicsMap = new Map<string, Graphics>()
let mudGraphics: Graphics | null = null
let skyGraphics: Graphics | null = null
let lastSplatterCount = 0

// ── Boot ───────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the mudskipper pond. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    setMuted(!enabled)
    if (!enabled) stopAmbience()
    else if (gameState.phase === 'playing') startAmbience()
  })

  const menuBtns = Array.from(document.querySelectorAll<HTMLElement>('.ms-menu-btn'))
  setupMudskipperInput(
    {
      onStart: enterGame,
      onReplay: resetToStart,
      onMenu: () => {
        const modal = document.getElementById('settings-modal')
        if (modal) {
          const isHidden = modal.hasAttribute('hidden')
          modal.toggleAttribute('hidden', !isHidden)
        }
      },
    },
    {
      startBtn,
      replayBtn,
      menuBtns,
    },
  )

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

  announceStart()
  manageFocus('start')
}

// ── Game entry ──────────────────────────────────────────────────────────────

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
  particleGraphics.length = 0
  splatterGraphicsMap.clear()
  mudGraphics = null
  skyGraphics = null
  skipperContainer = null
  lastSplatterCount = 0

  gameState = startGame(createInitialState())
  lastAnnouncedCoverage = -1
  gameoverAnnounced = false

  if (!cameraGranted) {
    activeBodies = [{
      id: 99,
      normalizedX: 0.5,
      normalizedY: 0.6,
      spreadX: 0.2,
      spreadY: 0.5,
      pixelCount: 200,
      active: true,
      jumping: false,
      jumpPhase: 'idle',
    }]
  }

  startAmbience()
  announcePlaying()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__mudskipperDebug = { app, canvas: app.canvas, screen: { w, h }, buildSha: 'dev', rendererType: app.renderer.type }

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  let lastJumpPhase = 'idle'

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)
    const now = performance.now()

    const bodiesToUse = cameraGranted ? activeBodies.slice(0, 6) : activeBodies.slice(0, 1)
    gameState = updateGame(gameState, bodiesToUse, app.screen.width, app.screen.height, deltaMs)

    // ── Sky background ───────────────────────────────────────────────────
    if (!skyGraphics) {
      skyGraphics = createSkyGraphics(app.screen.width, app.screen.height)
      app.stage.addChildAt(skyGraphics, 0)
    }

    // ── Mud surface (constant level) ────────────────────────────────────
    if (!mudGraphics) {
      mudGraphics = createMudGraphics(app.screen.width, app.screen.height, gameState.mud)
      app.stage.addChildAt(mudGraphics, 1)
    } else {
      updateMudGraphics(mudGraphics, app.screen.width, app.screen.height, gameState.mud)
    }

    // ── Splatters ────────────────────────────────────────────────────────
    // Add new splatters
    if (gameState.splatters.length > lastSplatterCount) {
      for (let i = lastSplatterCount; i < gameState.splatters.length; i++) {
        const splatter = gameState.splatters[i]
        const sg = createSplatterGraphics(splatter)
        // Splatters go above sky but below mud surface (visually)
        app.stage.addChildAt(sg, 1)
        splatterGraphicsMap.set(splatter.id, sg)
      }
      lastSplatterCount = gameState.splatters.length
    }

    // ── Single Mudskipper ───────────────────────────────────────────────
    const sState = gameState.mudskipper

    if (!skipperContainer) {
      skipperContainer = createMudskipper()
      app.stage.addChild(skipperContainer)
    }

    const skipperScale = sState.scale
    skipperContainer.x = sState.x
    skipperContainer.y = sState.y
    skipperContainer.scale.set(skipperScale)

    // Face direction
    if (sState.facingRight) {
      skipperContainer.scale.x = Math.abs(skipperContainer.scale.x)
    } else {
      skipperContainer.scale.x = -Math.abs(skipperContainer.scale.x)
    }

    // Jump animation
    if (sState.jumpPhase === 'rising' || sState.jumpPhase === 'falling') {
      animateJump(skipperContainer)
    }

    // Idle animation
    applyIdle(skipperContainer, now / 1000, 0, sState.jumpPhase)

    // Blink
    setEyeBlink(skipperContainer, sState.blinkState)

    // Jump SFX
    if (sState.jumpPhase === 'rising' && lastJumpPhase !== 'rising') {
      announceJump(1)
      sfxJump()
    }

    // Landing SFX
    if (sState.jumpPhase === 'landing' && sState.landSquash > 0.8 && lastJumpPhase === 'falling') {
      sfxSplash()
    }

    lastJumpPhase = sState.jumpPhase

    // ── Splash particles ─────────────────────────────────────────────────
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
        pg = createSplashGraphics(p)
        app.stage.addChild(pg)
        particleGraphics[i] = pg
      }
      updateSplashGraphics(pg, p)
    }

    // ── HUD ──────────────────────────────────────────────────────────────
    const coveragePercent = Math.round(gameState.coverage * 100)
    if (coveragePercent !== lastAnnouncedCoverage) {
      lastAnnouncedCoverage = coveragePercent
      mudLevelDisplay.textContent = `Mud: ${coveragePercent}%`
      if (coveragePercent > 0 && coveragePercent % 10 === 0) {
        announceJump(coveragePercent)
      }
    }

    // Hide skipper count (always 1) — show just "1 mudskipper"
    skipperCountDisplay.textContent = '🐟'

    // Game over
    if (gameState.phase === 'gameover' && !gameoverAnnounced) {
      gameoverAnnounced = true
      announceGameOver()
      sfxGameOver()
      stopAmbience()
      showScreen('gameover-screen')
      gameStatus.textContent = 'Game over! The mud filled the screen.'
      manageFocus('gameover')
    }
  }

  app.ticker.add(gameLoopCallback)
}

// ── Reset ────────────────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback && app) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopAmbience()

  if (app) {
    if (skipperContainer && skipperContainer.parent) {
      app.stage.removeChild(skipperContainer)
    }
    skipperContainer = null

    for (const pg of particleGraphics) {
      if (pg.parent) pg.parent.removeChild(pg)
      pg.destroy()
    }
    for (const [, sg] of splatterGraphicsMap) {
      if (sg.parent) sg.parent.removeChild(sg)
      sg.destroy()
    }
    if (mudGraphics) {
      app.stage.removeChild(mudGraphics)
      mudGraphics.destroy()
      mudGraphics = null
    }
    if (skyGraphics) {
      app.stage.removeChild(skyGraphics)
      skyGraphics.destroy()
      skyGraphics = null
    }
    app.stage.removeChildren()
  }

  particleGraphics.length = 0
  splatterGraphicsMap.clear()
  lastSplatterCount = 0
  gameState = createInitialState()
  activeBodies = []
  lastAnnouncedCoverage = -1
  gameoverAnnounced = false

  showScreen('start-screen')
  gameStatus.textContent = 'Returned to start screen.'

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
  }

  announceStart()
  manageFocus('start')
}

function handleVisibilityChange(): void {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
    stopAmbience()
  } else {
    app.ticker.start()
    if (gameState.phase === 'playing') {
      startAmbience()
    }
  }
}

// ── Boot ───────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}