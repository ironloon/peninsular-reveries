// ── Lazy DOM cache ────────────────────────────────────────────
let statusEl: HTMLElement | null = null
let feedbackEl: HTMLElement | null = null

function getStatusEl(): HTMLElement | null {
  return statusEl ??= document.getElementById('game-status')
}

function getFeedbackEl(): HTMLElement | null {
  return feedbackEl ??= document.getElementById('game-feedback')
}

// ── Announcements ─────────────────────────────────────────────

export function announceSceneDescription(description: string): void {
  const el = getStatusEl()
  if (el) el.textContent = description
}

export function announceChoiceResult(text: string): void {
  const el = getFeedbackEl()
  if (el) el.textContent = 'You chose: ' + text
}

export function announceItemEquipped(itemName: string): void {
  const el = getFeedbackEl()
  if (el) el.textContent = 'Holding: ' + itemName + '.'
}

export function announceItemCleared(itemName: string): void {
  const el = getFeedbackEl()
  if (el) el.textContent = 'Put away: ' + itemName + '.'
}

export function announceItemCollected(itemName: string): void {
  const el = getFeedbackEl()
  if (el) el.textContent = 'You found: ' + itemName + '!'
}

export function announceHint(hint: string): void {
  const el = getFeedbackEl()
  if (el) el.textContent = hint
}

export function announceStoryComplete(badgeName: string): void {
  const el = getFeedbackEl()
  if (el) el.textContent = 'You earned the ' + badgeName + '!'
}

export function announceTrailMap(unlockedCount: number, totalCount: number): void {
  const el = getStatusEl()
  if (el) el.textContent = 'Trail map. ' + unlockedCount + ' of ' + totalCount + ' stories unlocked.'
}

// ── Focus management ──────────────────────────────────────────

export function moveFocus(element: HTMLElement): void {
  requestAnimationFrame(() => element.focus())
}

export function moveFocusToFirstChoice(delayMs: number = 100): void {
  setTimeout(() => {
    const el = document.querySelector('.choice-btn') as HTMLElement | null
    if (el) requestAnimationFrame(() => el.focus())
  }, delayMs)
}

export function moveFocusToTrailMap(delayMs: number = 100): void {
  setTimeout(() => {
    const el = document.querySelector('.trail-stop-unlocked') as HTMLElement | null
    if (el) requestAnimationFrame(() => el.focus())
  }, delayMs)
}

export function moveFocusToInventoryBarItem(itemId?: string, delayMs: number = 0): void {
  setTimeout(() => {
    const itemSelector = itemId ? `#inventory-bar [data-inventory-item-id="${itemId}"]` : null
    const el = (itemSelector
      ? document.querySelector(itemSelector)
      : document.querySelector('#inventory-btn')) as HTMLElement | null
    const fallbackEl = document.querySelector('#inventory-btn') as HTMLElement | null
    const target = el ?? fallbackEl
    if (target) requestAnimationFrame(() => target.focus())
  }, delayMs)
}

export function moveFocusToInventoryOverlay(itemId?: string, delayMs: number = 0): void {
  setTimeout(() => {
    const itemSelector = itemId ? `#inventory-overlay [data-inventory-item-id="${itemId}"]` : null
    const el = (itemSelector
      ? document.querySelector(itemSelector)
      : document.querySelector('#inventory-overlay button')) as HTMLElement | null
    const fallbackEl = document.querySelector('#inventory-overlay button') as HTMLElement | null
    const target = el ?? fallbackEl
    if (target) requestAnimationFrame(() => target.focus())
  }, delayMs)
}
