import { Container, Ticker } from 'pixi.js'
import { getDragonParts } from './renderer.js'
import { isReducedMotionEnabled } from '../../client/preferences.js'

interface ChompAnimation {
  openAmount: number
  targetOpen: number
  wingFlap: number
  elapsed: number
  durationMs: number
}

interface FireAnimation {
  intensity: number
  targetIntensity: number
  wingFlap: number
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

    // Chomp tweens
    for (const [container, anim] of chompAnims) {
      anim.elapsed += delta
      const progress = Math.min(anim.elapsed / anim.durationMs, 1)
      const eased = easeOutBack(progress)
      anim.openAmount = anim.targetOpen * eased
      anim.wingFlap = Math.sin(progress * Math.PI * 3) * 0.4 * anim.targetOpen

      const parts = getDragonParts(container)
      if (!parts) {
        chompAnims.delete(container)
        continue
      }

      parts.lowerJaw.y = parts.rest.lowerJawY + anim.openAmount * 10
      parts.leftWing.rotation = parts.rest.leftWingRotation - anim.wingFlap
      parts.rightWing.rotation = parts.rest.rightWingRotation + anim.wingFlap

      if (progress >= 1) {
        chompAnims.delete(container)
        // Reset to closed
        parts.lowerJaw.y = parts.rest.lowerJawY
        parts.leftWing.rotation = parts.rest.leftWingRotation
        parts.rightWing.rotation = parts.rest.rightWingRotation
      }
    }

    // Fire breathing tweens
    for (const [container, anim] of fireAnims) {
      anim.elapsed += delta
      const parts = getDragonParts(container)
      if (!parts) {
        fireAnims.delete(container)
        continue
      }

      // Rapid wing flap during fire breathing
      const flapSpeed = 0.012
      anim.wingFlap = Math.sin(anim.elapsed * flapSpeed) * 0.5 * anim.targetIntensity
      parts.leftWing.rotation = parts.rest.leftWingRotation - anim.wingFlap
      parts.rightWing.rotation = parts.rest.rightWingRotation + anim.wingFlap

      // Slight body rock
      parts.body.rotation = Math.sin(anim.elapsed * 0.008) * 0.03 * anim.targetIntensity

      // Head tilt back slightly
      parts.head.rotation = -0.15 * anim.targetIntensity * (0.5 + 0.5 * Math.sin(anim.elapsed * 0.006))
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
    wingFlap: 0,
    elapsed: 0,
    durationMs: 280,
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
    wingFlap: 0,
    elapsed: 0,
  })
  initTicker()
}

export function stopFireBreathing(container: Container): void {
  fireAnims.delete(container)
  const parts = getDragonParts(container)
  if (!parts) return
  parts.leftWing.rotation = parts.rest.leftWingRotation
  parts.rightWing.rotation = parts.rest.rightWingRotation
  parts.body.rotation = 0
  parts.head.rotation = 0
}

export function animateIdle(container: Container, t: number, index: number): void {
  const parts = getDragonParts(container)
  if (!parts) return

  const breathe = 1 + Math.sin(t * 3 + index * 1.2) * 0.025
  const tailSway = Math.sin(t * 2.5 + index * 0.8) * 0.12

  parts.body.scale.y = breathe
  parts.tail.rotation = parts.rest.tailRotation + tailSway
}

export function animateBlink(container: Container, open: boolean): void {
  const parts = getDragonParts(container)
  if (!parts) return
  const scaleY = open ? 1 : 0.1
  parts.leftEye.scale.y = scaleY
  parts.rightEye.scale.y = scaleY
}
