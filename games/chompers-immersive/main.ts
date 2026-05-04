// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Application, Container, Graphics, Text } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxCorrect, sfxWrong, sfxGameOver, ensureAudioUnlocked } from './sounds.js'
import { announceCorrect, announceWrong, announceGameOver, announceRound } from './accessibility.js'
import { createInitialState, selectAnswer, resolveChomp, advanceRound, type Area, type GameState } from './state.js'

// ── PixiJS v8 initialization ──────────────────────────────────────────────
export async function initStage(container: HTMLElement): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    try {
      const app = new Application()
      await app.init({ preference, backgroundAlpha: 0, autoDensity: true, resizeTo: container })
      container.appendChild(app.canvas)
      return app
    } catch { continue }
  }
  return null
}

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg: 0x0a1628,
  bgLight: 0x1a2a44,
  score: 0xffd700,
  lives: 0xff4444,
  fruit: 0x44ff88,
  wrong: 0xff4444,
  hand: 0x44aaff,
  particle: 0xffff88,
  hippo: 0x8ca0b8,
  hippoDark: 0x5a6a7a,
  text: 0xffffff,
  textShadow: 0x000000,
}

// ── Drawing helpers ────────────────────────────────────────────────────────
function drawBackground(g: Graphics, w: number, h: number): void {
  g.clear()
  g.rect(0, 0, w, h).fill({ color: C.bg })
  // Bottom ground
  g.rect(0, h * 0.75, w, h * 0.25).fill({ color: C.bgLight })
  // Ground line
  g.moveTo(0, h * 0.75).lineTo(w, h * 0.75).stroke({ color: 0x2a3a4a, width: 2 })
}

function drawHandZone(g: Graphics, body: MotionBody, w: number, h: number): void {
  const px = (1 - body.normalizedX) * w
  const py = body.normalizedY * h
  const radius = Math.max(body.spreadX, body.spreadY) * Math.min(w, h) * 0.4
  g.clear()
  g.circle(px, py, Math.max(8, radius)).fill({ color: C.hand, alpha: 0.15 })
  g.circle(px, py, 12).fill({ color: C.hand, alpha: 0.4 })
}

function drawHippo(g: Graphics, x: number, y: number, mouthOpen: number): void {
  g.clear()
  // Body
  g.ellipse(x, y, 60, 40).fill({ color: C.hippo })
  // Head
  g.circle(x - 30, y - 20, 28).fill({ color: C.hippo })
  // Eyes
  g.circle(x - 40, y - 28, 5).fill({ color: 0xffffff })
  g.circle(x - 25, y - 28, 5).fill({ color: 0xffffff })
  g.circle(x - 41, y - 28, 2).fill({ color: 0x000000 })
  g.circle(x - 24, y - 28, 2).fill({ color: 0x000000 })
  // Nostrils
  g.circle(x - 38, y - 12, 3).fill({ color: C.hippoDark })
  g.circle(x - 30, y - 12, 3).fill({ color: C.hippoDark })
  // Mouth
  const jawY = y - 8 + mouthOpen * 12
  g.roundRect(x - 50, jawY, 40, 8 + mouthOpen * 10, 4).fill({ color: C.hippoDark })
  // Teeth
  g.rect(x - 42, jawY - 2, 4, 5).fill({ color: 0xffffff })
  g.rect(x - 34, jawY - 2, 4, 5).fill({ color: 0xffffff })
}

function drawFruit(g: Graphics, x: number, y: number, emoji: string, scale: number): void {
  g.clear()
  g.circle(x, y, 18 * scale).fill({ color: C.fruit, alpha: 0.6 })
}

function drawHUD(hudContainer: Container, state: GameState): void {
  hudContainer.removeChildren()
  const scoreText = new Text({ text: `Score: ${state.score}`, style: { fill: C.score, fontSize: 20, fontFamily: 'system-ui' } })
  scoreText.position.set(10, 10)
  hudContainer.addChild(scoreText)

  const livesStr = '♥'.repeat(Math.max(0, state.lives))
  const livesText = new Text({ text: livesStr, style: { fill: C.lives, fontSize: 20, fontFamily: 'system-ui' } })
  livesText.position.set(10, 36)
  hudContainer.addChild(livesText)

  const roundText = new Text({ text: `Round ${state.round}/${state.totalRounds}`, style: { fill: C.text, fontSize: 16, fontFamily: 'system-ui' } })
  roundText.position.set(10, 62)
  hudContainer.addChild(roundText)
}

