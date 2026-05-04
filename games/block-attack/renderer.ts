import { Application, Container, Graphics } from 'pixi.js'
import type { Block, Particle } from './types.js'

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
  message.textContent = 'Unable to start the block stage. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Smash zone (body indicator) ──────────────────────────────────────────────

export function createSmashZone(): Graphics {
  const g = new Graphics()

  // Outer glow ring
  g.circle(0, 0, 55)
  g.fill({ color: 0xff4444, alpha: 0.08 })
  g.circle(0, 0, 55)
  g.stroke({ color: 0xff6644, width: 3, alpha: 0.6 })

  // Inner ring
  g.circle(0, 0, 25)
  g.fill({ color: 0xff4444, alpha: 0.12 })

  // Crosshair lines
  g.moveTo(-40, 0)
  g.lineTo(-15, 0)
  g.stroke({ color: 0xff6644, width: 2, alpha: 0.5 })
  g.moveTo(15, 0)
  g.lineTo(40, 0)
  g.stroke({ color: 0xff6644, width: 2, alpha: 0.5 })
  g.moveTo(0, -40)
  g.lineTo(0, -15)
  g.stroke({ color: 0xff6644, width: 2, alpha: 0.5 })
  g.moveTo(0, 15)
  g.lineTo(0, 40)
  g.stroke({ color: 0xff6644, width: 2, alpha: 0.5 })

  return g
}

// ── Block rendering ────────────────────────────────────────────────────────

const blockContainerMap = new WeakMap<Container, Graphics>()

export function createBlockGraphics(block: Block): Container {
  const container = new Container()
  const g = new Graphics()

  // Main block body
  g.roundRect(-block.width / 2, -block.height / 2, block.width, block.height, 4)
  g.fill({ color: block.color })

  // Slight highlight on top edge
  g.rect(-block.width / 2 + 2, -block.height / 2, block.width - 4, 3)
  g.fill({ color: 0xffffff, alpha: 0.25 })

  // Slight shadow on bottom edge
  g.rect(-block.width / 2 + 2, block.height / 2 - 3, block.width - 4, 3)
  g.fill({ color: 0x000000, alpha: 0.15 })

  // Outline
  g.roundRect(-block.width / 2, -block.height / 2, block.width, block.height, 4)
  g.stroke({ color: 0x000000, alpha: 0.3, width: 1 })

  container.addChild(g)
  container.x = block.x
  container.y = block.y
  container.alpha = block.opacity

  blockContainerMap.set(container, g)
  return container
}

export function updateBlockGraphics(container: Container, block: Block): void {
  container.x = block.x
  container.y = block.y
  container.rotation = block.rotation
  container.alpha = Math.max(0, block.opacity)

  // Shake effect when damaged
  if (block.damageTimer > 0 && !block.destroyed) {
    const shake = (Math.sin(block.damageTimer * 0.05) * 3)
    container.x += shake
  }
}

// ── Ground / city floor ──────────────────────────────────────────────────

export function createGroundGraphics(width: number, height: number): Graphics {
  const g = new Graphics()

  // Ground
  const floorY = height - 20
  g.rect(0, floorY, width, 20)
  g.fill({ color: 0x3a3632 })

  // Cracks / texture
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width
    const y = floorY + 4 + Math.random() * 12
    g.moveTo(x, y)
    g.lineTo(x + 8 + Math.random() * 20, y + (Math.random() - 0.5) * 4)
    g.stroke({ color: 0x2a2622, width: 1, alpha: 0.6 })
  }

  // Top line
  g.rect(0, floorY, width, 2)
  g.fill({ color: 0x554e48 })

  return g
}

// ── Sky background ────────────────────────────────────────────────────────

export function createSkyGraphics(width: number, height: number): Graphics {
  const g = new Graphics()

  // Night city sky gradient
  const steps = 16
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const r = Math.round(8 + t * 12)
    const gv = Math.round(6 + t * 16)
    const b = Math.round(20 + t * 35)
    g.rect(0, (height * t), width, height / steps + 1)
    g.fill({ color: (r << 16) | (gv << 8) | b, alpha: 0.85 })
  }

  // City skyline silhouette in the far background
  const skylineY = height * 0.45
  for (let i = 0; i < 30; i++) {
    const bx = Math.random() * width
    const bw = 15 + Math.random() * 35
    const bh = 30 + Math.random() * 80
    g.rect(bx, skylineY + 60 - bh, bw, bh + height)
    g.fill({ color: 0x0a0a18, alpha: 0.5 })
  }

  // Stars
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * width
    const sy = Math.random() * height * 0.5
    const size = 1 + Math.random() * 2
    g.circle(sx, sy, size)
    g.fill({ color: 0xffffff, alpha: 0.3 + Math.random() * 0.4 })
  }

  return g
}

// ── Particle rendering ────────────────────────────────────────────────────

export function createParticleGraphics(particle: Particle): Graphics {
  const g = new Graphics()

  if (particle.size > 4) {
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

export function updateParticleGraphics(g: Graphics, particle: Particle): void {
  g.x = particle.x
  g.y = particle.y
  const alpha = Math.max(0, particle.life / particle.maxLife)
  g.alpha = alpha
}

// ── Combo flash ──────────────────────────────────────────────────────────

export function createComboFlash(x: number, y: number, combo: number): Graphics {
  const g = new Graphics()
  const radius = 30 + combo * 5

  g.circle(0, 0, radius)
  g.fill({ color: 0xffaa00, alpha: 0.15 + Math.min(combo * 0.05, 0.3) })
  g.circle(0, 0, radius)
  g.stroke({ color: 0xffcc00, width: 2, alpha: 0.4 })

  g.x = x
  g.y = y
  return g
}