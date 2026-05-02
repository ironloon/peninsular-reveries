import { Application, Container, Graphics, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { initStage, createAnimal, getAnimalKind, layoutCats, getCatParts } from './renderer.js'
import { animatePose, animateCatJoin } from './animations.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { ensureAudioUnlocked, startDanceMusic, stopDanceMusic, sfxCatJoin } from './sounds.js'
import { createInitialState, startRound, nextRound, updatePose, progressSong, completeDance } from './state.js'
import type { Pose, DanceState } from './types.js'
import { setupCopycatInput } from './input.js'
import { announcePose, announceCatJoin, announceSongMilestone } from './accessibility.js'

// ── DOM refs ─────────────────────────────────────────────────────────────────

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
const cameraPrompt = document.querySelector('.copycat-camera-prompt') as HTMLElement
const roundDisplay = document.getElementById('round-display')!
const progressDisplay = document.getElementById('progress-display')!
const catCountDisplay = document.getElementById('cat-count')!
const poseIndicator = document.getElementById('pose-indicator')!
const gameStatus = document.getElementById('game-status')!
const gameFeedback = document.getElementById('game-feedback')!
const roundBreakOverlay = document.getElementById('round-break-overlay')!
const roundBreakMsg = document.getElementById('round-break-msg')!
const roundBreakCountdown = document.getElementById('round-break-countdown')!
const replayPreview = document.getElementById('replay-preview') as HTMLElement | null
const replayBtnStart = document.getElementById('replay-btn-start') as HTMLButtonElement | null
const startControls = document.getElementById('start-controls') as HTMLElement | null
const endReel = document.getElementById('end-reel') as HTMLElement | null

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
let danceState: DanceState = createInitialState()
let catContainers: Container[] = []
let currentPose: Pose = 'idle'
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null
let prevCatCount = 0
let lastAnnouncedPose: Pose | null = null
const announcedMilestones = new Set<number>()

let lastRoundHistory: Array<{ pose: Pose; time: number }> = []
let replayTimer: (() => void) | null = null

// ── Stage init ───────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the dance stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    if (enabled && danceState.phase === 'dancing') {
      startDanceMusic(danceState.config)
    }
  })

  setupCopycatInput({ onMenu: () => {
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
    cameraPrompt.textContent = 'Camera not available. Press Start to watch the cats dance!'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)
  replayBtnStart?.addEventListener('click', enterGame)

  document.addEventListener('visibilitychange', handleVisibilityChange)
}

// ── Game entry ───────────────────────────────────────────────────────────────

async function enterGame(): Promise<void> {
  if (!app) return

  stopReplayPreview()

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

  // Spotlight
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
    const alpha = 0.35 * (1 - i / steps)
    spotlight.circle(cx, cy, radius)
    spotlight.fill({ color: 0xff6b9d, alpha })
  }
  app.stage.addChildAt(spotlight, 0)

  ensureAudioUnlocked()
  beginRound()
}

