import test from 'node:test'
import assert from 'node:assert/strict'

// ── Browser mocks for audio.js / preferences.js import chain ──────────────────

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
    createOscillator() { return { type: 'sine', frequency: mockAudioParam(), connect() {}, start() {}, stop() {}, disconnect() {} } }
    createBiquadFilter() { return { type: 'lowpass', frequency: { value: 0, setValueAtTime() {} }, Q: { value: 0, setValueAtTime() {} }, connect() {}, disconnect() {} } }
    createBuffer(_channels: number, length: number, sampleRate: number) { return { getChannelData() { return new Float32Array(length) }, numberOfChannels: 1, sampleRate, length } }
    createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {}, disconnect() {}, loop: false } }
    resume() { return Promise.resolve() }
  },
})
if (typeof globalThis.window === 'undefined') {
  Object.assign(globalThis, { window: globalThis })
}

import { MUSIC_TRACKS, getSelectedTrackId, setSelectedTrackId } from './music-catalog'

test('MUSIC_TRACKS has 10 entries', () => {
  assert.equal(MUSIC_TRACKS.length, 10)
})

test('every track has id, name, start, and stop', () => {
  for (const track of MUSIC_TRACKS) {
    assert.equal(typeof track.id, 'string', `track missing id`)
    assert.equal(typeof track.name, 'string', `${track.id} missing name`)
    assert.equal(typeof track.start, 'function', `${track.id} missing start`)
    assert.equal(typeof track.stop, 'function', `${track.id} missing stop`)
  }
})

test('track ids are unique', () => {
  const ids = MUSIC_TRACKS.map(t => t.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('getSelectedTrackId returns null when no selection stored', () => {
  storage.clear()
  assert.equal(getSelectedTrackId(), null)
})

test('setSelectedTrackId persists and getSelectedTrackId retrieves', () => {
  storage.clear()
  setSelectedTrackId('driftwood')
  assert.equal(getSelectedTrackId(), 'driftwood')
})
