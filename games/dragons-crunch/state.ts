import type { GameState, FoodItem, Particle, MotionBody } from './types.js'

const FOOD_COLORS = [
  0xff4444, // apple red
  0xff8800, // carrot orange
  0xffd700, // corn gold
  0xff69b4, // cake pink
  0x8b4513, // meat brown
  0x32cd32, // melon green
]

const FOOD_SPAWN_INTERVAL = 1000
const GRAVITY = 0.4
const CHOMP_RANGE = 160
const FOOD_FLOOR_MARGIN = 8

function randomFoodColor(): number {
  return FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)]
}

export function createInitialState(): GameState {
  return {
    phase: 'start',
    bodies: [],
    foods: [],
    particles: [],
    score: 0,
    foodSpawned: 0,
    maxFood: 50,
    celebrationTimeLeft: 0,
    celebrationDuration: 10000,
    lastFoodSpawnTime: 0,
    gameTime: 0,
    landedFood: [],
  }
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    bodies: [],
    foods: [],
    particles: [],
    score: 0,
    foodSpawned: 0,
    lastFoodSpawnTime: 0,
    gameTime: 0,
    landedFood: [],
  }
}

export function spawnFoodItem(stageWidth: number, _stageHeight: number, now: number): FoodItem | null {
  const isLarge = Math.random() < 0.25
  const radius = isLarge ? 18 : 9
  const value = isLarge ? 5 : 1

  return {
    id: `food-${now}-${Math.random().toString(36).slice(2, 8)}`,
    x: radius + Math.random() * (stageWidth - radius * 2),
    y: -radius - 8,
    vx: (Math.random() - 0.5) * 0.4,
    vy: 2 + Math.random() * 2,
    radius,
    value,
    color: randomFoodColor(),
    eaten: false,
    spawnTime: now,
    announced: false,
    landed: false,
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

  const dt = Math.min(deltaMs, 50) / 16.67
  const now = performance.now()
  const gameTime = state.gameTime + deltaMs

  // Track body positions for eating
  const bodyPositions = bodies.map((b) => ({
    id: b.id,
    x: (1 - b.normalizedX) * stageWidth,
    y: b.normalizedY * stageHeight,
    spreadY: b.spreadY,
    scale: 0.5 + b.spreadY * 1.5,
  }))

  // Spawn food
  let foods = state.foods
  let foodSpawned = state.foodSpawned
  let score = state.score
  const landedFood = state.landedFood ?? []

  if (state.phase === 'playing' && foodSpawned < state.maxFood && now - state.lastFoodSpawnTime > FOOD_SPAWN_INTERVAL) {
    const newFood = spawnFoodItem(stageWidth, stageHeight, now)
    if (newFood) {
      foods = [...foods, newFood]
      foodSpawned += 1
    }
    state = { ...state, lastFoodSpawnTime: now }
  }

  // Food physics
  const floorY = stageHeight - FOOD_FLOOR_MARGIN
  const newLanded: string[] = [...landedFood]
  const updatedFoods: FoodItem[] = []

  for (const food of foods) {
    if (food.eaten) continue

    const fx = food.x + food.vx * dt
    let fy = food.y + food.vy * dt
    let fvy = food.vy + GRAVITY * dt
    let landed = food.landed ?? false

    if (fy >= floorY - food.radius) {
      fy = floorY - food.radius
      if (!landed && Math.abs(fvy) > 1) {
        landed = true
        newLanded.push(food.id)
      }
      fvy = -fvy * 0.2
      if (Math.abs(fvy) < 1) fvy = 0
    }

    updatedFoods.push({ ...food, x: fx, y: fy, vy: fvy, landed })
  }
  foods = updatedFoods

  // Auto-eat: any body near food = chomp
  let particles = state.particles
  if (state.phase === 'playing') {
    for (let i = 0; i < bodyPositions.length; i++) {
      const bp = bodyPositions[i]
      // Mouth zone is at the top of the tracked body
      const mouthX = bp.x
      const mouthY = bp.y - bp.spreadY * stageHeight * 0.25

      for (let f = 0; f < foods.length; f++) {
        const food = foods[f]
        if (food.eaten) continue
        const dx = food.x - mouthX
        const dy = food.y - mouthY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CHOMP_RANGE + food.radius) {
          foods[f] = { ...food, eaten: true }
          score += food.value
          // Chomp burst particles at the food location
          particles = [...particles, ...spawnChompBurst(food.x, food.y, food.color, food.value)]
        }
      }
    }
  }

  // Fire particles during celebration — spawn from all body positions
  if (state.phase === 'celebrating') {
    for (const bp of bodyPositions) {
      const fireX = bp.x
      const fireY = bp.y - bp.spreadY * stageHeight * 0.3
      particles = [...particles, ...spawnFireBurst(fireX, fireY, 1.5)]
    }
  }

  particles = updateParticles(particles, dt)

  // Phase transition
  let phase = state.phase
  let celebrationTimeLeft = state.celebrationTimeLeft

  if (phase === 'playing' && foodSpawned >= state.maxFood) {
    const allSettled = foods.every((f) => f.eaten || f.landed)
    if (allSettled) {
      phase = 'celebrating'
      celebrationTimeLeft = state.celebrationDuration
    }
  }

  if (phase === 'celebrating') {
    celebrationTimeLeft -= deltaMs
    if (celebrationTimeLeft <= 0) phase = 'end'
  }

  return {
    ...state,
    phase,
    bodies: bodyPositions,
    foods,
    particles,
    score,
    foodSpawned,
    gameTime,
    celebrationTimeLeft,
    landedFood: newLanded,
  }
}

function spawnChompBurst(x: number, y: number, color: number, value: number): Particle[] {
  const out: Particle[] = []
  const count = value >= 5 ? 16 : 8
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    out.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.5,
      maxLife: 0.9,
      color,
      size: 4 + Math.random() * 6,
    })
  }
  // Add white sparkles
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 5
    out.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.6,
      color: 0xffffff,
      size: 2 + Math.random() * 3,
    })
  }
  return out
}

function spawnFireBurst(x: number, y: number, intensity: number): Particle[] {
  const out: Particle[] = []
  // Many more particles, bigger, wider spread — more like fire than sparkler
  const count = Math.floor(12 + intensity * 15)
  for (let i = 0; i < count; i++) {
    // Wider spread angle — fire fans out
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.0
    const speed = 2 + Math.random() * 8 * intensity
    const size = 6 + Math.random() * 14 * intensity

    // Fire colors: deep red → orange → bright yellow → white core
    const colorRoll = Math.random()
    let color: number
    if (colorRoll < 0.15) {
      color = 0xcc1100 // deep red
    } else if (colorRoll < 0.40) {
      color = 0xff4400 // red-orange
    } else if (colorRoll < 0.65) {
      color = 0xff8800 // orange
    } else if (colorRoll < 0.85) {
      color = 0xffcc00 // golden yellow
    } else if (colorRoll < 0.95) {
      color = 0xffee66 // bright yellow
    } else {
      color = 0xffffff // white-hot core
    }

    out.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 1.2,
      maxLife: 1.8,
      color,
      size,
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
      vy: p.vy + (p.vy < 0 ? 0.015 : 0.02),
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
  }
}