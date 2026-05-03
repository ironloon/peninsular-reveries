export type Phase = 'menu' | 'ingredients' | 'kneading' | 'shaping' | 'proofing' | 'baking' | 'result'

export type ShapeChoice = 'round' | 'baguette' | 'roll'

export interface IngredientDef {
  id: string
  label: string
  color: number
  emoji: string
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  color: number
  gravity: number
}

export interface Score {
  ingredients: number
  kneading: number
  shaping: number
  proofing: number
  baking: number
}

export interface GameState {
  phase: Phase
  score: Score
  addedIngredients: Set<string>
  bowlFill: number
  kneadProgress: number
  kneadClicks: number
  kneadNeeded: number
  doughSquish: number
  chosenShape: ShapeChoice | null
  shapeProgress: number
  shapeStrokes: number
  proofProgress: number
  proofTemp: number
  proofRise: number
  proofOverproofed: boolean
  proofDone: boolean
  ovenHeat: number
  bakeProgress: number
  bakeColor: number
  bakePulled: boolean
  bakeBurnt: boolean
  phaseTime: number
  particles: Particle[]
}