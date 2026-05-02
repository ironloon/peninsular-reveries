import { Application, Container, Graphics } from 'pixi.js'
import type { Pose } from './types.js'

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
      background: '#ffffff',
      backgroundAlpha: 0.45,
      autoDensity: true,
    })
    container.appendChild(app.canvas)
    return app
  } catch {
    return null
  }
}

// ── Internal types ─────────────────────────────────────────────────────────

export interface CatGraphics {
  body: Graphics
  head: Graphics
  leftEar: Graphics
  rightEar: Graphics
  leftEye: Graphics
  rightEye: Graphics
  tail: Graphics
  leftFrontLeg: Graphics
  rightFrontLeg: Graphics
  leftBackLeg: Graphics
  rightBackLeg: Graphics
  leftFrontPaw: Graphics
  rightFrontPaw: Graphics
  leftBackPaw: Graphics
  rightBackPaw: Graphics
  // Rest positions so poses are relative (animal-agnostic)
  rest: {
    bodyY: number
    headY: number
    leftFrontLegY: number
    rightFrontLegY: number
    leftBackLegY: number
    rightBackLegY: number
    leftFrontPawY: number
    rightFrontPawY: number
    leftBackPawY: number
    rightBackPawY: number
  }
}

interface PoseTargets {
  bodyY: number
  bodyScaleY: number
  headY: number
  tailRotation: number
  leftFrontPawY: number
  rightFrontPawY: number
  leftBackPawY: number
  rightBackPawY: number
  leftFrontPawRotation: number
  rightFrontPawRotation: number
}

const catPartsMap = new WeakMap<Container, CatGraphics>()

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
  message.textContent = 'Unable to start the dance stage. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Animal creation ─────────────────────────────────────────────────────────

export type AnimalKind = 'cat' | 'giraffe' | 'crocodile' | 'wolf' | 'flamingo'

const BACKUP_ANIMALS: AnimalKind[] = ['crocodile', 'wolf', 'giraffe', 'flamingo']

export function getAnimalKind(index: number): AnimalKind {
  if (index === 0) return 'cat'
  return BACKUP_ANIMALS[(index - 1) % BACKUP_ANIMALS.length]
}

export function createAnimal(kind: AnimalKind, tint?: number): Container {
  switch (kind) {
    case 'cat': return createCat(tint)
    case 'giraffe': return createGiraffe()
    case 'crocodile': return createCrocodile()
    case 'wolf': return createWolf()
    case 'flamingo': return createFlamingo()
  }
}

function buildPartsMap(container: Container, parts: Omit<CatGraphics, 'rest'>): void {
  const fullParts: CatGraphics = {
    ...(parts as CatGraphics),
    rest: {
      bodyY: parts.body.y,
      headY: parts.head.y,
      leftFrontLegY: parts.leftFrontLeg.y,
      rightFrontLegY: parts.rightFrontLeg.y,
      leftBackLegY: parts.leftBackLeg.y,
      rightBackLegY: parts.rightBackLeg.y,
      leftFrontPawY: parts.leftFrontPaw.y,
      rightFrontPawY: parts.rightFrontPaw.y,
      leftBackPawY: parts.leftBackPaw.y,
      rightBackPawY: parts.rightBackPaw.y,
    },
  }
  catPartsMap.set(container, fullParts)
  updateCatPose(container, 'idle', true)
}

// ── Cat (player) ───────────────────────────────────────────────────────────

