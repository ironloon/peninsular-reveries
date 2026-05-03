import { Application, Container, Graphics } from 'pixi.js'
import { buildSprite, catModel, crocodileModel, flamingoModel, giraffeModel, wolfModel } from './sprites.js'
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
  const overrides: Record<string, string | number> | undefined =
    kind === 'cat' && tint != null ? { base: tint } : undefined

  const model =
    kind === 'cat' ? catModel :
    kind === 'giraffe' ? giraffeModel :
    kind === 'crocodile' ? crocodileModel :
    kind === 'wolf' ? wolfModel :
    flamingoModel

  const { container, parts } = buildSprite(model, overrides)

  buildPartsMap(container, {
    body: parts.get('body')!,
    head: parts.get('head')!,
    leftEar: parts.get(
      kind === 'giraffe' ? 'leftOssicone' :
      kind === 'crocodile' ? 'leftBump' :
      kind === 'flamingo' ? 'leftNub' :
      'leftEar'
    )!,
    rightEar: parts.get(
      kind === 'giraffe' ? 'rightOssicone' :
      kind === 'crocodile' ? 'rightBump' :
      kind === 'flamingo' ? 'rightNub' :
      'rightEar'
    )!,
    leftEye: parts.get('leftEye')!,
    rightEye: parts.get('rightEye')!,
    tail: parts.get('tail')!,
    leftFrontLeg: parts.get('leftFrontLeg')!,
    rightFrontLeg: parts.get('rightFrontLeg')!,
    leftBackLeg: parts.get('leftBackLeg')!,
    rightBackLeg: parts.get('rightBackLeg')!,
    leftFrontPaw: parts.get('leftFrontPaw')!,
    rightFrontPaw: parts.get('rightFrontPaw')!,
    leftBackPaw: parts.get('leftBackPaw')!,
    rightBackPaw: parts.get('rightBackPaw')!,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(container as any).__blinkState = { open: true, nextBlink: 2000 + Math.random() * 3000 }
  return container
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
