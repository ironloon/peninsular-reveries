import type { MotionBody, Pose } from './types.js'

const FPS = 12
const FRAME_INTERVAL = 1000 / FPS
const THRESHOLD = 22
const CATCH_UP_MS = 250

const CANVAS_W = 48
const CANVAS_H = 36

const SMOOTH = 0.55
const MERGE_DISTANCE = 14
const PERSISTENCE_TIMEOUT = 500
const MAX_BODIES = 4
const STABLE_TIME = 150

// Hand-up detection: top region has significant motion
const HAND_UP_TOP_RATIO = 0.40

// Arm rotation: motion oscillates left-right rapidly in the top half
// Made forgiving for young children — fewer crossings needed, wider window, more of body counts
const ROTATION_WINDOW_MS = 2500
const ROTATION_MIN_CROSSINGS = 2
const ROTATION_TOP_RATIO = 0.70

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
  id: number
  x: number
  y: number
  spreadX: number
  spreadY: number
  lastSeen: number
  firstSeen: number
  armsUp: boolean
  centroidHistory: Array<{ x: number; y: number; time: number }>
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
  lastPose: Pose
  poseHoldStart: number
  stablePose: Pose
}

interface VideoFrameCallback {
  requestVideoFrameCallback(callback: () => void): number
  cancelVideoFrameCallback(handle: number): void
}

let state: TrackingState | null = null

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

      if (count < 25) continue
      const sX = (maxX - minX) / width
      const sY = (maxY - minY) / height
      if (sY < 0.18 || sY > 0.95) continue
      if (sX > sY * 2.5) continue
      if (sX > 0.7) continue

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
      const bMinX = b.cx - b.spreadX * width * 0.5
      const bMaxX = b.cx + b.spreadX * width * 0.5
      const bMinY = b.cy - b.spreadY * height * 0.5
      const bMaxY = b.cy + b.spreadY * height * 0.5
      minX = Math.min(minX, bMinX); maxX = Math.max(maxX, bMaxX)
      minY = Math.min(minY, bMinY); maxY = Math.max(maxY, bMaxY)
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
      if (dist < bestDist && dist < 0.08) {
        bestDist = dist
        bestId = id
      }
    }

    if (bestId >= 0) {
      const prevBody = trackedBodies.get(bestId)!
      const smoothX = prevBody.x * SMOOTH + mx * (1 - SMOOTH)
      const smoothY = prevBody.y * SMOOTH + my * (1 - SMOOTH)
      const history = [...prevBody.centroidHistory, { x: smoothX, y: smoothY, time: now }].slice(-20)
      updated.set(bestId, {
        id: prevBody.id,
        x: smoothX,
        y: smoothY,
        spreadX: prevBody.spreadX * SMOOTH + b.spreadX * (1 - SMOOTH),
        spreadY: prevBody.spreadY * SMOOTH + b.spreadY * (1 - SMOOTH),
        lastSeen: now,
        firstSeen: prevBody.firstSeen,
        armsUp: false,
        centroidHistory: history,
      })
      usedIds.add(bestId)
    } else if (trackedBodies.size + updated.size < MAX_BODIES) {
      const id = nextId
      nextId++
      updated.set(id, {
        id,
        x: mx,
        y: my,
        spreadX: b.spreadX,
        spreadY: b.spreadY,
        lastSeen: now,
        firstSeen: now,
        armsUp: false,
        centroidHistory: [{ x: mx, y: my, time: now }],
      })
      usedIds.add(id)
    }
  }

  for (const [id, body] of trackedBodies) {
    if (usedIds.has(id)) continue
    if (now - body.lastSeen < PERSISTENCE_TIMEOUT) {
      updated.set(id, body)
    }
  }

  return { trackedBodies: updated, nextId }
}

