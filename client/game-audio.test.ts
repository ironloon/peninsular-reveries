import test from 'node:test'
import assert from 'node:assert/strict'

// ── Browser mocks for audio.js import chain ───────────────────────────────────

const storage = new Map<string, string>()

function mockAudioParam() {
  return { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }
}
function mockGain() {
  return { gain: mockAudioParam(), connect() { return this }, disconnect() {} }
}
function mockCompressor() {
  return { ...mockGain(), threshold: mockAudioParam(), knee: mockAudioParam(), ratio: mockAudioParam(), attack: mockAudioParam(), release: mockAudioParam() }
}

Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => { storage.set(k, v) },
    removeItem: (k: string) => { storage.delete(k) },
    clear: () => storage.clear(),
  },
  document: {
    getElementById: () => null,
    documentElement: { dataset: {}, setAttribute() {}, removeAttribute() {} },
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  AudioContext: class MockAudioContext {
    state = 'running'
    currentTime = 0
    sampleRate = 44100
    destination = {}
    createGain() { return mockGain() }
    createDynamicsCompressor() { return mockCompressor() }
    resume() { return Promise.resolve() }
  },
  addEventListener() {},
  removeEventListener() {},
})
if (typeof globalThis.window === 'undefined') {
  Object.assign(globalThis, { window: globalThis })
}

import { getGameAudioBuses } from './game-audio'

test('getGameAudioBuses returns buses with music, sfx, and ctx', () => {
  const buses = getGameAudioBuses('test-slug')
  assert.ok(buses.music, 'Expected music bus')
  assert.ok(buses.sfx, 'Expected sfx bus')
  assert.ok(buses.ctx, 'Expected AudioContext')
})

test('getGameAudioBuses caches by slug', () => {
  const first = getGameAudioBuses('cache-test')
  const second = getGameAudioBuses('cache-test')
  assert.strictEqual(first, second, 'Same slug should return same cached instance')
})

test('getGameAudioBuses returns different instances for different slugs', () => {
  const a = getGameAudioBuses('slug-a')
  const b = getGameAudioBuses('slug-b')
  assert.notStrictEqual(a, b, 'Different slugs should return different instances')
})
