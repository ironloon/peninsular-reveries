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

// ── Plant models ──────────────────────────────────────────────────────────

const STEM_COLORS = ['#4CAF50', '#66BB6A', '#81C784', '#43A047', '#388E3C']
const FLOWER_COLORS = ['#FF7043', '#AB47BC', '#FFEE58', '#EF5350', '#42A5F5', '#FF9800', '#E91E63', '#7C4DFF']

export function getPlantModel(stage: string, colorSeed: number): Model {
  const stemColor = STEM_COLORS[Math.floor(colorSeed * STEM_COLORS.length)]
  const flowerColor = FLOWER_COLORS[Math.floor(colorSeed * FLOWER_COLORS.length)]
  const flowerColor2 = FLOWER_COLORS[(Math.floor(colorSeed * FLOWER_COLORS.length) + 3) % FLOWER_COLORS.length]

  switch (stage) {
    case 'seed':
      return {
        name: 'seed',
        palette: { soil: '#5D4037', sprout: '#A5D6A7' },
        root: {
          name: 'seed',
          children: [
            {
              name: 'seedBody',
              shapes: [
                { kind: 'ellipse', x: 0, y: 0, rx: 3, ry: 2.5, fill: 'soil' },
              ],
            },
          ],
        },
      }

    case 'sprout':
      return {
        name: 'sprout',
        palette: { stem: stemColor, leaf: '#81C784', soil: '#5D4037' },
        root: {
          name: 'sprout',
          children: [
            {
              name: 'stem',
              shapes: [
                { kind: 'rect', x: -1, y: -12, w: 2, h: 12, fill: 'stem' },
              ],
            },
            {
              name: 'leafL',
              offset: [0, -8],
              shapes: [
                { kind: 'ellipse', x: -4, y: 0, rx: 4, ry: 2, fill: 'leaf' },
              ],
            },
            {
              name: 'leafR',
              offset: [0, -10],
              shapes: [
                { kind: 'ellipse', x: 4, y: 0, rx: 4, ry: 2, fill: 'leaf' },
              ],
            },
          ],
        },
      }

    case 'growing':
      return {
        name: 'growing',
        palette: { stem: stemColor, leaf: '#81C784', darkLeaf: '#388E3C' },
        root: {
          name: 'growing',
          children: [
            {
              name: 'stem',
              shapes: [
                { kind: 'rect', x: -1.5, y: -28, w: 3, h: 28, fill: 'stem' },
              ],
            },
            {
              name: 'leaf1L',
              offset: [0, -18],
              shapes: [
                { kind: 'ellipse', x: -6, y: 0, rx: 6, ry: 3, fill: 'leaf' },
              ],
            },
            {
              name: 'leaf1R',
              offset: [0, -12],
              shapes: [
                { kind: 'ellipse', x: 6, y: 0, rx: 6, ry: 3, fill: 'leaf' },
              ],
            },
            {
              name: 'leaf2L',
              offset: [0, -24],
              shapes: [
                { kind: 'ellipse', x: -5, y: -1, rx: 5, ry: 2.5, fill: 'darkLeaf' },
              ],
            },
          ],
        },
      }

    case 'bud':
      return {
        name: 'bud',
        palette: { stem: stemColor, leaf: '#81C784', darkLeaf: '#388E3C', bud: flowerColor },
        root: {
          name: 'bud',
          children: [
            {
              name: 'stem',
              shapes: [
                { kind: 'rect', x: -1.5, y: -40, w: 3, h: 40, fill: 'stem' },
              ],
            },
            {
              name: 'leaf1L',
              offset: [0, -20],
              shapes: [
                { kind: 'ellipse', x: -7, y: 0, rx: 7, ry: 3.5, fill: 'leaf' },
              ],
            },
            {
              name: 'leaf1R',
              offset: [0, -14],
              shapes: [
                { kind: 'ellipse', x: 7, y: 0, rx: 7, ry: 3.5, fill: 'leaf' },
              ],
            },
            {
              name: 'leaf2L',
              offset: [0, -28],
              shapes: [
                { kind: 'ellipse', x: -6, y: -1, rx: 6, ry: 3, fill: 'darkLeaf' },
              ],
            },
            {
              name: 'leaf2R',
              offset: [0, -34],
              shapes: [
                { kind: 'ellipse', x: 6, y: -1, rx: 5, ry: 2.5, fill: 'darkLeaf' },
              ],
            },
            {
              name: 'budHead',
              offset: [0, -42],
              shapes: [
                { kind: 'ellipse', x: 0, y: 0, rx: 5, ry: 7, fill: 'bud' },
                { kind: 'ellipse', x: 0, y: -2, rx: 3, ry: 4, fill: 'leaf', alpha: 0.5 },
              ],
            },
          ],
        },
      }

    case 'bloom':
      return {
        name: 'bloom',
        palette: { stem: stemColor, leaf: '#81C784', darkLeaf: '#388E3C', petal: flowerColor, petal2: flowerColor2, center: '#FFF9C4' },
        root: {
          name: 'bloom',
          children: [
            {
              name: 'stem',
              shapes: [
                { kind: 'rect', x: -1.5, y: -52, w: 3, h: 52, fill: 'stem' },
              ],
            },
            {
              name: 'leaf1L',
              offset: [0, -22],
              shapes: [
                { kind: 'ellipse', x: -8, y: 0, rx: 8, ry: 4, fill: 'leaf' },
              ],
            },
            {
              name: 'leaf1R',
              offset: [0, -16],
              shapes: [
                { kind: 'ellipse', x: 8, y: 0, rx: 8, ry: 4, fill: 'leaf' },
              ],
            },
            {
              name: 'leaf2L',
              offset: [0, -30],
              shapes: [
                { kind: 'ellipse', x: -7, y: -1, rx: 7, ry: 3.5, fill: 'darkLeaf' },
              ],
            },
            {
              name: 'leaf2R',
              offset: [0, -40],
              shapes: [
                { kind: 'ellipse', x: 6, y: -1, rx: 6, ry: 3, fill: 'darkLeaf' },
              ],
            },
            {
              name: 'petal1',
              offset: [0, -56],
              shapes: [
                { kind: 'ellipse', x: 0, y: -10, rx: 5, ry: 10, fill: 'petal' },
              ],
            },
            {
              name: 'petal2',
              offset: [0, -56],
              children: [
                {
                  name: 'p2shape',
                  shapes: [
                    { kind: 'ellipse', x: -8, y: -3, rx: 5, ry: 10, fill: 'petal2' },
                  ],
                },
              ],
            },
            {
              name: 'petal3',
              offset: [0, -56],
              children: [
                {
                  name: 'p3shape',
                  shapes: [
                    { kind: 'ellipse', x: 8, y: -3, rx: 5, ry: 10, fill: 'petal2' },
                  ],
                },
              ],
            },
            {
              name: 'center',
              offset: [0, -56],
              shapes: [
                { kind: 'circle', x: 0, y: -2, r: 5, fill: 'center' },
              ],
            },
          ],
        },
      }

    case 'fruiting':
      return {
        name: 'fruiting',
        palette: { stem: '#6D4C41', leaf: '#8D6E63', darkLeaf: '#795548', fruit: flowerColor, center: '#FFF9C4', seed: '#5D4037' },
        root: {
          name: 'fruiting',
          children: [
            {
              name: 'stem',
              shapes: [
                { kind: 'rect', x: -1.5, y: -46, w: 3, h: 46, fill: 'stem' },
              ],
            },
            {
              name: 'leaf1L',
              offset: [0, -20],
              shapes: [
                { kind: 'ellipse', x: -7, y: 0, rx: 7, ry: 3, fill: 'leaf', alpha: 0.7 },
              ],
            },
            {
              name: 'leaf1R',
              offset: [0, -14],
              shapes: [
                { kind: 'ellipse', x: 7, y: 0, rx: 7, ry: 3, fill: 'leaf', alpha: 0.7 },
              ],
            },
            {
              name: 'fruit1',
              offset: [0, -30],
              shapes: [
                { kind: 'circle', x: -6, y: 0, r: 4, fill: 'fruit' },
                { kind: 'circle', x: -6, y: -1, r: 1.5, fill: 'center', alpha: 0.4 },
              ],
            },
            {
              name: 'fruit2',
              offset: [0, -38],
              shapes: [
                { kind: 'circle', x: 5, y: 0, r: 3.5, fill: 'fruit' },
              ],
            },
            {
              name: 'fruit3',
              offset: [0, -44],
              shapes: [
                { kind: 'circle', x: -4, y: 0, r: 3, fill: 'fruit' },
              ],
            },
            {
              name: 'seedPod',
              offset: [0, -48],
              shapes: [
                { kind: 'ellipse', x: 0, y: 0, rx: 4, ry: 6, fill: 'seed' },
              ],
            },
          ],
        },
      }

    default:
      return getPlantModel('seed', colorSeed)
  }
}