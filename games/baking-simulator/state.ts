import type { GameState, ShapeChoice } from './types.js'

export function createInitialState(): GameState {
  return {
    phase: 'menu',
    score: { ingredients: 0, kneading: 0, shaping: 0, proofing: 0, baking: 0 },
    addedIngredients: new Set(),
    bowlFill: 0,
    kneadProgress: 0,
    kneadClicks: 0,
    kneadNeeded: 30,
    doughSquish: 0,
    chosenShape: null,
    shapeProgress: 0,
    shapeStrokes: 0,
    proofProgress: 0,
    proofTemp: 0.5,
    proofRise: 0,
    proofOverproofed: false,
    proofDone: false,
    ovenHeat: 0,
    bakeProgress: 0,
    bakeColor: 0,
    bakePulled: false,
    bakeBurnt: false,
    phaseTime: 0,
    particles: [],
  }
}

export function resetForReplay(): GameState {
  return createInitialState()
}

export function addIngredient(state: GameState, id: string): GameState {
  if (state.addedIngredients.has(id)) return state
  const newSet = new Set(state.addedIngredients)
  newSet.add(id)
  const bowlFill = newSet.size / 6
  const score = { ...state.score }
  if (newSet.size === 6) {
    score.ingredients = 100
  }
  return { ...state, addedIngredients: newSet, bowlFill, score }
}

export function handleKneadClick(state: GameState): GameState {
  if (state.kneadProgress >= 1) return state
  const kneadClicks = state.kneadClicks + 1
  const kneadProgress = Math.min(kneadClicks / state.kneadNeeded, 1)
  const score = { ...state.score }
  if (kneadProgress >= 1 && score.kneading === 0) {
    score.kneading = Math.max(60, Math.round(100 - Math.max(0, (kneadClicks - state.kneadNeeded) * 1.5)))
  }
  return { ...state, kneadClicks, kneadProgress, doughSquish: 1, score }
}

export function chooseShape(state: GameState, shape: ShapeChoice): GameState {
  return { ...state, chosenShape: shape, shapeProgress: 0, shapeStrokes: 0 }
}

export function handleShapeStroke(state: GameState): GameState {
  if (!state.chosenShape || state.shapeProgress >= 1) return state
  const shapeStrokes = state.shapeStrokes + 1
  const shapeProgress = Math.min(shapeStrokes / 20, 1)
  const score = { ...state.score }
  if (shapeProgress >= 1 && score.shaping === 0) {
    score.shaping = 85 + Math.round(Math.random() * 15)
  }
  return { ...state, shapeStrokes, shapeProgress, score }
}

export function updateProofing(state: GameState, dt: number): GameState {
  const speed = 0.04 + state.proofTemp * 0.18
  const proofProgress = Math.min(state.proofProgress + speed * dt, 1)
  const proofRise = Math.min(state.proofRise + speed * dt * 0.7, 1.8)
  let proofOverproofed = state.proofOverproofed
  let proofDone = state.proofDone
  const score = { ...state.score }

  if (proofRise > 1.25 && !proofOverproofed) {
    proofOverproofed = true
    score.proofing = 25
  } else if (proofProgress >= 1 && !proofOverproofed && !proofDone) {
    proofDone = true
    score.proofing = Math.round(Math.min(100, 65 + (1 - Math.abs(proofRise - 0.85) * 0.8) * 35))
  }

  return { ...state, proofProgress, proofRise, proofOverproofed, proofDone, score }
}

export function setProofTemp(state: GameState, temp: number): GameState {
  return { ...state, proofTemp: Math.max(0, Math.min(1, temp)) }
}

export function addOvenHeat(state: GameState, amount: number): GameState {
  return { ...state, ovenHeat: Math.max(0, Math.min(1, state.ovenHeat + amount)) }
}

export function updateBaking(state: GameState, dt: number): GameState {
  if (state.bakePulled) return state
  const ovenHeat = Math.max(0, state.ovenHeat - 0.04 * dt)
  let bakeProgress = state.bakeProgress
  let bakeColor = state.bakeColor

  if (ovenHeat > 0.05) {
    bakeProgress = Math.min(bakeProgress + ovenHeat * 0.12 * dt, 1)
    bakeColor = Math.min(bakeColor + ovenHeat * 0.07 * dt, 1)
  }

  return { ...state, ovenHeat, bakeProgress, bakeColor }
}

export function pullBread(state: GameState): { state: GameState; message: string } {
  if (state.bakePulled) return { state, message: '' }
  const b = state.bakeColor
  const score: number =
    b < 0.15 ? 10 :
    b < 0.35 ? 45 :
    b < 0.65 ? 90 + Math.round((0.65 - b) / 0.3 * 10) :
    b < 0.82 ? 55 : 20
  const message: string =
    b < 0.15 ? '😱 Raw dough! Not baked at all...' :
    b < 0.35 ? '😐 Underbaked — still doughy inside.' :
    b < 0.65 ? '🎉 Perfectly baked! Golden & delicious!' :
    b < 0.82 ? '😐 Slightly overbaked — extra crispy!' :
    '🔥 BURNT! Total charcoal...'
  const updated = { ...state, bakePulled: true, bakeBurnt: b >= 0.82, score: { ...state.score, baking: score } }
  return { state: updated, message }
}