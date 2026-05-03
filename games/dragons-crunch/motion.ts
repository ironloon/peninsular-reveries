import type { MotionBody } from './types.js'

const FPS = 15
const FRAME_INTERVAL = 1000 / FPS
const THRESHOLD = 18
const CATCH_UP_MS = 250

const CANVAS_W = 48
const CANVAS_H = 36

const MIN_BLOB_SIZE = 12
const MERGE_DISTANCE = 10
const PERSISTENCE_TIMEOUT = 400 // ms before a body is dropped if not seen
const MAX_BODIES = 6

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
  trackedBodies: Map<number, { x: number; y: number; spreadX: number; spreadY: number; lastSeen: number; armsUp: boolean; framesUp: number }>
  nextId: number
}

interface VideoFrameCallback {
  requestVideoFrameCallback(callback: () => void): number
  cancelVideoFrameCallback(handle: number): void
}

let state: TrackingState | null = null

interface Blob {
  cx: number
  cy: number
  spreadX: number
  spreadY: number
  topMotion: number
  bottomMotion: number
  pixelCount: number
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

  const bodies = detectAndTrackBodies(state.prevImageData, imageData, canvas.width, canvas.height, now)
  state.prevImageData = imageData

  onBodies(bodies)
  scheduleNext()
}

function detectAndTrackBodies(
  prev: ImageData,
  curr: ImageData,
  width: number,
  height: number,
  now: number,
): MotionBody[] {
  const blobs = extractBlobs(prev, curr, width, height)
  if (blobs.length === 0) {
    purgeLostBodies(now)
    return buildMotionBodies(now)
  }

  // Merge nearby blobs into single body candidates
  const merged = mergeBlobs(blobs, MERGE_DISTANCE)

  // Match merged blobs to existing tracked bodies by nearest centroid
  const { trackedBodies, nextId } = state!
  const usedIds = new Set<number>()
  const updatedBodies = new Map<number, { x: number; y: number; spreadX: number; spreadY: number; lastSeen: number; armsUp: boolean; framesUp: number }>()

  for (const b of merged) {
    const mx = b.cx / width
    const my = b.cy / height
    let bestId = -1
    let bestDist = Infinity

    for (const [id, body] of trackedBodies) {
      if (usedIds.has(id)) continue
      const dx = body.x - mx
      const dy = body.y - my
      const dist = dx * dx + dy * dy
      if (dist < bestDist && dist < 0.08) {
        bestDist = dist
        bestId = id
      }
    }

    // Arms up: top half has more motion than bottom
    const armsUp = b.topMotion > 15 && b.topMotion > b.bottomMotion * 0.5

    if (bestId >= 0) {
      const prevBody = trackedBodies.get(bestId)!
      const newFramesUp = armsUp ? prevBody.framesUp + 1 : Math.max(0, prevBody.framesUp - 2)
      updatedBodies.set(bestId, {
        x: mx,
        y: my,
        spreadX: b.spreadX,
        spreadY: b.spreadY,
        lastSeen: now,
        armsUp: newFramesUp >= 1,
        framesUp: newFramesUp,
      })
      usedIds.add(bestId)
    } else if (trackedBodies.size + updatedBodies.size < MAX_BODIES) {
      // New body
      const id = nextId
      state!.nextId = nextId + 1
      updatedBodies.set(id, {
        x: mx,
        y: my,
        spreadX: b.spreadX,
        spreadY: b.spreadY,
        lastSeen: now,
        armsUp: false,
        framesUp: 0,
      })
      usedIds.add(id)
    }
  }

  // Keep recently-seen bodies that weren't matched (but start decaying)
  for (const [id, body] of trackedBodies) {
    if (usedIds.has(id)) continue
    if (now - body.lastSeen < PERSISTENCE_TIMEOUT) {
      updatedBodies.set(id, body)
    }
  }

  state!.trackedBodies = updatedBodies
  return buildMotionBodies(now)
}

