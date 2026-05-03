import type { MotionBody } from './types.js'

// Run motion at 15 FPS — responsive enough, light on the main thread
const FPS = 15
const FRAME_INTERVAL = 1000 / FPS
const THRESHOLD = 20
const CATCH_UP_MS = 250

const CANVAS_W = 48
const CANVAS_H = 36

const ARM_RAISE_THRESHOLD = 25
const MIN_BLOB_SIZE = 8
const MERGE_DISTANCE = 6

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
}

interface VideoFrameCallback {
  requestVideoFrameCallback(callback: () => void): number
  cancelVideoFrameCallback(handle: number): void
}

let state: TrackingState | null = null

interface Blob {
  pixels: Array<{ x: number; y: number }>
  topMotion: number
  bottomMotion: number
}

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

  // Build difference mask
  const mask = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const pi = i * 4
    const pgray = prevData[pi] * 0.299 + prevData[pi + 1] * 0.587 + prevData[pi + 2] * 0.114
    const cgray = currData[pi] * 0.299 + currData[pi + 1] * 0.587 + currData[pi + 2] * 0.114
    if (Math.abs(cgray - pgray) > THRESHOLD) {
      mask[i] = 1
    }
  }

  // Find connected blobs using flood-fill-like approach on scanlines
  const visited = new Uint8Array(width * height)
  const blobs: Blob[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!mask[idx] || visited[idx]) continue

      const pixels: Array<{ x: number; y: number }> = []
      const stack = [idx]
      visited[idx] = 1
      let topMotion = 0
      let bottomMotion = 0

      while (stack.length > 0) {
        const ci = stack.pop()!
        const cx = ci % width
        const cy = Math.floor(ci / width)
        pixels.push({ x: cx, y: cy })

        if (cy < height * 0.45) {
          topMotion += 1
        } else {
          bottomMotion += 1
        }

        // Check 4-neighbors
        if (cx > 0 && !visited[ci - 1] && mask[ci - 1]) { visited[ci - 1] = 1; stack.push(ci - 1) }
        if (cx < width - 1 && !visited[ci + 1] && mask[ci + 1]) { visited[ci + 1] = 1; stack.push(ci + 1) }
        if (cy > 0 && !visited[ci - width] && mask[ci - width]) { visited[ci - width] = 1; stack.push(ci - width) }
        if (cy < height - 1 && !visited[ci + width] && mask[ci + width]) { visited[ci + width] = 1; stack.push(ci + width) }
      }

      if (pixels.length >= MIN_BLOB_SIZE) {
        blobs.push({ pixels, topMotion, bottomMotion })
      }
    }
  }

  if (blobs.length === 0) return []

  // Merge nearby blobs
  const merged = mergeBlobs(blobs, MERGE_DISTANCE)

  const bodies: MotionBody[] = []
  for (let i = 0; i < merged.length; i++) {
    const b = merged[i]
    const { minX, maxX, minY, maxY, sumX, sumY } = b.pixels.reduce((acc, p) => ({
      minX: Math.min(acc.minX, p.x),
      maxX: Math.max(acc.maxX, p.x),
      minY: Math.min(acc.minY, p.y),
      maxY: Math.max(acc.maxY, p.y),
      sumX: acc.sumX + p.x,
      sumY: acc.sumY + p.y,
    }), { minX: width, maxX: 0, minY: height, maxY: 0, sumX: 0, sumY: 0 })

    const pixelCount = b.pixels.length
    const centroidX = sumX / pixelCount
    const centroidY = sumY / pixelCount
    const spreadX = (maxX - minX) / width
    const spreadY = (maxY - minY) / height

    // Mirror X because camera preview is CSS-mirrored for user
    const mirroredX = 1 - centroidX / width

    // Arms up: top half has more motion than bottom, and there is enough top motion
    const armsUp = b.topMotion > ARM_RAISE_THRESHOLD && b.topMotion > b.bottomMotion * 0.5

    bodies.push({
      id: i,
      normalizedX: mirroredX,
      normalizedY: centroidY / height,
      spreadX,
      spreadY,
      pixelCount,
      active: true,
      armsUp,
    })
  }

  return bodies
}

function mergeBlobs(blobs: Blob[], mergeDist: number): Blob[] {
  if (blobs.length <= 1) return blobs

  const parents = new Array(blobs.length).fill(0).map((_, i) => i)

  function find(i: number): number {
    if (parents[i] !== i) parents[i] = find(parents[i])
    return parents[i]
  }

  function union(a: number, b: number): void {
    const pa = find(a)
    const pb = find(b)
    if (pa !== pb) parents[pa] = pb
  }

  // Compute bounding boxes for quick distance check
  const bboxes = blobs.map((b) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const p of b.pixels) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
    return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
  })

  for (let i = 0; i < blobs.length; i++) {
    for (let j = i + 1; j < blobs.length; j++) {
      const bi = bboxes[i]
      const bj = bboxes[j]
      const dx = bi.cx - bj.cx
      const dy = bi.cy - bj.cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < mergeDist) {
        union(i, j)
      }
    }
  }

  // Group by parent
  const groups = new Map<number, Blob[]>()
  for (let i = 0; i < blobs.length; i++) {
    const p = find(i)
    if (!groups.has(p)) groups.set(p, [])
    groups.get(p)!.push(blobs[i])
  }

  return Array.from(groups.values()).map((group) => {
    const allPixels: Array<{ x: number; y: number }> = []
    let topMotion = 0
    let bottomMotion = 0
    for (const b of group) {
      allPixels.push(...b.pixels)
      topMotion += b.topMotion
      bottomMotion += b.bottomMotion
    }
    return { pixels: allPixels, topMotion, bottomMotion }
  })
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
