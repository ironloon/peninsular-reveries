import type { GameState, Block, Particle, MotionBody, Tower } from './types.js'

const BLOCK_COLORS = [
  0xe74c3c, // red
  0xe67e22, // orange
  0xf1c40f, // yellow
  0x2ecc71, // green
  0x3498db, // blue
  0x9b59b6, // purple
  0x1abc9c, // teal
  0xe91e63, // pink
  0xff6b35, // vivid orange
  0x00bcd4, // cyan
]

const GRAVITY = 0.35
const SMASH_RANGE = 130
const BLOCK_WIDTH = 42
const BLOCK_HEIGHT = 28
const BLOCK_GAP = 2
const INITIAL_WAVE_SIZE = 3
const WAVE_GROWTH = 2
const MAX_TOWERS_PER_WAVE = 8

let nextBlockId = 0
let nextTowerId = 0

function randomBlockColor(): number {
  return BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]
}

export function createInitialState(): GameState {
  return {
    phase: 'start',
    blocks: [],
    towers: [],
    particles: [],
    score: 0,
    towersDestroyed: 0,
    wave: 0,
    blocksDestroyedThisWave: 0,
    blocksPerWave: INITIAL_WAVE_SIZE,
    gameTime: 0,
    waveTime: 0,
    smashCooldown: 0,
    comboCount: 0,
    comboTimer: 0,
    lastSmashTime: 0,
  }
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    blocks: [],
    towers: [],
    particles: [],
    score: 0,
    towersDestroyed: 0,
    wave: 0,
    blocksDestroyedThisWave: 0,
    blocksPerWave: INITIAL_WAVE_SIZE,
    waveTime: 0,
    smashCooldown: 0,
    comboCount: 0,
    comboTimer: 0,
    lastSmashTime: 0,
  }
}

function generateTower(
  stageWidth: number,
  stageHeight: number,
  towerIndex: number,
  totalTowers: number,
): { blocks: Block[], tower: Tower } {
  const blocks: Block[] = []
  const blockIds: string[] = []

  // Vary tower properties
  const minHeight = 3
  const maxHeight = Math.min(8, 3 + Math.floor(stageHeight / 80))
  const height = minHeight + Math.floor(Math.random() * (maxHeight - minHeight + 1))
  const widthBlocks = Math.random() < 0.3 ? 2 : 1 // some towers are wider
  const bw = BLOCK_WIDTH + Math.floor(Math.random() * 10) - 5

  // Space towers evenly across the screen
  const margin = 60
  const usableWidth = stageWidth - margin * 2
  const spacing = usableWidth / totalTowers
  const centerX = margin + spacing * (towerIndex + 0.5) + (Math.random() - 0.5) * spacing * 0.3

  const floorY = stageHeight - 20

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < widthBlocks; col++) {
      const id = `block-${nextBlockId++}`
      const totalRowWidth = widthBlocks * bw + (widthBlocks - 1) * BLOCK_GAP
      const blockX = centerX - totalRowWidth / 2 + col * (bw + BLOCK_GAP) + bw / 2
      const blockY = floorY - row * (BLOCK_HEIGHT + BLOCK_GAP) - BLOCK_HEIGHT / 2

      blocks.push({
        id,
        x: blockX,
        y: blockY,
        width: bw,
        height: BLOCK_HEIGHT,
        color: randomBlockColor(),
        resting: true,
        falling: false,
        destroyed: false,
        vx: 0,
        vy: 0,
        rotation: 0,
        angularVel: 0,
        opacity: 1,
        damageTimer: 0,
        towerIndex: nextTowerId,
      })
      blockIds.push(id)
    }
  }

  const tower: Tower = {
    id: nextTowerId++,
    blocks: blockIds,
    destroyed: false,
  }

  return { blocks, tower }
}

export function spawnWave(state: GameState, stageWidth: number, stageHeight: number): GameState {
  const numTowers = Math.min(MAX_TOWERS_PER_WAVE, state.blocksPerWave)
  const allBlocks = [...state.blocks]
  const allTowers = [...state.towers]
  const existingActiveTowers = allTowers.filter(t => !t.destroyed).length

  for (let i = 0; i < numTowers; i++) {
    const { blocks: newBlocks, tower } = generateTower(stageWidth, stageHeight, i, numTowers)
    allBlocks.push(...newBlocks)
    allTowers.push(tower)
  }

  return {
    ...state,
    blocks: allBlocks,
    towers: allTowers,
    wave: state.wave + 1,
    blocksDestroyedThisWave: 0,
    blocksPerWave: Math.min(10, state.blocksPerWave + WAVE_GROWTH),
    waveTime: 0,
  }
}

