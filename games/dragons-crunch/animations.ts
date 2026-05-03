import { Container, Ticker } from 'pixi.js'
import { getDragonParts } from './renderer.js'
import { isReducedMotionEnabled } from '../../client/preferences.js'

interface ChompAnim {
  openAmount: number // 0 = idle, 1 = fully open
  elapsed: number
  durationMs: number
}

interface FireAnim {
  intensity: number
  elapsed: number
}

const chompAnims = new Map<Container, ChompAnim>()
const fireAnims = new Map<Container, FireAnim>()
let tickerInitialized = false

const IDLE_JAW_OPEN = 3 // px: jaw always slightly dropped

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function initTicker(): void {
  if (tickerInitialized) return
  tickerInitialized = true
  Ticker.shared.add((ticker) => {
    const delta = ticker.deltaMS

    for (const [container, anim] of chompAnims) {
      anim.elapsed += delta
      const progress = Math.min(anim.elapsed / anim.durationMs, 1)
      const eased = easeOutBack(progress)
      anim.openAmount = eased // 0→1 over duration

      const parts = getDragonParts(container)
      if (!parts) {
        chompAnims.delete(container)
        continue
      }

      // Jaw drops dramatically so the mouth gap is huge and visible
      const drop = IDLE_JAW_OPEN + anim.openAmount * 56
      parts.jaw.y = parts.rest.jawY + drop

      // Hinge open: rotate jaw slightly clockwise (positive) about its back hinge
      parts.jaw.rotation = anim.openAmount * 0.18

      // Skull tilts back (negative) to exaggerate the gape
      parts.skull.rotation = -anim.openAmount * 0.10

      if (progress >= 1) {
        chompAnims.delete(container)
      }
    }

    for (const [container, anim] of fireAnims) {
      anim.elapsed += delta
      const parts = getDragonParts(container)
      if (!parts) {
        fireAnims.delete(container)
        continue
      }

      const wobble = Math.sin(anim.elapsed * 0.016) * 0.04 * anim.intensity
      parts.skull.rotation = wobble
      parts.jaw.y = parts.rest.jawY + IDLE_JAW_OPEN + Math.abs(Math.sin(anim.elapsed * 0.022)) * 6 * anim.intensity
      parts.jaw.rotation = Math.sin(anim.elapsed * 0.013) * 0.06 * anim.intensity
    }
  })
}

export function animateChomp(container: Container): void {
  if (isReducedMotionEnabled()) return
  if (chompAnims.has(container)) return // don't re-trigger while animating

  chompAnims.set(container, {
    openAmount: 0,
    elapsed: 0,
    durationMs: 340,
  })
  initTicker()
}

export function animateFireBreathing(container: Container, intensity: number): void {
  if (isReducedMotionEnabled()) return

  fireAnims.set(container, {
    intensity,
    elapsed: 0,
  })
  initTicker()
}

export function stopFireBreathing(container: Container): void {
  fireAnims.delete(container)
  const parts = getDragonParts(container)
  if (!parts) return
  parts.skull.rotation = 0
  parts.jaw.y = parts.rest.jawY + IDLE_JAW_OPEN
  parts.jaw.rotation = 0
}

export function applyIdle(container: Container, t: number, index: number): void {
  const parts = getDragonParts(container)
  if (!parts) return

  // Jaw is always slightly open in idle (so player can always eat)
  parts.jaw.y = parts.rest.jawY + IDLE_JAW_OPEN + Math.sin(t * 2 + index * 1.1) * 1.0

  // Skull breathes subtly
  const breathe = Math.sin(t * 1.8 + index * 0.9) * 0.012
  parts.skull.y = breathe * 2.5

  // Tiny jaw sway in idle
  parts.jaw.rotation = Math.sin(t * 1.4 + index * 0.7) * 0.02
}