export function resolvePose(body: MotionBody, centroidHistory: Array<{ x: number; y: number; time: number }>, now: number): Pose {
  // Camera video is CSS-mirrored for the user

  // Bounce/stomp detection: vertical oscillation of centroid
  const BOUNCE_WINDOW_MS = 2000
  const BOUNCE_MIN_CROSSINGS = 2
  if (centroidHistory.length >= 4) {
    const recentHistory = centroidHistory.filter((p) => now - p.time < BOUNCE_WINDOW_MS)
    if (recentHistory.length >= 4) {
      let yCrossings = 0
      const avgY = recentHistory.reduce((s, p) => s + p.y, 0) / recentHistory.length
      for (let i = 1; i < recentHistory.length; i++) {
        const prev = recentHistory[i - 1].y
        const curr = recentHistory[i].y
        if ((prev < avgY && curr >= avgY) || (prev >= avgY && curr < avgY)) {
          yCrossings++
        }
      }
      if (yCrossings >= BOUNCE_MIN_CROSSINGS && body.spreadY > 0.15) {
        return 'bouncing'
      }
    }
  }

  // Hand-up: significant motion in top region, or hand above body
  const topMotionRatio = body.normalizedY < HAND_UP_TOP_RATIO
  const hasHandUp = topMotionRatio && body.spreadX > 0.10

  // Arm rotation: the centroid oscillates left-right in the upper body
  if (centroidHistory.length >= 4) {
    const recentHistory = centroidHistory.filter((p) => now - p.time < ROTATION_WINDOW_MS)
    if (recentHistory.length >= 4) {
      // Count how many times the x centroid crosses the center
      let crossings = 0
      for (let i = 1; i < recentHistory.length; i++) {
        const prev = recentHistory[i - 1].x
        const curr = recentHistory[i].x
        if ((prev < 0.5 && curr >= 0.5) || (prev >= 0.5 && curr < 0.5)) {
          crossings++
        }
      }
      // Check if motion is mostly in upper body
      const avgY = recentHistory.reduce((s, p) => s + p.y, 0) / recentHistory.length
      if (crossings >= ROTATION_MIN_CROSSINGS && avgY < ROTATION_TOP_RATIO) {
        return 'arm-rotating'
      }
    }
  }

  // Both arms up: wide spread in top half
  if (body.spreadX > 0.35 && body.normalizedY < 0.5 && hasHandUp) {
    return 'both-arms-up'
  }

  if (hasHandUp) {
    // Motion in upper body area
    if (body.normalizedY < 0.45 && body.spreadY > 0.25) {
      return 'hand-up'
    }
  }

  return 'idle'
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

  const rawBlobs = extractBlobs(state.prevImageData, imageData, canvas.width, canvas.height)
  state.prevImageData = imageData

  if (rawBlobs.length === 0) {
    purgeLostBodies(now)
    onBodies(buildMotionBodies(now))
    scheduleNext()
    return
  }

  const merged = mergeBlobs(rawBlobs, MERGE_DISTANCE, canvas.width, canvas.height)

  const result = trackBodies(merged, now, canvas.width, canvas.height, state.trackedBodies, state.nextId)
  state.trackedBodies = result.trackedBodies
  state.nextId = result.nextId

  onBodies(buildMotionBodies(now))
  scheduleNext()
}

function purgeLostBodies(now: number): void {
  if (!state) return
  for (const [id, body] of state.trackedBodies) {
    if (now - body.lastSeen >= PERSISTENCE_TIMEOUT) state.trackedBodies.delete(id)
  }
}

function buildMotionBodies(now: number): MotionBody[] {
  const bodies: MotionBody[] = []
  for (const [id, body] of state!.trackedBodies) {
    if (now - body.firstSeen < STABLE_TIME) continue
    if (now - body.lastSeen > 200 && now - body.firstSeen < 500) continue

    const pose = resolvePose(
      { id, normalizedX: 1 - body.x, normalizedY: body.y, spreadX: body.spreadX, spreadY: body.spreadY, pixelCount: 0, active: true, armsUp: body.armsUp },
      body.centroidHistory,
      now,
    )

    bodies.push({
      id,
      normalizedX: 1 - body.x,
      normalizedY: body.y,
      spreadX: body.spreadX,
      spreadY: body.spreadY,
      pixelCount: 0,
      active: true,
      armsUp: pose === 'hand-up' || pose === 'arm-rotating' || pose === 'both-arms-up' || pose === 'bouncing',
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
    lastPose: 'idle',
    poseHoldStart: 0,
    stablePose: 'idle',
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