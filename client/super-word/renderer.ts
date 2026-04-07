import type { GameState, Puzzle, SceneItem } from './types.js'
import { isReducedMotion } from './animations.js'
import { SIZE_CATEGORY_FRACTION } from './scene-art.js'

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

// ── Badge colors for canvas (hex, cycle through 5) ─────────
const CANVAS_BADGE_COLORS = [
  '#4fc3f7',
  '#aed581',
  '#ffb74d',
  '#f48fb1',
  '#ce93d8',
]

// Emoji font stack: explicit emoji families first so iOS/Android render color emoji on canvas.
// 'serif' fallback for letter characters drawn via strokeText/fillText.
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", serif'
const LETTER_FONT = 'system-ui, -apple-system, sans-serif'

// ── Render functions ─────────────────────────────────────────

function drawOrder(item: SceneItem): number {
  if (item.type === 'letter') return 4
  const isGround = item.zone === 'ground'
  const isLarge = (item.scale ?? 1) >= 1.2
  if (isGround && isLarge) return 0
  if (isGround && !isLarge) return 1
  if (!isGround && isLarge) return 2
  return 3
}

export function renderScene(puzzle: Puzzle, state: GameState, wrapperEl: HTMLElement): void {
  const canvas = wrapperEl.querySelector<HTMLCanvasElement>('#scene-canvas')
  const a11yEl = wrapperEl.querySelector<HTMLElement>('#scene-a11y')
  if (!canvas || !a11yEl) return

  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (w === 0 || h === 0) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  // ── Background ──────────────────────────────────────────
  ctx.clearRect(0, 0, w, h)

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7)
  skyGrad.addColorStop(0, '#7EC8E3')
  skyGrad.addColorStop(1, '#ADD8E6')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, w, h * 0.7)

  ctx.fillStyle = '#5a9e35'
  ctx.fillRect(0, h * 0.7, w, h * 0.3)

  // ── Clouds (deterministic) ───────────────────────────────
  const numClouds = 3 + (puzzle.items.length % 3)
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = 'white'
  for (let i = 0; i < numClouds; i++) {
    const cx = ((puzzle.answer.length * 7 + i * 37) % 80 + 10) / 100 * w
    const cy = ((puzzle.items.length * 5 + i * 23) % 25 + 5) / 100 * h
    const rx = w * 0.07 + i * w * 0.01
    const ry = h * 0.035
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx - rx * 0.45, cy + ry * 0.5, rx * 0.55, ry * 0.65, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + rx * 0.45, cy + ry * 0.5, rx * 0.55, ry * 0.65, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // ── Grass texture ────────────────────────────────────────
  const grassColors = ['#4a8a2a', '#5cb85c']
  ctx.lineWidth = 1.5
  for (let i = 0; i < 30; i++) {
    const hash = (puzzle.answer.charCodeAt(i % puzzle.answer.length) * 17 + i * 31) % 100
    const gx = (hash / 100) * w
    const gTop = h * 0.85 + ((i * 13) % 10) / 10 * h * 0.05
    ctx.strokeStyle = grassColors[i % 2]
    ctx.beginPath()
    ctx.moveTo(gx, h)
    ctx.lineTo(gx + ((i % 3) - 1) * 2, gTop)
    ctx.stroke()
  }

  // ── Draw items ───────────────────────────────────────────
  const collectedIds = new Set(state.collectedLetters.map(l => l.sourceId))
  const firstFocusableId = puzzle.items.find((item) => item.type === 'letter' && !collectedIds.has(item.id))?.id
    ?? puzzle.items.find((item) => !collectedIds.has(item.id))?.id

  const sorted = puzzle.items
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => drawOrder(a.item) - drawOrder(b.item))

  for (const { item, idx } of sorted) {
    const isCollected = collectedIds.has(item.id)
    const px = item.x / 100 * w
    const py = item.y / 100 * h

    const fraction = item.sizeCategory
      ? SIZE_CATEGORY_FRACTION[item.sizeCategory]
      : (item.scale ?? 1) * 0.10
    const fontSize = Math.max(h * 0.04, Math.min(h * 0.38, h * fraction))

    ctx.save()
    ctx.font = `${fontSize}px ${EMOJI_FONT}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    if (isCollected) ctx.globalAlpha = 0.25

    if (item.type === 'letter' && item.char) {
      const badgeRadius = fontSize * 0.55
      ctx.fillStyle = CANVAS_BADGE_COLORS[idx % CANVAS_BADGE_COLORS.length]
      ctx.beginPath()
      ctx.arc(px, py, badgeRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillText(item.emoji, px, py)
      const letterSize = fontSize * 0.35
      const charX = px + fontSize * 0.35
      const charY = py - fontSize * 0.35
      ctx.font = `bold ${letterSize}px ${LETTER_FONT}`
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'
      ctx.lineWidth = Math.max(1, letterSize * 0.15)
      ctx.strokeText(item.char, charX, charY)
      ctx.fillStyle = 'white'
      ctx.fillText(item.char, charX, charY)
    } else {
      ctx.fillText(item.emoji, px, py)
    }

    ctx.restore()
  }

  // ── A11y overlay ─────────────────────────────────────────
  a11yEl.innerHTML = ''
  for (let i = 0; i < puzzle.items.length; i++) {
    const item = puzzle.items[i]
    const isCollected = collectedIds.has(item.id)
    if (isCollected) continue

    const fraction = item.sizeCategory
      ? SIZE_CATEGORY_FRACTION[item.sizeCategory]
      : (item.scale ?? 1) * 0.10
    const fontSize = Math.max(h * 0.04, Math.min(h * 0.38, h * fraction))
    const hitSize = Math.max(44, fontSize)

    const btn = document.createElement('button')
    btn.className = 'sr-overlay-btn'
    btn.style.position = 'absolute'
    btn.style.left = `${item.x}%`
    btn.style.top = `${item.y}%`
    btn.style.width = `${hitSize}px`
    btn.style.height = `${hitSize}px`
    btn.style.transform = 'translate(-50%, -50%)'
    btn.dataset.itemId = item.id
    btn.dataset.itemType = item.type
    if (item.type === 'letter' && item.char) {
      btn.setAttribute('aria-label', `${item.emoji} — tap to collect the letter ${item.char}`)
    } else {
      btn.setAttribute('aria-label', item.emoji)
    }
    btn.tabIndex = item.id === firstFocusableId ? 0 : -1
    a11yEl.appendChild(btn)
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
  getLettersCount().setAttribute('aria-label', `Letters found: ${state.collectedLetters.length} of ${puzzle.answer.length}`)
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
  const sceneCanvas = document.getElementById('scene-canvas') as HTMLElement | null
  const sceneA11y = document.getElementById('scene-a11y') as HTMLElement | null
  const promptBubble = document.querySelector('.prompt-bubble') as HTMLElement | null
  const elements = [promptBubble, sceneCanvas, sceneA11y].filter((element): element is HTMLElement => element !== null)

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

export function setupCanvasRenderer(wrapperEl: HTMLElement, renderFn: () => void): void {
  let debounceTimer = 0
  const observer = new ResizeObserver(() => {
    clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(renderFn, 100)
  })
  observer.observe(wrapperEl)
}
