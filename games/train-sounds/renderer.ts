import { TRAIN_PRESET_IDS, getTrainPresetDefinition } from './catalog.js'
import type { TrainHotspotDefinition, TrainHotspotId, TrainPresetDefinition, TrainSoundsState } from './types.js'

interface RendererRefs {
  readonly gameScreen: HTMLElement
  readonly panel: HTMLElement
  readonly header: HTMLElement
  readonly selectorBar: HTMLElement
  readonly scene: HTMLElement
  readonly displayFrame: HTMLElement
  readonly hotspots: HTMLElement
  readonly trainName: HTMLElement
  readonly prevButton: HTMLButtonElement
  readonly nextButton: HTMLButtonElement
}

interface HotspotLayoutRef {
  readonly definition: TrainHotspotDefinition
  readonly button: HTMLButtonElement
}

export interface TrainSoundsRenderer {
  readonly scene: HTMLElement
  readonly hotspots: HTMLElement
  readonly trainName: HTMLElement
  readonly prevButton: HTMLButtonElement
  readonly nextButton: HTMLButtonElement
  render(state: TrainSoundsState): void
  syncLayout(): void
  dispose(): void
  getHotspotButton(hotspotId: TrainHotspotId): HTMLButtonElement | null
  getCurrentHotspotButtons(): readonly HTMLButtonElement[]
}

const SCENE_PRESET_CLASSES = TRAIN_PRESET_IDS.map((presetId) => `train-scene--${presetId}`)
const HOTSPOT_TOUCH_TARGET_PX = 44
const HOTSPOT_EDGE_GUTTER_PX = 8
const HOTSPOT_MAX_WIDTH_RATIO = 0.24
const HOTSPOT_MAX_WIDTH_PX = 104
const COMPACT_SCENE_MEDIA_QUERY = '(orientation: landscape) and (max-height: 540px)'
const COMPACT_SCENE_TOP_PADDING_MIN_PX = 8
const COMPACT_SCENE_TOP_PADDING_MAX_PX = 16
const COMPACT_SCENE_SIDE_PADDING_MIN_PX = 12
const COMPACT_SCENE_SIDE_PADDING_MAX_PX = 24
const COMPACT_SCENE_BOTTOM_PADDING_MIN_PX = 24
const COMPACT_SCENE_BOTTOM_PADDING_MAX_PX = 34
const COMPACT_SCENE_CLEARANCE_PX = 20
const COMPACT_DISPLAY_HEIGHT_RATIO = 0.55
const COMPACT_DISPLAY_MIN_HEIGHT_PX = 96
const COMPACT_DISPLAY_MAX_HEIGHT_PX = 136

function byId<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id)
  return element instanceof HTMLElement ? (element as T) : null
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = byId<T>(id)
  if (!element) {
    throw new Error(`Train Sounds renderer could not find #${id}.`)
  }
  return element
}

