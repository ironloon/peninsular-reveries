import test from 'node:test'
import assert from 'node:assert/strict'

// ── Minimal DOM mock ──────────────────────────────────────────────────────────

interface MockEl { hidden: boolean; attrs: Map<string, string> }
const elements = new Map<string, MockEl>()
function resetMocks(): void { elements.clear() }
function addEl(id: string): MockEl { const el: MockEl = { hidden: false, attrs: new Map() }; elements.set(id, el); return el }

Object.assign(globalThis, {
  document: {
    getElementById(id: string) {
      const mock = elements.get(id)
      if (!mock) return null
      return {
        get hidden() { return mock.hidden },
        set hidden(v: boolean) { mock.hidden = v },
        setAttribute(name: string, value: string) { mock.attrs.set(name, value) },
        removeAttribute(name: string) { mock.attrs.delete(name) },
      }
    },
  },
})

import { showScreen } from './game-screens'

test('showScreen shows the target screen and hides others', () => {
  resetMocks()
  const a = addEl('screen-a')
  const b = addEl('screen-b')
  const c = addEl('screen-c')

  showScreen('screen-b', ['screen-a', 'screen-b', 'screen-c'])

  assert.equal(a.hidden, true)
  assert.equal(b.hidden, false)
  assert.equal(c.hidden, true)
})

test('showScreen sets aria-hidden on inactive screens and clears it on active', () => {
  resetMocks()
  const a = addEl('screen-a')
  const b = addEl('screen-b')

  showScreen('screen-a', ['screen-a', 'screen-b'])

  assert.equal(a.attrs.has('aria-hidden'), false)
  assert.equal(b.attrs.get('aria-hidden'), 'true')
})

test('showScreen skips missing elements without errors', () => {
  resetMocks()
  addEl('screen-a')
  assert.doesNotThrow(() => showScreen('screen-a', ['screen-a', 'screen-missing']))
})
