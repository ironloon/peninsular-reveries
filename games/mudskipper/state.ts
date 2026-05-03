import type { GamePhase, GameState, MotionBody, MudskipperState, SplashParticle, MudSplatter, MudState } from './types.js'

const GRAVITY = 0.0012
const JUMP_IMPULSE = -0.95
const WALK_SPEED = 0.0015
const GAMEOVER_COVERAGE = 0.85

// Splatter sizes — each jump sends 6-9 splatters across the screen
const SPLATTERS_PER_LAND = 6
const SPLATTER_MIN_RADIUS = 15
const SPLATTER_MAX_RADIUS = 50

const BASE_MUD_LEVEL = 0.12
const JUMP_COOLDOWN = 400

export function createInitialState(): GameState {
  return {
    phase: 'start',
    mudskipper: createMudskipperState(400, 0),
    particles: [],
    splatters: [],
    mud: {
      level: BASE_MUD_LEVEL,
      wavePhase: 0,
    },
    coverage: 0,
    time: 0,
    lastJumpTime: 0,
    needsSplash: false,
  }
}

function createMudskipperState(x: number, y: number): MudskipperState {
  return {
    x,
    y,
    vy: 0,
    scale: 1.8,
    facingRight: true,
    jumpPhase: 'idle',
    jumpProgress: 0,
    landSquash: 0,
    blinkTimer: 0,
    blinkState: false,
    idleOffset: Math.random() * 100,
  }
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    mudskipper: createMudskipperState(400, 0),
    particles: [],
    splatters: [],
    mud: {
      level: BASE_MUD_LEVEL,
      wavePhase: 0,
    },
    coverage: 0,
    time: 0,
    lastJumpTime: 0,
    needsSplash: false,
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

  const dt = Math.min(deltaMs, 50)
  const time = state.time + dt

  const mudSurfaceY = stageHeight * (1 - state.mud.level)
  const skipper = { ...state.mudskipper }
  skipper.idleOffset += dt * 0.001

  const prevJumpPhase = skipper.jumpPhase
  let needsSplash = state.needsSplash

  // ── Walk toward player position (slowly) ──────────────────────────────
  if (bodies.length > 0) {
    const body = bodies[0]
    const targetX = body.normalizedX * stageWidth

    // Walk slowly toward target X
    const walkDelta = (targetX - skipper.x) * WALK_SPEED * dt
    skipper.x += walkDelta

    // Face direction of travel
    skipper.facingRight = walkDelta >= 0

    // ── Jump: when any body is jumping, mudskipper jumps ───────────────
    const anyJumping = bodies.some((b) => b.jumping && b.jumpPhase === 'rising')

    if (anyJumping && skipper.jumpPhase === 'idle' && time - state.lastJumpTime > JUMP_COOLDOWN) {
      skipper.jumpPhase = 'rising'
      skipper.vy = JUMP_IMPULSE * stageHeight
      skipper.jumpProgress = 0
      needsSplash = false
      state = { ...state, lastJumpTime: time, needsSplash: false }
    }
  }

  // ── Jump physics ──────────────────────────────────────────────────────
  if (skipper.jumpPhase === 'rising' || skipper.jumpPhase === 'falling') {
    skipper.vy += GRAVITY * stageHeight * dt
    skipper.y += skipper.vy * dt * 0.001
    skipper.jumpProgress += dt * 0.001

    if (skipper.vy > 0) {
      skipper.jumpPhase = 'falling'
    }

    // Land when back to mud surface
    if (skipper.y >= mudSurfaceY) {
      skipper.y = mudSurfaceY
      skipper.vy = 0
      skipper.jumpPhase = 'landing'
      skipper.landSquash = 1.0
      skipper.jumpProgress = 0
      needsSplash = true
    }
  }

  // Idle: sit on mud surface
  if (skipper.jumpPhase === 'idle') {
    skipper.y = mudSurfaceY
  }

  // Landing squash decay
  skipper.landSquash = Math.max(0, skipper.landSquash - dt * 0.004)
  if (skipper.jumpPhase === 'landing' && skipper.landSquash <= 0.01) {
    skipper.jumpPhase = 'idle'
  }

  // Blink
  skipper.blinkTimer += dt
  if (!skipper.blinkState && skipper.blinkTimer > 3000 + Math.random() * 2000) {
    skipper.blinkState = true
  }
  if (skipper.blinkState && skipper.blinkTimer > 3400 + Math.random() * 2000) {
    skipper.blinkState = false
    skipper.blinkTimer = 0
  }

  // ── Mud surface (stays constant — no rise) ─────────────────────────────
  const mud: MudState = {
    level: state.mud.level,
    wavePhase: state.mud.wavePhase + dt * 0.002,
  }

  // ── Splash particles + screen splatters on landing ────────────────────
  let particles = state.particles
  let splatters = state.splatters
  let coverage = state.coverage

  if (needsSplash && prevJumpPhase !== 'landing') {
    // First frame of landing → splash particles + screen splatters
    particles = [...particles, ...spawnSplash(skipper.x, mudSurfaceY, skipper.scale)]
    const newSplatters = spawnScreenSplatters(stageWidth, stageHeight)
    splatters = [...splatters, ...newSplatters]
    coverage = estimateCoverage(splatters, stageWidth, stageHeight)
    needsSplash = false
  }

  // Update particles
  particles = updateParticles(particles, dt)

  // ── Phase transitions ──────────────────────────────────────────────────
  let phase = state.phase as GamePhase

  if (phase === 'playing' && coverage >= GAMEOVER_COVERAGE) {
    phase = 'gameover'
  }

  return {
    ...state,
    phase,
    mudskipper: skipper,
    particles,
    splatters,
    mud,
    coverage,
    time,
    needsSplash,
  }
}

