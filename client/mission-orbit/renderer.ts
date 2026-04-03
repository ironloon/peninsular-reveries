import { isReducedMotion } from './animations.js'
import { getCueSignal, getMissionStepLabel, getMissionTimeLabel } from './state.js'
import { getPhaseDefinition, type BurnGrade, type GameState } from './types.js'

declare global {
  interface Window {
    __missionOrbitSettingsToggle?: () => void
  }
}

const STAR_DATA = [
  { x: 8, y: 10, r: 0.35, delay: '0s' },
  { x: 14, y: 18, r: 0.25, delay: '0.7s' },
  { x: 22, y: 8, r: 0.3, delay: '1.1s' },
  { x: 31, y: 14, r: 0.4, delay: '0.4s' },
  { x: 42, y: 7, r: 0.25, delay: '1.4s' },
  { x: 51, y: 19, r: 0.45, delay: '0.9s' },
  { x: 64, y: 11, r: 0.3, delay: '1.8s' },
  { x: 73, y: 15, r: 0.22, delay: '0.3s' },
  { x: 83, y: 9, r: 0.36, delay: '1.5s' },
  { x: 90, y: 17, r: 0.28, delay: '0.6s' },
  { x: 10, y: 33, r: 0.3, delay: '1.9s' },
  { x: 24, y: 26, r: 0.24, delay: '0.2s' },
  { x: 36, y: 31, r: 0.38, delay: '1.2s' },
  { x: 48, y: 25, r: 0.32, delay: '0.8s' },
  { x: 58, y: 35, r: 0.22, delay: '0.5s' },
  { x: 69, y: 30, r: 0.42, delay: '1.6s' },
  { x: 79, y: 34, r: 0.26, delay: '0.1s' },
  { x: 88, y: 29, r: 0.34, delay: '1.0s' },
]

type SceneShape = {
  rocketX: number
  rocketY: number
  rocketAngle: number
  flameVisible: boolean
  parachuteVisible: boolean
  orbitOpacity: number
  freeReturnOpacity: number
  moonOpacity: number
  launchPadOpacity: number
  oceanOpacity: number
  splashOpacity: number
  serviceModuleOpacity: number
}

let phaseLabelEl: HTMLElement | null = null
let statusLineEl: HTMLElement | null = null
let promptEl: HTMLElement | null = null
let stepPillEl: HTMLElement | null = null
let dayPillEl: HTMLElement | null = null
let clockEl: HTMLElement | null = null
let timingPanelEl: HTMLElement | null = null
let outcomeEl: HTMLElement | null = null
let countdownEl: HTMLElement | null = null
let meterEl: HTMLElement | null = null
let goodZoneEl: HTMLElement | null = null
let sweetZoneEl: HTMLElement | null = null
let cursorEl: HTMLElement | null = null
let timingHintEl: HTMLElement | null = null
let timingModeChipEl: HTMLElement | null = null
let actionBtnEl: HTMLButtonElement | null = null
let stageShellEl: HTMLElement | null = null
let starsEl: SVGGElement | null = null
let orbitPathEl: SVGElement | null = null
let freeReturnEl: SVGElement | null = null
let moonEl: SVGElement | null = null
let moonGlowEl: SVGElement | null = null
let launchPadEl: SVGElement | null = null
let oceanEl: SVGElement | null = null
let splashEl: SVGElement | null = null
let rocketEl: SVGElement | null = null
let flameEl: SVGElement | null = null
let parachuteEl: SVGElement | null = null
let serviceModuleEl: SVGElement | null = null
let endSummaryEl: HTMLElement | null = null

function requireSvg<T extends SVGElement>(id: string): T {
  return document.getElementById(id) as unknown as T
}

