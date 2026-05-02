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

function createCat(tint?: number): Container {
  const cat = new Container()
  const BASE = tint != null ? tint : 0x1a1a1a
  const BELLY = 0x2d2d2d
  const PAD = 0xff9999
  const EYE = 0xffffff

  // Fluffy segmented tail behind body
  const tail = new Graphics()
  tail.circle(-28, -14, 4)
  tail.circle(-22, -8, 5)
  tail.circle(-16, -2, 5.5)
  tail.circle(-10, 2, 5)
  tail.fill({ color: BASE })
  cat.addChild(tail)

  // Main body — plump oval with lighter belly patch
  const body = new Graphics()
  body.ellipse(0, 0, 15, 13)
  body.fill({ color: BASE })
  // Belly patch — lighter oval on lower half
  body.ellipse(0, 5, 10, 7)
  body.fill({ color: BELLY })
  cat.addChild(body)

  // Head group
  const head = new Graphics()
  head.circle(0, 0, 10.5)
  head.fill({ color: BASE })
  // Muzzle — lighter patch on lower face
  head.ellipse(0, 4, 7, 5)
  head.fill({ color: BELLY })
  // Nose — tiny pink triangle
  head.moveTo(-2, 2)
  head.lineTo(2, 2)
  head.lineTo(0, 5)
  head.closePath()
  head.fill({ color: PAD })
  // Whisker dots
  head.circle(-4, 3, 0.8)
  head.circle(4, 3, 0.8)
  head.fill({ color: 0x444444 })

  // Ears — pointy triangles
  const leftEar = new Graphics()
  leftEar.moveTo(-7, -8)
  leftEar.lineTo(-11, -20)
  leftEar.lineTo(-3, -8)
  leftEar.closePath()
  leftEar.fill({ color: BASE })
  // Pink inner ear
  leftEar.moveTo(-7, -9)
  leftEar.lineTo(-9, -16)
  leftEar.lineTo(-5, -9)
  leftEar.closePath()
  leftEar.fill({ color: PAD })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.moveTo(3, -8)
  rightEar.lineTo(11, -20)
  rightEar.lineTo(7, -8)
  rightEar.closePath()
  rightEar.fill({ color: BASE })
  rightEar.moveTo(5, -9)
  rightEar.lineTo(9, -16)
  rightEar.lineTo(7, -9)
  rightEar.closePath()
  rightEar.fill({ color: PAD })
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

  // Legs extend from inside body down — each has a thigh + paw structure
  function makeLeg(x: number, isFront: boolean): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    // Thigh — extends up into body, wider at top
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
    // Rounded foot with visible pad
    paw.ellipse(0, 0, 4, 3)
    paw.fill({ color: BASE })
    paw.ellipse(0, 1, 2.5, 1.8)
    paw.fill({ color: PAD })
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
  const SPOT = 0x8B5E2E
  const BELLY = 0xE8C97A
  const HOOF = 0x3D2B1F
  const EYE = 0xffffff

  // Tail — thin with dark tuft at tip
  const tail = new Graphics()
  tail.moveTo(-10, -2)
  tail.lineTo(-22, -6)
  tail.lineTo(-24, -10)
  tail.lineTo(-20, -8)
  tail.lineTo(-10, -4)
  tail.closePath()
  tail.fill({ color: BASE })
  tail.circle(-25, -11, 3)
  tail.fill({ color: SPOT })
  g.addChild(tail)

  // Body — tall oval with lighter belly
  const body = new Graphics()
  body.ellipse(0, 0, 12, 18)
  body.fill({ color: BASE })
  body.ellipse(0, 8, 8, 9)
  body.fill({ color: BELLY })
  g.addChild(body)

  // Spots — irregular brown polygons
  const spots = new Graphics()
  spots.moveTo(-6, -4)
  spots.lineTo(-3, -9)
  spots.lineTo(0, -5)
  spots.lineTo(-2, -1)
  spots.closePath()
  spots.moveTo(3, 2)
  spots.lineTo(7, -2)
  spots.lineTo(9, 3)
  spots.lineTo(5, 5)
  spots.closePath()
  spots.moveTo(-5, 10)
  spots.lineTo(-2, 7)
  spots.lineTo(1, 11)
  spots.lineTo(-3, 13)
  spots.closePath()
  spots.fill({ color: SPOT })
  g.addChild(spots)

  // Neck — single thin tall rectangle, narrower than body
  const neck = new Graphics()
  neck.roundRect(-2, -16, 4, 32, 2)
  neck.fill({ color: BASE })
  neck.roundRect(-2, -16, 4, 32, 2)
  neck.fill({ color: BASE })
  g.addChild(neck)

  // Head — small circle at top of neck
  const head = new Graphics()
  head.circle(0, -22, 7.5)
  head.fill({ color: BASE })
  // Muzzle
  head.ellipse(0, -20, 4, 3)
  head.fill({ color: BELLY })

  // Ossicones
  const leftEar = new Graphics()
  leftEar.roundRect(-4, -29, 2.5, 5, 1)
  leftEar.fill({ color: SPOT })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.roundRect(1.5, -29, 2.5, 5, 1)
  rightEar.fill({ color: SPOT })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-3, -23, 2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(3, -23, 2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  g.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(g as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Extra-long thin legs with small dark hooves
  function makeLeg(x: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    leg.roundRect(-1.2, -2, 2.4, 20, 1)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = 6
    g.addChild(leg)

    const paw = new Graphics()
    // Small dark hoof block
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
  const BELLY = 0x7BA05B
  const SCALE = 0x2A4D35
  const TOOTH = 0xFFFFF0
  const EYE = 0xffffff

  // Thick tapering tail
  const tail = new Graphics()
  tail.moveTo(-28, -5)
  tail.lineTo(-42, -3)
  tail.lineTo(-42, 3)
  tail.lineTo(-28, 5)
  tail.closePath()
  tail.fill({ color: BASE })
  // Scale ridges on tail
  const tRidge = new Graphics()
  for (let i = 0; i < 3; i++) {
    tRidge.moveTo(-32 - i * 4, -5)
    tRidge.lineTo(-34 - i * 4, -8)
    tRidge.lineTo(-30 - i * 4, -5)
  }
  tRidge.closePath()
  tRidge.fill({ color: SCALE })
  c.addChild(tail)
  c.addChild(tRidge)

  // Long low body with lighter belly band
  const body = new Graphics()
  body.roundRect(-24, -7, 44, 16, 6)
  body.fill({ color: BASE })
  // Belly band
  body.roundRect(-22, 2, 40, 5, 2)
  body.fill({ color: BELLY })
  c.addChild(body)

  // Scales — rows of small bumps along the back
  const scales = new Graphics()
  for (let row = 0; row < 2; row++) {
    for (const sx of [-14, -6, 2, 10]) {
      scales.circle(sx + row * 3, -8 + row * 2.5, 1.8)
    }
  }
  scales.fill({ color: SCALE })
  c.addChild(scales)

  // Head — elongated snout extending forward from body
  const head = new Graphics()
  head.roundRect(6, -8, 22, 14, 5)
  head.fill({ color: BASE })
  // Pointed snout
  head.moveTo(28, -4)
  head.lineTo(36, 0)
  head.lineTo(28, 4)
  head.closePath()
  head.fill({ color: BASE })
  // Lower jaw — slightly lighter
  head.roundRect(8, 1, 20, 5, 2)
  head.fill({ color: BELLY })
  // Teeth
  const teeth = new Graphics()
  for (const tx of [14, 18, 22]) {
    teeth.moveTo(tx, -6)
    teeth.lineTo(tx + 1.5, -9)
    teeth.lineTo(tx + 3, -6)
  }
  teeth.closePath()
  teeth.fill({ color: TOOTH })
  head.addChild(teeth)
  // Nostrils
  head.circle(30, -3, 1)
  head.circle(32, -3, 1)
  head.fill({ color: SCALE })

  // Eye bumps on top of head
  const leftEar = new Graphics()
  leftEar.circle(10, -11, 3)
  leftEar.fill({ color: SCALE })
  head.addChild(leftEar)
  const rightEar = new Graphics()
  rightEar.circle(17, -11, 3)
  rightEar.fill({ color: SCALE })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(10, -11, 1.5)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)
  const rightEye = new Graphics()
  rightEye.circle(17, -11, 1.5)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.x = 2
  head.y = -1
  c.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(c as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Short stubby legs with webbed feet
  function makeLeg(x: number, yOff: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    leg.roundRect(-2, -2, 4, 8, 2)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = yOff
    c.addChild(leg)

    const paw = new Graphics()
    // Webbed foot — 3 small toes
    paw.ellipse(-2, 1, 5, 3)
    paw.fill({ color: BASE })
    paw.circle(-3, 2, 1.2)
    paw.circle(0, 2.5, 1.2)
    paw.circle(3, 2, 1.2)
    paw.fill({ color: SCALE })
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
  const DARK = 0x4A5568
  const BELLY = 0xA9B2C1
  const MUZZLE = 0xE8E8E8
  const PAD = 0x333333
  const EYE = 0xffffff

  // Bushy tail with lighter tip
  const tail = new Graphics()
  tail.moveTo(-14, -3)
  tail.lineTo(-26, -18)
  tail.lineTo(-20, -22)
  tail.lineTo(-10, -16)
  tail.lineTo(-7, -8)
  tail.lineTo(-10, -4)
  tail.closePath()
  tail.fill({ color: DARK })
  // Lighter tip
  tail.circle(-24, -19, 4)
  tail.fill({ color: BELLY })
  w.addChild(tail)

  // Sleek elongated body with lighter underbelly
  const body = new Graphics()
  body.ellipse(0, 0, 16, 11)
  body.fill({ color: BASE })
  body.ellipse(0, 5, 11, 6)
  body.fill({ color: BELLY })
  // Fur tufts along back
  const fur = new Graphics()
  for (const fx of [-10, -4, 2, 8]) {
    fur.moveTo(fx, -9)
    fur.lineTo(fx + 1.5, -12)
    fur.lineTo(fx + 3, -9)
  }
  fur.closePath()
  fur.fill({ color: DARK })
  w.addChild(body)
  w.addChild(fur)

  // Triangular head with white muzzle
  const head = new Graphics()
  head.moveTo(0, -11)
  head.lineTo(-11, 7)
  head.lineTo(11, 7)
  head.closePath()
  head.fill({ color: BASE })
  // White muzzle
  head.ellipse(0, 4, 7, 5)
  head.fill({ color: MUZZLE })
  // Black nose tip
  head.circle(0, 8, 2)
  head.fill({ color: PAD })

  // Tall pointy ears with dark inner
  const leftEar = new Graphics()
  leftEar.moveTo(-6, -9)
  leftEar.lineTo(-10, -26)
  leftEar.lineTo(-2, -9)
  leftEar.closePath()
  leftEar.fill({ color: DARK })
  leftEar.moveTo(-6, -10)
  leftEar.lineTo(-8, -21)
  leftEar.lineTo(-4, -10)
  leftEar.closePath()
  leftEar.fill({ color: BASE })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.moveTo(2, -9)
  rightEar.lineTo(10, -26)
  rightEar.lineTo(6, -9)
  rightEar.closePath()
  rightEar.fill({ color: DARK })
  rightEar.moveTo(4, -10)
  rightEar.lineTo(8, -21)
  rightEar.lineTo(6, -10)
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

  // Medium legs with visible toe pads
  function makeLeg(x: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    leg.roundRect(-2, -3, 4, 13, 2)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = 4
    w.addChild(leg)

    const paw = new Graphics()
    // Oval foot
    paw.ellipse(0, 0, 4.5, 3.5)
    paw.fill({ color: DARK })
    // Three toe pads
    paw.circle(-2.5, 1, 1)
    paw.circle(0, 1.5, 1)
    paw.circle(2.5, 1, 1)
    paw.fill({ color: PAD })
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
  const DARK = 0xE88DA0
  const BEAK = 0xFFB6C1
  const KNEE = 0xD46A7E
  const FEATHER = 0xFFE4EC
  const EYE = 0xffffff

  // Small tail fan
  const tail = new Graphics()
  tail.moveTo(-5, -4)
  tail.lineTo(-10, -10)
  tail.lineTo(-6, -12)
  tail.lineTo(-3, -6)
  tail.closePath()
  tail.fill({ color: DARK })
  f.addChild(tail)

  // Very narrow tall body
  const body = new Graphics()
  body.ellipse(0, 0, 7, 17)
  body.fill({ color: BASE })
  f.addChild(body)

  // Wings — large curved feather shapes on the sides (mapped as "front legs")
  function makeWing(side: number): { wing: Graphics; feather: Graphics } {
    const wing = new Graphics()
    // Large outer curved shape
    wing.moveTo(0, 0)
    wing.bezierCurveTo(side * 12, -10, side * 12, 14, 0, 8)
    wing.closePath()
    wing.fill({ color: DARK })
    wing.x = side * 7
    wing.y = 2
    f.addChild(wing)

    const feather = new Graphics()
    feather.moveTo(0, 0)
    feather.bezierCurveTo(side * 10, -8, side * 10, 12, 0, 6)
    feather.closePath()
    feather.fill({ color: FEATHER })
    feather.x = side * 9
    feather.y = 4
    f.addChild(feather)

    return { wing, feather }
  }

  const lw = makeWing(-1)
  const rw = makeWing(1)

  // Neck — long S-curve (thin)
  const neck = new Graphics()
  neck.roundRect(-1.5, -18, 3, 34, 1.5)
  neck.fill({ color: BASE })
  neck.x = 0
  neck.y = -6
  f.addChild(neck)

  // Head — small circle with bent beak
  const head = new Graphics()
  head.circle(0, -26, 6)
  head.fill({ color: BASE })

  // Bent beak
  const beak = new Graphics()
  beak.moveTo(3, -26)
  beak.lineTo(11, -24)
  beak.lineTo(10, -21)
  beak.lineTo(5, -23)
  beak.closePath()
  beak.fill({ color: BEAK })
  // Black tip
  beak.moveTo(9, -22)
  beak.lineTo(12, -21.5)
  beak.lineTo(11, -19)
  beak.lineTo(8, -20)
  beak.closePath()
  beak.fill({ color: 0x222222 })
  head.addChild(beak)

  // Tiny ear nubs
  const leftEar = new Graphics()
  leftEar.circle(-3, -32, 1.2)
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(3, -32, 1.2)
  rightEar.fill({ color: DARK })
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

  // Two very long thin stilt legs with knee joints
  function makeLeg(x: number): { leg: Graphics; paw: Graphics } {
    const leg = new Graphics()
    // Upper leg
    leg.roundRect(-1, -2, 2, 14, 1)
    leg.fill({ color: BASE })
    // Knee joint
    leg.circle(0, 12, 2)
    leg.fill({ color: KNEE })
    // Lower leg
    leg.roundRect(-0.8, 12, 1.6, 12, 0.8)
    leg.fill({ color: BASE })
    leg.x = x
    leg.y = 6
    f.addChild(leg)

    const paw = new Graphics()
    // Webbed foot — 3 small webbed toes
    paw.ellipse(0, 1, 4, 2.5)
    paw.fill({ color: BASE })
    paw.circle(-2.5, 2, 1)
    paw.circle(0, 2.5, 1)
    paw.circle(2.5, 2, 1)
    paw.fill({ color: DARK })
    paw.x = x
    paw.y = 24
    f.addChild(paw)

    return { leg, paw }
  }

  const lb = makeLeg(-4)
  const rb = makeLeg(4)

  buildPartsMap(f, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg: lw.wing, rightFrontLeg: rw.wing,
    leftBackLeg: lb.leg, rightBackLeg: rb.leg,
    leftFrontPaw: lw.feather, rightFrontPaw: rw.feather,
    leftBackPaw: lb.paw, rightBackPaw: rb.paw,
  })
  return f
}

// ── Pose targets ──────────────────────────────────────────────────────────

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
