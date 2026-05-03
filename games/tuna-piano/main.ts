import { Application, Ticker } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { initStage, createPianoKeys, updateKeyVisuals, createTuna, updateTunaProgress, animateTunaBob, cleanupStage } from './renderer.js'
import { requestCamera } from './camera.js'
import { startMotionTracking, stopMotionTracking } from './motion.js'
import { createInitialState, keyAtPosition, isInTunaZone } from './state.js'
import type { MotionHand, PianoKey } from './types.js'
import { setupTunaPianoInput } from './input.js'
import { announceNote, announceStart, announcePlaying, announceTunaPressed, announceTunaReleased, announceReturnHome, manageFocus } from './accessibility.js'
import { playNote, releaseNote, startAmbience, stopAmbience, setMuted, sfxTunaTap, sfxTunaActivate, ensureAudioUnlocked } from './sounds.js'

// ── DOM refs ─────────────────────────────────────────────────────────────────

const pixiStage = document.getElementById('pixi-stage')!
const cameraPreview = document.getElementById('camera-preview') as HTMLVideoElement
const startBtn = document.getElementById('start-btn') as HTMLButtonElement
const cameraPrompt = document.getElementById('camera-denied-msg') as HTMLElement

const ALL_SCREENS = ['start-screen', 'game-screen']

function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = document.getElementById(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    if (isActive) {
      el.removeAttribute('inert')
    } else {
      el.setAttribute('inert', '')
    }
  }
}

// ── Runtime state ────────────────────────────────────────────────────────────

let app: Application | null = null
let gameState = createInitialState()
let activeHands: MotionHand[] = []
let cameraGranted = false
let gameLoopCallback: ((ticker: Ticker) => void) | null = null

// Currently held notes (by hand id) — for debouncing
const handNoteMap = new Map<number, { key: PianoKey; sustained: boolean; noteId: string }>()
// Tracks which notes are currently visually active
const visualActiveNotes = new Map<string, { sustained: boolean }>()

// Tuna hold tracking
const TUNA_HOLD_MS = 1000
let tunaHoldStart = 0
let tunaSfxPlayed = false

// Debounce: minimum time between repeating the same note for the same hand
const NOTE_RETRIGGER_MS = 120
const lastTriggerTime = new Map<string, number>()

// ── Boot ─────────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  app = await initStage(pixiStage)
  if (!app) {
    cameraPrompt.textContent = 'Unable to initialize the piano. Please try a different browser.'
    startBtn.disabled = true
    return
  }

  setupGameMenu({ musicTrackPicker: false })

  window.addEventListener('reveries:music-change', (e) => {
    const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled
    setMuted(!enabled)
    if (!enabled) stopAmbience()
    else if (gameState.phase === 'playing') startAmbience()
  })

  const menuBtns = Array.from(document.querySelectorAll<HTMLElement>('.tp-menu-btn'))
  setupTunaPianoInput(
    {
      onStart: enterGame,
      onMenu: () => {
        const modal = document.getElementById('settings-modal')
        if (modal) {
          const isHidden = modal.hasAttribute('hidden')
          modal.toggleAttribute('hidden', !isHidden)
        }
      },
    },
    {
      startBtn,
      menuBtns,
    },
  )

  cameraGranted = await requestCamera(cameraPreview)
  if (cameraGranted) {
    startMotionTracking(cameraPreview, (hands) => {
      activeHands = hands
    })
    cameraPrompt.textContent = 'Camera access granted. Press Start to play!'
  } else {
    cameraPrompt.textContent = 'Camera not available. You can still listen!'
  }

  startBtn.addEventListener('click', enterGame)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  announceStart()
  manageFocus('start')
}

// ── Game entry ───────────────────────────────────────────────────────────────

