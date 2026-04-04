import { isReducedMotion } from './animations.js'
import { bindReduceMotionToggle } from '../preferences.js'
import { FRUIT_DEFINITIONS, ZEN_ROUND_ITEMS } from './types.js'
import type { GameMode, GameState } from './types.js'

export interface SettingsModalController {
  isOpen: () => boolean
  open: (trigger?: HTMLElement | null) => void
  close: () => void
}

let scoreEl: HTMLElement | null = null
let modeChipEl: HTMLElement | null = null
let timerReadoutEl: HTMLElement | null = null
let livesReadoutEl: HTMLElement | null = null
let comboReadoutEl: HTMLElement | null = null
let gameArenaEl: HTMLElement | null = null
let itemLayerEl: HTMLElement | null = null
let hippoEl: HTMLElement | null = null
let chompColumnEl: HTMLElement | null = null
let finalScoreEl: HTMLElement | null = null
let finalChompedEl: HTMLElement | null = null
let finalMissedEl: HTMLElement | null = null
let finalComboEl: HTMLElement | null = null
let endSummaryEl: HTMLElement | null = null

const itemElements = new Map<number, HTMLElement>()

function getScore(): HTMLElement { return scoreEl ??= document.getElementById('score')! }
function getModeChip(): HTMLElement { return modeChipEl ??= document.getElementById('mode-chip')! }
function getTimerReadout(): HTMLElement { return timerReadoutEl ??= document.getElementById('timer-readout')! }
function getLivesReadout(): HTMLElement { return livesReadoutEl ??= document.getElementById('lives-readout')! }
function getComboReadout(): HTMLElement { return comboReadoutEl ??= document.getElementById('combo-readout')! }
function getGameArena(): HTMLElement { return gameArenaEl ??= document.getElementById('game-arena')! }
function getItemLayer(): HTMLElement { return itemLayerEl ??= document.getElementById('item-layer')! }
function getHippo(): HTMLElement { return hippoEl ??= document.getElementById('hippo')! }
function getChompColumn(): HTMLElement { return chompColumnEl ??= document.getElementById('chomp-column')! }
function getFinalScore(): HTMLElement { return finalScoreEl ??= document.getElementById('final-score')! }
function getFinalChomped(): HTMLElement { return finalChompedEl ??= document.getElementById('final-chomped')! }
function getFinalMissed(): HTMLElement { return finalMissedEl ??= document.getElementById('final-missed')! }
function getFinalCombo(): HTMLElement { return finalComboEl ??= document.getElementById('final-combo')! }
function getEndSummary(): HTMLElement { return endSummaryEl ??= document.getElementById('end-summary')! }

function percentToPixels(percent: number, size: number): number {
  return (percent / 100) * size
}

function modeLabel(mode: GameMode): string {
  if (mode === 'survival') {
    return 'Survival'
  }

  if (mode === 'zen') {
    return 'Zen'
  }

  return 'Rush'
}

function formatTimer(ms: number): string {
  return `${(Math.max(ms, 0) / 1000).toFixed(1)}s`
}

function formatZenProgress(state: GameState): string {
  const remainingFruit = Math.max(0, ZEN_ROUND_ITEMS - (state.itemsChomped + state.itemsMissed))
  return remainingFruit === 1 ? '1 left' : `${remainingFruit} left`
}

function formatLives(lives: number): string {
  const safeLives = Math.max(0, Math.min(lives, 3))
  return `${'♥'.repeat(safeLives)}${'♡'.repeat(3 - safeLives)}`
}

function buildEndSummary(state: GameState): string {
  if (state.mode === 'zen') {
    if (state.itemsMissed === 0) {
      return 'Zen round cleared. Slow pace, clean board, and not a single splat.'
    }

    return 'Zen round complete. No clock, no hazards, just a calmer fruit run from start to finish.'
  }

  if (state.mode === 'survival' && state.lives <= 0) {
    return `You lasted ${Math.max(1, Math.round(state.elapsedMs / 1000))} seconds before the orchard fought back.`
  }

  if (state.bestCombo >= 6) {
    return 'That was a full-on fruit vacuum. The orchard barely had time to blink.'
  }

  if (state.score >= 75) {
    return 'Big round. Fast jaws, clean lanes, and a pile of fruit points.'
  }

  return 'Solid round. A few fruit escaped, but the hippo still ate well.'
}

function renderHud(state: GameState): void {
  const timerReadout = getTimerReadout()
  const livesReadout = getLivesReadout()

  getModeChip().textContent = modeLabel(state.mode)
  getScore().textContent = String(state.score)
  getScore().setAttribute('aria-label', `Score: ${state.score}`)

  if (state.mode === 'rush') {
    timerReadout.hidden = false
    timerReadout.setAttribute('role', 'timer')
    timerReadout.textContent = formatTimer(state.timeRemainingMs)
    timerReadout.setAttribute('aria-label', `${formatTimer(state.timeRemainingMs)} remaining`)
    livesReadout.hidden = true
  } else if (state.mode === 'survival') {
    timerReadout.hidden = true
    timerReadout.removeAttribute('role')
    livesReadout.hidden = false
    livesReadout.textContent = formatLives(state.lives)
    livesReadout.setAttribute('aria-label', `${state.lives} lives remaining`)
  } else {
    const remainingFruit = Math.max(0, ZEN_ROUND_ITEMS - (state.itemsChomped + state.itemsMissed))
    timerReadout.hidden = false
    timerReadout.removeAttribute('role')
    timerReadout.textContent = formatZenProgress(state)
    timerReadout.setAttribute('aria-label', `${remainingFruit} fruit left in the zen round`)
    livesReadout.hidden = true
  }

  getComboReadout().textContent = `Combo x${state.combo}`
}