function getPhaseLabel(): HTMLElement { return phaseLabelEl ??= document.getElementById('mission-phase-label')! }
function getStatusLine(): HTMLElement { return statusLineEl ??= document.getElementById('mission-status-line')! }
function getPrompt(): HTMLElement { return promptEl ??= document.getElementById('mission-prompt')! }
function getStepPill(): HTMLElement { return stepPillEl ??= document.getElementById('mission-step-pill')! }
function getDayPill(): HTMLElement { return dayPillEl ??= document.getElementById('mission-day-pill')! }
function getClock(): HTMLElement { return clockEl ??= document.getElementById('mission-clock')! }
function getTimingPanel(): HTMLElement { return timingPanelEl ??= document.getElementById('timing-panel')! }
function getOutcome(): HTMLElement { return outcomeEl ??= document.getElementById('mission-outcome')! }
function getCountdown(): HTMLElement { return countdownEl ??= document.getElementById('countdown-overlay')! }
function getMeter(): HTMLElement { return meterEl ??= document.getElementById('timing-meter')! }
function getGoodZone(): HTMLElement { return goodZoneEl ??= document.getElementById('timing-good-zone')! }
function getSweetZone(): HTMLElement { return sweetZoneEl ??= document.getElementById('timing-sweet-zone')! }
function getCursor(): HTMLElement { return cursorEl ??= document.getElementById('timing-cursor')! }
function getTimingHint(): HTMLElement { return timingHintEl ??= document.getElementById('timing-hint')! }
function getTimingModeChip(): HTMLElement { return timingModeChipEl ??= document.getElementById('timing-mode-chip')! }
function getActionBtn(): HTMLButtonElement { return actionBtnEl ??= document.getElementById('mission-action-btn') as HTMLButtonElement }
function getStageShell(): HTMLElement { return stageShellEl ??= document.getElementById('mission-stage-shell')! }
function getStars(): SVGGElement { return starsEl ??= requireSvg<SVGGElement>('mission-stars') }
function getOrbitPath(): SVGElement { return orbitPathEl ??= requireSvg<SVGElement>('mission-orbit-path') }
function getFreeReturn(): SVGElement { return freeReturnEl ??= requireSvg<SVGElement>('mission-free-return') }
function getMoon(): SVGElement { return moonEl ??= requireSvg<SVGElement>('mission-moon') }
function getMoonGlow(): SVGElement { return moonGlowEl ??= requireSvg<SVGElement>('mission-moon-glow') }
function getLaunchPad(): SVGElement { return launchPadEl ??= requireSvg<SVGElement>('mission-launch-pad') }
function getOcean(): SVGElement { return oceanEl ??= requireSvg<SVGElement>('mission-ocean') }
function getSplash(): SVGElement { return splashEl ??= requireSvg<SVGElement>('mission-splash') }
function getRocket(): SVGElement { return rocketEl ??= requireSvg<SVGElement>('mission-rocket') }
function getFlame(): SVGElement { return flameEl ??= requireSvg<SVGElement>('mission-flame') }
function getParachute(): SVGElement { return parachuteEl ??= requireSvg<SVGElement>('mission-parachute') }
function getServiceModule(): SVGElement { return serviceModuleEl ??= requireSvg<SVGElement>('mission-service-module') }
function getEndSummary(): HTMLElement { return endSummaryEl ??= document.getElementById('end-summary')! }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount
}

function ensureStars(): void {
  const stars = getStars()
  if (stars.childNodes.length > 0) return

  for (const star of STAR_DATA) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', String(star.x))
    circle.setAttribute('cy', String(star.y))
    circle.setAttribute('r', String(star.r))
    circle.setAttribute('class', 'mission-star')
    circle.style.animationDelay = star.delay
    stars.appendChild(circle)
  }
}

function progressOnOrbit(progress: number): { x: number; y: number } {
  const angle = -Math.PI * 0.9 + progress * Math.PI * 1.7
  return {
    x: 22 + Math.cos(angle) * 23,
    y: 76 + Math.sin(angle) * 14,
  }
}

