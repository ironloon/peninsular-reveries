export interface BakingSimulatorInputCallbacks {
  onStart: () => void
  onAddIngredient: (id: string) => void
  onKneadClick: () => void
  onChooseShape: (shape: 'round' | 'baguette' | 'roll') => void
  onShapeStroke: () => void
  onSetProofTemp: (t: number) => void
  onNext: () => void
  onBakeHeatUp: () => void
  onBakeHeatDown: () => void
  onPullBread: () => void
  onReplay: () => void
}

export function setupBakingSimulatorInput(callbacks: BakingSimulatorInputCallbacks): void {
  // Start button
  document.getElementById('start-btn')?.addEventListener('click', () => callbacks.onStart())
  // Ingredient buttons
  for (const id of ['flour', 'water', 'yeast', 'salt', 'sugar', 'butter']) {
    document.querySelector(`[data-ingredient="${id}"]`)?.addEventListener('click', () => callbacks.onAddIngredient(id))
  }
  // Knead area
  document.getElementById('knead-area')?.addEventListener('pointerdown', () => callbacks.onKneadClick())
  document.getElementById('knead-area')?.addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.onKneadClick() })
  // Shape buttons
  for (const shape of ['round', 'baguette', 'roll'] as const) {
    document.querySelector(`[data-shape="${shape}"]`)?.addEventListener('click', () => callbacks.onChooseShape(shape))
  }
  // Shape drag area
  const shapeArea = document.getElementById('shape-area')
  let shapeDragging = false
  let shapeLastX = 0
  let shapeLastY = 0
  if (shapeArea) {
    shapeArea.addEventListener('pointerdown', () => { shapeDragging = true })
    shapeArea.addEventListener('pointermove', (e) => {
      if (!shapeDragging) return
      const dx = (e as PointerEvent).clientX - shapeLastX
      const dy = (e as PointerEvent).clientY - shapeLastY
      if (Math.sqrt(dx * dx + dy * dy) > 8) callbacks.onShapeStroke()
      shapeLastX = (e as PointerEvent).clientX
      shapeLastY = (e as PointerEvent).clientY
    })
    shapeArea.addEventListener('pointerup', () => { shapeDragging = false })
    shapeArea.addEventListener('pointerleave', () => { shapeDragging = false })
  }
  // Proof slider
  const slider = document.getElementById('proof-slider')
  if (slider) {
    let sliderDragging = false
    slider.addEventListener('pointerdown', () => { sliderDragging = true })
    document.addEventListener('pointermove', (e) => {
      if (!sliderDragging) return
      const rect = slider.getBoundingClientRect()
      callbacks.onSetProofTemp(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
    })
    document.addEventListener('pointerup', () => { sliderDragging = false })
  }
  // Bake buttons
  document.getElementById('heat-up-btn')?.addEventListener('click', () => callbacks.onBakeHeatUp())
  document.getElementById('heat-down-btn')?.addEventListener('click', () => callbacks.onBakeHeatDown())
  document.getElementById('pull-btn')?.addEventListener('click', () => callbacks.onPullBread())
  // Next / replay
  document.getElementById('next-btn')?.addEventListener('click', () => callbacks.onNext())
  document.getElementById('replay-btn')?.addEventListener('click', () => callbacks.onReplay())
}