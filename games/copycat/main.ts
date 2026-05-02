import { Application, Container, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { initStage, createCat, layoutCats } from './renderer.js'
import { animatePose, animateCatJoin } from './animations.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { ensureAudioUnlocked, startDanceMusic, stopDanceMusic, fadeOutMusic, sfxCatJoin } from './sounds.js'
import { createInitialState, startDance, updatePose, progressSong, completeDance } from './state.js'
import type { Pose, DanceState } from './types.js'
import { setupCopycatInput } from './input.js'
import { announcePose, announceCatJoin, announceSongMilestone } from './accessibility.js'

// ── DOM refs ─────────────────────────────────────────────────────────────────

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.querySelector('.copycat-camera-prompt') as HTMLElement
const progressDisplay = document.getElementById('progress-display')!
const catCountDisplay = document.getElementById('cat-count')!
const gameStatus = document.getElementById('game-status')!
const gameFeedback = document.getElementById('game-feedback')!

const ALL_SCREENS = ['start-screen', 'game-screen', 'end-screen']

function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    el.setAttribute('aria-hidden', String(!isActive))
  }
}

// ── Runtime state ────────────────────────────────────────────────────────────

let app: Application | null = null
let danceState: DanceState = createInitialState()
let catContainers: Container[] = []
let currentPose: Pose = 'idle'
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let prevCatCount = 0
let lastAnnouncedPose: Pose | null = null
const announcedMilestones = new Set<number>()

// ── Stage init ───────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the dance stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  setupCopycatInput({ onMenu: () => {
    // The modal toggle is handled by shared game-menu wiring;
    // this callback is a fallback for explicit menu requests.
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
    startMotionTracking(cameraPreview, (pose) => {
      currentPose = pose
    })
    cameraPrompt.textContent = 'Camera access granted. Press Start to begin!'
  } else {
    cameraPrompt.textContent = 'Camera access denied. Please allow camera access and reload the page.'
    startBtn.disabled = true
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  document.addEventListener('visibilitychange', handleVisibilityChange)
}

// ── Game entry ───────────────────────────────────────────────────────────────

