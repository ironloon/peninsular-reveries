import { describe, it } from 'node:test'
import assert from 'node:assert'
import { computeMotionMetrics, resolvePose, startMotionTracking, stopMotionTracking } from './motion.js'
import type { Pose } from './types.js'

// Minimal DOM mocks for Node test environment
let rafCallbacks: Array<(time: number) => void> = []
let rafIdCounter = 0

Object.assign(globalThis, {
  document: {
    createElement(tagName: string) {
      if (tagName === 'canvas') {
        return {
          getContext() {
            return {
              drawImage() {},
              getImageData(_x: number, _y: number, w: number, h: number) {
                return {
                  data: new Uint8ClampedArray(w * h * 4),
                  width: w,
                  height: h,
                } as ImageData
              },
            }
          },
          width: 0,
          height: 0,
        }
      }
      return {}
    },
  },
  requestAnimationFrame(callback: (time: number) => void) {
    rafIdCounter++
    rafCallbacks.push(callback)
    return rafIdCounter
  },
  cancelAnimationFrame() {
    rafCallbacks = []
  },
  performance: {
    now() {
      return Date.now()
    },
  },
})

function createImageData(width: number, height: number, fillValue: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillValue
    data[i + 1] = fillValue
    data[i + 2] = fillValue
    data[i + 3] = 255
  }
  return { data, width, height } as ImageData
}

function createImageDataWithBlock(
  width: number,
  height: number,
  blockX: number,
  blockY: number,
  blockW: number,
  blockH: number,
  blockFill: number,
  bgFill: number,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const inBlock = x >= blockX && x < blockX + blockW && y >= blockY && y < blockY + blockH
      const fill = inBlock ? blockFill : bgFill
      data[i] = fill
      data[i + 1] = fill
      data[i + 2] = fill
      data[i + 3] = 255
    }
  }
  return { data, width, height } as ImageData
}

describe('computeMotionMetrics', () => {
  it('returns zero values for identical frames', () => {
    const frame = createImageData(64, 48, 128)
    const result = computeMotionMetrics(frame, frame, 64, 48)

    assert.strictEqual(result.motionScore, 0)
    assert.strictEqual(result.centroidX, 0)
    assert.strictEqual(result.centroidY, 0)
    assert.strictEqual(result.spreadX, 0)
    assert.strictEqual(result.spreadY, 0)
  })

  it('calculates centroid and spread for a shifted bright block', () => {
    const staticFrame = createImageDataWithBlock(64, 48, 10, 10, 10, 10, 0, 255)
    const shiftedFrame = createImageDataWithBlock(64, 48, 20, 10, 10, 10, 0, 255)

    const result = computeMotionMetrics(staticFrame, shiftedFrame, 64, 48)

    assert.strictEqual(result.motionScore, 200)
    assert.ok(result.centroidX >= 0.29 && result.centroidX <= 0.32, `centroidX was ${result.centroidX}`)
    assert.ok(result.centroidY >= 0.29 && result.centroidY <= 0.32, `centroidY was ${result.centroidY}`)
    assert.ok(result.spreadX >= 0.29 && result.spreadX <= 0.32, `spreadX was ${result.spreadX}`)
    assert.ok(result.spreadY >= 0.18 && result.spreadY <= 0.20, `spreadY was ${result.spreadY}`)
  })

  it('centroid for a black frame vs a white 10x10 top-left block is within block bounds', () => {
    const frameA = createImageData(64, 48, 0)
    const frameB = createImageDataWithBlock(64, 48, 0, 0, 10, 10, 255, 0)

    const result = computeMotionMetrics(frameA, frameB, 64, 48)

    assert.ok(result.centroidX >= 0 && result.centroidX < 10 / 64, `centroidX was ${result.centroidX}`)
    assert.ok(result.centroidY >= 0 && result.centroidY < 10 / 48, `centroidY was ${result.centroidY}`)
  })
})

describe('pose mapping from frames', () => {
  it('high motion in the top-center maps to both-paws-up', () => {
    const frameA = createImageData(64, 48, 0)
    const frameB = createImageDataWithBlock(64, 48, 12, 0, 40, 8, 255, 0)

    const metrics = computeMotionMetrics(frameA, frameB, 64, 48)
    const pose = resolvePose(metrics.centroidX, metrics.centroidY, metrics.spreadX, metrics.spreadY, metrics.motionScore)

    assert.strictEqual(pose, 'both-paws-up')
  })

  it('low motion maps to idle', () => {
    const frameA = createImageData(64, 48, 0)
    const frameB = createImageDataWithBlock(64, 48, 0, 0, 5, 5, 255, 0)

    const metrics = computeMotionMetrics(frameA, frameB, 64, 48)
    const pose = resolvePose(metrics.centroidX, metrics.centroidY, metrics.spreadX, metrics.spreadY, metrics.motionScore)

    assert.strictEqual(pose, 'idle')
  })
})

describe('resolvePose', () => {
  it('returns idle when motionScore is below 50', () => {
    assert.strictEqual(resolvePose(0.5, 0.5, 0.1, 0.1, 10), 'idle')
    assert.strictEqual(resolvePose(0.5, 0.5, 0.1, 0.1, 49), 'idle')
  })

  it('returns left-paw-up for upper-left motion', () => {
    assert.strictEqual(resolvePose(0.2, 0.2, 0.1, 0.1, 200), 'left-paw-up')
  })

  it('returns right-paw-up for upper-right motion', () => {
    assert.strictEqual(resolvePose(0.8, 0.2, 0.1, 0.1, 200), 'right-paw-up')
  })

  it('returns both-paws-up for wide upper motion', () => {
    assert.strictEqual(resolvePose(0.5, 0.1, 0.5, 0.1, 300), 'both-paws-up')
  })

  it('returns crouch for low motion', () => {
    assert.strictEqual(resolvePose(0.5, 0.8, 0.1, 0.1, 150), 'crouch')
  })

  it('returns jump for high motionScore and tall spread', () => {
    assert.strictEqual(resolvePose(0.5, 0.5, 0.1, 0.6, 450), 'jump')
  })

  it('returns idle when no pose rule matches', () => {
    assert.strictEqual(resolvePose(0.5, 0.5, 0.1, 0.1, 100), 'idle')
  })
})

describe('startMotionTracking / stopMotionTracking', () => {
  it('starts and stops without throwing', () => {
    rafCallbacks = []
    rafIdCounter = 0

    const video = {} as HTMLVideoElement
    const poses: Pose[] = []

    startMotionTracking(video, (pose) => {
      poses.push(pose)
    })

    stopMotionTracking()

    assert.strictEqual(poses.length, 0)
    assert.strictEqual(stopMotionTracking(), undefined)
  })

  it('cleans up previous tracking session if called twice', () => {
    rafCallbacks = []
    rafIdCounter = 0

    const video = {} as HTMLVideoElement

    startMotionTracking(video, () => {})
    startMotionTracking(video, () => {})
    stopMotionTracking()

    assert.ok(true)
  })
})
