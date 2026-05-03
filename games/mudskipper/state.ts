import type { GamePhase, GameState, MotionBody, MudskipperState, SplashParticle, MudState } from './types.js'

const GRAVITY = 0.0012
const JUMP_IMPULSE = -0.95
const MUD_RISE_SPEED = 0.00004
const JUMP_MUD_BOOST = 0.025
const GAMEOVER_THRESHOLD = 0.88
const DRAIN_SPEED = 0.0006
const DRAIN_DELAY = 2500

export function createInitialState(): GameState {
  return {
    phase: 'start',
    mudskippers: [],
    particles: [],
    mud: {
      level: 0.15,
      targetLevel: 0.15,
      maxLevel: GAMEOVER_THRESHOLD,
      wavePhase: 0,
      drainSpeed: DRAIN_SPEED,
    },
    time: 0,
    drainTimer: 0,
    lastJumpTime: 0,
  }
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    mudskippers: [],
    particles: [],
    mud: {
      level: 0.12,
      targetLevel: 0.12,
      maxLevel: GAMEOVER_THRESHOLD,
      wavePhase: 0,
      drainSpeed: DRAIN_SPEED,
    },
    time: 0,
    drainTimer: 0,
    lastJumpTime: 0,
  }
}

export function updateGame(
  state: GameState,
  bodies: MotionBody[],
  stageWidth: number,
  stageHeight: number,
  deltaMs: number,
): GameState {
  if (state.phase !== 'playing' && state.phase !== 'gameover' && state.phase !== 'draining') return state

  const dt = Math.min(deltaMs, 50)
  const time = state.time + dt

  const mudSurfaceY = stageHeight * (1 - state.mud.level)

  // Update mudskippers from tracked bodies
  const mudskippers: MudskipperState[] = []
  const seenIds = new Set<number>()

  for (const body of bodies) {
    seenIds.add(body.id)
    const prev = state.mudskippers.find((m) => m.id === body.id)

    const targetX = body.normalizedX * stageWidth
    const baseScale = Math.max(stageWidth, 480) * 0.0018
    const bodyScale = (body.spreadY * stageHeight / 48) * 1.6
    const scale = Math.max(baseScale * 0.6, Math.min(baseScale * 2.5, bodyScale))

    let x = prev?.x ?? targetX
    let y = prev?.y ?? mudSurfaceY
    const vx = prev?.vx ?? 0
    let vy = prev?.vy ?? 0
    let jumpPhase = prev?.jumpPhase ?? 'idle'
    let jumpProgress = prev?.jumpProgress ?? 0
    let landSquash = prev?.landSquash ?? 0

    // Horizontal follow with smoothing
    const followT = Math.min(0.2, dt * 0.004)
    x = x + (targetX - x) * followT

    // Jump physics
    if (body.jumping && (body.jumpPhase === 'rising' || body.jumpPhase === 'falling')) {
      if (jumpPhase === 'idle') {
        // Start jump
        jumpProgress = 0
        vy = JUMP_IMPULSE * stageHeight
      } else {
        jumpProgress += dt * 0.001
        vy += GRAVITY * stageHeight * dt
      }
      y += vy * dt * 0.001
      jumpPhase = body.jumpPhase
    } else {
      // Return to mud surface
      if (y < mudSurfaceY - 2) {
        vy += GRAVITY * stageHeight * dt
        y += vy * dt * 0.001
        jumpPhase = 'falling'
      }
      if (y >= mudSurfaceY - 2) {
        if (jumpPhase === 'falling' || jumpPhase === 'rising') {
          jumpPhase = 'landing'
          landSquash = 1.0
        }
        y = mudSurfaceY
        vy = 0
        jumpProgress = 0
        if (landSquash <= 0.01) {
          jumpPhase = 'idle'
        }
      }
    }

    landSquash = Math.max(0, landSquash - dt * 0.003)

    const blinkTimer = (prev?.blinkTimer ?? 0) + dt
    let blinkState = prev?.blinkState ?? false
    if (blinkTimer > 3000 + Math.random() * 2000) {
      blinkState = true
    }
    if (blinkState && blinkTimer > 3200 + Math.random() * 2000) {
      blinkState = false
    }

    mudskippers.push({
      id: body.id,
      x,
      y,
      vx,
      vy,
      scale,
      tint: prev?.tint ?? getMudskipperTint(body.id),
      facingRight: body.normalizedX < 0.5,
      jumpPhase,
      jumpProgress,
      landSquash,
      blinkTimer: blinkState ? blinkTimer : 0,
      blinkState,
      idleOffset: (prev?.idleOffset ?? Math.random() * 100) + dt * 0.001,
    })
  }

  // Remove lost mudskippers (fade out)
  for (const prev of state.mudskippers) {
    if (!seenIds.has(prev.id)) {
      // don't immediately remove; let them drift a bit? For now skip
    }
  }

  // Mud level
  let mudLevel = state.mud.level
  let targetLevel = state.mud.targetLevel

  if (state.phase === 'playing') {
    targetLevel += MUD_RISE_SPEED * dt

    // Boost from jumps
    for (const body of bodies) {
      if (body.jumping && body.jumpPhase === 'rising') {
        targetLevel += JUMP_MUD_BOOST * 0.01
      }
    }

    targetLevel = Math.min(GAMEOVER_THRESHOLD, targetLevel)
    mudLevel += (targetLevel - mudLevel) * Math.min(0.05, dt * 0.0005)
  } else if (state.phase === 'draining') {
    targetLevel = 0.12
    mudLevel -= DRAIN_SPEED * dt
    if (mudLevel <= 0.12) {
      mudLevel = 0.12
    }
  }

  const mud: MudState = {
    ...state.mud,
    level: mudLevel,
    targetLevel,
    wavePhase: state.mud.wavePhase + dt * 0.002,
  }

  // Particles
  let particles = state.particles

  // Spawn splash particles on landing
  for (const m of mudskippers) {
    if (m.jumpPhase === 'landing' && m.landSquash > 0.7) {
      particles = [...particles, ...spawnSplash(m.x, mudSurfaceY, m.scale)]
    }
  }

  particles = updateParticles(particles, dt)

  // Phase transitions
  let phase = state.phase as GamePhase
  let drainTimer = state.drainTimer

  if (phase === 'playing' && mud.level >= GAMEOVER_THRESHOLD - 0.02) {
    phase = 'gameover'
    drainTimer = DRAIN_DELAY
  }

  if (phase === 'gameover') {
    drainTimer -= dt
    if (drainTimer <= 0) {
      phase = 'draining'
      drainTimer = 0
    }
  }

  if (phase === 'draining' && mud.level <= 0.13) {
    phase = 'start' as GamePhase
  }

  return {
    ...state,
    phase,
    mudskippers,
    particles,
    mud,
    time,
    drainTimer,
    lastJumpTime: bodies.some((b) => b.jumping) ? time : state.lastJumpTime,
  }
}

function spawnSplash(x: number, y: number, scale: number): SplashParticle[] {
  const count = Math.floor(5 + scale * 8)
  const out: SplashParticle[] = []
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2
    const speed = 2 + Math.random() * 4 * scale
    const size = 2 + Math.random() * 4 * scale
    const isDark = Math.random() < 0.6
    out.push({
      x: x + (Math.random() - 0.5) * 12 * scale,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.6,
      maxLife: 1.1,
      size,
      color: isDark ? 0x3e2723 : 0x5d4037,
    })
  }
  return out
}

function updateParticles(particles: SplashParticle[], dt: number): SplashParticle[] {
  const out: SplashParticle[] = []
  for (const p of particles) {
    const life = p.life - dt * 0.001
    if (life <= 0) continue
    out.push({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.08,
      life,
    })
  }
  return out
}

function getMudskipperTint(index: number): number {
  const colors = [
    0x5d4037, 0x4e342e, 0x6d4c41, 0x795548, 0x8d6e63, 0x3e2723,
  ]
  return colors[index % colors.length]
}
