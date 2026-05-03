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
      background: '#0a0a14',
      backgroundAlpha: 0.85,
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

// ── Dragon creation ─────────────────────────────────────────────────────────

export interface DragonGraphics {
  container: Container
  body: Graphics
  head: Graphics
  upperJaw: Graphics
  lowerJaw: Graphics
  leftWing: Graphics
  rightWing: Graphics
  tail: Graphics
  leftEye: Graphics
  rightEye: Graphics
  leftLeg: Graphics
  rightLeg: Graphics
  rest: {
    lowerJawY: number
    leftWingRotation: number
    rightWingRotation: number
    tailRotation: number
  }
  nativeBounds: { x: number; y: number; width: number; height: number }
}

const dragonPartsMap = new WeakMap<Container, DragonGraphics>()

export function createDragon(tint?: number): Container {
  const overrides: Record<string, string | number> | undefined =
    tint != null ? { base: tint } : undefined

  const { container, parts, nativeBounds } = buildSprite(dragonModel, overrides)

  const graphics: DragonGraphics = {
    container,
    body: parts.get('body')!,
    head: parts.get('head')!,
    upperJaw: parts.get('upperJaw')!,
    lowerJaw: parts.get('lowerJaw')!,
    leftWing: parts.get('leftWing')!,
    rightWing: parts.get('rightWing')!,
    tail: parts.get('tail')!,
    leftEye: parts.get('leftEye')!,
    rightEye: parts.get('rightEye')!,
    leftLeg: parts.get('leftLeg')!,
    rightLeg: parts.get('rightLeg')!,
    rest: {
      lowerJawY: parts.get('lowerJaw')!.y,
      leftWingRotation: parts.get('leftWing')!.rotation,
      rightWingRotation: parts.get('rightWing')!.rotation,
      tailRotation: parts.get('tail')!.rotation,
    },
    nativeBounds,
  }

  dragonPartsMap.set(container, graphics)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(container as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  return container
}

export function getDragonParts(container: Container): DragonGraphics | undefined {
  return dragonPartsMap.get(container)
}

// ── Layout helpers ─────────────────────────────────────────────────────────

export function layoutDragons(containers: Container[], stageWidth: number, stageHeight: number): void {
  const groundY = stageHeight * 0.82
  const cx = stageWidth / 2
  const count = containers.length

  for (let i = 0; i < count; i++) {
    const dragon = containers[i]
    const parts = dragonPartsMap.get(dragon)
    const nativeWidth = parts?.nativeBounds.width ?? 44
    const scale = Math.max(2.4, (stageWidth * 0.10) / nativeWidth)

    dragon.scale.set(scale)
    const dragonWidth = nativeWidth * scale
    const gap = dragonWidth + 24

    if (i === 0) {
      dragon.x = cx
    } else if (i % 2 === 1) {
      dragon.x = cx - gap * ((i + 1) / 2)
    } else {
      dragon.x = cx + gap * (i / 2)
    }
    dragon.y = groundY
  }
}

export function positionDragonFromBody(dragon: Container, body: MotionBody, stageWidth: number, stageHeight: number): void {
  const parts = dragonPartsMap.get(dragon)
  const nativeWidth = parts?.nativeBounds.width ?? 44
  const scale = Math.max(2.4, (stageWidth * 0.10) / nativeWidth)
  dragon.scale.set(scale)

  // Mirror: body.normalizedX is from camera (0=left, 1=right).
  // Because the camera preview is CSS-mirrored for the user,
  // we flip so moving left on screen moves dragon left.
  const x = (1 - body.normalizedX) * stageWidth
  const groundY = stageHeight * 0.82

  dragon.x = Math.max(60, Math.min(stageWidth - 60, x))
  dragon.y = groundY
}

// ── Food rendering ──────────────────────────────────────────────────────────

const foodGraphicsMap = new WeakMap<Graphics, FoodItem>()
const foodContainerMap = new WeakMap<Container, Graphics>()

export function createFoodGraphics(food: FoodItem): Container {
  const container = new Container()
  const g = new Graphics()

  // Draw food item
  if (food.value === 5) {
    // Large food: big rounded shape with shine
    g.circle(0, 0, food.radius)
    g.fill({ color: food.color })
    g.circle(-food.radius * 0.3, -food.radius * 0.3, food.radius * 0.25)
    g.fill({ color: 0xffffff, alpha: 0.35 })
  } else {
    // Small food: simple circle
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
  if (food.eaten) {
    container.alpha = 0
  } else {
    container.alpha = 1
  }
}

export function getFoodFromContainer(container: Container): FoodItem | undefined {
  const g = foodContainerMap.get(container)
  if (!g) return undefined
  return foodGraphicsMap.get(g)
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

// ── Fire particles ──────────────────────────────────────────────────────────

export function spawnFireParticles(
  x: number,
  y: number,
  count: number,
  intensity: number,
): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6
    const speed = 2 + Math.random() * 4 * intensity
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 0.8,
      maxLife: 1.4,
      color: Math.random() > 0.4 ? 0xff6600 : 0xffcc00,
      size: 3 + Math.random() * 5 * intensity,
    })
  }
  return particles
}

export function spawnCrunchParticles(x: number, y: number, color: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 3
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.4,
      maxLife: 0.7,
      color,
      size: 2 + Math.random() * 3,
    })
  }
  return particles
}

// ── Ground rendering ───────────────────────────────────────────────────────

export function createGround(stageWidth: number, stageHeight: number): Graphics {
  const g = new Graphics()
  const groundY = stageHeight * 0.82
  g.rect(0, groundY, stageWidth, stageHeight - groundY)
  g.fill({ color: 0x1a3322, alpha: 0.6 })
  // Grass tufts
  for (let i = 0; i < stageWidth; i += 18) {
    const h = 4 + Math.random() * 6
    g.rect(i, groundY - h, 2, h)
    g.fill({ color: 0x2e7d32, alpha: 0.7 })
  }
  return g
}
