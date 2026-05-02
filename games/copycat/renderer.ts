import { Application, Container, Graphics } from 'pixi.js'
import type { Pose } from './types.js'

// ── Renderer health check ──────────────────────────────────────────────────

async function checkRendererHealth(app: Application): Promise<boolean> {
  // Some browsers claim WebGPU support but produce transparent compositor output
  // (e.g. Firefox with broken ANGLE drivers).  toDataURL() can return a
  // *different* PNG on each call even though the compositor is broken (driver
  // noise / compression differences), so comparing data-URL strings is NOT
  // reliable.  Instead we force a real compositor readback by drawing the
  // PixiJS canvas into a fresh 2D canvas and checking actual RGBA pixels.
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
    // drawImage forces the browser to composite the GPU/WebGL canvas into a 2D
    // bitmap.  If the compositor is broken this will produce all-transparent.
    ctx.drawImage(app.canvas, 0, 0, 50, 50, 0, 0, 50, 50)
    const data = ctx.getImageData(0, 0, 50, 50).data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 200 && data[i + 1] < 50 && data[i + 2] < 50) {
        // Found an actual red pixel — the renderer is producing visible output.
        app.stage.removeChild(g)
        g.destroy()
        app.render()
        return true
      }
    }
  } catch {
    // drawImage or getImageData failed — broken renderer.
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
      background: '#1a1a2e',
      backgroundAlpha: 0,
      autoDensity: true,
    })
    container.appendChild(app.canvas)
    return app
  } catch {
    return null
  }
}

// ── Internal types for cat graphics references ───────────────────────────────

export interface CatGraphics {
  body: Graphics
  head: Graphics
  leftEar: Graphics
  rightEar: Graphics
  leftEye: Graphics
  rightEye: Graphics
  tail: Graphics
  leftFrontPaw: Graphics
  rightFrontPaw: Graphics
  leftBackPaw: Graphics
  rightBackPaw: Graphics
}

interface PoseTargets {
  bodyY: number
  bodyScaleY: number
  headY: number
  leftEarY: number
  rightEarY: number
  tailRotation: number
  leftFrontPawY: number
  rightFrontPawY: number
  leftBackPawY: number
  rightBackPawY: number
  leftFrontPawRotation: number
  rightFrontPawRotation: number
}

const catPartsMap = new WeakMap<Container, CatGraphics>()

// ── Stage init ────────────────────────────────────────────────────────────────

export async function initStage(canvasContainer: HTMLElement): Promise<Application | null> {
  // Try WebGPU first (best performance), then WebGL, then Canvas2D.
  // Some browsers claim WebGPU support but have broken GPU drivers;
  // the health check catches transparent output and forces a working fallback.
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    const app = await tryCreateApp(canvasContainer, preference)
    if (!app) continue

    const healthy = await checkRendererHealth(app)
    if (healthy) {
      return app
    }

    // Broken renderer - tear down and try next fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(app as any).destroy(true)
    canvasContainer.innerHTML = ''
  }

  // All renderers failed
  const message = document.createElement('p')
  message.style.color = '#e0e0e0'
  message.style.textAlign = 'center'
  message.style.padding = '2rem'
  message.textContent = 'Unable to start the dance stage. Your browser cannot run this experience.'
  canvasContainer.appendChild(message)
  return null
}

// ── Cat creation ──────────────────────────────────────────────────────────────

export function createCat(): Container {
  const cat = new Container()
  const BASE = 0xffffff

  // Tail (drawn behind body)
  const tail = new Graphics()
  tail.moveTo(-10, 2)
  tail.lineTo(-18, 0)
  tail.lineTo(-22, -6)
  tail.lineTo(-20, -12)
  tail.lineTo(-14, -10)
  tail.lineTo(-12, -4)
  tail.closePath()
  tail.fill({ color: BASE })
  cat.addChild(tail)

  // Body
  const body = new Graphics()
  body.roundRect(-12, -7, 24, 14, 7)
  body.fill({ color: BASE })
  cat.addChild(body)

  // Head
  const head = new Graphics()
  head.circle(8, -6, 8)
  head.fill({ color: BASE })
  cat.addChild(head)

  // Left ear
  const leftEar = new Graphics()
  leftEar.moveTo(2, -12)
  leftEar.lineTo(6, -18)
  leftEar.lineTo(10, -12)
  leftEar.closePath()
  leftEar.fill({ color: BASE })
  cat.addChild(leftEar)

  // Right ear
  const rightEar = new Graphics()
  rightEar.moveTo(8, -12)
  rightEar.lineTo(12, -18)
  rightEar.lineTo(16, -12)
  rightEar.closePath()
  rightEar.fill({ color: BASE })
  cat.addChild(rightEar)

  // Eyes
  const leftEye = new Graphics()
  leftEye.circle(5, -7, 1.5)
  leftEye.fill({ color: 0x1a1a2e })
  cat.addChild(leftEye)

  const rightEye = new Graphics()
  rightEye.circle(10, -7, 1.5)
  rightEye.fill({ color: 0x1a1a2e })
  cat.addChild(rightEye)

  // Paws
  const leftBackPaw = new Graphics()
  leftBackPaw.ellipse(-12, 9, 3, 2.5)
  leftBackPaw.fill({ color: BASE })
  cat.addChild(leftBackPaw)

  const rightBackPaw = new Graphics()
  rightBackPaw.ellipse(-8, 8, 3.5, 3)
  rightBackPaw.fill({ color: BASE })
  cat.addChild(rightBackPaw)

  const rightFrontPaw = new Graphics()
  rightFrontPaw.ellipse(0, 9, 3, 2.5)
  rightFrontPaw.fill({ color: BASE })
  cat.addChild(rightFrontPaw)

  const leftFrontPaw = new Graphics()
  leftFrontPaw.ellipse(4, 8, 3.5, 3)
  leftFrontPaw.fill({ color: BASE })
  cat.addChild(leftFrontPaw)

  catPartsMap.set(cat, {
    body,
    head,
    leftEar,
    rightEar,
    leftEye,
    rightEye,
    tail,
    leftFrontPaw,
    rightFrontPaw,
    leftBackPaw,
    rightBackPaw,
  })

  updateCatPose(cat, 'idle', true)
  return cat
}

