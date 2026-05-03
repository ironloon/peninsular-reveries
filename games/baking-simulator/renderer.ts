import { Application, Container, Graphics } from 'pixi.js'
import type { GameState, IngredientDef } from './types.js'
import { colorLerp, lerp, clamp, rand, easeOutBack } from './util.js'

// ── Color Palette ──
export const C = {
  bg: 0x2c1810, wood: 0x8B5E3C, woodDark: 0x6B3F1F, woodLight: 0xA67C52,
  flour: 0xFAF0E6, dough: 0xF5D6A8, doughSmooth: 0xFADB9A,
  breadPale: 0xF5DEB3, breadGolden: 0xD4A540, breadBrown: 0x8B5A2B, breadBurnt: 0x3E1F0D,
  ovenRed: 0xCC3300, ovenGlow: 0xFF6600,
  yeastGreen: 0x9ACD32, water: 0x6BB3D9, salt: 0xF0F0F0, sugar: 0xFFF8DC,
  butter: 0xFFD700, cream: 0xFFFDD0,
  uiBg: 0x3C1E0A, uiText: 0xFFD89E, uiAccent: 0xE8874A, uiGold: 0xFFD700,
  green: 0x4CAF50, red: 0xE53935, white: 0xFFFFFF,
}

export const INGREDIENT_DEFS: IngredientDef[] = [
  { id: 'flour', label: 'Flour', color: C.flour, emoji: '🌾' },
  { id: 'water', label: 'Water', color: C.water, emoji: '💧' },
  { id: 'yeast', label: 'Yeast', color: C.yeastGreen, emoji: '🧫' },
  { id: 'salt', label: 'Salt', color: C.salt, emoji: '🧂' },
  { id: 'sugar', label: 'Sugar', color: C.sugar, emoji: '🍬' },
  { id: 'butter', label: 'Butter', color: C.butter, emoji: '🧈' },
]

export const STATION_GAP = 1400
export const STATIONS_X: Record<string, number> = {
  ingredients: 0,
  kneading: STATION_GAP,
  shaping: STATION_GAP * 2,
  proofing: STATION_GAP * 3,
  baking: STATION_GAP * 4,
  result: STATION_GAP * 4.5,
}

// ── PixiJS v8 initialization ──
export async function initStage(container: HTMLElement): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    try {
      const app = new Application()
      await app.init({ preference, backgroundAlpha: 0, autoDensity: true, resizeTo: container })
      container.appendChild(app.canvas)
      return app
    } catch { continue }
  }
  return null
}

// ── Camera ──
export class Camera {
  x = 0; y = 0; zoom = 1
  tx = 0; ty = 0; tz = 1
  shakeX = 0; shakeY = 0; shakeAmt = 0

  moveTo(x: number, y: number, z = 1) { this.tx = x; this.ty = y; this.tz = z }
  shake(amt: number) { this.shakeAmt = amt }

  update(world: Container, screenW: number, screenH: number) {
    const spd = 0.045
    this.x += (this.tx - this.x) * spd; this.y += (this.ty - this.y) * spd; this.zoom += (this.tz - this.zoom) * spd
    if (this.shakeAmt > 0.2) {
      this.shakeX = (Math.random() - 0.5) * this.shakeAmt; this.shakeY = (Math.random() - 0.5) * this.shakeAmt
      this.shakeAmt *= 0.88
    } else { this.shakeX = 0; this.shakeY = 0; this.shakeAmt = 0 }
    world.position.set(screenW / 2 - this.x * this.zoom + this.shakeX, screenH / 2 - this.y * this.zoom + this.shakeY)
    world.scale.set(this.zoom)
  }
}

// ── Drawing helpers ──
export function drawTable(g: Graphics, x: number, y: number, w = 600, h = 20) {
  g.roundRect(x - w / 2, y, w, h, 4).fill({ color: C.wood })
  g.roundRect(x - w / 2, y + h, w, 8, 4).fill({ color: C.woodDark })
  for (let i = 0; i < 6; i++) g.rect(x - w / 2 + 20 + i * (w - 40) / 5, y + 3, w / 7, 2).fill({ color: C.woodDark, alpha: 0.2 })
  g.rect(x - w / 2 + 20, y + h + 8, 14, 50).fill({ color: C.woodDark })
  g.rect(x + w / 2 - 34, y + h + 8, 14, 50).fill({ color: C.woodDark })
}

export function drawBread(g: Graphics, shape: string | null, breadColor: number, yOff = 0) {
  if (shape === 'baguette') {
    g.roundRect(-90, yOff - 15, 180, 28, 14).fill({ color: breadColor })
    g.roundRect(-85, yOff - 13, 170, 8, 4).fill({ color: colorLerp(breadColor, C.breadBrown, 0.12), alpha: 0.25 })
    for (let i = 0; i < 5; i++) {
      const lx = -55 + i * 28
      g.moveTo(lx, yOff - 12).lineTo(lx + 8, yOff + 8).stroke({ color: colorLerp(breadColor, C.breadBrown, 0.2), width: 1.5, alpha: 0.35 })
    }
  } else if (shape === 'roll') {
    for (let i = 0; i < 3; i++) {
      const rx = -45 + i * 45
      g.ellipse(rx, yOff, 22, 16).fill({ color: breadColor })
      g.ellipse(rx, yOff - 5, 14, 8).fill({ color: colorLerp(breadColor, C.breadBrown, 0.1), alpha: 0.15 })
    }
  } else {
    g.ellipse(0, yOff, 58, 40).fill({ color: breadColor })
    g.ellipse(0, yOff - 8, 40, 22).fill({ color: colorLerp(breadColor, C.breadBrown, 0.08), alpha: 0.15 })
  }
}

