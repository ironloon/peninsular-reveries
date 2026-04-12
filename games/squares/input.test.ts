import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createTouchHoldTracker,
  normalizeKeyboardAction,
  normalizePointerAction,
  readGamepadAction,
  type SquaresGamepadState,
  type SquaresInputTargetDescriptor,
} from './input.js'

function cellTarget(row: number, column: number): SquaresInputTargetDescriptor {
  return {
    kind: 'cell',
    coordinate: { row, column },
  }
}

const DEFAULT_GAMEPAD_STATE: SquaresGamepadState = {
  connected: false,
  lastActionAt: Number.NEGATIVE_INFINITY,
  previousButtons: [],
  previousAxisDirection: null,
}

test('keyboard shortcut toggles the active pattern during play', () => {
  const action = normalizeKeyboardAction({ key: 't', code: 'KeyT' }, cellTarget(1, 1))

  assert.deepEqual(action, {
    type: 'toggle-pattern',
    source: 'keyboard',
  })
})

test('mouse right click maps to pattern toggle without consuming the move action path', () => {
  const target = cellTarget(0, 2)

  assert.deepEqual(
    normalizePointerAction({ type: 'contextmenu', button: 2, pointerType: 'mouse' }, target),
    {
      type: 'toggle-pattern',
      source: 'mouse',
    },
  )
  assert.equal(normalizePointerAction({ type: 'click', button: 2, pointerType: 'mouse' }, target), null)
  assert.deepEqual(normalizePointerAction({ type: 'click', button: 0, pointerType: 'mouse' }, target), {
    type: 'play-cell',
    coordinate: { row: 0, column: 2 },
    source: 'mouse',
  })
})

test('touch hold tracker keeps tap and long-hold behavior separate at the threshold', () => {
  const taps: SquaresInputTargetDescriptor[] = []
  const longHolds: SquaresInputTargetDescriptor[] = []
  const scheduled: Array<() => void> = []

  const tracker = createTouchHoldTracker<SquaresInputTargetDescriptor>({
    thresholdMs: 420,
    schedule: (callback) => {
      scheduled.push(callback)
      return scheduled.length - 1
    },
    cancel: () => {
      return undefined
    },
    onTap: (target) => {
      taps.push(target)
    },
    onLongHold: (target) => {
      longHolds.push(target)
    },
  })

  const target = cellTarget(2, 2)

  tracker.start(target)
  assert.equal(tracker.release(), 'tap')
  assert.equal(taps.length, 1)
  assert.equal(longHolds.length, 0)

  tracker.start(target)
  scheduled[1]?.()
  assert.equal(tracker.release(), 'long-hold')
  assert.equal(taps.length, 1)
  assert.equal(longHolds.length, 1)
})

test('gamepad D-pad, A, Start, and the dedicated pattern switch button map to gameplay actions', () => {
  const focusedCell = cellTarget(1, 1)

  const dpadResult = readGamepadAction({
    connected: true,
    buttons: [false, false, false, false, false, false, false, false, false, false, false, false, true],
    axes: [0, 0],
  }, DEFAULT_GAMEPAD_STATE, 1_000, focusedCell)
  assert.deepEqual(dpadResult.action, {
    type: 'move-focus',
    direction: 'ArrowUp',
    source: 'gamepad',
  })

  const selectResult = readGamepadAction({
    connected: true,
    buttons: [true],
    axes: [0, 0],
  }, DEFAULT_GAMEPAD_STATE, 1_000, focusedCell)
  assert.deepEqual(selectResult.action, {
    type: 'play-cell',
    coordinate: { row: 1, column: 1 },
    source: 'gamepad',
  })

  const startButtons = Array.from({ length: 10 }, () => false)
  startButtons[9] = true
  const startResult = readGamepadAction({
    connected: true,
    buttons: startButtons,
    axes: [0, 0],
  }, DEFAULT_GAMEPAD_STATE, 1_000, focusedCell)
  assert.deepEqual(startResult.action, {
    type: 'open-menu',
    source: 'gamepad',
  })

  const patternButtons = Array.from({ length: 5 }, () => false)
  patternButtons[4] = true
  const patternResult = readGamepadAction({
    connected: true,
    buttons: patternButtons,
    axes: [0, 0],
  }, DEFAULT_GAMEPAD_STATE, 1_000, focusedCell)
  assert.deepEqual(patternResult.action, {
    type: 'toggle-pattern',
    source: 'gamepad',
  })
})

test('gamepad analog input respects the dead zone, debounce, and disconnect path', () => {
  const focusedCell = cellTarget(0, 0)

  const belowThreshold = readGamepadAction({
    connected: true,
    buttons: [],
    axes: [0.49, 0],
  }, DEFAULT_GAMEPAD_STATE, 1_000, focusedCell)
  assert.equal(belowThreshold.action, null)

  const aboveThreshold = readGamepadAction({
    connected: true,
    buttons: [],
    axes: [0.51, 0],
  }, DEFAULT_GAMEPAD_STATE, 1_000, focusedCell)
  assert.deepEqual(aboveThreshold.action, {
    type: 'move-focus',
    direction: 'ArrowRight',
    source: 'gamepad',
  })

  const debounced = readGamepadAction({
    connected: true,
    buttons: [true],
    axes: [0, 0],
  }, {
    ...DEFAULT_GAMEPAD_STATE,
    connected: true,
    lastActionAt: 950,
  }, 1_100, focusedCell)
  assert.equal(debounced.action, null)

  const disconnected = readGamepadAction({
    connected: false,
    buttons: [],
    axes: [],
  }, {
    ...DEFAULT_GAMEPAD_STATE,
    connected: true,
  }, 1_300, focusedCell)
  assert.equal(disconnected.action, null)
  assert.equal(disconnected.connectionChange, 'disconnected')
})