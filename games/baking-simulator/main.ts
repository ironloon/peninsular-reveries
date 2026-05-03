import { Application, Container, Graphics, Text } from 'pixi.js'
import { setupGameMenu } from '../../client/game-menu.js'
import { announceToast, announcePhase, announceIngredient } from './accessibility.js'
import { animateIngredient } from './animations.js'
import { initStage, Camera, C, STATIONS_X, INGREDIENT_DEFS, drawKitchenBG, renderIngredients, renderKneading, renderShaping, renderProofing, renderBaking } from './renderer.js'
import { createInitialState, resetForReplay, addIngredient, handleKneadClick, chooseShape, handleShapeStroke, updateProofing, setProofTemp, addOvenHeat, updateBaking, pullBread } from './state.js'
import { ensureAudioUnlocked, sfxClick, sfxSuccess, sfxKnead, sfxBake, sfxPull } from './sounds.js'
import { rand } from './util.js'
import type { Phase, Particle } from './types.js'

// ── DOM helpers ──
function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null
}

const ALL_SCREENS = ['start-screen', 'game-screen', 'result-screen']

function showScreen(screenId: string): void {
  for (const id of ALL_SCREENS) {
    const el = byId(id)
    if (!el) continue
    const isActive = id === screenId
    el.hidden = !isActive
    el.classList.toggle('active', isActive)
    if (isActive) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }
}

function showToast(msg: string): void {
  const el = byId('toast-area')
  if (!el) return
  const toast = document.createElement('div')
  toast.className = 'bs-toast'
  toast.textContent = msg
  el.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
  announceToast(msg)
}

// ── Runtime state ──
let state = createInitialState()
let app: Application | null = null
let camera: Camera | null = null
let globalTime = 0
let gameLoopCallback: ((ticker: { deltaTime: number; deltaMS: number }) => void) | null = null

// Pixi objects
let world: Container
let particleGfx: Graphics
const particles: Particle[] = []
const stationGfx: Record<string, Graphics> = {}
let menuGrp: Container
let menuEmoji: Text

function spawnParticle(x: number, y: number, color: number, opts: Record<string, number> = {}) {
  const { count = 1, spread = 60, size = 4, life = 1, gravity = 80 } = opts
  const vx = opts.vx ?? 0, vy = opts.vy ?? 0
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: vx + (Math.random() - 0.5) * spread,
      vy: vy + (Math.random() - 0.5) * spread - 20,
      size: size * (0.5 + Math.random() * 0.8),
      life, maxLife: life,
      color, gravity,
    })
  }
}



// ── Phase transition ──
function goToPhase(phase: Phase): void {
  state.phase = phase
  state.phaseTime = 0

  const sx = STATIONS_X[phase === 'result' ? 'result' : phase] ?? 0
  if (camera) camera.moveTo(sx, 0, 1)

  menuGrp.visible = phase === 'menu'

  if (phase === 'menu') {
    showScreen('start-screen')
  } else if (phase === 'result') {
    showScreen('result-screen')
    buildResult()
  } else {
    showScreen('game-screen')
  }

  // Show/hide station controls
  byId('ing-station')?.classList.toggle('hidden', phase !== 'ingredients')
  byId('knead-station')?.classList.toggle('hidden', phase !== 'kneading')
  byId('shape-station')?.classList.toggle('hidden', phase !== 'shaping')
  byId('proof-station')?.classList.toggle('hidden', phase !== 'proofing')
  byId('bake-station')?.classList.toggle('hidden', phase !== 'baking')
  byId('next-btn')?.classList.add('hidden')

  announcePhase(phase)
  updateHUD()
}

function updateHUD(): void {
  const ingBtns = document.querySelectorAll('[data-ingredient]')
  for (const btn of ingBtns) {
    if (state.addedIngredients.has((btn as HTMLElement).dataset.ingredient ?? '')) {
      btn.classList.add('added')
      btn.setAttribute('aria-disabled', 'true')
    }
  }
  byId('ing-bar-fill')?.setAttribute('style', `width:${state.bowlFill * 100}%`)
  byId('knead-bar-fill')?.setAttribute('style', `width:${state.kneadProgress * 100}%`)
  byId('shape-bar-fill')?.setAttribute('style', `width:${state.shapeProgress * 100}%`)
  byId('proof-bar-fill')?.setAttribute('style', `width:${state.proofProgress * 100}%`)
  byId('proof-temp-label')!.textContent = `${Math.round(60 + state.proofTemp * 65)}\u00B0F`
  byId('bake-bar-fill')?.setAttribute('style', `width:${state.bakeColor * 100}%`)
  byId('bake-heat-label')!.textContent = `Heat: ${Math.round(state.ovenHeat * 100)}%`

  if (state.addedIngredients.size === 6 && state.phase === 'ingredients') byId('next-btn')?.classList.remove('hidden')
  if (state.kneadProgress >= 1 && state.phase === 'kneading') byId('next-btn')?.classList.remove('hidden')
  if (state.shapeProgress >= 1 && state.phase === 'shaping') byId('next-btn')?.classList.remove('hidden')
  if (state.proofDone && !state.proofOverproofed && state.phase === 'proofing') byId('next-btn')?.classList.remove('hidden')
  if (state.phase === 'baking' && !state.bakePulled) byId('next-btn')?.classList.remove('hidden')
}

