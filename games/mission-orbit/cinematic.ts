/**
 * Animated cinematic renderer for Mission: Orbit.
 *
 * Each scene has emoji "actors" that move, scale, and fade within the
 * cinematic pane, driven by the game-loop tick (≈60 fps).  Everything
 * is CSS-transformed DOM — no canvas, no images, no external assets.
 */

import type { MissionState, CinematicType } from './types.js'
import { isReducedMotion } from './animations.js'

// ── helpers ──────────────────────────────────────────────────────────

/** Lerp between a and b over 0..1 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}

/** Ping-pong a value between 0..1 over `periodMs` */
function pingPong(elapsedMs: number, periodMs: number): number {
  const phase = (elapsedMs % periodMs) / periodMs
  return phase < 0.5 ? phase * 2 : 2 - phase * 2
}

function rotationForMotion(deltaX: number, deltaY: number, fallback: number = -45): number {
  if (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001) {
    return fallback
  }

  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI + 45
  return angle > 180 ? angle - 360 : angle
}

// ── element pool ─────────────────────────────────────────────────────

const pool: HTMLSpanElement[] = []
let activeCount = 0

function resetPool(): void {
  activeCount = 0
}

function getSpan(pane: HTMLElement): HTMLSpanElement {
  if (activeCount < pool.length) {
    const el = pool[activeCount]
    el.style.display = ''
    activeCount++
    return el
  }
  const el = document.createElement('span')
  el.style.position = 'absolute'
  el.style.pointerEvents = 'none'
  el.style.lineHeight = '1'
  el.setAttribute('aria-hidden', 'true')
  pane.appendChild(el)
  pool.push(el)
  activeCount++
  return el
}

function hideUnused(): void {
  for (let i = activeCount; i < pool.length; i++) {
    pool[i].style.display = 'none'
  }
}

// ── sprite helper ────────────────────────────────────────────────────

interface Sprite {
  emoji: string
  x: number       // % from left
  y: number       // % from top
  size: number    // rem
  opacity?: number
  rotate?: number  // deg
}

function placeSprite(pane: HTMLElement, s: Sprite): void {
  const el = getSpan(pane)
  el.textContent = s.emoji
  el.style.fontSize = `${s.size}rem`
  el.style.left = `${s.x}%`
  el.style.top = `${s.y}%`
  el.style.opacity = String(s.opacity ?? 1)
  el.style.transform = `translate(-50%, -50%)${s.rotate !== undefined ? ` rotate(${s.rotate}deg)` : ''}`
}

// ── per-scene cinematics ─────────────────────────────────────────────

function renderLaunchPad(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()
  const isInteraction = state.scenePhase === 'interaction'
  const progress = isInteraction ? Math.min(state.tapCount / state.tapTarget, 1) : 0

  // Rocket: shakes during tapping, lifts off as taps accumulate
  const shake = isInteraction && !reduced ? Math.sin(t * 0.05) * 2 * progress : 0
  const liftoff = isInteraction ? progress * 40 : 0
  placeSprite(pane, { emoji: '🚀', x: 50 + shake, y: 70 - liftoff, size: 4, rotate: -45 })

  // Ground
  placeSprite(pane, { emoji: '🏗️', x: 50, y: 88, size: 2 })

  // Flame trail when tapping
  if (isInteraction && progress > 0.1) {
    const flicker = reduced ? 1 : 0.6 + pingPong(t, 200) * 0.4
    placeSprite(pane, { emoji: '🔥', x: 50, y: 80 - liftoff * 0.5, size: 2.5 * progress, opacity: flicker })
  }
}

function renderAscent(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()
  const isInteraction = state.scenePhase === 'interaction'

  // Rocket rises slowly during briefing/cinematic, accelerates during hold
  const baseY = isInteraction
    ? lerp(55, 20, state.holdProgress)
    : reduced ? 55 : lerp(60, 55, Math.min(t / 3000, 1))

  placeSprite(pane, { emoji: '🚀', x: 50, y: baseY, size: 3.5, rotate: -45 })

  // Flame
  if (isInteraction && state.holdActive) {
    const flicker = reduced ? 1 : 0.7 + pingPong(t, 150) * 0.3
    placeSprite(pane, { emoji: '🔥', x: 50, y: baseY + 12, size: 2, opacity: flicker })
  }

  // Clouds passing downward
  if (!reduced) {
    const cloudY = ((t * 0.03) % 120) - 10
    placeSprite(pane, { emoji: '☁️', x: 20, y: cloudY, size: 2.5, opacity: 0.3 })
    const cloud2Y = ((t * 0.025 + 60) % 120) - 10
    placeSprite(pane, { emoji: '☁️', x: 75, y: cloud2Y, size: 2, opacity: 0.25 })
  }
}

