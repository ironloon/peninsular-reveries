import type { SquaresPatternId } from './types.js'

type LiveRegionPriority = 'polite' | 'assertive'

const STATUS_REGION_ID = 'game-status'
const FEEDBACK_REGION_ID = 'game-feedback'

function patternLabel(patternId: SquaresPatternId): string {
  return patternId === 'plus' ? 'Plus' : 'X'
}

function writeLiveRegion(message: string, priority: LiveRegionPriority): void {
  const regionId = priority === 'assertive' ? FEEDBACK_REGION_ID : STATUS_REGION_ID
  const region = document.getElementById(regionId)
  if (!region) {
    return
  }

  region.textContent = ''

  const commit = () => {
    region.textContent = message
  }

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(commit)
    return
  }

  commit()
}

export function announcePatternChange(patternId: SquaresPatternId): void {
  writeLiveRegion(`${patternLabel(patternId)} on.`, 'polite')
}

export function announceMove(patternId: SquaresPatternId, moveCount: number): void {
  writeLiveRegion(`Move ${moveCount}. ${patternLabel(patternId)}.`, 'polite')
}

export function announceRestart(): void {
  writeLiveRegion('Board reset.', 'assertive')
}

export function announceHighScoreContext(presetLabel: string, rulesetLabel: string, bestMoves: number | null): void {
  const scoreText = bestMoves === null ? 'No best score yet.' : `Best is ${bestMoves} moves.`
  writeLiveRegion(`${presetLabel}. ${rulesetLabel}. ${scoreText}`, 'polite')
}

export function announceSolved(moveCount: number, isNewBest: boolean = false): void {
  const bestText = isNewBest ? ' New best.' : ''
  writeLiveRegion(`Solved in ${moveCount} moves.${bestText}`, 'assertive')
}