function buildResult(): void {
  const resultScore = byId('result-scores')
  if (!resultScore) return
  resultScore.innerHTML = ''
  const cats = [
    { name: '🧪 Ingredients', score: state.score.ingredients },
    { name: '🤲 Kneading', score: state.score.kneading },
    { name: '✋ Shaping', score: state.score.shaping },
    { name: '🌡️ Proofing', score: state.score.proofing },
    { name: '🔥 Baking', score: state.score.baking },
  ]
  for (const cat of cats) {
    const color = cat.score >= 80 ? '#4CAF50' : cat.score >= 50 ? '#FFD700' : '#E53935'
    resultScore.innerHTML += `<div class="bs-result-row"><span>${cat.name}</span><div class="bs-result-bar-bg"><div class="bs-result-bar-fill" style="width:${cat.score}%;background:${color}"></div></div><span>${cat.score}%</span></div>`
  }
  const avg = Math.round(cats.reduce((s, c) => s + c.score, 0) / cats.length)
  const stars = avg >= 90 ? '⭐⭐⭐' : avg >= 70 ? '⭐⭐' : avg >= 40 ? '⭐' : '💀'
  const msg = avg >= 90 ? 'Master Baker! 🏆' : avg >= 70 ? 'Great Job! 👏' : avg >= 40 ? 'Keep Practicing! 💪' : 'Burnt Offering... 😬'
  byId('result-total')!.textContent = `${stars}  Score: ${avg}%`
  byId('result-message')!.textContent = msg
}

