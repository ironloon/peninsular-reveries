import { Container, Graphics } from 'pixi.js'

// ── Schema (pixijs-declarative-sprite skill v2.0) ───────────────────────────

export type Shape =
  | { kind: 'circle'; x: number; y: number; r: number; fill: string; alpha?: number }
  | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number; fill: string; alpha?: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string; alpha?: number }
  | { kind: 'roundedRect'; x: number; y: number; w: number; h: number; r: number; fill: string; alpha?: number }
  | { kind: 'polygon'; points: number[]; fill: string; alpha?: number }

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
  nativeBounds: { x: number; y: number; width: number; height: number }
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
      const alpha = shape.alpha ?? 1

      switch (shape.kind) {
        case 'circle':
          g.circle(shape.x, shape.y, shape.r)
          g.fill({ color, alpha })
          break
        case 'ellipse':
          g.ellipse(shape.x, shape.y, shape.rx, shape.ry)
          g.fill({ color, alpha })
          break
        case 'rect':
          g.rect(shape.x, shape.y, shape.w, shape.h)
          g.fill({ color, alpha })
          break
        case 'roundedRect':
          g.roundRect(shape.x, shape.y, shape.w, shape.h, shape.r)
          g.fill({ color, alpha })
          break
        case 'polygon': {
          const pts = shape.points
          if (pts.length >= 4) {
            g.moveTo(pts[0], pts[1])
            for (let i = 2; i < pts.length; i += 2) {
              g.lineTo(pts[i], pts[i + 1])
            }
            g.closePath()
            g.fill({ color, alpha })
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
  const nativeBounds = container.getLocalBounds()
  return { container, parts, nativeBounds }
}

// ── Cat model ──────────────────────────────────────────────────────────────

export const catModel: Model = {
  name: 'cat',
  palette: {
    base: '#1a1a1a',
    belly: '#2d2d2d',
    accent: '#ff9999',
    eye: '#ffffff',
    pupil: '#000000',
    shadow: '#000000',
    highlight: '#ffffff',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        role: 'wag',
        offset: [-10, 2],
        shapes: [
          { kind: 'ellipse', x: -6, y: 0, rx: 8, ry: 3, fill: 'base' },
          { kind: 'ellipse', x: -14, y: -1, rx: 5, ry: 2.5, fill: 'base' },
        ],
      },
      {
        name: 'body',
        role: 'idle_breath',
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 14, ry: 11, fill: 'base' },
          { kind: 'ellipse', x: 0, y: 3, rx: 10, ry: 7, fill: 'belly' },
          { kind: 'ellipse', x: 0, y: 10, rx: 11, ry: 3, fill: 'shadow', alpha: 0.25 },
          { kind: 'ellipse', x: -5, y: -6, rx: 5, ry: 3, fill: 'highlight', alpha: 0.2 },
        ],
      },
      {
        name: 'head',
        role: 'look',
        offset: [0, -12],
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 10, ry: 9, fill: 'base' },
          { kind: 'ellipse', x: -4, y: -4, rx: 4, ry: 3, fill: 'highlight', alpha: 0.25 },
        ],
        children: [
          {
            name: 'leftEar',
            shapes: [{ kind: 'polygon', points: [-6, -7, -10, -19, -2, -7], fill: 'base' }],
          },
          {
            name: 'rightEar',
            shapes: [{ kind: 'polygon', points: [2, -7, 10, -19, 6, -7], fill: 'base' }],
          },
          {
            name: 'leftEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: -4, y: -1, r: 2.8, fill: 'eye' },
              { kind: 'circle', x: -4, y: -1, r: 1.2, fill: 'pupil' },
            ],
          },
          {
            name: 'rightEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: 4, y: -1, r: 2.8, fill: 'eye' },
              { kind: 'circle', x: 4, y: -1, r: 1.2, fill: 'pupil' },
            ],
          },
        ],
      },
      { name: 'leftBackLeg', role: 'step', offset: [-9, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -2, w: 5, h: 14, r: 2.5, fill: 'base' }] },
      { name: 'rightBackLeg', role: 'step', offset: [-3, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -2, w: 5, h: 14, r: 2.5, fill: 'base' }] },
      { name: 'leftFrontLeg', role: 'step', offset: [3, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -4, w: 5, h: 16, r: 2.5, fill: 'base' }] },
      { name: 'rightFrontLeg', role: 'step', offset: [9, 4], shapes: [{ kind: 'roundedRect', x: -2.5, y: -4, w: 5, h: 16, r: 2.5, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-9, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'rightBackPaw', offset: [-3, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'leftFrontPaw', offset: [3, 16], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
      { name: 'rightFrontPaw', offset: [9, 16], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'base' }] },
    ],
  },
}

