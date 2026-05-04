import { getGameAudioBuses } from '../../client/game-audio.js'
import { ensureAudioUnlocked as baseEnsureAudioUnlocked } from '../../client/audio.js'

function getCtx(): AudioContext | null {
  try { return getGameAudioBuses('beat-pad-immersive').ctx } catch { return null }
}
function getSfxBus(): GainNode { return getGameAudioBuses('beat-pad-immersive').sfx }

export async function ensureAudioUnlocked(): Promise<void> { await baseEnsureAudioUnlocked() }

let muted = false
export function setMuted(m: boolean): void { muted = m }

// Synthesized drum sounds
export function triggerKitPad(index: number): void {
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const freqs = [100, 200, 400, 3000, 150, 5000, 800, 6000] // kick, snare, clap, hihat, tom, cymbal, rim, open-hihat
  osc.frequency.value = freqs[index % freqs.length] ?? 200
  osc.type = index % 2 === 0 ? 'sine' : 'square'
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.2)
}

export function triggerBassPad(index: number): void {
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const freqs = [55, 110, 82.5, 165, 73.5, 55, 98, 131] // bass notes
  osc.frequency.value = freqs[index % freqs.length] ?? 55
  osc.type = 'sawtooth'
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
}