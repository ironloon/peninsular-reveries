import type { GameState, SteamPuff } from './types.js'

export function createInitialState(): GameState {
  return {
    phase: 'start',
    trainX: -200,
    trainSpeed: 0,
    targetTrainX: -200,
    chuggaCount: 0,
    totalDistance: 0,
    whistleTriggered: false,
    whistleCooldown: 0,
    armRotateCooldown: 0,
    chuggingActive: false,
    chuggingTimer: 0,
    steamPuffs: [],
    wheels: [
      { angle: 0, speed: 0 },
      { angle: 0, speed: 0 },
    ],
    globalTime: 0,
    score: 0,
    trips: 0,
    announcedAllAboard: false,
  }
}

export function triggerWhistle(state: GameState): GameState {
  if (state.whistleCooldown > 0) return state
  return {
    ...state,
    whistleTriggered: true,
    whistleCooldown: 3,
    announcedAllAboard: false,
  }
}

export function startChugging(state: GameState): GameState {
  if (state.chuggingActive) return state
  return {
    ...state,
    chuggingActive: true,
    chuggingTimer: 0,
    chuggaCount: state.chuggaCount + 1,
  }
}

export function stopChugging(state: GameState): GameState {
  return {
    ...state,
    chuggingActive: false,
    chuggingTimer: 0,
  }
}

export function updateGame(state: GameState, dt: number, screenWidth: number): GameState {
  const s = { ...state }
  s.globalTime += dt

  // Decrease cooldowns
  if (s.whistleCooldown > 0) s.whistleCooldown -= dt
  if (s.armRotateCooldown > 0) s.armRotateCooldown -= dt

  // Train physics
  if (s.chuggingActive) {
    s.trainSpeed = Math.min(s.trainSpeed + 300 * dt, 400)
    s.chuggingTimer += dt
  } else {
    s.trainSpeed = Math.max(s.trainSpeed - 150 * dt, 0)
  }

  s.trainX += s.trainSpeed * dt
  s.totalDistance += Math.abs(s.trainSpeed * dt)

  // Score: 1 point per 100 pixels traveled
  s.score = Math.floor(s.totalDistance / 100)

  // Wrap train when it goes off right edge
  if (s.trainX > screenWidth + 200) {
    s.trainX = -250
    s.trips += 1
  }

  // Wheel rotation
  const wheelSpeed = s.trainSpeed / 60
  for (const w of s.wheels) {
    w.speed = wheelSpeed
    w.angle += wheelSpeed * dt
  }

  // Steam puffs when chugging
  if (s.chuggingActive && Math.random() < 0.3) {
    const puff: SteamPuff = {
      x: s.trainX - 10,
      y: -30 + Math.random() * 10,
      vx: -40 + Math.random() * 20,
      vy: -80 - Math.random() * 40,
      life: 1.2,
      maxLife: 1.2,
      size: 8 + Math.random() * 6,
    }
    s.steamPuffs = [...s.steamPuffs, puff]
  }

  // Update steam puffs
  s.steamPuffs = s.steamPuffs
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + 20 * dt,
      life: p.life - dt,
      size: p.size + 8 * dt,
    }))
    .filter((p) => p.life > 0)

  // Clear whistle flag after it's processed
  if (s.whistleTriggered && s.whistleCooldown < 2.5) {
    s.whistleTriggered = false
  }

  return s
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    trainX: -100,
    trainSpeed: 0,
    chuggaCount: 0,
    totalDistance: 0,
    whistleTriggered: false,
    whistleCooldown: 0,
    armRotateCooldown: 0,
    chuggingActive: false,
    chuggingTimer: 0,
    steamPuffs: [],
    score: 0,
    trips: 0,
    announcedAllAboard: false,
  }
}