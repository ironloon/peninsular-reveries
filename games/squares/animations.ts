import { isReducedMotion } from '../../client/game-animations.js'
import {
  SQUARES_CELEBRATION_PATTERNS,
  type SquaresBoard,
  type SquaresCelebrationPatternId,
  type SquaresCoordinate,
} from './types.js'

export { isReducedMotion }

export type SquaresCelebrationStyle = 'snake' | 'wave' | 'diagonal-fan' | 'checker' | 'column'

export interface SquaresAnimationCell {
  readonly coordinate: SquaresCoordinate
  readonly element: HTMLElement
}

export interface SquaresAnimationOptions {
  readonly reducedMotion?: boolean
  readonly baseDelayMs?: number
}

const CELEBRATION_STYLE_BY_PATTERN: Readonly<Record<SquaresCelebrationPatternId, SquaresCelebrationStyle>> = {
  'ripple-ring': 'wave',
  'cross-bloom': 'snake',
  sunburst: 'diagonal-fan',
  'checker-flash': 'checker',
  'column-sweep': 'column',
}

function animateElement(
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  fallbackMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof element.animate !== 'function') {
      setTimeout(resolve, fallbackMs)
      return
    }

    const animation = element.animate(keyframes, options)
    animation.finished.then(() => resolve()).catch(() => resolve())
    setTimeout(resolve, fallbackMs)
  })
}

function allCoordinates(board: SquaresBoard): SquaresCoordinate[] {
  const coordinates: SquaresCoordinate[] = []
  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < (board[row]?.length ?? 0); column += 1) {
      coordinates.push({ row, column })
    }
  }
  return coordinates
}

function coordinateKey(coordinate: SquaresCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`
}

function groupBy<T>(items: readonly T[], groupFor: (item: T) => number): readonly T[][] {
  const groups = new Map<number, T[]>()

  for (const item of items) {
    const key = groupFor(item)
    const group = groups.get(key)
    if (group) {
      group.push(item)
      continue
    }

    groups.set(key, [item])
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left - right)
    .map(([, group]) => group)
}

export function getCelebrationStyle(patternId: SquaresCelebrationPatternId): SquaresCelebrationStyle {
  return CELEBRATION_STYLE_BY_PATTERN[patternId]
}

export function buildCelebrationFrames(
  board: SquaresBoard,
  style: SquaresCelebrationStyle,
): readonly SquaresCoordinate[][] {
  const coordinates = allCoordinates(board)

  switch (style) {
    case 'snake':
      return groupBy(coordinates, (coordinate) => coordinate.row).map((group, groupIndex) =>
        groupIndex % 2 === 0 ? group : [...group].reverse(),
      )
    case 'wave':
      return groupBy(coordinates, (coordinate) => coordinate.row + coordinate.column)
    case 'diagonal-fan':
      return groupBy(coordinates, (coordinate) => coordinate.column - coordinate.row)
    case 'checker':
      return groupBy(coordinates, (coordinate) => (coordinate.row + coordinate.column) % 2)
    case 'column':
      return groupBy(coordinates, (coordinate) => coordinate.column)
    default:
      return [coordinates]
  }
}

export function randomCelebrationPatternId(): SquaresCelebrationPatternId {
  const patterns = SQUARES_CELEBRATION_PATTERNS
  return patterns[Math.floor(Math.random() * patterns.length)].id
}

export async function playMoveFeedback(
  cells: readonly HTMLElement[],
  options: SquaresAnimationOptions = {},
): Promise<void> {
  const reducedMotion = options.reducedMotion ?? isReducedMotion()
  const keyframes = reducedMotion
    ? [
      { filter: 'brightness(1)', outlineColor: 'rgba(255,255,255,0)', offset: 0 },
      { filter: 'brightness(1.12)', outlineColor: 'rgba(255,255,255,0.72)', offset: 0.5 },
      { filter: 'brightness(1)', outlineColor: 'rgba(255,255,255,0)', offset: 1 },
    ]
    : [
      { transform: 'scale(1)', filter: 'brightness(1)', offset: 0 },
      { transform: 'scale(0.96)', filter: 'brightness(0.92)', offset: 0.22 },
      { transform: 'scale(1.04)', filter: 'brightness(1.12)', offset: 0.58 },
      { transform: 'scale(1)', filter: 'brightness(1)', offset: 1 },
    ]

  await Promise.all(
    cells.map((cell) =>
      animateElement(cell, keyframes, {
        duration: reducedMotion ? 180 : 260,
        easing: reducedMotion ? 'ease-out' : 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'none',
      }, 320),
    ),
  )
}

export async function playSolvedCelebration(
  cells: readonly SquaresAnimationCell[],
  board: SquaresBoard,
  patternId: SquaresCelebrationPatternId,
  options: SquaresAnimationOptions = {},
): Promise<void> {
  const reducedMotion = options.reducedMotion ?? isReducedMotion()
  const frames = buildCelebrationFrames(board, getCelebrationStyle(patternId))
  const cellByKey = new Map(cells.map((cell) => [coordinateKey(cell.coordinate), cell.element]))
  const baseDelayMs = options.baseDelayMs ?? (reducedMotion ? 60 : 110)
  const animations: Promise<void>[] = []

  frames.forEach((frame, frameIndex) => {
    for (const coordinate of frame) {
      const element = cellByKey.get(coordinateKey(coordinate))
      if (!element) {
        continue
      }

      const delay = frameIndex * baseDelayMs
      animations.push(
        new Promise((resolve) => {
          setTimeout(() => {
            void animateElement(
              element,
              reducedMotion
                ? [
                  { filter: 'saturate(1) brightness(1)', offset: 0 },
                  { filter: 'saturate(1.18) brightness(1.16)', offset: 0.5 },
                  { filter: 'saturate(1) brightness(1)', offset: 1 },
                ]
                : [
                  { transform: 'translate3d(0, 0, 0) scale(1)', filter: 'brightness(1)', offset: 0 },
                  { transform: 'translate3d(0, -3px, 0) scale(1.04)', filter: 'brightness(1.14)', offset: 0.45 },
                  { transform: 'translate3d(0, 0, 0) scale(1)', filter: 'brightness(1)', offset: 1 },
                ],
              {
                duration: reducedMotion ? 260 : 480,
                easing: reducedMotion ? 'ease-out' : 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'none',
              },
              540,
            ).finally(resolve)
          }, delay)
        }),
      )
    }
  })

  await Promise.all(animations)
}