function createCat(tint?: number): Container {
  const cat = new Container()
  const BASE = tint != null ? tint : 0x000000
  const EYE = 0xffffff

  const tail = new Graphics()
  tail.moveTo(-10, 0)
  tail.lineTo(-20, -10)
  tail.lineTo(-26, -6)
  tail.lineTo(-22, 2)
  tail.lineTo(-16, 4)
  tail.lineTo(-10, 2)
  tail.closePath()
  tail.fill({ color: BASE })
  cat.addChild(tail)

  const body = new Graphics()
  body.roundRect(-14, -10, 28, 24, 12)
  body.fill({ color: BASE })
  cat.addChild(body)

  const head = new Graphics()
  head.circle(0, 0, 10)
  head.fill({ color: BASE })

  const leftEar = new Graphics()
  leftEar.moveTo(-7, -8)
  leftEar.lineTo(-4, -18)
  leftEar.lineTo(-1, -8)
  leftEar.closePath()
  leftEar.fill({ color: BASE })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.moveTo(1, -8)
  rightEar.lineTo(4, -18)
  rightEar.lineTo(7, -8)
  rightEar.closePath()
  rightEar.fill({ color: BASE })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-3.5, -1, 2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(3.5, -1, 2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  cat.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(cat as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  const legColor = BASE

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1.5, 0, 3, 9, 1.5)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -10
  leftBackLeg.y = 8
  cat.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-3, 0, 6, 4, 2)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -10
  leftBackPaw.y = 16
  cat.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1.5, 0, 3, 9, 1.5)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -3
  rightBackLeg.y = 8
  cat.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-3, 0, 6, 4, 2)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -3
  rightBackPaw.y = 16
  cat.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-1.5, 0, 3, 9, 1.5)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 3
  leftFrontLeg.y = 8
  cat.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-3, 0, 6, 4, 2)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 3
  leftFrontPaw.y = 16
  cat.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-1.5, 0, 3, 9, 1.5)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 10
  rightFrontLeg.y = 8
  cat.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-3, 0, 6, 4, 2)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 10
  rightFrontPaw.y = 16
  cat.addChild(rightFrontPaw)

  buildPartsMap(cat, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return cat
}

// ── Giraffe ─────────────────────────────────────────────────────────────────

// ── Giraffe ─────────────────────────────────────────────────────────────────

function createGiraffe(): Container {
  const g = new Container()
  const BASE = 0xC9A96E
  const DARK = 0x8B6914
  const EYE = 0xffffff

  // Tufted tail
  const tail = new Graphics()
  tail.moveTo(-8, -4)
  tail.lineTo(-18, -16)
  tail.lineTo(-14, -18)
  tail.lineTo(-10, -8)
  tail.closePath()
  tail.fill({ color: DARK })
  g.addChild(tail)

  // Tall rectangular body
  const body = new Graphics()
  body.roundRect(-11, -14, 22, 32, 9)
  body.fill({ color: BASE })
  g.addChild(body)

  // Bold polygon spots as children of body
  const spots = new Graphics()
  spots.moveTo(-5, -6)
  spots.lineTo(-2, -10)
  spots.lineTo(1, -7)
  spots.lineTo(-1, -3)
  spots.closePath()
  spots.moveTo(4, 2)
  spots.lineTo(7, -2)
  spots.lineTo(9, 3)
  spots.lineTo(5, 5)
  spots.closePath()
  spots.moveTo(-6, 8)
  spots.lineTo(-3, 5)
  spots.lineTo(0, 9)
  spots.lineTo(-4, 11)
  spots.closePath()
  spots.fill({ color: DARK })
  g.addChild(spots)

  // Head with very long built-in neck — narrower than the body
  const head = new Graphics()
  head.roundRect(-2, -12, 4, 30, 2) // very thin neck
  head.fill({ color: BASE })
  head.circle(0, -24, 9) // slightly wider head circle
  head.fill({ color: BASE })

  // Ossicones (horn nubs) — small knobs on top
  const leftEar = new Graphics()
  leftEar.roundRect(-5, -32, 3, 5, 1)
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.roundRect(2, -32, 3, 5, 1)
  rightEar.fill({ color: DARK })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-3.5, -24, 2.2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(3.5, -24, 2.2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  g.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(g as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Extra-long thin legs
  const legColor = BASE

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1.2, 0, 2.4, 16, 1)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -9
  leftBackLeg.y = 8
  g.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -9
  leftBackPaw.y = 18
  g.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1.2, 0, 2.4, 16, 1)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -2
  rightBackLeg.y = 8
  g.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -2
  rightBackPaw.y = 18
  g.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-1.2, 0, 2.4, 16, 1)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 2
  leftFrontLeg.y = 8
  g.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 2
  leftFrontPaw.y = 18
  g.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-1.2, 0, 2.4, 16, 1)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 9
  rightFrontLeg.y = 8
  g.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 9
  rightFrontPaw.y = 18
  g.addChild(rightFrontPaw)

  buildPartsMap(g, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return g
}

