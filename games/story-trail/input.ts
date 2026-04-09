import type { GameState } from './types.js'

declare global {
  interface Window {
    __settingsToggle?: () => void
  }
}

export interface InputCallbacks {
  onStorySelected: (storyId: string) => void
  onChoiceMade: (choiceIndex: number) => void
  onInventoryOpen: () => void
  onInventoryClose: () => void
  onBackToTrail: () => void
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
  function getContext(): 'trail' | 'scene' | 'completion' {
    const screen = gameArea.dataset.activeScreen
    if (screen === 'trail') return 'trail'
    if (screen === 'completion') return 'completion'
    if (screen === 'scene') return 'scene'
    // Fallback via state
    const state = getState()
    if (state.currentStoryId === null) return 'trail'
    return 'scene'
  }

  function isInventoryOpen(): boolean {
    const overlay = document.getElementById('inventory-overlay')
    return !!overlay && !overlay.hidden
  }

  // ── Navigation helpers ────────────────────────────────────
  function getUnlockedStops(): HTMLElement[] {
    return Array.from(document.querySelectorAll('.trail-stop-unlocked')) as HTMLElement[]
  }

  function getChoiceButtons(): HTMLElement[] {
    return Array.from(document.querySelectorAll('.choice-btn')) as HTMLElement[]
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
    if (isInventoryOpen()) {
      if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        callbacks.onInventoryClose()
      }
      return
    }

    const focused = document.activeElement as HTMLElement | null
    const context = getContext()

    if (context === 'trail') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateList(getUnlockedStops(), e.key)
      } else if (e.key === 'Enter' || e.key === ' ') {
        const stopEl = focused?.closest('.trail-stop-unlocked') as HTMLElement | null
        if (stopEl) {
          e.preventDefault()
          const storyId = stopEl.dataset.storyId
          if (storyId) callbacks.onStorySelected(storyId)
        }
      }
    } else if (context === 'scene') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        navigateList(getChoiceButtons(), e.key)
      } else if (e.key === 'Enter' || e.key === ' ') {
        const choiceEl = focused?.closest('[data-choice-index]') as HTMLElement | null
        if (choiceEl) {
          e.preventDefault()
          const idx = parseInt(choiceEl.dataset.choiceIndex ?? '-1', 10)
          if (idx >= 0) callbacks.onChoiceMade(idx)
        }
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        callbacks.onInventoryOpen()
      }
    } else if (context === 'completion') {
      if (e.key === 'Enter') {
        e.preventDefault()
        callbacks.onBackToTrail()
      }
    }
  })

  // ── Touch/Pointer (event delegation on #game-area) ────────
  gameArea.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.closest('#back-to-trail-btn')) {
      callbacks.onBackToTrail()
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

    const choiceEl = target.closest('[data-choice-index]') as HTMLElement | null
    if (choiceEl) {
      const idx = parseInt(choiceEl.dataset.choiceIndex ?? '-1', 10)
      if (idx >= 0) callbacks.onChoiceMade(idx)
      return
    }

    const stopEl = target.closest('[data-story-id]') as HTMLElement | null
    if (stopEl && stopEl.tagName === 'BUTTON') {
      const storyId = stopEl.dataset.storyId
      if (storyId) callbacks.onStorySelected(storyId)
    }
  })

  // ── Gamepad ───────────────────────────────────────────────
  function activateFocused(): void {
    const focused = document.activeElement as HTMLElement | null
    if (!focused) return
    const context = getContext()

    if (context === 'trail') {
      const stopEl = focused.closest('.trail-stop-unlocked') as HTMLElement | null
      const storyId = stopEl?.dataset.storyId
      if (storyId) callbacks.onStorySelected(storyId)
    } else if (context === 'scene') {
      const choiceEl = focused.closest('[data-choice-index]') as HTMLElement | null
      const idx = parseInt(choiceEl?.dataset.choiceIndex ?? '-1', 10)
      if (idx >= 0) callbacks.onChoiceMade(idx)
    } else if (context === 'completion') {
      callbacks.onBackToTrail()
    }
  }

  function navigateDirection(dir: 'ArrowUp' | 'ArrowDown'): void {
    if (isInventoryOpen()) return
    const context = getContext()
    if (context === 'trail') {
      navigateList(getUnlockedStops(), dir)
    } else if (context === 'scene') {
      navigateList(getChoiceButtons(), dir)
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
            if (isInventoryOpen()) {
              callbacks.onInventoryClose()
            } else if (getContext() === 'completion') {
              callbacks.onBackToTrail()
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
