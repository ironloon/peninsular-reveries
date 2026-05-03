import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import {
  initStage,
  createPlantGraphics,
  updatePlantStage,
  createSkyGraphics,
  updateSkyGraphics,
  createGroundGraphics,
  updateGroundGraphics,
  updateRainGraphics,
  updateSparkleGraphics,
  updateLaneIndicators,
  updateHUDGraphics,
} from './renderer.js'
import { applyPlantSway, applyRainSway, applyDayNightTint } from './animations.js'
import { requestCamera } from './camera.js'
import { startMotionTracking } from './motion.js'
import { createInitialState, startGame, updateGame } from './state.js'
import { setupGrowWithMeInput } from './input.js'
import {
  announceSeedPlant,
  announceSprout,
  announceBloom,
  announceRain,
  announceDayPhase,
  announceStart,
  announcePlaying,
  announceCelebration,
  manageFocus,
} from './accessibility.js'
import {
  sfxPlantSeed,
  sfxSprout,
  sfxBloom,
  sfxRainStart,
  sfxWaterDrop,
  sfxWind,
  sfxSunChime,
  startAmbience,
  stopAmbience,
  setMuted,
} from './sounds.js'
import type { GameState, MotionZone } from './types.js'

// DOM refs
const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement
const dayPhaseDisplay = document.getElementById('day-phase-display')!
const bloomCountDisplay = document.getElementById('bloom-count-display')!
const moistureDisplay = document.getElementById('moisture-display')!
const gameStatus = document.getElementById('game-status')!

