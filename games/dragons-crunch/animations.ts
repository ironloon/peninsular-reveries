import { Container, Ticker } from 'pixi.js'
import { getDragonParts } from './renderer.js'
import { isReducedMotionEnabled } from '../../client/preferences.js'

interface ChompAnim {
  openAmount: number
  targetOpen: number
  elapsed: number
  durationMs: number
}

interface FireAnim {
  intensity: number
  targetIntensity: number
  elapsed: number
}

const chompAnims = new Map<Container, ChompAnim>()
const fireAnims = new Map<Container, FireAnim>()
let tickerInitialized = false

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

    // Chomp: jaw drops DRAMATICALLY open
    for (const [container, anim] of chompAnims) {
      anim.elapsed += delta
      const progress = Math.min(anim.elapsed / anim.durationMs, 1)
      const eased = easeOutBack(progress)
      anim.openAmount = anim.targetOpen * eased

      const parts = getDragonParts(container)
      if (!parts) {
        chompAnims.delete(container)
        continue
      }

      // Jaw drops way down for dramatic bite
      parts.jaw.y = parts.rest.jawY + anim.openAmount * 28
      // Skull tilts back as mouth opens wide
      parts.skull.rotation = -anim.openAmount * 0.12

      if (progress >= 1) {
        chompAnims.delete(container)
        // Snap shut
        parts.jaw.y = parts.rest.jawY
        parts.skull.rotation = 0
      }
    }

    // Fire breathing: jaw quivers, skull shakes
    for (const [container, anim] of fireAnims) {
      anim.elapsed += delta
      const parts = getDragonParts(container)
      if (!parts) {
        fireAnims.delete(container)
        continue
      }

      const shake = Math.sin(anim.elapsed * 0.014) * 0.05 * anim.targetIntensity
      parts.skull.rotation = shake
      parts.jaw.y = parts.rest.jawY + Math.abs(Math.sin(anim.elapsed * 0.025)) * 5 * anim.targetIntensity
    }
  })
}

export function animateChomp(container: Container): void {
  if (isReducedMotionEnabled()) return

  const parts = getDragonParts(container)
  if (!parts) return

  chompAnims.set(container, {
    openAmount: 0,
    targetOpen: 1,
    elapsed: 0,
    durationMs: 260,
  })
  initTicker()
}

export function animateFireBreathing(container: Container, intensity: number): void {
  if (isReducedMotionEnabled()) return

  const parts = getDragonParts(container)
  if (!parts) return

  fireAnims.set(container, {
    intensity: 0,
    targetIntensity: intensity,
    elapsed: 0,
  })
  initTicker()
}

export function stopFireBreathing(container: Container): void {
  fireAnims.delete(container)
  const parts = getDragonParts(container)
  if (!parts) return
  parts.skull.rotation = 0
  parts.jaw.y = parts.rest.jawY
}

export function animateIdle(container: Container, t: number, index: number): void {
  const parts = getDragonParts(container)
  if (!parts) return

  // Subtle breathing: skull bobs slightly
  const breathe = Math.sin(t * 2.2 + index * 1.3) * 0.015
  parts.skull.y = breathe * 3
  parts.jaw.y = parts.rest.jawY + breathe * 2
}

export function animateBlink(container: Container, open: boolean): void {
  const parts = getDragonParts(container)
  if (!parts) return
  const scaleY = open ? 1 : 0.12
  parts.eye.scale.y = scaleY
}
