import test from 'node:test'
import assert from 'node:assert/strict'

// ── Minimal DOM mock ──────────────────────────────────────────────────────────

const elStore = new Map<string, { hidden: boolean }>()

function resetMocks(): void { elStore.clear() }
function addEl(id: string, hidden: boolean): void {
  elStore.set(id, { hidden })
}

Object.assign(globalThis, {
  document: {
    getElementById(id: string) {
      const el = elStore.get(id)
      if (!el) return null
      return {
        hasAttribute(name: string) { return name === 'hidden' ? el.hidden : false },
      }
    },
    visibilityState: 'visible',
    body: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } },
    activeElement: null,
  },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
})
if (typeof globalThis.window === 'undefined') {
  Object.assign(globalThis, { window: globalThis })
}
if (!('navigator' in globalThis) || !('getGamepads' in globalThis.navigator)) {
  Object.assign(globalThis.navigator, { getGamepads: () => [null, null, null, null] })
}

import { isModalOpen, focusableElements, createGamepadPoller } from './game-input'

test('isModalOpen returns false when modal element has hidden attribute', () => {
  resetMocks()
  addEl('settings-modal', true)
  assert.equal(isModalOpen(), false)
})

test('isModalOpen returns true when modal element exists without hidden attribute', () => {
  resetMocks()
  addEl('settings-modal', false)
  assert.equal(isModalOpen(), true)
})

test('isModalOpen returns false when modal element does not exist', () => {
  resetMocks()
  assert.equal(isModalOpen(), false)
})

test('isModalOpen accepts a custom modalId', () => {
  resetMocks()
  addEl('my-modal', false)
  assert.equal(isModalOpen('my-modal'), true)
})

test('focusableElements returns empty array for null root', () => {
  assert.deepEqual(focusableElements(null), [])
})

test('createGamepadPoller returns an object with start, stop, and isConnected', () => {
  const poller = createGamepadPoller({
    onDpad() {},
    onButtonA() {},
    onButtonStart() {},
  })
  assert.equal(typeof poller.start, 'function')
  assert.equal(typeof poller.stop, 'function')
  assert.equal(typeof poller.isConnected, 'function')
  assert.equal(poller.isConnected(), false)
})
