import type { GameState, DragonState, FoodItem, Particle, MotionBody } from './types.js'

const FOOD_COLORS = [
  0xff4444, // apple red
  0xff8800, // carrot orange
  0xffd700, // corn gold
  0xff69b4, // cake pink
  0x8b4513, // meat brown
  0x32cd32, // melon green
]

const FOOD_SPAWN_INTERVAL = 900 // ms between food spawns
const GRAVITY = 0.25
const GROUND_OFFSET = 60 // pixels above ground where food sits
const CHOMP_RANGE = 70 // pixels
const CHOMP_COOLDOWN = 400 // ms

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
  const radius = isLarge ? 16 : 8
  const value = isLarge ? 5 : 1

  return {
    id: `food-${now}-${Math.random().toString(36).slice(2, 8)}`,
    x: radius + Math.random() * (stageWidth - radius * 2),
    y: -radius - 10,
    vx: (Math.random() - 0.5) * 0.3,
    vy: 1.5 + Math.random() * 1.5,
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

  // Update dragons from motion bodies
  let dragons = updateDragonsFromBodies(state.dragons, bodies, stageWidth, stageHeight, now)

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
  const groundY = stageHeight * 0.82 - GROUND_OFFSET
  const updatedFoods: FoodItem[] = []
  for (const food of foods) {
    if (food.eaten) continue

    let fx = food.x + food.vx * dt
    let fy = food.y + food.vy * dt
    let fvy = food.vy + GRAVITY * dt

    if (fy >= groundY) {
      fy = groundY
      fvy = 0
      fx += food.vx * dt * 0.2 // slight slide on ground
    }

    updatedFoods.push({ ...food, x: fx, y: fy, vy: fvy })
  }
  foods = updatedFoods

  // Chomp detection during playing
  if (state.phase === 'playing') {
    for (let i = 0; i < dragons.length; i++) {
      const dragon = dragons[i]
      if (!dragon.chomping || now - dragon.lastChomp < CHOMP_COOLDOWN) {
        continue
      }
      dragons[i] = { ...dragon, lastChomp: now }

      const mouthX = dragon.x
      const mouthY = dragon.y - 40 // approximate mouth height

      for (let f = 0; f < foods.length; f++) {
        const food = foods[f]
        if (food.eaten) continue
        const dx = food.x - mouthX
        const dy = food.y - mouthY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CHOMP_RANGE + food.radius) {
          foods[f] = { ...food, eaten: true }
          score += food.value
          // Spawn crunch particles
          particles = [...particles, ...spawnCrunchBurst(food.x, food.y, food.color)]
        }
      }
    }
  }

  // Fire breathing during celebration
  if (state.phase === 'celebrating') {
    for (const dragon of dragons) {
      if (dragon.breathingFire) {
        const mouthX = dragon.x
        const mouthY = dragon.y - 45
        particles = [...particles, ...spawnFireBurst(mouthX, mouthY, dragon.fireIntensity)]
      }
    }
  }

  // Update particles
  particles = updateParticles(particles, dt)

  // Check phase transitions
  let phase = state.phase
  let celebrationTimeLeft = state.celebrationTimeLeft

  if (phase === 'playing' && foodSpawned >= state.maxFood && foods.every((f) => f.eaten || f.y >= groundY - 2)) {
    phase = 'celebrating'
    celebrationTimeLeft = state.celebrationDuration
    // Celebrate all dragons!
    dragons = dragons.map((d) => ({ ...d, breathingFire: true, fireIntensity: 1.2 }))
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

function updateDragonsFromBodies(
  existing: DragonState[],
  bodies: MotionBody[],
  stageWidth: number,
  stageHeight: number,
  now: number,
): DragonState[] {
  const dragons: DragonState[] = []

  // Match bodies to dragons by index for now
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i]
    const prev = existing[i]

    const dragonColor = getDragonColor(i)
    const x = (1 - body.normalizedX) * stageWidth
    const groundY = stageHeight * 0.82

    // Chomp when arms go up
    const chomping = body.armsUp

    dragons.push({
      id: prev?.id ?? `dragon-${i}-${now}`,
      x: Math.max(60, Math.min(stageWidth - 60, x)),
      y: groundY,
      scale: prev?.scale ?? 1,
      tint: dragonColor,
      chomping,
      breathingFire: prev?.breathingFire ?? false,
      fireIntensity: prev?.fireIntensity ?? 0,
      lastChomp: prev?.lastChomp ?? 0,
    })
  }

  return dragons
}

function getDragonColor(index: number): number {
  const colors = [
    0x2e7d32, // green
    0x1565c0, // blue
    0xc62828, // red
    0x6a1b9a, // purple
    0xe65100, // orange
    0x00695c, // teal
    0xad1457, // pink
    0x455a64, // slate
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
  const count = Math.floor(3 + intensity * 4)
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8
    const speed = 3 + Math.random() * 5 * intensity
    const isCore = Math.random() < 0.35
    out.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.8,
      maxLife: 1.3,
      color: isCore ? 0xffea00 : 0xff6600,
      size: 3 + Math.random() * 5 * intensity,
    })
  }
  return out
}

function updateParticles(particles: Particle[], dt: number): Particle[] {
  const out: Particle[] = []
  for (const p of particles) {
    const life = p.life - dt / 16.67 * 0.02
    if (life <= 0) continue
    out.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + (p.vy < 0 ? 0.02 : -0.01), // slight gravity/buoyancy mix
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
