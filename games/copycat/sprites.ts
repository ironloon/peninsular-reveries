import { Container, Graphics } from 'pixi.js'

// ── Schema (pixijs-declarative-sprite skill v1.0) ───────────────────────────

export type Shape =
  | { kind: 'circle'; x: number; y: number; r: number; fill: string }
  | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number; fill: string }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string }
  | { kind: 'roundedRect'; x: number; y: number; w: number; h: number; r: number; fill: string }
  | { kind: 'polygon'; points: number[]; fill: string }

export interface Part {
  name: string
  role?: string
  offset?: [number, number]
  shapes?: Shape[]
  children?: Part[]
}

export interface Model {
  name: string
  palette: Record<string, string>
  root: Part
}

// ── Runtime: Model → PixiJS Container ─────────────────────────────────────

export interface BuiltSprite {
  container: Container
  parts: Map<string, Graphics>
}

export function buildSprite(
  model: Model,
  paletteOverrides?: Record<string, string | number>,
): BuiltSprite {
  const palette: Record<string, string> = { ...model.palette }
  if (paletteOverrides) {
    for (const [k, v] of Object.entries(paletteOverrides)) {
      palette[k] = typeof v === 'string' ? v : `#${v.toString(16).padStart(6, '0')}`
    }
  }

  const parts = new Map<string, Graphics>()
  const container = new Container()

  function walk(part: Part, parent: Container): void {
    const g = new Graphics()
    if (part.offset) {
      g.x = part.offset[0]
      g.y = part.offset[1]
    }

    for (const shape of part.shapes ?? []) {
      const fill = palette[shape.fill] ?? shape.fill
      const color = typeof fill === 'string' ? parseInt(fill.replace('#', ''), 16) : fill

      switch (shape.kind) {
        case 'circle':
          g.circle(shape.x, shape.y, shape.r)
          g.fill({ color })
          break
        case 'ellipse':
          g.ellipse(shape.x, shape.y, shape.rx, shape.ry)
          g.fill({ color })
          break
        case 'rect':
          g.rect(shape.x, shape.y, shape.w, shape.h)
          g.fill({ color })
          break
        case 'roundedRect':
          g.roundRect(shape.x, shape.y, shape.w, shape.h, shape.r)
          g.fill({ color })
          break
        case 'polygon': {
          const pts = shape.points
          if (pts.length >= 4) {
            g.moveTo(pts[0], pts[1])
            for (let i = 2; i < pts.length; i += 2) {
              g.lineTo(pts[i], pts[i + 1])
            }
            g.closePath()
            g.fill({ color })
          }
          break
        }
      }
    }

    parent.addChild(g)
    parts.set(part.name, g)

    for (const child of part.children ?? []) {
      walk(child, g)
    }
  }

  walk(model.root, container)
  return { container, parts }
}

// ── Cat model ──────────────────────────────────────────────────────────────

export const catModel: Model = {
  name: 'cat',
  palette: { base: '#1a1a1a', eye: '#ffffff' },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        shapes: [
          { kind: 'polygon', points: [-8,-2, -12,-8, -18,-10, -22,-6, -20,0, -14,4, -8,2], fill: 'base' },
        ],
      },
      {
        name: 'body',
        shapes: [
          { kind: 'polygon', points: [-13,-8, -8,-12, -2,-13, 5,-12, 11,-9, 14,-4, 15,2, 14,8, 11,12, 6,14, 0,14, -6,13, -11,10, -14,5, -15,-1], fill: 'base' },
        ],
      },
      {
        name: 'head',
        offset: [0, -12],
        shapes: [
          { kind: 'polygon', points: [-9,-6, -5,-10, 0,-11, 5,-10, 9,-6, 10,-1, 9,4, 6,8, 0,9, -6,8, -9,4, -10,-1], fill: 'base' },
        ],
        children: [
          { name: 'leftEar', shapes: [{ kind: 'polygon', points: [-7,-8, -11,-20, -3,-8], fill: 'base' }] },
          { name: 'rightEar', shapes: [{ kind: 'polygon', points: [3,-8, 11,-20, 7,-8], fill: 'base' }] },
          { name: 'leftEye', shapes: [{ kind: 'circle', x: -4, y: -2, r: 2.5, fill: 'eye' }] },
          { name: 'rightEye', shapes: [{ kind: 'circle', x: 4, y: -2, r: 2.5, fill: 'eye' }] },
        ],
      },
      { name: 'leftBackLeg', offset: [-9, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -2, w: 5, h: 14, r: 2.5, fill: 'base' }] },
      { name: 'rightBackLeg', offset: [-3, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -2, w: 5, h: 14, r: 2.5, fill: 'base' }] },
      { name: 'leftFrontLeg', offset: [3, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -4, w: 5, h: 16, r: 2.5, fill: 'base' }] },
      { name: 'rightFrontLeg', offset: [9, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -4, w: 5, h: 16, r: 2.5, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-9, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'rightBackPaw', offset: [-3, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'leftFrontPaw', offset: [3, 16], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'rightFrontPaw', offset: [9, 16], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
    ],
  },
}

