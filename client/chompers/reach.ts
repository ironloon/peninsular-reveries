const DEFAULT_ARENA_WIDTH = 640
const DEFAULT_ARENA_HEIGHT = 480
const CHOMP_HALF_WIDTH_RATIO = 0.035
const CHOMP_HALF_WIDTH_MIN_PX = 30.4
const CHOMP_HALF_WIDTH_MAX_PX = 43.2
const CHOMP_COLUMN_BOTTOM_PERCENT = 14
const CHOMP_COLUMN_BASE_HEIGHT_PERCENT = 12
const CHOMP_COLUMN_EXTENSION_HEIGHT_PERCENT = 50
const HIPPO_BOTTOM_PERCENT = 1
const BASE_NECK_HEIGHT_RATIO = 0.14
const BASE_NECK_HEIGHT_MIN_PX = 56
const HEAD_BASE_OFFSET_PX = 8
const HEAD_BOTTOM_OVERLAP_RATIO = 0.06
const HEAD_BOTTOM_OVERLAP_MIN_PX = 10
const HEAD_BOTTOM_OVERLAP_MAX_PX = 18
const HEAD_SHIFT_RATIO = 0.01
const HEAD_SHIFT_MIN_PX = 4

export interface ArenaMetrics {
  readonly width: number
  readonly height: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function percentToPixels(percent: number, size: number): number {
  return (percent / 100) * size
}

export function resolveArenaMetrics(metrics?: ArenaMetrics): ArenaMetrics {
  return {
    width: Math.max(metrics?.width ?? DEFAULT_ARENA_WIDTH, 1),
    height: Math.max(metrics?.height ?? DEFAULT_ARENA_HEIGHT, 1),
  }
}

export function resolveChompLaneMetrics(neckExtension: number, arenaMetrics?: ArenaMetrics): {
  width: number
  height: number
  halfWidthPx: number
  topPercent: number
  chompColumnHeightPercent: number
} {
  const { width, height } = resolveArenaMetrics(arenaMetrics)
  const clampedExtension = clamp(neckExtension, 0, 1)
  const chompColumnHeightPercent = CHOMP_COLUMN_BASE_HEIGHT_PERCENT + clampedExtension * CHOMP_COLUMN_EXTENSION_HEIGHT_PERCENT
  const topPercent = Math.max(0, 100 - CHOMP_COLUMN_BOTTOM_PERCENT - chompColumnHeightPercent)
  const halfWidthPx = clamp(width * CHOMP_HALF_WIDTH_RATIO, CHOMP_HALF_WIDTH_MIN_PX, CHOMP_HALF_WIDTH_MAX_PX)

  return {
    width,
    height,
    halfWidthPx,
    topPercent,
    chompColumnHeightPercent,
  }
}

export function resolveHippoReachMetrics(neckExtension: number, arenaMetrics?: ArenaMetrics): {
  neckHeightPx: number
  headShiftPx: number
  chompColumnHeightPercent: number
} {
  const laneMetrics = resolveChompLaneMetrics(neckExtension, arenaMetrics)
  const clampedExtension = clamp(neckExtension, 0, 1)
  const headShiftPx = -clampedExtension * Math.max(HEAD_SHIFT_MIN_PX, laneMetrics.height * HEAD_SHIFT_RATIO)
  const hippoBottomPx = percentToPixels(HIPPO_BOTTOM_PERCENT, laneMetrics.height)
  const columnTopPx = percentToPixels(laneMetrics.topPercent, laneMetrics.height)
  const baseNeckHeightPx = Math.max(BASE_NECK_HEIGHT_MIN_PX, laneMetrics.height * BASE_NECK_HEIGHT_RATIO)
  const headBottomOverlapPx = clampedExtension
    * clamp(laneMetrics.height * HEAD_BOTTOM_OVERLAP_RATIO, HEAD_BOTTOM_OVERLAP_MIN_PX, HEAD_BOTTOM_OVERLAP_MAX_PX)
  const headBottomReachPx = laneMetrics.height - hippoBottomPx - columnTopPx + headBottomOverlapPx
  const neckHeightPx = Math.max(baseNeckHeightPx, headBottomReachPx - HEAD_BASE_OFFSET_PX - Math.abs(headShiftPx))

  return {
    neckHeightPx,
    headShiftPx,
    chompColumnHeightPercent: laneMetrics.chompColumnHeightPercent,
  }
}