// ── Crocodile ───────────────────────────────────────────────────────────────

function createCrocodile(): Container {
  const c = new Container()
  const BASE = 0x4A7C59
  const DARK = 0x2F5233
  const EYE = 0xffffff

  // Thick tapering tail behind body
  const tail = new Graphics()
  tail.moveTo(-22, -4)
  tail.lineTo(-36, -2)
  tail.lineTo(-36, 4)
  tail.lineTo(-22, 4)
  tail.closePath()
  tail.fill({ color: DARK })
  c.addChild(tail)

  // Long low horizontal body
  const body = new Graphics()
  body.roundRect(-22, -6, 44, 14, 7)
  body.fill({ color: BASE })
  c.addChild(body)

  // Spikes along the back
  const spikes = new Graphics()
  for (const sx of [-12, -4, 4, 12]) {
    spikes.moveTo(sx, -6)
    spikes.lineTo(sx + 2, -11)
    spikes.lineTo(sx + 4, -6)
  }
  spikes.closePath()
  spikes.fill({ color: DARK })
  c.addChild(spikes)

  // Head — elongated snout positioned at the front of the body
  const head = new Graphics()
  head.roundRect(6, -7, 20, 14, 5)
  head.fill({ color: BASE })
  // Pointed snout tip
  head.moveTo(26, -3)
  head.lineTo(32, 0)
  head.lineTo(26, 3)
  head.closePath()
  head.fill({ color: BASE })

  // Teeth (small white triangles inside snout)
  const teeth = new Graphics()
  for (const tx of [14, 18, 22]) {
    teeth.moveTo(tx, 5)
    teeth.lineTo(tx + 1.5, 8)
    teeth.lineTo(tx + 3, 5)
  }
  teeth.closePath()
  teeth.fill({ color: 0xFFFFF0 })
  head.addChild(teeth)

  // Eye bumps on top of snout
  const leftEar = new Graphics()
  leftEar.circle(10, -10, 2.5)
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(16, -10, 2.5)
  rightEar.fill({ color: DARK })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(10, -10, 1.5)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(16, -10, 1.5)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.x = 4
  head.y = -2
  c.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(c as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Short legs splayed sideways
  const legColor = DARK

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1.5, 0, 3, 5, 1.5)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -16
  leftBackLeg.y = 4
  c.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -16
  leftBackPaw.y = 8
  c.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1.5, 0, 3, 5, 1.5)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -8
  rightBackLeg.y = 4
  c.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -8
  rightBackPaw.y = 8
  c.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-1.5, 0, 3, 5, 1.5)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 8
  leftFrontLeg.y = 4
  c.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 8
  leftFrontPaw.y = 8
  c.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-1.5, 0, 3, 5, 1.5)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 16
  rightFrontLeg.y = 4
  c.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 16
  rightFrontPaw.y = 8
  c.addChild(rightFrontPaw)

  buildPartsMap(c, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return c
}

// ── Wolf ────────────────────────────────────────────────────────────────────

