import { getGameAudioBuses } from '../../client/game-audio.js'

let sfxBus: GainNode | null = null
let ctx: AudioContext | null = null
let globalMuted = false

// Track active sustained notes by ID
const activeSustainedNotes = new Map<string, { oscillator: OscillatorNode; osc2: OscillatorNode; osc3: OscillatorNode; gain: GainNode; osc2Gain: GainNode; osc3Gain: GainNode }>()

function ensureAudio(): { ctx: AudioContext; bus: GainNode } {
  if (!ctx) {
    const buses = getGameAudioBuses('tuna-piano')
    ctx = buses.ctx
    sfxBus = buses.sfx
  }
  return { ctx, bus: sfxBus! }
}

/** Play a piano note. Returns the note ID for later release. */
export function playNote(frequency: number, sustained: boolean, noteIndex: number, noteId: string): string {
  const { ctx: audioCtx, bus } = ensureAudio()

  if (globalMuted || bus.gain.value < 0.001) return noteId

  const now = audioCtx.currentTime

  // Create oscillator with slight detuning for warmth
  const osc1 = audioCtx.createOscillator()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(frequency, now)

  // Second oscillator slightly detuned for richness
  const osc2 = audioCtx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(frequency * 1.002, now)

  // Third harmonic for brightness
  const osc3 = audioCtx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(frequency * 2, now)

  // Gain envelope
  const gainNode = audioCtx.createGain()
  const peakGain = sustained ? 0.18 : 0.22
  const attackTime = sustained ? 0.08 : 0.01
  const decayTime = sustained ? 0 : 0.3
  const sustainLevel = sustained ? peakGain : peakGain * 0.6

  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.linearRampToValueAtTime(peakGain, now + attackTime)

  if (!sustained) {
    // Short note: attack then decay
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime * 0.3)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime)
  }
  // Sustained notes hold until explicitly released

  // Second oscillator gain (quieter)
  const osc2Gain = audioCtx.createGain()
  osc2Gain.gain.setValueAtTime(0.0001, now)
  osc2Gain.gain.linearRampToValueAtTime(sustained ? 0.08 : 0.1, now + attackTime)

  if (!sustained) {
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime)
  }

  // Third harmonic gain (very subtle)
  const osc3Gain = audioCtx.createGain()
  osc3Gain.gain.setValueAtTime(0.0001, now)
  osc3Gain.gain.linearRampToValueAtTime(0.03, now + attackTime)

  if (!sustained) {
    osc3Gain.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime)
  }

  // Connect
  osc1.connect(gainNode)
  osc2.connect(osc2Gain)
  osc3.connect(osc3Gain)
  gainNode.connect(bus)
  osc2Gain.connect(bus)
  osc3Gain.connect(bus)

  osc1.start(now)
  osc2.start(now)
  osc3.start(now)

  if (!sustained) {
    const endTime = now + attackTime + decayTime + 0.05
    osc1.stop(endTime)
    osc2.stop(endTime)
    osc3.stop(endTime)
  } else {
    // Store for later release
    activeSustainedNotes.set(noteId, {
      oscillator: osc1,
      osc2,
      osc3,
      gain: gainNode,
      osc2Gain,
      osc3Gain,
    })
  }

  return noteId
}

/** Release a sustained note with a nice fade-out. */
export function releaseNote(noteId: string): void {
  const note = activeSustainedNotes.get(noteId)
  if (!note) return

  const { ctx: audioCtx } = ensureAudio()
  const now = audioCtx.currentTime
  const releaseTime = 0.4

  note.gain.gain.cancelScheduledValues(now)
  note.gain.gain.setValueAtTime(note.gain.gain.value, now)
  note.gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime)

  note.osc2Gain.gain.cancelScheduledValues(now)
  note.osc2Gain.gain.setValueAtTime(note.osc2Gain.gain.value, now)
  note.osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime)

  note.osc3Gain.gain.cancelScheduledValues(now)
  note.osc3Gain.gain.setValueAtTime(note.osc3Gain.gain.value, now)
  note.osc3Gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime)

  const endTime = now + releaseTime + 0.05
  try { note.oscillator.stop(endTime) } catch { /* already stopped */ }
  try { note.osc2.stop(endTime) } catch { /* already stopped */ }
  try { note.osc3.stop(endTime) } catch { /* already stopped */ }

  activeSustainedNotes.delete(noteId)
}

