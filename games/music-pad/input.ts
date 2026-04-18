import { createGamepadPoller, type GamepadPoller } from '../../client/game-input.js'

import type { PadId } from './types.js'

export interface MusicPadInputCallbacks {
  onPadTrigger(padId: PadId): void
  onRecord(): void
  onPlayStop(): void
  onClear(): void
  onTempo(): void
  onMenu(): void
}

const KEY_TO_PAD: Readonly<Record<string, PadId>> = {
  q: 0,
  w: 1,
  e: 2,
  r: 3,
  a: 4,
  s: 5,
  d: 6,
  f: 7,
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
}

const PAD_COUNT = 8
const ROW_LENGTH = 4

let keydownHandler: ((event: KeyboardEvent) => void) | null = null
let gamepadPoller: GamepadPoller | null = null

function isTextEntryTarget(element: Element | null): boolean {
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (element as HTMLElement).isContentEditable === true
}

function getFocusedPadId(): PadId | null {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return null
  const padAttr = active.dataset['pad']
  if (padAttr === undefined) return null
  const parsed = Number.parseInt(padAttr, 10)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= PAD_COUNT) return null
  return parsed as PadId
}

function focusPad(padId: PadId): void {
  const btn = document.getElementById(`pad-${padId}`)
  if (btn instanceof HTMLElement) {
    btn.focus({ preventScroll: true })
  }
}

function moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
  const current = getFocusedPadId()
  if (current === null) {
    focusPad(0)
    return
  }
  const row = Math.floor(current / ROW_LENGTH)
  const col = current % ROW_LENGTH
  let nextRow = row
  let nextCol = col
  switch (direction) {
    case 'up':
      nextRow = row === 0 ? 1 : 0
      break
    case 'down':
      nextRow = row === 1 ? 0 : 1
      break
    case 'left':
      nextCol = (col + ROW_LENGTH - 1) % ROW_LENGTH
      break
    case 'right':
      nextCol = (col + 1) % ROW_LENGTH
      break
  }
  const next = (nextRow * ROW_LENGTH + nextCol) as PadId
  focusPad(next)
}

export function setupMusicPadInput(callbacks: MusicPadInputCallbacks): void {
  cleanupMusicPadInput()

  keydownHandler = (event: KeyboardEvent): void => {
    if (event.repeat) return
    if (event.ctrlKey || event.altKey || event.metaKey) return
    if (isTextEntryTarget(event.target as Element | null)) return

    const key = event.key
    const lower = key.length === 1 ? key.toLowerCase() : key

    if (lower in KEY_TO_PAD) {
      const padId = KEY_TO_PAD[lower] as PadId
      event.preventDefault()
      callbacks.onPadTrigger(padId)
      return
    }

    switch (key) {
      case ' ':
      case 'Spacebar':
        event.preventDefault()
        callbacks.onRecord()
        return
      case 'Enter':
        event.preventDefault()
        callbacks.onPlayStop()
        return
      case 'Backspace':
      case 'Delete':
        event.preventDefault()
        callbacks.onClear()
        return
    }

    if (lower === 't') {
      event.preventDefault()
      callbacks.onTempo()
    }
  }

  document.addEventListener('keydown', keydownHandler)

  gamepadPoller = createGamepadPoller({
    onDpad(direction): void {
      moveFocus(direction)
    },
    onButtonA(): void {
      const padId = getFocusedPadId()
      if (padId !== null) {
        callbacks.onPadTrigger(padId)
        return
      }
      const active = document.activeElement
      if (active instanceof HTMLElement && typeof active.click === 'function') {
        active.click()
      }
    },
    onButtonStart(): void {
      callbacks.onMenu()
    },
  })

  let prevL1 = false
  let prevR1 = false
  let lastShoulderTime = 0
  const SHOULDER_DEBOUNCE_MS = 200

  const shoulderFrame = (): void => {
    if (!gamepadPoller) return
    const pads = navigator.getGamepads?.()
    const pad = pads ? pads[0] : null
    if (pad) {
      const now = Date.now()
      const l1 = pad.buttons[4]?.pressed ?? false
      const r1 = pad.buttons[5]?.pressed ?? false
      if (now - lastShoulderTime >= SHOULDER_DEBOUNCE_MS) {
        if ((l1 && !prevL1) || (r1 && !prevR1)) {
          lastShoulderTime = now
          callbacks.onTempo()
        }
      }
      prevL1 = l1
      prevR1 = r1
    }
    shoulderFrameHandle = requestAnimationFrame(shoulderFrame)
  }

  shoulderFrameHandle = requestAnimationFrame(shoulderFrame)
  gamepadPoller.start()
}

let shoulderFrameHandle: number | null = null

export function cleanupMusicPadInput(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }
  if (gamepadPoller) {
    gamepadPoller.stop()
    gamepadPoller = null
  }
  if (shoulderFrameHandle !== null) {
    cancelAnimationFrame(shoulderFrameHandle)
    shoulderFrameHandle = null
  }
}
