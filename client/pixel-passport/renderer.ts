import { DESTINATIONS, GLOBE_ART, PIP_SPRITES, VEHICLE_SPRITES, getDestination, pickNextMysteryTarget } from './destinations.js'
import type { Destination, GamePhase, GameState, PixelArt, PipPose, VehiclePose } from './types.js'

let activeScreenId = 'start-screen'

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

function screenIdForPhase(phase: GamePhase): string {
  switch (phase) {
    case 'title': return 'start-screen'
    case 'globe': return 'globe-screen'
    case 'travel': return 'travel-screen'
    case 'explore': return 'explore-screen'
    case 'memory-collect': return 'memory-screen'
    case 'room': return 'room-screen'
    case 'mystery-clue': return 'mystery-screen'
    case 'mystery-result': return 'mystery-result-screen'
  }
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function renderPixelArt(art: PixelArt, container: HTMLElement, cacheKey: string): void {
  if (container.dataset.artKey === cacheKey) return

  container.dataset.artKey = cacheKey
  container.style.setProperty('--pixel-cols', String(art.width))
  container.style.setProperty('--pixel-rows', String(art.height))

  const fragment = document.createDocumentFragment()
  for (const pixel of art.pixels) {
    const cell = document.createElement('span')
    cell.className = 'pixel-cell'
    cell.style.backgroundColor = art.palette[pixel] ?? 'transparent'
    fragment.appendChild(cell)
  }

  container.replaceChildren(fragment)
}

function ensureGlobeTrack(trackId: string): void {
  const track = element<HTMLElement>(trackId)
  if (track.dataset.ready === 'true') return

  const first = document.createElement('div')
  first.className = 'pixel-art globe-map-grid'
  renderPixelArt(GLOBE_ART, first, `${trackId}-0`)

  const second = document.createElement('div')
  second.className = 'pixel-art globe-map-grid'
  renderPixelArt(GLOBE_ART, second, `${trackId}-1`)

  track.append(first, second)
  track.dataset.ready = 'true'
}

function renderPip(containerId: string, pose: PipPose): void {
  renderPixelArt(PIP_SPRITES[pose], element(containerId), `pip-${pose}`)
}

function renderVehicle(containerId: string, pose: VehiclePose): void {
  const container = element(containerId)
  container.dataset.vehicle = pose
  renderPixelArt(VEHICLE_SPRITES[pose], container, `vehicle-${pose}`)
}

function markerId(group: 'globe' | 'mystery', destinationId: string): string {
  return `${group}-marker-${destinationId}`
}

function selectedDestination(state: GameState): Destination {
  return DESTINATIONS[state.globeSelectedIndex] ?? DESTINATIONS[0]
}

function updateMarkerGroup(group: 'globe' | 'mystery', state: GameState): void {
  const selected = selectedDestination(state)

  for (const destination of DESTINATIONS) {
    const button = element<HTMLButtonElement>(markerId(group, destination.id))
    const visited = state.collectedMemories.includes(destination.id)
    const current = state.currentLocation === destination.id
    const isSelected = selected.id === destination.id

    button.classList.toggle('is-visited', visited)
    button.classList.toggle('is-current', current)
    button.classList.toggle('is-selected', isSelected)
    button.tabIndex = isSelected ? 0 : -1
    button.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
  }
}

function renderTitle(state: GameState): void {
  ensureGlobeTrack('title-map-track')
  renderPip('title-pip', 'wave')

  element('title-memory-count').textContent = formatCount(state.collectedMemories.length, 'memory')
  element('title-mystery-count').textContent = formatCount(state.mysteryCompleted.length, 'mystery')

  const guideText = state.mysteryCompleted.length >= DESTINATIONS.length
    ? 'Pip says: We solved them all!'
    : state.collectedMemories.length > 0
      ? 'Pip says: Ready for another trip?'
      : 'Pip says: Let\'s roll!'
  element('title-guide-text').textContent = guideText
}

function renderGlobe(state: GameState): void {
  ensureGlobeTrack('globe-map-track')
  renderPip('globe-pip', 'guide')
  updateMarkerGroup('globe', state)

  const currentLocation = getDestination(state.currentLocation)
  const selected = selectedDestination(state)
  element('globe-location-copy').textContent = currentLocation
    ? `You last visited ${currentLocation.name}.`
    : 'Pick any place for your first ride.'
  element('globe-selected-copy').textContent = `${selected.name}, ${selected.country}`
  element('globe-memory-pill').textContent = formatCount(state.collectedMemories.length, 'memory')
  element('globe-mystery-pill').textContent = formatCount(state.mysteryCompleted.length, 'mystery')
}

function renderTravel(state: GameState): void {
  const destination = getDestination(state.targetDestination)
  if (!destination || !state.transportType) return

  const originName = getDestination(state.currentLocation)?.name ?? 'Home'
  const vehiclePose: VehiclePose = state.transportType !== 'bus' && state.travelProgress < 0.16
    ? 'bus'
    : state.transportType

  renderVehicle('travel-vehicle', vehiclePose)
  renderPip('travel-pip', state.travelProgress < 0.5 ? 'wave' : 'guide')

  const travelStage = element<HTMLElement>('travel-stage')
  const travelBackground = element<HTMLElement>('travel-background')
  const travelVehicle = element<HTMLElement>('travel-vehicle')
  const travelCopy = element<HTMLElement>('travel-copy')

  travelStage.dataset.transport = state.transportType
  element('travel-from').textContent = originName
  element('travel-to').textContent = destination.name
  element('travel-mode-pill').textContent = `By ${state.transportType}`
  travelBackground.style.transform = `translateX(${-state.travelProgress * 28}%)`
  travelVehicle.style.left = `${(6 + state.travelProgress * 74).toFixed(2)}%`

  if (vehiclePose === 'bus' && state.transportType !== 'bus') {
    travelCopy.textContent = `The magic bus is changing into a ${state.transportType}!`
  } else {
    travelCopy.textContent = `Zooming toward ${destination.name}.`
  }
}

function renderExplore(state: GameState): void {
  const destination = getDestination(state.targetDestination)
  if (!destination) return

  renderPixelArt(destination.scene, element('explore-scene'), `scene-${destination.id}`)
  renderPip('explore-pip', 'guide')
  element('explore-heading').textContent = `${destination.name}, ${destination.country}`
  element('explore-progress').textContent = `${state.factIndex + 1} / ${destination.facts.length} facts`
  element('explore-guide-text').textContent = destination.facts[state.factIndex] ?? destination.facts[0]
  element<HTMLButtonElement>('explore-next-btn').textContent = state.factIndex >= destination.facts.length - 1
    ? 'Find memory →'
    : 'Next fact →'
}

function renderMemory(state: GameState): void {
  const destination = getDestination(state.targetDestination)
  if (!destination) return

  renderPip('memory-pip', 'cheer')
  element('memory-emoji').textContent = destination.memoryEmoji
  element('memory-label').textContent = destination.memoryLabel

  element('memory-copy').textContent = state.memoryWasNew
    ? `Pip says: We found a ${destination.memoryLabel}!`
    : `Pip says: We still remember the ${destination.memoryLabel}.`

  const nextMystery = pickNextMysteryTarget(state.mysteryCompleted)
  element<HTMLButtonElement>('memory-continue-btn').textContent = state.mode === 'mystery' && nextMystery
    ? 'Next mystery →'
    : 'Back to globe →'
}

function renderRoom(state: GameState): void {
  renderPip('room-pip', state.collectedMemories.length > 0 ? 'cheer' : 'think')
  element('room-count').textContent = formatCount(state.collectedMemories.length, 'memory')
  element('room-copy').textContent = state.collectedMemories.length > 0
    ? 'Pip says: Every trip leaves a little keepsake.'
    : 'Pip says: Your shelf is ready for memories.'

  for (const destination of DESTINATIONS) {
    const slot = document.querySelector<HTMLElement>(`[data-memory-slot="${destination.id}"]`)
    if (!slot) continue

    const filled = state.collectedMemories.includes(destination.id)
    slot.classList.toggle('is-filled', filled)
    const emoji = slot.querySelector<HTMLElement>('.memory-slot-emoji')
    if (emoji) {
      emoji.textContent = filled ? destination.memoryEmoji : '☆'
    }
  }
}

function renderMysteryClue(state: GameState): void {
  const destination = getDestination(state.mysteryTarget)
  if (!destination) return

  ensureGlobeTrack('mystery-map-track')
  updateMarkerGroup('mystery', state)
  renderPip('mystery-pip', 'think')

  element('mystery-attempt-pill').textContent = `Clue ${state.mysteryClueIndex + 1} of 3`
  element('mystery-clue-text').textContent = destination.clues[state.mysteryClueIndex] ?? destination.clues[0]
  element('mystery-selected-copy').textContent = `Maybe it is ${selectedDestination(state).name}?`
}

function renderMysteryResult(state: GameState): void {
  const destination = getDestination(state.mysteryTarget)
  if (!destination) return

  renderPip('mystery-result-pip', state.lastGuessCorrect || state.revealedDestination ? 'cheer' : 'think')

  const heading = element('mystery-result-heading')
  const copy = element('mystery-result-copy')
  const button = element<HTMLButtonElement>('mystery-result-btn')

  if (state.lastGuessCorrect) {
    heading.textContent = 'You got it!'
    copy.textContent = `Yes! The clue was ${destination.name}. Let's ride there.`
    button.textContent = 'Ride there →'
    return
  }

  if (state.revealedDestination) {
    heading.textContent = 'There it is!'
    copy.textContent = `This clue was ${destination.name}. Let's visit it together.`
    button.textContent = 'Ride there →'
    return
  }

  heading.textContent = 'Not yet!'
  copy.textContent = 'Pip found another clue.'
  button.textContent = 'Next clue →'
}

export function renderGame(state: GameState): void {
  renderTitle(state)
  renderGlobe(state)
  renderTravel(state)
  renderExplore(state)
  renderMemory(state)
  renderRoom(state)
  renderMysteryClue(state)
  renderMysteryResult(state)
}

export function showScreen(screenId: string): void {
  if (screenId === activeScreenId) return

  const current = document.getElementById(activeScreenId)
  const next = document.getElementById(screenId)
  if (!next) return

  current?.classList.remove('active')
  current?.classList.add('leaving')
  next.classList.remove('leaving')
  next.classList.add('active')

  const staleScreen = current
  window.setTimeout(() => staleScreen?.classList.remove('leaving'), 520)
  activeScreenId = screenId
}

export function syncScreenForState(state: GameState): void {
  showScreen(screenIdForPhase(state.phase))
}

export function focusSelectedMarker(phase: 'globe' | 'mystery-clue'): void {
  const group = phase === 'globe' ? 'globe' : 'mystery'
  const button = document.querySelector<HTMLButtonElement>(`#${group}-screen .destination-marker.is-selected`)
  button?.focus()
}