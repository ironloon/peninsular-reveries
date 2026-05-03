import { Application, Container, Graphics } from 'pixi.js'
import { dragonModel, buildSprite } from './sprites.js'
import type { FoodItem, Particle, MotionBody } from './types.js'

// ── Renderer health check ──────────────────────────────────────────────────

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

// ── Stage init ────────────────────────────────────────────────────────────

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
  head: Graphics
  upperJaw: Graphics
  lowerJaw: Graphics
  leftEye: Graphics
  rightEye: Graphics
  brow: Graphics
  crest: Graphics
  leftHorn: Graphics
  rightHorn: Graphics
  nostrils: Graphics
  rest: {
    lowerJawY: number
    headY: number
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
    head: parts.get('head')!,
    upperJaw: parts.get('upperJaw')!,
    lowerJaw: parts.get('lowerJaw')!,
    leftEye: parts.get('leftEye')!,
    rightEye: parts.get('rightEye')!,
    brow: parts.get('brow')!,
    crest: parts.get('crest')!,
    leftHorn: parts.get('leftHorn')!,
    rightHorn: parts.get('rightHorn')!,
    nostrils: parts.get('nostrils')!,
    rest: {
      lowerJawY: parts.get('lowerJaw')!.y,
      headY: parts.get('head')!.y,
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

// ── AR head positioning ──────────────────────────────────────────────────────

export function positionDragonOverlay(
  dragon: Container,
  body: MotionBody,
  stageWidth: number,
  stageHeight: number,
): void {
  const parts = dragonPartsMap.get(dragon)
  const nativeHeight = parts?.nativeBounds.height ?? 44

  // Scale head to match person's apparent size in frame
  const baseScale = Math.min(stageWidth, stageHeight) * 0.005
  const sizeScale = 0.7 + body.spreadY * 1.6
  const scale = baseScale * sizeScale

  dragon.scale.set(scale)

  // Position head so it covers the person's head area
  // normalizedY ~ 0.3 means upper body, ~0.6 means lower body
  // We want the dragon head centered on upper body / face region
  const x = body.normalizedX * stageWidth
  const faceY = (body.normalizedY - body.spreadY * 0.35) * stageHeight

  dragon.x = Math.max(40, Math.min(stageWidth - 40, x))
  dragon.y = Math.max(nativeHeight * scale * 0.2, Math.min(stageHeight - 20, faceY + nativeHeight * scale * 0.1))
}

// ── Food rendering ──────────────────────────────────────────────────────────

const foodGraphicsMap = new WeakMap<Graphics, FoodItem>()
const foodContainerMap = new WeakMap<Container, Graphics>()

export function createFoodGraphics(food: FoodItem): Container {
  const container = new Container()
  const g = new Graphics()

  if (food.value === 5) {
    g.circle(0, 0, food.radius)
    g.fill({ color: food.color })
    g.circle(-food.radius * 0.3, -food.radius * 0.3, food.radius * 0.25)
    g.fill({ color: 0xffffff, alpha: 0.35 })
  } else {
    g.circle(0, 0, food.radius)
    g.fill({ color: food.color })
    g.circle(-food.radius * 0.25, -food.radius * 0.25, food.radius * 0.2)
    g.fill({ color: 0xffffff, alpha: 0.3 })
  }

  container.addChild(g)
  container.x = food.x
  container.y = food.y

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
  if (particle.size > 3) {
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
