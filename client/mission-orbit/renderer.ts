import { isReducedMotion } from './animations.js'
import { getMissionStepLabel, getMissionTimeLabel, isRecoveryActionReady } from './state.js'
import { MISSION_SEQUENCE, getPhaseDefinition, type BurnGrade, type GameState, type MissionPhase } from './types.js'
import type { MissionCrewProfile } from '../../app/data/mission-orbit-crew.js'
import { bindReduceMotionToggle } from '../preferences.js'

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

type ScenePose = {
  x: number
  y: number
  angle: number
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
let countdownCalloutEl: HTMLElement | null = null
let meterEl: HTMLElement | null = null
let goodZoneEl: HTMLElement | null = null
let sweetZoneEl: HTMLElement | null = null
let cursorEl: HTMLElement | null = null
let timingHintEl: HTMLElement | null = null
let timingModeChipEl: HTMLElement | null = null
let actionBtnEl: HTMLButtonElement | null = null
let stageShellEl: HTMLElement | null = null
let stageTargetEl: HTMLElement | null = null
let starsEl: SVGGElement | null = null
let orbitPathEl: SVGPathElement | null = null
let freeReturnEl: SVGPathElement | null = null
let moonEl: SVGElement | null = null
let moonGlowEl: SVGElement | null = null
let launchPadEl: SVGElement | null = null
let oceanEl: SVGElement | null = null
let splashEl: SVGElement | null = null
let rocketEl: SVGElement | null = null
let rocketFrameEl: SVGElement | null = null
let rocketHitAreaEl: SVGElement | null = null
let rocketCueGlowEl: SVGElement | null = null
let rocketCueRingEl: SVGElement | null = null
let flameEl: SVGElement | null = null
let parachuteEl: SVGElement | null = null
let serviceModuleEl: SVGElement | null = null
let endSummaryEl: HTMLElement | null = null
let crewOverlayEl: HTMLElement | null = null
let recoveryBoatEl: HTMLElement | null = null

let lastCrewOverlayKey = ''

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
function getCountdownCallout(): HTMLElement { return countdownCalloutEl ??= document.getElementById('mission-countdown-callout')! }
function getMeter(): HTMLElement { return meterEl ??= document.getElementById('timing-meter')! }
function getGoodZone(): HTMLElement { return goodZoneEl ??= document.getElementById('timing-good-zone')! }
function getSweetZone(): HTMLElement { return sweetZoneEl ??= document.getElementById('timing-sweet-zone')! }
function getCursor(): HTMLElement { return cursorEl ??= document.getElementById('timing-cursor')! }
function getTimingHint(): HTMLElement { return timingHintEl ??= document.getElementById('timing-hint')! }
function getTimingModeChip(): HTMLElement { return timingModeChipEl ??= document.getElementById('timing-mode-chip')! }
function getActionBtn(): HTMLButtonElement { return actionBtnEl ??= document.getElementById('mission-action-btn') as HTMLButtonElement }
function getStageShell(): HTMLElement { return stageShellEl ??= document.getElementById('mission-stage-shell')! }
function getStageTarget(): HTMLElement { return stageTargetEl ??= document.getElementById('mission-stage-target')! }
function getStars(): SVGGElement { return starsEl ??= requireSvg<SVGGElement>('mission-stars') }
function getOrbitPath(): SVGPathElement { return orbitPathEl ??= requireSvg<SVGPathElement>('mission-orbit-path') }
function getFreeReturn(): SVGPathElement { return freeReturnEl ??= requireSvg<SVGPathElement>('mission-free-return') }
function getMoon(): SVGElement { return moonEl ??= requireSvg<SVGElement>('mission-moon') }
function getMoonGlow(): SVGElement { return moonGlowEl ??= requireSvg<SVGElement>('mission-moon-glow') }
function getLaunchPad(): SVGElement { return launchPadEl ??= requireSvg<SVGElement>('mission-launch-pad') }
function getOcean(): SVGElement { return oceanEl ??= requireSvg<SVGElement>('mission-ocean') }
function getSplash(): SVGElement { return splashEl ??= requireSvg<SVGElement>('mission-splash') }
function getRocket(): SVGElement { return rocketEl ??= requireSvg<SVGElement>('mission-rocket') }
function getRocketFrame(): SVGElement { return rocketFrameEl ??= requireSvg<SVGElement>('mission-rocket-frame') }
function getRocketHitArea(): SVGElement { return rocketHitAreaEl ??= requireSvg<SVGElement>('mission-rocket-hit-area') }
function getRocketCueGlow(): SVGElement { return rocketCueGlowEl ??= requireSvg<SVGElement>('mission-rocket-glow') }
function getRocketCueRing(): SVGElement { return rocketCueRingEl ??= requireSvg<SVGElement>('mission-rocket-cue-ring') }
function getFlame(): SVGElement { return flameEl ??= requireSvg<SVGElement>('mission-flame') }
function getParachute(): SVGElement { return parachuteEl ??= requireSvg<SVGElement>('mission-parachute') }
function getServiceModule(): SVGElement { return serviceModuleEl ??= requireSvg<SVGElement>('mission-service-module') }
function getEndSummary(): HTMLElement { return endSummaryEl ??= document.getElementById('end-summary')! }
function getCrewOverlay(): HTMLElement { return crewOverlayEl ??= document.getElementById('mission-crew-overlay')! }
function getRecoveryBoat(): HTMLElement { return recoveryBoatEl ??= document.getElementById('mission-recovery-boat')! }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount
}

