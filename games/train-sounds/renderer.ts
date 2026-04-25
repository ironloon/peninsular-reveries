import { TRAIN_PRESET_IDS, getTrainPresetDefinition } from './catalog.js'
import type { TrainHotspotDefinition, TrainHotspotId, TrainPresetDefinition, TrainSoundsState, TrainDirection } from './types.js'

interface RendererRefs {
  readonly gameScreen: HTMLElement
  readonly panel: HTMLElement
  readonly header: HTMLElement
  readonly selectorBar: HTMLElement
  readonly allAboardButton: HTMLButtonElement
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
  readonly allAboardButton: HTMLButtonElement
  readonly displayFrame: HTMLElement
  render(state: TrainSoundsState): void
  syncLayout(): void
  dispose(): void
  getHotspotButton(hotspotId: TrainHotspotId): HTMLButtonElement | null
  getCurrentHotspotButtons(): readonly HTMLButtonElement[]
}

const SCENE_PRESET_CLASSES = TRAIN_PRESET_IDS.map((presetId) => `train-scene--${presetId}`)
const HOTSPOT_TOUCH_TARGET_PX = 44
const HOTSPOT_EDGE_GUTTER_PX = 8
const HOTSPOT_MAX_WIDTH_RATIO = 0.34
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

function createCoupler(): HTMLElement {
  return createElement('span', ['train-coupler'])
}