async function enterGame(): Promise<void> {
  if (!app) return
  showScreen('game-screen')

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 600)))
  })

  const rect = pixiStage.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width)) || window.innerWidth
  const h = Math.max(1, Math.round(rect.height)) || window.innerHeight

  app.renderer.resize(w, h)
  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.display = 'block'

  app.stage.removeChildren()

  gameState = createInitialState()
  gameState.phase = 'playing'
  handNoteMap.clear()
  visualActiveNotes.clear()
  lastTriggerTime.clear()
  tunaHoldStart = 0
  tunaSfxPlayed = false

  if (!cameraGranted) {
    activeHands = []
  }

  // Build piano keys
  createPianoKeys(app, gameState.keys)
  createTuna(app)
  startAmbience()
  ensureAudioUnlocked()
  announcePlaying()

  if (gameLoopCallback) app.ticker.remove(gameLoopCallback)

  gameLoopCallback = (_ticker) => {
    if (!app) return
    const now = performance.now()

    // Clear visual state for this frame
    const notesToKeep = new Set<string>()

    // ── Process each detected hand ────────────────────────────────────
    const handsToUse = cameraGranted ? activeHands : []

    for (const hand of handsToUse) {
      const handX = hand.normalizedX
      const handY = hand.normalizedY

      // ── Check tuna zone first ───────────────────────────────────
      if (isInTunaZone(handX, handY) && hand.handState === 'closed') {
        // Tuna is being held
        if (!gameState.tuna.tunaPressed) {
          gameState.tuna.tunaPressed = true
          tunaHoldStart = now
          tunaSfxPlayed = false
          announceTunaPressed()
        }

        const holdTime = now - tunaHoldStart

        if (holdTime >= TUNA_HOLD_MS) {
          // Tuna hold complete — go home!
          sfxTunaActivate()
          announceReturnHome()
          returnToHome()
          return
        }

        // Play tap sound when first touching
        if (!tunaSfxPlayed) {
          sfxTunaTap()
          tunaSfxPlayed = true
        }

        continue // Don't trigger piano keys while on the tuna
      }

      // ── Check if hand is on a piano key ─────────────────────────
      // Map hand position to piano area (below tuna zone)
      const pianoY = (handY - 0.08) / 0.92 // Adjust for tuna zone offset
      const pianoX = handX

      if (pianoY < 0 || pianoY > 1) {
        // Hand outside piano area
        releaseHandNote(hand.id)
        continue
      }

      const key = keyAtPosition(gameState.keys, pianoX, pianoY)

      if (!key) {
        releaseHandNote(hand.id)
        continue
      }

      // Check if the same hand is already on this key in the same state
      const held = handNoteMap.get(hand.id)
      const sustained = hand.handState === 'closed'
      const noteKey = key.note

      if (held && held.key.note === noteKey && held.sustained === sustained) {
        // Same note, same state — keep it
        notesToKeep.add(noteKey)
        visualActiveNotes.set(noteKey, { sustained })
        continue
      }

      // Different key or changed state — release old note and play new one
      if (held) {
        releaseHandNote(hand.id)
      }

      // Debounce check
      const lastTime = lastTriggerTime.get(noteKey) ?? 0
      if (now - lastTime < NOTE_RETRIGGER_MS) {
        continue
      }
      lastTriggerTime.set(noteKey, now)

      // Play the note!
      const noteId = `${key.note}-${hand.id}-${now}`
      playNote(key.frequency, sustained, key.noteIndex, noteId)
      handNoteMap.set(hand.id, { key, sustained, noteId })
      visualActiveNotes.set(noteKey, { sustained })
      notesToKeep.add(noteKey)

      announceNote(key.note, sustained)
    }

    // ── Release notes for hands that are gone ────────────────────────
    const currentHandIds = new Set(handsToUse.map((h) => h.id))
    for (const [handId] of handNoteMap) {
      if (!currentHandIds.has(handId)) {
        releaseHandNote(handId)
      }
    }

    // Remove tuna hold if no hand is pressing it
    if (gameState.tuna.tunaPressed) {
      const pressing = handsToUse.some(
        (h) => isInTunaZone(h.normalizedX, h.normalizedY) && h.handState === 'closed'
      )
      if (!pressing) {
        gameState.tuna.tunaPressed = false
        tunaHoldStart = 0
        announceTunaReleased()
      }
    }

    // ── Clean up visual notes that are no longer active ──────────────
    for (const [note] of visualActiveNotes) {
      let stillActive = false
      for (const [, held] of handNoteMap) {
        if (held.key.note === note) {
          stillActive = true
          break
        }
      }
      if (!stillActive && !notesToKeep.has(note)) {
        visualActiveNotes.delete(note)
      }
    }

    // ── Render updates ───────────────────────────────────────────────
    updateKeyVisuals(visualActiveNotes, gameState.keys)

    // Tuna animation
    animateTunaBob(now)
    const tunaProgress = gameState.tuna.tunaPressed
      ? Math.min((now - tunaHoldStart) / TUNA_HOLD_MS, 1)
      : 0
    updateTunaProgress(tunaProgress)
  }

  app.ticker.add(gameLoopCallback)
  manageFocus('playing')
}

function releaseHandNote(handId: number): void {
  const held = handNoteMap.get(handId)
  if (held) {
    if (held.sustained) {
      releaseNote(held.noteId)
    }
    handNoteMap.delete(handId)
    // Don't immediately remove from visual — let it fade naturally
    // Only remove if no other hand holds the same note
    let otherHandHoldsNote = false
    for (const [, other] of handNoteMap) {
      if (other.key.note === held.key.note) {
        otherHandHoldsNote = true
        break
      }
    }
    if (!otherHandHoldsNote) {
      visualActiveNotes.delete(held.key.note)
    }
  }
}

// ── Return home ──────────────────────────────────────────────────────────────

function returnToHome(): void {
  if (!app) return

  // Release all active notes
  for (const [handId] of handNoteMap) {
    releaseHandNote(handId)
  }

  if (gameLoopCallback) {
    app.ticker.remove(gameLoopCallback)
    gameLoopCallback = null
  }

  stopAmbience()
  stopMotionTracking()
  cleanupStage(app)

  // Navigate to the home page
  const siteBasePath = document.documentElement.dataset.basePath ?? ''
  let homePath = '/'
  if (siteBasePath) {
    homePath = siteBasePath
  }
  window.location.href = homePath
}

// ── Visibility handling ──────────────────────────────────────────────────────

function handleVisibilityChange(): void {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
    stopAmbience()
    // Release all notes when hidden
    for (const [handId] of handNoteMap) {
      releaseHandNote(handId)
    }
  } else {
    app.ticker.start()
    if (gameState.phase === 'playing') {
      startAmbience()
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}