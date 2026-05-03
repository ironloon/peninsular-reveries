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

// ── Side-profile direwolf-inspired dragon head ───────────────────────────────
// Jagged silhouette, right-facing, very few parts, limited palette.
// Inspired by Game of Thrones Stark direwolf sigil: angular, spiky fur,
// long snout, sharp fangs, glowing red eye. The jaw opens DRAMATICALLY.

export const dragonModel: Model = {
  name: 'dragon-head',
  palette: {
    base: '#1a2a1a',
    eye: '#ff3300',
    tooth: '#e0d8c8',
    maw: '#0a0a0a',
    shadow: '#0c140c',
  },
  root: {
    name: 'root',
    children: [
      // ── Skull / upper head ──
      // Large jagged-silhouette shape: spiky crest along top, long tapering snout,
      // sharp cheek, throat tapers back.
      {
        name: 'skull',
        shapes: [
          // Back of neck - rises sharply then crest spikes
          { kind: 'polygon', points: [-10, 12, -14, 4, -18, -2, -14, -10, -16, -18, -8, -16, -6, -22, 0, -18, 4, -24, 8, -18, 12, -20, 14, -14, 18, -12, 20, -6, 22, 0, 24, 6, 22, 10, 18, 12, 14, 10, 10, 14, 6, 12, 2, 14, -2, 12, -6, 14], fill: 'base' },
          // Dark maw (inside mouth area, behind upper teeth)
          { kind: 'polygon', points: [6, -2, 18, -2, 16, 6, 14, 8, 10, 6, 8, 4], fill: 'maw', alpha: 0.7 },
          // Upper teeth (in front)
          { kind: 'polygon', points: [10, 0, 11, 6, 12, 0], fill: 'tooth' },
          { kind: 'polygon', points: [14, -1, 15, 8, 16, -1], fill: 'tooth' },
          { kind: 'polygon', points: [18, 0, 19, 5, 20, 0], fill: 'tooth' },
          { kind: 'polygon', points: [8, 2, 9, 5, 10, 2], fill: 'tooth' },
          { kind: 'polygon', points: [12, 1, 13, 7, 14, 1], fill: 'tooth' },
        ],
        children: [
          // Eye: small red slit visible from side, buried under heavy brow
          {
            name: 'eye',
            role: 'blink',
            offset: [2, -8],
            shapes: [
              { kind: 'polygon', points: [-3, -1, 2, -1, 2, 2, -3, 1], fill: 'eye' },
              { kind: 'rect', x: -1, y: 0, w: 2, h: 0.8, fill: 'shadow' },
            ],
          },
        ],
      },
      // ── Lower jaw ──
      // Big powerful jaw that drops wide. Lots of lower teeth.
      {
        name: 'jaw',
        role: 'chomp',
        offset: [4, 10],
        shapes: [
          // Jaw body
          { kind: 'polygon', points: [-6, -4, 10, -4, 16, 0, 14, 6, 10, 10, 4, 8, 0, 10, -4, 6, -8, 0], fill: 'base' },
          // Lower teeth pointing UP (in front)
          { kind: 'polygon', points: [0, -4, 1, -10, 2, -4], fill: 'tooth' },
          { kind: 'polygon', points: [4, -4, 5, -11, 6, -4], fill: 'tooth' },
          { kind: 'polygon', points: [8, -4, 9, -9, 10, -4], fill: 'tooth' },
          { kind: 'polygon', points: [12, -3, 13, -7, 14, -3], fill: 'tooth' },
          // Tongue (visible when open)
          { kind: 'ellipse', x: 2, y: 2, rx: 5, ry: 2, fill: 'maw', alpha: 0.5 },
        ],
      },
    ],
  },
}
