import { FRUIT_DEFINITIONS } from './types.js'
import type { FruitKind, GameMode, GameState } from './types.js'

function announce(message: string, priority: 'polite' | 'assertive'): void {
  const targetId = priority === 'assertive' ? 'game-feedback' : 'game-status'
  const target = document.getElementById(targetId)
  if (target) target.textContent = message
}

function modeLabel(mode: GameMode): string {
  return mode === 'survival' ? 'Survival' : 'Rush'
}

export function announceGameStart(mode: GameMode): void {
  if (mode === 'survival') {
    announce('Survival mode. Three hearts. Missed fruit costs a life. Good luck.', 'polite')
    return
  }

  announce('Rush mode. Sixty seconds on the clock. Start chomping.', 'polite')
}

export function announceChomp(kind: FruitKind, scoreDelta: number, combo: number): void {
  const fruit = FRUIT_DEFINITIONS[kind]
  const comboText = combo > 1 ? ` Combo ${combo}.` : ''
  announce(`Chomped ${fruit.label}. ${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} points.${comboText}`, 'assertive')
}

export function announceHazard(kind: FruitKind, mode: GameMode, lives: number): void {
  const item = FRUIT_DEFINITIONS[kind]
  if (kind === 'bomb' && mode === 'survival') {
    announce(`Boom. ${item.label}. ${lives} hearts left.`, 'assertive')
    return
  }

  announce(`Oof. ${item.label}. Watch the hazards.`, 'assertive')
}

export function announceMiss(mode: GameMode, count: number, lives: number): void {
  if (count <= 0) return

  if (mode === 'survival') {
    announce(`${count} fruit ${count === 1 ? 'splatted' : 'splatted'}. ${lives} hearts left.`, 'assertive')
    return
  }

  announce(`${count} fruit ${count === 1 ? 'got away' : 'got away'}. Keep moving.`, 'polite')
}

export function announceTimeWarning(seconds: number): void {
  announce(`${seconds} seconds left.`, 'assertive')
}

export function announceGameOver(state: GameState): void {
  announce(`Game over. ${modeLabel(state.mode)} mode finished with ${state.score} points and a best combo of ${state.bestCombo}.`, 'assertive')
}

export function moveFocus(element: HTMLElement): void {
  requestAnimationFrame(() => element.focus())
}

export function moveFocusAfterTransition(elementId: string, delayMs: number = 300): void {
  window.setTimeout(() => {
    const target = document.getElementById(elementId)
    if (target) requestAnimationFrame(() => target.focus())
  }, delayMs)
}