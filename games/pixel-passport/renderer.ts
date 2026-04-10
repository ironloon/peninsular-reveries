import { GLOBE_ART, PIP_SPRITES, VEHICLE_SPRITES } from './art.js'
import { DESTINATIONS, getDestination } from './destinations.js'
import type { Destination, DestinationVisualTheme, GamePhase, GameState, PixelArt, PipPose, VehiclePose } from './types.js'

let activeScreenId = 'start-screen'

const DEFAULT_VISUAL_THEME: DestinationVisualTheme = {
  skyTop: '#77c2ff',
  skyBottom: '#dff0ff',
  glow: 'rgba(255, 216, 131, 0.28)',
  accent: '#ffd166',
  horizon: '#74c96a',
}

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

  }
}

function formatCount(count: number, noun: string): string {
  if (count === 1) return `${count} ${noun}`
  if (noun === 'memory') return `${count} memories`
  return `${count} ${noun}s`
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

function applyVisualTheme(target: HTMLElement, theme: DestinationVisualTheme, destinationId: string | null): void {
  target.style.setProperty('--destination-sky-top', theme.skyTop)
  target.style.setProperty('--destination-sky-bottom', theme.skyBottom)
  target.style.setProperty('--destination-glow', theme.glow)
  target.style.setProperty('--destination-accent', theme.accent)
  target.style.setProperty('--destination-horizon', theme.horizon)
  target.dataset.destination = destinationId ?? 'none'
}

function syncDestinationTheme(destination: Destination | null): void {
  const theme = destination?.visualTheme ?? DEFAULT_VISUAL_THEME
  const destinationId = destination?.id ?? null

  applyVisualTheme(element('travel-stage'), theme, destinationId)
  applyVisualTheme(element('explore-screen'), theme, destinationId)
  applyVisualTheme(element('memory-screen'), theme, destinationId)
}

function easeInOutSine(value: number): number {
  return -(Math.cos(Math.PI * value) - 1) / 2
}

function waveOffset(progress: number, amplitude: number, cycles: number): number {
  return Math.sin(progress * Math.PI * cycles) * amplitude
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
    const label = button.querySelector<HTMLElement>('.destination-marker-label')
    const visited = state.collectedMemories.includes(destination.id)
    const current = state.currentLocation === destination.id
    const isSelected = selected.id === destination.id

    button.classList.toggle('is-visited', visited)
    button.classList.toggle('is-current', current)
    button.classList.toggle('is-selected', isSelected)
    button.tabIndex = isSelected ? 0 : -1
    button.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
    button.setAttribute(
      'aria-label',
      current
        ? `${destination.name}, ${destination.country}. You are here. Open this place again.`
        : `${destination.name}, ${destination.country}`,
    )

    if (current) {
      button.setAttribute('aria-current', 'location')
    } else {
      button.removeAttribute('aria-current')
    }

    if (label) {
      label.textContent = current ? `${destination.name} · you are here` : destination.name
    }
  }
}

function renderTitle(state: GameState): void {
  ensureGlobeTrack('title-map-track')
  renderPip('title-pip', 'wave')

  element('title-memory-count').textContent = formatCount(state.collectedMemories.length, 'memory')

  const guideText = state.collectedMemories.length > 0
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
    ? `You are here: ${currentLocation.name}.`
    : 'Pick any place for your first ride.'
  element('globe-selected-copy').textContent = currentLocation?.id === selected.id
    ? `${selected.name}, ${selected.country}. You are here. Pick it again to read it again.`
    : `${selected.name}, ${selected.country}`
  element('globe-memory-pill').textContent = formatCount(state.collectedMemories.length, 'memory')
}

