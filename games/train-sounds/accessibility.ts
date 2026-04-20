import { announce, moveFocusAfterTransition } from '../../client/game-accessibility.js'

import type { TrainHotspotId } from './types.js'

const HOTSPOT_REPEAT_DEBOUNCE_MS = 450

let lastHotspotAnnouncementKey = ''
let lastHotspotAnnouncementAt = 0

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function isVisible(element: HTMLElement | null): element is HTMLElement {
  if (!element) return false
  return !element.closest('[hidden]') && element.getClientRects().length > 0
}

function focusAfterDelay(action: () => void, delayMs: number): void {
  if (delayMs <= 0) {
    requestAnimationFrame(action)
    return
  }

  window.setTimeout(() => {
    requestAnimationFrame(action)
  }, delayMs)
}

function getVisibleElementById(elementId: string): HTMLElement | null {
  const element = document.getElementById(elementId)
  return isVisible(element) ? element : null
}

function findHotspotButton(hotspotId: TrainHotspotId): HTMLElement | null {
  const hotspotRoot = document.getElementById('train-hotspots')
  if (!hotspotRoot) return null

  return Array.from(hotspotRoot.querySelectorAll<HTMLElement>('.train-hotspot')).find(
    (button) => button.dataset.hotspotId === hotspotId || button.id === hotspotId,
  ) ?? null
}

function getFirstTrainControl(): HTMLElement | null {
  const hotspotRoot = document.getElementById('train-hotspots')
  const firstHotspot = hotspotRoot
    ? Array.from(hotspotRoot.querySelectorAll<HTMLElement>('.train-hotspot')).find((button) => isVisible(button)) ?? null
    : null

  return firstHotspot
    ?? getVisibleElementById('train-prev-btn')
    ?? getVisibleElementById('train-next-btn')
    ?? document.querySelector<HTMLElement>('.screen.active [data-settings-open="true"]')
}

export { moveFocusAfterTransition }

export function announceTrainChange(presetName: string): void {
  announce(`${presetName} selected.`, 'polite')
}

export function announceHotspotActivated(trainName: string, hotspotName: string): void {
  const now = nowMs()
  const announcementKey = `${trainName}::${hotspotName}`

  if (announcementKey === lastHotspotAnnouncementKey && now - lastHotspotAnnouncementAt < HOTSPOT_REPEAT_DEBOUNCE_MS) {
    lastHotspotAnnouncementAt = now
    return
  }

  lastHotspotAnnouncementKey = announcementKey
  lastHotspotAnnouncementAt = now
  announce(`${trainName}, ${hotspotName}.`, 'assertive')
}

export function focusStartButton(delayMs: number = 260): void {
  moveFocusAfterTransition('start-btn', delayMs)
}

export function focusTrainSwitcher(delayMs: number = 260): void {
  moveFocusAfterTransition('train-prev-btn', delayMs)
}

export function focusFirstTrainControl(delayMs: number = 260): void {
  focusAfterDelay(() => {
    getFirstTrainControl()?.focus({ preventScroll: true })
  }, delayMs)
}

export function focusHotspot(hotspotId: TrainHotspotId, delayMs: number = 0): void {
  focusAfterDelay(() => {
    findHotspotButton(hotspotId)?.focus({ preventScroll: true })
  }, delayMs)
}