function buildSceneShape(state: GameState): SceneShape {
  switch (state.phase) {
    case 'countdown': {
      return {
        rocketX: 22,
        rocketY: 78,
        rocketAngle: 0,
        flameVisible: state.countdownValue <= 7,
        parachuteVisible: false,
        orbitOpacity: 0.05,
        freeReturnOpacity: 0,
        moonOpacity: 0.18,
        launchPadOpacity: 1,
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'launch': {
      const progress = state.launchProgress
      return {
        rocketX: 22 + progress * 1.4,
        rocketY: 78 - progress * 56,
        rocketAngle: progress * 4,
        flameVisible: state.actionHeld || progress > 0.04,
        parachuteVisible: false,
        orbitOpacity: progress > 0.56 ? 0.55 : 0,
        freeReturnOpacity: 0,
        moonOpacity: 0.18 + progress * 0.18,
        launchPadOpacity: Math.max(0, 1 - progress * 2.5),
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'orbit-insertion': {
      const point = progressOnOrbit((state.phaseElapsedMs % 3800) / 3800)
      return {
        rocketX: point.x,
        rocketY: point.y,
        rocketAngle: -22,
        flameVisible: false,
        parachuteVisible: false,
        orbitOpacity: 1,
        freeReturnOpacity: 0.08,
        moonOpacity: 0.28,
        launchPadOpacity: 0,
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'high-earth-orbit': {
      return {
        rocketX: 42,
        rocketY: 55,
        rocketAngle: -12,
        flameVisible: false,
        parachuteVisible: false,
        orbitOpacity: 0.85,
        freeReturnOpacity: 0.18,
        moonOpacity: 0.38,
        launchPadOpacity: 0,
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'trans-lunar-injection': {
      return {
        rocketX: 38,
        rocketY: 66,
        rocketAngle: -18,
        flameVisible: false,
        parachuteVisible: false,
        orbitOpacity: 0.55,
        freeReturnOpacity: 0.75,
        moonOpacity: 0.76,
        launchPadOpacity: 0,
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'lunar-flyby': {
      const progress = clamp(state.phaseElapsedMs / 3600, 0, 1)
      const x = progress < 0.62
        ? lerp(40, 80, progress / 0.62)
        : lerp(80, 86, (progress - 0.62) / 0.38)
      const y = progress < 0.62
        ? lerp(64, 26, progress / 0.62)
        : 26 + Math.sin(((progress - 0.62) / 0.38) * Math.PI) * 9

      return {
        rocketX: x,
        rocketY: y,
        rocketAngle: 18,
        flameVisible: false,
        parachuteVisible: false,
        orbitOpacity: 0.16,
        freeReturnOpacity: 1,
        moonOpacity: 1,
        launchPadOpacity: 0,
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'return-coast': {
      const progress = clamp(state.phaseElapsedMs / 3200, 0, 1)
      return {
        rocketX: lerp(82, 48, progress),
        rocketY: lerp(36, 58, progress),
        rocketAngle: 30,
        flameVisible: false,
        parachuteVisible: false,
        orbitOpacity: 0.22,
        freeReturnOpacity: 0.82,
        moonOpacity: 0.4,
        launchPadOpacity: 0,
        oceanOpacity: 0.18,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'service-module-jettison': {
      const progress = clamp(state.phaseElapsedMs / 2500, 0, 1)
      return {
        rocketX: lerp(58, 50, progress),
        rocketY: lerp(30, 64, progress),
        rocketAngle: 42,
        flameVisible: true,
        parachuteVisible: false,
        orbitOpacity: 0,
        freeReturnOpacity: 0.22,
        moonOpacity: 0.18,
        launchPadOpacity: 0,
        oceanOpacity: 0.58,
        splashOpacity: 0,
        serviceModuleOpacity: state.serviceModuleDetached ? 0 : 1,
      }
    }
    case 'parachute-deploy': {
      const progress = clamp(state.phaseElapsedMs / 2500, 0, 1)
      return {
        rocketX: 55,
        rocketY: lerp(34, 74, progress),
        rocketAngle: 0,
        flameVisible: !state.parachuteDeployed,
        parachuteVisible: state.parachuteDeployed,
        orbitOpacity: 0,
        freeReturnOpacity: 0,
        moonOpacity: 0.1,
        launchPadOpacity: 0,
        oceanOpacity: 1,
        splashOpacity: 0,
        serviceModuleOpacity: 0,
      }
    }
    case 'splashdown': {
      const progress = clamp(state.phaseElapsedMs / 2200, 0, 1)
      return {
        rocketX: 55,
        rocketY: lerp(74, 84, progress),
        rocketAngle: 0,
        flameVisible: false,
        parachuteVisible: progress < 0.55,
        orbitOpacity: 0,
        freeReturnOpacity: 0,
        moonOpacity: 0.1,
        launchPadOpacity: 0,
        oceanOpacity: 1,
        splashOpacity: progress,
        serviceModuleOpacity: 0,
      }
    }
    default: {
      return {
        rocketX: 22,
        rocketY: 78,
        rocketAngle: 0,
        flameVisible: false,
        parachuteVisible: false,
        orbitOpacity: 0,
        freeReturnOpacity: 0,
        moonOpacity: 0.16,
        launchPadOpacity: 1,
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
  }
}

function applyBurnClass(element: HTMLElement, grade: BurnGrade | null): void {
  element.classList.remove('is-perfect', 'is-good', 'is-safe', 'is-assist')
  if (grade) {
    element.classList.add(`is-${grade}`)
  }
}

function renderMeter(state: GameState): void {
  if (state.phase === 'title' || state.phase === 'celebration') return

  const definition = getPhaseDefinition(state.phase)
  const actionBtn = getActionBtn()
  const panel = getTimingPanel()
  const meter = getMeter()
  const stageShell = getStageShell()

  const showMeter = definition.mode === 'hold' || definition.mode === 'timing'
  const cueSignal = showMeter ? getCueSignal(state) : null
  const cueState = state.slowMoActive ? 'slow-mo' : cueSignal?.band ?? 'idle'
  const cueWord = state.slowMoActive ? 'NOW!' : cueSignal?.band === 'strike' ? 'NOW!' : cueSignal?.band === 'ready' ? 'READY' : ''
  const cueIntensity = state.slowMoActive
    ? Math.max(0.82, cueSignal?.intensity ?? 0.82)
    : cueSignal?.intensity ?? 0

  panel.classList.toggle('is-passive', !showMeter)
  panel.dataset.cueState = cueState
  panel.dataset.slowMo = state.slowMoActive ? 'true' : 'false'
  meter.classList.toggle('is-hidden', !showMeter)
  meter.dataset.cueState = cueState
  meter.dataset.slowMo = state.slowMoActive ? 'true' : 'false'
  meter.style.setProperty('--cue-intensity', cueIntensity.toFixed(3))
  meter.style.setProperty('--cue-scale', (0.82 + cueIntensity * 0.24).toFixed(3))
  meter.style.setProperty('--cue-sweet-scale', (0.76 + cueIntensity * 0.2).toFixed(3))
  meter.style.setProperty('--cue-core-scale', (0.78 + cueIntensity * 0.3).toFixed(3))

  stageShell.dataset.cueState = showMeter ? cueState : 'idle'
  stageShell.dataset.slowMo = state.slowMoActive ? 'true' : 'false'
  stageShell.dataset.cueWord = showMeter ? cueWord : ''
  stageShell.style.setProperty('--cue-intensity', cueIntensity.toFixed(3))
  stageShell.style.setProperty('--cue-stage-scale', (0.76 + cueIntensity * 0.34).toFixed(3))

  getTimingModeChip().textContent = definition.mode === 'hold'
    ? state.slowMoActive
      ? 'Slow-mo rescue'
      : cueSignal?.band === 'strike'
        ? 'Release now'
        : 'Listen + release'
    : definition.mode === 'timing'
      ? state.slowMoActive
        ? 'Slow-mo rescue'
        : cueSignal?.band === 'strike'
          ? 'Strike now'
          : 'Listen + tap'
      : definition.mode === 'countdown'
        ? 'Countdown'
        : 'Autopilot'

  getTimingHint().textContent = state.slowMoActive
    ? 'Guidance slowed the moment. Follow the flare and act now.'
    : definition.timingHint

  const disabled = definition.mode === 'countdown' || definition.mode === 'auto' || state.phaseResolved
  actionBtn.disabled = disabled
  actionBtn.classList.toggle('is-held', state.actionHeld)
  actionBtn.textContent = state.phaseResolved
    ? 'Maneuver locked'
    : definition.mode === 'hold'
      ? state.slowMoActive
        ? 'Release now'
        : state.actionHeld
          ? 'Release for cutoff'
          : definition.actionLabel
      : definition.mode === 'timing'
        ? state.slowMoActive
          ? 'Tap now'
          : cueSignal?.band === 'strike'
            ? 'Strike now'
            : definition.actionLabel
      : definition.actionLabel

  const goodZone = getGoodZone()
  const sweetZone = getSweetZone()
  const cursor = getCursor()
  goodZone.dataset.cueState = cueState
  sweetZone.dataset.cueState = cueState
  cursor.dataset.cueState = cueState
}

function renderScene(state: GameState): void {
  const scene = buildSceneShape(state)
  const stageShell = getStageShell()

  stageShell.dataset.phase = state.phase
  getRocket().setAttribute('transform', `translate(${scene.rocketX} ${scene.rocketY}) rotate(${scene.rocketAngle})`)

  getFlame().style.opacity = scene.flameVisible ? '1' : '0'
  getParachute().style.opacity = scene.parachuteVisible ? '1' : '0'
  getOrbitPath().style.opacity = String(scene.orbitOpacity)
  getFreeReturn().style.opacity = String(scene.freeReturnOpacity)
  getMoon().style.opacity = String(scene.moonOpacity)
  getMoonGlow().style.opacity = String(scene.moonOpacity * 0.5)
  getLaunchPad().style.opacity = String(scene.launchPadOpacity)
  getOcean().style.opacity = String(scene.oceanOpacity)
  getSplash().style.opacity = String(scene.splashOpacity)
  getServiceModule().style.opacity = String(scene.serviceModuleOpacity)
}

export function renderMission(state: GameState): void {
  if (state.phase === 'title' || state.phase === 'celebration') return

  ensureStars()

  const definition = getPhaseDefinition(state.phase)
  getPhaseLabel().textContent = definition.label
  getStatusLine().textContent = definition.status
  getPrompt().textContent = definition.prompt
  getStepPill().textContent = getMissionStepLabel(state)
  getDayPill().textContent = definition.dayLabel
  getClock().textContent = getMissionTimeLabel(state)
  getOutcome().textContent = state.outcomeText
  applyBurnClass(getOutcome(), state.outcomeGrade)
  getCountdown().textContent = String(state.countdownValue)
  getCountdown().classList.toggle('is-visible', state.phase === 'countdown')

  renderMeter(state)
  renderScene(state)
}

export function renderEndScreen(state: GameState): void {
  getEndSummary().textContent = `Mission time ${getMissionTimeLabel(state)}. You brought the astronaut home safe, and the recovery crew is ready with a hero's welcome.`
}

export function showScreen(screenId: string): void {
  const current = document.querySelector('.screen.active') as HTMLElement | null
  const next = document.getElementById(screenId)
  if (!next || current === next) return

  if (!current || isReducedMotion()) {
    current?.classList.remove('active')
    next.classList.add('active')
    return
  }

  next.classList.add('active')
  current.classList.add('leaving')

  const cleanup = (): void => {
    current.classList.remove('active', 'leaving')
    next.removeEventListener('transitionend', cleanup)
  }

  next.addEventListener('transitionend', cleanup)
  window.setTimeout(cleanup, 620)
}

export function getOutcomeElement(): HTMLElement {
  return getOutcome()
}

export function setupSettingsModal(): void {
  const modal = document.getElementById('settings-modal') as HTMLElement | null
  const closeBtn = document.getElementById('settings-close') as HTMLButtonElement | null
  const openButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-settings-open="true"]'))

  if (!modal || !closeBtn || openButtons.length === 0) return

  const modalEl = modal

  let previousFocus: HTMLElement | null = null

  function focusableElements(): HTMLElement[] {
    return Array.from(
      modalEl.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((element) => !element.hasAttribute('hidden'))
  }

  function setExpanded(expanded: boolean): void {
    for (const button of openButtons) {
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    }
  }

  function openModal(source?: HTMLElement): void {
    previousFocus = source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : openButtons[0])
    modalEl.hidden = false
    setExpanded(true)
    requestAnimationFrame(() => {
      const [first] = focusableElements()
      ;(first ?? modalEl).focus()
    })
  }

  function closeModal(): void {
    modalEl.hidden = true
    setExpanded(false)
    ;(previousFocus ?? openButtons[0]).focus()
  }

  window.__missionOrbitSettingsToggle = () => {
    if (modalEl.hidden) openModal()
    else closeModal()
  }

  for (const button of openButtons) {
    button.addEventListener('click', () => openModal(button))
  }

  closeBtn.addEventListener('click', closeModal)

  modalEl.addEventListener('click', (event) => {
    if (event.target === modalEl) {
      closeModal()
    }
  })

  modalEl.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeModal()
      return
    }

    if (event.key !== 'Tab') return

    const focusables = focusableElements()
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    }
  })
}