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

// ── Side-profile direwolf-inspired dragon head ──────────────────────────────
// Lean, slender, right-facing side profile. Jagged monochrome silhouette.
// Eye is a small visible slit (bright tone inside dark head).
// Teeth are jagged polygon edges, not separate colored shapes.
// Jaw drops DOWN to open, revealing dramatic jagged gap.

export const dragonModel: Model = {
  name: 'dragon-head',
  palette: {
    base: '#1a2218',
    maw: '#0a0e08',
    eye: '#b8c75a',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'skull',
        shapes: [
          // Slender upper head: narrow neck → cranium → long flat snout → nose
          { kind: 'polygon', points: [
            -4, 12,
            -8, 8,
            -10, 0,
            -8, -10,
            -2, -16,
            4, -14,
            10, -16,
            16, -12,
            24, -10,
            30, -6,
            38, -2,
            40, 4,
            38, 8,
            32, 10,
            24, 8,
            16, 10,
            8, 11,
            0, 10,
          ], fill: 'base' },
          // Jagged upper gum line (upper teeth visible when jaw drops)
          { kind: 'polygon', points: [
            38, 8, 34, 14, 30, 8, 26, 14, 22, 8, 18, 13, 14, 8, 10, 12, 6, 8, 2, 12, -2, 8, -6, 12, -10, 8, -4, 8,
          ], fill: 'base' },
          // Eye: visible slit inside the head (bright)
          { kind: 'polygon', points: [8, -9, 14, -9, 14, -5, 8, -6], fill: 'eye' },
          // Eyebrow ridge (shadow above eye)
          { kind: 'polygon', points: [6, -12, 16, -12, 14, -8, 6, -8], fill: 'base' },
          // Nostril: subtle notch at nose tip
          { kind: 'polygon', points: [38, -2, 40, 0, 38, 2], fill: 'base', alpha: 0.6 },
          // Spiky spine crest along top (smaller, sharper)
          { kind: 'polygon', points: [
            -4, -16, -6, -21, -2, -17, 0, -22, 4, -17, 6, -20, 10, -16, 12, -20, 16, -15, 18, -19, 22, -14, 24, -17, 28, -13, 30, -16, 28, -10, 32, -8, 30, -6,
          ], fill: 'base' },
        ],
      },
      {
        name: 'jaw',
        role: 'chomp',
        offset: [2, 10],
        shapes: [
          // Lower jaw: thin triangular wedge, sits flush under skull when closed
          { kind: 'polygon', points: [
            -6, -2,
            -4, 4,
            2, 8,
            10, 9,
            18, 7,
            26, 4,
            22, -2,
            16, 0,
            8, -1,
            0, -1,
          ], fill: 'base' },
          // Jaw jagged top edge = lower teeth pointing up
          { kind: 'polygon', points: [
            -6, -2, -4, -8, -2, -2, 0, -9, 2, -2, 4, -10, 6, -2, 8, -9, 10, -2, 12, -8, 14, -2, 16, -9, 18, -2, 20, -7, 22, -2, 24, -6, 24, -2,
          ], fill: 'base' },
          // Tongue: thin dark ellipse inside jaw
          { kind: 'ellipse', x: 6, y: 3, rx: 7, ry: 2, fill: 'maw', alpha: 0.5 },
        ],
      },
    ],
  },
}
