import type { ItemState, SpotOnState, SurfaceState } from './types.js'
import { countPlaced, getRoomDefinition } from './state.js'

// ── Renderer refs ────────────────────────────────────────────────────────────

interface RendererRefs {
  readonly scene: HTMLElement
  readonly statusBar: HTMLElement
  readonly newRoomBtn: HTMLButtonElement
  readonly completionMsg: HTMLElement
}

export interface SpotOnRenderer {
  readonly scene: HTMLElement
  readonly statusBar: HTMLElement
  readonly newRoomBtn: HTMLButtonElement
  readonly completionMsg: HTMLElement
  render(state: SpotOnState): void
  syncLayout(): void
  dispose(): void
}

function byId<T extends HTMLElement>(id: string): T | null {
  const el = document.getElementById(id)
  return el instanceof HTMLElement ? (el as T) : null
}

function requireElement<T extends HTMLElement>(id: string): T {
  const el = byId<T>(id)
  if (!el) {
    throw new Error(`Spot On renderer could not find #${id}.`)
  }
  return el
}

function createItemButton(item: ItemState, carried: boolean): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'room-item'
  button.dataset.itemId = item.id
  button.setAttribute('aria-label', `${item.name}${carried ? ' (carrying)' : ''}`)
  button.textContent = item.emoji

  button.style.left = `${item.floorX}%`
  button.style.top = `${item.floorY}%`

  if (carried) {
    button.classList.add('room-item--carried')
  }

  return button
}

function createSurfaceElement(
  surface: SurfaceState,
  carrying: boolean,
  items: readonly ItemState[],
): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'room-surface'
  container.dataset.surfaceId = surface.id
  container.setAttribute('aria-label', surface.label)

  container.style.left = `${surface.x}%`
  container.style.top = `${surface.y}%`
  container.style.width = `${surface.width}%`
  container.style.height = `${surface.height}%`

  // Label
  const label = document.createElement('div')
  label.className = 'room-surface__label'
  label.textContent = surface.emoji
  label.setAttribute('aria-hidden', 'true')
  container.appendChild(label)

  // Grid
  const grid = document.createElement('div')
  grid.className = 'room-surface__grid'
  grid.style.setProperty('--cols', String(surface.cols))
  grid.style.setProperty('--rows', String(surface.rows))

  for (let i = 0; i < surface.cells.length; i++) {
    const cellState = surface.cells[i]
    const cellEl = createCellElement(surface, i, cellState.itemId, items, carrying)
    grid.appendChild(cellEl)
  }

  container.appendChild(grid)
  return container
}

function createCellElement(
  surface: SurfaceState,
  cellIndex: number,
  itemId: string | null,
  items: readonly ItemState[],
  carrying: boolean,
): HTMLDivElement {
  const cell = document.createElement('div')
  cell.className = 'room-cell'
  cell.dataset.surfaceId = surface.id
  cell.dataset.cellIndex = String(cellIndex)
  cell.setAttribute('role', 'button')
  cell.setAttribute('tabindex', '0')

  const row = surface.cells[cellIndex].row
  const col = surface.cells[cellIndex].col

  if (itemId !== null) {
    cell.classList.add('room-cell--occupied')
    cell.dataset.itemId = itemId
    const item = items.find((i) => i.id === itemId)
    cell.setAttribute('aria-label', item
      ? `${surface.label}, row ${row + 1}, col ${col + 1} — ${item.name}`
      : `${surface.label}, row ${row + 1}, col ${col + 1} — occupied`,
    )
    cell.textContent = item ? item.emoji : ''
  } else {
    cell.setAttribute('aria-label', `${surface.label}, row ${row + 1}, col ${col + 1} — empty`)
    if (carrying) {
      cell.classList.add('room-cell--highlight')
    }
  }

  return cell
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initSpotOnRenderer(): SpotOnRenderer {
  const scene = requireElement<HTMLElement>('room-scene')
  const statusBar = requireElement<HTMLElement>('room-status')
  const newRoomBtn = requireElement<HTMLButtonElement>('new-room-btn')
  const completionMsg = requireElement<HTMLElement>('completion-msg')

  const refs: RendererRefs = {
    scene,
    statusBar,
    newRoomBtn,
    completionMsg,
  }

  let layoutFrame = 0

  const queueLayoutSync = (): void => {
    if (layoutFrame !== 0) return
    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = 0
      syncLayout()
    })
  }

  const resizeObserver = new ResizeObserver(() => {
    queueLayoutSync()
  })

  resizeObserver.observe(refs.scene)

  function syncLayout(): void {
    // Responsive layout pass — items and surfaces are positioned via percentages
    // so they automatically rescale. No dynamic layout adjustments needed.
  }

  function render(state: SpotOnState): void {
    const room = getRoomDefinition(state.currentRoomId)
    const carrying = state.carriedItemId !== null

    // Set dynamic CSS custom properties for room theming
    refs.scene.style.setProperty('--spot-on-room-wall', room.wallColor)
    refs.scene.style.setProperty('--spot-on-room-floor', room.floorColor)

    // Set data attribute for debugging (not used for CSS rules)
    refs.scene.dataset.roomTheme = room.theme

    // Toggle carrying class on scene
    if (carrying) {
      refs.scene.classList.add('room-scene--carrying')
    } else {
      refs.scene.classList.remove('room-scene--carrying')
    }

    // Toggle complete class on scene
    if (state.phase === 'complete') {
      refs.scene.classList.add('room-scene--complete')
    } else {
      refs.scene.classList.remove('room-scene--complete')
    }

    // Clear scene children
    refs.scene.replaceChildren()

    // Render surfaces first (lower z-index)
    const surfaceFrag = document.createDocumentFragment()
    for (const surface of state.surfaces) {
      const el = createSurfaceElement(surface, carrying, state.items)
      surfaceFrag.appendChild(el)
    }
    refs.scene.appendChild(surfaceFrag)

    // Render floor items and carried item (higher z-index)
    const itemFrag = document.createDocumentFragment()
    for (const item of state.items) {
      // Skip items that are placed on a surface (shown inside cells)
      if (item.surfaceId !== null) continue
      const carried = state.carriedItemId === item.id
      const button = createItemButton(item, carried)
      itemFrag.appendChild(button)
    }
    refs.scene.appendChild(itemFrag)

    // Completion message overlay
    if (state.phase === 'complete') {
      refs.completionMsg.classList.remove('completion-msg--hidden')
      refs.completionMsg.classList.add('completion-msg--visible')
    } else {
      refs.completionMsg.classList.remove('completion-msg--visible')
      refs.completionMsg.classList.add('completion-msg--hidden')
    }

    // Update status bar
    const placed = countPlaced(state.items)
    const total = state.items.length
    refs.statusBar.textContent = `Items placed: ${placed} / ${total}`
  }

  const handleViewportResize = (): void => {
    queueLayoutSync()
  }

  window.addEventListener('resize', handleViewportResize)

  return {
    scene: refs.scene,
    statusBar: refs.statusBar,
    newRoomBtn: refs.newRoomBtn,
    completionMsg: refs.completionMsg,
    render,
    syncLayout,
    dispose(): void {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleViewportResize)

      if (layoutFrame !== 0) {
        window.cancelAnimationFrame(layoutFrame)
        layoutFrame = 0
      }
    },
  }
}