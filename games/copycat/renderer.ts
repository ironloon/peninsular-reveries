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

export type AnimalKind = 'cat' | 'giraffe' | 'orangutan' | 'wolf' | 'flamingo'

const BACKUP_ANIMALS: AnimalKind[] = ['orangutan', 'wolf', 'giraffe', 'flamingo']

export function getAnimalKind(index: number): AnimalKind {
  if (index === 0) return 'cat'
  return BACKUP_ANIMALS[(index - 1) % BACKUP_ANIMALS.length]
}

export function createAnimal(kind: AnimalKind, tint?: number): Container {
  switch (kind) {
    case 'cat': return createCat(tint)
    case 'giraffe': return createGiraffe()
    case 'orangutan': return createOrangutan()
    case 'wolf': return createWolf()
    case 'flamingo': return createFlamingo()
  }
}

function buildPartsMap(container: Container, parts: CatGraphics): void {
  catPartsMap.set(container, parts)
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

function createGiraffe(): Container {
  const g = new Container()
  const BASE = 0xC9A96E
  const DARK = 0xA08555
  const EYE = 0xffffff

  // Broom tail with tuft
  const tail = new Graphics()
  tail.moveTo(-8, -2)
  tail.lineTo(-18, -14)
  tail.lineTo(-14, -16)
  tail.lineTo(-8, -6)
  tail.closePath()
  tail.fill({ color: DARK })
  g.addChild(tail)

  // Body — taller rectangle
  const body = new Graphics()
  body.roundRect(-12, -12, 24, 28, 8)
  body.fill({ color: BASE })
  g.addChild(body)

  // Spots on body
  const spots = new Graphics()
  spots.circle(-6, 2, 3)
  spots.circle(5, -4, 2.5)
  spots.circle(0, 8, 3)
  spots.fill({ color: DARK })
  g.addChild(spots)

  // Head with built-in long neck so it looks tall even at same anchor
  const head = new Graphics()
  head.circle(0, -18, 8)
  head.roundRect(-3, -10, 6, 16, 2) // neck bridge down to body
  head.fill({ color: BASE })

  // Ossicones (horn nubs)
  const leftEar = new Graphics()
  leftEar.circle(-4, -26, 2.5)
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(4, -26, 2.5)
  rightEar.fill({ color: DARK })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-3, -19, 2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(3, -19, 2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  g.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(g as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Long thin legs
  const legColor = BASE

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1.2, 0, 2.4, 14, 1)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -9
  leftBackLeg.y = 8
  g.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -9
  leftBackPaw.y = 16
  g.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1.2, 0, 2.4, 14, 1)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -2
  rightBackLeg.y = 8
  g.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -2
  rightBackPaw.y = 16
  g.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-1.2, 0, 2.4, 14, 1)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 2
  leftFrontLeg.y = 8
  g.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 2
  leftFrontPaw.y = 16
  g.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-1.2, 0, 2.4, 14, 1)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 9
  rightFrontLeg.y = 8
  g.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-2.5, 0, 5, 3, 1.5)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 9
  rightFrontPaw.y = 16
  g.addChild(rightFrontPaw)

  buildPartsMap(g, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return g
}

// ── Orangutan ───────────────────────────────────────────────────────────────

