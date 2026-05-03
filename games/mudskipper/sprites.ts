import { Container, Graphics } from 'pixi.js'

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

export const mudskipperModel: Model = {
  name: 'mudskipper',
  palette: {
    base: '#5d4037',
    belly: '#8d6e63',
    accent: '#a1887f',
    eye: '#ffffff',
    pupil: '#000000',
    shadow: '#3e2723',
    highlight: '#d7ccc8',
    fin: '#6d4c41',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'body',
        role: 'idle_breath',
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 18, ry: 10, fill: 'base' },
          { kind: 'ellipse', x: 2, y: 2, rx: 12, ry: 6, fill: 'belly', alpha: 0.5 },
          { kind: 'ellipse', x: -8, y: -3, rx: 4, ry: 3, fill: 'highlight', alpha: 0.3 },
        ],
      },
      {
        name: 'tail',
        role: 'wag',
        offset: [-18, 2],
        shapes: [
          { kind: 'polygon', points: [0, 0, -10, -6, -14, 0, -10, 6], fill: 'base' },
          { kind: 'polygon', points: [-6, -2, -12, -4, -10, 0], fill: 'shadow', alpha: 0.3 },
        ],
      },
      {
        name: 'head',
        role: 'look',
        offset: [14, -4],
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 10, ry: 8, fill: 'base' },
          { kind: 'ellipse', x: 1, y: 2, rx: 6, ry: 4, fill: 'belly', alpha: 0.4 },
        ],
      },
      {
        name: 'eyeLeft',
        role: 'blink',
        offset: [14, -12],
        shapes: [
          { kind: 'circle', x: 0, y: 0, r: 5, fill: 'eye' },
          { kind: 'circle', x: 1, y: 0, r: 2.5, fill: 'pupil' },
          { kind: 'circle', x: 2, y: -1, r: 1, fill: 'highlight', alpha: 0.6 },
        ],
      },
      {
        name: 'eyeRight',
        role: 'blink',
        offset: [18, -10],
        shapes: [
          { kind: 'circle', x: 0, y: 0, r: 4, fill: 'eye' },
          { kind: 'circle', x: 1, y: 0, r: 2, fill: 'pupil' },
          { kind: 'circle', x: 2, y: -1, r: 0.8, fill: 'highlight', alpha: 0.6 },
        ],
      },
      {
        name: 'finBack',
        offset: [-4, 6],
        shapes: [
          { kind: 'polygon', points: [0, 0, -4, 8, 4, 8], fill: 'fin' },
          { kind: 'ellipse', x: 0, y: 4, rx: 3, ry: 4, fill: 'shadow', alpha: 0.2 },
        ],
      },
      {
        name: 'finFront',
        offset: [6, 6],
        shapes: [
          { kind: 'polygon', points: [0, 0, -3, 7, 5, 7], fill: 'fin' },
          { kind: 'ellipse', x: 1, y: 4, rx: 2.5, ry: 3.5, fill: 'shadow', alpha: 0.2 },
        ],
      },
      {
        name: 'mouth',
        offset: [22, 2],
        shapes: [
          { kind: 'ellipse', x: 0, y: 0, rx: 3, ry: 1.5, fill: 'shadow', alpha: 0.5 },
        ],
      },
    ],
  },
}

export function getMudskipperColor(index: number): number {
  const colors = [
    0x5d4037, // brown
    0x4e342e, // dark brown
    0x6d4c41, // warm brown
    0x795548, // medium brown
    0x8d6e63, // lighter brown
    0x3e2723, // deep brown
  ]
  return colors[index % colors.length]
}