function renderTravel(state: GameState): void {
  const destination = getDestination(state.targetDestination)
  if (!destination || !state.transportType) return

  syncDestinationTheme(destination)

  const originName = getDestination(state.currentLocation)?.name ?? 'Home'
  const vehiclePose: VehiclePose = state.transportType !== 'bus' && state.travelProgress < 0.16
    ? 'bus'
    : state.transportType
  const easedProgress = easeInOutSine(state.travelProgress)
  const vehicleBob = state.transportType === 'plane'
    ? waveOffset(state.travelProgress, -8, 2.4)
    : state.transportType === 'boat'
      ? waveOffset(state.travelProgress, -5, 4.2)
      : state.transportType === 'train'
        ? waveOffset(state.travelProgress, -2.2, 11)
        : waveOffset(state.travelProgress, -3.2, 7)
  const vehicleTilt = state.transportType === 'plane'
    ? waveOffset(state.travelProgress, -3, 2.4)
    : state.transportType === 'boat'
      ? waveOffset(state.travelProgress, 2.2, 4.2)
      : state.transportType === 'train'
        ? waveOffset(state.travelProgress, 0.65, 11)
        : waveOffset(state.travelProgress, 1.1, 7)
  const shadowScale = state.transportType === 'plane'
    ? 0.68
    : state.transportType === 'boat'
      ? 0.84
      : 0.92
  const shadowOpacity = state.transportType === 'plane'
    ? 0.18
    : state.transportType === 'boat'
      ? 0.24
      : 0.32
  const vehicleLeft = 8 + easedProgress * 68

  renderVehicle('travel-vehicle', vehiclePose)
  renderPip('travel-pip', state.travelProgress < 0.5 ? 'wave' : 'guide')

  const travelStage = element<HTMLElement>('travel-stage')
  const travelBackground = element<HTMLElement>('travel-background')
  const travelHalo = element<HTMLElement>('travel-vehicle-halo')
  const travelShadow = element<HTMLElement>('travel-vehicle-shadow')
  const travelVehicle = element<HTMLElement>('travel-vehicle')
  const travelCopy = element<HTMLElement>('travel-copy')
  const haloScale = state.transportType === 'plane'
    ? 1.22
    : state.transportType === 'boat'
      ? 1.14
      : state.transportType === 'train'
        ? 1.1
        : 1.04
  const haloOpacity = state.transportType === 'plane'
    ? 0.96
    : state.transportType === 'boat'
      ? 0.84
      : 0.8

  travelStage.dataset.transport = state.transportType
  travelStage.style.setProperty('--travel-progress', state.travelProgress.toFixed(4))
  travelStage.style.setProperty('--travel-eased-progress', easedProgress.toFixed(4))
  element('travel-from').textContent = originName
  element('travel-to').textContent = destination.name
  element('travel-mode-pill').textContent = `By ${state.transportType}`
  travelBackground.style.transform = `translate3d(${(-5 - easedProgress * 16).toFixed(2)}%, 0, 0)`
  travelHalo.style.left = `${vehicleLeft.toFixed(2)}%`
  travelHalo.style.transform = `translate3d(-50%, ${(vehicleBob * 0.28).toFixed(2)}px, 0) scale(${haloScale.toFixed(2)})`
  travelHalo.style.opacity = haloOpacity.toFixed(2)
  travelVehicle.style.left = `${vehicleLeft.toFixed(2)}%`
  travelVehicle.style.transform = `translate3d(-50%, ${vehicleBob.toFixed(2)}px, 0) rotate(${vehicleTilt.toFixed(2)}deg)`
  travelShadow.style.left = `${vehicleLeft.toFixed(2)}%`
  travelShadow.style.transform = `translate3d(-50%, 0, 0) scale(${shadowScale.toFixed(3)})`
  travelShadow.style.opacity = shadowOpacity.toFixed(2)

  if (vehiclePose === 'bus' && state.transportType !== 'bus') {
    travelCopy.textContent = `The magic bus is changing into a ${state.transportType}!`
  } else if (state.travelProgress < 0.35) {
    travelCopy.textContent = `${originName} is fading behind us.`
  } else if (state.travelProgress < 0.72) {
    travelCopy.textContent = `Pip spots ${destination.name} on the horizon.`
  } else {
    travelCopy.textContent = `Almost there in ${destination.name}.`
  }
}

function renderExplore(state: GameState): void {
  const destination = getDestination(state.targetDestination)
  if (!destination) return

  syncDestinationTheme(destination)

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

  syncDestinationTheme(destination)

  renderPip('memory-pip', 'cheer')
  element('memory-emoji').textContent = destination.memoryEmoji
  element('memory-label').textContent = destination.memoryLabel

  element('memory-copy').textContent = state.memoryWasNew
    ? `Pip says: We found a ${destination.memoryLabel}!`
    : `Pip says: We still remember the ${destination.memoryLabel}.`

  element<HTMLButtonElement>('memory-continue-btn').textContent = 'Back to globe →'
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

export function renderGame(state: GameState): void {
  renderTitle(state)
  renderGlobe(state)
  renderTravel(state)
  renderExplore(state)
  renderMemory(state)
  renderRoom(state)
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

export function focusSelectedMarker(): void {
  const button = document.querySelector<HTMLButtonElement>('#globe-screen .destination-marker.is-selected')
  button?.focus()
}