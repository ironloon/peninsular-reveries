import { getMusicEnabled, getSfxEnabled } from './preferences.js'

// ── Singleton AudioContext ────────────────────────────────────────────────────

let ctx: AudioContext | null = null
let unlocked = false

export function getAudioContext(): AudioContext {
  if (!ctx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    ctx = new Ctor() as AudioContext
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

export function ensureAudioUnlocked(): void {
  if (unlocked) return
  const context = getAudioContext()
  const buffer = context.createBuffer(1, 1, 22050)
  const source = context.createBufferSource()
  source.buffer = buffer
  const silentGain = context.createGain()
  silentGain.gain.value = 0
  source.connect(silentGain)
  silentGain.connect(context.destination)
  source.start(0)
  void context.resume()
  unlocked = true
}

// ── Gain fade helper ──────────────────────────────────────────────────────────

export function fadeBusGain(bus: GainNode, targetGain: number, durationMs: number): void {
  const context = getAudioContext()
  const currentTime = context.currentTime
  bus.gain.cancelScheduledValues(currentTime)
  bus.gain.setValueAtTime(bus.gain.value, currentTime)
  bus.gain.linearRampToValueAtTime(targetGain, currentTime + durationMs / 1000)
}

// ── Music bus ─────────────────────────────────────────────────────────────────

export function createMusicBus(gameSlug: string): GainNode {
  const context = getAudioContext()
  const bus = context.createGain()
  const comp = context.createDynamicsCompressor()

  comp.threshold.value = -18
  comp.knee.value = 10
  comp.ratio.value = 6
  comp.attack.value = 0.005
  comp.release.value = 0.1

  bus.connect(comp)
  comp.connect(context.destination)

  bus.gain.value = getMusicEnabled(gameSlug) ? 0.20 : 0.0001

  window.addEventListener('reveries:music-change', (e) => {
    const event = e as CustomEvent<{ gameSlug: string; enabled: boolean }>
    if (event.detail.gameSlug === gameSlug) {
      fadeBusGain(bus, event.detail.enabled ? 0.20 : 0.0001, 300)
    }
  })

  return bus
}

// ── SFX bus ───────────────────────────────────────────────────────────────────

export function createSfxBus(gameSlug: string): GainNode {
  const context = getAudioContext()
  const bus = context.createGain()
  const comp = context.createDynamicsCompressor()

  comp.threshold.value = -18
  comp.knee.value = 10
  comp.ratio.value = 6
  comp.attack.value = 0.005
  comp.release.value = 0.1

  bus.connect(comp)
  comp.connect(context.destination)

  bus.gain.value = getSfxEnabled(gameSlug) ? 0.12 : 0.0001

  window.addEventListener('reveries:sfx-change', (e) => {
    const event = e as CustomEvent<{ gameSlug: string; enabled: boolean }>
    if (event.detail.gameSlug === gameSlug) {
      fadeBusGain(bus, event.detail.enabled ? 0.12 : 0.0001, 300)
    }
  })

  return bus
}

// ── Tone playback ─────────────────────────────────────────────────────────────

export interface ToneOptions {
  frequency: number
  type?: OscillatorType
  gain?: number
  duration: number
  attackTime?: number
  releaseTime?: number
}

export interface NoteEvent {
  frequency: number
  type?: OscillatorType
  gain?: number
  duration: number
  startOffset: number
  attackTime?: number
  releaseTime?: number
}

export type NoteSequence = NoteEvent[]

export function playTone(bus: GainNode, options: ToneOptions): void {
  if (bus.gain.value < 0.001) return

  const context = getAudioContext()
  const currentTime = context.currentTime
  const attackTime = options.attackTime ?? 0.01
  const releaseTime = options.releaseTime ?? 0.05
  const peakGain = options.gain ?? 0.5
  const duration = options.duration

  const osc = context.createOscillator()
  const envGain = context.createGain()

  osc.connect(envGain)
  envGain.connect(bus)

  osc.frequency.value = options.frequency
  osc.type = options.type ?? 'sine'

  envGain.gain.setValueAtTime(0.001, currentTime)
  envGain.gain.linearRampToValueAtTime(peakGain, currentTime + attackTime)
  envGain.gain.setValueAtTime(peakGain, currentTime + duration - releaseTime)
  envGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration)

  osc.start(currentTime)
  osc.stop(currentTime + duration)
}

export function playNotes(bus: GainNode, notes: NoteSequence): void {
  const context = getAudioContext()
  const now = context.currentTime

  for (const event of notes) {
    if (bus.gain.value < 0.001) return

    const attackTime = event.attackTime ?? 0.01
    const releaseTime = event.releaseTime ?? 0.05
    const peakGain = event.gain ?? 0.5
    const duration = event.duration
    const startTime = now + event.startOffset

    const osc = context.createOscillator()
    const envGain = context.createGain()

    osc.connect(envGain)
    envGain.connect(bus)

    osc.frequency.value = event.frequency
    osc.type = event.type ?? 'sine'

    envGain.gain.setValueAtTime(0.001, startTime)
    envGain.gain.linearRampToValueAtTime(peakGain, startTime + attackTime)
    envGain.gain.setValueAtTime(peakGain, startTime + duration - releaseTime)
    envGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }
}

// ── Visibility sync ───────────────────────────────────────────────────────────

export function syncBusWithVisibility(
  bus: GainNode,
  gameSlug: string,
  channel: 'music' | 'sfx',
): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      fadeBusGain(bus, 0.0001, 200)
    } else {
      const enabled =
        channel === 'music' ? getMusicEnabled(gameSlug) : getSfxEnabled(gameSlug)
      const targetGain = channel === 'music' ? 0.20 : 0.12
      fadeBusGain(bus, enabled ? targetGain : 0.0001, 400)
    }
  })
}
