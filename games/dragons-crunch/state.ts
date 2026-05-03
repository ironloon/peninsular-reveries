import type { GameState, FoodItem, Particle, MotionBody } from './types.js'

const FOOD_COLORS = [
  0xff4444, // apple red
  0xff8800, // carrot orange
  0xffd700, // corn gold
  0xff69b4, // cake pink
  0x8b4513, // meat brown
  0x32cd32, // melon green
]

const FOOD_SPAWN_INTERVAL = 900 // ms between food spawns
const GRAVITY = 0.35
const CHOMP_RANGE = 80 // pixels
const CHOMP_COOLDOWN = 350 // ms per dragon
const FOOD_FLOOR_MARGIN = 6 // stop slightly above screen bottom

function randomFoodColor(): number {
  return FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)]
}

export function createInitialState(): GameState {
  return {
    phase: 'start',
    dragons: [],
    foods: [],
    particles: [],
    score: 0,
    foodSpawned: 0,
    maxFood: 100,
    celebrationTimeLeft: 0,
    celebrationDuration: 10000,
    lastFoodSpawnTime: 0,
    gameTime: 0,
  }
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    dragons: [],
    foods: [],
    particles: [],
    score: 0,
    foodSpawned: 0,
    lastFoodSpawnTime: 0,
    gameTime: 0,
  }
}

export function spawnFoodItem(stageWidth: number, stageHeight: number, now: number): FoodItem | null {
  const isLarge = Math.random() < 0.2
  const radius = isLarge ? 18 : 9
  const value = isLarge ? 5 : 1

  return {
    id: `food-${now}-${Math.random().toString(36).slice(2, 8)}`,
    x: radius + Math.random() * (stageWidth - radius * 2),
    y: -radius - 8,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 2 + Math.random() * 2,
    radius,
    value,
    color: randomFoodColor(),
    eaten: false,
    spawnTime: now,
  }
}

