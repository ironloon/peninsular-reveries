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

// ── Dragon head only ──────────────────────────────────────────────────────
// Big menacing head that covers the player's head in AR.
// Silhouette-driven: long snout, heavy brow, back-curving horns,
// spiky crest, glowing slit eyes, full mouth of teeth.
// Jaw opens for chomp, jaw snaps shut.

export const dragonModel: Model = {
  name: 'dragon-head',
  palette: {
    base: '#1e2e1e',
    belly: '#3a4a32',
    accent: '#121a12',
    eye: '#ff4422',
    pupil: '#0a0000',
    tooth: '#d8d0c0',
    shadow: '#0c140c',
    highlight: '#4a5a3e',
  },
  root: {
    name: 'root',
    children: [
      // ── Crest spikes (back of head) ──
      {
        name: 'crest',
        offset: [0, -18],
        shapes: [
          { kind: 'polygon', points: [-8, 0, -14, -10, -6, -2], fill: 'accent' },
          { kind: 'polygon', points: [-2, -2, -6, -14, 2, -2], fill: 'accent' },
          { kind: 'polygon', points: [6, -2, 2, -14, 10, -2], fill: 'accent' },
          { kind: 'polygon', points: [12, 0, 8, -10, 16, 0], fill: 'accent' },
        ],
      },
      // ── Horns (back-curving) ──
      {
        name: 'leftHorn',
        offset: [-14, -14],
        shapes: [
          { kind: 'polygon', points: [0, 0, -16, -14, -6, 4], fill: 'accent' },
          { kind: 'polygon', points: [-2, -2, -10, -8, -4, 2], fill: 'shadow', alpha: 0.3 },
        ],
      },
      {
        name: 'rightHorn',
        offset: [14, -14],
        shapes: [
          { kind: 'polygon', points: [0, 0, 16, -14, 6, 4], fill: 'accent' },
          { kind: 'polygon', points: [2, -2, 10, -8, 4, 2], fill: 'shadow', alpha: 0.3 },
        ],
      },
      // ── Main head shape ──
      {
        name: 'head',
        shapes: [
          // Big triangular skull with flat top, pointy cheeks, long taper to snout
          { kind: 'polygon', points: [-16, -12, 16, -12, 20, 4, 14, 18, -14, 18, -20, 4], fill: 'base' },
          // Cheek scales (subtle)
          { kind: 'ellipse', x: -10, y: 6, rx: 4, ry: 2.5, fill: 'shadow', alpha: 0.25 },
          { kind: 'ellipse', x: 10, y: 6, rx: 4, ry: 2.5, fill: 'shadow', alpha: 0.25 },
          { kind: 'ellipse', x: -6, y: 10, rx: 3, ry: 1.8, fill: 'shadow', alpha: 0.2 },
          { kind: 'ellipse', x: 6, y: 10, rx: 3, ry: 1.8, fill: 'shadow', alpha: 0.2 },
        ],
        children: [
          // Heavy brow ridge (covers top of eyes, adds menace)
          {
            name: 'brow',
            offset: [0, -4],
            shapes: [
              { kind: 'polygon', points: [-14, -2, -6, -6, 6, -6, 14, -2, 12, 2, -12, 2], fill: 'accent' },
            ],
          },
          // Angry slit eyes
          {
            name: 'leftEye',
            role: 'blink',
            offset: [-8, 2],
            shapes: [
              { kind: 'polygon', points: [-5, -1, 1, -1, 1, 3, -5, 3], fill: 'eye' },
              { kind: 'rect', x: -3, y: 0.5, w: 3, h: 1.2, fill: 'pupil' },
            ],
          },
          {
            name: 'rightEye',
            role: 'blink',
            offset: [8, 2],
            shapes: [
              { kind: 'polygon', points: [-1, -1, 5, -1, 5, 3, -1, 3], fill: 'eye' },
              { kind: 'rect', x: -0.5, y: 0.5, w: 3, h: 1.2, fill: 'pupil' },
            ],
          },
          // Nostril slits (on snout bridge)
          {
            name: 'nostrils',
            offset: [0, 8],
            shapes: [
              { kind: 'ellipse', x: -3, y: 0, rx: 1.2, ry: 0.6, fill: 'shadow', alpha: 0.5 },
              { kind: 'ellipse', x: 3, y: 0, rx: 1.2, ry: 0.6, fill: 'shadow', alpha: 0.5 },
            ],
          },
        ],
      },
      // ── Upper jaw / snout (lots of teeth, chomp area) ──
      {
        name: 'upperJaw',
        offset: [0, 14],
        shapes: [
          { kind: 'polygon', points: [-14, -4, 14, -4, 18, 8, 0, 14, -18, 8], fill: 'base' },
          // Upper teeth (many small sharp ones)
          { kind: 'polygon', points: [-12, 4, -11, 10, -10, 4], fill: 'tooth' },
          { kind: 'polygon', points: [-8, 5, -7, 11, -6, 5], fill: 'tooth' },
          { kind: 'polygon', points: [-4, 5, -3, 11, -2, 5], fill: 'tooth' },
          { kind: 'polygon', points: [0, 5, 1, 11, 2, 5], fill: 'tooth' },
          { kind: 'polygon', points: [4, 5, 5, 11, 6, 5], fill: 'tooth' },
          { kind: 'polygon', points: [8, 5, 9, 11, 10, 5], fill: 'tooth' },
          { kind: 'polygon', points: [12, 4, 13, 10, 14, 4], fill: 'tooth' },
          // Inner mouth (darker)
          { kind: 'polygon', points: [-10, -2, 10, -2, 12, 4, -12, 4], fill: 'shadow', alpha: 0.5 },
        ],
      },
      // ── Lower jaw (opens wide for chomp) ──
      {
        name: 'lowerJaw',
        role: 'chomp',
        offset: [0, 22],
        shapes: [
          { kind: 'polygon', points: [-12, -2, 12, -2, 8, 8, -8, 8], fill: 'accent' },
          // Lower teeth pointing up
          { kind: 'polygon', points: [-9, -2, -8, -8, -7, -2], fill: 'tooth' },
          { kind: 'polygon', points: [-4, -2, -3, -9, -2, -2], fill: 'tooth' },
          { kind: 'polygon', points: [0, -2, 1, -9, 2, -2], fill: 'tooth' },
          { kind: 'polygon', points: [4, -2, 5, -9, 6, -2], fill: 'tooth' },
          { kind: 'polygon', points: [9, -2, 10, -8, 11, -2], fill: 'tooth' },
          // Tongue
          { kind: 'ellipse', x: 0, y: 3, rx: 5, ry: 2, fill: 'belly', alpha: 0.5 },
        ],
      },
    ],
  },
}