// ── Giraffe model ─────────────────────────────────────────────────────────

export const giraffeModel: Model = {
  name: 'giraffe',
  palette: {
    base: '#D4A35A',
    belly: '#E8C880',
    accent: '#8B5E2E',
    eye: '#ffffff',
    pupil: '#000000',
    shadow: '#5C3A1E',
    highlight: '#F5E6C8',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        role: 'wag',
        offset: [-11, -2],
        shapes: [
          { kind: 'ellipse', x: -5, y: 0, rx: 7, ry: 2.5, fill: 'base' },
          { kind: 'ellipse', x: -11, y: -1, rx: 4, ry: 2, fill: 'base' },
        ],
      },
      {
        name: 'body',
        role: 'idle_breath',
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 13, ry: 10, fill: 'base' },
          { kind: 'ellipse', x: 0, y: 3, rx: 9, ry: 6, fill: 'belly' },
          { kind: 'ellipse', x: 0, y: 8, rx: 10, ry: 2.5, fill: 'shadow', alpha: 0.3 },
        ],
      },
      {
        name: 'neck',
        offset: [0, -10],
        shapes: [
          { kind: 'roundedRect', x: -2.5, y: -14, w: 5, h: 28, r: 2.5, fill: 'base' },
          { kind: 'roundedRect', x: -1.5, y: -12, w: 3, h: 24, r: 1.5, fill: 'belly', alpha: 0.5 },
        ],
      },
      {
        name: 'head',
        role: 'look',
        offset: [0, -28],
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 7, ry: 6, fill: 'base' },
          { kind: 'ellipse', x: -2, y: -3, rx: 3, ry: 2, fill: 'highlight', alpha: 0.3 },
        ],
        children: [
          {
            name: 'leftOssicone',
            shapes: [
              { kind: 'roundedRect', x: -4, y: -10, w: 2.2, h: 5, r: 1, fill: 'accent' },
              { kind: 'circle', x: -2.9, y: -10.5, r: 1.4, fill: 'accent' },
            ],
          },
          {
            name: 'rightOssicone',
            shapes: [
              { kind: 'roundedRect', x: 1.8, y: -10, w: 2.2, h: 5, r: 1, fill: 'accent' },
              { kind: 'circle', x: 2.9, y: -10.5, r: 1.4, fill: 'accent' },
            ],
          },
          {
            name: 'leftEar',
            shapes: [{ kind: 'roundedRect', x: -5, y: -4, w: 2.5, h: 3.5, r: 1, fill: 'base' }],
          },
          {
            name: 'rightEar',
            shapes: [{ kind: 'roundedRect', x: 2.5, y: -4, w: 2.5, h: 3.5, r: 1, fill: 'base' }],
          },
          {
            name: 'leftEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: -3, y: -1, r: 2.2, fill: 'eye' },
              { kind: 'circle', x: -3, y: -1, r: 1, fill: 'pupil' },
            ],
          },
          {
            name: 'rightEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: 3, y: -1, r: 2.2, fill: 'eye' },
              { kind: 'circle', x: 3, y: -1, r: 1, fill: 'pupil' },
            ],
          },
        ],
      },
      { name: 'leftBackLeg', role: 'step', offset: [-8, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'rightBackLeg', role: 'step', offset: [-2.5, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'leftFrontLeg', role: 'step', offset: [2.5, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'rightFrontLeg', role: 'step', offset: [8, 6], shapes: [{ kind: 'roundedRect', x: -1.2, y: -2, w: 2.4, h: 20, r: 1, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-8, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'shadow' }] },
      { name: 'rightBackPaw', offset: [-2.5, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'shadow' }] },
      { name: 'leftFrontPaw', offset: [2.5, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'shadow' }] },
      { name: 'rightFrontPaw', offset: [8, 22], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 3, r: 1, fill: 'shadow' }] },
    ],
  },
}

// ── Crocodile model ────────────────────────────────────────────────────────

