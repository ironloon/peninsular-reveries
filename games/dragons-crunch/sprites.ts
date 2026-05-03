import { Container, Graphics } from 'pixi.js'

// ── Schema (pixijs-declarative-sprite skill v2.1) ───────────────────────────

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

// ── Dragon model ──────────────────────────────────────────────────────────

export const dragonModel: Model = {
  name: 'dragon',
  palette: {
    base: '#2E7D32',
    belly: '#66BB6A',
    accent: '#FF6F00',
    jaw: '#E65100',
    eye: '#ffffff',
    pupil: '#000000',
    shadow: '#1B5E20',
    highlight: '#81C784',
    fire: '#FF3D00',
    fireCore: '#FFEA00',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'tail',
        role: 'wag',
        offset: [-18, 4],
        shapes: [
          { kind: 'ellipse', x: -6, y: 0, rx: 10, ry: 4, fill: 'base' },
          { kind: 'ellipse', x: -14, y: -2, rx: 6, ry: 3, fill: 'base' },
          { kind: 'ellipse', x: -18, y: -5, rx: 3, ry: 2.5, fill: 'accent' },
        ],
      },
      {
        name: 'leftLeg',
        role: 'step',
        offset: [-10, 18],
        shapes: [
          { kind: 'roundedRect', x: -3, y: -2, w: 6, h: 10, r: 3, fill: 'base' },
          { kind: 'roundedRect', x: -3.5, y: 6, w: 7, h: 4, r: 2, fill: 'shadow' },
        ],
      },
      {
        name: 'rightLeg',
        role: 'step',
        offset: [10, 18],
        shapes: [
          { kind: 'roundedRect', x: -3, y: -2, w: 6, h: 10, r: 3, fill: 'base' },
          { kind: 'roundedRect', x: -3.5, y: 6, w: 7, h: 4, r: 2, fill: 'shadow' },
        ],
      },
      {
        name: 'body',
        role: 'idle_breath',
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 18, ry: 14, fill: 'base' },
          { kind: 'ellipse', x: 0, y: 4, rx: 12, ry: 9, fill: 'belly' },
          { kind: 'ellipse', x: 0, y: 12, rx: 14, ry: 3, fill: 'shadow', alpha: 0.3 },
          { kind: 'ellipse', x: -6, y: -6, rx: 5, ry: 3, fill: 'highlight', alpha: 0.25 },
        ],
      },
      {
        name: 'leftWing',
        role: 'flap',
        offset: [-14, -6],
        shapes: [
          { kind: 'polygon', points: [0, 0, -18, -22, -6, -4], fill: 'base' },
          { kind: 'polygon', points: [-2, -2, -14, -18, -5, -4], fill: 'accent', alpha: 0.4 },
        ],
      },
      {
        name: 'rightWing',
        role: 'flap',
        offset: [14, -6],
        shapes: [
          { kind: 'polygon', points: [0, 0, 18, -22, 6, -4], fill: 'base' },
          { kind: 'polygon', points: [2, -2, 14, -18, 5, -4], fill: 'accent', alpha: 0.4 },
        ],
      },
      {
        name: 'headGroup',
        role: 'look',
        offset: [0, -16],
        children: [
          {
            name: 'head',
            shapes: [
              { kind: 'ellipse', x: 0, y: 0, rx: 14, ry: 12, fill: 'base' },
              { kind: 'ellipse', x: -4, y: -6, rx: 5, ry: 4, fill: 'highlight', alpha: 0.3 },
            ],
            children: [
              {
                name: 'leftSpike',
                shapes: [
                  { kind: 'polygon', points: [-10, -10, -16, -22, -4, -12], fill: 'accent' },
                ],
              },
              {
                name: 'rightSpike',
                shapes: [
                  { kind: 'polygon', points: [10, -10, 16, -22, 4, -12], fill: 'accent' },
                ],
              },
              {
                name: 'leftEye',
                role: 'blink',
                shapes: [
                  { kind: 'circle', x: -5, y: -2, r: 3.5, fill: 'eye' },
                  { kind: 'circle', x: -5, y: -2, r: 1.4, fill: 'pupil' },
                ],
              },
              {
                name: 'rightEye',
                role: 'blink',
                shapes: [
                  { kind: 'circle', x: 5, y: -2, r: 3.5, fill: 'eye' },
                  { kind: 'circle', x: 5, y: -2, r: 1.4, fill: 'pupil' },
                ],
              },
            ],
          },
          {
            name: 'upperJaw',
            offset: [0, 2],
            shapes: [
              { kind: 'roundedRect', x: -10, y: -2, w: 20, h: 6, r: 3, fill: 'base' },
              { kind: 'roundedRect', x: -8, y: 0, w: 16, h: 3, r: 1.5, fill: 'belly' },
            ],
          },
          {
            name: 'lowerJaw',
            role: 'chomp',
            offset: [0, 6],
            shapes: [
              { kind: 'roundedRect', x: -9, y: -2, w: 18, h: 5, r: 2.5, fill: 'jaw' },
              { kind: 'roundedRect', x: -7, y: -1, w: 14, h: 2, r: 1, fill: 'belly' },
            ],
          },
        ],
      },
    ],
  },
}
