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
// Lean, large, long snout, jagged silhouette. Right-facing side profile.
// Monochrome: one dark color for silhouette. Mouth interior = maw.
// Teeth are jagged edges of the POLYGON itself, not separate colored shapes.
// Jaw drops DOWN to open, revealing jagged gap.

export const dragonModel: Model = {
  name: 'dragon-head',
  palette: {
    base: '#1a2218',
    maw: '#0a0e08',
  },
  root: {
    name: 'root',
    children: [
      {
        name: 'skull',
        shapes: [
          // Upper head: long spiky silhouette, flat/angled bottom hiding closed jaw
          // Back of neck → crest spikes → flat skull → snout → nose → under-jaw → throat
          { kind: 'polygon', points: [
            -10, 14,
            -16, 10,
            -18, 2,
            -20, -6,
            -16, -14,
            -10, -20,
            -4, -18,
            2, -22,
            8, -18,
            16, -20,
            22, -14,
            28, -10,
            34, -4,
            36, 2,
            34, 8,
            28, 12,
            22, 10,
            14, 12,
            6, 14,
            -2, 13,
          ], fill: 'base' },
          // Jagged upper gum line (upper teeth visible when jaw drops)
          // These stick down into the mouth gap
          { kind: 'polygon', points: [
            34, 8, 30, 13, 26, 8, 22, 14, 18, 8, 14, 13, 10, 8, 6, 12, 2, 8, -2, 13, -6, 8, -10, 14,
          ], fill: 'base' },
          // Eye: tiny dark slit within the head silhouette
          { kind: 'polygon', points: [8, -10, 14, -10, 14, -6, 8, -7], fill: 'base', alpha: 0.7 },
          // Nostril: subtle notch at nose tip
          { kind: 'polygon', points: [34, -4, 36, -2, 34, 0], fill: 'base', alpha: 0.6 },
          // Spiky spine crest along top
          { kind: 'polygon', points: [
            -10, -20, -12, -26, -8, -22, -6, -28, -2, -22, 0, -26, 4, -22, 6, -26, 10, -22, 12, -25, 16, -22, 18, -25, 22, -20, 24, -23, 28, -18, 30, -20, 28, -14, 34, -10, 28, -10,
          ], fill: 'base' },
        ],
      },
      {
        name: 'jaw',
        role: 'chomp',
        offset: [2, 14],
        shapes: [
          // Lower jaw: thick triangular wedge, sits flush under skull when closed
          { kind: 'polygon', points: [
            -10, -2,
            -8, 6,
            -2, 12,
            6, 14,
            14, 12,
            22, 8,
            28, 4,
            24, -2,
            18, 0,
            10, -2,
            2, -2,
          ], fill: 'base' },
          // Jaw jagged top edge = lower teeth pointing up
          { kind: 'polygon', points: [
            -10, -2, -8, -8, -6, -2, -4, -9, -2, -2, 0, -8, 2, -2, 4, -10, 6, -2, 8, -9, 10, -2, 12, -8, 14, -2, 16, -9, 18, -2, 20, -7, 22, -2, 24, -6, 24, -2,
          ], fill: 'base' },
          // Dark tongue inside jaw
          { kind: 'ellipse', x: 4, y: 4, rx: 8, ry: 3, fill: 'maw', alpha: 0.5 },
        ],
      },
    ],
  },
}
