import type { GameState } from './types.js'

declare global {
  interface Window {
    __settingsToggle?: () => void
  }
}

export interface InputCallbacks {
  onChoiceMade: (choiceIndex: number) => void
  onInventoryOpen: () => void
  onInventoryClose: () => void
  onInventoryItemToggle: (itemId: string) => void
  onRestart: () => void
}

// ── Module-level gamepad state ───────────────────────────────
let gamepadFrameId: number | null = null
const prevButtons: boolean[] = []
let stickCooldown = 0
let prevStickDir = ''
const STICK_THRESHOLD = 0.5
const STICK_COOLDOWN_FRAMES = 12

export function setupInput(
  getState: () => GameState,
  callbacks: InputCallbacks,
): void {
  const gameArea = document.getElementById('game-area')!
  gameArea.style.touchAction = 'manipulation'

  // ── Context detection ─────────────────────────────────────
  function getContext(): 'scene-view' | 'completion-view' {
    const screen = gameArea.dataset.activeScreen
    if (screen === 'completion-view') return 'completion-view'
    return 'scene-view'
  }

  function isInventoryOpen(): boolean {
    const overlay = document.getElementById('inventory-overlay')
    return !!overlay && !overlay.hidden
  }

  function isSettingsOpen(): boolean {
    const modal = document.getElementById('settings-modal')
    return modal instanceof HTMLElement && !modal.hidden
  }

  function getModalFocusables(): HTMLElement[] {
    const modal = document.getElementById('settings-modal')
    if (!(modal instanceof HTMLElement) || modal.hidden) {
      return []
    }

    return Array.from(modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => !element.closest('[hidden]') && element.getClientRects().length > 0)
  }

  // ── Navigation helpers ────────────────────────────────────
  function getChoiceButtons(): HTMLElement[] {
    return Array.from(document.querySelectorAll('.choice-btn')) as HTMLElement[]
  }

  function getInventoryButtons(): HTMLElement[] {
    return Array.from(document.querySelectorAll('#inventory-bar button')) as HTMLElement[]
  }

  function getSceneFocusables(): HTMLElement[] {
    return [...getChoiceButtons(), ...getInventoryButtons()]
  }

  function getOverlayButtons(): HTMLElement[] {
    return Array.from(document.querySelectorAll('#inventory-overlay button')) as HTMLElement[]
  }

  function navigateList(items: HTMLElement[], direction: 'ArrowUp' | 'ArrowDown'): void {
    if (items.length === 0) return
    const focused = document.activeElement as HTMLElement
    const currentIdx = items.indexOf(focused)
    if (currentIdx === -1) {
      items[0].focus()
      return
    }
    const nextIdx = direction === 'ArrowUp' ? currentIdx - 1 : currentIdx + 1
    const next = items[nextIdx]
    if (next) next.focus()
  }

  // ── Keyboard ──────────────────────────────────────────────
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (isSettingsOpen()) {
      return
    }

    if (isInventoryOpen()) {
      if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        callbacks.onInventoryClose()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateList(getOverlayButtons(), e.key)
      }
      return
    }

    const context = getContext()

    if (context === 'scene-view') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateList(getSceneFocusables(), e.key)
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        callbacks.onInventoryOpen()
      }
    } else if (context === 'completion-view') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        callbacks.onRestart()
      }
    }
  })

  // ── Touch/Pointer (event delegation on #game-area) ────────
  gameArea.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.closest('#play-again-btn')) {
      callbacks.onRestart()
      return
    }

    if (target.closest('#inventory-close-btn')) {
      callbacks.onInventoryClose()
      return
    }

    if (target.closest('#menu-btn')) {
      window.__settingsToggle?.()
      return
    }

    if (target.closest('#inventory-btn')) {
      callbacks.onInventoryOpen()
      return
    }

    const inventoryItemEl = target.closest('[data-inventory-item-id]') as HTMLElement | null
    if (inventoryItemEl) {
      const itemId = inventoryItemEl.dataset.inventoryItemId
      if (itemId) callbacks.onInventoryItemToggle(itemId)
      return
    }

    const choiceEl = target.closest('[data-choice-index]') as HTMLElement | null
    if (choiceEl) {
      const idx = parseInt(choiceEl.dataset.choiceIndex ?? '-1', 10)
      if (idx >= 0) callbacks.onChoiceMade(idx)
    }
  })

  // ── Gamepad ───────────────────────────────────────────────
  function activateFocused(): void {
    if (isSettingsOpen()) {
      const modalFocusables = getModalFocusables()
      const activeModalElement = document.activeElement as HTMLElement | null

      if (activeModalElement && modalFocusables.includes(activeModalElement)) {
        activeModalElement.click()
      } else {
        modalFocusables[0]?.focus()
      }
      return
    }

    const focused = document.activeElement as HTMLElement | null
    if (!focused) return

    if (focused instanceof HTMLButtonElement || focused instanceof HTMLAnchorElement) {
      focused.click()
      return
    }

    if (getContext() === 'completion-view') {
      callbacks.onRestart()
    }
  }

  function navigateDirection(dir: 'ArrowUp' | 'ArrowDown'): void {
    if (isSettingsOpen()) {
      navigateList(getModalFocusables(), dir)
      return
    }

    const context = getContext()
    if (isInventoryOpen()) {
      navigateList(getOverlayButtons(), dir)
    } else if (context === 'scene-view') {
      navigateList(getSceneFocusables(), dir)
    }
  }

  function pollGamepad(): void {
    if (document.visibilityState !== 'visible') {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
      return
    }

    const gamepads = navigator.getGamepads?.()
    if (!gamepads) {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
      return
    }

    let gp: Gamepad | null = null
    for (const pad of gamepads) {
      if (pad?.connected) { gp = pad; break }
    }

    if (!gp) {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
      return
    }

    // Edge-triggered button detection
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed
      const wasPressed = prevButtons[i] ?? false

      if (pressed && !wasPressed) {
        switch (i) {
          case 0: // A — select
            activateFocused()
            break
          case 1: // B — back
            if (isSettingsOpen()) {
              window.__settingsToggle?.()
            } else if (isInventoryOpen()) {
              callbacks.onInventoryClose()
            } else if (getContext() === 'completion-view') {
              callbacks.onRestart()
            }
            break
          case 9: // Start — settings
            window.__settingsToggle?.()
            break
          case 12: // D-pad up
            navigateDirection('ArrowUp')
            break
          case 13: // D-pad down
            navigateDirection('ArrowDown')
            break
        }
      }

      prevButtons[i] = pressed
    }

    // Analog stick (axes[1] for vertical, dead zone ±0.5, ~200ms debounce)
    if (stickCooldown > 0) {
      stickCooldown--
    } else if (gp.axes.length >= 2) {
      const ly = gp.axes[1]
      let dir = ''
      if (Math.abs(ly) > STICK_THRESHOLD) {
        dir = ly > 0 ? 'ArrowDown' : 'ArrowUp'
      }
      if (dir && dir !== prevStickDir) {
        navigateDirection(dir as 'ArrowUp' | 'ArrowDown')
        stickCooldown = STICK_COOLDOWN_FRAMES
      }
      prevStickDir = dir
    }

    gamepadFrameId = requestAnimationFrame(pollGamepad)
  }

  // Start polling if a gamepad is already connected
  const existingGamepads = navigator.getGamepads?.() ?? []
  if (Array.from(existingGamepads).some(gp => gp?.connected)) {
    if (gamepadFrameId === null) {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
    }
  }

  window.addEventListener('gamepadconnected', () => {
    document.body.classList.add('gamepad-active')
    if (gamepadFrameId === null) {
      gamepadFrameId = requestAnimationFrame(pollGamepad)
    }
  })

  window.addEventListener('gamepaddisconnected', () => {
    const gamepads = navigator.getGamepads?.() ?? []
    const anyConnected = Array.from(gamepads).some(gp => gp?.connected)
    if (!anyConnected && gamepadFrameId !== null) {
      cancelAnimationFrame(gamepadFrameId)
      gamepadFrameId = null
    }
  })
}