function beginRound(): void {
  if (!app) return

  danceState = startRound(danceState)
  currentPose = 'idle'
  prevCatCount = 1
  lastAnnouncedPose = null
  announcedMilestones.clear()
  roundBreakOverlay.hidden = true

  roundDisplay.textContent = `Round ${danceState.round}/${danceState.maxRounds}`
  progressDisplay.textContent = 'Progress: 0%'
  catCountDisplay.textContent = 'Cats: 1'
  gameStatus.textContent = `Round ${danceState.round} — Strike a pose!`

  // Reset visual cats
  for (const cat of catContainers) {
    app.stage.removeChild(cat)
  }
  catContainers = []

  const playerCat = createAnimal(getAnimalKind(0), 0xffb7c5)
  app.stage.addChild(playerCat)
  catContainers.push(playerCat)
  layoutCats(catContainers, app.screen.width, app.screen.height)

  app.render()

  // Expose debug state on window for console inspection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__copycatDebug = {
    app,
    playerCat,
    canvas: app.canvas,
    screen: { w: app.screen.width, h: app.screen.height },
    buildSha: 'dev',
    rendererType: app.renderer.type,
  }

  startDanceMusic(danceState.config)

  if (gameLoopCallback) {
    app.ticker.remove(gameLoopCallback)
  }

  gameLoopCallback = (ticker) => {
    if (!app) return
    const deltaMs = ticker.deltaMS

    danceState = updatePose(danceState, cameraGranted ? currentPose : 'idle')
    // Cap deltaMs to prevent big jumps when tab throttles or motion blocks the main thread
    const cappedDeltaMs = Math.min(deltaMs, 100)
    danceState = progressSong(danceState, cappedDeltaMs)

    if (danceState.cats.length > prevCatCount) {
      for (let i = prevCatCount; i < danceState.cats.length; i++) {
        const newAnimal = createAnimal(getAnimalKind(i))
        app.stage.addChild(newAnimal)
        catContainers.push(newAnimal)
      }
      layoutCats(catContainers, app.screen.width, app.screen.height)
      for (let i = prevCatCount; i < danceState.cats.length; i++) {
        const container = catContainers[i]
        const targetX = container.x
        // Dance-crew side entry: alternate from left/right
        const fromLeft = i % 2 === 1
        const fromX = fromLeft ? -60 : app.screen.width + 60
        animateCatJoin(container, fromX, targetX)
        sfxCatJoin()
      }
      gameFeedback.textContent = `Cat ${danceState.cats.length} joined the crew!`
      announceCatJoin(danceState.cats.length - 1)
      prevCatCount = danceState.cats.length
    }

    let didPoseChange = false
    const beatSec = 60 / danceState.config.bpm
    const beatT = (performance.now() / 1000) % beatSec / beatSec
    for (let i = 0; i < danceState.cats.length; i++) {
      const catState = danceState.cats[i]
      const container = catContainers[i]
      if (container) {
        animatePose(container, catState.pose, 150)
        const t = performance.now() / 1000
        const parts2 = getCatParts(container)
        if (parts2) {
          // Idle bopping — beat-synced subtle bounce when idle
          const isIdle = catState.pose === 'idle'
          const bounce = isIdle ? Math.sin(beatT * Math.PI * 2) * 1.5 : 0
          const breathe = 1 + Math.sin(t * 3 + i * 1.2) * 0.03
          const tailSway = Math.sin(t * 2.5 + i * 0.8) * 0.15
          parts2.body.scale.y = breathe
          parts2.tail.rotation = tailSway
          if (isIdle) {
            parts2.body.y = bounce
            parts2.head.y = bounce * 0.6
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blink = (container as any).__blinkState
          if (blink) {
            const nowMs = performance.now()
            if (nowMs > blink.nextBlink) {
              blink.open = !blink.open
              const dur = blink.open ? 2000 + Math.random() * 3000 : 120
              blink.nextBlink = nowMs + dur
            }
            const eyeScale = blink.open ? 1 : 0.1
            parts2.leftEye.scale.y = eyeScale
            parts2.rightEye.scale.y = eyeScale
          }
        }
      }
      if (i === 0 && catState.pose !== lastAnnouncedPose) {
        didPoseChange = true
      }
    }
    if (didPoseChange) {
      lastAnnouncedPose = danceState.cats[0]?.pose ?? null
      if (lastAnnouncedPose) announcePose(lastAnnouncedPose)
    }

    if (poseIndicator) {
      const playerPose = danceState.cats[0]?.pose ?? 'idle'
      poseIndicator.textContent = `Pose: ${playerPose.replace(/-/g, ' ')}`
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
      stopDanceMusic()
      handleSongComplete()
    }
  }

  app.ticker.add(gameLoopCallback)
}

// ── Song complete → next round or end screen ────────────────────────────────

function handleSongComplete(): void {
  // Save pose history with relative timestamps for faithful replay
  const base = danceState.poseHistory[0]?.timestamp ?? performance.now()
  lastRoundHistory = danceState.poseHistory.map((h) => ({
    pose: h.pose,
    time: h.timestamp - base,
  }))

  const nextState = nextRound(danceState)

  if (!nextState) {
    // Final round complete
    stopMotionTracking()
    showScreen('end-screen')
    gameStatus.textContent = 'All rounds complete! Great dancing!'
    if (lastRoundHistory.length > 0 && endReel) {
      endReel.hidden = false
      startEndReel()
    }
    return
  }

  danceState = nextState

  // Show round break overlay
  roundBreakMsg.textContent = `Round ${danceState.round - 1} complete!`
  roundBreakOverlay.hidden = false
  roundBreakCountdown.textContent = '3'
  gameStatus.textContent = `Round ${danceState.round} coming up...`

  let count = 3
  const tick = () => {
    count--
    if (count > 0) {
      roundBreakCountdown.textContent = String(count)
    } else if (count === 0) {
      roundBreakCountdown.textContent = 'GO!'
    } else {
      roundBreakOverlay.hidden = true
      beginRound()
      return
    }
    setTimeout(tick, 900)
  }

  setTimeout(tick, 900)
}

// ── Mini Pixi replay stage ─────────────────────────────────────────────────

interface MiniReplay {
  app: Application
  cat: Container
  tick: (ticker: Ticker) => void
}

let miniReplays: MiniReplay[] = []

