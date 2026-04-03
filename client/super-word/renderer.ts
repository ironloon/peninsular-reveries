import type { GameState, Puzzle } from './types.js'
import { isReducedMotion } from './animations.js'

// ── Lazy element cache ───────────────────────────────────────
let puzzleCounterEl: HTMLElement | null = null
let promptTextEl: HTMLElement | null = null
let scoreEl: HTMLElement | null = null
let lettersCountEl: HTMLElement | null = null
let finalScoreEl: HTMLElement | null = null
let checkBtnEl: HTMLButtonElement | null = null

function getPuzzleCounter(): HTMLElement { return puzzleCounterEl ??= document.getElementById('puzzle-counter')! }
function getPromptText(): HTMLElement { return promptTextEl ??= document.getElementById('prompt-text')! }
function getScore(): HTMLElement { return scoreEl ??= document.getElementById('score')! }
function getLettersCount(): HTMLElement { return lettersCountEl ??= document.getElementById('letters-count')! }
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
  const firstFocusableId = puzzle.items.find((item) => item.type === 'letter' && !collectedIds.has(item.id))?.id
    ?? puzzle.items.find((item) => !collectedIds.has(item.id))?.id

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

    if (isCollected) {
      btn.tabIndex = -1
      btn.setAttribute('aria-hidden', 'true')
    } else if (item.id === firstFocusableId) {
      btn.tabIndex = 0
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

export function renderLetterSlots(
  state: GameState,
  puzzle: Puzzle,
  slotsEl: HTMLElement,
  options: { pendingIndices?: Iterable<number> } = {},
): void {
  slotsEl.innerHTML = ''
  const totalSlots = puzzle.answer.length
  const pendingIndices = new Set(options.pendingIndices ?? [])

  for (let i = 0; i < totalSlots; i++) {
    if (i < state.collectedLetters.length) {
      const letter = state.collectedLetters[i]
      const isPending = pendingIndices.has(i)
      const tile = document.createElement('div')
      tile.className = 'letter-tile'
      if (isPending) tile.classList.add('pending-flight')
      if (i === state.selectedTileIndex) tile.classList.add('selected')
      tile.dataset.index = String(i)
      tile.textContent = letter.char
      if (isPending) {
        tile.setAttribute('aria-hidden', 'true')
        tile.setAttribute('role', 'presentation')
        tile.tabIndex = -1
      } else {
        tile.setAttribute('role', 'option')
        tile.tabIndex = 0
        tile.setAttribute('aria-label', `${letter.char}, position ${i + 1} of ${totalSlots}`)
      }
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

  if (isReducedMotion()) {
    // Instant cut — no pan animation
    current.classList.remove('active')
    target.classList.add('active')
    return
  }

  // Position incoming screen to the right (disable transition for initial placement)
  target.style.transition = 'none'
  target.classList.add('active')
  // Force reflow so the browser registers the initial position
  void target.offsetHeight

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

export function showCelebrationPopup(
  word: string,
  onComplete: () => void,
): void {
  const popup = document.getElementById('celebration-popup')!
  const wordContainer = document.getElementById('celebration-word')!
  const continueBtn = document.getElementById('celebration-continue-btn')!

  wordContainer.innerHTML = ''
  for (let i = 0; i < word.length; i++) {
    const span = document.createElement('span')
    span.className = 'solved-letter'
    span.textContent = word[i]
    span.style.animationDelay = `${i * 0.1}s`
    wordContainer.appendChild(span)
  }

  popup.hidden = false
  popup.classList.add('show')
  popup.classList.remove('hiding')

  continueBtn.focus()

  const dismiss = () => {
    continueBtn.removeEventListener('click', dismiss)
    const fadeOutDuration = isReducedMotion() ? 0 : 200
    popup.classList.add('hiding')
    setTimeout(() => {
      popup.hidden = true
      popup.classList.remove('show', 'hiding')
      onComplete()
    }, fadeOutDuration)
  }

  continueBtn.addEventListener('click', dismiss)
}

export function slideSceneTransition(
  refreshCallback: () => void,
  onComplete: () => void,
): void {
  const scene = document.getElementById('scene')
  const promptBubble = document.querySelector('.prompt-bubble') as HTMLElement | null
  const elements = [promptBubble, scene].filter((element): element is HTMLElement => element !== null)

  if (isReducedMotion() || elements.length === 0 || typeof elements[0].animate !== 'function') {
    refreshCallback()
    onComplete()
    return
  }

  const animateGroup = (
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ): Promise<void> => Promise.all(
    elements.map((element) => {
      element.getAnimations().forEach((animation) => animation.cancel())
      return element.animate(keyframes, options).finished.catch(() => undefined)
    }),
  ).then(() => undefined)

  animateGroup([
    { opacity: 1, transform: 'translate3d(0, 0, 0)' },
    { opacity: 0, transform: 'translate3d(-8%, 0, 0)' },
  ], {
    duration: 180,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    fill: 'forwards',
  }).then(() => {
    refreshCallback()

    for (const element of elements) {
      element.style.opacity = '0'
      element.style.transform = 'translate3d(8%, 0, 0)'
    }

    requestAnimationFrame(() => {
      animateGroup([
        { opacity: 0, transform: 'translate3d(8%, 0, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      ], {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }).then(() => {
        for (const element of elements) {
          element.style.opacity = ''
          element.style.transform = ''
        }
        onComplete()
      })
    })
  })
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

// ── Settings Modal ───────────────────────────────────────────

export function setupSettingsModal(onPlay: () => void): void {
  const modal = document.getElementById('settings-modal')
  const openBtn = document.getElementById('settings-open')
  const closeBtn = document.getElementById('settings-close')
  const playBtn = document.getElementById('settings-play-btn') as HTMLButtonElement | null
  const difficultySelect = document.getElementById('puzzle-difficulty-select') as HTMLSelectElement | null

  if (!modal || !openBtn || !difficultySelect) return

  const modalEl = modal
  const openButton = openBtn

  let previousFocus: HTMLElement | null = null

  function getFocusableElements(): HTMLElement[] {
    return Array.from(
      modalEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('hidden'))
  }

  function openModal(): void {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton
    modalEl.hidden = false
    openButton.setAttribute('aria-expanded', 'true')
    requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements()
      ;(firstFocusable ?? modalEl).focus()
    })
  }

  function closeModal(): void {
    modalEl.hidden = true
    openButton.setAttribute('aria-expanded', 'false')
    ;(previousFocus ?? openButton).focus()
  }

  // Expose open/close for gamepad Start button
  window.__settingsToggle = () => {
    if (modalEl.hidden) openModal()
    else closeModal()
  }

  openButton.addEventListener('click', openModal)

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal)
  }

  // Close on backdrop click
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal()
  })

  // Close on Escape
  modalEl.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeModal()
      return
    }

    if (e.key === 'Tab') {
      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        e.preventDefault()
        modalEl.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  })

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      closeModal()
      onPlay()
    })
  }
}
