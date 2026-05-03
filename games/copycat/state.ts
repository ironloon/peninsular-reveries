import type { DanceState, Cat, Pose, RoundConfig } from './types.js'

const MAX_HISTORY = 60

export const ROUNDS: RoundConfig[] = [
  {
    round: 1,
    maxRounds: 5,
    durationMs: 60000,
    bpm: 105,
    melodySeed: [0, 2, 4, 2, 0, 1, 3, 1, 0, 2, 4, 3, 1, 0, 2, 4, 2, 0, 1, 3],
    catDelayMs: 0,
    thresholds: [0.20, 0.40, 0.60, 0.80],
    songStyle: 'groove',
  },
  {
    round: 2,
    maxRounds: 5,
    durationMs: 60000,
    bpm: 118,
    melodySeed: [4, 3, 2, 1, 0, 1, 2, 3, 4, 2, 0, 2, 4, 3, 1, 3, 2, 0, 1, 4],
    catDelayMs: 0,
    thresholds: [0.20, 0.40, 0.60, 0.80],
    songStyle: 'drive',
  },
  {
    round: 3,
    maxRounds: 5,
    durationMs: 60000,
    bpm: 125,
    melodySeed: [0, 2, 1, 4, 3, 2, 0, 1, 3, 4, 2, 0, 2, 1, 3, 4, 0, 2, 1, 3],
    catDelayMs: 0,
    thresholds: [0.20, 0.40, 0.60, 0.80],
    songStyle: 'swing',
  },
  {
    round: 4,
    maxRounds: 5,
    durationMs: 60000,
    bpm: 132,
    melodySeed: [4, 2, 0, 3, 1, 4, 2, 0, 3, 1, 4, 0, 2, 3, 1, 4, 0, 2, 1, 3],
    catDelayMs: 0,
    thresholds: [0.20, 0.40, 0.60, 0.80],
    songStyle: 'half',
  },
  {
    round: 5,
    maxRounds: 5,
    durationMs: 60000,
    bpm: 142,
    melodySeed: [0, 4, 2, 3, 1, 4, 0, 2, 3, 1, 4, 0, 2, 3, 1, 4, 0, 2, 3, 4],
    catDelayMs: 0,
    thresholds: [0.20, 0.40, 0.60, 0.80],
    songStyle: 'break',
  },
]

function createPlayerCat(): Cat {
  return {
    id: 'cat-0',
    x: 0,
    y: 0,
    scale: 1.2,
    tint: 0xffffff,
    pose: 'idle',
    delayMs: 0,
    joinTime: 0,
  }
}

export function createInitialState(): DanceState {
  const config = ROUNDS[0]
  return {
    phase: 'start',
    cats: [createPlayerCat()],
    poseHistory: [],
    songProgress: 0,
    lastPoseTime: 0,
    round: config.round,
    maxRounds: config.maxRounds,
    config,
  }
}

export function startRound(state: DanceState): DanceState {
  const now = performance.now()
  return {
    ...state,
    phase: 'dancing',
    songProgress: 0,
    poseHistory: [],
    cats: [createPlayerCat()],
    lastPoseTime: now,
  }
}

export function nextRound(state: DanceState): DanceState | null {
  const nextIndex = state.round
  if (nextIndex >= state.maxRounds) return null

  const config = ROUNDS[nextIndex]
  return {
    ...state,
    round: config.round,
    config,
    phase: 'start',
    songProgress: 0,
    poseHistory: [],
    cats: [createPlayerCat()],
    lastPoseTime: 0,
  }
}

export function updatePose(state: DanceState, pose: Pose): DanceState {
  const now = performance.now()

  const newHistory = [...state.poseHistory, { pose, timestamp: now }]
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift()
  }

  const updatedCats = state.cats.map((cat) => {
    if (cat.delayMs === 0) {
      return { ...cat, pose }
    }

    const targetTime = now - cat.delayMs
    let closestEntry = newHistory[0]
    let closestDiff = Infinity

    for (const entry of newHistory) {
      const diff = Math.abs(entry.timestamp - targetTime)
      if (diff < closestDiff) {
        closestDiff = diff
        closestEntry = entry
      }
    }

    return { ...cat, pose: closestEntry.pose }
  })

  return {
    ...state,
    poseHistory: newHistory,
    cats: updatedCats,
    lastPoseTime: now,
  }
}

export function progressSong(state: DanceState, deltaMs: number): DanceState {
  const progressDelta = deltaMs / state.config.durationMs
  const newProgress = Math.min(state.songProgress + progressDelta, 1)

  let result: DanceState = {
    ...state,
    songProgress: newProgress,
  }

  const expectedDancerCount = 1 + state.config.thresholds.filter((t) => newProgress >= t).length

  while (result.cats.length < expectedDancerCount) {
    result = spawnCat(result)
  }

  return result
}

export function completeDance(state: DanceState): DanceState {
  return {
    ...state,
    phase: 'complete',
  }
}

export function spawnCat(state: DanceState): DanceState {
  const dancerCount = state.cats.length + 1
  const delayMs = state.config.catDelayMs * (dancerCount - 1)
  const newCat: Cat = {
    id: `cat-${state.cats.length}`,
    x: 0,
    y: 0,
    scale: 1.0,
    tint: 0xffffff,
    pose: state.cats[0]?.pose ?? 'idle',
    delayMs,
    joinTime: state.songProgress,
  }

  return {
    ...state,
    cats: [...state.cats, newCat],
  }
}
