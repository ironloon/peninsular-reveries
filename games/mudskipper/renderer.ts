import { Application, Container, Graphics } from 'pixi.js'
import { buildSprite, mudskipperModel } from './sprites.js'
import type { SplashParticle, MudState } from './types.js'

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
  message.textContent = 'Unable to start the mudskipper pond. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Mudskipper creation ────────────────────────────────────────────────────

export interface MudskipperGraphics {
  container: Container
  parts: Map<string, Graphics>
  nativeBounds: { x: number; y: number; width: number; height: number }
}

const mudskipperPartsMap = new WeakMap<Container, MudskipperGraphics>()

export function createMudskipper(tint?: number): Container {
  const overrides: Record<string, string | number> | undefined =
    tint != null ? { base: tint } : undefined

  const { container, parts, nativeBounds } = buildSprite(mudskipperModel, overrides)

  const graphics: MudskipperGraphics = {
    container,
    parts,
    nativeBounds,
  }

  mudskipperPartsMap.set(container, graphics)
  return container
}

export function getMudskipperParts(container: Container): MudskipperGraphics | undefined {
  return mudskipperPartsMap.get(container)
}

// ── Mud rendering ──────────────────────────────────────────────────────────

const MUD_COLORS = [0x3e2723, 0x4e342e, 0x5d4037, 0x6d4c41, 0x5d4037]

export function createMudGraphics(stageWidth: number, stageHeight: number, mud: MudState): Graphics {
  const g = new Graphics()
  drawMud(g, stageWidth, stageHeight, mud)
  return g
}

export function updateMudGraphics(g: Graphics, stageWidth: number, stageHeight: number, mud: MudState): void {
  g.clear()
  drawMud(g, stageWidth, stageHeight, mud)
}

function drawMud(g: Graphics, stageWidth: number, stageHeight: number, mud: MudState): void {
  const surfaceY = stageHeight * (1 - mud.level)
  const baseColor = MUD_COLORS[0]

  // Main mud body
  g.moveTo(0, stageHeight)
  g.lineTo(0, surfaceY)

  const segments = Math.max(12, Math.floor(stageWidth / 40))
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = t * stageWidth
    const wave = Math.sin(t * Math.PI * 4 + mud.wavePhase) * 6
      + Math.sin(t * Math.PI * 7 + mud.wavePhase * 1.3) * 3
    g.lineTo(x, surfaceY + wave)
  }

  g.lineTo(stageWidth, stageHeight)
  g.closePath()
  g.fill({ color: baseColor })

  // Surface highlight band
  g.moveTo(0, surfaceY + 4)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = t * stageWidth
    const wave = Math.sin(t * Math.PI * 4 + mud.wavePhase) * 6
      + Math.sin(t * Math.PI * 7 + mud.wavePhase * 1.3) * 3
    g.lineTo(x, surfaceY + wave + 4)
  }
  g.lineTo(stageWidth, surfaceY + 4)
  g.lineTo(stageWidth, surfaceY + 18)
  g.lineTo(0, surfaceY + 18)
  g.closePath()
  g.fill({ color: MUD_COLORS[2], alpha: 0.5 })

  // Bubbles near surface
  const bubbleCount = Math.floor(stageWidth / 80)
  for (let i = 0; i < bubbleCount; i++) {
    const bx = ((i * 73.3) % stageWidth)
    const by = surfaceY + 12 + Math.sin(mud.wavePhase + i * 2.1) * 8
    const br = 2 + Math.sin(mud.wavePhase * 0.7 + i) * 1.5
    g.circle(bx, by, Math.max(1, br))
    g.fill({ color: MUD_COLORS[3], alpha: 0.35 })
  }
}

// ── Particle rendering ─────────────────────────────────────────────────────

export function createSplashGraphics(particle: SplashParticle): Graphics {
  const g = new Graphics()
  if (particle.size > 3) {
    g.circle(0, 0, particle.size)
  } else {
    g.rect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
  }
  const alpha = Math.max(0, particle.life / particle.maxLife)
  g.fill({ color: particle.color, alpha })
  g.x = particle.x
  g.y = particle.y
  return g
}

export function updateSplashGraphics(g: Graphics, particle: SplashParticle): void {
  g.x = particle.x
  g.y = particle.y
  const alpha = Math.max(0, particle.life / particle.maxLife)
  g.alpha = alpha
}

// ── Background ─────────────────────────────────────────────────────────────

export function createSkyGraphics(stageWidth: number, stageHeight: number): Graphics {
  const g = new Graphics()
  // Warm muddy background tone
  g.rect(0, 0, stageWidth, stageHeight)
  g.fill({ color: 0x1a120b })

  // Distant mud banks
  const bankColor = 0x2d1f16
  g.moveTo(0, stageHeight * 0.6)
  g.bezierCurveTo(stageWidth * 0.25, stageHeight * 0.55, stageWidth * 0.5, stageHeight * 0.58, stageWidth * 0.75, stageHeight * 0.52)
  g.bezierCurveTo(stageWidth * 0.85, stageHeight * 0.5, stageWidth, stageHeight * 0.55, stageWidth, stageHeight * 0.6)
  g.lineTo(stageWidth, stageHeight)
  g.lineTo(0, stageHeight)
  g.closePath()
  g.fill({ color: bankColor })

  return g
}
