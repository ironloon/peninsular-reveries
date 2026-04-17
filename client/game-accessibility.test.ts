import test from 'node:test'
import assert from 'node:assert/strict'

// ── Minimal DOM mock ──────────────────────────────────────────────────────────

interface MockEl { textContent: string | null; focused: boolean }
const elements = new Map<string, MockEl>()
function resetMocks(): void { elements.clear() }
function addEl(id: string): MockEl { const el: MockEl = { textContent: null, focused: false }; elements.set(id, el); return el }

Object.assign(globalThis, {
  document: {
    getElementById(id: string) {
      const el = elements.get(id)
      if (!el) return null
      return {
        get textContent() { return el.textContent },
        set textContent(v: string | null) { el.textContent = v },
        focus() { el.focused = true },
      }
    },
  },
  requestAnimationFrame: (cb: FrameRequestCallback) => { cb(0); return 0 },
})
if (typeof globalThis.window === 'undefined') {
  Object.assign(globalThis, { window: globalThis })
}

import { announce, moveFocusAfterTransition } from './game-accessibility'

test('announce polite writes to #game-status', () => {
  resetMocks()
  addEl('game-status')
  addEl('game-feedback')
  announce('Hello', 'polite')
  assert.equal(elements.get('game-status')!.textContent, 'Hello')
  assert.equal(elements.get('game-feedback')!.textContent, null)
})

test('announce assertive writes to #game-feedback', () => {
  resetMocks()
  addEl('game-status')
  addEl('game-feedback')
  announce('Alert', 'assertive')
  assert.equal(elements.get('game-feedback')!.textContent, 'Alert')
  assert.equal(elements.get('game-status')!.textContent, null)
})

test('announce is a no-op when target element is missing', () => {
  resetMocks()
  assert.doesNotThrow(() => announce('Missing', 'polite'))
})

test('moveFocusAfterTransition focuses the element after delay', async () => {
  resetMocks()
  const el = addEl('focus-target')
  moveFocusAfterTransition('focus-target', 10)
  await new Promise(resolve => setTimeout(resolve, 50))
  assert.equal(el.focused, true)
})
