export function animateIngredient(id: string): void {
  const btn = document.querySelector(`[data-ingredient="${id}"]`) as HTMLElement | null
  if (btn) {
    btn.classList.add('added')
    btn.setAttribute('aria-disabled', 'true')
    btn.style.animation = 'pop 0.3s ease'
  }
}

export function animateKneadHit(): void {
  const area = document.getElementById('knead-area')
  if (area) {
    area.classList.remove('knead-hit')
    // Force reflow
    void area.offsetWidth
    area.classList.add('knead-hit')
  }
}

export function animatePhaseTransition(_phase: string): void {
  const gameScreen = document.getElementById('game-screen')
  if (gameScreen) {
    gameScreen.classList.remove('phase-flash')
    void gameScreen.offsetWidth
    gameScreen.classList.add('phase-flash')
  }
}