function quadraticBezier(start: number, control: number, end: number, amount: number): number {
  const inverse = 1 - amount
  return inverse * inverse * start + 2 * inverse * amount * control + amount * amount * end
}

function easeOutCubic(amount: number): number {
  const inverse = 1 - amount
  return 1 - inverse * inverse * inverse
}

function lerpAngle(start: number, end: number, amount: number): number {
  const delta = ((end - start + 540) % 360) - 180
  return start + delta * amount
}

function countdownState(value: number): 'steady' | 'engines' | 'final' | 'liftoff' {
  if (value === 0) return 'liftoff'
  if (value <= 3) return 'final'
  if (value <= 7) return 'engines'
  return 'steady'
}

function crewChipMarkup(crew: MissionCrewProfile): string {
  return `<article class="mission-crew-chip"><span class="mission-crew-badge" style="--crew-accent:${escapeHtml(crew.accent)};--crew-accent-soft:${escapeHtml(crew.accentSoft)}">${escapeHtml(crew.badge)}</span><span class="mission-crew-copy"><strong>${escapeHtml(crew.name)}</strong><span>${escapeHtml(crew.role)} · ${escapeHtml(crew.agency)}</span></span></article>`
}

function setCrewOverlay(state: GameState): void {
  const overlay = getCrewOverlay()

  let mode = 'hidden'
  let title = ''
  let caption = ''

  if (state.phase === 'countdown' && state.countdownValue >= 8) {
    mode = 'boarding'
    title = 'Crew boarding complete'
    caption = state.countdownValue >= 9
      ? 'Hatches are sealed, straps are tight, and the cabin is ready for launch.'
      : 'The crew is strapped in and listening for engine start.'
  } else if (state.phase === 'lunar-flyby') {
    mode = 'lunar'
    title = 'Cabin view'
    caption = 'The crew is at the windows while Orion slides around the far side of the Moon.'
  } else if (state.phase === 'splashdown' && state.phaseElapsedMs >= 3000) {
    mode = 'recovery'
    title = 'Recovery team inbound'
    caption = isRecoveryActionReady(state)
      ? 'Recovery is alongside. Continue when you are ready to leave the water.'
      : 'The recovery boat is easing in beside the capsule.'
  }

  const nextKey = `${mode}:${title}:${caption}:${state.crew.map((crew) => crew.id).join(',')}`
  if (nextKey === lastCrewOverlayKey) {
    overlay.dataset.mode = mode
    overlay.hidden = mode === 'hidden'
    return
  }

  lastCrewOverlayKey = nextKey
  overlay.dataset.mode = mode
  overlay.hidden = mode === 'hidden'

  if (mode === 'hidden') {
    overlay.innerHTML = ''
    return
  }

  overlay.innerHTML = `<div class="mission-crew-shell"><p class="mission-crew-title">${escapeHtml(title)}</p><div class="mission-crew-list">${state.crew.map(crewChipMarkup).join('')}</div><p class="mission-crew-caption">${escapeHtml(caption)}</p></div>`
}

