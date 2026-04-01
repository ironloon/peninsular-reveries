// ── Sound Effects (Web Audio API — no external files) ────────

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (!ctx) {
    try { ctx = new AudioContext() } catch { return null }
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15): void {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime)
  osc.stop(c.currentTime + duration)
}

function playNotes(notes: Array<[number, number]>, type: OscillatorType = 'sine', volume = 0.12): void {
  const c = getCtx()
  if (!c) return
  let offset = 0
  for (const [freq, dur] of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, c.currentTime + offset)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + offset + dur)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime + offset)
    osc.stop(c.currentTime + offset + dur)
    offset += dur * 0.7
  }
}

// ── Public API ───────────────────────────────────────────────

export function sfxCollect(): void {
  // Bright ascending pop
  playTone(880, 0.12, 'sine', 0.12)
  setTimeout(() => playTone(1100, 0.1, 'sine', 0.1), 60)
}

export function sfxDistractor(): void {
  // Low buzz
  playTone(180, 0.2, 'square', 0.08)
}

export function sfxCorrect(): void {
  // Happy ascending arpeggio
  playNotes([
    [523, 0.12], // C5
    [659, 0.12], // E5
    [784, 0.12], // G5
    [1047, 0.2], // C6
  ], 'sine', 0.12)
}

export function sfxWrong(): void {
  // Descending wobble
  playNotes([
    [350, 0.15],
    [280, 0.2],
  ], 'triangle', 0.1)
}

export function sfxWin(): void {
  // Triumphant fanfare
  playNotes([
    [523, 0.15],  // C5
    [659, 0.15],  // E5
    [784, 0.15],  // G5
    [1047, 0.12], // C6
    [784, 0.1],   // G5
    [1047, 0.3],  // C6
  ], 'sine', 0.14)
}

export function sfxButton(): void {
  // Soft click
  playTone(660, 0.06, 'sine', 0.08)
}

export function sfxSwap(): void {
  // Quick whoosh
  playTone(400, 0.08, 'triangle', 0.08)
  setTimeout(() => playTone(500, 0.08, 'triangle', 0.06), 40)
}