function createCar(preset: TrainPresetDefinition): HTMLElement {
  const car = createElement('div', ['train-car', `train-car--${preset.art.carriage}`])
  car.dataset.carriage = preset.art.carriage
  car.dataset.livery = preset.art.livery
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
  display.appendChild(createCoupler())
  display.appendChild(createCar(preset))
  display.appendChild(createTrack())
  return display
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
  button.setAttribute('aria-label', `${hotspot.label} — ${hotspot.ariaDescription}`)
  button.style.minWidth = `${HOTSPOT_TOUCH_TARGET_PX}px`
  button.style.minHeight = `${HOTSPOT_TOUCH_TARGET_PX}px`
  button.style.maxWidth = `${HOTSPOT_MAX_WIDTH_PX}px`
  const indicator = createElement('span', ['train-hotspot__indicator'])
  indicator.setAttribute('aria-hidden', 'true')
  button.appendChild(indicator)

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
      - refs.allAboardButton.getBoundingClientRect().height
      - panelGapPx * 3,
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

function layoutHotspots(refs: RendererRefs, hotspotLayouts: readonly HotspotLayoutRef[], trainDirection: TrainDirection): void {
  const sceneWidth = refs.scene.clientWidth
  const sceneHeight = refs.scene.clientHeight

  if (sceneWidth <= 0 || sceneHeight <= 0 || hotspotLayouts.length === 0) {
    return
  }

  const display = getDisplayElement(refs.displayFrame)
  if (!display) {
    return
  }

  const sceneRect = refs.scene.getBoundingClientRect()
  const displayRect = display.getBoundingClientRect()
  const displayLeft = displayRect.left - sceneRect.left
  const displayTop = displayRect.top - sceneRect.top
  const displayWidth = displayRect.width
  const displayHeight = displayRect.height

  if (displayWidth <= 0 || displayHeight <= 0) {
    return
  }

  const hotspotMaxWidthPx = Math.round(
    clamp(displayWidth * HOTSPOT_MAX_WIDTH_RATIO, HOTSPOT_TOUCH_TARGET_PX, HOTSPOT_MAX_WIDTH_PX),
  )

  for (const { definition, button } of hotspotLayouts) {
    button.style.maxWidth = `${hotspotMaxWidthPx}px`

    const buttonWidth = button.offsetWidth
    const buttonHeight = button.offsetHeight

    let anchorXPx: number
    if (trainDirection === 'right') {
      // Mirror horizontally: the display is scaleX(-1), so hotspot positions need mirroring
      anchorXPx = displayLeft + displayWidth - displayWidth * ((definition.bounds.x + definition.bounds.width / 2) / 100)
    } else {
      anchorXPx = displayLeft + displayWidth * ((definition.bounds.x + definition.bounds.width / 2) / 100)
    }

    const anchorYPx = displayTop + displayHeight * ((definition.bounds.y + definition.bounds.height / 2) / 100)
    const maxLeftPx = Math.max(HOTSPOT_EDGE_GUTTER_PX, sceneWidth - buttonWidth - HOTSPOT_EDGE_GUTTER_PX)
    const maxTopPx = Math.max(HOTSPOT_EDGE_GUTTER_PX, sceneHeight - buttonHeight - HOTSPOT_EDGE_GUTTER_PX)
    const leftPx = clamp(anchorXPx - buttonWidth / 2, HOTSPOT_EDGE_GUTTER_PX, maxLeftPx)
    const topPx = clamp(anchorYPx - buttonHeight / 2, HOTSPOT_EDGE_GUTTER_PX, maxTopPx)

    button.style.left = `${Math.round(leftPx)}px`
    button.style.top = `${Math.round(topPx)}px`
  }
}

function syncSceneRandomness(scene: HTMLElement, state: TrainSoundsState): void {
  // Rainbow
  scene.classList.toggle('train-scene--rainbow', state.hasRainbow)

  // Cloud offsets
  const clouds = scene.querySelectorAll<HTMLElement>('.train-cloud')
  const offset = state.cloudOffset
  let cloudIndex = 0
  for (const cloud of clouds) {
    const shift = offset + cloudIndex * 3
    cloud.style.left = `${shift}%`
    cloudIndex += 1
  }
}

function syncTrainDirection(display: HTMLElement | null, trainDirection: TrainDirection): void {
  if (!display) return

  if (trainDirection === 'right') {
    display.dataset.direction = 'right'
    display.style.transform = 'scaleX(-1)'
  } else {
    display.dataset.direction = 'left'
    display.style.removeProperty('transform')
    delete display.dataset.direction
  }
}

function syncDepartingState(scene: HTMLElement, state: TrainSoundsState): void {
  scene.classList.toggle('train-departing', state.departing)
  if (state.departing) {
    scene.dataset.sceneState = 'departing'
  } else if (scene.dataset.sceneState === 'departing') {
    scene.dataset.sceneState = 'idle'
  }
}

export function initTrainSoundsRenderer(): TrainSoundsRenderer {
  const gameScreen = requireElement<HTMLElement>('game-screen')
  const hotspots = requireElement<HTMLElement>('train-hotspots')
  const scene = requireElement<HTMLElement>('train-scene')
  const allAboardButton = requireElement<HTMLButtonElement>('all-aboard-btn')
  const refs: RendererRefs = {
    gameScreen,
    panel: requireSelector<HTMLElement>(gameScreen, '.train-panel--game'),
    header: requireSelector<HTMLElement>(gameScreen, '.train-header'),
    selectorBar: requireSelector<HTMLElement>(gameScreen, '.train-selector-bar'),
    allAboardButton,
    scene,
    displayFrame: getOrCreateDisplayFrame(scene, hotspots),
    hotspots,
    trainName: requireElement<HTMLElement>('train-name'),
    prevButton: requireElement<HTMLButtonElement>('train-prev-btn'),
    nextButton: requireElement<HTMLButtonElement>('train-next-btn'),
  }

  let hotspotButtons = new Map<TrainHotspotId, HTMLButtonElement>()
  let hotspotLayouts: readonly HotspotLayoutRef[] = []
  let lastDirection: TrainDirection = 'left'
  let layoutFrame = 0

  const syncLayout = (): void => {
    syncResponsiveSceneLayout(refs)
    layoutHotspots(refs, hotspotLayouts, lastDirection)
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
    syncSceneRandomness(refs.scene, state)
    syncDepartingState(refs.scene, state)
    refs.trainName.textContent = preset.name
    refs.prevButton.dataset.currentPresetId = preset.id
    refs.nextButton.dataset.currentPresetId = preset.id
    refs.displayFrame.replaceChildren(createDisplay(preset))
    syncTrainDirection(getDisplayElement(refs.displayFrame), state.trainDirection)
    lastDirection = state.trainDirection
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
    allAboardButton: refs.allAboardButton,
    displayFrame: refs.displayFrame,
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