function renderRecoveryBoat(state: GameState): void {
  const boat = getRecoveryBoat()
  if (state.phase !== 'splashdown' || state.phaseElapsedMs < 2000) {
    boat.dataset.visible = 'false'
    boat.style.opacity = '0'
    return
  }

  const progress = easeOutCubic(clamp((state.phaseElapsedMs - 2000) / 6000, 0, 1))
  const left = lerp(130, 58, progress)
  const top = lerp(92, 82, progress)

  boat.dataset.visible = progress >= 1 ? 'ready' : 'true'
  boat.style.opacity = String(clamp(progress * 1.2, 0, 1))
  boat.style.left = `${left}%`
  boat.style.top = `${top}%`
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

function sampleGeometryPath(path: SVGGeometryElement, progress: number): { x: number; y: number; angle: number } {
  const safeProgress = clamp(progress, 0, 1)
  const totalLength = path.getTotalLength()
  const epsilon = Math.min(totalLength * 0.015, 1.2)
  const distance = totalLength * safeProgress
  const point = path.getPointAtLength(distance)
  const behind = path.getPointAtLength(Math.max(0, distance - epsilon))
  const ahead = path.getPointAtLength(Math.min(totalLength, distance + epsilon))

  return {
    x: point.x,
    y: point.y,
    angle: Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI + 90,
  }
}

function sampleOrbit(progress: number): { x: number; y: number; angle: number } {
  return sampleGeometryPath(getOrbitPath(), progress)
}

function sampleFreeReturn(progress: number): { x: number; y: number; angle: number } {
  return sampleGeometryPath(getFreeReturn(), progress)
}

function launchPose(progress: number): ScenePose {
  const orbitEntry = sampleOrbit(0.04)
  return {
    x: quadraticBezier(22, 18.8, orbitEntry.x, progress),
    y: quadraticBezier(78, 47, orbitEntry.y, progress),
    angle: lerp(0, orbitEntry.angle, clamp(progress * 0.9, 0, 1)),
  }
}

function orbitLoopProgress(phaseElapsedMs: number): number {
  return (0.08 + phaseElapsedMs / 5600) % 1
}

function getBriefingSourcePhase(state: GameState): MissionPhase {
  if (state.phase === 'title' || state.phase === 'celebration' || state.phase === 'countdown') {
    return 'title'
  }

  return MISSION_SEQUENCE[state.phaseIndex - 1] ?? 'title'
}

function getPhaseBoundaryPose(phase: MissionPhase, boundary: 'start' | 'end'): ScenePose {
  switch (phase) {
    case 'title':
    case 'countdown':
      return { x: 22, y: 78, angle: 0 }
    case 'launch':
      return launchPose(boundary === 'start' ? 0 : 0.88)
    case 'orbit-insertion':
      return sampleOrbit(boundary === 'start' ? 0.08 : 0.14)
    case 'high-earth-orbit':
      return sampleOrbit(boundary === 'start' ? 0.14 : 0.18)
    case 'trans-lunar-injection':
      return sampleFreeReturn(boundary === 'start' ? 0.03 : 0.25)
    case 'lunar-flyby':
      return sampleFreeReturn(boundary === 'start' ? 0.25 : 0.62)
    case 'return-coast':
      return sampleFreeReturn(boundary === 'start' ? 0.62 : 0.95)
    case 'service-module-jettison':
      return boundary === 'start'
        ? sampleFreeReturn(0.95)
        : { x: 50, y: 64, angle: 38 }
    case 'parachute-deploy':
      return boundary === 'start'
        ? { x: 50, y: 64, angle: 38 }
        : { x: 55, y: 74, angle: 0 }
    case 'splashdown':
    case 'celebration':
      return boundary === 'start'
        ? { x: 55, y: 74, angle: 0 }
        : { x: 55, y: 84, angle: 0 }
  }
}

function applyBriefingPose(state: GameState, scene: SceneShape): SceneShape {
  if (state.phase === 'title' || state.phase === 'celebration' || state.phase === 'countdown' || !state.briefingActive) {
    return scene
  }

  const definition = getPhaseDefinition(state.phase)
  const briefingMs = Math.max(definition.briefingMs ?? 1, 1)
  const transitionProgress = easeOutCubic(clamp(state.phaseElapsedMs / briefingMs, 0, 1))
  const fromPose = getPhaseBoundaryPose(getBriefingSourcePhase(state), 'end')
  const toPose = getPhaseBoundaryPose(state.phase, 'start')

  return {
    ...scene,
    rocketX: lerp(fromPose.x, toPose.x, transitionProgress),
    rocketY: lerp(fromPose.y, toPose.y, transitionProgress),
    rocketAngle: lerpAngle(fromPose.angle, toPose.angle, transitionProgress),
  }
}

function buildSceneShape(state: GameState): SceneShape {
  const phaseElapsedMs = state.briefingActive ? 0 : state.phaseElapsedMs

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
      const orbitEntry = sampleOrbit(0.04)
      return {
        rocketX: quadraticBezier(22, 18.8, orbitEntry.x, progress),
        rocketY: quadraticBezier(78, 47, orbitEntry.y, progress),
        rocketAngle: lerp(0, orbitEntry.angle, clamp(progress * 0.9, 0, 1)),
        flameVisible: state.actionHeld || progress > 0.04,
        parachuteVisible: false,
        orbitOpacity: progress > 0.42 ? clamp((progress - 0.42) / 0.28, 0, 0.7) : 0,
        freeReturnOpacity: 0,
        moonOpacity: 0.18 + progress * 0.18,
        launchPadOpacity: Math.max(0, 1 - progress * 2.5),
        oceanOpacity: 0,
        splashOpacity: 0,
        serviceModuleOpacity: 1,
      }
    }
    case 'orbit-insertion': {
      const point = sampleOrbit(orbitLoopProgress(phaseElapsedMs))
      return {
        rocketX: point.x,
        rocketY: point.y,
        rocketAngle: point.angle,
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
      const point = sampleOrbit(0.14 + Math.sin(phaseElapsedMs / 1400) * 0.025)
      return {
        rocketX: point.x,
        rocketY: point.y,
        rocketAngle: point.angle,
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
      const progress = clamp(phaseElapsedMs / 7600, 0, 1)
      const orbitExit = sampleOrbit(0.18)
      const pathEntry = sampleFreeReturn(0.14)

      if (progress < 0.34) {
        const bridgeProgress = easeOutCubic(progress / 0.34)
        return {
          rocketX: quadraticBezier(orbitExit.x, 49, pathEntry.x, bridgeProgress),
          rocketY: quadraticBezier(orbitExit.y, 57, pathEntry.y, bridgeProgress),
          rocketAngle: lerpAngle(orbitExit.angle, pathEntry.angle, bridgeProgress),
          flameVisible: progress <= 0.22,
          parachuteVisible: false,
          orbitOpacity: 0.48,
          freeReturnOpacity: 0.55,
          moonOpacity: 0.68,
          launchPadOpacity: 0,
          oceanOpacity: 0,
          splashOpacity: 0,
          serviceModuleOpacity: 1,
        }
      }

      const point = sampleFreeReturn(0.14 + ((progress - 0.34) / 0.66) * 0.11)
      return {
        rocketX: point.x,
        rocketY: point.y,
        rocketAngle: point.angle,
        flameVisible: progress <= 0.22,
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
      const progress = clamp(phaseElapsedMs / 6200, 0, 1)
      const point = sampleFreeReturn(0.25 + progress * 0.37)

      return {
        rocketX: point.x,
        rocketY: point.y,
        rocketAngle: point.angle,
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
      const progress = clamp(phaseElapsedMs / 5600, 0, 1)
      const point = sampleFreeReturn(0.62 + progress * 0.33)
      return {
        rocketX: point.x,
        rocketY: point.y,
        rocketAngle: point.angle,
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
      const progress = clamp(phaseElapsedMs / 2500, 0, 1)
      const returnEntry = sampleFreeReturn(0.95)
      return {
        rocketX: lerp(returnEntry.x, 50, progress),
        rocketY: lerp(returnEntry.y, 64, progress),
        rocketAngle: lerp(returnEntry.angle, 38, progress),
        flameVisible: !state.serviceModuleDetached || state.stopMoActive,
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
      const progress = clamp(phaseElapsedMs / 2500, 0, 1)
      return {
        rocketX: lerp(50, 55, progress),
        rocketY: lerp(64, 74, progress),
        rocketAngle: lerp(38, 0, clamp(progress * 1.6, 0, 1)),
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
      const progress = clamp(phaseElapsedMs / 2200, 0, 1)
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
  const stageTarget = getStageTarget()
  const recoveryReady = isRecoveryActionReady(state)

  const showMeter = !state.briefingActive && definition.mode === 'hold'
  const showStageTarget = state.briefingActive || showMeter || definition.mode === 'narrative' || definition.mode === 'countdown' || state.phase === 'splashdown'
  const cueState = showMeter && state.actionHeld ? 'ready' : 'idle'
  const cueWord = state.briefingActive ? 'STAND BY' : showMeter && state.actionHeld ? 'HOLD' : ''
  const cueIntensity = showMeter ? Math.max(0.16, state.launchProgress) : 0

  panel.classList.toggle('is-passive', !showMeter)
  panel.dataset.cueState = cueState
  panel.dataset.stopMo = 'false'
  meter.classList.toggle('is-hidden', !showMeter)
  meter.dataset.cueState = cueState
  meter.dataset.stopMo = 'false'
  meter.style.setProperty('--cue-intensity', cueIntensity.toFixed(3))
  meter.style.setProperty('--cue-scale', (0.82 + cueIntensity * 0.12).toFixed(3))
  meter.style.setProperty('--cue-sweet-scale', '0.76')
  meter.style.setProperty('--cue-core-scale', (0.78 + cueIntensity * 0.16).toFixed(3))

  stageShell.dataset.cueState = showMeter ? cueState : 'idle'
  stageShell.dataset.stopMo = 'false'
  stageShell.dataset.briefing = state.briefingActive ? 'true' : 'false'
  stageShell.dataset.cueWord = state.briefingActive ? cueWord : showMeter ? cueWord : ''
  stageShell.style.setProperty('--cue-intensity', cueIntensity.toFixed(3))
  stageShell.style.setProperty('--cue-stage-scale', (0.76 + cueIntensity * 0.12).toFixed(3))

  stageTarget.classList.toggle('is-visible', showStageTarget && !state.phaseResolved)
  stageTarget.dataset.mode = state.briefingActive ? 'briefing' : definition.mode
  stageTarget.textContent = state.briefingActive
    ? definition.mode === 'hold'
      ? 'Stand by for ascent'
      : definition.mode === 'narrative'
        ? 'Read the mission log'
        : 'Watch the flight path'
    : state.phase === 'splashdown'
      ? recoveryReady
        ? 'Recovery boat alongside'
        : 'Recovery boat inbound'
    : definition.mode === 'hold'
      ? state.actionHeld
        ? 'Hold steady'
        : 'Hold the spacecraft'
      : definition.mode === 'narrative'
        ? 'Continue when ready'
        : definition.mode === 'countdown'
          ? 'Watch the clock'
          : ''

  getTimingModeChip().textContent = state.briefingActive
    ? 'Mission brief'
    : definition.mode === 'hold'
    ? 'Ascent'
    : definition.mode === 'narrative'
      ? 'Mission log'
      : definition.mode === 'countdown'
        ? 'Countdown'
        : state.phase === 'splashdown'
          ? 'Recovery'
        : 'Coast phase'

  getTimingHint().textContent = state.briefingActive
    ? definition.prompt
    : state.phase === 'splashdown'
      ? recoveryReady
        ? 'Recovery is alongside. Continue when you are ready to wrap the mission.'
        : 'The capsule is steady while the recovery boat closes the last gap.'
      : definition.mode === 'hold' && state.actionHeld
        ? 'Keep holding until Orion reaches orbit.'
      : definition.timingHint

  const disabled = definition.mode === 'countdown'
    || state.phaseResolved
    || (state.phase === 'splashdown' && !state.briefingActive && !recoveryReady)
    || (definition.mode === 'auto' && state.phase !== 'splashdown' && !state.briefingActive)
  actionBtn.disabled = disabled
  actionBtn.classList.toggle('is-held', state.actionHeld)
  actionBtn.textContent = state.briefingActive
    ? definition.mode === 'hold'
      ? 'Begin ascent'
      : definition.mode === 'auto' && state.phase === 'splashdown'
        ? 'Track recovery'
        : 'Continue'
    : state.phaseResolved
    ? 'Step logged'
    : state.phase === 'splashdown'
      ? recoveryReady
        ? 'Continue'
        : 'Recovery approaching'
    : definition.mode === 'hold'
      ? state.actionHeld
        ? 'Hold steady'
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
  if (state.phase === 'title' || state.phase === 'celebration') return

  const scene = applyBriefingPose(state, buildSceneShape(state))
  const stageShell = getStageShell()
  const definition = getPhaseDefinition(state.phase)
  const manualPhase = definition.mode === 'hold' || definition.mode === 'narrative'
  const interactive = state.briefingActive || (manualPhase && !state.phaseResolved)
  const cueState = definition.mode === 'hold' && !state.briefingActive && state.actionHeld ? 'ready' : 'idle'
  const cueIntensity = definition.mode === 'hold' && !state.briefingActive ? state.launchProgress : 0
  const countdownBeat = state.phase === 'countdown' ? countdownState(state.countdownValue) : 'steady'
  const countdownGlow = state.phase === 'countdown'
    ? countdownBeat === 'liftoff'
      ? 1
      : countdownBeat === 'final'
        ? 0.74
        : countdownBeat === 'engines'
          ? 0.44
          : 0.12
    : 0
  const rocket = getRocket()
  const rocketFrame = getRocketFrame()
  const rocketHitArea = getRocketHitArea()
  const rocketCueGlow = getRocketCueGlow()
  const rocketCueRing = getRocketCueRing()

  stageShell.dataset.phase = state.phase
  stageShell.dataset.briefing = state.briefingActive ? 'true' : 'false'
  stageShell.dataset.countdownState = state.phase === 'countdown' ? countdownBeat : 'idle'
  rocket.setAttribute('transform', `translate(${scene.rocketX} ${scene.rocketY})`)
  rocketFrame.setAttribute('transform', `rotate(${scene.rocketAngle})`)
  rocket.dataset.interactive = interactive ? 'true' : 'false'
  rocket.dataset.cueState = cueState
  rocket.dataset.stopMo = state.stopMoActive ? 'true' : 'false'
  rocketHitArea.style.pointerEvents = interactive ? 'all' : 'none'
  rocketHitArea.style.cursor = interactive ? 'pointer' : 'default'
  rocketCueGlow.style.opacity = state.briefingActive
    ? '0.18'
    : manualPhase
      ? String(0.08 + cueIntensity * 0.34)
      : state.phase === 'countdown'
        ? String(0.08 + countdownGlow * 0.18)
        : '0'
  rocketCueRing.style.opacity = state.briefingActive
    ? '0.22'
    : manualPhase
      ? String(0.14 + cueIntensity * 0.72)
      : state.phase === 'countdown' && countdownBeat !== 'steady'
        ? String(0.16 + countdownGlow * 0.34)
        : '0'
  rocketCueGlow.setAttribute('transform', `scale(${state.phase === 'countdown' ? (1.02 + countdownGlow * 0.16).toFixed(3) : (1.04 + cueIntensity * 0.2).toFixed(3)})`)
  rocketCueRing.setAttribute('transform', `scale(${state.phase === 'countdown' ? (0.94 + countdownGlow * 0.18).toFixed(3) : (0.92 + cueIntensity * 0.24).toFixed(3)})`)

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

  setCrewOverlay(state)
  renderRecoveryBoat(state)
}

function missionDisplayCopy(state: GameState): { status: string; prompt: string; callout: string } {
  if (state.phase === 'title') {
    return {
      status: 'Artemis II crew ready on the gantry',
      prompt: 'The Artemis II crew is set. Launch when you are ready to fly.',
      callout: '',
    }
  }

  if (state.phase === 'celebration') {
    return {
      status: 'Recovery complete',
      prompt: 'The capsule is aboard and the crew is heading home.',
      callout: '',
    }
  }

  const definition = getPhaseDefinition(state.phase)

  if (state.phase === 'countdown') {
    const beat = countdownState(state.countdownValue)
    if (beat === 'steady') {
      return {
        status: 'Final go / no-go poll is complete',
        prompt: 'Crew boarding is complete and the stack is alive on the pad.',
        callout: 'Go for launch',
      }
    }

    if (beat === 'engines') {
      return {
        status: 'Main engines start',
        prompt: 'Engine ignition is under way. Hold for booster ignition at zero.',
        callout: 'Main engines start',
      }
    }

    if (beat === 'final') {
      return {
        status: 'Auto-sequence is locked',
        prompt: 'Boosters are armed. Ride the last beats of the clock.',
        callout: 'Hold for booster ignition',
      }
    }

    return {
      status: 'Booster ignition',
      prompt: 'Liftoff. Climb clean and hold for orbit.',
      callout: 'Liftoff',
    }
  }

  if (state.phase === 'lunar-flyby') {
    return {
      status: 'The crew has the far side in view',
      prompt: 'Set the correction, then let the crew watch Earthrise slide back into view.',
      callout: '',
    }
  }

  if (state.phase === 'splashdown') {
    if (isRecoveryActionReady(state)) {
      return {
        status: 'Recovery boat is alongside',
        prompt: 'The capsule is secure. Take a last look, then continue when you are ready.',
        callout: '',
      }
    }

    if (state.phaseElapsedMs >= 2000) {
      return {
        status: 'Recovery boat is closing in',
        prompt: 'The capsule is floating steady while the boat eases in from starboard.',
        callout: '',
      }
    }
  }

  return {
    status: definition.status,
    prompt: definition.prompt,
    callout: '',
  }
}

export function renderMission(state: GameState): void {
  if (state.phase === 'title' || state.phase === 'celebration') return

  ensureStars()

  const definition = getPhaseDefinition(state.phase)
  const displayCopy = missionDisplayCopy(state)
  getPhaseLabel().textContent = definition.label
  getStatusLine().textContent = displayCopy.status
  getPrompt().textContent = displayCopy.prompt
  getStepPill().textContent = getMissionStepLabel(state)
  getDayPill().textContent = definition.dayLabel
  getClock().textContent = getMissionTimeLabel(state)
  getOutcome().textContent = state.outcomeText
  applyBurnClass(getOutcome(), state.outcomeGrade)
  getCountdown().textContent = String(state.countdownValue)
  getCountdown().classList.toggle('is-visible', state.phase === 'countdown')
  getCountdown().dataset.beat = state.phase === 'countdown' ? countdownState(state.countdownValue) : 'steady'
  getCountdownCallout().hidden = state.phase !== 'countdown' || displayCopy.callout.length === 0
  getCountdownCallout().textContent = displayCopy.callout
  getCountdownCallout().dataset.beat = state.phase === 'countdown' ? countdownState(state.countdownValue) : 'steady'

  renderMeter(state)
  renderScene(state)
}

export function renderEndScreen(state: GameState): void {
  const crewNames = state.crew.map((crew) => crew.name.split(' ')[0])
  const crewSummary = crewNames.length === 0
    ? 'The crew is back aboard the recovery ship.'
    : crewNames.length === 1
      ? `${crewNames[0]} is back aboard the recovery ship.`
      : crewNames.length === 2
        ? `${crewNames[0]} and ${crewNames[1]} are back aboard the recovery ship.`
        : `${crewNames.slice(0, -1).join(', ')}, and ${crewNames.at(-1)} are back aboard the recovery ship.`

  getEndSummary().textContent = `Mission time ${getMissionTimeLabel(state)}. ${crewSummary}`
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
  const reduceMotionToggle = document.getElementById('reduce-motion-toggle') as HTMLInputElement | null
  const reduceMotionHelp = document.getElementById('reduce-motion-help') as HTMLElement | null

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

  bindReduceMotionToggle(reduceMotionToggle, reduceMotionHelp)

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