function renderHippo(state: GameState, arenaWidth: number): void {
  const hippo = getHippo()
  const chompColumn = getChompColumn()
  const hippoX = percentToPixels(state.hippo.x, arenaWidth)

  hippo.style.transform = `translate3d(${hippoX.toFixed(1)}px, 0, 0) translate3d(-50%, 0, 0)`
  hippo.style.setProperty('--neck-height', `${58 + state.hippo.neckExtension * 112}px`)
  hippo.style.setProperty('--head-shift', `${-state.hippo.neckExtension * 108}px`)
  hippo.style.setProperty('--jaw-angle', `${state.hippo.neckExtension * 22}deg`)
  hippo.style.setProperty('--hippo-tilt', `${-state.hippo.neckExtension * 8}deg`)
  hippo.classList.toggle('is-chomping', state.hippo.chomping)

  chompColumn.style.transform = `translate3d(${hippoX.toFixed(1)}px, 0, 0) translate3d(-50%, 0, 0)`
  chompColumn.style.height = `${12 + state.hippo.neckExtension * 50}%`
  chompColumn.classList.toggle('active', state.hippo.chomping)
}

function createItemElement(kind: keyof typeof FRUIT_DEFINITIONS): HTMLElement {
  const item = document.createElement('div')
  item.className = `fruit-item fruit-${kind}`
  item.dataset.kind = kind
  item.setAttribute('aria-hidden', 'true')

  const icon = document.createElement('span')
  icon.className = 'fruit-icon'
  icon.textContent = FRUIT_DEFINITIONS[kind].emoji
  item.appendChild(icon)

  return item
}

function renderItems(state: GameState, arenaWidth: number, arenaHeight: number): void {
  const nextIds = new Set<number>()
  const itemLayer = getItemLayer()

  for (const item of state.items) {
    nextIds.add(item.id)
    let element = itemElements.get(item.id)
    if (!element) {
      element = createItemElement(item.kind)
      itemElements.set(item.id, element)
      itemLayer.appendChild(element)
    }

    const itemX = percentToPixels(item.x, arenaWidth)
    const itemY = percentToPixels(item.y, arenaHeight)
    element.style.transform = `translate3d(${itemX.toFixed(1)}px, ${itemY.toFixed(1)}px, 0) translate3d(-50%, -50%, 0) rotate(${item.rotation}deg)`
  }

  for (const [id, element] of itemElements.entries()) {
    if (nextIds.has(id)) continue
    element.remove()
    itemElements.delete(id)
  }
}

export function renderGame(state: GameState): void {
  const arena = getGameArena()
  const arenaWidth = Math.max(arena.clientWidth, 1)
  const arenaHeight = Math.max(arena.clientHeight, 1)

  renderHud(state)
  renderItems(state, arenaWidth, arenaHeight)
  renderHippo(state, arenaWidth)
  arena.dataset.mode = state.mode
  arena.dataset.phase = state.phase
}

export function renderEndScreen(state: GameState): void {
  getFinalScore().textContent = String(state.score)
  getFinalChomped().textContent = String(state.itemsChomped)
  getFinalMissed().textContent = String(state.itemsMissed)
  getFinalCombo().textContent = String(state.bestCombo)
  getEndSummary().textContent = buildEndSummary(state)
}

export function showScreen(screenId: string): void {
  const track = document.querySelector('.scene-track') as HTMLElement | null
  const target = document.getElementById(screenId)
  const current = document.querySelector('.screen.active') as HTMLElement | null
  if (!target || current === target) return

  if (!track || !current || isReducedMotion()) {
    current?.classList.remove('active', 'leaving')
    target.classList.add('active')
    return
  }

  target.style.transition = 'none'
  target.classList.add('active')
  void target.offsetHeight
  target.style.transition = ''

  current.classList.add('leaving')

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    current.classList.remove('active', 'leaving')
    current.style.transform = ''
  }

  target.addEventListener('transitionend', cleanup, { once: true })
  window.setTimeout(cleanup, 640)
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'))
}

export function setupSettingsModal(): SettingsModalController {
  const modal = document.getElementById('settings-modal') as HTMLElement
  const closeButton = document.getElementById('settings-close') as HTMLButtonElement
  const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-settings-open="true"]'))
  const reduceMotionToggle = document.getElementById('reduce-motion-toggle') as HTMLInputElement | null
  const reduceMotionHelp = document.getElementById('reduce-motion-help') as HTMLElement | null

  let open = false
  let lastFocused: HTMLElement | null = null

  const setExpanded = (expanded: boolean) => {
    for (const trigger of triggers) {
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    }
  }

  const close = () => {
    if (!open) return
    open = false
    modal.hidden = true
    document.body.classList.remove('modal-open')
    setExpanded(false)
    lastFocused?.focus()
  }

  const openModal = (trigger?: HTMLElement | null) => {
    if (open) return
    open = true
    lastFocused = trigger ?? (document.activeElement as HTMLElement | null)
    modal.hidden = false
    document.body.classList.add('modal-open')
    setExpanded(true)
    requestAnimationFrame(() => closeButton.focus())
  }

  for (const trigger of triggers) {
    trigger.addEventListener('click', () => openModal(trigger))
  }

  closeButton.addEventListener('click', close)

  bindReduceMotionToggle(reduceMotionToggle, reduceMotionHelp)

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      close()
    }
  })

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key !== 'Tab') return

    const focusable = getFocusableElements(modal)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  })

  return {
    isOpen: () => open,
    open: openModal,
    close,
  }
}