function createWolf(): Container {
  const w = new Container()
  const BASE = 0x8B9DAE
  const DARK = 0x5D6D7E
  const EYE = 0xffffff

  // Bushy tail pointing up/back
  const tail = new Graphics()
  tail.moveTo(-10, -4)
  tail.lineTo(-22, -18)
  tail.lineTo(-16, -22)
  tail.lineTo(-8, -14)
  tail.lineTo(-6, -6)
  tail.closePath()
  tail.fill({ color: DARK })
  w.addChild(tail)

  // Sleek elongated body
  const body = new Graphics()
  body.roundRect(-15, -8, 30, 20, 10)
  body.fill({ color: BASE })
  w.addChild(body)

  // Triangular head
  const head = new Graphics()
  head.moveTo(0, -10)
  head.lineTo(-10, 7)
  head.lineTo(10, 7)
  head.closePath()
  head.fill({ color: BASE })

  // Tall pointy ears
  const leftEar = new Graphics()
  leftEar.moveTo(-6, -8)
  leftEar.lineTo(-10, -24)
  leftEar.lineTo(-2, -8)
  leftEar.closePath()
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.moveTo(2, -8)
  rightEar.lineTo(10, -24)
  rightEar.lineTo(6, -8)
  rightEar.closePath()
  rightEar.fill({ color: DARK })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-4, -1, 2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(4, -1, 2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  w.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(w as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Medium legs
  const legColor = DARK

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -11
  leftBackLeg.y = 8
  w.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-3, 0, 6, 4, 2)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -11
  leftBackPaw.y = 16
  w.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -4
  rightBackLeg.y = 8
  w.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-3, 0, 6, 4, 2)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -4
  rightBackPaw.y = 16
  w.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 4
  leftFrontLeg.y = 8
  w.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-3, 0, 6, 4, 2)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 4
  leftFrontPaw.y = 16
  w.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 11
  rightFrontLeg.y = 8
  w.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-3, 0, 6, 4, 2)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 11
  rightFrontPaw.y = 16
  w.addChild(rightFrontPaw)

  buildPartsMap(w, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return w
}

// ── Flamingo ───────────────────────────────────────────────────────────────

function createFlamingo(): Container {
  const f = new Container()
  const BASE = 0xFF8FA3
  const DARK = 0xE06B85
  const BEAK = 0xFFB6C1
  const EYE = 0xffffff

  // Small tail fan
  const tail = new Graphics()
  tail.moveTo(-6, -4)
  tail.lineTo(-12, -10)
  tail.lineTo(-8, -12)
  tail.lineTo(-4, -6)
  tail.closePath()
  tail.fill({ color: DARK })
  f.addChild(tail)

  // Very narrow tall body
  const body = new Graphics()
  body.roundRect(-7, -18, 14, 36, 7)
  body.fill({ color: BASE })
  f.addChild(body)

  // Wings (mapped to front legs) — curved feather shapes on the sides
  const leftFrontLeg = new Graphics()
  leftFrontLeg.moveTo(0, 0)
  leftFrontLeg.bezierCurveTo(-10, -6, -10, 10, 0, 6)
  leftFrontLeg.closePath()
  leftFrontLeg.fill({ color: DARK })
  leftFrontLeg.x = -9
  leftFrontLeg.y = 2
  f.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.moveTo(0, 0)
  leftFrontPaw.bezierCurveTo(-8, -4, -8, 8, 0, 4)
  leftFrontPaw.closePath()
  leftFrontPaw.fill({ color: BEAK })
  leftFrontPaw.x = -9
  leftFrontPaw.y = 6
  f.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.moveTo(0, 0)
  rightFrontLeg.bezierCurveTo(10, -6, 10, 10, 0, 6)
  rightFrontLeg.closePath()
  rightFrontLeg.fill({ color: DARK })
  rightFrontLeg.x = 9
  rightFrontLeg.y = 2
  f.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.moveTo(0, 0)
  rightFrontPaw.bezierCurveTo(8, -4, 8, 8, 0, 4)
  rightFrontPaw.closePath()
  rightFrontPaw.fill({ color: BEAK })
  rightFrontPaw.x = 9
  rightFrontPaw.y = 6
  f.addChild(rightFrontPaw)

  // Head with long built-in S-curve neck
  const head = new Graphics()
  // Neck — long thin S-curve approximation (two segments)
  head.roundRect(-2, -10, 4, 18, 2)
  head.fill({ color: BASE })
  head.roundRect(-3, -18, 6, 12, 2)
  head.fill({ color: BASE })
  // Head circle
  head.circle(0, -24, 6)
  head.fill({ color: BASE })

  // Beak — bent shape as child of head
  const beak = new Graphics()
  beak.moveTo(3, -24)
  beak.lineTo(10, -22)
  beak.lineTo(9, -18)
  beak.lineTo(4, -20)
  beak.closePath()
  beak.fill({ color: BEAK })
  head.addChild(beak)

  // Tiny eye stubs
  const leftEar = new Graphics()
  leftEar.circle(-3, -30, 1.2)
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(3, -30, 1.2)
  rightEar.fill({ color: DARK })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-2, -25, 1.5)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(2, -25, 1.5)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  f.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(f as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Two very long thin stilt legs (back legs)
  const legColor = DARK

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1, 0, 2, 22, 1)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -4
  leftBackLeg.y = 10
  f.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-2.5, 0, 5, 2.5, 1)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -4
  leftBackPaw.y = 20
  f.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1, 0, 2, 22, 1)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = 4
  rightBackLeg.y = 10
  f.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-2.5, 0, 5, 2.5, 1)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = 4
  rightBackPaw.y = 20
  f.addChild(rightBackPaw)

  buildPartsMap(f, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return f
}

