import { Application, Container, Graphics } from 'pixi.js'
import type { PianoKey } from './types.js'

async function checkRendererHealth(app: Application): Promise<boolean> {
  const g = new Graphics()
  g.rect(0, 0, 50, 50)
  g.fill({ color: 0xff0000 })
  app.stage.addChild(g)
  app.render()

  const temp = document.createElement('canvas')
  temp.width = 50
  temp.height = 50
  const ctx = temp.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    app.stage.removeChild(g)
    g.destroy()
    return false
  }

  try {
    ctx.drawImage(app.canvas, 0, 0, 50, 50, 0, 0, 50, 50)
    const data = ctx.getImageData(0, 0, 50, 50).data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 200 && data[i + 1] < 50 && data[i + 2] < 50) {
        app.stage.removeChild(g)
        g.destroy()
        app.render()
        return true
      }
    }
  } catch {
    // broken renderer
  }

  app.stage.removeChild(g)
  g.destroy()
  app.render()
  return false
}

async function tryCreateApp(container: HTMLElement, preference: 'webgpu' | 'webgl' | 'canvas'): Promise<Application | null> {
  const app = new Application()
  try {
    await app.init({
      preference,
      backgroundAlpha: 0,
      autoDensity: true,
    })
    container.appendChild(app.canvas)
    return app
  } catch {
    return null
  }
}

export async function initStage(canvasContainer: HTMLElement): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    const app = await tryCreateApp(canvasContainer, preference)
    if (!app) continue

    const healthy = await checkRendererHealth(app)
    if (healthy) return app

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(app as any).destroy(true)
    canvasContainer.innerHTML = ''
  }

  const message = document.createElement('p')
  message.style.color = '#e0e0e0'
  message.style.textAlign = 'center'
  message.style.padding = '2rem'
  message.textContent = 'Unable to start the piano. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Piano key colors ────────────────────────────────────────────────────────

const WHITE_KEY_IDLE = 0xf5f5f0
const WHITE_KEY_ACTIVE = 0xffd54f
const WHITE_KEY_SUSTAINED = 0xffab00
const BLACK_KEY_IDLE = 0x1a1a1a
const BLACK_KEY_ACTIVE = 0x7c4dff
const BLACK_KEY_SUSTAINED = 0x651fff
const KEY_BORDER = 0x555555

// ── Key geometry stored for redrawing ────────────────────────────────────────

interface KeyGeometry {
  x: number
  y: number
  w: number
  h: number
  isBlack: boolean
}

const keyGraphicsMap = new Map<string, Graphics>()
const keyGeometryMap = new Map<string, KeyGeometry>()
let keyContainer: Container | null = null
let tunaContainer: Container | null = null
let tunaProgressGraphics: Graphics | null = null

// ── Layout constants ────────────────────────────────────────────────────────

const TUNA_ZONE_RATIO = 0.15
const PIANO_TOP_PAD = 8

export function createPianoKeys(app: Application, keys: PianoKey[]): void {
  if (keyContainer) {
    app.stage.removeChild(keyContainer)
  }
  keyContainer = new Container()
  keyContainer.label = 'piano-keys'
  keyGraphicsMap.clear()
  keyGeometryMap.clear()

  const w = app.screen.width
  const h = app.screen.height
  const tunaZoneHeight = h * TUNA_ZONE_RATIO
  const pianoTop = tunaZoneHeight + PIANO_TOP_PAD
  const pianoHeight = h - pianoTop

  // Draw white keys first (background)
  const whiteKeys = keys.filter((k) => !k.isBlack)
  for (const key of whiteKeys) {
    const geo: KeyGeometry = {
      x: key.x0 * w,
      y: pianoTop + key.y0 * pianoHeight,
      w: (key.x1 - key.x0) * w - 1,
      h: pianoHeight * (1 - key.y0),
      isBlack: false,
    }
    keyGeometryMap.set(key.note, geo)

    const g = new Graphics()
    drawWhiteKey(g, geo, false, false)
    keyContainer.addChild(g)
    keyGraphicsMap.set(key.note, g)
  }

  // Draw black keys on top
  const blackKeys = keys.filter((k) => k.isBlack)
  for (const key of blackKeys) {
    const geo: KeyGeometry = {
      x: key.x0 * w,
      y: pianoTop + key.y0 * pianoHeight,
      w: (key.x1 - key.x0) * w,
      h: pianoTop + key.y1 * pianoHeight - (pianoTop + key.y0 * pianoHeight),
      isBlack: true,
    }
    keyGeometryMap.set(key.note, geo)

    const g = new Graphics()
    drawBlackKey(g, geo, false, false)
    keyContainer.addChild(g)
    keyGraphicsMap.set(key.note, g)
  }

  app.stage.addChild(keyContainer)
}

