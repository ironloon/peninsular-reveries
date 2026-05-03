import type { GameState, PianoKey } from './types.js'

// ── Note definitions ──────────────────────────────────────────────────────────

interface NoteDef {
  note: string
  frequency: number
  isBlack: boolean
}

const NOTES: NoteDef[] = [
  { note: 'C4',  frequency: 261.63, isBlack: false },
  { note: 'C#4', frequency: 277.18, isBlack: true },
  { note: 'D4',  frequency: 293.66, isBlack: false },
  { note: 'D#4', frequency: 311.13, isBlack: true },
  { note: 'E4',  frequency: 329.63, isBlack: false },
  { note: 'F4',  frequency: 349.23, isBlack: false },
  { note: 'F#4', frequency: 369.99, isBlack: true },
  { note: 'G4',  frequency: 392.00, isBlack: false },
  { note: 'G#4', frequency: 415.30, isBlack: true },
  { note: 'A4',  frequency: 440.00, isBlack: false },
  { note: 'A#4', frequency: 466.16, isBlack: true },
  { note: 'B4',  frequency: 493.88, isBlack: false },
  { note: 'C5',  frequency: 523.25, isBlack: false },
  { note: 'C#5', frequency: 554.37, isBlack: true },
  { note: 'D5',  frequency: 587.33, isBlack: false },
  { note: 'D#5', frequency: 622.25, isBlack: true },
  { note: 'E5',  frequency: 659.26, isBlack: false },
  { note: 'F5',  frequency: 698.46, isBlack: false },
  { note: 'F#5', frequency: 739.99, isBlack: true },
  { note: 'G5',  frequency: 783.99, isBlack: false },
  { note: 'G#5', frequency: 830.61, isBlack: true },
  { note: 'A5',  frequency: 880.00, isBlack: false },
  { note: 'A#5', frequency: 932.33, isBlack: true },
  { note: 'B5',  frequency: 987.77, isBlack: false },
]

const BLACK_KEY_HEIGHT_RATIO = 0.55
const BLACK_KEY_WIDTH_RATIO = 0.58 // relative to white key width

export function buildPianoKeys(): PianoKey[] {
  const whiteKeys = NOTES.filter((n) => !n.isBlack)
  const blackKeys = NOTES.filter((n) => n.isBlack)

  const whiteCount = whiteKeys.length
  const whiteKeyWidth = 1 / whiteCount

  const keys: PianoKey[] = []

  // White keys first
  for (let i = 0; i < whiteKeys.length; i++) {
    const n = whiteKeys[i]
    const globalIndex = NOTES.indexOf(n)
    keys.push({
      note: n.note,
      noteIndex: globalIndex,
      frequency: n.frequency,
      isBlack: false,
      x0: i * whiteKeyWidth,
      x1: (i + 1) * whiteKeyWidth,
      y0: BLACK_KEY_HEIGHT_RATIO,
      y1: 1,
    })
  }

  // Black keys overlay between specific white keys
  // Map black key positions relative to the white key layout
  const blackKeyPositions: Record<string, { afterWhiteIndex: number }> = {
    'C#4': { afterWhiteIndex: 0 },
    'D#4': { afterWhiteIndex: 1 },
    'F#4': { afterWhiteIndex: 3 },
    'G#4': { afterWhiteIndex: 4 },
    'A#4': { afterWhiteIndex: 5 },
    'C#5': { afterWhiteIndex: 7 },
    'D#5': { afterWhiteIndex: 8 },
    'F#5': { afterWhiteIndex: 10 },
    'G#5': { afterWhiteIndex: 11 },
    'A#5': { afterWhiteIndex: 12 },
  }

  for (const n of blackKeys) {
    const globalIndex = NOTES.indexOf(n)
    const pos = blackKeyPositions[n.note]
    if (!pos) continue

    const center = (pos.afterWhiteIndex + 1) * whiteKeyWidth
    const bw = whiteKeyWidth * BLACK_KEY_WIDTH_RATIO

    keys.push({
      note: n.note,
      noteIndex: globalIndex,
      frequency: n.frequency,
      isBlack: true,
      x0: center - bw / 2,
      x1: center + bw / 2,
      y0: 0,
      y1: BLACK_KEY_HEIGHT_RATIO,
    })
  }

  return keys
}

export function createInitialState(): GameState {
  return {
    phase: 'start',
    tuna: {
      tunaPressed: false,
    },
    keys: buildPianoKeys(),
  }
}

/** Which key is under a normalized X position? Black keys take priority. */
export function keyAtPosition(
  keys: PianoKey[],
  normalizedX: number,
  normalizedY: number,
): PianoKey | null {
  // Check black keys first (they overlay white keys)
  const blackKeys = keys.filter((k) => k.isBlack)
  for (const key of blackKeys) {
    if (normalizedX >= key.x0 && normalizedX <= key.x1 && normalizedY >= key.y0 && normalizedY <= key.y1) {
      return key
    }
  }
  // Then white keys
  const whiteKeys = keys.filter((k) => !k.isBlack)
  for (const key of whiteKeys) {
    if (normalizedX >= key.x0 && normalizedX <= key.x1 && normalizedY >= key.y0 && normalizedY <= key.y1) {
      return key
    }
  }
  return null
}

/** Is the position in the tuna zone (top-right corner)? */
export function isInTunaZone(normalizedX: number, normalizedY: number): boolean {
  // Top-right 20% × 20% — generous zone so fist-over-fish is reliable
  return normalizedX >= 0.80 && normalizedY <= 0.20
}