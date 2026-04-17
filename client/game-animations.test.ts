import test from 'node:test'
import assert from 'node:assert/strict'

// ── Mocks for preferences import chain ────────────────────────────────────────

const docDataset: Record<string, string | undefined> = {}
const storage = new Map<string, string>()

Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => { storage.set(k, v) },
    removeItem: (k: string) => { storage.delete(k) },
    clear: () => storage.clear(),
  },
  document: {
    getElementById: () => null,
    documentElement: { dataset: docDataset, setAttribute() {}, removeAttribute() {} },
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
})
if (typeof globalThis.window === 'undefined') {
  Object.assign(globalThis, { window: globalThis })
}

import { isReducedMotion, animateClass } from './game-animations'

test('isReducedMotion returns false by default', () => {
  delete docDataset.reduceMotion
  assert.equal(isReducedMotion(), false)
})

test('isReducedMotion returns true when data-reduce-motion is "reduce"', () => {
  docDataset.reduceMotion = 'reduce'
  assert.equal(isReducedMotion(), true)
  delete docDataset.reduceMotion
})

test('isReducedMotion returns false when data-reduce-motion is "no-preference"', () => {
  docDataset.reduceMotion = 'no-preference'
  assert.equal(isReducedMotion(), false)
  delete docDataset.reduceMotion
})

test('animateClass resolves immediately for null element', async () => {
  await animateClass(null, 'test-class')
  assert.ok(true)
})

test('animateClass with reduced motion adds and removes class synchronously', async () => {
  docDataset.reduceMotion = 'reduce'
  const classes = new Set<string>()
  const element = {
    classList: {
      add(c: string) { classes.add(c) },
      remove(c: string) { classes.delete(c) },
    },
    offsetWidth: 0,
  } as unknown as HTMLElement

  await animateClass(element, 'flash')
  assert.equal(classes.has('flash'), false, 'class should be removed after reduced-motion shortcut')
  delete docDataset.reduceMotion
})

test('animateClass without reduced motion adds class and resolves after duration', async () => {
  delete docDataset.reduceMotion
  const classes = new Set<string>()
  const element = {
    classList: {
      add(c: string) { classes.add(c) },
      remove(c: string) { classes.delete(c) },
    },
    offsetWidth: 0,
  } as unknown as HTMLElement

  const promise = animateClass(element, 'bounce', 10)
  assert.equal(classes.has('bounce'), true, 'class should be added immediately')
  await promise
  assert.equal(classes.has('bounce'), false, 'class should be removed after duration')
})