export function getPoseTargets(pose: Pose): PoseTargets {
  switch (pose) {
    case 'idle':
      return {
        bodyY: 0,
        bodyScaleY: 1,
        headY: 0,
        tailRotation: 0,
        leftFrontPawY: 0,
        rightFrontPawY: 0,
        leftBackPawY: 0,
        rightBackPawY: 0,
        leftFrontPawRotation: 0,
        rightFrontPawRotation: 0,
      }
    case 'left-paw-up':
      return {
        bodyY: -4,
        bodyScaleY: 1.05,
        headY: -3,
        tailRotation: -0.4,
        leftFrontPawY: -18,
        rightFrontPawY: 0,
        leftBackPawY: 0,
        rightBackPawY: 0,
        leftFrontPawRotation: -0.5,
        rightFrontPawRotation: 0,
      }
    case 'right-paw-up':
      return {
        bodyY: -4,
        bodyScaleY: 1.05,
        headY: -3,
        tailRotation: 0.4,
        leftFrontPawY: 0,
        rightFrontPawY: -18,
        leftBackPawY: 0,
        rightBackPawY: 0,
        leftFrontPawRotation: 0,
        rightFrontPawRotation: -0.5,
      }
    case 'both-paws-up':
      return {
        bodyY: -8,
        bodyScaleY: 1.08,
        headY: -5,
        tailRotation: 0,
        leftFrontPawY: -18,
        rightFrontPawY: -18,
        leftBackPawY: -4,
        rightBackPawY: -4,
        leftFrontPawRotation: -0.5,
        rightFrontPawRotation: -0.5,
      }
    case 'crouch':
      return {
        bodyY: 8,
        bodyScaleY: 0.88,
        headY: 4,
        tailRotation: 0.5,
        leftFrontPawY: 4,
        rightFrontPawY: 4,
        leftBackPawY: 4,
        rightBackPawY: 4,
        leftFrontPawRotation: 0,
        rightFrontPawRotation: 0,
      }
    case 'jump':
      return {
        bodyY: -20,
        bodyScaleY: 1.1,
        headY: -8,
        tailRotation: -0.8,
        leftFrontPawY: -8,
        rightFrontPawY: -8,
        leftBackPawY: -14,
        rightBackPawY: -14,
        leftFrontPawRotation: 0.4,
        rightFrontPawRotation: 0.4,
      }
    case 'lean-left':
      return {
        bodyY: 0,
        bodyScaleY: 1,
        headY: 0,
        tailRotation: -0.3,
        leftFrontPawY: -6,
        rightFrontPawY: 2,
        leftBackPawY: -2,
        rightBackPawY: 4,
        leftFrontPawRotation: -0.3,
        rightFrontPawRotation: 0,
      }
    case 'lean-right':
      return {
        bodyY: 0,
        bodyScaleY: 1,
        headY: 0,
        tailRotation: 0.3,
        leftFrontPawY: 2,
        rightFrontPawY: -6,
        leftBackPawY: 4,
        rightBackPawY: -2,
        leftFrontPawRotation: 0,
        rightFrontPawRotation: -0.3,
      }
    default:
      return getPoseTargets('idle')
  }
}