function drawWhiteKey(g: Graphics, geo: KeyGeometry, active: boolean, sustained: boolean): void {
  g.clear()
  const color = active ? (sustained ? WHITE_KEY_SUSTAINED : WHITE_KEY_ACTIVE) : WHITE_KEY_IDLE
  const alpha = active ? 0.7 : 0.55

  g.rect(geo.x, geo.y, geo.w, geo.h)
  g.fill({ color, alpha })

  if (active) {
    // Glow border
    g.rect(geo.x - 2, geo.y - 2, geo.w + 4, geo.h + 4)
    g.stroke({ color, width: 3, alpha: 0.3 })
    g.rect(geo.x, geo.y, geo.w, geo.h)
    g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 })
  } else {
    g.rect(geo.x, geo.y, geo.w, geo.h)
    g.stroke({ color: KEY_BORDER, width: 1, alpha: 0.3 })
  }
}

function drawBlackKey(g: Graphics, geo: KeyGeometry, active: boolean, sustained: boolean): void {
  g.clear()
  const color = active ? (sustained ? BLACK_KEY_SUSTAINED : BLACK_KEY_ACTIVE) : BLACK_KEY_IDLE
  const alpha = active ? 0.9 : 0.75

  g.roundRect(geo.x, geo.y, geo.w, geo.h, 4)
  g.fill({ color, alpha })

  if (active) {
    // Glow
    g.roundRect(geo.x - 2, geo.y - 2, geo.w + 4, geo.h + 4, 6)
    g.stroke({ color, width: 3, alpha: 0.4 })
    g.roundRect(geo.x, geo.y, geo.w, geo.h, 4)
    g.stroke({ color: 0xffffff, width: 1, alpha: 0.4 })
  } else {
    g.roundRect(geo.x, geo.y, geo.w, geo.h, 4)
    g.stroke({ color: 0x333333, width: 1, alpha: 0.5 })
  }
}

export function updateKeyVisuals(activeNotes: Map<string, { sustained: boolean }>, _keys: PianoKey[]): void {
  for (const [note, geo] of keyGeometryMap) {
    const g = keyGraphicsMap.get(note)
    if (!g) continue

    const active = activeNotes.has(note)
    const sustained = active && (activeNotes.get(note)?.sustained ?? false)

    if (geo.isBlack) {
      drawBlackKey(g, geo, active, sustained)
    } else {
      drawWhiteKey(g, geo, active, sustained)
    }
  }
}

// ── Tuna fish ────────────────────────────────────────────────────────────────

export function createTuna(app: Application): void {
  if (tunaContainer) {
    app.stage.removeChild(tunaContainer)
  }
  tunaContainer = drawTunaFish(48)
  tunaContainer.x = app.screen.width - 64
  tunaContainer.y = 16

  // Progress ring
  tunaProgressGraphics = new Graphics()
  tunaContainer.addChild(tunaProgressGraphics)

  app.stage.addChild(tunaContainer)
}

