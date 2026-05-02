import type { DanceState, Cat, Pose } from './types.js'

const MAX_HISTORY = 60
const SONG_DURATION_MS = 30000
const THRESHOLDS = [0.20, 0.40, 0.60, 0.80]

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
  return {
    phase: 'start',
    cats: [createPlayerCat()],
    poseHistory: [],
    songProgress: 0,
    lastPoseTime: 0,
  }
}

export function startDance(state: DanceState): DanceState {
  return {
    ...state,
    phase: 'dancing',
    songProgress: 0,
    poseHistory: [],
    cats: [createPlayerCat()],
    lastPoseTime: performance.now(),
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
  const progressDelta = deltaMs / SONG_DURATION_MS
  const newProgress = Math.min(state.songProgress + progressDelta, 1)

  let result: DanceState = {
    ...state,
    songProgress: newProgress,
  }

  const expectedCatCount = 1 + THRESHOLDS.filter((t) => newProgress >= t).length

  while (result.cats.length < expectedCatCount) {
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
  const catCount = state.cats.length + 1
  // Dramatic follow-the-leader delay so each cat visibly trails the player
  const delayMs = 600 * (catCount - 1)
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
