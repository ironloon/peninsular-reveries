import { Pose } from './types.js'

interface VideoFrameCallback {
  requestVideoFrameCallback(callback: () => void): number
  cancelVideoFrameCallback(handle: number): void
}

// Run motion at 10 FPS — responsive enough, light on the main thread
const FPS = 10
const FRAME_INTERVAL = 1000 / FPS
const THRESHOLD = 20
const CATCH_UP_MS = 250 // if tab throttles, reset prev frame to avoid stale diffs

const CANVAS_W = 32
const CANVAS_H = 24

type TrackingState = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  video: HTMLVideoElement
  onPose: (pose: Pose) => void
  rafId: number
  lastFrameTime: number
  prevImageData: ImageData | null
  pendingPose: Pose
  pendingSince: number
  lastEmittedPose: Pose
  running: boolean
  useVFC: boolean
}

let state: TrackingState | null = null

export function computeMotionMetrics(
  prev: ImageData,
  curr: ImageData,
  width: number,
  height: number,
): {
  centroidX: number
  centroidY: number
  spreadX: number
  spreadY: number
  motionScore: number
} {
  const prevData = prev.data
  const currData = curr.data
  const pixelCount = width * height
  let diffCount = 0
  let sumX = 0
  let sumY = 0
  let minX = width
  let maxX = 0
  let minY = height
  let maxY = 0

  // Simple single loop — 32×24 = only 768 pixels, no need to chunk
  for (let i = 0; i < pixelCount; i++) {
    const pi = i * 4
    const pgray = prevData[pi] * 0.299 + prevData[pi + 1] * 0.587 + prevData[pi + 2] * 0.114
    const cgray = currData[pi] * 0.299 + currData[pi + 1] * 0.587 + currData[pi + 2] * 0.114

    const diff = Math.abs(cgray - pgray)
    if (diff > THRESHOLD) {
      diffCount++
      const x = i % width
      const y = Math.floor(i / width)
      sumX += x
      sumY += y
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  const motionScore = diffCount
  const centroidX = diffCount > 0 ? sumX / diffCount / width : 0
  const centroidY = diffCount > 0 ? sumY / diffCount / height : 0
  const spreadX = diffCount > 0 ? (maxX - minX) / width : 0
  const spreadY = diffCount > 0 ? (maxY - minY) / height : 0

  return { centroidX, centroidY, spreadX, spreadY, motionScore }
}

export function resolvePose(
  centroidX: number,
  centroidY: number,
  spreadX: number,
  spreadY: number,
  motionScore: number,
): Pose {
  // Camera video is CSS-mirrored for the user, but raw pixel data is not.
  // Flip centroidX so "user's left" on the mirrored screen maps to left-paw-up.
  const x = 1 - centroidX

  if (motionScore < 20) return 'idle'
  if (centroidY < 0.40 && spreadX > 0.25 && motionScore > 60) return 'both-paws-up'
  if (x < 0.30 && centroidY < 0.55 && motionScore > 30) return 'left-paw-up'
  if (x > 0.70 && centroidY < 0.55 && motionScore > 30) return 'right-paw-up'
  if (centroidY > 0.60 && motionScore > 20) return 'crouch'
  if (motionScore > 100 && spreadY > 0.35) return 'jump'
  // Side-to-side leaning: body shifts left/right without arms going high
  if (x < 0.35 && motionScore > 25 && centroidY >= 0.40) return 'lean-left'
  if (x > 0.65 && motionScore > 25 && centroidY >= 0.40) return 'lean-right'
  return 'idle'
}

function processFrame(): void {
  if (!state || !state.running) return

  const now = performance.now()
  const elapsed = now - state.lastFrameTime

  // Catch-up guard: if tab was throttled, discard stale prev frame
  if (elapsed > CATCH_UP_MS) {
    state.lastFrameTime = now
    state.prevImageData = null
    state.pendingPose = 'idle'
    state.pendingSince = now
    scheduleNext()
    return
  }

  if (elapsed < FRAME_INTERVAL) {
    scheduleNext()
    return
  }
  state.lastFrameTime = now

  const { canvas, ctx, video, onPose } = state
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  if (!state.prevImageData) {
    state.prevImageData = imageData
    scheduleNext()
    return
  }

  const startProcess = performance.now()

  const { centroidX, centroidY, spreadX, spreadY, motionScore } = computeMotionMetrics(
    state.prevImageData,
    imageData,
    canvas.width,
    canvas.height,
  )

  state.prevImageData = imageData

  const pose = resolvePose(centroidX, centroidY, spreadX, spreadY, motionScore)

  if (pose === state.pendingPose) {
    if (pose !== state.lastEmittedPose) {
      state.lastEmittedPose = pose
      onPose(pose)
    }
  } else {
    state.pendingPose = pose
    state.pendingSince = now
  }

  // Budget guard: if processing took too long, drop the next frame
  const processTime = performance.now() - startProcess
  if (processTime > 12) {
    state.lastFrameTime = now + FRAME_INTERVAL
  }

  scheduleNext()
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
  onPose: (pose: Pose) => void,
): void {
  if (state) {
    stopMotionTracking()
  }

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  const now = performance.now()

  const useVFC = typeof (video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback === 'function'

  state = {
    canvas,
    ctx,
    video,
    onPose,
    rafId: 0,
    lastFrameTime: 0,
    prevImageData: null,
    pendingPose: 'idle',
    pendingSince: now,
    lastEmittedPose: 'idle',
    running: true,
    useVFC,
  }

  if (useVFC) {
    state.rafId = (video as HTMLVideoElement & VideoFrameCallback).requestVideoFrameCallback(processFrame)
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