function extractBlobs(
  prev: ImageData,
  curr: ImageData,
  width: number,
  height: number,
): Blob[] {
  const prevData = prev.data
  const currData = curr.data

  const mask = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const pi = i * 4
    const pgray = prevData[pi] * 0.299 + prevData[pi + 1] * 0.587 + prevData[pi + 2] * 0.114
    const cgray = currData[pi] * 0.299 + currData[pi + 1] * 0.587 + currData[pi + 2] * 0.114
    if (Math.abs(cgray - pgray) > THRESHOLD) {
      mask[i] = 1
    }
  }

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
      let minX = width, maxX = 0, minY = height, maxY = 0
      let sumX = 0, sumY = 0

      while (stack.length > 0) {
        const ci = stack.pop()!
        const cx = ci % width
        const cy = Math.floor(ci / width)
        pixels.push({ x: cx, y: cy })

        if (cy < height * 0.45) topMotion++
        else bottomMotion++

        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx)
        minY = Math.min(minY, cy); maxY = Math.max(maxY, cy)
        sumX += cx; sumY += cy

        if (cx > 0 && !visited[ci - 1] && mask[ci - 1]) { visited[ci - 1] = 1; stack.push(ci - 1) }
        if (cx < width - 1 && !visited[ci + 1] && mask[ci + 1]) { visited[ci + 1] = 1; stack.push(ci + 1) }
        if (cy > 0 && !visited[ci - width] && mask[ci - width]) { visited[ci - width] = 1; stack.push(ci - width) }
        if (cy < height - 1 && !visited[ci + width] && mask[ci + width]) { visited[ci + width] = 1; stack.push(ci + width) }
      }

      if (pixels.length >= MIN_BLOB_SIZE) {
        const count = pixels.length
        blobs.push({
          cx: sumX / count,
          cy: sumY / count,
          spreadX: (maxX - minX) / width,
          spreadY: (maxY - minY) / height,
          topMotion,
          bottomMotion,
          pixelCount: count,
        })
      }
    }
  }

  return blobs
}

function mergeBlobs(blobs: Blob[], mergeDist: number): Blob[] {
  if (blobs.length <= 1) return blobs

  const parents = new Array(blobs.length).fill(0).map((_, i) => i)
  function find(i: number): number {
    if (parents[i] !== i) parents[i] = find(parents[i])
    return parents[i]
  }
  function union(a: number, b: number): void {
    const pa = find(a), pb = find(b)
    if (pa !== pb) parents[pa] = pb
  }

  for (let i = 0; i < blobs.length; i++) {
    for (let j = i + 1; j < blobs.length; j++) {
      const dx = blobs[i].cx - blobs[j].cx
      const dy = blobs[i].cy - blobs[j].cy
      if (Math.sqrt(dx * dx + dy * dy) < mergeDist) {
        union(i, j)
      }
    }
  }

  const groups = new Map<number, Blob[]>()
  for (let i = 0; i < blobs.length; i++) {
    const p = find(i)
    if (!groups.has(p)) groups.set(p, [])
    groups.get(p)!.push(blobs[i])
  }

  return Array.from(groups.values()).map((group) => {
    let cx = 0, cy = 0, topM = 0, botM = 0, count = 0
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const b of group) {
      cx += b.cx * b.pixelCount
      cy += b.cy * b.pixelCount
      topM += b.topMotion
      botM += b.bottomMotion
      count += b.pixelCount
      minX = Math.min(minX, b.cx - b.spreadX * 24)
      maxX = Math.max(maxX, b.cx + b.spreadX * 24)
      minY = Math.min(minY, b.cy - b.spreadY * 18)
      maxY = Math.max(maxY, b.cy + b.spreadY * 18)
    }
    cx /= count
    cy /= count
    return {
      cx,
      cy,
      spreadX: (maxX - minX) / 48,
      spreadY: (maxY - minY) / 36,
      topMotion: topM,
      bottomMotion: botM,
      pixelCount: count,
    }
  })
}

function purgeLostBodies(now: number): void {
  const { trackedBodies } = state!
  for (const [id, body] of trackedBodies) {
    if (now - body.lastSeen >= PERSISTENCE_TIMEOUT) {
      trackedBodies.delete(id)
    }
  }
}

function buildMotionBodies(now: number): MotionBody[] {
  const bodies: MotionBody[] = []
  for (const [id, body] of state!.trackedBodies) {
    // Only include bodies we have seen recently (within 150ms)
    if (now - body.lastSeen > 150 && !body.armsUp) continue

    bodies.push({
      id,
      normalizedX: body.x, // raw; renderer mirrors to match CSS-mirrored video
      normalizedY: body.y,
      spreadX: body.spreadX,
      spreadY: body.spreadY,
      pixelCount: 0,
      active: true,
      armsUp: body.armsUp,
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
  if (state) stopMotionTracking()

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
    trackedBodies: new Map(),
    nextId: 1,
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
