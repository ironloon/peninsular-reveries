export function announceScreen(screen: string): void {
  const el = document.getElementById('game-status')
  if (!el) return
  const messages: Record<string, string> = {
    menu: 'Baking Simulator. Press Start to begin.',
    ingredients: 'Add ingredients to the bowl.',
    kneading: 'Knead the dough by tapping rapidly.',
    shaping: 'Choose a bread shape and drag to form it.',
    proofing: 'Adjust temperature and let the dough rise.',
    baking: 'Control the oven heat and pull bread when golden.',
    result: 'See your final bread score.',
  }
  el.textContent = messages[screen] ?? ''
}

export function announceToast(message: string): void {
  const el = document.getElementById('game-feedback')
  if (el) el.textContent = message
}

export function announcePhase(phase: string): void {
  announceScreen(phase)
}

export function announceIngredient(ingredient: string): void {
  announceToast(`Added ${ingredient}`)
}

export function announceScore(score: number): void {
  const el = document.getElementById('game-status')
  if (el) el.textContent = `Score: ${score}%`
}