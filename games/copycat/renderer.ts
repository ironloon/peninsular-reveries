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
      backgroundAlpha: 0.88,
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

// ── Cat creation ────────────────────────────────────────────────────────────

export function createCat(tint?: number): Container {
  const cat = new Container()
  const BASE = tint != null ? tint : 0x000000
  const EYE = 0xffffff

  // Tail (drawn behind body)
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

  // Body — rounded cat-like oval
  const body = new Graphics()
  body.roundRect(-14, -10, 28, 24, 12)
  body.fill({ color: BASE })
  cat.addChild(body)

  // Head group — head shape + ears + eyes as children so they move together
  const head = new Graphics()
  head.circle(0, 0, 10)
  head.fill({ color: BASE })

  // Left ear (relative to head center)
  const leftEar = new Graphics()
  leftEar.moveTo(-7, -8)
  leftEar.lineTo(-4, -18)
  leftEar.lineTo(-1, -8)
  leftEar.closePath()
  leftEar.fill({ color: BASE })
  head.addChild(leftEar)

  // Right ear
  const rightEar = new Graphics()
  rightEar.moveTo(1, -8)
  rightEar.lineTo(4, -18)
  rightEar.lineTo(7, -8)
  rightEar.closePath()
  rightEar.fill({ color: BASE })
  head.addChild(rightEar)

  // Left eye
  const leftEye = new Graphics()
  leftEye.circle(-3.5, -1, 2)
  leftEye.fill({ color: EYE })
  head.addChild(leftEye)

  // Right eye
  const rightEye = new Graphics()
  rightEye.circle(3.5, -1, 2)
  rightEye.fill({ color: EYE })
  head.addChild(rightEye)

  // Position head on top of body
  head.y = -14
  cat.addChild(head)

  // Blink state stored on the cat container
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(cat as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }

  // Leg stubs (thin rounded rects hanging from body)
  const legColor = BASE

  // Left back leg + paw
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

  // Right back leg + paw
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

  // Left front leg + paw
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

  // Right front leg + paw
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

  catPartsMap.set(cat, {
    body,
    head,
    leftEar,
    rightEar,
    leftEye,
    rightEye,
    tail,
    leftFrontLeg,
    rightFrontLeg,
    leftBackLeg,
    rightBackLeg,
    leftFrontPaw,
    rightFrontPaw,
    leftBackPaw,
    rightBackPaw,
  })

  updateCatPose(cat, 'idle', true)
  return cat
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

  // Move legs together with paws so they stay visually attached
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
  const scale = Math.max(2.5, (stageWidth * 0.15) / NATIVE_WIDTH)
  const catWidth = NATIVE_WIDTH * scale
  const minGap = 24

  const totalWidth = cats.length * catWidth + (cats.length - 1) * minGap
  let gap = minGap
  if (totalWidth > stageWidth && cats.length > 1) {
    const available = stageWidth - cats.length * catWidth
    gap = Math.max(8, available / (cats.length - 1))
  }

  let currentX = (stageWidth - (cats.length * catWidth + (cats.length - 1) * gap)) / 2
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i]
    cat.scale.set(scale)
    cat.x = currentX + catWidth / 2
    cat.y = lineY
    currentX += catWidth + gap
  }
}