async function enterGame(): Promise<void> {
  if (!app) return

  showScreen('game-screen')

  // Wait two animation frames so the browser fully removes [hidden],
  // applies the .active CSS transition, and recalculates layout.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  // Measure the container after layout has settled
  const rect = pixiStage.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
  const h = Math.max(1, Math.round(rect.height)) || window.innerHeight

  app.renderer.resize(w, h)

  // Ensure the canvas always fills its CSS container regardless of autoDensity
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.display = 'block'

  // Diagnostics: log everything that affects visibility
  console.log('[copycat] enterGame diagnostics:', {
    rendererType: app.renderer.constructor.name,
    screenW: app.screen.width,
    screenH: app.screen.height,
    canvasAttrW: app.canvas.width,
    canvasAttrH: app.canvas.height,
    canvasStyleW: app.canvas.style.width,
    canvasStyleH: app.canvas.style.height,
    containerRect: { w: rect.width, h: rect.height },
    pixiStageComputed: {
      w: getComputedStyle(pixiStage).width,
      h: getComputedStyle(pixiStage).height,
    },
    stageChildren: app.stage.children.length,
  })

  ensureAudioUnlocked()
  startDanceMusic()

  danceState = startDance(danceState)
  currentPose = 'idle'

  // Reset visual cats
  for (const cat of catContainers) {
    app.stage.removeChild(cat)
  }
  catContainers = []

  const playerCat = createCat()
  app.stage.addChild(playerCat)
  catContainers.push(playerCat)
  layoutCats(catContainers, app.screen.width, app.screen.height)

  // Force an immediate render so the first frame is visible before ticker kicks in
  app.render()

  // Expose debug state on window for console inspection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__copycatDebug = {
    app,
    playerCat,
    canvas: app.canvas,
    screen: { w: app.screen.width, h: app.screen.height },
  }

  prevCatCount = 1
  lastAnnouncedPose = null
  announcedMilestones.clear()
  gameStatus.textContent = 'Dance started! Mirror the moves.'

  if (gameLoopCallback) {
    Ticker.shared.remove(gameLoopCallback)
  }

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = ticker.deltaMS

    // Feed latest pose from motion engine into state
    danceState = updatePose(danceState, currentPose)

    // Advance song progress
    danceState = progressSong(danceState, deltaMs)

    // Handle newly spawned cats
    if (danceState.cats.length > prevCatCount) {
      for (let i = prevCatCount; i < danceState.cats.length; i++) {
        const newCat = createCat()
        app.stage.addChild(newCat)
        catContainers.push(newCat)
      }

      // Recompute layout so every cat knows its target position
      layoutCats(catContainers, app.screen.width, app.screen.height)

      for (let i = prevCatCount; i < danceState.cats.length; i++) {
        const container = catContainers[i]
        const targetX = container.x
        const fromX = app.screen.width + 60
        animateCatJoin(container, fromX, targetX)
        sfxCatJoin()
      }

      gameFeedback.textContent = `A new cat joined! Total cats: ${danceState.cats.length}`
      announceCatJoin(danceState.cats.length - 1)
      prevCatCount = danceState.cats.length
    }

    // Sync visual poses
    let didPoseChange = false
    for (let i = 0; i < danceState.cats.length; i++) {
      const catState = danceState.cats[i]
      const container = catContainers[i]
      if (container) {
        animatePose(container, catState.pose, 150)
      }
      if (i === 0 && catState.pose !== lastAnnouncedPose) {
        didPoseChange = true
      }
    }
    if (didPoseChange) {
      lastAnnouncedPose = danceState.cats[0]?.pose ?? null
      if (lastAnnouncedPose) announcePose(lastAnnouncedPose)
    }

    // Milestone announcements
    for (const milestone of [0.25, 0.5, 0.75] as const) {
      if (danceState.songProgress >= milestone && !announcedMilestones.has(milestone)) {
        announceSongMilestone(milestone)
        announcedMilestones.add(milestone)
      }
    }

    // Update HUD
    progressDisplay.textContent = `Progress: ${Math.floor(danceState.songProgress * 100)}%`
    catCountDisplay.textContent = `Cats: ${danceState.cats.length}`

    // Song complete?
    if (danceState.songProgress >= 1 && danceState.phase !== 'complete') {
      danceState = completeDance(danceState)
      if (gameLoopCallback) {
        Ticker.shared.remove(gameLoopCallback)
        gameLoopCallback = null
      }
      fadeOutMusic()
      setTimeout(() => stopDanceMusic(), 1600)
      stopMotionTracking()
      showScreen('end-screen')
      gameStatus.textContent = 'Dance complete! Great job.'
    }
  }

  Ticker.shared.add(gameLoopCallback)
}

// ── Reset / replay ───────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback) {
    Ticker.shared.remove(gameLoopCallback)
    gameLoopCallback = null
  }
  stopDanceMusic()
  stopMotionTracking()

  if (app) {
    for (const cat of catContainers) {
      app.stage.removeChild(cat)
    }
  }
  catContainers = []

  danceState = createInitialState()
  currentPose = 'idle'
  prevCatCount = 0
  lastAnnouncedPose = null
  announcedMilestones.clear()

  showScreen('start-screen')

  if (cameraGranted && cameraPreview) {
    startMotionTracking(cameraPreview, (pose) => {
      currentPose = pose
    })
  }

  gameStatus.textContent = 'Returned to start screen.'
}

// ── Visibility handling ────────────────────────────────────────────────────────

function handleVisibilityChange(): void {
  if (document.hidden) {
    Ticker.shared.stop()
    stopDanceMusic()
  } else {
    Ticker.shared.start()
    if (danceState.phase === 'dancing') {
      startDanceMusic()
    }
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
