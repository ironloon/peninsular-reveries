import { Application, Container, Graphics } from 'pixi.js'
import type { Pose } from './types.js'

// ── Renderer health check ──────────────────────────────────────────────────

async function checkRendererHealth(app: Application): Promise<boolean> {
  // Some browsers claim WebGPU support but produce transparent compositor output
  // (e.g. Firefox with broken ANGLE drivers).  We draw a red square and
  // compare the canvas *before* and *after* — if the PNG is unchanged the
  // renderer is “soft-broken” even though init succeeded.
  const emptyDataUrl = app.canvas.toDataURL()

  const g = new Graphics()
  g.rect(0, 0, 100, 100)
  g.fill({ color: 0xff0000 })
  app.stage.addChild(g)
  app.render()

  const redDataUrl = app.canvas.toDataURL()

  app.stage.removeChild(g)
  g.destroy()

  // Clear the canvas back to empty so the next health check starts clean
  app.render()

  // If the canvas bitmap did not change, the renderer is compositing nothing.
  return emptyDataUrl !== redDataUrl
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

    // Broken renderer — tear down and try next fallback
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
        bodyY: -2,
        bodyScaleY: 1.02,
        headY: -1,
        leftEarY: -1,
        rightEarY: -1,
        tailRotation: -0.2,
        leftFrontPawY: -12,
        rightFrontPawY: 0,
        leftBackPawY: 0,
        rightBackPawY: 0,
        leftFrontPawRotation: -0.3,
        rightFrontPawRotation: 0,
      }
    case 'right-paw-up':
      return {
        bodyY: -2,
        bodyScaleY: 1.02,
        headY: -1,
        leftEarY: -1,
        rightEarY: -1,
        tailRotation: 0.2,
        leftFrontPawY: 0,
        rightFrontPawY: -12,
        leftBackPawY: 0,
        rightBackPawY: 0,
        leftFrontPawRotation: 0,
        rightFrontPawRotation: -0.3,
      }
    case 'both-paws-up':
      return {
        bodyY: -4,
        bodyScaleY: 1.04,
        headY: -2,
        leftEarY: -2,
        rightEarY: -2,
        tailRotation: 0,
        leftFrontPawY: -12,
        rightFrontPawY: -12,
        leftBackPawY: -2,
        rightBackPawY: -2,
        leftFrontPawRotation: -0.3,
        rightFrontPawRotation: -0.3,
      }
    case 'crouch':
      return {
        bodyY: 5,
        bodyScaleY: 0.92,
        headY: 3,
        leftEarY: 2,
        rightEarY: 2,
        tailRotation: 0.3,
        leftFrontPawY: 3,
        rightFrontPawY: 3,
        leftBackPawY: 3,
        rightBackPawY: 3,
        leftFrontPawRotation: 0,
        rightFrontPawRotation: 0,
      }
    case 'jump':
      return {
        bodyY: -10,
        bodyScaleY: 1.05,
        headY: -5,
        leftEarY: -3,
        rightEarY: -3,
        tailRotation: -0.5,
        leftFrontPawY: -5,
        rightFrontPawY: -5,
        leftBackPawY: -8,
        rightBackPawY: -8,
        leftFrontPawRotation: 0.2,
        rightFrontPawRotation: 0.2,
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
  const scales = [1.2, 1.0, 0.9, 0.85, 0.8]
  const baseWidth = 36
  const minGap = 48

  let totalWidth = 0
  for (let i = 0; i < cats.length; i++) {
    const s = scales[i] ?? 0.75
    totalWidth += baseWidth * s
  }
  totalWidth += (cats.length - 1) * minGap

  let gap = minGap
  if (totalWidth > stageWidth && cats.length > 1) {
    const available = stageWidth - cats.reduce((sum, _, i) => sum + baseWidth * (scales[i] ?? 0.75), 0)
    gap = Math.max(20, available / (cats.length - 1))
    totalWidth = 0
    for (let i = 0; i < cats.length; i++) {
      const s = scales[i] ?? 0.75
      totalWidth += baseWidth * s
      if (i < cats.length - 1) totalWidth += gap
    }
  }

  let currentX = (stageWidth - totalWidth) / 2
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i]
    const s = scales[i] ?? 0.75
    cat.scale.set(s)
    cat.x = currentX + (baseWidth * s) / 2
    cat.y = lineY
    currentX += baseWidth * s + gap
  }
}