/** Release all currently held notes */
export function releaseAllNotes(): void {
  for (const noteId of activeSustainedNotes.keys()) {
    releaseNote(noteId)
  }
}

/** Play a quick "tuna tap" sound */
export function sfxTunaTap(): void {
  if (globalMuted) return
  const { ctx: audioCtx, bus } = ensureAudio()
  const now = audioCtx.currentTime

  const osc = audioCtx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.15)

  const gain = audioCtx.createGain()
  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)

  osc.connect(gain)
  gain.connect(bus)
  osc.start(now)
  osc.stop(now + 0.2)
}

/** Play a bubbly "tuna activated" sound */
export function sfxTunaActivate(): void {
  if (globalMuted) return
  const { ctx: audioCtx, bus } = ensureAudio()
  const now = audioCtx.currentTime

  const notes = [660, 880, 1100]
  for (let i = 0; i < notes.length; i++) {
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(notes[i], now + i * 0.1)

    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(0.0001, now + i * 0.1)
    gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.25)

    osc.connect(gain)
    gain.connect(bus)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.3)
  }
}

/** Play a bubbly note trigger sound (very subtle) */
export function sfxNoteTrigger(): void {
  if (globalMuted) return
  const { ctx: audioCtx, bus } = ensureAudio()
  const now = audioCtx.currentTime

  const osc = audioCtx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1200, now)
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.06)

  const gain = audioCtx.createGain()
  gain.gain.setValueAtTime(0.04, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)

  osc.connect(gain)
  gain.connect(bus)
  osc.start(now)
  osc.stop(now + 0.1)
}

/** Ambient underwater bubbling */
let ambienceNodes: { oscs: OscillatorNode[]; gain: GainNode } | null = null

export function startAmbience(): void {
  if (globalMuted) return
  if (ambienceNodes) return

  const { ctx: audioCtx, bus } = ensureAudio()

  const gain = audioCtx.createGain()
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime)
  gain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 2)
  gain.connect(bus)

  const oscs: OscillatorNode[] = []

  // Deep underwater hum
  const o1 = audioCtx.createOscillator()
  o1.type = 'sine'
  o1.frequency.setValueAtTime(55, audioCtx.currentTime)
  o1.connect(gain)
  o1.start()
  oscs.push(o1)

  // Subtle higher tone
  const o2 = audioCtx.createOscillator()
  o2.type = 'triangle'
  o2.frequency.setValueAtTime(82.5, audioCtx.currentTime)
  o2.connect(gain)
  o2.start()
  oscs.push(o2)

  // Very subtle shimmer
  const o3 = audioCtx.createOscillator()
  o3.type = 'sine'
  o3.frequency.setValueAtTime(110, audioCtx.currentTime)
  o3.connect(gain)
  o3.start()
  oscs.push(o3)

  ambienceNodes = { oscs, gain }
}

export function stopAmbience(): void {
  if (!ambienceNodes) return
  for (const osc of ambienceNodes.oscs) {
    try { osc.stop() } catch { /* already stopped */ }
  }
  try { ambienceNodes.gain.disconnect() } catch { /* already disconnected */ }
  ambienceNodes = null
}

export function setMuted(muted: boolean): void {
  globalMuted = muted
  if (muted) {
    stopAmbience()
    releaseAllNotes()
  }
}

export function ensureAudioUnlocked(): void {
  const { ctx: audioCtx } = ensureAudio()
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
}