// ── Giraffe model ───────────────────────────────────────────────────────────

export const giraffeModel: Model = {
  name: 'giraffe',
  palette: { base: '#D4A35A', hoof: '#3D2B1F', eye: '#ffffff', ossicone: '#8B5E2E' },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        shapes: [
          { kind: 'polygon', points: [-8,-2, -16,-8, -18,-12, -14,-10, -8,-4], fill: 'base' },
        ],
      },
      {
        name: 'body',
        shapes: [
          { kind: 'polygon', points: [-10,-14, -6,-17, 0,-18, 6,-17, 10,-14, 11,-8, 12,0, 11,8, 10,15, 6,17, 0,18, -6,17, -10,15, -11,8, -12,0, -11,-8], fill: 'base' },
        ],
      },
      {
        name: 'neck',
        shapes: [
          { kind: 'roundedRect', x: -2, y: -16, w: 4, h: 32, r: 2, fill: 'base' },
        ],
      },
      {
        name: 'head',
        offset: [0, -14],
        shapes: [
          { kind: 'polygon', points: [-7,-24, -4,-28, 0,-29, 4,-28, 7,-24, 8,-20, 7,-16, 4,-13, 0,-12, -4,-13, -7,-16, -8,-20], fill: 'base' },
        ],
        children: [
          { name: 'leftEar', shapes: [{ kind: 'roundedRect', x: -4, y: -30, w: 2.5, h: 5, r: 1, fill: 'ossicone' }] },
          { name: 'rightEar', shapes: [{ kind: 'roundedRect', x: 1.5, y: -30, w: 2.5, h: 5, r: 1, fill: 'ossicone' }] },
          { name: 'leftEye', shapes: [{ kind: 'circle', x: -3.5, y: -23, r: 2, fill: 'eye' }] },
          { name: 'rightEye', shapes: [{ kind: 'circle', x: 3.5, y: -23, r: 2, fill: 'eye' }] },
        ],
      },
      { name: 'leftBackLeg', offset: [-8, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'rightBackLeg', offset: [-2.5, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'leftFrontLeg', offset: [2.5, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'rightFrontLeg', offset: [8, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-8, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'hoof' }] },
      { name: 'rightBackPaw', offset: [-2.5, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'hoof' }] },
      { name: 'leftFrontPaw', offset: [2.5, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'hoof' }] },
      { name: 'rightFrontPaw', offset: [8, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'hoof' }] },
    ],
  },
}

// ── Crocodile model ─────────────────────────────────────────────────────────

export const crocodileModel: Model = {
  name: 'crocodile',
  palette: { base: '#3D6B4A', eye: '#ffffff', bump: '#2A4D35' },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        shapes: [
          { kind: 'polygon', points: [-22,-4, -34,-2, -36,2, -34,4, -22,4], fill: 'base' },
        ],
      },
      {
        name: 'body',
        shapes: [
          { kind: 'polygon', points: [-22,-6, -16,-9, -10,-7, -4,-9, 2,-7, 8,-9, 14,-7, 20,-6, 22,-2, 22,4, 18,7, 12,8, 6,7, 0,8, -6,7, -12,8, -18,7, -22,4], fill: 'base' },
        ],
      },
      {
        name: 'head',
        offset: [2, -1],
        shapes: [
          { kind: 'polygon', points: [6,-7, 12,-8, 20,-6, 28,-3, 32,0, 28,3, 20,5, 12,6, 6,5], fill: 'base' },
        ],
        children: [
          { name: 'leftEar', shapes: [{ kind: 'circle', x: 10, y: -10, r: 2.5, fill: 'bump' }] },
          { name: 'rightEar', shapes: [{ kind: 'circle', x: 16, y: -10, r: 2.5, fill: 'bump' }] },
          { name: 'leftEye', shapes: [{ kind: 'circle', x: 10, y: -10, r: 1.5, fill: 'eye' }] },
          { name: 'rightEye', shapes: [{ kind: 'circle', x: 16, y: -10, r: 1.5, fill: 'eye' }] },
        ],
      },
      { name: 'leftBackLeg', offset: [-16, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'rightBackLeg', offset: [-8, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'leftFrontLeg', offset: [7, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'rightFrontLeg', offset: [16, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-16, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'base' }] },
      { name: 'rightBackPaw', offset: [-8, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'base' }] },
      { name: 'leftFrontPaw', offset: [7, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'base' }] },
      { name: 'rightFrontPaw', offset: [16, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'base' }] },
    ],
  },
}

