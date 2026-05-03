import type { MotionHand } from './types.js'

const FPS = 15
const FRAME_INTERVAL = 1000 / FPS
const THRESHOLD = 22
const CATCH_UP_MS = 250

const CANVAS_W = 64
const CANVAS_H = 48

const SMOOTH = 0.55
const MERGE_DISTANCE = 18
const PERSISTENCE_TIMEOUT = 600
const MAX_BODIES = 4
const STABLE_TIME = 120

// Hysteresis thresholds for open/closed hand detection
// Once closed, need higher threshold to switch to open (prevents flickering)
const OPEN_HAND_THRESHOLD = 0.16
const CLOSED_HAND_THRESHOLD = 0.12

// Also consider spreadY for fist detection — a fist is tall and narrow
const CLOSED_HAND_SPREAD_Y_MAX = 0.35

interface Blob {
  cx: number
  cy: number
  spreadX: number
  spreadY: number
  topMotion: number
  bottomMotion: number
  pixelCount: number
}

type HandState = 'open' | 'closed' | 'unknown'

type TrackedBody = {
  id: number
  x: number
  y: number
  spreadX: number
  spreadY: number
  lastSeen: number
  firstSeen: number
  handState: HandState
  openFrames: number
  closedFrames: number
}

type TrackingState = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  video: HTMLVideoElement
  onHands: (hands: MotionHand[]) => void
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

  const { canvas, ctx, video, onHands } = state
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  if (!state.prevImageData) {
    state.prevImageData = imageData
    scheduleNext()
    return
  }

  detectAndTrackBodies(state.prevImageData, imageData, canvas.width, canvas.height, now)
  state.prevImageData = imageData

  // Convert tracked bodies into MotionHand objects
  const hands = buildHands(now)
  onHands(hands)
  scheduleNext()
}

function extractBlobs(prev: ImageData, curr: ImageData, width: number, height: number): Blob[] {
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

      if (count < 40) continue
      const sX = (maxX - minX) / width
      const sY = (maxY - minY) / height
      if (sY < 0.12 || sX < 0.04) continue

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
      spreadY: Math.max(0.12, (maxY - minY) / height),
      topMotion: topM,
      bottomMotion: botM,
      pixelCount: count,
    }
  })
}

function detectAndTrackBodies(
  prev: ImageData,
  curr: ImageData,
  width: number,
  height: number,
  now: number,
): void {
  const rawBlobs = extractBlobs(prev, curr, width, height)
  if (rawBlobs.length === 0) {
    purgeLostBodies(now)
    return
  }

  const merged = mergeBlobs(rawBlobs, MERGE_DISTANCE, width, height)
  trackBodies(merged, now, width, height)
}

function detectHandState(
  spreadX: number,
  spreadY: number,
  prevState: HandState,
  prevOpenFrames: number,
  prevClosedFrames: number,
): { state: HandState; openFrames: number; closedFrames: number } {
  // A closed fist is compact (small spreadX) AND tall (spreadY within range)
  // An open hand is wider (larger spreadX)
  const isCompact = spreadX < CLOSED_HAND_THRESHOLD && spreadY < CLOSED_HAND_SPREAD_Y_MAX
  const isOpen = spreadX > OPEN_HAND_THRESHOLD

  // Count consecutive frames for debouncing
  const openFrames = isOpen ? prevOpenFrames + 1 : 0
  const closedFrames = isCompact ? prevClosedFrames + 1 : 0

  // Hysteresis: require 2+ consecutive frames to transition
  if (prevState === 'closed') {
    // Once closed, need stronger evidence to become open
    if (openFrames >= 3) {
      return { state: 'open', openFrames, closedFrames: 0 }
    }
    return { state: 'closed', openFrames: 0, closedFrames }
  } else if (prevState === 'open') {
    // Once open, need stronger evidence to become closed
    if (closedFrames >= 3) {
      return { state: 'closed', openFrames: 0, closedFrames }
    }
    return { state: 'open', openFrames, closedFrames: 0 }
  }

  // Unknown state: decide based on current measurement
  if (isCompact) {
    return { state: 'closed', openFrames: 0, closedFrames: closedFrames || 1 }
  } else {
    return { state: 'open', openFrames: openFrames || 1, closedFrames: 0 }
  }
}

function trackBodies(
  merged: Blob[],
  now: number,
  width: number,
  height: number,
): void {
  if (!state) return
  const { trackedBodies, nextId } = state
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
      const prev = trackedBodies.get(bestId)!
      const smoothSpreadX = prev.spreadX * SMOOTH + b.spreadX * (1 - SMOOTH)
      const smoothSpreadY = prev.spreadY * SMOOTH + b.spreadY * (1 - SMOOTH)
      const { state: handState, openFrames, closedFrames } = detectHandState(
        smoothSpreadX, smoothSpreadY, prev.handState, prev.openFrames, prev.closedFrames,
      )
      updated.set(bestId, {
        id: bestId,
        x: prev.x * SMOOTH + mx * (1 - SMOOTH),
        y: prev.y * SMOOTH + my * (1 - SMOOTH),
        spreadX: smoothSpreadX,
        spreadY: smoothSpreadY,
        lastSeen: now,
        firstSeen: prev.firstSeen,
        handState,
        openFrames,
        closedFrames,
      })
      usedIds.add(bestId)
    } else if (trackedBodies.size + updated.size < MAX_BODIES) {
      const id = nextId
      updated.set(id, {
        id,
        x: mx,
        y: my,
        spreadX: b.spreadX,
        spreadY: b.spreadY,
        lastSeen: now,
        firstSeen: now,
        handState: 'unknown',
        openFrames: 0,
        closedFrames: 0,
      })
      state.nextId++
      usedIds.add(id)
    }
  }

  for (const [id, body] of trackedBodies) {
    if (usedIds.has(id)) continue
    if (now - body.lastSeen < PERSISTENCE_TIMEOUT) {
      updated.set(id, body)
    }
  }

  state.trackedBodies = updated
}

function purgeLostBodies(now: number): void {
  if (!state) return
  for (const [id, body] of state.trackedBodies) {
    if (now - body.lastSeen >= PERSISTENCE_TIMEOUT) state.trackedBodies.delete(id)
  }
}

function buildHands(now: number): MotionHand[] {
  if (!state) return []
  const hands: MotionHand[] = []
  for (const [, body] of state.trackedBodies) {
    if (now - body.firstSeen < STABLE_TIME) continue
    if (now - body.lastSeen > 200 && now - body.firstSeen < 500) continue
    // Map hysteresis-smoothed hand state to the output type
    // 'unknown' defaults to 'open' (safer for piano — won't accidentally trigger tuna)
    const handState: 'open' | 'closed' = body.handState === 'closed' ? 'closed' : 'open'
    hands.push({
      id: body.id,
      normalizedX: 1 - body.x,
      normalizedY: body.y,
      spreadX: body.spreadX,
      spreadY: body.spreadY,
      handState,
    })
  }
  return hands
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
  onHands: (hands: MotionHand[]) => void,
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
    onHands,
    rafId: 0,
    lastFrameTime: 0,
    prevImageData: null,
    running: true,
    useVFC,
    trackedBodies: new Map(),
    nextId: 1,
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