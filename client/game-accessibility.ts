export function announce(message: string, priority: 'polite' | 'assertive'): void {
  const targetId = priority === 'assertive' ? 'game-feedback' : 'game-status'
  const target = document.getElementById(targetId)
  if (target) target.textContent = message
}

export function moveFocusAfterTransition(elementId: string, delayMs: number = 260): void {
  window.setTimeout(() => {
    requestAnimationFrame(() => {
      document.getElementById(elementId)?.focus()
    })
  }, delayMs)
}
