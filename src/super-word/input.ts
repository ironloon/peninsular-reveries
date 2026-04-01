import type { GameState, Puzzle, SceneItem } from './types.js'

export interface InputCallbacks {
  onLetterCollected: (item: SceneItem) => void
  onDistractorClicked: (item: SceneItem) => void
  onTileSelected: (index: number) => void
  onLettersSwapped: (indexA: number, indexB: number) => void
  onCheckAnswer: () => void
  onNextPuzzle: () => void
  onStartGame: () => void
  onPlayAgain: () => void
}

export function setupInput(
  getState: () => GameState,
  setState: (s: GameState) => void,
  getPuzzle: () => Puzzle,
  callbacks: InputCallbacks,
): void {
  const sceneEl = document.getElementById('scene')!
  const sceneWrapper = document.getElementById('scene-wrapper')!
  const slotsEl = document.getElementById('letter-slots')!
  const startBtn = document.getElementById('start-btn')!
  const checkBtn = document.getElementById('check-btn')!
  const nextBtn = document.getElementById('next-btn')!
  const replayBtn = document.getElementById('replay-btn')!

  // Prevent touch scrolling in scene area
  sceneWrapper.style.touchAction = 'none'

  // ── Drag state ──────────────────────────────────────────
  let dragActive = false
  let dragSourceIndex = -1
  let dragStartX = 0
  let dragStartY = 0
  let ghostEl: HTMLElement | null = null
  let dragCaptureEl: HTMLElement | null = null

  // ── Scene item interaction (Pointer Events) ─────────────
  sceneEl.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = (e.target as HTMLElement).closest('.scene-item') as HTMLElement | null
    if (!target || target.classList.contains('collected')) return
    e.preventDefault()

    const itemId = target.dataset.itemId
    const itemType = target.dataset.itemType
    const puzzle = getPuzzle()
    const item = puzzle.items.find(it => it.id === itemId)
    if (!item) return

    if (itemType === 'letter') {
      callbacks.onLetterCollected(item)
    } else if (itemType === 'distractor') {
      callbacks.onDistractorClicked(item)
    }
  })

  // ── Scene keyboard navigation (roving tabindex) ─────────
  sceneEl.addEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (!target.classList.contains('scene-item')) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const itemId = target.dataset.itemId
      const puzzle = getPuzzle()
      const item = puzzle.items.find(it => it.id === itemId)
      if (!item || target.classList.contains('collected')) return

      if (item.type === 'letter') {
        callbacks.onLetterCollected(item)
      } else {
        callbacks.onDistractorClicked(item)
      }
      return
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      const uncollected = Array.from(sceneEl.querySelectorAll('.scene-item:not(.collected)')) as HTMLElement[]
      if (uncollected.length <= 1) return

      const currentIdx = uncollected.indexOf(target)
      if (currentIdx === -1) return

      const nearest = findNearestInDirection(target, uncollected, e.key)
      if (nearest) {
        target.tabIndex = -1
        nearest.tabIndex = 0
        nearest.focus()
      }
    }
  })

  function findNearestInDirection(
    current: HTMLElement,
    candidates: HTMLElement[],
    direction: string,
  ): HTMLElement | null {
    const currentRect = current.getBoundingClientRect()
    const cx = currentRect.left + currentRect.width / 2
    const cy = currentRect.top + currentRect.height / 2

    let best: HTMLElement | null = null
    let bestDist = Infinity

    for (const candidate of candidates) {
      if (candidate === current) continue
      const rect = candidate.getBoundingClientRect()
      const px = rect.left + rect.width / 2
      const py = rect.top + rect.height / 2
      const dx = px - cx
      const dy = py - cy

      let inDirection = false
      switch (direction) {
        case 'ArrowUp': inDirection = dy < -10; break
        case 'ArrowDown': inDirection = dy > 10; break
        case 'ArrowLeft': inDirection = dx < -10; break
        case 'ArrowRight': inDirection = dx > 10; break
      }

      if (!inDirection) continue

      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < bestDist) {
        bestDist = dist
        best = candidate
      }
    }

    // If no item in exact direction, wrap around to nearest
    if (!best) {
      for (const candidate of candidates) {
        if (candidate === current) continue
        const rect = candidate.getBoundingClientRect()
        const px = rect.left + rect.width / 2
        const py = rect.top + rect.height / 2
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
        if (dist < bestDist) {
          bestDist = dist
          best = candidate
        }
      }
    }

    return best
  }

  // ── Letter tile interaction (Pointer Events) ────────────
  slotsEl.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = (e.target as HTMLElement).closest('.letter-tile') as HTMLElement | null
    if (!target) return
    e.preventDefault()

    const index = parseInt(target.dataset.index ?? '-1', 10)
    if (index < 0) return

    dragSourceIndex = index
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragActive = false
    dragCaptureEl = target

    target.setPointerCapture(e.pointerId)
  })

  slotsEl.addEventListener('pointermove', (e: PointerEvent) => {
    if (dragSourceIndex < 0 || !dragCaptureEl) return

    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY

    if (!dragActive && Math.sqrt(dx * dx + dy * dy) > 4) {
      dragActive = true
      dragCaptureEl.classList.add('dragging')

      ghostEl = dragCaptureEl.cloneNode(true) as HTMLElement
      ghostEl.style.position = 'fixed'
      ghostEl.style.pointerEvents = 'none'
      ghostEl.style.opacity = '0.8'
      ghostEl.style.zIndex = '50'
      ghostEl.style.width = `${dragCaptureEl.offsetWidth}px`
      ghostEl.style.height = `${dragCaptureEl.offsetHeight}px`
      ghostEl.classList.remove('dragging')
      document.querySelector('.super-word-game')?.appendChild(ghostEl)
    }

    if (dragActive && ghostEl) {
      ghostEl.style.left = `${e.clientX - ghostEl.offsetWidth / 2}px`
      ghostEl.style.top = `${e.clientY - ghostEl.offsetHeight / 2}px`
    }
  })

  slotsEl.addEventListener('pointerup', (e: PointerEvent) => {
    if (dragSourceIndex < 0) return

    if (dragActive) {
      // Find drop target
      if (ghostEl) ghostEl.style.display = 'none'
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY)
      if (ghostEl) ghostEl.style.display = ''

      const tile = dropTarget?.closest('.letter-tile') as HTMLElement | null
      if (tile && tile !== dragCaptureEl) {
        const targetIndex = parseInt(tile.dataset.index ?? '-1', 10)
        if (targetIndex >= 0 && targetIndex !== dragSourceIndex) {
          callbacks.onLettersSwapped(dragSourceIndex, targetIndex)
        }
      }
    } else {
      // Click (no drag) — select tile
      const state = getState()
      if (state.selectedTileIndex !== null && state.selectedTileIndex !== dragSourceIndex) {
        callbacks.onLettersSwapped(state.selectedTileIndex, dragSourceIndex)
      } else {
        callbacks.onTileSelected(dragSourceIndex)
      }
    }

    cleanupDrag()
  })

  slotsEl.addEventListener('pointercancel', () => {
    cleanupDrag()
  })

  function cleanupDrag(): void {
    if (ghostEl) {
      ghostEl.remove()
      ghostEl = null
    }
    if (dragCaptureEl) {
      dragCaptureEl.classList.remove('dragging')
      dragCaptureEl = null
    }
    dragSourceIndex = -1
    dragActive = false
  }

  // ── Letter tile keyboard navigation ─────────────────────
  slotsEl.addEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (!target.classList.contains('letter-tile')) return

    const index = parseInt(target.dataset.index ?? '-1', 10)
    if (index < 0) return

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      callbacks.onLettersSwapped(index, index - 1)
    } else if (e.key === 'ArrowRight') {
      const state = getState()
      if (index < state.collectedLetters.length - 1) {
        e.preventDefault()
        callbacks.onLettersSwapped(index, index + 1)
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      callbacks.onTileSelected(index)
    }
  })

  // ── Button handlers ─────────────────────────────────────
  startBtn.addEventListener('click', () => callbacks.onStartGame())
  checkBtn.addEventListener('click', () => {
    if (!checkBtn.hasAttribute('disabled')) {
      callbacks.onCheckAnswer()
    }
  })
  nextBtn.addEventListener('click', () => callbacks.onNextPuzzle())
  replayBtn.addEventListener('click', () => callbacks.onPlayAgain())

  // ── Gamepad support (Xbox Bluetooth controller) ─────────
  const STICK_THRESHOLD = 0.5
  const prevButtons: boolean[] = []
  let prevStickDir = ''
  let stickCooldown = 0

  // Remove gamepad-active on mouse/keyboard
  document.addEventListener('mousemove', () => {
    document.body.classList.remove('gamepad-active')
  }, { once: false })
  document.addEventListener('keydown', () => {
    document.body.classList.remove('gamepad-active')
  }, { once: false })

  function getActiveScreen(): string | null {
    const active = document.querySelector('.screen.active') as HTMLElement | null
    return active?.id ?? null
  }

  function focusNearestItem(direction: string): void {
    const items = Array.from(sceneEl.querySelectorAll('.scene-item:not(.collected)')) as HTMLElement[]
    if (items.length === 0) return

    const focused = document.activeElement as HTMLElement
    const current = items.find(el => el === focused) ?? items[0]

    const nearest = findNearestInDirection(current, items, direction)
    if (nearest) {
      for (const el of items) el.tabIndex = -1
      nearest.tabIndex = 0
      nearest.focus()
    }
  }

  function activateFocusedItem(): void {
    const focused = document.activeElement as HTMLElement
    if (!focused?.classList.contains('scene-item') || focused.classList.contains('collected')) return

    const itemId = focused.dataset.itemId
    const puzzle = getPuzzle()
    const item = puzzle.items.find(it => it.id === itemId)
    if (!item) return

    if (item.type === 'letter') {
      callbacks.onLetterCollected(item)
    } else {
      callbacks.onDistractorClicked(item)
    }
  }

  function isCelebrationVisible(): boolean {
    const popup = document.getElementById('celebration-popup')
    return popup !== null && !popup.hidden
  }

  function dismissCelebration(): boolean {
    if (!isCelebrationVisible()) return false
    document.getElementById('celebration-continue-btn')?.click()
    return true
  }

  function handleContextStart(): void {
    if (dismissCelebration()) return
    const screen = getActiveScreen()
    if (screen === 'start-screen') startBtn.click()
    else if (screen === 'win-screen') replayBtn.click()
    else if (screen === 'game-screen') {
      // Toggle settings modal during gameplay
      const toggle = (window as any).__settingsToggle
      if (typeof toggle === 'function') toggle()
    }
  }

  function pollGamepad(): void {
    if (document.visibilityState !== 'visible') {
      requestAnimationFrame(pollGamepad)
      return
    }

    const gamepads = navigator.getGamepads?.()
    if (!gamepads) {
      requestAnimationFrame(pollGamepad)
      return
    }

    let gp: Gamepad | null = null
    for (const pad of gamepads) {
      if (pad?.connected) { gp = pad; break }
    }

    if (!gp) {
      requestAnimationFrame(pollGamepad)
      return
    }

    document.body.classList.add('gamepad-active')

    // Button press detection (edge-triggered)
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed
      const wasPressed = prevButtons[i] ?? false

      if (pressed && !wasPressed) {
        const screen = getActiveScreen()

        switch (i) {
          case 0: // A — activate/select
            if (dismissCelebration()) break
            if (screen === 'game-screen') activateFocusedItem()
            break
          case 9: // Start — context-sensitive
            handleContextStart()
            break
          case 12: // D-pad up
            if (screen === 'game-screen') focusNearestItem('ArrowUp')
            break
          case 13: // D-pad down
            if (screen === 'game-screen') focusNearestItem('ArrowDown')
            break
          case 14: // D-pad left
            if (screen === 'game-screen') focusNearestItem('ArrowLeft')
            break
          case 15: // D-pad right
            if (screen === 'game-screen') focusNearestItem('ArrowRight')
            break
        }
      }

      prevButtons[i] = pressed
    }

    // Analog stick navigation (with deadzone + cooldown)
    if (stickCooldown > 0) {
      stickCooldown--
    } else if (gp.axes.length >= 2) {
      const lx = gp.axes[0]
      const ly = gp.axes[1]
      let dir = ''

      if (Math.abs(lx) > STICK_THRESHOLD || Math.abs(ly) > STICK_THRESHOLD) {
        if (Math.abs(lx) > Math.abs(ly)) {
          dir = lx > 0 ? 'ArrowRight' : 'ArrowLeft'
        } else {
          dir = ly > 0 ? 'ArrowDown' : 'ArrowUp'
        }
      }

      if (dir && dir !== prevStickDir) {
        if (getActiveScreen() === 'game-screen') focusNearestItem(dir)
        stickCooldown = 12 // ~200ms at 60fps
      }

      prevStickDir = dir
    }

    requestAnimationFrame(pollGamepad)
  }

  requestAnimationFrame(pollGamepad)
}
