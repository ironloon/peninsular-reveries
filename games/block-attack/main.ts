import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import {
  initStage, createSmashZone, createBlockGraphics, updateBlockGraphics,
  createParticleGraphics, updateParticleGraphics, createGroundGraphics, createSkyGraphics,
  createComboFlash,
} from './renderer.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, startGame, spawnWave, updateGame } from './state.js'
import type { GameState, MotionBody } from './types.js'
import { setupBlockAttackInput } from './input.js'
import {
  announceWave, announceScore, announceBlocksDestroyed, announceCombo,
  announceTowerDown, announceReturnToStart,
} from './accessibility.js'
import {
  sfxBlockHit, sfxBigSmash, sfxWaveStart, setMuted, startActionMusic, stopActionMusic, sfxCombo, ensureAudioUnlocked,
} from './sounds.js'

// Home path for quit navigation
const homePath = (() => {
  const base = document.querySelector<HTMLBaseElement>('base')?.href || '/'
  try { return new URL('/', base).pathname } catch { return '/' }
})()

// DOM refs
const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.querySelector('.ba-camera-prompt') as HTMLElement
const scoreDisplay = document.getElementById('score-display')!
const waveDisplay = document.getElementById('wave-display')!
const comboDisplay = document.getElementById('combo-display')!
const gameStatus = document.getElementById('game-status')!
// endScoreMsg element exists in DOM but is written to in reset/start flow

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

let lastAnnouncedScore = -1
let lastAnnouncedWave = -1
let lastCombo = 0
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _towersLeftLastWave = 0
let needsNewWave = true

const blockContainers = new Map<string, Container>()
const particleGraphics: Graphics[] = []
let smashZone: Graphics | null = null
let groundGraphics: Graphics | null = null
let skyGraphics: Graphics | null = null
let comboFlash: Graphics | null = null
let comboFlashTimer = 0

