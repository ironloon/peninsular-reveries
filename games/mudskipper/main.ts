import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import {
  initStage,
  createMudskipper,
  createMudGraphics,
  updateMudGraphics,
  createSplashGraphics,
  updateSplashGraphics,
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
  announceMudLevel,
  announceGameOver,
  announceStart,
  announcePlaying,
  announceReturnToStart,
  manageFocus,
} from './accessibility.js'
import {
  sfxJump,
  sfxSplash,
  sfxGameOver,
  sfxDrain,
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
let lastAnnouncedMud = -1
let lastAnnouncedJumpers = 0
let gameoverAnnounced = false
let drainAnnounced = false

interface MudskipperInstance {
  container: Container
  currentX: number
  currentY: number
  targetX: number
  targetY: number
  currentScale: number
  targetScale: number
}

const skippersById = new Map<number, MudskipperInstance>()
const particleGraphics: Graphics[] = []
let mudGraphics: Graphics | null = null
let skyGraphics: Graphics | null = null

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
  skippersById.clear()
  particleGraphics.length = 0
  mudGraphics = null
  skyGraphics = null

  gameState = startGame(createInitialState())
  lastAnnouncedMud = -1
  lastAnnouncedJumpers = 0
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

    // ── Mud surface ────────────────────────────────────────────────────────
    if (!mudGraphics) {
      mudGraphics = createMudGraphics(app.screen.width, app.screen.height, gameState.mud)
      app.stage.addChildAt(mudGraphics, 1)
    } else {
      updateMudGraphics(mudGraphics, app.screen.width, app.screen.height, gameState.mud)
    }

    // ── Mudskippers ──────────────────────────────────────────────────────
    const skipperStates = gameState.mudskippers
    const seenIds = new Set<number>()

    for (const body of bodiesToUse) {
      seenIds.add(body.id)
      let inst = skippersById.get(body.id)

      if (!inst) {
        const container = createMudskipper(getMudskipperTint(body.id))
        app.stage.addChildAt(container, 2)
        const scale = computeSkipperScale(body, app.screen.width, app.screen.height)
        const { x, y } = computeSkipperTarget(body, scale, app.screen.width, app.screen.height, gameState.mud)
        inst = {
          container,
          currentX: x, currentY: y,
          targetX: x, targetY: y,
          currentScale: scale, targetScale: scale,
        }
        skippersById.set(body.id, inst)
      }

      inst.targetScale = computeSkipperScale(body, app.screen.width, app.screen.height)
      const target = computeSkipperTarget(body, inst.targetScale, app.screen.width, app.screen.height, gameState.mud)
      inst.targetX = target.x
      inst.targetY = target.y
    }

    for (const [id, inst] of skippersById) {
      if (!seenIds.has(id)) {
        app.stage.removeChild(inst.container)
        skippersById.delete(id)
      }
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const smoothT = Math.min(0.16, deltaMs * 0.0025)

    skipperCountDisplay.textContent = `Mudskippers: ${skippersById.size}`

    for (let i = 0; i < skipperStates.length; i++) {
      const sState = skipperStates[i]
      const inst = skippersById.get(sState.id)
      if (!inst) continue

      inst.currentX = lerp(inst.currentX, inst.targetX, smoothT)
      inst.currentY = lerp(inst.currentY, inst.targetY, smoothT)
      inst.currentScale = lerp(inst.currentScale, inst.targetScale, smoothT)

      inst.container.x = inst.currentX
      inst.container.y = inst.currentY
      inst.container.scale.set(inst.currentScale)

      // Face direction
      if (sState.facingRight) {
        inst.container.scale.x = Math.abs(inst.container.scale.x)
      } else {
        inst.container.scale.x = -Math.abs(inst.container.scale.x)
      }

      // Jump animation
      if (sState.jumpPhase === 'rising' || sState.jumpPhase === 'falling') {
        animateJump(inst.container)
      }

      // Idle animation
      applyIdle(inst.container, now / 1000, i, sState.jumpPhase)

      // Blink
      setEyeBlink(inst.container, sState.blinkState)
    }

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
    const mudPercent = Math.round(gameState.mud.level * 100)
    if (mudPercent !== lastAnnouncedMud) {
      lastAnnouncedMud = mudPercent
      mudLevelDisplay.textContent = `Mud: ${mudPercent}%`
      if (mudPercent % 10 === 0) {
        announceMudLevel(mudPercent)
      }
    }

    // Jump announcements + sfx
    const currentJumpers = skipperStates.filter((s) => s.jumpPhase === 'rising').length
    if (currentJumpers > lastAnnouncedJumpers) {
      announceJump(currentJumpers)
      sfxJump()
    }
    if (skipperStates.some((s) => s.jumpPhase === 'landing' && s.landSquash > 0.8)) {
      sfxSplash()
    }
    lastAnnouncedJumpers = currentJumpers

    // Game over
    if (gameState.phase === 'gameover' && !gameoverAnnounced) {
      gameoverAnnounced = true
      drainAnnounced = false
      announceGameOver()
      sfxGameOver()
      stopAmbience()
      showScreen('gameover-screen')
      gameStatus.textContent = 'Game over! The mud filled the screen.'
      manageFocus('gameover')
    }

    // Draining / end
    if (gameState.phase === 'draining' && !drainAnnounced) {
      drainAnnounced = true
      sfxDrain()
    }

    if (gameState.phase === 'start' && gameoverAnnounced) {
      gameoverAnnounced = false
      drainAnnounced = false
      announceReturnToStart()
      resetToStart()
    }
  }

  app.ticker.add(gameLoopCallback)
}

// ── Reset ───────────────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback && app) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopAmbience()

  if (app) {
    for (const inst of skippersById.values()) {
      app.stage.removeChild(inst.container)
    }
    for (const pg of particleGraphics) {
      if (pg.parent) pg.parent.removeChild(pg)
      pg.destroy()
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

  skippersById.clear()
  particleGraphics.length = 0
  gameState = createInitialState()
  activeBodies = []
  lastAnnouncedMud = -1
  lastAnnouncedJumpers = 0
  gameoverAnnounced = false
  drainAnnounced = false

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

function computeSkipperScale(
  body: MotionBody,
  stageWidth: number,
  _stageHeight: number,
): number {
  const personWidthPx = body.spreadX * stageWidth
  const baseScale = Math.max(stageWidth, 480) * 0.002
  const bodyScale = (personWidthPx / 48) * 2.2
  return Math.max(baseScale * 0.6, Math.min(baseScale * 2.2, bodyScale))
}

function computeSkipperTarget(
  body: MotionBody,
  scale: number,
  stageWidth: number,
  stageHeight: number,
  mud: { level: number },
): { x: number; y: number } {
  const x = body.normalizedX * stageWidth
  const mudSurfaceY = stageHeight * (1 - mud.level)
  const nativeH = 24
  return {
    x: Math.max(40, Math.min(stageWidth - 40, x)),
    y: mudSurfaceY - nativeH * scale * 0.3,
  }
}

function getMudskipperTint(index: number): number {
  const colors = [
    0x5d4037, 0x4e342e, 0x6d4c41, 0x795548, 0x8d6e63, 0x3e2723,
  ]
  return colors[index % colors.length]
}

// ── Boot ───────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
