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

// ── Cat (player) ───────────────────────────────────────────────────────────

// ── Cat (player) ───────────────────────────────────────────────────────────

function createCat(tint?: number): Container {
  const cat = new Container()
  const BASE = tint != null ? tint : 0x1a1a1a
  const EYE = 0xffffff

  // Jagged segmented tail
  const tail = new Graphics()
  tail.moveTo(-8, -2)
  tail.lineTo(-12, -8)
  tail.lineTo(-18, -10)
  tail.lineTo(-22, -6)
  tail.lineTo(-20, 0)
  tail.lineTo(-14, 4)
  tail.lineTo(-8, 2)
  tail.closePath()
  tail.fill({ color: BASE })
  cat.addChild(tail)

  // Body — jagged plump polygon
  const body = new Graphics()
  body.moveTo(-13, -8)
  body.lineTo(-8, -12)
  body.lineTo(-2, -13)
  body.lineTo(5, -12)
  body.lineTo(11, -9)
  body.lineTo(14, -4)
  body.lineTo(15, 2)
  body.lineTo(14, 8)
  body.lineTo(11, 12)
  body.lineTo(6, 14)
  body.lineTo(0, 14)
  body.lineTo(-6, 13)
  body.lineTo(-11, 10)
  body.lineTo(-14, 5)
  body.lineTo(-15, -1)
  body.closePath()
  body.fill({ color: BASE })
  cat.addChild(body)

  // Head — jagged round shape
  const head = new Graphics()
  head.moveTo(-9, -6)
  head.lineTo(-5, -10)
  head.lineTo(0, -11)
  head.lineTo(5, -10)
  head.lineTo(9, -6)
  head.lineTo(10, -1)
  head.lineTo(9, 4)
  head.lineTo(6, 8)
  head.lineTo(0, 9)
  head.lineTo(-6, 8)
  head.lineTo(-9, 4)
  head.lineTo(-10, -1)
  head.closePath()
  head.fill({ color: BASE })

  // Ears
  const leftEar = new Graphics()
  leftEar.moveTo(-7, -8)
  leftEar.lineTo(-11, -20)
  leftEar.lineTo(-3, -8)
  leftEar.closePath()
  leftEar.fill({ color: BASE })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.moveTo(3, -8)
  rightEar.lineTo(11, -20)
  rightEar.lineTo(7, -8)
  rightEar.closePath()
  rightEar.fill({ color: BASE })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-4, -2, 2.5)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(4, -2, 2.5)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -12
  cat.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(cat as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  function makeLeg(x: number, isFront: boolean): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    if (isFront) {
      leg.roundRect(-2.5, -4, 5, 16, 2.5)
    } else {
      leg.roundRect(-2.5, -2, 5, 14, 2.5)
    }
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = 4
    cat.addChild(leg)

    const paw = new Graphics()
    paw.roundRect(-3, 0, 6, 4, 2)
    paw.fill({ color: BASE })
    paw.x = x
    paw.y = isFront ? 16 : 15
    cat.addChild(paw)

    return { leg, paw }
  }

  const lb = makeLeg(-9, false)
  const rb = makeLeg(-3, false)
  const lf = makeLeg(3, true)
  const rf = makeLeg(9, true)

  buildPartsMap(cat, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg: lf.leg, rightFrontLeg: rf.leg,
    leftBackLeg: lb.leg, rightBackLeg: rb.leg,
    leftFrontPaw: lf.paw, rightFrontPaw: rf.paw,
    leftBackPaw: lb.paw, rightBackPaw: rb.paw,
  })
  return cat
}

// ── Giraffe ─────────────────────────────────────────────────────────────────