// ── Boot ─────────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the block stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    setMuted(!enabled)
    if (!enabled) stopActionMusic()
    else if (gameState.phase === 'playing') startActionMusic()
  })

  setupBlockAttackInput({ onMenu: () => {
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
    cameraPrompt.textContent = 'Camera not available. Press Start for a demo — move your mouse instead!'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)
  document.addEventListener('restart', () => resetToStart())
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Quit button
  const quitBtn = document.getElementById('quit-btn')
  if (quitBtn) {
    quitBtn.addEventListener('click', () => {
      window.location.href = homePath
    })
  }

  // Restart button in HUD
  const restartHudBtn = document.getElementById('hud-restart-btn')
  if (restartHudBtn) {
    restartHudBtn.addEventListener('click', resetToStart)
  }
}

// ── Game entry ───────────────────────────────────────────────────────────────

async function enterGame(): Promise<void> {
  if (!app) return
  ensureAudioUnlocked()
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
  blockContainers.clear()
  particleGraphics.length = 0
  smashZone = null
  groundGraphics = null
  skyGraphics = null
  comboFlash = null
  comboFlashTimer = 0

  gameState = startGame(createInitialState())
  lastAnnouncedScore = -1
  lastAnnouncedWave = -1
  lastCombo = 0
  _towersLeftLastWave = 0
  needsNewWave = true

  if (!cameraGranted) {
    // Demo mode: simulate a body at center that follows mouse
    startMouseDemo()
    activeBodies = [{
      id: 99,
      normalizedX: 0.5,
      normalizedY: 0.5,
      spreadX: 0.18,
      spreadY: 0.45,
      pixelCount: 200,
      active: true,
      armsUp: false,
    }]
  }

  startActionMusic()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__blockAttackDebug = { app, canvas: app.canvas, screen: { w, h }, buildSha: 'dev', rendererType: app.renderer.type }

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  let previousBlocksDestroyed = 0
  let previousTowersDestroyed = 0

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)

    // Spawn initial wave
    if (needsNewWave) {
      gameState = spawnWave(gameState, app.screen.width, app.screen.height)
      needsNewWave = false
      sfxWaveStart()
      announceWave(gameState.wave)
    }

    // Demo mode: update body from mouse
    if (!cameraGranted && mouseDemoActive) {
      activeBodies = [{
        id: 99,
        normalizedX: mouseX / app.screen.width,
        normalizedY: mouseY / app.screen.height,
        spreadX: 0.18,
        spreadY: 0.45,
        pixelCount: 200,
        active: true,
        armsUp: false,
      }]
    }

    const bodiesToUse = cameraGranted ? activeBodies.slice(0, 6) : activeBodies.slice(0, 1)
    gameState = updateGame(gameState, bodiesToUse, app.screen.width, app.screen.height, deltaMs)

    // ── Sky background ─────────────────────────────────────────────
    if (!skyGraphics) {
      skyGraphics = createSkyGraphics(app.screen.width, app.screen.height)
      app.stage.addChildAt(skyGraphics, 0)
    }

    // ── Ground ─────────────────────────────────────────────────────
    if (!groundGraphics) {
      groundGraphics = createGroundGraphics(app.screen.width, app.screen.height)
      app.stage.addChildAt(groundGraphics, 1)
    }

    // ── Smash zone indicator ────────────────────────────────────────
    if (bodiesToUse.length > 0) {
      if (!smashZone) {
        smashZone = createSmashZone()
        app.stage.addChild(smashZone)
      }
      const body = bodiesToUse[0]
      const mx = (1 - body.normalizedX) * app.screen.width
      const my = body.normalizedY * app.screen.height
      smashZone.x = mx
      smashZone.y = my
      smashZone.alpha = 0.7 + Math.sin(performance.now() * 0.005) * 0.3
    } else if (smashZone && smashZone.parent) {
      smashZone.parent.removeChild(smashZone)
      smashZone = null
    }

    // ── Blocks ──────────────────────────────────────────────────────
    for (const block of gameState.blocks) {
      if (!blockContainers.has(block.id) && !block.destroyed) {
        const bc = createBlockGraphics(block)
        app.stage.addChild(bc)
        blockContainers.set(block.id, bc)
      }
    }

    // Update existing blocks and clean up removed ones
    const staleIds: string[] = []
    for (const [id, bc] of blockContainers) {
      const block = gameState.blocks.find(b => b.id === id)
      if (block) {
        updateBlockGraphics(bc, block)
      } else {
        // Block was removed from state (fully faded or off-screen)
        if (bc.parent) bc.parent.removeChild(bc)
        staleIds.push(id)
      }
    }
    for (const id of staleIds) {
      blockContainers.delete(id)
    }

    // ── Particles ──────────────────────────────────────────────────
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

    // ── Combo flash ────────────────────────────────────────────────
    if (comboFlash) {
      comboFlashTimer -= deltaMs
      if (comboFlashTimer <= 0) {
        if (comboFlash.parent) comboFlash.parent.removeChild(comboFlash)
        comboFlash.destroy()
        comboFlash = null
      } else {
        comboFlash.alpha = comboFlashTimer / 400
      }
    }

    // ── Sound effects for hits ──────────────────────────────────────
    const destroyedNow = gameState.blocks.filter((b) => b.destroyed).length
    if (destroyedNow > previousBlocksDestroyed) {
      const hitCount = destroyedNow - previousBlocksDestroyed
      if (hitCount >= 3) {
        sfxBigSmash()
        announceBlocksDestroyed(hitCount)
      } else {
        // Only play sound if enough time has passed since last hit
        const timeSinceLastHit = performance.now() - gameState.lastSmashTime
        if (timeSinceLastHit > 100) {
          sfxBlockHit()
          announceBlocksDestroyed(hitCount)
        }
      }
    }
    previousBlocksDestroyed = destroyedNow

    // Tower destroyed
    const towersDownNow = gameState.towers.filter((t) => t.destroyed).length
    if (towersDownNow > previousTowersDestroyed) {
      announceTowerDown()
      sfxBigSmash()

      // Show combo flash
      if (bodiesToUse.length > 0 && bodiesToUse[0]) {
        const bp = bodiesToUse[0]
        const flashX = (1 - bp.normalizedX) * app.screen.width
        const flashY = bp.normalizedY * app.screen.height
        if (comboFlash && comboFlash.parent) {
          comboFlash.parent.removeChild(comboFlash)
          comboFlash.destroy()
        }
        comboFlash = createComboFlash(flashX, flashY, gameState.comboCount)
        app.stage.addChild(comboFlash)
        comboFlashTimer = 400
      }
    }
    previousTowersDestroyed = towersDownNow

    // Combo
    if (gameState.comboCount > lastCombo && gameState.comboCount >= 3) {
      sfxCombo(gameState.comboCount)
      announceCombo(gameState.comboCount)
    }
    lastCombo = gameState.comboCount

    // ── HUD ─────────────────────────────────────────────────────────
    if (gameState.score !== lastAnnouncedScore) {
      lastAnnouncedScore = gameState.score
      scoreDisplay.textContent = `Score: ${gameState.score}`
      announceScore(gameState.score)
    }

    if (gameState.wave !== lastAnnouncedWave) {
      lastAnnouncedWave = gameState.wave
      waveDisplay.textContent = `Wave: ${gameState.wave}`
    }

    comboDisplay.textContent = gameState.comboCount >= 2 ? `Combo x${gameState.comboCount}!` : ''

    // ── Auto end ─────────────────────────────────────────────────────
    // The game keeps spawning waves - it's endless destruction
    // Player quits via X button or the menu
  }

  app.ticker.add(gameLoopCallback)
}

