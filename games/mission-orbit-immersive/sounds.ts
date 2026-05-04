import { getGameAudioBuses } from '../../client/game-audio.js'
import { ensureAudioUnlocked as baseEnsureAudioUnlocked } from '../../client/audio.js'

function getCtx(): AudioContext | null {
  try { return getGameAudioBuses('mission-orbit-immersive').ctx } catch { return null }
}
function getSfxBus(): GainNode { return getGameAudioBuses('mission-orbit-immersive').sfx }

export async function ensureAudioUnlocked(): Promise<void> { await baseEnsureAudioUnlocked() }

let muted = false
export function setMuted(m: boolean): void { muted = m }

export function sfxTap(): void {
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 440
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.1)
}

export function sfxSelect(): void {
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 660
  gain.gain.setValueAtTime(0.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.15)
}

export function sfxCorrect(): void {
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

export function sfxWrong(): void {
  const ctx = getCtx()
  if (!ctx || muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 220
  gain.gain.setValueAtTime(0.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.connect(gain).connect(getSfxBus())
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}