function renderOrbitInsertion(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()

  // Earth below
  placeSprite(pane, { emoji: '🌍', x: 50, y: 85, size: 6 })

  // Rocket orbiting: circular path
  const angle = reduced ? -0.35 : (t * 0.001) % (Math.PI * 2)
  const rx = 25
  const ry = 15
  const rocketX = 50 + Math.cos(angle) * rx
  const rocketY = 45 + Math.sin(angle) * ry
  const velocityX = -Math.sin(angle) * rx
  const velocityY = Math.cos(angle) * ry
  placeSprite(pane, {
    emoji: '🚀',
    x: rocketX,
    y: rocketY,
    size: 2,
    rotate: rotationForMotion(velocityX, velocityY, 15),
  })
}

function renderTransLunar(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()
  const isInteraction = state.scenePhase === 'interaction'
  const progress = isInteraction ? state.holdProgress : 0
  const travelT = isInteraction
    ? 0.28 + progress * 0.72
    : reduced ? 0.28 : Math.min(t / 5000, 0.28)
  const pathStartX = 34
  const pathEndX = 70
  const pathStartY = 58
  const pathEndY = 44
  const headingX = pathEndX - pathStartX
  const headingY = pathEndY - pathStartY
  const headingLength = Math.hypot(headingX, headingY) || 1

  // Earth shrinking on left
  const earthSize = lerp(3.2, 1.4, travelT)
  placeSprite(pane, { emoji: '🌍', x: lerp(24, 10, travelT), y: 54, size: earthSize })

  // Moon growing on right so the destination reads clearly even from far away.
  const moonSize = lerp(2.6, 4.2, travelT)
  placeSprite(pane, { emoji: '🌕', x: lerp(82, 76, travelT), y: 38, size: moonSize })

  // Rocket traveling right
  const rocketX = lerp(pathStartX, pathEndX, travelT)
  const waver = reduced ? 0 : Math.sin(t * 0.003) * 1.4
  const rocketY = lerp(pathStartY, pathEndY, travelT) + waver
  placeSprite(pane, {
    emoji: '🚀',
    x: rocketX,
    y: rocketY,
    size: 2,
    rotate: rotationForMotion(headingX, headingY, 24),
  })

  // Flame during hold
  if (isInteraction && state.holdActive) {
    const flicker = reduced ? 1 : 0.7 + pingPong(t, 180) * 0.3
    placeSprite(pane, {
      emoji: '🔥',
      x: rocketX - (headingX / headingLength) * 7,
      y: rocketY - (headingY / headingLength) * 7,
      size: 1.5,
      opacity: flicker,
    })
  }
}

function renderLunarApproach(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()

  // Moon growing into view and reading as the clear destination.
  const growT = reduced ? 0.55 : Math.min(t / 5000, 1)
  const moonSize = lerp(4.2, 7, growT)
  placeSprite(pane, { emoji: '🌕', x: 58, y: 50, size: moonSize })
  placeSprite(pane, { emoji: '🌍', x: 13, y: 16, size: 1.4, opacity: 0.55 })

  // Rocket approaching
  const pathStartX = 16
  const pathEndX = 42
  const pathStartY = 31
  const pathEndY = 45
  const rocketX = reduced ? 35 : lerp(pathStartX, pathEndX, growT)
  const rocketY = reduced ? 38 : lerp(pathStartY, pathEndY, growT)
  placeSprite(pane, {
    emoji: '🚀',
    x: rocketX,
    y: rocketY,
    size: 2,
    rotate: rotationForMotion(pathEndX - pathStartX, pathEndY - pathStartY, 24),
  })
}

