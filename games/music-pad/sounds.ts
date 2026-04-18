function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const bufferSize = Math.max(1, Math.ceil(ctx.sampleRate * durationSec))
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    channel[i] = Math.random() * 2 - 1
  }
  return buffer
}

export function playKick(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const duration = 0.3
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(60, now)
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.15)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.6, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc.connect(gain)
  gain.connect(sfx)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playSnare(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const duration = 0.1

  // Noise component
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, duration)
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.setValueAtTime(3000, now)
  noiseFilter.Q.setValueAtTime(1.0, now)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.0001, now)
  noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.005)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(sfx)
  noise.start(now)
  noise.stop(now + duration + 0.02)

  // Body sine
  const body = ctx.createOscillator()
  const bodyGain = ctx.createGain()
  body.type = 'sine'
  body.frequency.setValueAtTime(200, now)
  bodyGain.gain.setValueAtTime(0.0001, now)
  bodyGain.gain.linearRampToValueAtTime(0.3, now + 0.005)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
  body.connect(bodyGain)
  bodyGain.connect(sfx)
  body.start(now)
  body.stop(now + 0.08)
}

export function playHiHatClosed(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const duration = 0.05
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(8000, now)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.4, now + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(sfx)
  noise.start(now)
  noise.stop(now + duration + 0.02)
}

export function playHiHatOpen(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const duration = 0.3
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(6000, now)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.4, now + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(sfx)
  noise.start(now)
  noise.stop(now + duration + 0.02)
}

export function playClap(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const burstDuration = 0.01
  const burstSpacing = 0.015

  for (let i = 0; i < 3; i++) {
    const startTime = now + i * burstSpacing
    const noise = ctx.createBufferSource()
    noise.buffer = createNoiseBuffer(ctx, burstDuration)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1500, startTime)
    filter.Q.setValueAtTime(1.0, startTime)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.linearRampToValueAtTime(0.5, startTime + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + burstDuration)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(sfx)
    noise.start(startTime)
    noise.stop(startTime + burstDuration + 0.01)
  }

  // Tail
  const tailStart = now + 3 * burstSpacing
  const tailDuration = 0.1
  const tail = ctx.createBufferSource()
  tail.buffer = createNoiseBuffer(ctx, tailDuration)
  const tailFilter = ctx.createBiquadFilter()
  tailFilter.type = 'bandpass'
  tailFilter.frequency.setValueAtTime(1500, tailStart)
  tailFilter.Q.setValueAtTime(1.0, tailStart)
  const tailGain = ctx.createGain()
  tailGain.gain.setValueAtTime(0.0001, tailStart)
  tailGain.gain.linearRampToValueAtTime(0.3, tailStart + 0.005)
  tailGain.gain.exponentialRampToValueAtTime(0.0001, tailStart + tailDuration)
  tail.connect(tailFilter)
  tailFilter.connect(tailGain)
  tailGain.connect(sfx)
  tail.start(tailStart)
  tail.stop(tailStart + tailDuration + 0.02)
}

export function playRim(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const duration = 0.03
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.5, now + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain)
  gain.connect(sfx)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playTom(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const duration = 0.25
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.2)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.5, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain)
  gain.connect(sfx)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playCymbal(sfx: GainNode, ctx: AudioContext): void {
  const now = ctx.currentTime
  const duration = 0.8
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(4000, now)
  filter.Q.setValueAtTime(3.0, now)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(0.45, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(sfx)
  noise.start(now)
  noise.stop(now + duration + 0.02)
}

export type PadSoundFn = (sfx: GainNode, ctx: AudioContext) => void

export const PAD_SOUNDS: readonly PadSoundFn[] = [
  playKick,
  playSnare,
  playHiHatClosed,
  playHiHatOpen,
  playClap,
  playRim,
  playTom,
  playCymbal,
]

export const PAD_NAMES: readonly string[] = [
  'Kick',
  'Snare',
  'Hi-Hat',
  'Open Hat',
  'Clap',
  'Rim',
  'Tom',
  'Cymbal',
]
