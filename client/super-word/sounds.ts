// ── Sound Effects (Web Audio API — no external files) ────────

let ctx: AudioContext | null = null
let unlocked = false
let musicEnabled = false
let musicPreferenceLoaded = false
let musicLoopHandle: number | null = null
let musicBus: GainNode | null = null
let musicMeasureIndex = 0

const MUSIC_STORAGE_KEY = 'super-word-music-enabled'
const AMBIENT_MEASURE_MS = 4200
const AMBIENT_PROGRESSIONS = [
  {
    chord: [196, 293.66, 392],
    sparkles: [493.88, 587.33],
  },
  {
    chord: [174.61, 261.63, 392],
    sparkles: [440, 523.25],
  },
  {
    chord: [220, 329.63, 392],
    sparkles: [493.88, 659.25],
  },
  {
    chord: [196, 293.66, 369.99],
    sparkles: [440, 554.37],
  },
]

function getCtx(): AudioContext | null {
  if (!ctx) {
    try { ctx = new AudioContext() } catch { return null }
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

function loadMusicPreference(): void {
  if (musicPreferenceLoaded) return
  musicPreferenceLoaded = true
  try {
    musicEnabled = window.localStorage.getItem(MUSIC_STORAGE_KEY) === 'true'
  } catch {
    musicEnabled = false
  }
}

function getMusicBus(c: AudioContext): GainNode {
  if (!musicBus) {
    musicBus = c.createGain()
    musicBus.gain.value = 0.0001
    musicBus.connect(c.destination)
  }
  return musicBus
}

function fadeMusicBus(target: number, duration: number): void {
  const c = getCtx()
  if (!c) return

  const bus = getMusicBus(c)
  const safeTarget = Math.max(target, 0.0001)
  const currentValue = Math.max(bus.gain.value, 0.0001)

  bus.gain.cancelScheduledValues(c.currentTime)
  bus.gain.setValueAtTime(currentValue, c.currentTime)
  if (safeTarget > currentValue) {
    bus.gain.linearRampToValueAtTime(safeTarget, c.currentTime + duration)
  } else {
    bus.gain.exponentialRampToValueAtTime(safeTarget, c.currentTime + duration)
  }
}

function playAmbientPad(freq: number, startTime: number, duration: number, volume: number): void {
  const c = getCtx()
  if (!c) return

  const destination = getMusicBus(c)
  const filter = c.createBiquadFilter()
  const gain = c.createGain()
  const oscA = c.createOscillator()
  const oscB = c.createOscillator()

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1400, startTime)
  filter.Q.value = 0.4

  oscA.type = 'triangle'
  oscB.type = 'sine'
  oscA.frequency.setValueAtTime(freq, startTime)
  oscB.frequency.setValueAtTime(freq * 0.5, startTime)
  oscB.detune.setValueAtTime(6, startTime)

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.9)
  gain.gain.linearRampToValueAtTime(volume * 0.72, startTime + Math.max(duration - 1.3, 1))
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscA.connect(filter)
  oscB.connect(filter)
  filter.connect(gain)
  gain.connect(destination)

  oscA.start(startTime)
  oscB.start(startTime)
  oscA.stop(startTime + duration)
  oscB.stop(startTime + duration)
}

function playAmbientBell(freq: number, startTime: number, duration: number, volume: number): void {
  const c = getCtx()
  if (!c) return

  const destination = getMusicBus(c)
  const osc = c.createOscillator()
  const gain = c.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  osc.connect(gain)
  gain.connect(destination)

  osc.start(startTime)
  osc.stop(startTime + duration)
}

function scheduleAmbientMeasure(startTime: number): void {
  const progression = AMBIENT_PROGRESSIONS[musicMeasureIndex % AMBIENT_PROGRESSIONS.length]
  for (const freq of progression.chord) {
    playAmbientPad(freq, startTime, 4.5, 0.014)
  }
  for (let i = 0; i < progression.sparkles.length; i++) {
    playAmbientBell(progression.sparkles[i], startTime + 0.7 + i * 1.1, 1.2, 0.012)
  }
  musicMeasureIndex += 1
}

function startAmbientMusic(): void {
  const c = getCtx()
  if (!c || c.state === 'suspended' || musicLoopHandle !== null || document.hidden) return

  fadeMusicBus(0.07, 1.2)
  scheduleAmbientMeasure(c.currentTime + 0.05)
  musicLoopHandle = window.setInterval(() => {
    const currentCtx = getCtx()
    if (!currentCtx || currentCtx.state === 'suspended' || document.hidden) return
    scheduleAmbientMeasure(currentCtx.currentTime + 0.05)
  }, AMBIENT_MEASURE_MS)
}

function stopAmbientMusic(): void {
  if (musicLoopHandle !== null) {
    window.clearInterval(musicLoopHandle)
    musicLoopHandle = null
  }
  fadeMusicBus(0.0001, 0.8)
}

// Must be called from a user-gesture event handler (click/pointerdown/keydown)
export function ensureAudioUnlocked(): void {
  if (unlocked) return
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume()
  // Play a silent buffer to unlock on iOS/Safari
  const buf = c.createBuffer(1, 1, c.sampleRate)
  const src = c.createBufferSource()
  src.buffer = buf
  src.connect(c.destination)
  src.start()
  unlocked = true
  syncMusicPlayback()
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

export function getMusicEnabled(): boolean {
  loadMusicPreference()
  return musicEnabled
}

export function setMusicEnabled(enabled: boolean): void {
  loadMusicPreference()
  if (musicEnabled !== enabled) {
    musicMeasureIndex = 0
  }
  musicEnabled = enabled
  try {
    window.localStorage.setItem(MUSIC_STORAGE_KEY, String(enabled))
  } catch {
    // Ignore storage failures and keep the in-memory setting.
  }
  syncMusicPlayback()
}

export function syncMusicPlayback(): void {
  loadMusicPreference()
  if (!musicEnabled || document.hidden) {
    stopAmbientMusic()
    return
  }
  startAmbientMusic()
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
