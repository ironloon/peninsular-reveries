import type { MotionZone } from './types.js'

const FPS = 15
const FRAME_INTERVAL = 1000 / FPS
const CATCH_UP_MS = 250

const CANVAS_W = 64
const CANVAS_H = 48

const SMOOTH = 0.6
const MERGE_DISTANCE = 14
const PERSISTENCE_TIMEOUT = 500
const MAX_ZONES = 6
const STABLE_TIME = 150
const ACTIVITY_DECAY = 0.85

interface Blob {
  cx: number
  cy: number
  spreadX: number
  spreadY: number
  topMotion: number
  bottomMotion: number
  pixelCount: number
}

interface YHistoryEntry {
  y: number
  t: number
}

type TrackedZone = {
  x: number
  y: number
  spreadX: number
  spreadY: number
  lastSeen: number
  firstSeen: number
  yHistory: YHistoryEntry[]
  activity: number
  prevY: number
}

type TrackingState = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  video: HTMLVideoElement
  onZones: (zones: MotionZone[]) => void
  rafId: number
  lastFrameTime: number
  prevImageData: ImageData | null
  running: boolean
  useVFC: boolean
  trackedZones: Map<number, TrackedZone>
  nextId: number
}

interface VideoFrameCallback {
  requestVideoFrameCallback(callback: () => void): number
  cancelVideoFrameCallback(handle: number): number
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

  const { canvas, ctx, video, onZones } = state
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  if (!state.prevImageData) {
    state.prevImageData = imageData
    scheduleNext()
    return
  }

  const zones = detectAndTrackZones(state.prevImageData, imageData, canvas.width, canvas.height, now)
  state.prevImageData = imageData

  onZones(zones)
  scheduleNext()
}

function detectAndTrackZones(
  prev: ImageData,
  curr: ImageData,
  width: number,
  height: number,
  now: number,
): MotionZone[] {
  const rawBlobs = extractBlobs(prev, curr, width, height)
  if (rawBlobs.length === 0) {
    purgeLostZones(now)
    return buildMotionZones(now)
  }

  const merged = mergeBlobs(rawBlobs, MERGE_DISTANCE, width, height)
  const { trackedZones, nextId } = trackZones(
    merged,
    now,
    width,
    height,
    state!.trackedZones,
    state!.nextId,
  )

  state!.trackedZones = trackedZones
  state!.nextId = nextId

  return buildMotionZones(now)
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
    if (Math.abs(cgray - pgray) > 22) {
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

      if (count < 20) continue

      const sX = (maxX - minX) / width
      const sY = (maxY - minY) / height
      if (sY < 0.1 || sY > 0.9) continue
      if (sX > 0.85) continue

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
      spreadY: Math.max(0.15, (maxY - minY) / height),
      topMotion: topM,
      bottomMotion: botM,
      pixelCount: count,
    }
  })
}

function trackZones(
  merged: Blob[],
  now: number,
  width: number,
  height: number,
  trackedZones: Map<number, TrackedZone>,
  nextId: number,
): { trackedZones: Map<number, TrackedZone>; nextId: number } {
  const usedIds = new Set<number>()
  const updated = new Map<number, TrackedZone>()

  for (const b of merged) {
    const mx = 1 - (b.cx / width) // mirror horizontally
    const my = b.cy / height
    let bestId = -1
    let bestDist = Infinity

    for (const [id, zone] of trackedZones) {
      if (usedIds.has(id)) continue
      const dx = zone.x - mx
      const dy = zone.y - my
      const dist = dx * dx + dy * dy
      if (dist < bestDist && dist < 0.08) {
        bestDist = dist
        bestId = id
      }
    }

    if (bestId >= 0) {
      const prev = trackedZones.get(bestId)!
      const newY = prev.y * SMOOTH + my * (1 - SMOOTH)
      const newX = prev.x * SMOOTH + mx * (1 - SMOOTH)

      const motionAmount = b.pixelCount / (width * height)
      const newActivity = Math.min(1, prev.activity * ACTIVITY_DECAY + motionAmount * 8)

      const yHistory = prev.yHistory.filter((h) => now - h.t < 500)
      yHistory.push({ y: newY, t: now })

      updated.set(bestId, {
        x: newX,
        y: newY,
        spreadX: prev.spreadX * SMOOTH + b.spreadX * (1 - SMOOTH),
        spreadY: prev.spreadY * SMOOTH + b.spreadY * (1 - SMOOTH),
        lastSeen: now,
        firstSeen: prev.firstSeen,
        yHistory,
        activity: newActivity,
        prevY: prev.y,
      })
      usedIds.add(bestId)
    } else if (trackedZones.size + updated.size < MAX_ZONES) {
      const id = nextId
      nextId++
      updated.set(id, {
        x: mx,
        y: my,
        spreadX: b.spreadX,
        spreadY: b.spreadY,
        lastSeen: now,
        firstSeen: now,
        yHistory: [{ y: my, t: now }],
        activity: b.pixelCount / (width * height) * 5,
        prevY: my,
      })
      usedIds.add(id)
    }
  }

  for (const [id, zone] of trackedZones) {
    if (usedIds.has(id)) continue
    if (now - zone.lastSeen < PERSISTENCE_TIMEOUT) {
      updated.set(id, {
        ...zone,
        activity: zone.activity * 0.9,
      })
    }
  }

  return { trackedZones: updated, nextId }
}

function purgeLostZones(now: number): void {
  const { trackedZones } = state!
  for (const [id, zone] of trackedZones) {
    if (now - zone.lastSeen >= PERSISTENCE_TIMEOUT) trackedZones.delete(id)
  }
}

function buildMotionZones(now: number): MotionZone[] {
  const zones: MotionZone[] = []
  for (const [id, zone] of state!.trackedZones) {
    if (now - zone.firstSeen < STABLE_TIME) continue

    const yHistory = zone.yHistory
    const _velocityY = yHistory.length >= 2
      ? (yHistory[yHistory.length - 1].y - yHistory[0].y) / (Math.max(1, yHistory[yHistory.length - 1].t - yHistory[0].t))
      : 0

    zones.push({
      id,
      normalizedX: zone.x,
      normalizedY: zone.y,
      spreadX: zone.spreadX,
      spreadY: zone.spreadY,
      pixelCount: 0,
      active: now - zone.lastSeen < 300,
      velocityY: _velocityY,
    })
  }
  return zones
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
  onZones: (zones: MotionZone[]) => void,
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
    onZones,
    rafId: 0,
    lastFrameTime: 0,
    prevImageData: null,
    running: true,
    useVFC,
    trackedZones: new Map(),
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
    ;(state.video as HTMLVideoElement & VideoFrameCallback).cancelVideoFrameCallback(state.rafId)
  } else {
    cancelAnimationFrame(state.rafId)
  }
  state = null
}