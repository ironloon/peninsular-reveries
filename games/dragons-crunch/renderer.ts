import { Application, Container, Graphics } from 'pixi.js'
import { dragonModel, buildSprite } from './sprites.js'
import type { FoodItem, Particle, MotionBody } from './types.js'

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
  message.textContent = 'Unable to start the dragon stage. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Dragon head creation ────────────────────────────────────────────────────

export interface DragonHeadGraphics {
  container: Container
  skull: Graphics
  jaw: Graphics
  eye: Graphics
  rest: {
    jawY: number
  }
  nativeBounds: { x: number; y: number; width: number; height: number }
}

const dragonPartsMap = new WeakMap<Container, DragonHeadGraphics>()

export function createDragon(tint?: number): Container {
  const overrides: Record<string, string | number> | undefined =
    tint != null ? { base: tint } : undefined

  const { container, parts, nativeBounds } = buildSprite(dragonModel, overrides)

  const graphics: DragonHeadGraphics = {
    container,
    skull: parts.get('skull')!,
    jaw: parts.get('jaw')!,
    eye: parts.get('eye')!,
    rest: {
      jawY: parts.get('jaw')!.y,
    },
    nativeBounds,
  }

  dragonPartsMap.set(container, graphics)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(container as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  return container
}

export function getDragonParts(container: Container): DragonHeadGraphics | undefined {
  return dragonPartsMap.get(container)
}

// ── AR positioning: head overlay, 2x person size, smooth lerp ────────────

// Base scale: dragon head is about 48 native px wide. If a person occupies ~1/5
// of frame width (~200px on a 1000px screen), and we want the dragon DOUBLE
// that, scale = 200 / 48 * 2 = ~8.3 at default, more for larger detected bodies.

export function computeDragonScale(
  body: MotionBody,
  stageWidth: number,
  _stageHeight: number,
): number {
  // Person's apparent width in pixels
  const personWidthPx = body.spreadX * stageWidth
  // Native dragon width ~48. We want the dragon to be 2x the person's head width.
  // Heuristic: a person on camera is roughly 2x their head width total.
  // So dragon scale = (personWidthPx / 48) * 1.0 to get body-size, * 2 for 2x head.
  const baseScale = Math.max(stageWidth, 480) * 0.0022
  const bodyScale = (personWidthPx / 48) * 2.5
  return Math.max(baseScale * 0.6, Math.min(baseScale * 3.5, bodyScale))
}

export function computeDragonTarget(
  body: MotionBody,
  scale: number,
  stageWidth: number,
  stageHeight: number,
): { x: number; y: number } {
  // Head center overlay: place the dragon slightly above body centroid
  const x = (1 - body.normalizedX) * stageWidth // mirror
  // Lift the dragon so its jaw/throat roughly covers the person's head area
  const faceY = (body.normalizedY - body.spreadY * 0.30) * stageHeight
  const nativeHeight = 44 // approx native head height
  const y = faceY + nativeHeight * scale * 0.15
  return {
    x: Math.max(60, Math.min(stageWidth - 60, x)),
    y: Math.max(nativeHeight * scale * 0.3, Math.min(stageHeight - 10, y)),
  }
}

// ── Food rendering (more stylized) ──────────────────────────────────────

const foodGraphicsMap = new WeakMap<Graphics, FoodItem>()
const foodContainerMap = new WeakMap<Container, Graphics>()

export function createFoodGraphics(food: FoodItem): Container {
  const container = new Container()
  const g = new Graphics()

  if (food.value === 5) {
    // Large: spiky star / gem shape
    const r = food.radius
    const spikes = 6
    g.moveTo(r, 0)
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI * i) / spikes
      const rad = i % 2 === 0 ? r : r * 0.5
      g.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
    }
    g.closePath()
    g.fill({ color: food.color })
    // Inner shine
    g.circle(-r * 0.15, -r * 0.15, r * 0.3)
    g.fill({ color: 0xffffff, alpha: 0.35 })
  } else {
    // Small: irregular rounded shape (like a berry/nugget)
    const r = food.radius
    g.moveTo(r, 0)
    g.bezierCurveTo(r, r * 0.6, r * 0.3, r, 0, r)
    g.bezierCurveTo(-r * 0.8, r, -r, r * 0.4, -r, 0)
    g.bezierCurveTo(-r, -r * 0.7, -r * 0.3, -r * 0.9, 0, -r)
    g.bezierCurveTo(r * 0.6, -r, r, -r * 0.5, r, 0)
    g.closePath()
    g.fill({ color: food.color })
    g.circle(-r * 0.2, -r * 0.2, r * 0.25)
    g.fill({ color: 0xffffff, alpha: 0.3 })
  }

  container.addChild(g)
  container.x = food.x
  container.y = food.y
  container.rotation = (food.x + food.y) * 0.01 // subtle per-item rotation

  foodGraphicsMap.set(g, food)
  foodContainerMap.set(container, g)
  return container
}

export function updateFoodPosition(container: Container, food: FoodItem): void {
  container.x = food.x
  container.y = food.y
  container.alpha = food.eaten ? 0 : 1
}

// ── Particle rendering ────────────────────────────────────────────────────

export function createParticleGraphics(particle: Particle): Graphics {
  const g = new Graphics()
  if (particle.size > 4) {
    g.circle(0, 0, particle.size)
  } else {
    g.rect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
  }
  const alpha = particle.life / particle.maxLife
  g.fill({ color: particle.color, alpha })
  g.x = particle.x
  g.y = particle.y
  return g
}

export function updateParticleGraphics(g: Graphics, particle: Particle): void {
  g.x = particle.x
  g.y = particle.y
  const alpha = Math.max(0, particle.life / particle.maxLife)
  g.alpha = alpha
}
