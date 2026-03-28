import type { GameState, Puzzle, SceneItem } from './types.js'

// ── Lazy element cache ───────────────────────────────────────
let puzzleCounterEl: HTMLElement | null = null
let promptTextEl: HTMLElement | null = null
let scoreEl: HTMLElement | null = null
let lettersCountEl: HTMLElement | null = null
let feedbackToastEl: HTMLElement | null = null
let solvedWordEl: HTMLElement | null = null
let finalScoreEl: HTMLElement | null = null
let checkBtnEl: HTMLButtonElement | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null

function getPuzzleCounter(): HTMLElement { return puzzleCounterEl ??= document.getElementById('puzzle-counter')! }
function getPromptText(): HTMLElement { return promptTextEl ??= document.getElementById('prompt-text')! }
function getScore(): HTMLElement { return scoreEl ??= document.getElementById('score')! }
function getLettersCount(): HTMLElement { return lettersCountEl ??= document.getElementById('letters-count')! }
function getFeedbackToast(): HTMLElement { return feedbackToastEl ??= document.getElementById('feedback-toast')! }
function getSolvedWord(): HTMLElement { return solvedWordEl ??= document.getElementById('solved-word')! }
function getFinalScore(): HTMLElement { return finalScoreEl ??= document.getElementById('final-score')! }
function getCheckBtn(): HTMLButtonElement { return checkBtnEl ??= document.getElementById('check-btn') as HTMLButtonElement }

// ── Badge colors (cycle through 5) ──────────────────────────
const BADGE_COLORS = [
  'var(--game-badge-0)',
  'var(--game-badge-1)',
  'var(--game-badge-2)',
  'var(--game-badge-3)',
  'var(--game-badge-4)',
]

// ── Render functions ─────────────────────────────────────────

export function renderScene(puzzle: Puzzle, state: GameState, sceneEl: HTMLElement): void {
  sceneEl.innerHTML = ''

  const collectedIds = new Set(state.collectedLetters.map(l => l.sourceId))
  let firstUncollectedFound = false

  for (let i = 0; i < puzzle.items.length; i++) {
    const item = puzzle.items[i]
    const isCollected = collectedIds.has(item.id)

    const btn = document.createElement('button')
    btn.className = 'scene-item'
    if (isCollected) btn.classList.add('collected')
    btn.dataset.itemId = item.id
    btn.dataset.itemType = item.type
    if (item.type === 'letter' && item.char) {
      btn.dataset.char = item.char
    }
    btn.style.left = `${item.x}%`
    btn.style.top = `${item.y}%`

    if (item.type === 'letter' && item.char) {
      btn.setAttribute('aria-label', `${item.emoji} ${item.label} — contains letter ${item.char}`)
    } else {
      btn.setAttribute('aria-label', `${item.emoji} ${item.label}`)
    }

    if (!isCollected && !firstUncollectedFound) {
      btn.tabIndex = 0
      firstUncollectedFound = true
    } else {
      btn.tabIndex = -1
    }

    const card = document.createElement('div')
    card.className = 'item-card'

    const emojiSpan = document.createElement('span')
    emojiSpan.className = 'item-emoji'
    emojiSpan.textContent = item.emoji
    card.appendChild(emojiSpan)

    if (item.type === 'letter' && item.char) {
      const badge = document.createElement('span')
      badge.className = 'item-badge'
      badge.style.backgroundColor = BADGE_COLORS[i % BADGE_COLORS.length]
      badge.textContent = item.char
      card.appendChild(badge)
    }

    btn.appendChild(card)
    sceneEl.appendChild(btn)
  }
}

export function renderLetterSlots(state: GameState, puzzle: Puzzle, slotsEl: HTMLElement): void {
  slotsEl.innerHTML = ''
  const totalSlots = puzzle.answer.length

  for (let i = 0; i < totalSlots; i++) {
    if (i < state.collectedLetters.length) {
      const letter = state.collectedLetters[i]
      const tile = document.createElement('div')
      tile.className = 'letter-tile'
      if (i === state.selectedTileIndex) tile.classList.add('selected')
      tile.setAttribute('role', 'option')
      tile.tabIndex = 0
      tile.dataset.index = String(i)
      tile.textContent = letter.char
      tile.setAttribute('aria-label', `${letter.char}, position ${i + 1} of ${totalSlots}`)
      slotsEl.appendChild(tile)
    } else {
      const slot = document.createElement('div')
      slot.className = 'empty-slot'
      slot.setAttribute('role', 'option')
      slot.setAttribute('aria-disabled', 'true')
      slot.setAttribute('aria-label', `Empty slot ${i + 1} of ${totalSlots}`)
      slotsEl.appendChild(slot)
    }
  }
}

export function renderGameHeader(
  state: GameState,
  puzzle: Puzzle,
  puzzleIndex: number,
  totalPuzzles: number,
): void {
  getPuzzleCounter().textContent = `${puzzleIndex + 1} / ${totalPuzzles}`
  getPromptText().textContent = puzzle.prompt
  getScore().textContent = `⭐ ${state.score}`
  getScore().setAttribute('aria-label', `Score: ${state.score}`)
  getLettersCount().textContent = `${state.collectedLetters.length} / ${puzzle.answer.length}`
}

export function showScreen(screenId: string): void {
  const track = document.querySelector('.scene-track') as HTMLElement | null
  const current = document.querySelector('.screen.active') as HTMLElement | null
  const target = document.getElementById(screenId)
  if (!target || current === target) return

  if (!current || !track) {
    target.classList.add('active')
    return
  }

  // Position incoming screen to the right (disable transition for initial placement)
  target.style.transition = 'none'
  target.classList.add('active')
  // Force reflow so the browser registers the initial position
  target.offsetHeight

  // Begin pan
  target.style.transition = ''
  current.classList.add('leaving')
  track.classList.add('scene-transitioning')

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    current.classList.remove('active', 'leaving')
    current.style.transform = ''
    track.classList.remove('scene-transitioning')
  }

  target.addEventListener('transitionend', cleanup, { once: true })
  // Fallback timeout (600ms > 500ms transition)
  setTimeout(cleanup, 600)
}

export function showToast(message: string, duration: number): void {
  const toast = getFeedbackToast()
  toast.textContent = message
  toast.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.classList.remove('show')
  }, duration)
}

export function renderCompleteScreen(puzzle: Puzzle, state: GameState): void {
  const container = getSolvedWord()
  container.innerHTML = ''
  for (let i = 0; i < puzzle.answer.length; i++) {
    const span = document.createElement('span')
    span.className = 'solved-letter'
    span.textContent = puzzle.answer[i]
    span.style.animationDelay = `${i * 0.1}s`
    container.appendChild(span)
  }
}

export function renderWinScreen(state: GameState): void {
  getFinalScore().textContent = `⭐ ${state.score}`
}

export function setCheckButtonEnabled(enabled: boolean): void {
  const btn = getCheckBtn()
  if (enabled) {
    btn.removeAttribute('disabled')
    btn.classList.remove('disabled')
  } else {
    btn.setAttribute('disabled', '')
    btn.classList.add('disabled')
  }
}
