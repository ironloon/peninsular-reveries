import type { ItemId, SpotOnState } from './types.js'

// ── Input callbacks ──────────────────────────────────────────────────────────

export interface SpotOnInputCallbacks {
  onStart?: () => void
  onPickUpItem?: (itemId: ItemId) => void
  onPlaceItem?: (surfaceId: string, cellIndex: number) => void
  onDropItem?: () => void
  onNewRoom?: () => void
  onToggleMenu?: () => void
  /** Called to request focus on the nearest empty cell (for keyboard accessibility while carrying) */
  onFocusNearestEmptyCell?: () => void
}

// ── Keyboard input ───────────────────────────────────────────────────────────

function isModalOpen(): boolean {
  const modal = document.getElementById('settings-modal')
  return Boolean(modal && !modal.hidden)
}

function getFocusableItemsAndCells(): HTMLElement[] {
  const items = Array.from(document.querySelectorAll<HTMLElement>('.room-item:not(.room-item--placed)'))
  const cells = Array.from(document.querySelectorAll<HTMLElement>('.room-cell'))
  return [...items, ...cells].filter((el) => {
    if (!el || el.closest('[hidden]')) return false
    return el.getClientRects().length > 0
  })
}

function getEmptyCells(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.room-cell:not(.room-cell--occupied)'))
    .filter((el) => el.getClientRects().length > 0)
}

function moveFocusToNext(elements: HTMLElement[], direction: 'forward' | 'backward'): void {
  const active = document.activeElement
  if (!active || !(active instanceof HTMLElement)) {
    if (elements.length > 0) {
      elements[0].focus({ preventScroll: true })
    }
    return
  }

  const currentIndex = elements.indexOf(active)
  if (currentIndex === -1) {
    elements[0]?.focus({ preventScroll: true })
    return
  }

  if (direction === 'forward') {
    const next = elements[(currentIndex + 1) % elements.length]
    next?.focus({ preventScroll: true })
  } else {
    const prev = elements[(currentIndex - 1 + elements.length) % elements.length]
    prev?.focus({ preventScroll: true })
  }
}

function focusNearestEmptyCell(): void {
  const emptyCells = getEmptyCells()
  if (emptyCells.length > 0) {
    emptyCells[0].focus({ preventScroll: true })
  }
}

let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let itemClickHandler: ((event: Event) => void) | null = null
let cellClickHandler: ((event: Event) => void) | null = null
let newRoomClickHandler: (() => void) | null = null
let startClickHandler: (() => void) | null = null
let gamepadTimer: ReturnType<typeof setInterval> | null = null

// We need read-only access to state for carrying logic
let currentState: SpotOnState | null = null

export function updateSpotOnInputState(state: SpotOnState): void {
  currentState = state
}

export function setupSpotOnInput(callbacks: SpotOnInputCallbacks = {}): void {
  cleanupSpotOnInput()

  keydownHandler = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return
    if (event.ctrlKey || event.altKey || event.metaKey) return

    const target = event.target as Element | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

    if (event.key === 'Escape') {
      event.preventDefault()
      callbacks.onDropItem?.()
      return
    }

    if (isModalOpen()) return

    if (event.key === 'Enter' || event.key === ' ') {
      if (target instanceof HTMLElement) {
        const itemId = target.dataset?.itemId
        if (itemId) {
          event.preventDefault()
          // If carrying this item, drop it
          if (currentState?.phase === 'carrying' && currentState.carriedItemId === itemId) {
            callbacks.onDropItem?.()
            return
          }
          callbacks.onPickUpItem?.(itemId as ItemId)
          return
        }
        const surfaceId = target.dataset?.surfaceId
        const cellIndexStr = target.dataset?.cellIndex
        if (surfaceId !== undefined && cellIndexStr !== undefined) {
          event.preventDefault()
          const cellIndex = Number(cellIndexStr)
          // If cell is occupied, pick up the item from the cell
          if (target.dataset.itemId) {
            callbacks.onPickUpItem?.(target.dataset.itemId as ItemId)
            return
          }
          // Empty cell: place carried item
          callbacks.onPlaceItem?.(surfaceId, cellIndex)
          return
        }
      }
    }

    if (event.key === 'Tab') {
      const elements = getFocusableItemsAndCells()
      moveFocusToNext(elements, event.shiftKey ? 'backward' : 'forward')
      event.preventDefault()
      return
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      const elements = getFocusableItemsAndCells()
      moveFocusToNext(elements, 'forward')
      event.preventDefault()
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      const elements = getFocusableItemsAndCells()
      moveFocusToNext(elements, 'backward')
      event.preventDefault()
      return
    }
  }

  document.addEventListener('keydown', keydownHandler)

  // Item click handling — detect carrying state
  itemClickHandler = (event: Event): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest<HTMLButtonElement>('.room-item')
    const itemId = button?.dataset.itemId
    if (!itemId) return

    // If carrying the clicked item, drop it
    if (currentState?.phase === 'carrying' && currentState.carriedItemId === itemId) {
      callbacks.onDropItem?.()
      return
    }

    callbacks.onPickUpItem?.(itemId as ItemId)
    // After picking up, move focus to nearest empty cell
    requestAnimationFrame(() => {
      focusNearestEmptyCell()
    })
  }

  // Cell click handling
  cellClickHandler = (event: Event): void => {
    const target = event.target
    if (!(target instanceof Element)) return
    const cell = target.closest<HTMLElement>('.room-cell')
    if (!cell) return
    const surfaceId = cell.dataset.surfaceId
    const cellIndexStr = cell.dataset.cellIndex
    if (surfaceId === undefined || cellIndexStr === undefined) return

    const cellIndex = Number(cellIndexStr)

    // If cell is occupied, pick up the item
    if (cell.dataset.itemId) {
      callbacks.onPickUpItem?.(cell.dataset.itemId as ItemId)
      return
    }

    // Empty cell: place carried item if carrying
    callbacks.onPlaceItem?.(surfaceId, cellIndex)
  }

  document.addEventListener('click', itemClickHandler)
  document.addEventListener('click', cellClickHandler)

  // Gamepad polling (basic)
  const GAMEPAD_POLL_INTERVAL = 200
  gamepadTimer = setInterval(() => {
    const gamepads = navigator.getGamepads?.() ?? []
    for (const gamepad of gamepads) {
      if (!gamepad) continue

      // A button (button 0)
      if (gamepad.buttons[0]?.pressed) {
        const active = document.activeElement
        if (active instanceof HTMLElement) {
          active.click()
        }
      }

      // Start button (button 9) — toggle menu
      if (gamepad.buttons[9]?.pressed) {
        callbacks.onToggleMenu?.()
      }

      break
    }
  }, GAMEPAD_POLL_INTERVAL)
}

export function cleanupSpotOnInput(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }

  if (itemClickHandler) {
    document.removeEventListener('click', itemClickHandler)
    itemClickHandler = null
  }

  if (cellClickHandler) {
    document.removeEventListener('click', cellClickHandler)
    cellClickHandler = null
  }

  if (newRoomClickHandler) {
    const btn = document.getElementById('new-room-btn')
    if (btn) btn.removeEventListener('click', newRoomClickHandler)
    newRoomClickHandler = null
  }

  if (startClickHandler) {
    const btn = document.getElementById('start-btn')
    if (btn) btn.removeEventListener('click', startClickHandler)
    startClickHandler = null
  }

  if (gamepadTimer !== null) {
    clearInterval(gamepadTimer)
    gamepadTimer = null
  }

  currentState = null
}