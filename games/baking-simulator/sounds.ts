import { getGameAudioBuses } from '../../client/game-audio.js'

let globalMuted = false

function getCtx(): AudioContext | null {
  try { return getGameAudioBuses('baking-simulator').ctx } catch { return null }
}

function getSfxNode(): GainNode {
  return getGameAudioBuses('baking-simulator').sfx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15): void {
  const ctx = getCtx()
  if (!ctx || globalMuted) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type; osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain); gain.connect(getSfxNode())
    osc.start(); osc.stop(ctx.currentTime + duration)
  } catch { /* silent fail */ }
}

export function setMuted(m: boolean): void { globalMuted = m }

export function sfxClick(): void { playTone(800, 0.08, 'sine', 0.1) }
export function sfxSuccess(): void {
  playTone(523, 0.15, 'sine', 0.12)
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 120)
  setTimeout(() => playTone(784, 0.25, 'sine', 0.12), 240)
}
export function sfxKnead(): void { playTone(200 + Math.random() * 100, 0.06, 'triangle', 0.1) }
export function sfxBake(): void { playTone(150, 0.1, 'sawtooth', 0.05) }
export function sfxPull(): void {
  playTone(440, 0.2, 'sine', 0.15)
  setTimeout(() => playTone(660, 0.3, 'sine', 0.12), 100)
}

export function ensureAudioUnlocked(): void {
  const ctx = getCtx()
  if (ctx) try { if (ctx.state === 'suspended') ctx.resume() } catch { /* ok */ }
}