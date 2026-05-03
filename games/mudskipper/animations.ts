import { Container, Ticker } from 'pixi.js'
import { getMudskipperParts } from './renderer.js'
import { isReducedMotionEnabled } from '../../client/preferences.js'

interface JumpAnim {
  progress: number
  durationMs: number
  elapsed: number
}

const jumpAnims = new Map<Container, JumpAnim>()
let tickerInitialized = false

function initTicker(): void {
  if (tickerInitialized) return
  tickerInitialized = true
  Ticker.shared.add((ticker) => {
    const delta = ticker.deltaMS

    for (const [container, anim] of jumpAnims) {
      anim.elapsed += delta
      const progress = Math.min(anim.elapsed / anim.durationMs, 1)
      anim.progress = progress

      const parts = getMudskipperParts(container)
      if (!parts) {
        jumpAnims.delete(container)
        continue
      }

      // Rotation during jump
      const rotation = Math.sin(progress * Math.PI) * 0.25
      parts.container.rotation = rotation

      // Slight stretch
      const stretch = 1 + Math.sin(progress * Math.PI) * 0.15
      parts.container.scale.y = stretch
      parts.container.scale.x = 1 / Math.sqrt(stretch)

      if (progress >= 1) {
        jumpAnims.delete(container)
        parts.container.rotation = 0
      }
    }
  })
}

export function animateJump(container: Container): void {
  if (isReducedMotionEnabled()) return
  if (jumpAnims.has(container)) return

  jumpAnims.set(container, {
    progress: 0,
    durationMs: 500,
    elapsed: 0,
  })
  initTicker()
}

export function applyIdle(container: Container, t: number, index: number, jumpPhase: string): void {
  const parts = getMudskipperParts(container)
  if (!parts) return

  if (jumpAnims.has(container)) return

  const body = parts.parts.get('body')
  const tail = parts.parts.get('tail')
  const finBack = parts.parts.get('finBack')
  const finFront = parts.parts.get('finFront')
  const eyeLeft = parts.parts.get('eyeLeft')
  const eyeRight = parts.parts.get('eyeRight')

  // Body idle wiggle
  if (body) {
    const wiggle = Math.sin(t * 2.5 + index * 1.3) * 1.5
    body.y = wiggle
  }

  // Tail wag
  if (tail) {
    tail.rotation = Math.sin(t * 4 + index * 0.8) * 0.15
  }

  // Fins paddle
  if (finBack) {
    finBack.rotation = Math.sin(t * 3 + index * 1.1) * 0.2
  }
  if (finFront) {
    finFront.rotation = Math.sin(t * 3.2 + index * 0.9) * 0.25
  }

  // Blink
  if (eyeLeft && eyeRight) {
    // handled by scale in main loop
  }

  // Landing squash
  if (jumpPhase === 'landing') {
    const squash = 1 + Math.sin(t * 12) * 0.1
    if (body) {
      body.scale.y = squash
      body.scale.x = 1 / Math.sqrt(squash)
    }
  } else {
    if (body) {
      body.scale.x = 1
      body.scale.y = 1
    }
  }
}

export function setEyeBlink(container: Container, blinking: boolean): void {
  const parts = getMudskipperParts(container)
  if (!parts) return
  const eyeLeft = parts.parts.get('eyeLeft')
  const eyeRight = parts.parts.get('eyeRight')
  if (eyeLeft) eyeLeft.scale.y = blinking ? 0.15 : 1
  if (eyeRight) eyeRight.scale.y = blinking ? 0.15 : 1
}