function applyPoseTargets(parts: CatGraphics, targets: PoseTargets): void {
  const r = parts.rest

  // Body moves first; everything else follows relative to body
  parts.body.y = r.bodyY + targets.bodyY
  parts.body.scale.y = targets.bodyScaleY
  parts.head.y = r.headY + targets.bodyY + targets.headY
  parts.tail.rotation = targets.tailRotation

  // Paws move with body offset + their own offset
  parts.leftFrontPaw.y = r.leftFrontPawY + targets.bodyY + targets.leftFrontPawY
  parts.rightFrontPaw.y = r.rightFrontPawY + targets.bodyY + targets.rightFrontPawY
  parts.leftBackPaw.y = r.leftBackPawY + targets.bodyY + targets.leftBackPawY
  parts.rightBackPaw.y = r.rightBackPawY + targets.bodyY + targets.rightBackPawY
  parts.leftFrontPaw.rotation = targets.leftFrontPawRotation
  parts.rightFrontPaw.rotation = targets.rightFrontPawRotation

  // Legs shadow the same delta as paws so they stay visually attached
  parts.leftFrontLeg.y = r.leftFrontLegY + targets.bodyY + targets.leftFrontPawY
  parts.rightFrontLeg.y = r.rightFrontLegY + targets.bodyY + targets.rightFrontPawY
  parts.leftBackLeg.y = r.leftBackLegY + targets.bodyY + targets.leftBackPawY
  parts.rightBackLeg.y = r.rightBackLegY + targets.bodyY + targets.rightBackPawY
}

// ── Pose update ─────────────────────────────────────────────────────────────

export function updateCatPose(cat: Container, pose: Pose, _instant: boolean = false): void {
  const parts = catPartsMap.get(cat)
  if (!parts) return
  const targets = getPoseTargets(pose)
  applyPoseTargets(parts, targets)
}

// ── Parts accessor ────────────────────────────────────────────────────────

export function getCatParts(cat: Container): CatGraphics | undefined {
  return catPartsMap.get(cat)
}

// ── Layout helper ─────────────────────────────────────────────────────────

export function layoutCats(cats: Container[], stageWidth: number, stageHeight: number): void {
  const lineY = stageHeight * 0.65
  const NATIVE_WIDTH = 44
  const scale = Math.max(2.2, (stageWidth * 0.12) / NATIVE_WIDTH)
  const catWidth = NATIVE_WIDTH * scale

  // Player (index 0) is always centered; backup dancers alternate left/right.
  const gap = catWidth + 20
  const cx = stageWidth / 2
  const count = cats.length

  for (let i = 0; i < count; i++) {
    const cat = cats[i]
    cat.scale.set(scale)
    if (i === 0) {
      cat.x = cx
    } else if (i % 2 === 1) {
      cat.x = cx - gap * ((i + 1) / 2)
    } else {
      cat.x = cx + gap * (i / 2)
    }
    cat.y = lineY
  }
}