export const crocodileModel: Model = {
  name: 'crocodile',
  palette: {
    base: '#3D6B4A',
    belly: '#4E8560',
    accent: '#2A4D35',
    eye: '#ffffff',
    pupil: '#000000',
    shadow: '#1A3322',
    highlight: '#6B9E7D',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        role: 'wag',
        offset: [-18, 0],
        shapes: [
          { kind: 'ellipse', x: -6, y: 0, rx: 10, ry: 4, fill: 'base' },
          { kind: 'ellipse', x: -14, y: 1, rx: 6, ry: 3, fill: 'base' },
        ],
      },
      {
        name: 'body',
        role: 'idle_breath',
        shapes: [
          { kind: 'roundedRect', x: -18, y: -7, w: 36, h: 14, r: 6, fill: 'base' },
          { kind: 'roundedRect', x: -12, y: -4, w: 24, h: 8, r: 4, fill: 'belly' },
          { kind: 'ellipse', x: 0, y: 6, rx: 14, ry: 2.5, fill: 'shadow', alpha: 0.3 },
        ],
      },
      {
        name: 'head',
        role: 'look',
        offset: [14, -2],
        shapes: [
          { kind: 'roundedRect', x: -6, y: -6, w: 22, h: 12, r: 5, fill: 'base' },
          { kind: 'roundedRect', x: -2, y: -3, w: 14, h: 6, r: 3, fill: 'belly' },
        ],
        children: [
          {
            name: 'leftBump',
            shapes: [{ kind: 'circle', x: 2, y: -8, r: 2.5, fill: 'accent' }],
          },
          {
            name: 'rightBump',
            shapes: [{ kind: 'circle', x: 8, y: -8, r: 2.5, fill: 'accent' }],
          },
          {
            name: 'leftEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: 2, y: -7, r: 1.8, fill: 'eye' },
              { kind: 'circle', x: 2, y: -7, r: 0.8, fill: 'pupil' },
            ],
          },
          {
            name: 'rightEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: 8, y: -7, r: 1.8, fill: 'eye' },
              { kind: 'circle', x: 8, y: -7, r: 0.8, fill: 'pupil' },
            ],
          },
        ],
      },
      { name: 'leftBackLeg', role: 'step', offset: [-16, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'rightBackLeg', role: 'step', offset: [-8, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'leftFrontLeg', role: 'step', offset: [7, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'rightFrontLeg', role: 'step', offset: [16, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -2, w: 4, h: 8, r: 2, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-16, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'shadow' }] },
      { name: 'rightBackPaw', offset: [-8, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'shadow' }] },
      { name: 'leftFrontPaw', offset: [7, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'shadow' }] },
      { name: 'rightFrontPaw', offset: [16, 9], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 3, r: 1.5, fill: 'shadow' }] },
    ],
  },
}

// ── Wolf model ──────────────────────────────────────────────────────────────

export const wolfModel: Model = {
  name: 'wolf',
  palette: {
    base: '#778899',
    belly: '#90A0B0',
    accent: '#556677',
    eye: '#ffffff',
    pupil: '#000000',
    shadow: '#445566',
    highlight: '#AABBCC',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        role: 'wag',
        offset: [-10, -2],
        shapes: [
          { kind: 'ellipse', x: -6, y: -2, rx: 8, ry: 4, fill: 'base' },
          { kind: 'ellipse', x: -14, y: -6, rx: 5, ry: 3, fill: 'base' },
          { kind: 'ellipse', x: -18, y: -10, rx: 3, ry: 2, fill: 'accent' },
        ],
      },
      {
        name: 'body',
        role: 'idle_breath',
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 15, ry: 11, fill: 'base' },
          { kind: 'ellipse', x: 0, y: 3, rx: 10, ry: 7, fill: 'belly' },
          { kind: 'ellipse', x: 0, y: 10, rx: 12, ry: 3, fill: 'shadow', alpha: 0.25 },
          { kind: 'ellipse', x: -5, y: -6, rx: 5, ry: 3, fill: 'highlight', alpha: 0.2 },
        ],
      },
      {
        name: 'head',
        role: 'look',
        offset: [0, -14],
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 10, ry: 9, fill: 'base' },
          { kind: 'ellipse', x: -4, y: -4, rx: 4, ry: 3, fill: 'highlight', alpha: 0.25 },
        ],
        children: [
          {
            name: 'leftEar',
            shapes: [{ kind: 'polygon', points: [-6, -7, -11, -23, -2, -7], fill: 'base' }],
          },
          {
            name: 'rightEar',
            shapes: [{ kind: 'polygon', points: [2, -7, 11, -23, 6, -7], fill: 'base' }],
          },
          {
            name: 'leftEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: -4.5, y: -1, r: 2.5, fill: 'eye' },
              { kind: 'circle', x: -4.5, y: -1, r: 1.1, fill: 'pupil' },
            ],
          },
          {
            name: 'rightEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: 4.5, y: -1, r: 2.5, fill: 'eye' },
              { kind: 'circle', x: 4.5, y: -1, r: 1.1, fill: 'pupil' },
            ],
          },
        ],
      },
      { name: 'leftBackLeg', role: 'step', offset: [-10, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'rightBackLeg', role: 'step', offset: [-3.5, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'leftFrontLeg', role: 'step', offset: [3.5, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'rightFrontLeg', role: 'step', offset: [10, 4], shapes: [{ kind: 'roundedRect', x: -2, y: -3, w: 4, h: 13, r: 2, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-10, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'shadow' }] },
      { name: 'rightBackPaw', offset: [-3.5, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'shadow' }] },
      { name: 'leftFrontPaw', offset: [3.5, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'shadow' }] },
      { name: 'rightFrontPaw', offset: [10, 15], shapes: [{ kind: 'roundedRect', x: -3, y: 0, w: 6, h: 4, r: 2, fill: 'shadow' }] },
    ],
  },
}

