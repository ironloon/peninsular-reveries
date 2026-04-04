import type { GameMode, GameState } from './types.js'

export interface InputCallbacks {
  onStartGame: (mode: GameMode) => void
  onReplay: () => void
  onReturnToMenu: () => void
  onMoveHippo: (x: number) => void
  onNudgeHippo: (delta: number) => void
  onChomp: () => void
}

function isStartScreenActive(): boolean {
  return document.getElementById('start-screen')?.classList.contains('active') ?? false
}

function isGameScreenActive(): boolean {
  return document.getElementById('game-screen')?.classList.contains('active') ?? false
}

function isEndScreenActive(): boolean {
  return document.getElementById('end-screen')?.classList.contains('active') ?? false
}

function selectedMode(): GameMode {
  const selected = document.querySelector<HTMLInputElement>('input[name="game-mode"]:checked')?.value
  if (selected === 'survival' || selected === 'zen') {
    return selected
  }

  return 'rush'
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(target.tagName)
}

export function setupInput(
  _getState: () => GameState,
  callbacks: InputCallbacks,
  isModalOpen: () => boolean,
): void {
  const arena = document.getElementById('game-arena') as HTMLElement
  const startButton = document.getElementById('start-btn') as HTMLButtonElement
  const chompButton = document.getElementById('chomp-btn') as HTMLButtonElement
  const replayButton = document.getElementById('replay-btn') as HTMLButtonElement
  const menuButton = document.getElementById('menu-btn') as HTMLButtonElement

  arena.style.touchAction = 'none'

  function arenaPercentX(clientX: number): number {
    const rect = arena.getBoundingClientRect()
    const relative = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5
    return relative * 100
  }

  startButton.addEventListener('click', () => {
    callbacks.onStartGame(selectedMode())
  })

  chompButton.addEventListener('click', () => {
    callbacks.onChomp()
  })

  replayButton.addEventListener('click', () => {
    callbacks.onReplay()
  })

  menuButton.addEventListener('click', () => {
    callbacks.onReturnToMenu()
  })

  arena.addEventListener('pointermove', (event: PointerEvent) => {
    if (!isGameScreenActive() || isModalOpen()) return
    callbacks.onMoveHippo(arenaPercentX(event.clientX))
  })

  arena.addEventListener('pointerdown', (event: PointerEvent) => {
    if (!isGameScreenActive() || isModalOpen()) return
    event.preventDefault()
    callbacks.onMoveHippo(arenaPercentX(event.clientX))
    callbacks.onChomp()
  })

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (isModalOpen()) return
    if (isTextEntryTarget(event.target)) return
    if (!isGameScreenActive()) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      callbacks.onNudgeHippo(-6)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      callbacks.onNudgeHippo(6)
      return
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      callbacks.onChomp()
    }
  })

  let previousPrimaryPressed = false
  let previousStartPressed = false
  requestAnimationFrame(function pollGamepad() {
    const pad = navigator.getGamepads?.()[0]
    const primaryPressed = pad?.buttons[0]?.pressed ?? false
    const startPressed = pad?.buttons[9]?.pressed ?? false

    if (pad && !isModalOpen()) {
      if (isGameScreenActive()) {
        const axis = pad.axes[0] ?? 0
        const leftPressed = pad.buttons[14]?.pressed ?? false
        const rightPressed = pad.buttons[15]?.pressed ?? false

        if (Math.abs(axis) > 0.18) {
          callbacks.onNudgeHippo(axis * 2.6)
        }
        if (leftPressed) callbacks.onNudgeHippo(-2.8)
        if (rightPressed) callbacks.onNudgeHippo(2.8)
        if (primaryPressed && !previousPrimaryPressed) callbacks.onChomp()
        if (startPressed && !previousStartPressed) callbacks.onReturnToMenu()
      } else if (isStartScreenActive()) {
        if (primaryPressed && !previousPrimaryPressed) callbacks.onStartGame(selectedMode())
      } else if (isEndScreenActive()) {
        if (primaryPressed && !previousPrimaryPressed) callbacks.onReplay()
        if (startPressed && !previousStartPressed) callbacks.onReturnToMenu()
      }
    }

    previousPrimaryPressed = primaryPressed
    previousStartPressed = startPressed
    requestAnimationFrame(pollGamepad)
  })
}