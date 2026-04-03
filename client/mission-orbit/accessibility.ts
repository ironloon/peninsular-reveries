import type { BurnResult } from './types.js'

function announce(message: string, priority: 'polite' | 'assertive'): void {
  const targetId = priority === 'assertive' ? 'game-feedback' : 'game-status'
  const element = document.getElementById(targetId)
  if (element) {
    element.textContent = message
  }
}

export function announcePhase(label: string, prompt: string, dayLabel: string): void {
  announce(`${dayLabel}. ${label}. ${prompt}`, 'polite')
}

export function announceCountdown(value: number): void {
  if (value > 0) {
    announce(`T minus ${value}.`, 'assertive')
    return
  }
  announce('Liftoff.', 'assertive')
}

export function announceKeepHolding(): void {
  announce('Still climbing. Hold a little longer before cutoff.', 'polite')
}

export function announceBurnResult(result: BurnResult): void {
  announce(result.detail, result.grade === 'assist' ? 'assertive' : 'polite')
}

export function announceSlowMoCue(message: string): void {
  announce(message, 'assertive')
}

export function announceMissionComplete(missionTime: string): void {
  announce(`Mission complete. Splashdown successful. Welcome home, astronaut. Mission time: ${missionTime}.`, 'assertive')
}

export function updatePhaseDescription(text: string): void {
  const description = document.getElementById('phase-description')
  if (description) {
    description.textContent = text
  }
}

export function moveFocusAfterTransition(elementId: string, delayMs: number = 260): void {
  window.setTimeout(() => {
    const element = document.getElementById(elementId)
    if (element) {
      requestAnimationFrame(() => element.focus())
    }
  }, delayMs)
}