import { Container, Ticker } from 'pixi.js'
import type { Pose } from './types.js'
import { getCatParts, getPoseTargets, updateCatPose } from './renderer.js'
import { isReducedMotionEnabled } from '../../client/preferences.js'

// ── Pose animation state ───────────────────────────────────────────────────────

interface PoseAnimation {
  startValues: ReturnType<typeof readCurrentValues>
  targets: ReturnType<typeof getPoseTargets>
  durationMs: number
  elapsed: number
}

interface JoinAnimation {
  fromX: number
  toX: number
  durationMs: number
  elapsed: number
}

const poseAnimations = new Map<Container, PoseAnimation>()
const joinAnimations = new Map<Container, JoinAnimation>()
let tickerInitialized = false

function readCurrentValues(parts: NonNullable<ReturnType<typeof getCatParts>>) {
  return {
    bodyY: parts.body.y,
    bodyScaleY: parts.body.scale.y,
    headY: parts.head.y,
    tailRotation: parts.tail.rotation,
    leftFrontPawY: parts.leftFrontPaw.y,
    rightFrontPawY: parts.rightFrontPaw.y,
    leftBackPawY: parts.leftBackPaw.y,
    rightBackPawY: parts.rightBackPaw.y,
    leftFrontPawRotation: parts.leftFrontPaw.rotation,
    rightFrontPawRotation: parts.rightFrontPaw.rotation,
  }
}

function applyInterpolatedPose(
  parts: NonNullable<ReturnType<typeof getCatParts>>,
  start: ReturnType<typeof readCurrentValues>,
  target: ReturnType<typeof getPoseTargets>,
  t: number,
): void {
  const lerp = (a: number, b: number, p: number): number => a + (b - a) * p

  parts.body.y = lerp(start.bodyY, target.bodyY, t)
  parts.body.scale.y = lerp(start.bodyScaleY, target.bodyScaleY, t)
  parts.head.y = lerp(start.headY, target.headY, t)
  parts.tail.rotation = lerp(start.tailRotation, target.tailRotation, t)
  parts.leftFrontPaw.y = lerp(start.leftFrontPawY, target.leftFrontPawY, t)
  parts.rightFrontPaw.y = lerp(start.rightFrontPawY, target.rightFrontPawY, t)
  parts.leftBackPaw.y = lerp(start.leftBackPawY, target.leftBackPawY, t)
  parts.rightBackPaw.y = lerp(start.rightBackPawY, target.rightBackPawY, t)
  parts.leftFrontPaw.rotation = lerp(start.leftFrontPawRotation, target.leftFrontPawRotation, t)
  parts.rightFrontPaw.rotation = lerp(start.rightFrontPawRotation, target.rightFrontPawRotation, t)

  // Legs follow paws
  parts.leftFrontLeg.y = 8 + parts.leftFrontPaw.y
  parts.rightFrontLeg.y = 8 + parts.rightFrontPaw.y
  parts.leftBackLeg.y = 8 + parts.leftBackPaw.y
  parts.rightBackLeg.y = 8 + parts.rightBackPaw.y
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function initTicker(): void {
  if (tickerInitialized) return
  tickerInitialized = true
  Ticker.shared.add((ticker) => {
    const delta = ticker.deltaMS

    // Pose tweens
    for (const [cat, anim] of poseAnimations) {
      anim.elapsed += delta
      const progress = Math.min(anim.elapsed / anim.durationMs, 1)
      const eased = easeOutQuad(progress)

      const parts = getCatParts(cat)
      if (!parts) {
        poseAnimations.delete(cat)
        continue
      }

      applyInterpolatedPose(parts, anim.startValues, anim.targets, eased)

      if (progress >= 1) {
        poseAnimations.delete(cat)
      }
    }

    // Join slide-ins
    for (const [cat, anim] of joinAnimations) {
      anim.elapsed += delta
      const progress = Math.min(anim.elapsed / anim.durationMs, 1)
      const eased = easeOutQuad(progress)
      cat.x = anim.fromX + (anim.toX - anim.fromX) * eased

      if (progress >= 1) {
        joinAnimations.delete(cat)
      }
    }
  })
}

// ── Public exports ────────────────────────────────────────────────────────────

export function animatePose(cat: Container, targetPose: Pose, durationMs: number): void {
  if (isReducedMotionEnabled()) {
    updateCatPose(cat, targetPose, true)
    return
  }

  const parts = getCatParts(cat)
  if (!parts) return

  const targets = getPoseTargets(targetPose)
  const startValues = readCurrentValues(parts)

  poseAnimations.set(cat, {
    startValues,
    targets,
    durationMs,
    elapsed: 0,
  })
  initTicker()
}

export function animateCatJoin(cat: Container, fromX: number, toX: number): void {
  if (isReducedMotionEnabled()) {
    cat.x = toX
    return
  }

  cat.x = fromX
  joinAnimations.set(cat, {
    fromX,
    toX,
    durationMs: 400,
    elapsed: 0,
  })
  initTicker()
}
