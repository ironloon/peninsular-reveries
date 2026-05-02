import { Application, Container, Graphics, Ticker } from 'pixi.js'
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

  // Wait two animation frames + CSS transition so the browser fully removes [hidden]
  // and applies the .active CSS transition (520ms).
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(resolve, 600)
    }))
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

  // Detect the actual renderer type using PixiJS internal enum:
  // RendererType.WEBGL = 1, RendererType.WEBGPU = 2, RendererType.CANVAS = 4
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeNum = (app.renderer as any).type as number
  const realRendererType = typeNum === 2 ? 'webgpu' : typeNum === 1 ? 'webgl' : typeNum === 4 ? 'canvas2d' : `unknown(${typeNum})`

  // ── Spotlight overlay (canvas already has opaque dark background from init) ──
  for (let i = app.stage.children.length - 1; i >= 0; i--) {
    const child = app.stage.children[i]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((child as any).__copycatSpotlight) {
      app.stage.removeChild(child)
    }
  }
  const sw = app.screen.width
  const sh = app.screen.height
  const spotlight = new Graphics()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(spotlight as any).__copycatSpotlight = true
  const cx = sw / 2
  const cy = sh * 0.4
  const maxRadius = Math.max(sw, sh) * 0.55
  const steps = 12
  for (let i = steps; i >= 0; i--) {
    const radius = maxRadius * (i / steps)
    const alpha = 0.18 * (1 - i / steps)
    spotlight.circle(cx, cy, radius)
    spotlight.fill({ color: 0xff6b9d, alpha })
  }
  app.stage.addChildAt(spotlight, 0)

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

  // Render first frame so content is visible immediately
  app.render()

  // Detect build SHA from script tag so user can verify they're on latest code
  const scriptTag = document.querySelector('script[src*="copycat/main.js"]') as HTMLScriptElement | null
  const buildSha = scriptTag?.src.match(/v=([a-f0-9]+)/)?.[1] ?? 'unknown'
  // Diagnostics: log renderer, stage state, and build SHA
  console.log('[copycat] enterGame diagnostics:', {
    buildSha,
    realRendererType,
    screenW: app.screen.width,
    screenH: app.screen.height,
    stageChildren: app.stage.children.length,
  })

  // Expose debug state on window for console inspection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__copycatDebug = {
    app,
    playerCat,
    canvas: app.canvas,
    screen: { w: app.screen.width, h: app.screen.height },
    buildSha,
    rendererType: realRendererType,
  }

  prevCatCount = 1
  lastAnnouncedPose = null
  announcedMilestones.clear()
  gameStatus.textContent = 'Dance started! Mirror the moves.'

  if (gameLoopCallback) {
    app.ticker.remove(gameLoopCallback)
  }

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = ticker.deltaMS

    danceState = updatePose(danceState, currentPose)
    danceState = progressSong(danceState, deltaMs)

    if (danceState.cats.length > prevCatCount) {
      for (let i = prevCatCount; i < danceState.cats.length; i++) {
        const newCat = createCat()
        app.stage.addChild(newCat)
        catContainers.push(newCat)
      }
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

    for (const milestone of [0.25, 0.5, 0.75] as const) {
      if (danceState.songProgress >= milestone && !announcedMilestones.has(milestone)) {
        announceSongMilestone(milestone)
        announcedMilestones.add(milestone)
      }
    }

    progressDisplay.textContent = `Progress: ${Math.floor(danceState.songProgress * 100)}%`
    catCountDisplay.textContent = `Cats: ${danceState.cats.length}`

    if (danceState.songProgress >= 1 && danceState.phase !== 'complete') {
      danceState = completeDance(danceState)
      if (gameLoopCallback) {
        app.ticker.remove(gameLoopCallback)
        gameLoopCallback = null
      }
      fadeOutMusic()
      setTimeout(() => stopDanceMusic(), 1600)
      stopMotionTracking()
      showScreen('end-screen')
      gameStatus.textContent = 'Dance complete! Great job.'
    }
  }

  app.ticker.add(gameLoopCallback)
}

// ── Reset / replay ───────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback) {
    app?.ticker.remove(gameLoopCallback)
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
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
    stopDanceMusic()
  } else {
    app.ticker.start()
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