function createGiraffe(): Container {
  const g = new Container()
  const BASE = 0xD4A35A
  const HOOF = 0x3D2B1F
  const EYE = 0xffffff

  // Thin tail with tuft
  const tail = new Graphics()
  tail.moveTo(-8, -2)
  tail.lineTo(-16, -8)
  tail.lineTo(-18, -12)
  tail.lineTo(-14, -10)
  tail.lineTo(-8, -4)
  tail.closePath()
  tail.fill({ color: BASE })
  g.addChild(tail)

  // Body — tall rectangle with slight jagged edges
  const body = new Graphics()
  body.moveTo(-10, -14)
  body.lineTo(-6, -17)
  body.lineTo(0, -18)
  body.lineTo(6, -17)
  body.lineTo(10, -14)
  body.lineTo(11, -8)
  body.lineTo(12, 0)
  body.lineTo(11, 8)
  body.lineTo(10, 15)
  body.lineTo(6, 17)
  body.lineTo(0, 18)
  body.lineTo(-6, 17)
  body.lineTo(-10, 15)
  body.lineTo(-11, 8)
  body.lineTo(-12, 0)
  body.lineTo(-11, -8)
  body.closePath()
  body.fill({ color: BASE })
  g.addChild(body)

  // Neck — thin tall rectangle
  const neck = new Graphics()
  neck.roundRect(-2, -16, 4, 32, 2)
  neck.fill({ color: BASE })
  g.addChild(neck)

  // Head — small jagged circle on top of neck
  const head = new Graphics()
  head.moveTo(-7, -24)
  head.lineTo(-4, -28)
  head.lineTo(0, -29)
  head.lineTo(4, -28)
  head.lineTo(7, -24)
  head.lineTo(8, -20)
  head.lineTo(7, -16)
  head.lineTo(4, -13)
  head.lineTo(0, -12)
  head.lineTo(-4, -13)
  head.lineTo(-7, -16)
  head.lineTo(-8, -20)
  head.closePath()
  head.fill({ color: BASE })

  // Ossicones
  const leftEar = new Graphics()
  leftEar.roundRect(-4, -30, 2.5, 5, 1)
  leftEar.fill({ color: 0x8B5E2E })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.roundRect(1.5, -30, 2.5, 5, 1)
  rightEar.fill({ color: 0x8B5E2E })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-3.5, -23, 2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(3.5, -23, 2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  g.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(g as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  function makeLeg(x: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    leg.roundRect(-1.2, -2, 2.4, 20, 1)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = 6
    g.addChild(leg)

    const paw = new Graphics()
    paw.roundRect(-2, 0, 4, 3, 1)
    paw.fill({ color: HOOF })
    paw.x = x
    paw.y = 22
    g.addChild(paw)

    return { leg, paw }
  }

  const lb = makeLeg(-8)
  const rb = makeLeg(-2.5)
  const lf = makeLeg(2.5)
  const rf = makeLeg(8)

  buildPartsMap(g, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg: lf.leg, rightFrontLeg: rf.leg,
    leftBackLeg: lb.leg, rightBackLeg: rb.leg,
    leftFrontPaw: lf.paw, rightFrontPaw: rf.paw,
    leftBackPaw: lb.paw, rightBackPaw: rb.paw,
  })
  return g
}

// ── Crocodile ───────────────────────────────────────────────────────────────

function createCrocodile(): Container {
  const c = new Container()
  const BASE = 0x3D6B4A
  const EYE = 0xffffff

  // Tapering tail
  const tail = new Graphics()
  tail.moveTo(-22, -4)
  tail.lineTo(-34, -2)
  tail.lineTo(-36, 2)
  tail.lineTo(-34, 4)
  tail.lineTo(-22, 4)
  tail.closePath()
  tail.fill({ color: BASE })
  c.addChild(tail)

  // Long low body with scaly top ridge
  const body = new Graphics()
  body.moveTo(-22, -6)
  body.lineTo(-16, -9)
  body.lineTo(-10, -7)
  body.lineTo(-4, -9)
  body.lineTo(2, -7)
  body.lineTo(8, -9)
  body.lineTo(14, -7)
  body.lineTo(20, -6)
  body.lineTo(22, -2)
  body.lineTo(22, 4)
  body.lineTo(18, 7)
  body.lineTo(12, 8)
  body.lineTo(6, 7)
  body.lineTo(0, 8)
  body.lineTo(-6, 7)
  body.lineTo(-12, 8)
  body.lineTo(-18, 7)
  body.lineTo(-22, 4)
  body.closePath()
  body.fill({ color: BASE })
  c.addChild(body)

  // Head — elongated snout
  const head = new Graphics()
  head.moveTo(6, -7)
  head.lineTo(12, -8)
  head.lineTo(20, -6)
  head.lineTo(28, -3)
  head.lineTo(32, 0)
  head.lineTo(28, 3)
  head.lineTo(20, 5)
  head.lineTo(12, 6)
  head.lineTo(6, 5)
  head.closePath()
  head.fill({ color: BASE })

  // Eye bumps
  const leftEar = new Graphics()
  leftEar.circle(10, -10, 2.5)
  leftEar.fill({ color: 0x2A4D35 })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(16, -10, 2.5)
  rightEar.fill({ color: 0x2A4D35 })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(10, -10, 1.5)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(16, -10, 1.5)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.x = 2
  head.y = -1
  c.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(c as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  function makeLeg(x: number, yOff: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    leg.roundRect(-2, -2, 4, 8, 2)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = yOff
    c.addChild(leg)

    const paw = new Graphics()
    paw.roundRect(-3, 0, 6, 3, 1.5)
    paw.fill({ color: BASE })
    paw.x = x
    paw.y = yOff + 5
    c.addChild(paw)

    return { leg, paw }
  }

  const lb = makeLeg(-16, 4)
  const rb = makeLeg(-8, 4)
  const lf = makeLeg(7, 4)
  const rf = makeLeg(16, 4)

  buildPartsMap(c, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg: lf.leg, rightFrontLeg: rf.leg,
    leftBackLeg: lb.leg, rightBackLeg: rb.leg,
    leftFrontPaw: lf.paw, rightFrontPaw: rf.paw,
    leftBackPaw: lb.paw, rightBackPaw: rb.paw,
  })
  return c
}

// ── Wolf ────────────────────────────────────────────────────────────────────

function createWolf(): Container {
  const w = new Container()
  const BASE = 0x778899
  const EYE = 0xffffff

  // Bushy tail with jagged edges
  const tail = new Graphics()
  tail.moveTo(-10, -2)
  tail.lineTo(-16, -10)
  tail.lineTo(-22, -16)
  tail.lineTo(-18, -20)
  tail.lineTo(-12, -18)
  tail.lineTo(-8, -12)
  tail.lineTo(-6, -6)
  tail.lineTo(-8, -2)
  tail.closePath()
  tail.fill({ color: BASE })
  w.addChild(tail)

  // Sleek body with jagged fur edges
  const body = new Graphics()
  body.moveTo(-14, -7)
  body.lineTo(-10, -10)
  body.lineTo(-4, -11)
  body.lineTo(2, -11)
  body.lineTo(8, -10)
  body.lineTo(14, -7)
  body.lineTo(16, -2)
  body.lineTo(16, 4)
  body.lineTo(14, 9)
  body.lineTo(10, 11)
  body.lineTo(4, 11)
  body.lineTo(-2, 11)
  body.lineTo(-8, 10)
  body.lineTo(-13, 8)
  body.lineTo(-15, 4)
  body.lineTo(-15, -2)
  body.closePath()
  body.fill({ color: BASE })
  w.addChild(body)

  // Triangular head with jagged edges
  const head = new Graphics()
  head.moveTo(0, -10)
  head.lineTo(-4, -14)
  head.lineTo(-8, -8)
  head.lineTo(-11, 0)
  head.lineTo(-10, 6)
  head.lineTo(-6, 8)
  head.lineTo(0, 9)
  head.lineTo(6, 8)
  head.lineTo(10, 6)
  head.lineTo(11, 0)
  head.lineTo(8, -8)
  head.lineTo(4, -14)
  head.closePath()
  head.fill({ color: BASE })

  // Tall pointy ears
  const leftEar = new Graphics()
  leftEar.moveTo(-6, -8)
  leftEar.lineTo(-10, -24)
  leftEar.lineTo(-2, -8)
  leftEar.closePath()
  leftEar.fill({ color: BASE })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.moveTo(2, -8)
  rightEar.lineTo(10, -24)
  rightEar.lineTo(6, -8)
  rightEar.closePath()
  rightEar.fill({ color: BASE })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-4.5, -2, 2.2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(4.5, -2, 2.2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  w.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(w as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  function makeLeg(x: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    leg.roundRect(-2, -3, 4, 13, 2)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = 4
    w.addChild(leg)

    const paw = new Graphics()
    paw.roundRect(-3, 0, 6, 4, 2)
    paw.fill({ color: BASE })
    paw.x = x
    paw.y = 15
    w.addChild(paw)

    return { leg, paw }
  }

  const lb = makeLeg(-10)
  const rb = makeLeg(-3.5)
  const lf = makeLeg(3.5)
  const rf = makeLeg(10)

  buildPartsMap(w, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg: lf.leg, rightFrontLeg: rf.leg,
    leftBackLeg: lb.leg, rightBackLeg: rb.leg,
    leftFrontPaw: lf.paw, rightFrontPaw: rf.paw,
    leftBackPaw: lb.paw, rightBackPaw: rb.paw,
  })
  return w
}

// ── Flamingo ───────────────────────────────────────────────────────────────

function createFlamingo(): Container {
  const f = new Container()
  const BASE = 0xFF9EB5
  const EYE = 0xffffff

  // Small tail fan
  const tail = new Graphics()
  tail.moveTo(-5, -4)
  tail.lineTo(-10, -10)
  tail.lineTo(-6, -12)
  tail.lineTo(-3, -6)
  tail.closePath()
  tail.fill({ color: BASE })
  f.addChild(tail)

  // Very narrow tall body
  const body = new Graphics()
  body.moveTo(-6, -16)
  body.lineTo(-3, -18)
  body.lineTo(0, -18)
  body.lineTo(3, -18)
  body.lineTo(6, -16)
  body.lineTo(7, -10)
  body.lineTo(7, 0)
  body.lineTo(7, 10)
  body.lineTo(6, 16)
  body.lineTo(3, 18)
  body.lineTo(0, 18)
  body.lineTo(-3, 18)
  body.lineTo(-6, 16)
  body.lineTo(-7, 10)
  body.lineTo(-7, 0)
  body.lineTo(-7, -10)
  body.closePath()
  body.fill({ color: BASE })
  f.addChild(body)

  // Neck — long thin S-curve
  const neck = new Graphics()
  neck.roundRect(-1.5, -18, 3, 34, 1.5)
  neck.fill({ color: BASE })
  neck.x = 0
  neck.y = -6
  f.addChild(neck)

  // Head — small jagged circle
  const head = new Graphics()
  head.moveTo(-5, -28)
  head.lineTo(-2, -31)
  head.lineTo(2, -31)
  head.lineTo(5, -28)
  head.lineTo(6, -24)
  head.lineTo(5, -21)
  head.lineTo(2, -19)
  head.lineTo(-2, -19)
  head.lineTo(-5, -21)
  head.lineTo(-6, -24)
  head.closePath()
  head.fill({ color: BASE })

  // Bent beak
  const beak = new Graphics()
  beak.moveTo(3, -25)
  beak.lineTo(10, -23)
  beak.lineTo(9, -20)
  beak.lineTo(4, -22)
  beak.closePath()
  beak.fill({ color: 0xFFB6C1 })
  head.addChild(beak)

  // Tiny ear nubs
  const leftEar = new Graphics()
  leftEar.circle(-3, -32, 1.2)
  leftEar.fill({ color: 0xE88DA0 })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(3, -32, 1.2)
  rightEar.fill({ color: 0xE88DA0 })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-2, -27, 1.8)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(2, -27, 1.8)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  f.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(f as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  function makeLeg(x: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    leg.roundRect(-1, -2, 2, 24, 1)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = 6
    f.addChild(leg)

    const paw = new Graphics()
    paw.roundRect(-2.5, 0, 5, 2.5, 1)
    paw.fill({ color: BASE })
    paw.x = x
    paw.y = 30
    f.addChild(paw)

    return { leg, paw }
  }

  const lb = makeLeg(-4)
  const rb = makeLeg(4)

  buildPartsMap(f, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg: lb.leg, rightFrontLeg: rb.leg,
    leftBackLeg: lb.leg, rightBackLeg: rb.leg,
    leftFrontPaw: lb.paw, rightFrontPaw: rb.paw,
    leftBackPaw: lb.paw, rightBackPaw: rb.paw,
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
