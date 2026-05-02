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

  // Detect the actual renderer type (minified class names are useless)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = app.renderer as any
  const isWebGL = typeof r.gl !== 'undefined'
  const isWebGPU = typeof r.gpu !== 'undefined' || typeof r.device !== 'undefined'
  const isCanvas2D = typeof r.context !== 'undefined'
  const realRendererType = isWebGPU ? 'webgpu' : isWebGL ? 'webgl' : isCanvas2D ? 'canvas2d' : 'unknown'

  // ── Build background using ACTUAL dimensions ──
  // Remove old background if it exists
  for (let i = app.stage.children.length - 1; i >= 0; i--) {
    const child = app.stage.children[i]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((child as any).__copycatBg) {
      app.stage.removeChild(child)
    }
  }
  const sw = app.screen.width
  const sh = app.screen.height
  const bg = new Graphics()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(bg as any).__copycatBg = true
  bg.rect(0, 0, sw, sh)
  bg.fill({ color: 0x2d2d44 }) // slightly lighter than page bg so canvas boundary is visible

  // Spotlight
  const cx = sw / 2
  const cy = sh * 0.4
  const maxRadius = Math.max(sw, sh) * 0.55
  const steps = 12
  for (let i = steps; i >= 0; i--) {
    const radius = maxRadius * (i / steps)
    const alpha = 0.18 * (1 - i / steps)
    bg.circle(cx, cy, radius)
    bg.fill({ color: 0xff6b9d, alpha })
  }
  app.stage.addChildAt(bg, 0)

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

  // Render and verify pixels
  app.render()

  const dataUrl = app.canvas.toDataURL()
  const pixelBytes = atob(dataUrl.split(',')[1]).length
  let visiblePixels = 0
  let transparentPixels = 0
  if (isCanvas2D) {
    try {
      const ctx2d = app.canvas.getContext('2d')
      if (ctx2d) {
        const imgData = ctx2d.getImageData(0, 0, app.canvas.width, app.canvas.height)
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] > 0) visiblePixels++
          else transparentPixels++
        }
      }
    } catch { /* ignore */ }
  }

  // Diagnostics
  console.log('[copycat] enterGame diagnostics:', {
    realRendererType,
    screenW: app.screen.width,
    screenH: app.screen.height,
    canvasAttrW: app.canvas.width,
    canvasAttrH: app.canvas.height,
    pixelBytes,
    visiblePixels,
    transparentPixels,
    stageChildren: app.stage.children.length,
  })

  // Expose debug state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__copycatDebug = {
    app,
    playerCat,
    canvas: app.canvas,
    screen: { w: app.screen.width, h: app.screen.height },
    rendererType: realRendererType,
    pixelBytes,
  }

  // ── Fallback: if PixiJS produced no visible pixels, try raw 2D ──
  if (visiblePixels === 0 && pixelBytes < 5000) {
    console.warn('[copycat] PixiJS produced no visible pixels — attempting raw Canvas 2D fallback')
    const rawCtx = app.canvas.getContext('2d')
    if (rawCtx) {
      rawCtx.fillStyle = '#ff0000'
      rawCtx.fillRect(0, 0, 200, 200)
      rawCtx.fillStyle = '#ffffff'
      rawCtx.font = '20px sans-serif'
      rawCtx.fillText('Rendering fallback', 10, 110)
      console.log('[copycat] Raw 2D fallback drawn')
    }

    const debugEl = document.createElement('div')
    debugEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ff0000;color:#fff;padding:2rem;z-index:9999;font-family:sans-serif;'
    debugEl.innerHTML = `<p><strong>Copycat rendering issue</strong></p><p>Renderer: ${realRendererType}</p><p>Canvas: ${app.canvas.width}x${app.canvas.height}</p><p>Please try Chrome or Edge.</p>`
    document.body.appendChild(debugEl)

    // Also show in the stage container
    pixiStage.style.border = '6px dashed #ff0000'
    pixiStage.style.background = '#440000'

    // Don't start the ticker loop if rendering is broken
    return
  }

  // Visible border for debugging (can be removed later)
  app.canvas.style.border = '2px dashed #00ff00'
  app.canvas.style.boxSizing = 'border-box'

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
