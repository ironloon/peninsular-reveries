import { getAudioContext, createMusicBus, createSfxBus } from './audio.js'

export interface GameAudioBuses {
  readonly music: GainNode
  readonly sfx: GainNode
  readonly ctx: AudioContext
}

const busCache = new Map<string, GameAudioBuses>()

export function getGameAudioBuses(slug: string): GameAudioBuses {
  const cached = busCache.get(slug)
  if (cached) return cached

  const ctx = getAudioContext()
  const music = createMusicBus()
  const sfx = createSfxBus()
  const buses: GameAudioBuses = { music, sfx, ctx }
  busCache.set(slug, buses)
  return buses
}