function drawTunaFish(scale: number): Container {
  const container = new Container()
  const g = new Graphics()
  const s = scale / 48

  // Body (ellipse shape)
  g.ellipse(0, 0, 24 * s, 10 * s)
  g.fill({ color: 0x5c9ead, alpha: 0.9 })

  // Tail
  g.moveTo(-20 * s, 0)
  g.lineTo(-32 * s, -8 * s)
  g.lineTo(-28 * s, 0)
  g.lineTo(-32 * s, 8 * s)
  g.closePath()
  g.fill({ color: 0x5c9ead, alpha: 0.9 })

  // Dorsal fin
  g.moveTo(-2 * s, -8 * s)
  g.lineTo(6 * s, -14 * s)
  g.lineTo(10 * s, -8 * s)
  g.closePath()
  g.fill({ color: 0x4a8a9b, alpha: 0.8 })

  // Belly fin
  g.moveTo(0, 8 * s)
  g.lineTo(-4 * s, 14 * s)
  g.lineTo(6 * s, 8 * s)
  g.closePath()
  g.fill({ color: 0x4a8a9b, alpha: 0.7 })

  // Eye
  g.circle(14 * s, -2 * s, 3 * s)
  g.fill({ color: 0xffffff, alpha: 0.9 })
  g.circle(15 * s, -2 * s, 1.5 * s)
  g.fill({ color: 0x1a1a2e, alpha: 0.9 })

  // Mouth
  g.arc(22 * s, 1 * s, 3 * s, -0.3, 0.3)
  g.stroke({ color: 0x3a6a7b, width: 1.5 * s })

  // Stripe detail
  g.moveTo(-8 * s, -6 * s)
  g.lineTo(8 * s, -6 * s)
  g.stroke({ color: 0x4a8a9b, width: 1 * s, alpha: 0.4 })
  g.moveTo(-6 * s, 4 * s)
  g.lineTo(6 * s, 4 * s)
  g.stroke({ color: 0x4a8a9b, width: 1 * s, alpha: 0.4 })

  container.addChild(g)
  return container
}

export function updateTunaProgress(holdProgress: number): void {
  if (!tunaProgressGraphics || !tunaContainer) return

  tunaProgressGraphics.clear()

  if (holdProgress > 0) {
    const radius = 36
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + holdProgress * Math.PI * 2

    // Background ring
    tunaProgressGraphics.circle(0, 0, radius)
    tunaProgressGraphics.stroke({ color: 0xffd54f, width: 4, alpha: 0.5 })

    // Progress arc
    tunaProgressGraphics.arc(0, 0, radius, startAngle, endAngle)
    tunaProgressGraphics.stroke({ color: 0xff6b6b, width: 6, alpha: 0.9 })

    // Pulsing glow when close to completion
    if (holdProgress > 0.7) {
      const pulseAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.2
      tunaProgressGraphics.circle(0, 0, radius + 8)
      tunaProgressGraphics.fill({ color: 0xff6b6b, alpha: pulseAlpha })
    }
  }
}

export function updateTunaPosition(app: Application): void {
  if (!tunaContainer) return
  tunaContainer.x = app.screen.width - 64
  tunaContainer.y = 16
}

export function animateTunaBob(time: number): void {
  if (!tunaContainer) return
  tunaContainer.y = 16 + Math.sin(time / 800) * 3
  tunaContainer.scale.x = 1 + Math.sin(time / 1200) * 0.02
}

export function cleanupStage(app: Application): void {
  if (keyContainer) {
    app.stage.removeChild(keyContainer)
    keyContainer = null
  }
  if (tunaContainer) {
    app.stage.removeChild(tunaContainer)
    tunaContainer = null
  }
  tunaProgressGraphics = null
  keyGraphicsMap.clear()
  keyGeometryMap.clear()
}

export function resizePiano(app: Application, keys: PianoKey[]): void {
  createPianoKeys(app, keys)
  updateTunaPosition(app)
}