function createOrangutan(): Container {
  const o = new Container()
  const BASE = 0xD35400
  const DARK = 0xA04000
  const EYE = 0xffffff

  // Stub tail (orangutans barely have tails)
  const tail = new Graphics()
  tail.circle(-10, 2, 2)
  tail.fill({ color: DARK })
  o.addChild(tail)

  // Big round body
  const body = new Graphics()
  body.roundRect(-16, -12, 32, 28, 16)
  body.fill({ color: BASE })
  o.addChild(body)

  // Head — big, round, ape-like
  const head = new Graphics()
  head.roundRect(-12, -10, 24, 22, 12)
  head.fill({ color: BASE })

  // Tiny round ears
  const leftEar = new Graphics()
  leftEar.circle(-13, -2, 3)
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(13, -2, 3)
  rightEar.fill({ color: DARK })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-5, -2, 2.5)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(5, -2, 2.5)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  o.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(o as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Thick arms/legs
  const legColor = DARK

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-2.5, 0, 5, 10, 2.5)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -11
  leftBackLeg.y = 8
  o.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-4, 0, 8, 5, 2.5)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -11
  leftBackPaw.y = 16
  o.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-2.5, 0, 5, 10, 2.5)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -3
  rightBackLeg.y = 8
  o.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-4, 0, 8, 5, 2.5)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -3
  rightBackPaw.y = 16
  o.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-2.5, 0, 5, 10, 2.5)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 3
  leftFrontLeg.y = 8
  o.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-4, 0, 8, 5, 2.5)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 3
  leftFrontPaw.y = 16
  o.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-2.5, 0, 5, 10, 2.5)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 11
  rightFrontLeg.y = 8
  o.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-4, 0, 8, 5, 2.5)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 11
  rightFrontPaw.y = 16
  o.addChild(rightFrontPaw)

  buildPartsMap(o, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return o
}

// ── Wolf ────────────────────────────────────────────────────────────────────

function createWolf(): Container {
  const w = new Container()
  const BASE = 0x7F8C8D
  const DARK = 0x566363
  const EYE = 0xffffff

  // Bushy tail
  const tail = new Graphics()
  tail.moveTo(-10, 0)
  tail.lineTo(-24, -14)
  tail.lineTo(-20, -20)
  tail.lineTo(-14, -14)
  tail.lineTo(-10, -6)
  tail.closePath()
  tail.fill({ color: DARK })
  w.addChild(tail)

  // Lean body
  const body = new Graphics()
  body.roundRect(-14, -9, 28, 22, 10)
  body.fill({ color: BASE })
  w.addChild(body)

  // Head — narrower, triangular
  const head = new Graphics()
  head.moveTo(0, -10)
  head.lineTo(-9, 6)
  head.lineTo(9, 6)
  head.closePath()
  head.fill({ color: BASE })

  // Tall pointy ears
  const leftEar = new Graphics()
  leftEar.moveTo(-6, -8)
  leftEar.lineTo(-9, -22)
  leftEar.lineTo(-2, -8)
  leftEar.closePath()
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.moveTo(2, -8)
  rightEar.lineTo(9, -22)
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

  const legColor = DARK

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -10
  leftBackLeg.y = 8
  w.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-3, 0, 6, 4, 2)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -10
  leftBackPaw.y = 16
  w.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -3
  rightBackLeg.y = 8
  w.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-3, 0, 6, 4, 2)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -3
  rightBackPaw.y = 16
  w.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 3
  leftFrontLeg.y = 8
  w.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-3, 0, 6, 4, 2)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 3
  leftFrontPaw.y = 16
  w.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-1.5, 0, 3, 10, 1.5)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 10
  rightFrontLeg.y = 8
  w.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-3, 0, 6, 4, 2)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 10
  rightFrontPaw.y = 16
  w.addChild(rightFrontPaw)

  buildPartsMap(w, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
  })
  return w
}

// ── Flamingo ────────────────────────────────────────────────────────────────