function renderLunarFlyby(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()

  // Big Moon
  placeSprite(pane, { emoji: '🌕', x: 50, y: 55, size: 8 })

  // Rocket orbiting the moon
  const angle = reduced ? -0.75 : -0.75 + (t * 0.0006) % (Math.PI * 2)
  const rx = 38
  const ry = 30
  const rocketX = 50 + Math.cos(angle) * rx
  const rocketY = 50 + Math.sin(angle) * ry
  const velocityX = -Math.sin(angle) * rx
  const velocityY = Math.cos(angle) * ry
  placeSprite(pane, {
    emoji: '🚀',
    x: rocketX,
    y: rocketY,
    size: 1.5,
    rotate: rotationForMotion(velocityX, velocityY, -15),
  })

  // Earth small in distance
  placeSprite(pane, { emoji: '🌍', x: 85, y: 15, size: 1.5, opacity: 0.7 })
}

function renderReturn(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()

  // Earth growing
  const growT = reduced ? 0.55 : Math.min(t / 5000, 1)
  const earthSize = lerp(2.4, 5.4, growT)
  placeSprite(pane, { emoji: '🌍', x: 58, y: 56, size: earthSize })

  // Moon shrinking behind
  const moonSize = lerp(3, 1.2, growT)
  placeSprite(pane, { emoji: '🌕', x: 15, y: 20, size: moonSize, opacity: lerp(0.85, 0.45, growT) })

  // Rocket heading toward Earth
  const pathStartX = 18
  const pathEndX = 46
  const pathStartY = 34
  const pathEndY = 47
  const rocketX = reduced ? 38 : lerp(pathStartX, pathEndX, growT)
  const rocketY = reduced ? 43 : lerp(pathStartY, pathEndY, growT)
  placeSprite(pane, {
    emoji: '🚀',
    x: rocketX,
    y: rocketY,
    size: 2,
    rotate: rotationForMotion(pathEndX - pathStartX, pathEndY - pathStartY, 18),
  })
}

function renderReentry(pane: HTMLElement, state: MissionState): void {
  const t = state.elapsedMs
  const reduced = isReducedMotion()
  const isInteraction = state.scenePhase === 'interaction'
  const progress = isInteraction ? state.holdProgress : 0

  // Capsule descending
  const capsuleY = lerp(20, 70, progress)
  const sway = reduced ? 0 : Math.sin(t * 0.004) * 3
  placeSprite(pane, { emoji: '🛸', x: 50 + sway, y: capsuleY, size: 2.5 })

  // Heat glow during descent
  if (progress > 0 && progress < 0.7) {
    const glowOpacity = reduced ? 0.5 : 0.3 + pingPong(t, 300) * 0.4
    placeSprite(pane, { emoji: '🟠', x: 50 + sway, y: capsuleY - 5, size: 1.5, opacity: glowOpacity })
  }

  // Parachute appears late
  if (progress > 0.6) {
    placeSprite(pane, { emoji: '🪂', x: 50 + sway, y: capsuleY - 12, size: 2, opacity: lerp(0, 1, (progress - 0.6) / 0.4) })
  }

  // Ocean at bottom
  placeSprite(pane, { emoji: '🌊', x: 30, y: 92, size: 2.5, opacity: 0.7 })
  placeSprite(pane, { emoji: '🌊', x: 55, y: 95, size: 2, opacity: 0.6 })
  placeSprite(pane, { emoji: '🌊', x: 78, y: 91, size: 2.5, opacity: 0.7 })
}

// ── scene router ─────────────────────────────────────────────────────

const SCENE_RENDERERS: Record<CinematicType, (pane: HTMLElement, state: MissionState) => void> = {
  'launch-pad': renderLaunchPad,
  'ascent': renderAscent,
  'orbit-insertion': renderOrbitInsertion,
  'trans-lunar-injection': renderTransLunar,
  'lunar-approach': renderLunarApproach,
  'lunar-flyby': renderLunarFlyby,
  'return': renderReturn,
  'reentry-splashdown': renderReentry,
}

/** Call once per frame from the game loop. */
export function renderCinematic(state: MissionState, pane: HTMLElement): void {
  const scene = SCENE_RENDERERS[pane.dataset.cinematic as CinematicType]
  if (!scene) return
  resetPool()
  scene(pane, state)
  hideUnused()
}