export function getBakeColor(bakeColor: number): number {
  if (bakeColor < 0.25) return colorLerp(C.doughSmooth, C.breadPale, bakeColor / 0.25)
  if (bakeColor < 0.55) return colorLerp(C.breadPale, C.breadGolden, (bakeColor - 0.25) / 0.3)
  if (bakeColor < 0.8) return colorLerp(C.breadGolden, C.breadBrown, (bakeColor - 0.55) / 0.25)
  return colorLerp(C.breadBrown, C.breadBurnt, (bakeColor - 0.8) / 0.2)
}

// ── Kitchen background (drawn once) ──
export function drawKitchenBG(g: Graphics) {
  g.rect(STATIONS_X.ingredients - 400, 80, STATION_GAP * 5 + 800, 600).fill({ color: 0x3A2415 })
  for (let s = 0; s < 5; s++) {
    for (let i = 0; i < 10; i++) {
      const tx = STATIONS_X.ingredients + s * STATION_GAP - 300 + i * 100
      g.rect(tx, 80, 96, 96).fill({ color: (i + s) % 2 === 0 ? 0x3E2818 : 0x35200F })
    }
  }
  g.rect(STATIONS_X.ingredients - 400, -500, STATION_GAP * 5 + 800, 580).fill({ color: 0x4A3222 })
  for (let s = 0; s < 5; s++) {
    const sx = STATIONS_X.ingredients + s * STATION_GAP
    g.rect(sx - 280, -320, 560, 14).fill({ color: C.wood })
    g.rect(sx - 280, -320, 560, 14).stroke({ color: C.woodDark, width: 2 })
    for (let j = 0; j < 4; j++) {
      const jx = sx - 200 + j * 140
      g.roundRect(jx, -358, 28, 38, 5).fill({ color: 0x887766 })
      g.roundRect(jx + 4, -364, 20, 8, 3).fill({ color: 0xAA9988 })
    }
  }
}

// ── Per-station renderers ──
export function renderIngredients(g: Graphics, state: GameState) {
  g.clear()
  drawTable(g, 0, 0, 700, 24)
  g.ellipse(0, -10, 85, 42).fill({ color: 0x888888, alpha: 0.3 })
  g.ellipse(0, -10, 85, 42).stroke({ color: 0xAAAAAA, width: 3 })
  g.ellipse(0, -30, 88, 12).stroke({ color: 0xBBBBBB, width: 2 })
  if (state.bowlFill > 0) {
    const fh = 38 * state.bowlFill
    g.ellipse(0, -10 + (38 - fh) * 0.3, 78 * state.bowlFill, fh * 0.45).fill({ color: C.dough, alpha: 0.85 })
  }
}

export function renderKneading(g: Graphics, state: GameState, globalTime: number) {
  g.clear()
  drawTable(g, 0, 0, 700, 24)
  for (let i = 0; i < 10; i++) g.circle(rand(-220, 220), rand(-6, 6), rand(2, 4)).fill({ color: C.flour, alpha: rand(0.06, 0.15) })

  const p = state.kneadProgress
  const squish = state.doughSquish
  const wobble = Math.sin(globalTime * 8) * 3 * (1 - p)
  const rx = 95 + squish * 18 + wobble
  const ry = 55 - squish * 12 - wobble * 0.5
  const doughColor = colorLerp(C.dough, C.doughSmooth, p)

  g.ellipse(0, 2, rx + 5, 8).fill({ color: 0x000000, alpha: 0.12 })
  g.ellipse(0, -ry * 0.5, rx, ry).fill({ color: doughColor })
  g.ellipse(-rx * 0.2, -ry * 0.7, rx * 0.5, ry * 0.4).fill({ color: 0xFFFFFF, alpha: 0.05 })
  if (p < 0.6) {
    for (let i = 0; i < Math.floor((1 - p) * 10); i++) {
      const a = rand(0, Math.PI * 2), d = rand(0.3, 0.85)
      g.circle(Math.cos(a) * rx * d, -ry * 0.5 + Math.sin(a) * ry * d, rand(4, 9)).fill({ color: colorLerp(doughColor, C.wood, 0.25 * (1 - p)), alpha: 0.25 })
    }
  }
  if (p > 0.25) {
    const lines = Math.floor(p * 5)
    for (let i = 0; i < lines; i++) {
      const lx = -rx * 0.5 + i * (rx / lines)
      g.moveTo(lx, -ry + 3).lineTo(lx + 8, -2).stroke({ color: colorLerp(doughColor, C.woodLight, 0.12), width: 1.5, alpha: 0.2 })
    }
  }
  if (p > 0.7) g.ellipse(-rx * 0.15, -ry * 0.65, rx * 0.35, ry * 0.25).fill({ color: 0xFFFFFF, alpha: (p - 0.7) * 0.15 })
}

