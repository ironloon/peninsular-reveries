// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Application, Graphics, Text, Container } from 'pixi.js'
import { requestCamera, startMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { sfxTap, sfxSelect, ensureAudioUnlocked } from './sounds.js'
import { announceAction } from './accessibility.js'

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
const SWATCHES = [0x1a1a33, 0x2a2a4e, 0xce93d8, 0x4fc3f7, 0xffffff]
const C = {
  bg: SWATCHES[0],
  bgLight: SWATCHES[1],
  accent: SWATCHES[2],
  hand: SWATCHES[3],
  text: SWATCHES[4],
}

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
  const cameraPrompt = document.querySelector('.swi-camera-prompt') as HTMLElement
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
  let gameRunning = false
  let score = 0

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Point at letters hidden in the scene to select them and spell the word.'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click or tap to interact.'
  }

  startBtn.addEventListener('click', enterGame)
  replayBtn.addEventListener('click', resetToStart)

  const bgGfx = new Graphics()
  const handGfx = new Graphics()
  const sceneGfx = new Graphics()
  const hudContainer = new Container()

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    showScreen('game-screen')
    gameRunning = true
    score = 0

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 600)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
    const h = Math.max(1, Math.round(rect.height)) || window.innerHeight
    app.renderer.resize(w, h)

    app.stage.removeChildren()
    app.stage.addChild(bgGfx)
    app.stage.addChild(sceneGfx)
    app.stage.addChild(handGfx)
    app.stage.addChild(hudContainer)

    if (app.ticker.count) app.ticker.remove(gameLoop)
    app.ticker.add(gameLoop)
  }

  let lastTapTime = 0
  let lastSelectTime = 0

  function gameLoop(_ticker: { deltaMS: number }): void {
    if (!app || !gameRunning) return
    const sw = app.screen.width
    const sh = app.screen.height
    const now = performance.now()

    // Background
    bgGfx.clear()
    bgGfx.rect(0, 0, sw, sh).fill({ color: C.bg })
    // Subtle ground/scene area
    bgGfx.rect(0, sh * 0.7, sw, sh * 0.3).fill({ color: C.bgLight })
    bgGfx.moveTo(0, sh * 0.7).lineTo(sw, sh * 0.7).stroke({ color: C.accent, width: 1, alpha: 0.3 })

    // Scene graphics - show interactive zones
    sceneGfx.clear()
    const numZones = 5
    const zoneW = (sw - 20 * (numZones + 1)) / numZones
    for (let i = 0; i < numZones; i++) {
      const zx = 20 + i * (zoneW + 20)
      const zy = sh * 0.45
      const zh = sh * 0.2
      sceneGfx.roundRect(zx, zy, zoneW, zh, 8).fill({ color: C.bgLight, alpha: 0.8 })
      sceneGfx.roundRect(zx, zy, zoneW, zh, 8).stroke({ color: C.accent, alpha: 0.3, width: 1 })

      const label = new Text({ text: ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E'][i], style: { fill: C.accent, fontSize: 14, fontFamily: 'system-ui' } })
      label.anchor.set(0.5, 0.5)
      label.position.set(zx + zoneW / 2, zy + zh / 2)
      sceneGfx.addChild(label)
    }

    // Title text
    const titleText = new Text({ text: 'Super Word Immersive', style: { fill: C.accent, fontSize: 24, fontFamily: 'system-ui', fontWeight: 'bold' } })
      titleText.anchor.set(0.5, 0)
      sceneGfx.addChild(titleText)

    // Title in HUD handled by hud text
    // Hand tracking
    const bodies = cameraGranted ? activeBodies : []
    handGfx.clear()

    for (const body of bodies) {
      const hx = (1 - body.normalizedX) * sw
      const hy = body.normalizedY * sh

      handGfx.circle(hx, hy, 24).fill({ color: C.hand, alpha: 0.15 })
      handGfx.circle(hx, hy, 10).fill({ color: C.hand, alpha: 0.4 })

      // Detect interaction with zones
      for (let i = 0; i < numZones; i++) {
        const zx = 20 + i * (zoneW + 20)
        const zy = sh * 0.45
        const zh = sh * 0.2
        if (hx >= zx && hx <= zx + zoneW && hy >= zy && hy <= zy + zh) {
          if (body.armsUp && now - lastSelectTime > 800) {
            sfxSelect()
            lastSelectTime = now
            score += 10
            announceAction('Selected zone ' + (i + 1))
          } else if (now - lastTapTime > 400) {
            sfxTap()
            lastTapTime = now
          }
          handGfx.roundRect(zx, zy, zoneW, zh, 8).stroke({ color: C.accent, width: 2 })
        }
      }
    }

    // HUD
    hudContainer.removeChildren()
    const scoreText = new Text({ text: `Score: ${score}`, style: { fill: C.accent, fontSize: 18, fontFamily: 'system-ui' } })
    scoreText.position.set(10, 10)
    hudContainer.addChild(scoreText)

    scoreDisplay.textContent = `${score} pts`
  }

  function resetToStart(): void {
    gameRunning = false
    if (app) app.ticker.remove(gameLoop)
    showScreen('start-screen')
    gameStatus.textContent = 'Ready to play!'
    score = 0
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