// ── Flamingo model ─────────────────────────────────────────────────────────

export const flamingoModel: Model = {
  name: 'flamingo',
  palette: {
    base: '#FF9EB5',
    belly: '#FFB6C1',
    accent: '#E88DA0',
    eye: '#ffffff',
    pupil: '#000000',
    shadow: '#C97A8F',
    highlight: '#FFD0DC',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        role: 'wag',
        offset: [-5, -2],
        shapes: [
          { kind: 'ellipse', x: -4, y: 0, rx: 5, ry: 3, fill: 'base' },
          { kind: 'ellipse', x: -8, y: -2, rx: 3, ry: 2, fill: 'accent' },
        ],
      },
      {
        name: 'body',
        role: 'idle_breath',
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 8, ry: 10, fill: 'base' },
          { kind: 'ellipse', x: 0, y: 3, rx: 5, ry: 6, fill: 'belly' },
          { kind: 'ellipse', x: 0, y: 9, rx: 6, ry: 2, fill: 'shadow', alpha: 0.25 },
        ],
      },
      {
        name: 'neck',
        offset: [0, -6],
        shapes: [
          { kind: 'roundedRect', x: -1.5, y: -18, w: 3, h: 36, r: 1.5, fill: 'base' },
          { kind: 'roundedRect', x: -0.8, y: -16, w: 1.6, h: 32, r: 0.8, fill: 'belly', alpha: 0.5 },
        ],
      },
      {
        name: 'head',
        role: 'look',
        offset: [0, -26],
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 6, ry: 5, fill: 'base' },
          { kind: 'ellipse', x: -2, y: -3, rx: 2.5, ry: 2, fill: 'highlight', alpha: 0.3 },
        ],
        children: [
          {
            name: 'beak',
            shapes: [
              { kind: 'polygon', points: [2, -2, 10, -1, 9, 2, 3, 1], fill: 'accent' },
              { kind: 'polygon', points: [2, 1, 8, 2, 7, 4, 2, 3], fill: 'shadow' },
            ],
          },
          {
            name: 'leftNub',
            shapes: [{ kind: 'circle', x: -3, y: -6, r: 1.2, fill: 'accent' }],
          },
          {
            name: 'rightNub',
            shapes: [{ kind: 'circle', x: 3, y: -6, r: 1.2, fill: 'accent' }],
          },
          {
            name: 'leftEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: -2.5, y: -1, r: 1.8, fill: 'eye' },
              { kind: 'circle', x: -2.5, y: -1, r: 0.8, fill: 'pupil' },
            ],
          },
          {
            name: 'rightEye',
            role: 'blink',
            shapes: [
              { kind: 'circle', x: 2.5, y: -1, r: 1.8, fill: 'eye' },
              { kind: 'circle', x: 2.5, y: -1, r: 0.8, fill: 'pupil' },
            ],
          },
        ],
      },
      { name: 'leftBackLeg', role: 'step', offset: [-3, 6], shapes: [{ kind: 'roundedRect', x: -0.8, y: -2, w: 1.6, h: 24, r: 0.8, fill: 'base' }] },
      { name: 'rightBackLeg', role: 'step', offset: [3, 6], shapes: [{ kind: 'roundedRect', x: -0.8, y: -2, w: 1.6, h: 24, r: 0.8, fill: 'base' }] },
      { name: 'leftFrontLeg', role: 'step', offset: [-1.5, 6], shapes: [{ kind: 'roundedRect', x: -0.8, y: -2, w: 1.6, h: 24, r: 0.8, fill: 'base' }] },
      { name: 'rightFrontLeg', role: 'step', offset: [1.5, 6], shapes: [{ kind: 'roundedRect', x: -0.8, y: -2, w: 1.6, h: 24, r: 0.8, fill: 'base' }] },
      { name: 'leftBackPaw', offset: [-3, 30], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 2.5, r: 1, fill: 'shadow' }] },
      { name: 'rightBackPaw', offset: [3, 30], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 2.5, r: 1, fill: 'shadow' }] },
      { name: 'leftFrontPaw', offset: [-1.5, 30], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 2.5, r: 1, fill: 'shadow' }] },
      { name: 'rightFrontPaw', offset: [1.5, 30], shapes: [{ kind: 'roundedRect', x: -2, y: 0, w: 4, h: 2.5, r: 1, fill: 'shadow' }] },
    ],
  },
}