export function renderShaping(g: Graphics, state: GameState) {
  g.clear()
  drawTable(g, 0, 0, 700, 24)
  for (let i = 0; i < 8; i++) g.circle(rand(-200, 200), rand(-6, 6), rand(2, 4)).fill({ color: C.flour, alpha: rand(0.06, 0.15) })

  const p = state.shapeProgress
  const sp = easeOutBack(clamp(p, 0, 1))
  if (!state.chosenShape) {
    g.ellipse(0, -25, 75, 45).fill({ color: C.doughSmooth })
  } else if (state.chosenShape === 'round') {
    g.ellipse(0, -25, lerp(75, 65, sp), lerp(45, 50, sp)).fill({ color: C.doughSmooth })
  } else if (state.chosenShape === 'baguette') {
    const rx = lerp(75, 150, sp), ry = lerp(45, 26, sp)
    g.roundRect(-rx, -25 - ry, rx * 2, ry * 2, ry).fill({ color: C.doughSmooth })
  } else if (state.chosenShape === 'roll') {
    for (let i = 0; i < 3; i++) {
      g.ellipse(-50 + i * 50, -22, lerp(45, 23, sp), lerp(35, 20, sp)).fill({ color: C.doughSmooth })
    }
  }
}

export function renderProofing(g: Graphics, state: GameState) {
  g.clear()
  drawTable(g, 0, 0, 600, 24)
  g.roundRect(-100, -18, 200, 8, 4).fill({ color: 0xDDCCBB })
  if (state.proofTemp > 0.4) g.ellipse(0, -30, 140, 70).fill({ color: C.ovenGlow, alpha: (state.proofTemp - 0.4) * 0.12 })

  const rise = state.proofRise
  const over = state.proofOverproofed
  const doughColor = over ? colorLerp(C.doughSmooth, C.breadPale, 0.2) : C.doughSmooth

  if (state.chosenShape === 'baguette') {
    const rx = 130 + rise * 25 * (over ? 1.3 : 1)
    const ry = 24 + rise * 15 * (over ? 0.7 : 1)
    g.roundRect(-rx, -10 - ry, rx * 2, ry * 2, ry).fill({ color: doughColor })
  } else if (state.chosenShape === 'roll') {
    for (let i = 0; i < 3; i++) {
      g.ellipse(-45 + i * 45, -10 - (20 + rise * 10) * (over ? 0.7 : 1), (25 + rise * 10) * (over ? 1.3 : 1), (20 + rise * 10) * (over ? 0.7 : 1)).fill({ color: doughColor })
    }
  } else {
    const rx = (55 + rise * 18) * (over ? 1.35 : 1)
    const ry = (42 + rise * 18) * (over ? 0.65 : 1)
    g.ellipse(0, -10 - ry, rx, ry).fill({ color: doughColor })
  }
}

export function renderBaking(g: Graphics, state: GameState) {
  g.clear()
  drawTable(g, 0, 0, 600, 24)
  g.roundRect(-140, -240, 280, 220, 10).fill({ color: 0x444444 })
  g.roundRect(-140, -240, 280, 220, 10).stroke({ color: 0x666666, width: 3 })
  const winGlow = colorLerp(0x222222, C.ovenGlow, state.ovenHeat)
  g.roundRect(-100, -220, 200, 110, 8).fill({ color: winGlow, alpha: 0.35 + state.ovenHeat * 0.45 })
  g.roundRect(-100, -220, 200, 110, 8).stroke({ color: 0x555555, width: 2 })
  g.moveTo(-90, -120).lineTo(90, -120).stroke({ color: 0x666666, width: 2 })
  for (let i = 0; i < 3; i++) {
    g.circle(-70 + i * 70, -225, 7).fill({ color: 0x222222 })
    g.circle(-70 + i * 70, -225, 7).stroke({ color: 0x444444, width: 1.5 })
  }
  if (state.ovenHeat > 0.1) g.ellipse(0, -140, 100 * state.ovenHeat, 15 * state.ovenHeat).fill({ color: 0xFF4400, alpha: state.ovenHeat * 0.25 })
  g.roundRect(-30, -25, 60, 6, 3).fill({ color: 0x888888 })

  if (!state.bakePulled) {
    const breadColor = getBakeColor(state.bakeColor)
    const by = -150
    if (state.chosenShape === 'baguette') {
      g.roundRect(-60, by, 120, 22, 11).fill({ color: breadColor })
    } else if (state.chosenShape === 'roll') {
      for (let i = 0; i < 3; i++) g.ellipse(-30 + i * 30, by, 16, 12).fill({ color: breadColor })
    } else {
      g.ellipse(0, by, 45, 30).fill({ color: breadColor })
    }
  } else {
    const breadColor = getBakeColor(state.bakeColor)
    drawBread(g, state.chosenShape, breadColor, -50)
  }
}