async function initReplayStage(container: HTMLElement): Promise<MiniReplay | null> {
  const stageW = 120
  const stageH = 100
  const mini = new Application()
  try {
    await mini.init({
      width: stageW,
      height: stageH,
      backgroundAlpha: 0,
      preference: 'canvas',
      autoDensity: true,
    })
  } catch {
    return null
  }

  container.innerHTML = ''
  container.appendChild(mini.canvas)
  mini.canvas.style.width = '100%'
  mini.canvas.style.height = '100%'
  mini.canvas.style.display = 'block'

  const cat = createAnimal('cat', 0xffb7c5)
  cat.scale.set(2.2)
  cat.x = stageW / 2
  cat.y = stageH * 0.78
  mini.stage.addChild(cat)

  const beatDur = 60 / 110 // default beat duration for idle bop

  const tick = (_ticker: Ticker) => {
    const t = performance.now() / 1000
    const beatT = (t % beatDur) / beatDur
    const parts = getCatParts(cat)
    if (parts) {
      const breathe = 1 + Math.sin(t * 3) * 0.03
      const tailSway = Math.sin(t * 2.5) * 0.15
      const bounce = Math.sin(beatT * Math.PI * 2) * 1.5
      parts.body.scale.y = breathe
      parts.tail.rotation = tailSway
      parts.body.y = bounce
      parts.head.y = -14 + bounce * 0.6

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blink = (cat as any).__blinkState
      if (blink) {
        const nowMs = performance.now()
        if (nowMs > blink.nextBlink) {
          blink.open = !blink.open
          const dur = blink.open ? 2000 + Math.random() * 3000 : 120
          blink.nextBlink = nowMs + dur
        }
        const eyeScale = blink.open ? 1 : 0.1
        parts.leftEye.scale.y = eyeScale
        parts.rightEye.scale.y = eyeScale
      }
    }
  }

  mini.ticker.add(tick)

  const replay: MiniReplay = { app: mini, cat, tick }
  miniReplays.push(replay)
  return replay
}

function runReplayAnimation(mini: MiniReplay, speed = 8): (() => void) {
  const history = lastRoundHistory
  if (history.length === 0) {
    animatePose(mini.cat, 'idle', 120)
    return () => {}
  }

  let timeouts: number[] = []

  const setPose = (pose: Pose) => {
    animatePose(mini.cat, pose, 120)
  }

  // First pose immediately
  setPose(history[0].pose)

  for (let i = 1; i < history.length; i++) {
    const delay = (history[i].time - history[i - 1].time) / speed
    const pose = history[i].pose
    const t = window.setTimeout(() => setPose(pose), Math.max(80, delay))
    timeouts.push(t)
  }

  // Auto-loop: restart after a short pause
  const totalDuration = (history[history.length - 1].time - history[0].time) / speed
  const loopT = window.setTimeout(() => {
    const cancel = runReplayAnimation(mini, speed)
    timeouts.push(cancel as unknown as number)
  }, Math.max(1200, totalDuration + 400))
  timeouts.push(loopT)

  return () => {
    for (const t of timeouts) window.clearTimeout(t)
    timeouts = []
  }
}

function destroyReplays(): void {
  for (const mini of miniReplays) {
    mini.app.ticker.remove(mini.tick)
    mini.app.destroy(true, { children: true })
  }
  miniReplays = []
}

async function showReplayPreview(): Promise<void> {
  if (!replayPreview || !startControls) return
  const stage = replayPreview.querySelector('.copycat-replay-stage') as HTMLElement | null
  if (!stage) return

  replayPreview.hidden = false
  startControls.hidden = true

  const mini = await initReplayStage(stage)
  if (!mini) return

  const cancel = runReplayAnimation(mini, 8)
  replayTimer = cancel
}

async function startEndReel(): Promise<void> {
  const stage = endReel?.querySelector('.copycat-replay-stage') as HTMLElement | null
  if (!stage) return

  const mini = await initReplayStage(stage)
  if (!mini) return

  const cancel = runReplayAnimation(mini, 5)
  replayTimer = cancel
}

function stopReplayPreview(): void {
  if (typeof replayTimer === 'function') {
    replayTimer()
  }
  replayTimer = null
  destroyReplays()

  if (replayPreview) replayPreview.hidden = true
  if (endReel) endReel.hidden = true
  if (startControls) startControls.hidden = false
}

// ── Reset / replay ───────────────────────────────────────────────────────────

function resetToStart(): void {
  if (gameLoopCallback) {
    app?.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }
  stopDanceMusic()
  stopMotionTracking()
  stopReplayPreview()

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

  roundBreakOverlay.hidden = true

  showScreen('start-screen')

  if (lastRoundHistory.length > 0) {
    showReplayPreview()
  }

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
      startDanceMusic(danceState.config)
    }
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
