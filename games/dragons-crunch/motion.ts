import type { MotionBody } from './types.js'

// Run motion at 12 FPS — responsive enough, light on the main thread
const FPS = 12
const FRAME_INTERVAL = 1000 / FPS
const THRESHOLD = 22
const CATCH_UP_MS = 300

const CANVAS_W = 40
const CANVAS_H = 30

const BODY_ZONE_COUNT = 5
const ARM_RAISE_THRESHOLD = 45
const BODY_MIN_MOTION = 25

type TrackingState = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  video: HTMLVideoElement
  onBodies: (bodies: MotionBody[]) => void
  rafId: number
  lastFrameTime: number
  prevImageData: ImageData | null
  running: boolean
  useVFC: boolean
  bodyStates: Map<number, { armsUp: boolean; framesUp: number; lastMotion: number }>
}

interface VideoFrameCallback {
  requestVideoFrameCallback(callback: () => void): number
  cancelVideoFrameCallback(handle: number): void
}

let state: TrackingState | null = null

function processFrame(): void {
  if (!state || !state.running) return

  const now = performance.now()
  const elapsed = now - state.lastFrameTime

  if (elapsed > CATCH_UP_MS) {
    state.lastFrameTime = now
    state.prevImageData = null
    scheduleNext()
    return
  }

  if (elapsed < FRAME_INTERVAL) {
    scheduleNext()
    return
  }
  state.lastFrameTime = now

  const { canvas, ctx, video, onBodies } = state
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  if (!state.prevImageData) {
    state.prevImageData = imageData
    scheduleNext()
    return
  }

  const bodies = detectBodies(state.prevImageData, imageData, canvas.width, canvas.height)
  state.prevImageData = imageData

  onBodies(bodies)
  scheduleNext()
}

function detectBodies(
  prev: ImageData,
  curr: ImageData,
  width: number,
  height: number,
): MotionBody[] {
  const prevData = prev.data
  const currData = curr.data

  // Compute per-zone metrics
  const zoneWidth = width / BODY_ZONE_COUNT
  const zoneMetrics = new Array(BODY_ZONE_COUNT).fill(0).map(() => ({
    topMotion: 0,
    bottomMotion: 0,
    totalMotion: 0,
    centroidSum: 0,
    centroidCount: 0,
  }))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const pgray = prevData[i] * 0.299 + prevData[i + 1] * 0.587 + prevData[i + 2] * 0.114
      const cgray = currData[i] * 0.299 + currData[i + 1] * 0.587 + currData[i + 2] * 0.114
      const diff = Math.abs(cgray - pgray)

      if (diff > THRESHOLD) {
        const zone = Math.min(Math.floor(x / zoneWidth), BODY_ZONE_COUNT - 1)
        const metric = zoneMetrics[zone]
        metric.totalMotion += diff
        metric.centroidSum += x
        metric.centroidCount++
        if (y < height * 0.45) {
          metric.topMotion += diff
        } else {
          metric.bottomMotion += diff
        }
      }
    }
  }

  const bodies: MotionBody[] = []
  for (let z = 0; z < BODY_ZONE_COUNT; z++) {
    const m = zoneMetrics[z]
    if (m.totalMotion < BODY_MIN_MOTION) continue

    const normalizedX = (z + 0.5) / BODY_ZONE_COUNT
    const armsUp = m.topMotion > ARM_RAISE_THRESHOLD && m.topMotion > m.bottomMotion * 0.6

    bodies.push({
      id: z,
      normalizedX,
      active: true,
      armsUp,
    })
  }

  return bodies
}

function scheduleNext(): void {
  if (!state) return
  if (state.useVFC) {
    state.rafId = (state.video as HTMLVideoElement & VideoFrameCallback).requestVideoFrameCallback?.(processFrame) ?? requestAnimationFrame(processFrame)
  } else {
    state.rafId = requestAnimationFrame(processFrame)
  }
}

export function startMotionTracking(
  video: HTMLVideoElement,
  onBodies: (bodies: MotionBody[]) => void,
): void {
  if (state) {
    stopMotionTracking()
  }

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  const useVFC = typeof (video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback === 'function'

  state = {
    canvas,
    ctx,
    video,
    onBodies,
    rafId: 0,
    lastFrameTime: 0,
    prevImageData: null,
    running: true,
    useVFC,
    bodyStates: new Map(),
  }

  if (useVFC) {
    state.rafId = (state.video as HTMLVideoElement & VideoFrameCallback).requestVideoFrameCallback(processFrame)
  } else {
    state.rafId = requestAnimationFrame(processFrame)
  }
}

export function stopMotionTracking(): void {
  if (!state) return
  state.running = false
  if (state.useVFC && typeof (state.video as HTMLVideoElement & VideoFrameCallback).cancelVideoFrameCallback === 'function') {
    (state.video as HTMLVideoElement & VideoFrameCallback).cancelVideoFrameCallback(state.rafId)
  } else {
    cancelAnimationFrame(state.rafId)
  }
  state = null
}
