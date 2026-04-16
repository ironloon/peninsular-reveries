let lastAnnounceTime = 0

export function announceBarrierPlaced(): void {
  const el = document.getElementById('game-feedback')
  if (el) {
    el.setAttribute('aria-live', 'assertive')
    el.textContent = 'Barrier placed.'
  }
}

export function announceBarrierRemoved(): void {
  const el = document.getElementById('game-feedback')
  if (el) {
    el.setAttribute('aria-live', 'assertive')
    el.textContent = 'Barrier removed.'
  }
}

export function announceCursorPosition(row: number, column: number, rows: number, columns: number): void {
  const now = Date.now()
  if (now - lastAnnounceTime < 300) return
  lastAnnounceTime = now

  const el = document.getElementById('game-status')
  if (el) {
    el.setAttribute('aria-live', 'polite')
    el.textContent = `Row ${row + 1} of ${rows}, column ${column + 1} of ${columns}`
  }
}

export function announceBarriersCleared(): void {
  const el = document.getElementById('game-feedback')
  if (el) {
    el.setAttribute('aria-live', 'assertive')
    el.textContent = 'All barriers cleared.'
  }
}

export function updateCanvasLabel(
  canvas: HTMLCanvasElement,
  barrierCount: number,
  maxBarriers: number,
  theme: string,
): void {
  canvas.setAttribute(
    'aria-label',
    `Waterwall ${theme} theme. ${barrierCount} of ${maxBarriers} barriers placed.`,
  )
}