export function updateGame(
  state: GameState,
  bodies: MotionBody[],
  stageWidth: number,
  stageHeight: number,
  deltaMs: number,
): GameState {
  if (state.phase !== 'playing') return state

  const dt = Math.min(deltaMs, 50) / 16.67
  const now = performance.now()

  const bodyPositions = bodies.map((b) => ({
    x: (1 - b.normalizedX) * stageWidth,
    y: b.normalizedY * stageHeight,
    spreadX: b.spreadX * stageWidth,
    spreadY: b.spreadY * stageHeight,
  }))

  let blocks = state.blocks
  let particles = state.particles
  let score = state.score
  let smashCooldown = state.smashCooldown - deltaMs
  let comboTimer = state.comboTimer - deltaMs
  let comboCount = state.comboCount

  if (comboTimer <= 0) {
    comboCount = 0
  }

  // ── Blocks that are being damaged should shake ──────────────────────
  blocks = blocks.map((b) => ({
    ...b,
    damageTimer: Math.max(0, b.damageTimer - deltaMs),
  }))

  // ── Check for smash collisions ────────────────────────────────────
  let destroyedCount = 0
  let newLastSmashTime = state.lastSmashTime

  if (bodyPositions.length > 0 && smashCooldown <= 0) {
    for (const bp of bodyPositions) {
      const smashWidth = Math.max(bp.spreadX * 0.5, 50)
      const smashHeight = Math.max(bp.spreadY * 0.3, 40)

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        if (block.destroyed || block.falling) continue

        const dx = Math.abs(block.x - bp.x)
        const dy = Math.abs(block.y - bp.y)

        if (dx < SMASH_RANGE + block.width / 2 && dy < SMASH_RANGE * 0.6 + block.height / 2) {
          // Smash this block!
          const smashForce = Math.max(0.3, 1 - (dx + dy) / (SMASH_RANGE * 3))
          const angleFrom = Math.atan2(block.y - bp.y, block.x - bp.x)

          blocks[i] = {
            ...block,
            destroyed: true,
            falling: true,
            resting: false,
            vx: Math.cos(angleFrom) * smashForce * (4 + Math.random() * 6),
            vy: Math.sin(angleFrom) * smashForce * (2 + Math.random() * 4) - 3,
            angularVel: (Math.random() - 0.5) * 0.15,
            opacity: 1,
          }
          destroyedCount++

          // Spawn destruction particles
          particles = [...particles, ...spawnSmashParticles(block.x, block.y, block.color)]
        }
      }
    }

    if (destroyedCount > 0) {
      smashCooldown = 80 // slight cooldown for feel
      comboCount += destroyedCount
      comboTimer = 1200 // combo window in ms

      const comboMultiplier = Math.floor(comboCount / 5) + 1
      score += destroyedCount * 10 * comboMultiplier
      newLastSmashTime = now
    }
  }

  // ── Physics: falling blocks ─────────────────────────────────────────
  const floorY = stageHeight - 20
  const updatedBlocks: Block[] = []
  for (const block of blocks) {
    if (block.destroyed) {
      if (block.opacity <= 0) continue // remove fully faded

      const b = {
        ...block,
        x: block.x + block.vx * dt,
        y: block.y + block.vy * dt,
        vy: block.vy + GRAVITY * dt,
        rotation: block.rotation + block.angularVel * dt,
        angularVel: block.angularVel * 0.995,
        opacity: block.opacity - 0.015 * dt,
      }

      // Floor bounce
      if (b.y + b.height / 2 > floorY) {
        b.y = floorY - b.height / 2
        b.vy = -Math.abs(b.vy) * 0.3
        b.vx *= 0.8
        if (Math.abs(b.vy) < 0.5) {
          b.vy = 0
        }
      }

      // Remove blocks that flew off screen or fully faded
      if (b.x < -200 || b.x > stageWidth + 200 || b.y > stageHeight + 200 || b.opacity <= 0.01) {
        continue
      }

      updatedBlocks.push(b)
    } else if (block.falling) {
      // Unsupported blocks fall
      const b = {
        ...block,
        y: block.y + block.vy * dt,
        vy: block.vy + GRAVITY * dt,
        rotation: block.rotation + block.angularVel * dt,
      }

      if (b.y + b.height / 2 > floorY) {
        b.y = floorY - b.height / 2
        b.vy = 0
        b.falling = false
        b.resting = true
        b.angularVel = 0
        b.rotation = 0
      }

      updatedBlocks.push(b)
    } else {
      updatedBlocks.push(block)
    }
  }

  // ── Make unsupported blocks fall ───────────────────────────────────
  const supportedBlocks = new Map<string, boolean>()
  for (const block of updatedBlocks) {
    if (block.destroyed || block.falling) continue

    const hasBlockBelow = updatedBlocks.some(
      (other) =>
        !other.destroyed &&
        !other.falling &&
        other.id !== block.id &&
        Math.abs(other.x - block.x) < (block.width + other.width) * 0.4 &&
        Math.abs(other.y - (block.y + BLOCK_HEIGHT + BLOCK_GAP)) < BLOCK_GAP * 3 &&
        other.y > block.y,
    )

    const isOnGround = block.y + block.height / 2 >= floorY - 2

    supportedBlocks.set(block.id, hasBlockBelow || isOnGround)
  }

  const finalBlocks = updatedBlocks.map((block) => {
    if (block.destroyed || block.falling) return block
    if (!supportedBlocks.get(block.id)) {
      return {
        ...block,
        falling: true,
        resting: false,
        vy: 0,
        angularVel: (Math.random() - 0.5) * 0.05,
      }
    }
    return block
  })

  // ── Update tower destruction status ──────────────────────────────
  const towers = state.towers.map((tower) => {
    if (tower.destroyed) return tower
    const allDestroyed = tower.blocks.every((id) =>
      finalBlocks.find((b) => b.id === id)?.destroyed ?? true,
    )
    return { ...tower, destroyed: allDestroyed }
  })

  const towersDestroyed = towers.filter((t) => t.destroyed).length
  const totalTowerBlocks = finalBlocks.filter((b) => !b.destroyed).length

  // ── Update particles ──────────────────────────────────────────────
  particles = updateParticles(particles, dt)

  // ── Wave progression ──────────────────────────────────────────────
  let waveTime = state.waveTime + deltaMs
  const gameTime = state.gameTime + deltaMs

  // Auto-spawn new wave when all towers destroyed or few blocks left
  const shouldSpawnWave =
    (totalTowerBlocks <= 3 && waveTime > 2000) ||
    (towers.every((t) => t.destroyed) && waveTime > 1500)

  let newState: GameState = {
    ...state,
    blocks: finalBlocks,
    towers,
    particles,
    score,
    towersDestroyed,
    smashCooldown,
    comboCount,
    comboTimer,
    lastSmashTime: newLastSmashTime,
    waveTime,
    gameTime,
  }

  if (shouldSpawnWave) {
    newState = spawnWave(newState, stageWidth, stageHeight)
  }

  // ── Cap particle count ───────────────────────────────────────────
  // Also cap destroyed blocks to prevent array growth
  let cleanedBlocks = newState.blocks
  if (newState.blocks.length > 200) {
    // Keep alive blocks and recently destroyed ones
    cleanedBlocks = newState.blocks.filter(b => !b.destroyed || b.opacity > 0.15)
  }

  if (newState.particles.length > 500) {
    newState = {
      ...newState,
      particles: newState.particles.slice(-500),
      blocks: cleanedBlocks,
    }
  } else {
    newState = {
      ...newState,
      blocks: cleanedBlocks,
    }
  }

  return newState
}

function spawnSmashParticles(x: number, y: number, color: number): Particle[] {
  const out: Particle[] = []
  const count = 10 + Math.floor(Math.random() * 8)

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 7

    out.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 0.5 + Math.random() * 0.8,
      maxLife: 1.3,
      color,
      size: 3 + Math.random() * 6,
    })
  }

  // Dust
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3

    out.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + Math.random() * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 0.4 + Math.random() * 0.5,
      maxLife: 0.9,
      color: 0xcccccc,
      size: 4 + Math.random() * 8,
    })
  }

  return out
}

function updateParticles(particles: Particle[], dt: number): Particle[] {
  const out: Particle[] = []
  for (const p of particles) {
    const life = p.life - dt / 16.67 * 0.025
    if (life <= 0) continue
    out.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15,
      life,
    })
  }
  return out
}

export function forceEnd(state: GameState): GameState {
  return {
    ...state,
    phase: 'end',
  }
}