function requireSelector<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector)
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Train Sounds renderer could not find ${selector}.`)
  }
  return element as T
}

function clamp(value: number, min: number, max: number): number {
  if (max <= min) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

function readPixels(value: string): number {
  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  classNames: readonly string[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)
  if (classNames.length > 0) {
    element.classList.add(...classNames)
  }
  return element
}

function getOrCreateDisplayFrame(scene: HTMLElement, hotspots: HTMLElement): HTMLElement {
  const existingFrame = scene.querySelector<HTMLElement>('.train-display-frame')
  if (existingFrame) {
    return existingFrame
  }

  const displayFrame = createElement('div', ['train-display-frame'])
  displayFrame.setAttribute('aria-hidden', 'true')
  scene.insertBefore(displayFrame, hotspots)
  return displayFrame
}

function createLocomotive(preset: TrainPresetDefinition): HTMLElement {
  const locomotive = createElement('div', [
    'train-locomotive',
    `train-locomotive--${preset.art.locomotive}`,
  ])
  locomotive.dataset.locomotive = preset.art.locomotive
  locomotive.dataset.livery = preset.art.livery
  locomotive.append(
    createElement('span', ['train-stack']),
    createElement('span', ['train-headlight']),
    createElement('span', ['train-cab']),
  )
  return locomotive
}

function createCoupler(carIndex: number): HTMLElement {
  const classNames = ['train-coupler']

  if (carIndex === 0) {
    classNames.push('train-coupler--one')
  } else if (carIndex === 1) {
    classNames.push('train-coupler--two')
  }

  return createElement('span', classNames)
}

function createCar(preset: TrainPresetDefinition, carIndex: number): HTMLElement {
  const classNames = ['train-car', `train-car--${preset.art.carriage}`]

  if (carIndex === 0) {
    classNames.push('train-car--first')
  } else if (carIndex === 1) {
    classNames.push('train-car--second')
  }

  const car = createElement('div', classNames)
  car.dataset.carriage = preset.art.carriage
  car.dataset.livery = preset.art.livery
  car.dataset.carIndex = String(carIndex)
  return car
}

function createTrack(): HTMLElement {
  const track = createElement('div', ['train-track'])

  for (let sleeperIndex = 0; sleeperIndex < 6; sleeperIndex += 1) {
    track.appendChild(createElement('span', ['train-sleeper']))
  }

  return track
}

function createDisplay(preset: TrainPresetDefinition): HTMLElement {
  const display = createElement('div', ['train-display'])
  display.dataset.backdrop = preset.art.backdrop
  display.dataset.locomotive = preset.art.locomotive
  display.dataset.carriage = preset.art.carriage
  display.dataset.livery = preset.art.livery
  display.dataset.carCount = String(preset.art.carCount)
  display.appendChild(createLocomotive(preset))

  for (let carIndex = 0; carIndex < preset.art.carCount; carIndex += 1) {
    display.appendChild(createCoupler(carIndex))
    display.appendChild(createCar(preset, carIndex))
  }

  display.appendChild(createTrack())
  return display
}

function getVisibleHotspotLabel(label: string): string {
  if (label.length <= 10) {
    return label
  }

  const words = label.trim().split(/\s+/)
  return words[words.length - 1] ?? label
}

function createHotspotButton(
  preset: TrainPresetDefinition,
  hotspot: TrainHotspotDefinition,
): HTMLButtonElement {
  const button = createElement('button', [
    'train-hotspot',
    `train-hotspot--${hotspot.zone}`,
    `train-hotspot--${hotspot.category}`,
  ]) as HTMLButtonElement

  button.type = 'button'
  button.id = hotspot.id
  button.dataset.hotspotId = hotspot.id
  button.dataset.hotspotZone = hotspot.zone
  button.dataset.hotspotCategory = hotspot.category
  button.dataset.presetId = preset.id
  button.textContent = getVisibleHotspotLabel(hotspot.label)
  button.title = hotspot.label
  button.setAttribute('aria-label', `${hotspot.label} on ${preset.name}`)
  button.style.minWidth = `${HOTSPOT_TOUCH_TARGET_PX}px`
  button.style.minHeight = `${HOTSPOT_TOUCH_TARGET_PX}px`
  button.style.maxWidth = `${HOTSPOT_MAX_WIDTH_PX}px`
  button.style.overflow = 'hidden'
  button.style.textOverflow = 'ellipsis'
  button.style.whiteSpace = 'nowrap'

  return button
}

function renderHotspots(
  refs: RendererRefs,
  preset: TrainPresetDefinition,
): {
  readonly buttonsById: Map<TrainHotspotId, HTMLButtonElement>
  readonly layouts: readonly HotspotLayoutRef[]
} {
  const buttonsById = new Map<TrainHotspotId, HTMLButtonElement>()
  const layouts: HotspotLayoutRef[] = []
  const fragment = document.createDocumentFragment()

  for (const hotspot of preset.hotspots) {
    const button = createHotspotButton(preset, hotspot)
    buttonsById.set(hotspot.id, button)
    layouts.push({ definition: hotspot, button })
    fragment.appendChild(button)
  }

  refs.hotspots.replaceChildren(fragment)
  return {
    buttonsById,
    layouts,
  }
}

function syncSceneMetadata(scene: HTMLElement, preset: TrainPresetDefinition): void {
  scene.classList.remove(...SCENE_PRESET_CLASSES)
  scene.classList.add(`train-scene--${preset.id}`)
  scene.dataset.trainPreset = preset.id
  scene.dataset.backdrop = preset.art.backdrop
  scene.dataset.locomotive = preset.art.locomotive
  scene.dataset.carriage = preset.art.carriage
  scene.dataset.livery = preset.art.livery
  scene.dataset.carCount = String(preset.art.carCount)
}

function getDisplayElement(displayFrame: HTMLElement): HTMLElement | null {
  return displayFrame.querySelector<HTMLElement>('.train-display')
}

function resetResponsiveSceneLayout(refs: RendererRefs): void {
  refs.scene.style.removeProperty('height')
  refs.scene.style.removeProperty('min-height')
  refs.scene.style.removeProperty('max-height')
  refs.displayFrame.style.removeProperty('padding')
  refs.scene.dataset.viewportFit = 'default'

  const display = getDisplayElement(refs.displayFrame)
  display?.style.removeProperty('height')
}

function syncResponsiveSceneLayout(refs: RendererRefs): void {
  const display = getDisplayElement(refs.displayFrame)
  if (!display) {
    return
  }

  if (!window.matchMedia(COMPACT_SCENE_MEDIA_QUERY).matches) {
    resetResponsiveSceneLayout(refs)
    return
  }

  const panelStyles = window.getComputedStyle(refs.panel)
  const panelGapPx = readPixels(panelStyles.rowGap || panelStyles.gap)
  const availableSceneHeight = Math.floor(
    refs.panel.clientHeight
      - refs.header.getBoundingClientRect().height
      - refs.selectorBar.getBoundingClientRect().height
      - panelGapPx * 2,
  )

  if (availableSceneHeight <= 0) {
    resetResponsiveSceneLayout(refs)
    return
  }

  const sceneWidth = Math.max(refs.scene.clientWidth, refs.panel.clientWidth)
  const topPaddingPx = Math.round(
    clamp(availableSceneHeight * 0.05, COMPACT_SCENE_TOP_PADDING_MIN_PX, COMPACT_SCENE_TOP_PADDING_MAX_PX),
  )
  const sidePaddingPx = Math.round(
    clamp(sceneWidth * 0.04, COMPACT_SCENE_SIDE_PADDING_MIN_PX, COMPACT_SCENE_SIDE_PADDING_MAX_PX),
  )
  const bottomPaddingPx = Math.round(
    clamp(
      availableSceneHeight * 0.16,
      COMPACT_SCENE_BOTTOM_PADDING_MIN_PX,
      COMPACT_SCENE_BOTTOM_PADDING_MAX_PX,
    ),
  )
  const maxDisplayHeight = Math.max(
    COMPACT_DISPLAY_MIN_HEIGHT_PX,
    availableSceneHeight - topPaddingPx - bottomPaddingPx - COMPACT_SCENE_CLEARANCE_PX,
  )
  const preferredDisplayHeight = clamp(
    availableSceneHeight * COMPACT_DISPLAY_HEIGHT_RATIO,
    COMPACT_DISPLAY_MIN_HEIGHT_PX,
    COMPACT_DISPLAY_MAX_HEIGHT_PX,
  )
  const displayHeightPx = Math.round(Math.min(maxDisplayHeight, preferredDisplayHeight))

  refs.scene.dataset.viewportFit = 'compact'
  refs.scene.style.height = `${availableSceneHeight}px`
  refs.scene.style.minHeight = `${availableSceneHeight}px`
  refs.scene.style.maxHeight = `${availableSceneHeight}px`
  refs.displayFrame.style.padding = `${topPaddingPx}px ${sidePaddingPx}px ${bottomPaddingPx}px`
  display.style.height = `${displayHeightPx}px`
}

function layoutHotspots(refs: RendererRefs, hotspotLayouts: readonly HotspotLayoutRef[]): void {
  const sceneWidth = refs.scene.clientWidth
  const sceneHeight = refs.scene.clientHeight

  if (sceneWidth <= 0 || sceneHeight <= 0 || hotspotLayouts.length === 0) {
    return
  }

  const hotspotMaxWidthPx = Math.round(
    clamp(sceneWidth * HOTSPOT_MAX_WIDTH_RATIO, HOTSPOT_TOUCH_TARGET_PX, HOTSPOT_MAX_WIDTH_PX),
  )

  for (const { definition, button } of hotspotLayouts) {
    button.style.maxWidth = `${hotspotMaxWidthPx}px`

    const buttonWidth = button.offsetWidth
    const buttonHeight = button.offsetHeight
    const anchorXPx = sceneWidth * ((definition.bounds.x + definition.bounds.width / 2) / 100)
    const anchorYPx = sceneHeight * ((definition.bounds.y + definition.bounds.height / 2) / 100)
    const maxLeftPx = Math.max(HOTSPOT_EDGE_GUTTER_PX, sceneWidth - buttonWidth - HOTSPOT_EDGE_GUTTER_PX)
    const maxTopPx = Math.max(HOTSPOT_EDGE_GUTTER_PX, sceneHeight - buttonHeight - HOTSPOT_EDGE_GUTTER_PX)
    const leftPx = clamp(anchorXPx - buttonWidth / 2, HOTSPOT_EDGE_GUTTER_PX, maxLeftPx)
    const topPx = clamp(anchorYPx - buttonHeight / 2, HOTSPOT_EDGE_GUTTER_PX, maxTopPx)

    button.style.left = `${Math.round(leftPx)}px`
    button.style.top = `${Math.round(topPx)}px`
  }
}

export function initTrainSoundsRenderer(): TrainSoundsRenderer {
  const gameScreen = requireElement<HTMLElement>('game-screen')
  const hotspots = requireElement<HTMLElement>('train-hotspots')
  const scene = requireElement<HTMLElement>('train-scene')
  const refs: RendererRefs = {
    gameScreen,
    panel: requireSelector<HTMLElement>(gameScreen, '.train-panel--game'),
    header: requireSelector<HTMLElement>(gameScreen, '.train-header'),
    selectorBar: requireSelector<HTMLElement>(gameScreen, '.train-selector-bar'),
    scene,
    displayFrame: getOrCreateDisplayFrame(scene, hotspots),
    hotspots,
    trainName: requireElement<HTMLElement>('train-name'),
    prevButton: requireElement<HTMLButtonElement>('train-prev-btn'),
    nextButton: requireElement<HTMLButtonElement>('train-next-btn'),
  }

  let hotspotButtons = new Map<TrainHotspotId, HTMLButtonElement>()
  let hotspotLayouts: readonly HotspotLayoutRef[] = []
  let layoutFrame = 0

  const syncLayout = (): void => {
    syncResponsiveSceneLayout(refs)
    layoutHotspots(refs, hotspotLayouts)
  }

  const queueLayoutSync = (): void => {
    if (layoutFrame !== 0) {
      return
    }

    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0
      syncLayout()
    })
  }

  const handleViewportResize = (): void => {
    queueLayoutSync()
  }

  const resizeObserver = new ResizeObserver(() => {
    queueLayoutSync()
  })

  resizeObserver.observe(refs.panel)

  function render(state: TrainSoundsState): void {
    const preset = getTrainPresetDefinition(state.currentPresetId)
    syncSceneMetadata(refs.scene, preset)
    refs.trainName.textContent = preset.name
    refs.prevButton.dataset.currentPresetId = preset.id
    refs.nextButton.dataset.currentPresetId = preset.id
    refs.displayFrame.replaceChildren(createDisplay(preset))
    const hotspotRender = renderHotspots(refs, preset)
    hotspotButtons = hotspotRender.buttonsById
    hotspotLayouts = hotspotRender.layouts
    syncLayout()
  }

  window.addEventListener('resize', handleViewportResize)
  window.visualViewport?.addEventListener('resize', handleViewportResize)

  return {
    scene: refs.scene,
    hotspots: refs.hotspots,
    trainName: refs.trainName,
    prevButton: refs.prevButton,
    nextButton: refs.nextButton,
    render,
    syncLayout,
    dispose(): void {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleViewportResize)
      window.visualViewport?.removeEventListener('resize', handleViewportResize)

      if (layoutFrame !== 0) {
        window.cancelAnimationFrame(layoutFrame)
        layoutFrame = 0
      }

      resetResponsiveSceneLayout(refs)
    },
    getHotspotButton(hotspotId: TrainHotspotId): HTMLButtonElement | null {
      return hotspotButtons.get(hotspotId) ?? null
    },
    getCurrentHotspotButtons(): readonly HTMLButtonElement[] {
      return Array.from(hotspotButtons.values())
    },
  }
}