import { Container, Ticker } from 'pixi.js'
import { getDragonParts } from './renderer.js'
import { isReducedMotionEnabled } from '../../client/preferences.js'

interface ChompAnimation {
  openAmount: number
  targetOpen: number
  elapsed: number
  durationMs: number
}

interface FireAnimation {
  intensity: number
  targetIntensity: number
  elapsed: number
}

const chompAnims = new Map<Container, ChompAnimation>()
const fireAnims = new Map<Container, FireAnimation>()
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

    // Chomp tweens (jaw opens wide)
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

      parts.lowerJaw.y = parts.rest.lowerJawY + anim.openAmount * 18
      // Head tilts back slightly on chomp
      parts.head.rotation = -anim.openAmount * 0.08
      // Brow furrows
      parts.brow.y = -anim.openAmount * 2

      if (progress >= 1) {
        chompAnims.delete(container)
        // Snap shut
        parts.lowerJaw.y = parts.rest.lowerJawY
        parts.head.rotation = 0
        parts.brow.y = 0
      }
    }

    // Fire breathing (head shakes slightly, jaw quivers)
    for (const [container, anim] of fireAnims) {
      anim.elapsed += delta
      const parts = getDragonParts(container)
      if (!parts) {
        fireAnims.delete(container)
        continue
      }

      const shake = Math.sin(anim.elapsed * 0.012) * 0.04 * anim.targetIntensity
      parts.head.rotation = shake
      parts.lowerJaw.y = parts.rest.lowerJawY + Math.abs(Math.sin(anim.elapsed * 0.02)) * 3 * anim.targetIntensity
      // Crest wiggle
      parts.crest.rotation = Math.sin(anim.elapsed * 0.015) * 0.08 * anim.targetIntensity
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
    durationMs: 220,
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
  parts.head.rotation = 0
  parts.lowerJaw.y = parts.rest.lowerJawY
  parts.crest.rotation = 0
}

export function animateIdle(container: Container, t: number, index: number): void {
  const parts = getDragonParts(container)
  if (!parts) return

  // Subtle breathing: head bobs slightly
  const breathe = Math.sin(t * 2 + index * 1.2) * 0.02
  parts.head.y = parts.rest.headY + breathe * 3
  parts.upperJaw.y = 14 + breathe * 2
  parts.lowerJaw.y = parts.rest.lowerJawY + breathe * 1.5
  parts.crest.rotation = Math.sin(t * 1.5 + index * 0.8) * 0.04
}

export function animateBlink(container: Container, open: boolean): void {
  const parts = getDragonParts(container)
  if (!parts) return
  const scaleY = open ? 1 : 0.15
  parts.leftEye.scale.y = scaleY
  parts.rightEye.scale.y = scaleY
}
