import { setupGameMenu } from '../../client/game-menu.js'

import { announceFound, announcePhase, announceReveal, announceRound, manageFocus } from './accessibility.js'
import { animateCellReveal, animateCelebration, animateFogRollIn, stopAllAnimations } from './animations.js'
import { setupInput } from './input.js'
import { createRenderer, type PeekabooRenderer } from './renderer.js'
import { advancePhase, initState, nextRound, revealCell } from './state.js'
import {
  ensureAudioUnlocked,
  initPeekabooAudio,
  playAdvanceSound,
  playFogSound,
  playFoundSound,
  playNewRoundSound,
  playRevealSound,
} from './sounds.js'
import type { PeekabooState } from './types.js'

let sessionState: PeekabooState = initState()
let renderer: PeekabooRenderer | null = null
let settingsModal = { open() {}, close() {}, toggle() {} }

function byId<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id)
  return element instanceof HTMLElement ? (element as T) : null
}

function isSettingsOpen(): boolean {
  const modal = byId<HTMLElement>('settings-modal')
  return Boolean(modal && !modal.hidden)
}

function showScreen(screenId: string): void {
  renderer?.showScreen(screenId)
}

function syncModalState(): void {
  document.body.classList.toggle('modal-open', isSettingsOpen())
}

// ── Phase transition ──────────────────────────────────────────────────────────

function handleAdvancePhase(): void {
  if (isSettingsOpen()) return

  ensureAudioUnlocked()

  const nextState = advancePhase(sessionState)
  if (nextState === sessionState) return

  sessionState = nextState
  playAdvanceSound()

  const phase = sessionState.phase

  announcePhase(phase, sessionState.currentTarget)

  if (phase === 'enter') {
    showScreen('enter-screen')
    renderer?.renderEnterScene(sessionState)
    renderer?.renderEnterAnimation(sessionState.currentTarget)
    requestAnimationFrame(() => {
      manageFocus('enter')
    })
  } else if (phase === 'playing') {
    showScreen('playing-screen')
    renderer?.renderGrid(sessionState)
    playFogSound()
    requestAnimationFrame(() => {
      // Animate fog roll-in on cells
      const cells = Array.from(
        document.querySelectorAll<HTMLElement>('[data-peekaboo-row][data-peekaboo-col]'),
      )
      animateFogRollIn(cells)
      manageFocus('playing')
    })
  }
}

// ── Cell reveal ──────────────────────────────────────────────────────────────

function handleRevealCell(row: number, col: number): void {
  if (sessionState.phase !== 'playing' || isSettingsOpen()) return

  ensureAudioUnlocked()

  const nextState = revealCell(sessionState, row, col)
  if (nextState === sessionState) return

  sessionState = nextState

  // Visual + audio feedback
  renderer?.revealCellVisual(row, col)
  animateCellReveal(
    renderer?.getCellButton(row, col) ?? document.body,
  )
  playRevealSound()
  announceReveal(row, col)

  // Check for found
  if (sessionState.phase === 'found') {
    handleFound()
  }
}

// ── Found ─────────────────────────────────────────────────────────────────────

function handleFound(): void {
  showScreen('found-screen')
  renderer?.renderFoundCelebration(sessionState.currentTarget)
  playFoundSound()
  announceFound(sessionState.currentTarget)

  // Animate the found emoji
  const foundEmoji = byId<HTMLElement>('peekaboo-found-target-emoji')
  if (foundEmoji) {
    animateCelebration(foundEmoji)
  }

  requestAnimationFrame(() => {
    manageFocus('found')
  })
}

// ── Next round / restart ──────────────────────────────────────────────────────

function handleNextRound(): void {
  ensureAudioUnlocked()
  stopAllAnimations()

  sessionState = nextRound(sessionState)
  playNewRoundSound()
  announceRound(sessionState.round)

  // Render meet screen with new target
  renderer?.renderMeetScreen(sessionState.currentTarget)
  showScreen('meet-screen')
  announcePhase('meet', sessionState.currentTarget)

  requestAnimationFrame(() => {
    manageFocus('meet')
  })
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init(): void {
  const gameArea = byId<HTMLElement>('peekaboo-game-area') ?? document.body
  renderer = createRenderer(gameArea)

  settingsModal = setupGameMenu({ musicTrackPicker: false })

  // Render initial meet screen
  renderer.renderMeetScreen(sessionState.currentTarget)
  showScreen('meet-screen')
  announcePhase('meet', sessionState.currentTarget)

  // Wire modal observer
  const modal = byId<HTMLElement>('settings-modal')
  if (modal) {
    const observer = new MutationObserver(() => {
      syncModalState()
    })
    observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] })
  }

  syncModalState()

  // Wire input
  const fogGrid = byId<HTMLElement>('peekaboo-fog-grid') ?? document.body
  const proceedBtn = document.querySelector<HTMLElement>('.peekaboo-proceed-btn')
  const playAgainBtn = document.querySelector<HTMLElement>('.peekaboo-play-again-btn')
  const menuBtn = document.querySelector<HTMLElement>('.peekaboo-menu-btn')

  setupInput(
    {
      onRevealCell: (row, col) => {
        handleRevealCell(row, col)
      },
      onAdvancePhase: () => {
        handleAdvancePhase()
      },
      onNextRound: () => {
        handleNextRound()
      },
      onOpenMenu: () => {
        ensureAudioUnlocked()
        if (!isSettingsOpen()) {
          settingsModal.open()
        }
      },
    },
    fogGrid,
    {
      proceed: proceedBtn ?? document.body,
      playAgain: playAgainBtn ?? document.body,
      menu: menuBtn ?? document.body,
    },
  )

  // Init audio
  initPeekabooAudio()

  // Listen for restart event (from shared menu)
  document.addEventListener('restart', () => {
    handleNextRound()
  })

  // Listen for quit event
  document.addEventListener('quit', () => {
    window.location.href = '/'
  })

  // Initial focus
  requestAnimationFrame(() => {
    manageFocus('meet')
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}