// ── Wolf model ──────────────────────────────────────────────────────────────

export const wolfModel: Model = {
  name: 'wolf',
  palette: { base: '#778899', eye: '#ffffff' },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        shapes: [
          { kind: 'polygon', points: [-10,-2, -16,-10, -22,-16, -18,-20, -12,-18, -8,-12, -6,-6, -8,-2], fill: 'base' },
        ],
      },
      {
        name: 'body',
        shapes: [
          { kind: 'polygon', points: [-14,-7, -10,-10, -4,-11, 2,-11, 8,-10, 14,-7, 16,-2, 16,4, 14,9, 10,11, 4,11, -2,11, -8,10, -13,8, -15,4, -15,-2], fill: 'base' },
        ],
      },
      {
        name: 'head',
        offset: [0, -14],
        shapes: [
          { kind: 'polygon', points: [0,-10, -4,-14, -8,-8, -11,0, -10,6, -6,8, 0,9, 6,8, 10,6, 11,0, 8,-8, 4,-14], fill: 'base' },
        ],
        children: [
          { name: 'leftEar', shapes: [{ kind: 'polygon', points: [-6,-8, -10,-24, -2,-8], fill: 'base' }] },
          { name: 'rightEar', shapes: [{ kind: 'polygon', points: [2,-8, 10,-24, 6,-8], fill: 'base' }] },
          { name: 'leftEye', shapes: [{ kind: 'circle', x: -4.5, y: -2, r: 2.2, fill: 'eye' }] },
          { name: 'rightEye', shapes: [{ kind: 'circle', x: 4.5, y: -2, r: 2.2, fill: 'eye' }] },
        ],
      },
      { name: 'leftBackLeg', offset: [-10, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'rightBackLeg', offset: [-3.5, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'leftFrontLeg', offset: [3.5, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'rightFrontLeg', offset: [10, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-10, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'rightBackPaw', offset: [-3.5, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'leftFrontPaw', offset: [3.5, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'rightFrontPaw', offset: [10, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
    ],
  },
}

// ── Flamingo model ─────────────────────────────────────────────────────────

export const flamingoModel: Model = {
  name: 'flamingo',
  palette: { base: '#FF9EB5', eye: '#ffffff', beak: '#FFB6C1', nub: '#E88DA0' },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        shapes: [
          { kind: 'polygon', points: [-5,-4, -10,-10, -6,-12, -3,-6], fill: 'base' },
        ],
      },
      {
        name: 'body',
        shapes: [
          { kind: 'polygon', points: [-6,-16, -3,-18, 0,-18, 3,-18, 6,-16, 7,-10, 7,0, 7,10, 6,16, 3,18, 0,18, -3,18, -6,16, -7,10, -7,0, -7,-10], fill: 'base' },
        ],
      },
      {
        name: 'neck',
        offset: [0, -6],
        shapes: [
          { kind: 'roundedRect', x: -1.5, y: -18, w: 3, h: 34, r: 1.5, fill: 'base' },
        ],
      },
      {
        name: 'head',
        offset: [0, -14],
        shapes: [
          { kind: 'polygon', points: [-5,-28, -2,-31, 2,-31, 5,-28, 6,-24, 5,-21, 2,-19, -2,-19, -5,-21, -6,-24], fill: 'base' },
        ],
        children: [
          { name: 'beak', shapes: [{ kind: 'polygon', points: [3,-25, 10,-23, 9,-20, 4,-22], fill: 'beak' }] },
          { name: 'leftEar', shapes: [{ kind: 'circle', x: -3, y: -32, r: 1.2, fill: 'nub' }] },
          { name: 'rightEar', shapes: [{ kind: 'circle', x: 3, y: -32, r: 1.2, fill: 'nub' }] },
          { name: 'leftEye', shapes: [{ kind: 'circle', x: -2, y: -27, r: 1.8, fill: 'eye' }] },
          { name: 'rightEye', shapes: [{ kind: 'circle', x: 2, y: -27, r: 1.8, fill: 'eye' }] },
        ],
      },
      { name: 'leftLeg', offset: [-4, 6], shapes: [{ kind: 'roundedRect', x: -1, y: -2, w: 2, h: 24, r: 1, fill: 'base' }] },
      { name: 'rightLeg', offset: [4, 6], shapes: [{ kind: 'roundedRect', x: -1, y: -2, w: 2, h: 24, r: 1, fill: 'base' }] },
      { name: 'leftPaw', offset: [-4, 30], shapes: [{ kind: 'roundedRect', x: -2.5, y: 0, w: 5, h: 2.5, r: 1, fill: 'base' }] },
      { name: 'rightPaw', offset: [4, 30], shapes: [{ kind: 'roundedRect', x: -2.5, y: 0, w: 5, h: 2.5, r: 1, fill: 'base' }] },
    ],
  },
}
