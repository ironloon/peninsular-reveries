import type { MotionBody } from './types.js'

const FPS = 15
const FRAME_INTERVAL = 1000 / FPS
const THRESHOLD = 22
const CATCH_UP_MS = 250

const CANVAS_W = 48
const CANVAS_H = 36

const SMOOTH = 0.6
const MERGE_DISTANCE = 12
const PERSISTENCE_TIMEOUT = 500
const MAX_BODIES = 4
const STABLE_TIME = 150

interface Blob {
  cx: number
  cy: number
  spreadX: number
  spreadY: number
  topMotion: number
  bottomMotion: number
  pixelCount: number
}

type TrackedBody = {
  x: number
  y: number
  spreadX: number
  spreadY: number
  lastSeen: number
  firstSeen: number
  armsUp: boolean
}

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
  trackedBodies: Map<number, TrackedBody>
  nextId: number
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
  const rawBlobs = extractBlobs(prev, curr, width, height)
  if (rawBlobs.length === 0) {
    purgeLostBodies(now)
    return buildMotionBodies(now)
  }

  const merged = mergeBlobs(rawBlobs, MERGE_DISTANCE, width, height)

  const { trackedBodies, nextId } = trackBodies(
    merged,
    now,
    width,
    height,
    state!.trackedBodies,
    state!.nextId,
  )

  state!.trackedBodies = trackedBodies
  state!.nextId = nextId

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

      let minX = width, maxX = 0, minY = height, maxY = 0
      let sumX = 0, sumY = 0, count = 0
      let topM = 0, botM = 0
      const stack = [idx]
      visited[idx] = 1

      while (stack.length > 0) {
        const ci = stack.pop()!
        const cx = ci % width
        const cy = Math.floor(ci / width)

        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx)
        minY = Math.min(minY, cy); maxY = Math.max(maxY, cy)
        sumX += cx; sumY += cy; count++
        if (cy < height * 0.45) topM++; else botM++

        if (cx > 0 && !visited[ci - 1] && mask[ci - 1]) { visited[ci - 1] = 1; stack.push(ci - 1) }
        if (cx < width - 1 && !visited[ci + 1] && mask[ci + 1]) { visited[ci + 1] = 1; stack.push(ci + 1) }
        if (cy > 0 && !visited[ci - width] && mask[ci - width]) { visited[ci - width] = 1; stack.push(ci - width) }
        if (cy < height - 1 && !visited[ci + width] && mask[ci + width]) { visited[ci + width] = 1; stack.push(ci + width) }
      }

      if (count < 30) continue

      const sX = (maxX - minX) / width
      const sY = (maxY - minY) / height
      // Reject non-person-shaped motion: too short, too wide, or wrong aspect
      if (sY < 0.18 || sY > 0.9) continue
      if (sX > sY * 2.0) continue
      if (sX > 0.65) continue

      blobs.push({
        cx: sumX / count,
        cy: sumY / count,
        spreadX: sX,
        spreadY: sY,
        topMotion: topM,
        bottomMotion: botM,
        pixelCount: count,
      })
    }
  }

  return blobs
}

function mergeBlobs(blobs: Blob[], mergeDist: number, width: number, height: number): Blob[] {
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
      if (Math.sqrt(dx * dx + dy * dy) < mergeDist) union(i, j)
    }
  }

  const groups = new Map<number, Blob[]>()
  for (let i = 0; i < blobs.length; i++) {
    const p = find(i)
    if (!groups.has(p)) groups.set(p, [])
    groups.get(p)!.push(blobs[i])
  }

  return Array.from(groups.values()).map((group) => {
    let cx = 0, cy = 0, count = 0, topM = 0, botM = 0
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const b of group) {
      cx += b.cx * b.pixelCount
      cy += b.cy * b.pixelCount
      count += b.pixelCount
      topM += b.topMotion; botM += b.bottomMotion
      const bxMin = b.cx - b.spreadX * width * 0.5
      const bxMax = b.cx + b.spreadX * width * 0.5
      const byMin = b.cy - b.spreadY * height * 0.5
      const byMax = b.cy + b.spreadY * height * 0.5
      minX = Math.min(minX, bxMin); maxX = Math.max(maxX, bxMax)
      minY = Math.min(minY, byMin); maxY = Math.max(maxY, byMax)
    }
    return {
      cx: cx / count,
      cy: cy / count,
      spreadX: Math.max(0.06, (maxX - minX) / width),
      spreadY: Math.max(0.18, (maxY - minY) / height),
      topMotion: topM,
      bottomMotion: botM,
      pixelCount: count,
    }
  })
}

function trackBodies(
  merged: Blob[],
  now: number,
  width: number,
  height: number,
  trackedBodies: Map<number, TrackedBody>,
  nextId: number,
): { trackedBodies: Map<number, TrackedBody>; nextId: number } {
  const usedIds = new Set<number>()
  const updated = new Map<number, TrackedBody>()

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
      if (dist < bestDist && dist < 0.06) {
        bestDist = dist
        bestId = id
      }
    }

    if (bestId >= 0) {
      const prevBody = trackedBodies.get(bestId)!
      updated.set(bestId, {
        x: prevBody.x * SMOOTH + mx * (1 - SMOOTH),
        y: prevBody.y * SMOOTH + my * (1 - SMOOTH),
        spreadX: prevBody.spreadX * SMOOTH + b.spreadX * (1 - SMOOTH),
        spreadY: prevBody.spreadY * SMOOTH + b.spreadY * (1 - SMOOTH),
        lastSeen: now,
        firstSeen: prevBody.firstSeen,
        armsUp: false,
      })
      usedIds.add(bestId)
    } else if (trackedBodies.size + updated.size < MAX_BODIES) {
      const id = nextId
      nextId++
      updated.set(id, {
        x: mx,
        y: my,
        spreadX: b.spreadX,
        spreadY: b.spreadY,
        lastSeen: now,
        firstSeen: now,
        armsUp: false,
      })
      usedIds.add(id)
    }
  }

  // Persist unmatched bodies briefly
  for (const [id, body] of trackedBodies) {
    if (usedIds.has(id)) continue
    if (now - body.lastSeen < PERSISTENCE_TIMEOUT) {
      updated.set(id, body)
    }
  }

  return { trackedBodies: updated, nextId }
}

function purgeLostBodies(now: number): void {
  const { trackedBodies } = state!
  for (const [id, body] of trackedBodies) {
    if (now - body.lastSeen >= PERSISTENCE_TIMEOUT) trackedBodies.delete(id)
  }
}

function buildMotionBodies(now: number): MotionBody[] {
  const bodies: MotionBody[] = []
  for (const [id, body] of state!.trackedBodies) {
    if (now - body.firstSeen < STABLE_TIME) continue
    if (now - body.lastSeen > 200 && now - body.firstSeen < 500) continue

    bodies.push({
      id,
      normalizedX: 1 - body.x,
      normalizedY: body.y,
      spreadX: body.spreadX,
      spreadY: body.spreadY,
      pixelCount: 0,
      active: true,
      armsUp: false,
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