// ── Demo mode: mouse control ──────────────────────────────────────────────

let mouseDemoActive = false
let mouseX = 0
let mouseY = 0
let mouseMoveHandler: ((e: MouseEvent | TouchEvent) => void) | null = null

function startMouseDemo(): void {
  mouseDemoActive = true
  mouseMoveHandler = (e: MouseEvent | TouchEvent) => {
    const pixiRect = pixiStage.getBoundingClientRect()
    if (e instanceof MouseEvent) {
      mouseX = e.clientX - pixiRect.left
      mouseY = e.clientY - pixiRect.top
    } else if (e instanceof TouchEvent && e.touches.length > 0) {
      mouseX = e.touches[0].clientX - pixiRect.left
      mouseY = e.touches[0].clientY - pixiRect.top
    }
  }
  document.addEventListener('mousemove', mouseMoveHandler)
  document.addEventListener('touchmove', mouseMoveHandler, { passive: true })
}

function stopMouseDemo(): void {
  mouseDemoActive = false
  if (mouseMoveHandler) {
    document.removeEventListener('mousemove', mouseMoveHandler)
    document.removeEventListener('touchmove', mouseMoveHandler)
    mouseMoveHandler = null
  }
}

// ── Reset / replay ────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback && app) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopMotionTracking()
  stopActionMusic()

  if (app) {
    if (smashZone && smashZone.parent) {
      smashZone.parent.removeChild(smashZone)
      smashZone = null
    }
    if (comboFlash && comboFlash.parent) {
      comboFlash.parent.removeChild(comboFlash)
      comboFlash = null
    }
    for (const bc of blockContainers.values()) app.stage.removeChild(bc)
    for (const pg of particleGraphics) {
      if (pg.parent) pg.parent.removeChild(pg)
      pg.destroy()
    }
    if (groundGraphics) {
      app.stage.removeChild(groundGraphics)
      groundGraphics.destroy()
      groundGraphics = null
    }
    if (skyGraphics) {
      app.stage.removeChild(skyGraphics)
      skyGraphics.destroy()
      skyGraphics = null
    }
    app.stage.removeChildren()
  }

  blockContainers.clear()
  particleGraphics.length = 0
  gameState = createInitialState()
  activeBodies = []
  lastAnnouncedScore = -1
  lastAnnouncedWave = -1
  lastCombo = 0
  _towersLeftLastWave = 0
  needsNewWave = true
  mouseDemoActive = false
  stopMouseDemo()

  showScreen('start-screen')
  gameStatus.textContent = 'Returned to start screen.'
  announceReturnToStart()

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (bodies) => {
      activeBodies = bodies
    })
  }
}

// ── Visibility handling ────────────────────────────────────────────────────

function handleVisibilityChange(): void {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
    stopActionMusic()
  } else {
    app.ticker.start()
    if (gameState.phase === 'playing') {
      startActionMusic()
    }
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}