export function updateGame(
  state: GameState,
  bodies: MotionBody[],
  stageWidth: number,
  stageHeight: number,
  deltaMs: number,
): GameState {
  if (state.phase !== 'playing' && state.phase !== 'celebrating') return state

  const dt = Math.min(deltaMs, 50) / 16.67 // normalize to ~60fps
  const now = performance.now()
  const gameTime = state.gameTime + deltaMs

  // Build chomp centers from body positions (mouth offset slightly above centroid)
  const chompCenters = bodies
    .filter((b) => b.armsUp)
    .map((b) => ({
      x: b.normalizedX * stageWidth,
      y: (b.normalizedY - b.spreadY * 0.25) * stageHeight, // mouth is upper part of torso
      lastChomp: state.dragons.find((d) => d.id === b.id)?.lastChomp ?? 0,
      id: b.id,
      breathingFire: state.phase === 'celebrating',
    }))

  // Spawn food during playing phase
  let foods = state.foods
  let foodSpawned = state.foodSpawned
  let score = state.score
  let particles = state.particles

  if (state.phase === 'playing') {
    if (foodSpawned < state.maxFood && now - state.lastFoodSpawnTime > FOOD_SPAWN_INTERVAL) {
      const newFood = spawnFoodItem(stageWidth, stageHeight, now)
      if (newFood) {
        foods = [...foods, newFood]
        foodSpawned += 1
      }
      state = { ...state, lastFoodSpawnTime: now }
    }
  }

  // Update food physics
  const floorY = stageHeight - FOOD_FLOOR_MARGIN
  const updatedFoods: FoodItem[] = []
  for (const food of foods) {
    if (food.eaten) continue

    let fx = food.x + food.vx * dt
    let fy = food.y + food.vy * dt
    let fvy = food.vy + GRAVITY * dt

    if (fy >= floorY - food.radius) {
      fy = floorY - food.radius
      fvy = -fvy * 0.25 // small bounce
      if (Math.abs(fvy) < 1) fvy = 0
      fx += food.vx * dt * 0.15
    }

    updatedFoods.push({ ...food, x: fx, y: fy, vy: fvy })
  }
  foods = updatedFoods

  // Chomp detection during playing
  if (state.phase === 'playing') {
    for (const center of chompCenters) {
      if (now - center.lastChomp < CHOMP_COOLDOWN) continue
      center.lastChomp = now

      for (let f = 0; f < foods.length; f++) {
        const food = foods[f]
        if (food.eaten) continue
        const dx = food.x - center.x
        const dy = food.y - center.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CHOMP_RANGE + food.radius) {
          foods[f] = { ...food, eaten: true }
          score += food.value
          particles = [...particles, ...spawnCrunchBurst(food.x, food.y, food.color)]
        }
      }
    }
  }

  // Fire breathing during celebration
  if (state.phase === 'celebrating') {
    for (const center of chompCenters) {
      const mouthX = center.x
      const mouthY = center.y - 20
      particles = [...particles, ...spawnFireBurst(mouthX, mouthY, 1.0)]
    }
  }

  // Update particles
  particles = updateParticles(particles, dt)

  // Update dragon state for tracking cool-downs
  const dragons = bodies.map((b) => {
    const prev = state.dragons.find((d) => d.id === b.id)
    return {
      id: b.id,
      x: b.normalizedX * stageWidth,
      y: b.normalizedY * stageHeight,
      scale: 0.5 + b.spreadY * 1.5,
      tint: getDragonColor(b.id),
      chomping: b.armsUp,
      breathingFire: state.phase === 'celebrating',
      fireIntensity: state.phase === 'celebrating' ? 1.2 : 0,
      lastChomp: prev?.lastChomp ?? 0,
    }
  })

  // Check phase transitions
  let phase = state.phase
  let celebrationTimeLeft = state.celebrationTimeLeft

  if (phase === 'playing' && foodSpawned >= state.maxFood) {
    // Wait until all food has been eaten or settled
    const allSettled = foods.every((f) => f.eaten || Math.abs(f.vy) < 0.5)
    if (allSettled) {
      phase = 'celebrating'
      celebrationTimeLeft = state.celebrationDuration
    }
  }

  if (phase === 'celebrating') {
    celebrationTimeLeft -= deltaMs
    if (celebrationTimeLeft <= 0) {
      phase = 'end'
    }
  }

  return {
    ...state,
    phase,
    dragons,
    foods,
    particles,
    score,
    foodSpawned,
    gameTime,
    celebrationTimeLeft,
  }
}

function getDragonColor(index: number): number {
  const colors = [
    0x2e7d32, 0x1565c0, 0xc62828, 0x6a1b9a, 0xe65100, 0x00695c, 0xad1457, 0x455a64,
  ]
  return colors[index % colors.length]
}

function spawnCrunchBurst(x: number, y: number, color: number): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 3
    out.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.5,
      maxLife: 0.8,
      color,
      size: 2 + Math.random() * 3,
    })
  }
  return out
}

function spawnFireBurst(x: number, y: number, intensity: number): Particle[] {
  const out: Particle[] = []
  const count = Math.floor(4 + intensity * 5)
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9
    const speed = 3.5 + Math.random() * 5.5 * intensity
    const isCore = Math.random() < 0.35
    out.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2.5,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.9,
      maxLife: 1.4,
      color: isCore ? 0xffea00 : 0xff6600,
      size: 3 + Math.random() * 6 * intensity,
    })
  }
  return out
}

function updateParticles(particles: Particle[], dt: number): Particle[] {
  const out: Particle[] = []
  for (const p of particles) {
    const life = p.life - dt / 16.67 * 0.018
    if (life <= 0) continue
    out.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + (p.vy < 0 ? 0.015 : -0.012),
      life,
    })
  }
  return out
}

export function forceCelebration(state: GameState): GameState {
  return {
    ...state,
    phase: 'celebrating',
    celebrationTimeLeft: state.celebrationDuration,
    dragons: state.dragons.map((d) => ({ ...d, breathingFire: true, fireIntensity: 1.2 })),
  }
}