function spawnSplash(x: number, y: number, scale: number): SplashParticle[] {
  const count = Math.floor(6 + scale * 6)
  const out: SplashParticle[] = []
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4
    const speed = 2 + Math.random() * 5 * scale
    const size = 2 + Math.random() * 5 * scale
    const isDark = Math.random() < 0.6
    out.push({
      x: x + (Math.random() - 0.5) * 16 * scale,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.8,
      maxLife: 1.3,
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

function spawnScreenSplatters(
  stageWidth: number,
  stageHeight: number,
): MudSplatter[] {
  const out: MudSplatter[] = []
  const count = SPLATTERS_PER_LAND + Math.floor(Math.random() * 3)
  const colors = [0x3e2723, 0x4e342e, 0x5d4037, 0x6d4c41]

  for (let i = 0; i < count; i++) {
    const rx = SPLATTER_MIN_RADIUS + Math.random() * (SPLATTER_MAX_RADIUS - SPLATTER_MIN_RADIUS)
    const ry = rx * (0.5 + Math.random() * 0.5)
    out.push({
      id: `splatter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x: Math.random() * stageWidth,
      y: Math.random() * stageHeight,
      radiusX: rx,
      radiusY: ry,
      rotation: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.5 + Math.random() * 0.4,
    })
  }
  return out
}

function estimateCoverage(splatters: MudSplatter[], stageWidth: number, stageHeight: number): number {
  const screenArea = stageWidth * stageHeight
  if (screenArea === 0) return 0

  // Estimate total splatter area (with overlap, this overestimates, but we use
  // a correction factor to account for expected overlap)
  let totalArea = 0
  for (const s of splatters) {
    // Approximate ellipse area
    totalArea += Math.PI * s.radiusX * s.radiusY * s.alpha
  }

  // Apply diminishing returns for overlap: as more splatters accumulate,
  // the marginal coverage increase is less.
  const rawRatio = totalArea / screenArea
  // Diminishing returns curve: effective coverage grows slower than raw area
  const effectiveCoverage = 1 - Math.exp(-rawRatio * 1.8)

  return Math.min(1, effectiveCoverage)
}