function createFlamingo(): Container {
  const f = new Container()
  const BASE = 0xFF8FA3
  const DARK = 0xE06B85
  const EYE = 0xffffff

  // Small tail fan
  const tail = new Graphics()
  tail.moveTo(-6, -2)
  tail.lineTo(-12, -8)
  tail.lineTo(-8, -10)
  tail.lineTo(-4, -4)
  tail.closePath()
  tail.fill({ color: DARK })
  f.addChild(tail)

  // Compact oval body
  const body = new Graphics()
  body.roundRect(-10, -8, 20, 20, 10)
  body.fill({ color: BASE })
  f.addChild(body)

  // Head with long built-in neck
  const head = new Graphics()
  head.circle(0, -22, 6)
  // Long thin neck bridge
  head.roundRect(-2, -14, 4, 18, 2)
  head.fill({ color: BASE })

  // Tiny ear stubs
  const leftEar = new Graphics()
  leftEar.circle(-3, -28, 1.5)
  leftEar.fill({ color: DARK })
  head.addChild(leftEar)

  const rightEar = new Graphics()
  rightEar.circle(3, -28, 1.5)
  rightEar.fill({ color: DARK })
  head.addChild(rightEar)

  const leftEye = new Graphics()
  leftEye.circle(-2, -23, 1.8)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(2, -23, 1.8)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  head.y = -14
  f.addChild(head)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(f as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Very long thin legs
  const legColor = DARK

  const leftBackLeg = new Graphics()
  leftBackLeg.roundRect(-1, 0, 2, 18, 1)
  leftBackLeg.fill({ color: legColor })
  leftBackLeg.x = -7
  leftBackLeg.y = 8
  f.addChild(leftBackLeg)

  const leftBackPaw = new Graphics()
  leftBackPaw.roundRect(-2.5, 0, 5, 2.5, 1)
  leftBackPaw.fill({ color: legColor })
  leftBackPaw.x = -7
  leftBackPaw.y = 16
  f.addChild(leftBackPaw)

  const rightBackLeg = new Graphics()
  rightBackLeg.roundRect(-1, 0, 2, 18, 1)
  rightBackLeg.fill({ color: legColor })
  rightBackLeg.x = -2
  rightBackLeg.y = 8
  f.addChild(rightBackLeg)

  const rightBackPaw = new Graphics()
  rightBackPaw.roundRect(-2.5, 0, 5, 2.5, 1)
  rightBackPaw.fill({ color: legColor })
  rightBackPaw.x = -2
  rightBackPaw.y = 16
  f.addChild(rightBackPaw)

  const leftFrontLeg = new Graphics()
  leftFrontLeg.roundRect(-1, 0, 2, 18, 1)
  leftFrontLeg.fill({ color: legColor })
  leftFrontLeg.x = 2
  leftFrontLeg.y = 8
  f.addChild(leftFrontLeg)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.roundRect(-2.5, 0, 5, 2.5, 1)
  leftFrontPaw.fill({ color: legColor })
  leftFrontPaw.x = 2
  leftFrontPaw.y = 16
  f.addChild(leftFrontPaw)

  const rightFrontLeg = new Graphics()
  rightFrontLeg.roundRect(-1, 0, 2, 18, 1)
  rightFrontLeg.fill({ color: legColor })
  rightFrontLeg.x = 7
  rightFrontLeg.y = 8
  f.addChild(rightFrontLeg)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.roundRect(-2.5, 0, 5, 2.5, 1)
  rightFrontPaw.fill({ color: legColor })
  rightFrontPaw.x = 7
  rightFrontPaw.y = 16
  f.addChild(rightFrontPaw)

  buildPartsMap(f, {
    body, head, leftEar, rightEar, leftEye, rightEye, tail,
    leftFrontLeg, rightFrontLeg, leftBackLeg, rightBackLeg,
    leftFrontPaw, rightFrontPaw, leftBackPaw, rightBackPaw,
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
  parts.body.y = targets.bodyY
  parts.body.scale.y = targets.bodyScaleY
  parts.head.y = targets.headY
  parts.tail.rotation = targets.tailRotation
  parts.leftFrontPaw.y = targets.leftFrontPawY
  parts.rightFrontPaw.y = targets.rightFrontPawY
  parts.leftBackPaw.y = targets.leftBackPawY
  parts.rightBackPaw.y = targets.rightBackPawY
  parts.leftFrontPaw.rotation = targets.leftFrontPawRotation
  parts.rightFrontPaw.rotation = targets.rightFrontPawRotation

  parts.leftFrontLeg.y = 8 + targets.leftFrontPawY
  parts.rightFrontLeg.y = 8 + targets.rightFrontPawY
  parts.leftBackLeg.y = 8 + targets.leftBackPawY
  parts.rightBackLeg.y = 8 + targets.rightBackPawY
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
