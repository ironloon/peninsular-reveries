import type { GamePhase, Target } from './types.js'

type LiveRegionPriority = 'polite' | 'assertive'

const STATUS_REGION_ID = 'game-status'
const FEEDBACK_REGION_ID = 'game-feedback'

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

// ── Announcements ─────────────────────────────────────────────────────────────

export function announceReveal(row: number, col: number): void {
  writeLiveRegion(`Revealed, row ${row + 1}, column ${col + 1}`, 'polite')
}

export function announceFound(target: Target): void {
  writeLiveRegion(`You found the ${target.name}! 🎉`, 'assertive')
}

export function announcePhase(phase: GamePhase, target: Target): void {
  switch (phase) {
    case 'meet':
      writeLiveRegion(`Find the ${target.name}!`, 'polite')
      break
    case 'enter':
      writeLiveRegion(`The ${target.name} is hiding!`, 'polite')
      break
    case 'playing':
      writeLiveRegion(`Find the ${target.name}!`, 'polite')
      break
    case 'found':
      writeLiveRegion(`${target.name} found!`, 'polite')
      break
  }
}

export function announceRound(round: number): void {
  writeLiveRegion(`Round ${round}`, 'polite')
}

// ── Focus management ──────────────────────────────────────────────────────────

export function manageFocus(phase: GamePhase): void {
  switch (phase) {
    case 'meet':
    case 'enter': {
      const proceedBtn = document.querySelector<HTMLButtonElement>('.peekaboo-proceed-btn')
      if (proceedBtn) {
        proceedBtn.focus()
      }
      break
    }
    case 'playing': {
      const firstCell = document.querySelector<HTMLButtonElement>('[data-peekaboo-row][data-peekaboo-col]')
      if (firstCell) {
        firstCell.focus()
      }
      break
    }
    case 'found': {
      const playAgainBtn = document.querySelector<HTMLButtonElement>('.peekaboo-play-again-btn')
      if (playAgainBtn) {
        playAgainBtn.focus()
      }
      break
    }
  }
}

// ── ARIA labels ────────────────────────────────────────────────────────────────

export function cellAriaLabel(
  row: number,
  col: number,
  revealed: boolean,
  isTarget: boolean,
  targetName?: string,
): string {
  if (revealed && isTarget && targetName) {
    return `${targetName}, row ${row + 1}, column ${col + 1}`
  }
  if (revealed) {
    return `Revealed, row ${row + 1}, column ${col + 1}`
  }
  return `Hidden, row ${row + 1}, column ${col + 1}`
}