// ── Game constants ─────────────────────────────────────────────────────────
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

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const replayBtn = document.getElementById('replay-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.ci-camera-prompt') as HTMLElement
    const gameStatus = document.getElementById('game-status')!

  const app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the game stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  let cameraGranted = false
  let activeBodies: MotionBody[] = []

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Move your hand to select the correct answer!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Use mouse or touch to play.'
  }

  let gameState: GameState
  let gameLoopCallback: ((ticker: { deltaMS: number }) => void) | null = null
  let bgGfx = new Graphics()
  let handGfx = new Graphics()
  let hippoGfx = new Graphics()
  let fruitGraphics: Graphics[] = []
  let hudContainer = new Container()
  let lastMouthOpen = 0

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    showScreen('game-screen')

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 600)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
    const h = Math.max(1, Math.round(rect.height)) || window.innerHeight
    app.renderer.resize(w, h)

    const area: Area = 'matching'
    gameState = createInitialState(area, 1, Date.now())

    app.stage.removeChildren()
    bgGfx = new Graphics()
    handGfx = new Graphics()
    hippoGfx = new Graphics()
    fruitGraphics = []
    hudContainer = new Container()

    app.stage.addChild(bgGfx)
    app.stage.addChild(hippoGfx)
    for (let i = 0; i < gameState.sceneItems.length; i++) {
      const fg = new Graphics()
      fruitGraphics.push(fg)
      app.stage.addChild(fg)
    }
    app.stage.addChild(handGfx)
    app.stage.addChild(hudContainer)

    if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

    // Mouse/touch fallback for targeting fruits
    // Pointer position (mouse/touch fallback)
    const onPointerMove = (e: PointerEvent) => {
      const pixiRect = pixiStage.getBoundingClientRect()
      pointerX = e.clientX - pixiRect.left
      pointerY = e.clientY - pixiRect.top
    }
    pixiStage.addEventListener('pointermove', onPointerMove)

    gameLoopCallback = (_ticker) => {
      if (!app) return
      // const _dt = ticker.deltaMS
      const sw = app.screen.width
      const sh = app.screen.height

      drawBackground(bgGfx, sw, sh)

      // Hippo
      const hippoX = sw * 0.2
      const hippoY = sh * 0.55 + Math.sin(performance.now() * 0.003) * 4
      const mouthTarget = gameState.phase === 'playing' ? Math.sin(performance.now() * 0.005) * 0.3 + 0.2 : 0
      lastMouthOpen += (mouthTarget - lastMouthOpen) * 0.1
      drawHippo(hippoGfx, hippoX, hippoY, lastMouthOpen)

      // Frutis
      // Make sure we have the right number of graphics objects
      while (fruitGraphics.length < gameState.sceneItems.length) {
        const fg = new Graphics()
        fruitGraphics.push(fg)
        app.stage.addChild(fg)
      }
      while (fruitGraphics.length > gameState.sceneItems.length) {
        const fg = fruitGraphics.pop()
        if (fg && fg.parent) fg.parent.removeChild(fg)
      }

      for (let i = 0; i < gameState.sceneItems.length; i++) {
        const item = gameState.sceneItems[i]
        const fx = sw * 0.35 + i * (sw * 0.12)
        const fy = sh * 0.4 + Math.sin(performance.now() * 0.003 + i) * sh * 0.02
        drawFruit(fruitGraphics[i], fx, fy, item.emoji, 1)
      }

      // Hand tracking overlay
      const primaryBody = cameraGranted ? activeBodies[0] : null
      if (primaryBody) {
        drawHandZone(handGfx, primaryBody, sw, sh)

        // Check if hand overlaps any fruit for selection
        const hx = (1 - primaryBody.normalizedX) * sw
        const hy = primaryBody.normalizedY * sh
        const holdTime = primaryBody.armsUp ? 500 : 0 // Use armsUp to trigger selection hold
        if (holdTime > 0 && gameState.phase === 'playing') {
          for (let i = 0; i < gameState.sceneItems.length; i++) {
            const item = gameState.sceneItems[i]
            const fx = sw * 0.35 + i * (sw * 0.12)
            const fy = sh * 0.4 + Math.sin(performance.now() * 0.003 + i) * sh * 0.02
            const dist = Math.hypot(hx - fx, hy - fy)
            if (dist < 40) {
              onSelectAnswer(item.id)
              break
            }
          }
        }
      } else {
        handGfx.clear()
      }

      drawHUD(hudContainer, gameState)
    }

    app.ticker.add(gameLoopCallback)
  }

  let selectCooldown = 0
  function onSelectAnswer(itemId: string): void {
    if (gameState.phase !== 'playing') return
    if (selectCooldown > 0) return
    selectCooldown = 800

    gameState = selectAnswer(gameState, itemId)
    gameState = resolveChomp(gameState)

    if (!gameState.sceneItems.find((i) => i.id === itemId)) return

    if (selectedItem.isCorrect) {
      sfxCorrect()
      announceCorrect(selectedItem.value, 0)
    } else {
      sfxWrong()
      announceWrong(selectedItem.value, gameState.currentProblem.correctAnswer)
    }

    setTimeout(() => {
      selectCooldown = 0
      gameState = advanceRound(gameState)
      if (gameState.phase === 'gameover') {
        showEndScreen(gameState)
      } else {
        announceRound(gameState.round, gameState.totalRounds)
      }
    }, 800)
  }

  function showEndScreen(endState: GameState): void {
    if (gameLoopCallback && app) {
      app.ticker.remove(gameLoopCallback)
      gameLoopCallback = null
    }
    stopMotionTracking()
    showScreen('end-screen')
    const endScoreEl = document.getElementById('end-score')
    const endAccuracyEl = document.getElementById('end-accuracy')
    if (endScoreEl) endScoreEl.textContent = `${endState.score}`
    const total = endState.totalRounds
    const correct = endState.correctCount
    if (endAccuracyEl) endAccuracyEl.textContent = total > 0 ? `${Math.round((correct / total) * 100)}%` : '0%'
    sfxGameOver()
    announceGameOver(endState)
  }

  function resetToStart(): void {
    if (gameLoopCallback && app) {
      app.ticker.remove(gameLoopCallback)
      gameLoopCallback = null
    }
    showScreen('start-screen')
    gameStatus.textContent = 'Ready to play!'
    if (cameraGranted && cameraPreview) {
      startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    }
  }

  document.addEventListener('restart', () => resetToStart())
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}