const ALL_SCREENS = ['start-screen', 'game-screen', 'celebrating-screen']

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
let activeZones: MotionZone[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let lastAnnouncedPhase = ''
const lastSproutedIds = new Set<number>()
const lastBloomedIds = new Set<number>()
let celebrationAnnounced = false

const plantContainerMap = new Map<number, Container>()
const particleGraphics: Graphics[] = []
let skyGraphics: Graphics | null = null
let groundGraphics: Graphics | null = null
let rainGraphics: Graphics | null = null
let sparkleGraphics: Graphics | null = null
let laneIndicators: Graphics | null = null
let hudGraphics: Graphics | null = null

// ── Boot ───────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the garden. Please try a different browser.'
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

  const menuBtns = Array.from(document.querySelectorAll<HTMLElement>('.gwm-menu-btn'))
  setupGrowWithMeInput(
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
    startMotionTracking(cameraPreview, (zones) => {
      activeZones = zones
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
  plantContainerMap.clear()
  particleGraphics.length = 0
  skyGraphics = null
  groundGraphics = null
  rainGraphics = null
  sparkleGraphics = null
  laneIndicators = null
  hudGraphics = null

  gameState = startGame(createInitialState())
  lastAnnouncedPhase = ''
  lastSproutedIds.clear()
  lastBloomedIds.clear()
  celebrationAnnounced = false

  if (!cameraGranted) {
    // Demo mode: simulate activity zones
    const demoInterval = setInterval(() => {
      if (gameState.phase !== 'playing') {
        clearInterval(demoInterval)
        return
      }
      // Simulate movement in random lanes
      const lane = Math.floor(Math.random() * 5)
      activeZones = [{
        id: lane,
        normalizedX: (lane + 0.5) / 5,
        normalizedY: 0.4 + Math.random() * 0.3,
        spreadX: 0.15,
        spreadY: 0.3,
        pixelCount: 100 + Math.random() * 100,
        active: true,
        velocityY: 0,
      }]
    }, 800)
  }

  startAmbience()
  announcePlaying()

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  const lastSfxTime = { seed: 0, sprout: 0, bloom: 0, rain: 0, water: 0, wind: 0, sun: 0 }

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = Math.min(ticker.deltaMS, 50)
    const now = performance.now()

    const zonesToUse = cameraGranted ? activeZones.slice(0, 6) : activeZones.slice(0, 3)
    gameState = updateGame(gameState, zonesToUse, app.screen.width, app.screen.height, deltaMs)

    const stageWidth = app.screen.width
    const stageHeight = app.screen.height

    // ── Sky ────────────────────────────────────────────────────────────
    if (!skyGraphics) {
      skyGraphics = createSkyGraphics(stageWidth, stageHeight, gameState.dayNight, gameState.weather)
      app.stage.addChildAt(skyGraphics, 0)
    } else {
      updateSkyGraphics(skyGraphics, stageWidth, stageHeight, gameState.dayNight, gameState.weather)
    }

    // ── Ground ──────────────────────────────────────────────────────────
    if (!groundGraphics) {
      groundGraphics = createGroundGraphics(stageWidth, stageHeight, gameState.soilMoistureMap)
      app.stage.addChildAt(groundGraphics, 1)
    } else {
      updateGroundGraphics(groundGraphics, stageWidth, stageHeight, gameState.soilMoistureMap)
    }

    // ── Plants ──────────────────────────────────────────────────────────
    const groundY = stageHeight * 0.72
    const laneWidth = stageWidth / 5
    const seenPlantIds = new Set<number>()

    for (const plant of gameState.plants) {
      seenPlantIds.add(plant.id)
      let container = plantContainerMap.get(plant.id)

      if (!container) {
        container = createPlantGraphics(plant)
        app.stage.addChildAt(container, 2)
        plantContainerMap.set(plant.id, container)
      } else {
        updatePlantStage(plant)
      }

      // Position plant at bottom of ground, growing upward
      const plantX = (plant.lane + 0.5) * laneWidth
      const scale = Math.max(0.8, Math.min(1.5, stageWidth / 600))

      container.x = plantX
      container.y = groundY
      container.scale.set(scale)

      // Apply effects
      applyPlantSway(container, now / 1000, plant)
      applyDayNightTint(container, gameState.dayNight.timeOfDay, gameState.dayNight.skyBrightness)
      applyRainSway(container, gameState.weather.type === 'rainy', now / 1000, plant.swayOffset)
    }

    // Remove plants that no longer exist
    for (const [id, container] of plantContainerMap) {
      if (!seenPlantIds.has(id)) {
        app.stage.removeChild(container)
        plantContainerMap.delete(id)
      }
    }

    // ── Rain ────────────────────────────────────────────────────────────
    if (!rainGraphics) {
      rainGraphics = new Graphics()
      app.stage.addChild(rainGraphics)
    }
    updateRainGraphics(rainGraphics, gameState.rainDrops)

    // ── Sparkles ────────────────────────────────────────────────────────
    if (!sparkleGraphics) {
      sparkleGraphics = new Graphics()
      app.stage.addChild(sparkleGraphics)
    }
    updateSparkleGraphics(sparkleGraphics, gameState.sparkleParticles)

    // ── Lane indicators ──────────────────────────────────────────────────
    if (!laneIndicators) {
      laneIndicators = new Graphics()
      app.stage.addChild(laneIndicators)
    }
    updateLaneIndicators(laneIndicators, gameState.lanes, stageWidth, stageHeight)

    // ── HUD overlay ──────────────────────────────────────────────────────
    if (!hudGraphics) {
      hudGraphics = new Graphics()
      app.stage.addChild(hudGraphics)
    }
    updateHUDGraphics(
      hudGraphics,
      stageWidth,
      stageHeight,
      gameState.moistureLevel,
      gameState.dayNight,
      gameState.weather,
      gameState.totalBloomed,
    )

    // ── Sound effects ────────────────────────────────────────────────────
    const sfxCooldown = 300

    // Check for new seeds planted
    for (const plant of gameState.plants) {
      if (plant.stage === 'seed' && !lastSproutedIds.has(plant.id)) {
        lastSproutedIds.add(plant.id)
        if (now - lastSfxTime.seed > sfxCooldown) {
          sfxPlantSeed()
          announceSeedPlant()
          lastSfxTime.seed = now
        }
      }
      if ((plant.stage === 'sprout' || plant.stage === 'growing') && !lastSproutedIds.has(plant.id + 100)) {
        lastSproutedIds.add(plant.id + 100)
        if (now - lastSfxTime.sprout > sfxCooldown) {
          sfxSprout()
          announceSprout()
          lastSfxTime.sprout = now
        }
      }
      if (plant.stage === 'bloom' && !lastBloomedIds.has(plant.id)) {
        lastBloomedIds.add(plant.id)
        if (now - lastSfxTime.bloom > sfxCooldown * 2) {
          sfxBloom()
          announceBloom()
          lastSfxTime.bloom = now
        }
      }
    }

    // Day phase announcements
    if (gameState.dayNight.timeOfDay !== lastAnnouncedPhase) {
      lastAnnouncedPhase = gameState.dayNight.timeOfDay
      announceDayPhase(lastAnnouncedPhase)
    }

    // Rain announcement
    if (gameState.weather.type === 'rainy' && now - lastSfxTime.rain > 5000) {
      sfxRainStart()
      announceRain()
      lastSfxTime.rain = now
    }

    // Lane-specific sounds (throttled)
    if (gameState.lanes[1].activity > 0.2 && now - lastSfxTime.water > 2000) {
      sfxWaterDrop()
      lastSfxTime.water = now
    }
    if (gameState.lanes[2].activity > 0.2 && now - lastSfxTime.sun > 3000) {
      sfxSunChime()
      lastSfxTime.sun = now
    }
    if (gameState.lanes[3].activity > 0.2 && now - lastSfxTime.wind > 3000) {
      sfxWind()
      lastSfxTime.wind = now
    }

    // ── HUD text updates ──────────────────────────────────────────────
    const phase = gameState.dayNight.timeOfDay
    const phaseIcons: Record<string, string> = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' }
    dayPhaseDisplay.textContent = `${phaseIcons[phase] ?? ''} ${phase.charAt(0).toUpperCase() + phase.slice(1)}`
    bloomCountDisplay.textContent = `🌸 ${gameState.totalBloomed} bloomed`
    moistureDisplay.textContent = `💧 ${Math.round(gameState.moistureLevel * 100)}%`

    // ── Celebration check ──────────────────────────────────────────────
    if (gameState.totalBloomed >= 5 && !celebrationAnnounced) {
      celebrationAnnounced = true
      announceCelebration()
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
    for (const container of plantContainerMap.values()) {
      app.stage.removeChild(container)
    }
    app.stage.removeChildren()
  }

  plantContainerMap.clear()
  particleGraphics.length = 0
  skyGraphics = null
  groundGraphics = null
  rainGraphics = null
  sparkleGraphics = null
  laneIndicators = null
  hudGraphics = null
  gameState = createInitialState()
  activeZones = []
  lastAnnouncedPhase = ''
  lastSproutedIds.clear()
  lastBloomedIds.clear()
  celebrationAnnounced = false

  showScreen('start-screen')
  gameStatus.textContent = 'Garden cleared. Ready to grow again!'

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (zones) => {
      activeZones = zones
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