// ── Pose targets ─────────────────────────────────────────────────────────────

export function getPoseTargets(pose: Pose): PoseTargets {
  switch (pose) {
    case 'idle':
      return {
        bodyY: 0,
        bodyScaleY: 1,
        headY: 0,
        leftEarY: 0,
        rightEarY: 0,
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
        leftEarY: -2,
        rightEarY: -2,
        tailRotation: -0.4,
        leftFrontPawY: -20,
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
        leftEarY: -2,
        rightEarY: -2,
        tailRotation: 0.4,
        leftFrontPawY: 0,
        rightFrontPawY: -20,
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
        leftEarY: -4,
        rightEarY: -4,
        tailRotation: 0,
        leftFrontPawY: -20,
        rightFrontPawY: -20,
        leftBackPawY: -4,
        rightBackPawY: -4,
        leftFrontPawRotation: -0.5,
        rightFrontPawRotation: -0.5,
      }
    case 'crouch':
      return {
        bodyY: 10,
        bodyScaleY: 0.85,
        headY: 6,
        leftEarY: 4,
        rightEarY: 4,
        tailRotation: 0.5,
        leftFrontPawY: 5,
        rightFrontPawY: 5,
        leftBackPawY: 5,
        rightBackPawY: 5,
        leftFrontPawRotation: 0,
        rightFrontPawRotation: 0,
      }
    case 'jump':
      return {
        bodyY: -22,
        bodyScaleY: 1.12,
        headY: -10,
        leftEarY: -6,
        rightEarY: -6,
        tailRotation: -0.8,
        leftFrontPawY: -10,
        rightFrontPawY: -10,
        leftBackPawY: -16,
        rightBackPawY: -16,
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
  parts.leftEar.y = targets.leftEarY
  parts.rightEar.y = targets.rightEarY
  parts.tail.rotation = targets.tailRotation
  parts.leftFrontPaw.y = targets.leftFrontPawY
  parts.rightFrontPaw.y = targets.rightFrontPawY
  parts.leftBackPaw.y = targets.leftBackPawY
  parts.rightBackPaw.y = targets.rightBackPawY
  parts.leftFrontPaw.rotation = targets.leftFrontPawRotation
  parts.rightFrontPaw.rotation = targets.rightFrontPawRotation
}

// ── Pose update ───────────────────────────────────────────────────────────────

export function updateCatPose(cat: Container, pose: Pose, _instant: boolean = false): void {
  const parts = catPartsMap.get(cat)
  if (!parts) return
  const targets = getPoseTargets(pose)
  applyPoseTargets(parts, targets)
}

// ── Parts accessor (used by animations) ──────────────────────────────────────

export function getCatParts(cat: Container): CatGraphics | undefined {
  return catPartsMap.get(cat)
}

// ── Layout helper ─────────────────────────────────────────────────────────────

export function layoutCats(cats: Container[], stageWidth: number, stageHeight: number): void {
  const lineY = stageHeight * 0.65
  // All cats share the same scale so they look like a uniform dance line.
  const baseWidth = Math.max(36, stageWidth * 0.12)
  const scale = 1.2
  const minGap = 48

  const totalWidth = cats.length * baseWidth * scale + (cats.length - 1) * minGap
  let gap = minGap
  if (totalWidth > stageWidth && cats.length > 1) {
    const available = stageWidth - cats.length * baseWidth * scale
    gap = Math.max(20, available / (cats.length - 1))
  }

  let currentX = (stageWidth - (cats.length * baseWidth * scale + (cats.length - 1) * gap)) / 2
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i]
    cat.scale.set(scale)
    cat.x = currentX + (baseWidth * scale) / 2
    cat.y = lineY
    currentX += baseWidth * scale + gap
  }
}