// ── Boot ──
async function boot(): Promise<void> {
  const pixiStage = byId('pixi-stage')
  if (!pixiStage) { console.error('No #pixi-stage element'); return }

  app = await initStage(pixiStage)
  if (!app) { console.error('Failed to initialize PixiJS'); return }

  setupGameMenu()
  window.addEventListener('reveries:music-change', (_e) => {
    // Could toggle music here
  })

  world = new Container()
  app.stage.addChild(world)

  camera = new Camera()

  // Particle layer
  particleGfx = new Graphics()
  world.addChild(particleGfx)

  // Kitchen background
  const bgGfx = new Graphics()
  drawKitchenBG(bgGfx)
  world.addChildAt(bgGfx, 0)

  // Station graphics containers
  for (const key of Object.keys(STATIONS_X)) {
    const c = new Container()
    c.x = STATIONS_X[key]; c.y = 0
    world.addChild(c)
    const g = new Graphics()
    c.addChild(g)
    stationGfx[key] = g
  }

  // Menu overlay
  menuGrp = new Container()
  menuGrp.x = 0; menuGrp.y = 0
  world.addChild(menuGrp)
  const titleText = new Text({ text: 'BAKING\nSIMULATOR', style: { fontFamily: 'Georgia, serif', fontSize: 58, fill: C.uiGold, fontWeight: 'bold', align: 'center', lineHeight: 72 } })
  titleText.anchor.set(0.5); titleText.x = 0; titleText.y = -180
  menuGrp.addChild(titleText)
  menuEmoji = new Text({ text: '🍞', style: { fontSize: 60 } })
  menuEmoji.anchor.set(0.5); menuEmoji.x = 0; menuEmoji.y = -300
  menuGrp.addChild(menuEmoji)
  const menuSub = new Text({ text: "Let's bake some bread!", style: { fontFamily: 'Georgia, serif', fontSize: 18, fill: C.cream } })
  menuSub.anchor.set(0.5); menuSub.x = 0; menuSub.y = -40
  menuGrp.addChild(menuSub)

  camera.moveTo(0, 0, 1)

  // ── Input bindings ──
  byId('start-btn')?.addEventListener('click', () => {
    ensureAudioUnlocked(); sfxClick(); goToPhase('ingredients')
  })

  for (const id of ['flour', 'water', 'yeast', 'salt', 'sugar', 'butter']) {
    document.querySelector(`[data-ingredient="${id}"]`)?.addEventListener('click', () => {
      if (state.phase !== 'ingredients') return
      const prev = state.addedIngredients.size
      state = addIngredient(state, id)
      if (state.addedIngredients.size > prev) {
        sfxClick()
        animateIngredient(id)
        spawnParticle(STATIONS_X.ingredients, -5, INGREDIENT_DEFS.find(d => d.id === id)?.color ?? C.flour, { count: 8, spread: 40, size: 5, life: 0.7, gravity: 60 })
        if (camera) camera.shake(2)
        announceIngredient(id)
        if (state.addedIngredients.size === 6) {
          sfxSuccess()
          showToast('✅ All ingredients added!')
        }
        updateHUD()
      }
    })
  }

  byId('knead-area')?.addEventListener('pointerdown', () => {
    if (state.phase !== 'kneading' || state.kneadProgress >= 1) return
    state = handleKneadClick(state)
    sfxKnead()
    spawnParticle(STATIONS_X.kneading + rand(-60, 60), rand(-40, -10), C.flour, { count: 3, spread: 25, size: 2.5, life: 0.5, gravity: 40 })
    if (camera) camera.shake(2)
    if (state.kneadProgress >= 1 && state.score.kneading > 0) {
      sfxSuccess()
      showToast('✅ Dough is smooth and elastic!')
    }
    updateHUD()
  })

  for (const shape of ['round', 'baguette', 'roll'] as const) {
    document.querySelector(`[data-shape="${shape}"]`)?.addEventListener('click', () => {
      if (state.phase !== 'shaping' || state.chosenShape) return
      state = chooseShape(state, shape)
      sfxClick()
      showToast(`Shaping: ${shape === 'round' ? 'Round Loaf' : shape === 'baguette' ? 'Baguette' : 'Dinner Rolls'} — drag to shape!`)
      byId('shape-choices')?.classList.add('hidden')
      byId('shape-area')?.classList.remove('hidden')
      updateHUD()
    })
  }

  // Shape dragging
  let shapeDragging = false
  let shapeLastX = 0, shapeLastY = 0
  const shapeArea = byId('shape-area')
  if (shapeArea) {
    shapeArea.addEventListener('pointerdown', () => { shapeDragging = true })
    shapeArea.addEventListener('pointermove', (e) => {
      if (!shapeDragging || state.phase !== 'shaping' || !state.chosenShape || state.shapeProgress >= 1) return
      const dx = (e as PointerEvent).clientX - shapeLastX
      const dy = (e as PointerEvent).clientY - shapeLastY
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        state = handleShapeStroke(state)
        spawnParticle(STATIONS_X.shaping + rand(-70, 70), rand(-40, -15), C.flour, { count: 2, spread: 15, size: 2, life: 0.4, gravity: 30 })
        if (state.shapeProgress >= 1 && state.score.shaping > 0) {
          sfxSuccess(); showToast('✅ Beautifully shaped!')
        }
        updateHUD()
      }
      shapeLastX = (e as PointerEvent).clientX; shapeLastY = (e as PointerEvent).clientY
    })
    shapeArea.addEventListener('pointerup', () => { shapeDragging = false })
    shapeArea.addEventListener('pointerleave', () => { shapeDragging = false })
  }

  // Proof slider
  const slider = byId('proof-slider')
  let sliderDragging = false
  if (slider) {
    slider.addEventListener('pointerdown', () => { sliderDragging = true })
    document.addEventListener('pointermove', (e) => {
      if (!sliderDragging) return
      const rect = slider.getBoundingClientRect()
      state = setProofTemp(state, Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
    })
    document.addEventListener('pointerup', () => { sliderDragging = false })
  }

  // Bake buttons
  byId('heat-up-btn')?.addEventListener('click', () => {
    if (state.phase !== 'baking' || state.bakePulled) return
    state = addOvenHeat(state, 0.2)
    sfxBake()
    if (camera) camera.shake(2)
    spawnParticle(STATIONS_X.baking, -150, C.ovenGlow, { count: 5, spread: 30, size: 4, life: 0.6, gravity: -40, vy: -40 })
  })
  byId('heat-down-btn')?.addEventListener('click', () => {
    if (state.phase !== 'baking' || state.bakePulled) return
    state = addOvenHeat(state, -0.15)
  })
  byId('pull-btn')?.addEventListener('click', () => {
    if (state.phase !== 'baking' || state.bakePulled) return
    const result = pullBread(state)
    state = result.state
    sfxPull()
    if (camera) camera.shake(10)
    spawnParticle(STATIONS_X.baking, -40, C.white, { count: 20, spread: 80, size: 6, life: 1.2, gravity: -30 })
    showToast(result.message)
    byId('heat-up-btn')?.classList.add('hidden')
    byId('heat-down-btn')?.classList.add('hidden')
    byId('pull-btn')?.classList.add('hidden')
    updateHUD()
    setTimeout(() => goToPhase('result'), 2500)
  })

  // Next button
  byId('next-btn')?.addEventListener('click', () => {
    sfxClick()
    const phases: Phase[] = ['ingredients', 'kneading', 'shaping', 'proofing', 'baking', 'result']
    const idx = phases.indexOf(state.phase as Phase)
    if (idx >= 0 && idx < phases.length - 1) goToPhase(phases[idx + 1])
  })

  // Replay
  byId('replay-btn')?.addEventListener('click', () => {
    state = resetForReplay()
    sfxClick()
    // Reset HTML UI
    document.querySelectorAll('[data-ingredient]').forEach(b => { b.classList.remove('added'); b.removeAttribute('aria-disabled') })
    byId('shape-choices')?.classList.remove('hidden')
    byId('shape-area')?.classList.add('hidden')
    byId('proof-status')?.classList.remove('overproofed')
    byId('heat-up-btn')?.classList.remove('hidden')
    byId('heat-down-btn')?.classList.remove('hidden')
    byId('pull-btn')?.classList.add('hidden')
    goToPhase('menu')
  })

  // ── Game loop ──
  gameLoopCallback = (ticker: { deltaTime: number }) => {
    if (!app) return
    const dt = Math.min(ticker.deltaTime, 3) / 60
    globalTime += dt

    const sw = app.screen.width
    const sh = app.screen.height

    camera!.update(world, sw, sh)

    // Particles
    particleGfx.clear()
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.vy += p.gravity * dt
      p.x += p.vx * dt; p.y += p.vy * dt
      p.life -= dt
      if (p.life <= 0) { particles.splice(i, 1); continue }
      const a = p.life / p.maxLife
      particleGfx.circle(p.x, p.y, p.size * a).fill({ color: p.color, alpha: a * 0.75 })
    }

    // Phase-specific rendering
    state.phaseTime += dt

    if (state.phase === 'ingredients') {
      renderIngredients(stationGfx.ingredients, state)
    }
    if (state.phase === 'kneading') {
      if (state.doughSquish > 0.01) state.doughSquish *= 0.86
      renderKneading(stationGfx.kneading, state, globalTime)
    }
    if (state.phase === 'shaping') {
      renderShaping(stationGfx.shaping, state)
    }
    if (state.phase === 'proofing') {
      state = updateProofing(state, dt)
      const proofFill = byId('proof-bar-fill')
      if (proofFill) proofFill.style.width = `${state.proofProgress * 100}%`
      const tempLabel = byId('proof-temp-label')
      if (tempLabel) tempLabel.textContent = `${Math.round(60 + state.proofTemp * 65)}\u00B0F`
      const sliderKnob = byId('proof-slider-knob')
      if (sliderKnob) sliderKnob.style.left = `${state.proofTemp * 100}%`
      byId('proof-status')?.classList.toggle('overproofed', state.proofOverproofed)
      if (state.proofDone && !state.proofOverproofed) {
        byId('next-btn')?.classList.remove('hidden')
      }
      renderProofing(stationGfx.proofing, state)
      updateHUD()
    }
    if (state.phase === 'baking' && !state.bakePulled) {
      state = updateBaking(state, dt)
      const heatLabel = byId('bake-heat-label')
      if (heatLabel) heatLabel.textContent = `Heat: ${Math.round(state.ovenHeat * 100)}%`
      const bakeBar = byId('bake-bar-fill')
      if (bakeBar) bakeBar.style.width = `${state.bakeColor * 100}%`
      const pullBtn = byId('pull-btn')
      if (pullBtn) pullBtn.classList.toggle('hidden', state.bakeColor < 0.08)
      renderBaking(stationGfx.baking, state)
      // Ember particles
      if (state.ovenHeat > 0.25 && Math.random() < state.ovenHeat * 0.2) {
        spawnParticle(STATIONS_X.baking + rand(-60, 60), -150 + rand(-10, 10), C.ovenGlow, { count: 1, spread: 8, vy: -40, size: 2.5, life: 0.4, gravity: -25 })
      }
    }

    // Menu animation
    if (state.phase === 'menu') {
      menuGrp.y = Math.sin(globalTime * 0.8) * 5
      menuEmoji.y = -300 + Math.sin(globalTime * 1.2) * 6
      if (Math.random() < 0.03) {
        spawnParticle(rand(-140, 140), rand(-80, 80), C.cream, { count: 1, vy: -25, spread: 15, size: 2.5, life: 1.8, gravity: -8 })
      }
    }
  }

  app.ticker.add(gameLoopCallback)
  goToPhase('menu')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true })
} else {
  boot()
}