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
    rest: {
      jawY: parts.get('jaw')!.y,
    },
    nativeBounds,
  }

  dragonPartsMap.set(container, graphics)
  return container
}

export function getDragonParts(container: Container): DragonHeadGraphics | undefined {
  return dragonPartsMap.get(container)
}

// ── AR positioning ──────────────────────────────────────────────────────────

export function computeDragonScale(
  body: MotionBody,
  stageWidth: number,
  _stageHeight: number,
): number {
  const personWidthPx = body.spreadX * stageWidth
  const baseScale = Math.max(stageWidth, 480) * 0.0024
  const bodyScale = (personWidthPx / 48) * 2.8
  return Math.max(baseScale * 0.7, Math.min(baseScale * 4, bodyScale))
}

export function computeDragonTarget(
  body: MotionBody,
  scale: number,
  stageWidth: number,
  stageHeight: number,
): { x: number; y: number } {
  const x = (1 - body.normalizedX) * stageWidth
  const faceY = (body.normalizedY - body.spreadY * 0.25) * stageHeight
  const nativeH = 44
  return {
    x: Math.max(60, Math.min(stageWidth - 60, x)),
    y: Math.max(nativeH * scale * 0.25, Math.min(stageHeight - 10, faceY + nativeH * scale * 0.1)),
  }
}

// ── Food rendering ──────────────────────────────────────────────────────────

const foodGraphicsMap = new WeakMap<Graphics, FoodItem>()
const foodContainerMap = new WeakMap<Container, Graphics>()

export function createFoodGraphics(food: FoodItem): Container {
  const container = new Container()

  if (food.value >= 5) {
    // Large bumpy lumpy shape: big blob with overlapping bumps + dots
    const r = food.radius
    const g = new Graphics()

    // Main lumpy body
    g.circle(0, 0, r)
    g.fill({ color: food.color })

    // Side bumps
    g.circle(-r * 0.6, -r * 0.2, r * 0.55)
    g.fill({ color: food.color })
    g.circle(r * 0.55, r * 0.1, r * 0.5)
    g.fill({ color: food.color })
    g.circle(-r * 0.1, r * 0.5, r * 0.45)
    g.fill({ color: food.color })
    g.circle(r * 0.1, -r * 0.55, r * 0.4)
    g.fill({ color: food.color })

    // Dot highlights
    g.circle(-r * 0.25, -r * 0.25, r * 0.15)
    g.fill({ color: 0xffffff, alpha: 0.3 })
    g.circle(r * 0.2, r * 0.15, r * 0.1)
    g.fill({ color: 0xffffff, alpha: 0.25 })
    g.circle(-r * 0.15, r * 0.3, r * 0.08)
    g.fill({ color: 0xffffff, alpha: 0.2 })

    container.addChild(g)
  } else {
    // Small: irregular rounded berry
    const r = food.radius
    const g = new Graphics()
    g.moveTo(r, 0)
    g.bezierCurveTo(r, r * 0.6, r * 0.3, r, 0, r)
    g.bezierCurveTo(-r * 0.8, r, -r, r * 0.4, -r, 0)
    g.bezierCurveTo(-r, -r * 0.7, -r * 0.3, -r * 0.9, 0, -r)
    g.bezierCurveTo(r * 0.6, -r, r, -r * 0.5, r, 0)
    g.closePath()
    g.fill({ color: food.color })

    g.circle(-r * 0.2, -r * 0.2, r * 0.25)
    g.fill({ color: 0xffffff, alpha: 0.3 })

    container.addChild(g)
  }

  container.x = food.x
  container.y = food.y

  foodGraphicsMap.set(container.children[0] as Graphics, food)
  foodContainerMap.set(container, container.children[0] as Graphics)
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
