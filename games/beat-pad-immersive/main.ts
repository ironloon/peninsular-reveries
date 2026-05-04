// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Application, Graphics, Text } from 'pixi.js'
import { requestCamera, startMotionTracking, stopMotionTracking } from '../../client/camera.js'
import type { MotionBody } from '../../client/camera.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { ensureAudioUnlocked, triggerKitPad } from './sounds.js'

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

const C = {
  bg: 0x0d0d1a,
  padBorder: 0x333355,
  text: 0xffffff,
  hand: 0x44aaff,
  active: 0xff44cc,
  neonPink: 0xff44cc,
  neonCyan: 0x44ffff,
  neonGreen: 0x44ff88,
  neonYellow: 0xffff44,
  neonOrange: 0xff8844,
}

const PAD_COLORS = [0xff4466, 0xff8844, 0xffcc44, 0x44ff88, 0x44ccff, 0x8844ff, 0xff44aa, 0xff44cc]
const PAD_LABELS = ['KICK', 'SNARE', 'CLAP', 'HI-HAT', 'TOM', 'CYMBAL', 'RIM', 'OPEN HH']

async function boot(): Promise<void> {
  const pixiStage = document.getElementById('pixi-stage')!
  const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
  const startBtn = document.getElementById('start-btn') as HTMLButtonElement
  const cameraPrompt = document.querySelector('.bpi-camera-prompt') as HTMLElement

  const app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the stage. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  let cameraGranted = false
  let activeBodies: MotionBody[] = []

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (bodies) => { activeBodies = bodies })
    cameraPrompt.textContent = 'Camera access granted! Wave your hands over the pads to trigger sounds!'
  } else {
    cameraPrompt.textContent = 'Camera not available. Click or tap pads to play.'
  }

  const currentBank: 'kit' | 'bass' = 'kit'
  // eslint-disable-next-line prefer-const
let padHitTimes = new Array(8).fill(0)

  let bgGfx = new Graphics()
  let padGfxList: Graphics[] = []
  let handGfx = new Graphics()
  const hudText = new Text({ text: 'Beat Pad Immersive', style: { fill: C.text, fontSize: 18, fontFamily: 'system-ui' } })

  startBtn.addEventListener('click', enterGame)

  async function enterGame(): Promise<void> {
    ensureAudioUnlocked()
    const startScreen = document.getElementById('start-screen')!
    const gameScreen = document.getElementById('game-screen')!
    startScreen.hidden = true
    startScreen.setAttribute('inert', '')
    gameScreen.hidden = false
    gameScreen.classList.add('active')
    gameScreen.removeAttribute('inert')

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 600)))
    })

    const rect = pixiStage.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
    const h = Math.max(1, Math.round(rect.height)) || window.innerHeight
    app.renderer.resize(w, h)

    app.stage.removeChildren()

    bgGfx = new Graphics()
    handGfx = new Graphics()
    padGfxList = []
    for (let i = 0; i < 8; i++) {
      const pg = new Graphics()
      padGfxList.push(pg)
    }

    app.stage.addChild(bgGfx)
    for (const pg of padGfxList) app.stage.addChild(pg)
    app.stage.addChild(handGfx)
    app.stage.addChild(hudText)

    if (app.ticker.count) app.ticker.remove(gameLoop)
    app.ticker.add(gameLoop)
  }

  let prevTriggeredPads = new Set<number>()

  function gameLoop(_ticker: { deltaMS: number; _unused?: unknown }): void {
    if (!app) return
    const sw = app.screen.width
    const sh = app.screen.height
    const now = performance.now()

    // Background
    bgGfx.clear()
    bgGfx.rect(0, 0, sw, sh).fill({ color: C.bg })

    // Draw pads in 2x4 grid
    const padCols = 4
    const padRows = 2
    const padGap = 12
    const padW = (sw - padGap * (padCols + 1)) / padCols
    const padH = (sh * 0.55 - padGap * (padRows + 1)) / padRows
    const topOffset = sh * 0.15

    const triggeredPads = new Set<number>()

    for (let i = 0; i < 8; i++) {
      const col = i % padCols
      const row = Math.floor(i / padCols)
      const px = padGap + col * (padW + padGap)
      const py = topOffset + padGap + row * (padH + padGap)

      const timeSinceHit = now - padHitTimes[i]
      const flashAlpha = Math.max(0, 1 - timeSinceHit / 400)

      padGfxList[i].clear()
      if (flashAlpha > 0) {
        padGfxList[i].roundRect(px - 4, py - 4, padW + 8, padH + 8, 12).fill({ color: C.active, alpha: flashAlpha * 0.4 })
      }
      padGfxList[i].roundRect(px, py, padW, padH, 8).fill({ color: PAD_COLORS[i], alpha: 0.7 + flashAlpha * 0.3 })
      padGfxList[i].roundRect(px, py, padW, padH, 8).stroke({ color: C.padBorder, width: 2 })

      // Label
      const label = new Text({ text: PAD_LABELS[i], style: { fill: 0xffffff, fontSize: Math.min(14, padW / 8), fontFamily: 'system-ui', fontWeight: 'bold' } })
      label.anchor.set(0.5, 0.5)
      label.position.set(px + padW / 2, py + padH / 2)
      padGfxList[i].addChild(label)
    }

    // Hand tracking
        handGfx.clear()
    const bodies = cameraGranted ? activeBodies : []

    for (const body of bodies) {
      const hx = (1 - body.normalizedX) * sw
      const hy = body.normalizedY * sh

      // Check which pad the hand is over
      for (let i = 0; i < 8; i++) {
        const col = i % padCols
        const row = Math.floor(i / padCols)
        const px = padGap + col * (padW + padGap)
        const py = topOffset + padGap + row * (padH + padGap)

        if (hx >= px && hx <= px + padW && hy >= py && hy <= py + padH) {
          triggeredPads.add(i)
        }
      }

      // Draw hand position
      handGfx.circle(hx, hy, 20).fill({ color: C.hand, alpha: 0.3 })
      handGfx.circle(hx, hy, 8).fill({ color: C.hand, alpha: 0.6 })
    }

    // Trigger newly hit pads
    for (const padIndex of triggeredPads) {
      if (!prevTriggeredPads.has(padIndex)) {
        triggerKitPad(padIndex)
        padHitTimes[padIndex] = now
      }
    }
    prevTriggeredPads = triggeredPads

    // HUD
    hudText.text = `Beat Pad Immersive • Bank: ${currentBank.toUpperCase()}`
    hudText.position.set(10, 10)
  }

  document.addEventListener('restart', () => {
    if (app) {
      app.ticker.remove(gameLoop)
    }
    stopMotionTracking()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
