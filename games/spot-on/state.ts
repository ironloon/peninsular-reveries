import type { ItemId, ItemState, ItemTemplate, RoomDefinition, RoomSeed, RoomTheme, SurfaceTemplate, SurfaceState, CellState, SpotOnState } from './types.js'

// ── Seeded PRNG (mulberry32) ────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededRandInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Shuffle an array using Fisher-Yates with the given rng, then pick first n */
function shuffleAndPick<T>(rng: () => number, arr: readonly T[], count: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j] as T
    copy[j] = tmp as T
  }
  return copy.slice(0, Math.min(count, copy.length))
}

// ── Room themes ─────────────────────────────────────────────────────────────

export const ROOM_THEMES: readonly RoomTheme[] = [
  {
    id: 'bedroom',
    name: 'Bedroom',
    wallColor: '#c5d5e4',
    floorColor: '#d4a76a',
    surfacePool: [
      { id: 'bookshelf', label: 'bookshelf', emoji: '📚', type: 'storage', rows: 1, cols: 3, x: 0, y: 0, width: 28, height: 10 },
      { id: 'bed', label: 'bed', emoji: '🛏️', type: 'furniture', rows: 2, cols: 2, x: 0, y: 0, width: 22, height: 18 },
      { id: 'nightstand', label: 'nightstand', emoji: '🗄️', type: 'furniture', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'hanger', label: 'hanger', emoji: '👔', type: 'fixture', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'toy-box', label: 'toy box', emoji: '🧺', type: 'storage', rows: 1, cols: 2, x: 0, y: 0, width: 20, height: 10 },
      { id: 'dresser', label: 'dresser', emoji: '🗄️', type: 'storage', rows: 1, cols: 2, x: 0, y: 0, width: 18, height: 12 },
    ],
    itemPool: [
      { id: 'teddy-bear', name: 'teddy bear', emoji: '🧸' },
      { id: 'shirt', name: 'shirt', emoji: '👕' },
      { id: 'book', name: 'book', emoji: '📖' },
      { id: 'pillow', name: 'pillow', emoji: '💤' },
      { id: 'alarm-clock', name: 'alarm clock', emoji: '🔔' },
      { id: 'hat', name: 'hat', emoji: '🎩' },
      { id: 'slipper', name: 'slipper', emoji: '🩴' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    wallColor: '#f5f0e0',
    floorColor: '#e8dcc8',
    surfacePool: [
      { id: 'hook', label: 'hook', emoji: '🪝', type: 'fixture', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'rack', label: 'rack', emoji: '🍳', type: 'furniture', rows: 1, cols: 2, x: 0, y: 0, width: 20, height: 10 },
      { id: 'shelf', label: 'shelf', emoji: '🗄️', type: 'storage', rows: 1, cols: 3, x: 0, y: 0, width: 28, height: 10 },
      { id: 'counter', label: 'counter', emoji: '📐', type: 'surface', rows: 1, cols: 3, x: 0, y: 0, width: 30, height: 10 },
      { id: 'bowl', label: 'bowl', emoji: '🥣', type: 'container', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'spice-rack', label: 'spice rack', emoji: '🧂', type: 'storage', rows: 1, cols: 2, x: 0, y: 0, width: 18, height: 10 },
    ],
    itemPool: [
      { id: 'mug', name: 'mug', emoji: '☕' },
      { id: 'pan', name: 'pan', emoji: '🍳' },
      { id: 'herb-jar', name: 'herb jar', emoji: '🌿' },
      { id: 'apple', name: 'apple', emoji: '🍎' },
      { id: 'bottle', name: 'bottle', emoji: '🧴' },
      { id: 'spoon', name: 'spoon', emoji: '🥄' },
      { id: 'salt', name: 'salt', emoji: '🧂' },
    ],
  },
  {
    id: 'study',
    name: 'Study',
    wallColor: '#a8c5a0',
    floorColor: '#8b7355',
    surfacePool: [
      { id: 'desk', label: 'desk', emoji: '📝', type: 'furniture', rows: 1, cols: 3, x: 0, y: 0, width: 32, height: 10 },
      { id: 'study-shelf', label: 'shelf', emoji: '📚', type: 'storage', rows: 1, cols: 3, x: 0, y: 0, width: 28, height: 10 },
      { id: 'coaster', label: 'coaster', emoji: '⬜', type: 'decor', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'tray', label: 'tray', emoji: '📬', type: 'container', rows: 1, cols: 2, x: 0, y: 0, width: 20, height: 10 },
      { id: 'windowsill', label: 'windowsill', emoji: '🪟', type: 'ledge', rows: 1, cols: 3, x: 0, y: 0, width: 30, height: 10 },
      { id: 'filing-cabinet', label: 'filing cabinet', emoji: '🗄️', type: 'storage', rows: 1, cols: 2, x: 0, y: 0, width: 16, height: 12 },
    ],
    itemPool: [
      { id: 'pen', name: 'pen', emoji: '🖊️' },
      { id: 'study-book', name: 'book', emoji: '📖' },
      { id: 'study-mug', name: 'mug', emoji: '☕' },
      { id: 'letter', name: 'letter', emoji: '✉️' },
      { id: 'plant', name: 'plant', emoji: '🌱' },
      { id: 'stamp', name: 'stamp', emoji: '🪪' },
      { id: 'ruler', name: 'ruler', emoji: '📏' },
    ],
  },
  {
    id: 'playroom',
    name: 'Playroom',
    wallColor: '#c8b8e0',
    floorColor: '#e0a0c0',
    surfacePool: [
      { id: 'toy-shelf', label: 'toy shelf', emoji: '📚', type: 'storage', rows: 1, cols: 3, x: 0, y: 0, width: 28, height: 10 },
      { id: 'art-table', label: 'art table', emoji: '🎨', type: 'furniture', rows: 1, cols: 2, x: 0, y: 0, width: 22, height: 12 },
      { id: 'craft-bin', label: 'craft bin', emoji: '🧺', type: 'container', rows: 1, cols: 2, x: 0, y: 0, width: 18, height: 10 },
      { id: 'puzzle-mat', label: 'puzzle mat', emoji: '🧩', type: 'play', rows: 2, cols: 2, x: 0, y: 0, width: 20, height: 18 },
      { id: 'chalk-ledge', label: 'chalk ledge', emoji: '🪟', type: 'ledge', rows: 1, cols: 2, x: 0, y: 0, width: 20, height: 10 },
      { id: 'costume-hook', label: 'costume hook', emoji: '🪝', type: 'fixture', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'block-box', label: 'block box', emoji: '🧱', type: 'storage', rows: 1, cols: 2, x: 0, y: 0, width: 18, height: 10 },
    ],
    itemPool: [
      { id: 'crayon', name: 'crayon', emoji: '🖍️' },
      { id: 'ball', name: 'ball', emoji: '⚽' },
      { id: 'puppet', name: 'puppet', emoji: '🧸' },
      { id: 'block', name: 'block', emoji: '🧱' },
      { id: 'car', name: 'car', emoji: '🚗' },
      { id: 'sticker', name: 'sticker', emoji: '⭐' },
      { id: 'puzzle', name: 'puzzle', emoji: '🧩' },
      { id: 'robot', name: 'robot', emoji: '🤖' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    wallColor: '#a0d4d4',
    floorColor: '#e8e4e0',
    surfacePool: [
      { id: 'towel-rack', label: 'towel rack', emoji: '🪝', type: 'fixture', rows: 1, cols: 2, x: 0, y: 0, width: 18, height: 10 },
      { id: 'sink-ledge', label: 'sink ledge', emoji: '🪟', type: 'ledge', rows: 1, cols: 2, x: 0, y: 0, width: 20, height: 10 },
      { id: 'bath-caddy', label: 'bath caddy', emoji: '📚', type: 'storage', rows: 1, cols: 2, x: 0, y: 0, width: 18, height: 10 },
      { id: 'bath-shelf', label: 'shelf', emoji: '🗄️', type: 'storage', rows: 1, cols: 3, x: 0, y: 0, width: 28, height: 10 },
      { id: 'basket', label: 'basket', emoji: '🧺', type: 'container', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'tile-shelf', label: 'tile shelf', emoji: '⬜', type: 'decor', rows: 1, cols: 1, x: 0, y: 0, width: 12, height: 12 },
      { id: 'vanity', label: 'vanity', emoji: '🗄️', type: 'furniture', rows: 1, cols: 2, x: 0, y: 0, width: 20, height: 12 },
    ],
    itemPool: [
      { id: 'soap', name: 'soap', emoji: '🧼' },
      { id: 'brush', name: 'brush', emoji: '🪥' },
      { id: 'towel', name: 'towel', emoji: '🛁' },
      { id: 'shampoo', name: 'shampoo', emoji: '🧴' },
      { id: 'sponge', name: 'sponge', emoji: '🧽' },
      { id: 'mirror', name: 'mirror', emoji: '🪞' },
      { id: 'rubber-duck', name: 'rubber duck', emoji: '🦆' },
    ],
  },
]

// ── Generated room cache ────────────────────────────────────────────────────

const generatedRooms = new Map<string, RoomDefinition>()

// ── Surface positioning ─────────────────────────────────────────────────────

interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

function rectsOverlap(a: Rect, b: Rect, gap: number): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  )
}

/** Minimum spacing between surfaces in percentage points (≥8px at 390px) */
const SURFACE_GAP = 4

/** Minimum surface dimensions in percent */
const MIN_SURFACE_WIDTH = 12
const MIN_SURFACE_HEIGHT = 10

function positionSurfaces(rng: () => number, templates: SurfaceTemplate[]): SurfaceTemplate[] {
  const placed: Rect[] = []
  const result: SurfaceTemplate[] = []

  for (const tpl of templates) {
    // Enforce minimum dimensions
    const w = Math.max(tpl.width, MIN_SURFACE_WIDTH)
    const h = Math.max(tpl.height, MIN_SURFACE_HEIGHT)

    // Ensure surface fits within scene with padding
    const maxX = 96 - w
    const maxY = 60 - h

    let x = 0
    let y = 0
    let attempts = 0

    do {
      x = seededRandInt(rng, 4, Math.max(4, maxX))
      y = seededRandInt(rng, 4, Math.max(4, maxY))
      attempts++
    } while (attempts < 80 && placed.some((p) => rectsOverlap({ x, y, w, h }, p, SURFACE_GAP)))

    placed.push({ x, y, w, h })
    result.push({ ...tpl, x, y, width: w, height: h })
  }

  return result
}

// ── Scatter positions ─────────────────────────────────────────────────────────

/** Generate randomized floor scatter positions for items using a seeded RNG */
function generateScatterPositionsWithRng(
  rng: () => number,
  count: number,
): readonly { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const MIN_GAP_X = 14
  for (let i = 0; i < count; i++) {
    let x: number
    let attempts = 0
    do {
      x = seededRandInt(rng, 8, 82)
      attempts++
    } while (attempts < 20 && positions.some((p) => Math.abs(p.x - x) < MIN_GAP_X))
    const y = seededRandInt(rng, 72, 86)
    positions.push({ x, y })
  }
  return positions
}

function scatterItemsWithRng(
  rng: () => number,
  templates: readonly ItemTemplate[],
): readonly ItemState[] {
  const positions = generateScatterPositionsWithRng(rng, templates.length)
  return templates.map((tpl, i) => ({
    id: tpl.id,
    name: tpl.name,
    emoji: tpl.emoji,
    placed: false,
    surfaceId: null,
    cellIndex: null,
    floorX: positions[i].x,
    floorY: positions[i].y,
  }))
}

// ── Room generation ─────────────────────────────────────────────────────────

let lastGeneratedThemeId: string | null = null

/**
 * Generate a room procedurally.
 * If `themeIndex` is specified, that theme is used; otherwise a random theme
 * different from the last generated room is chosen.
 * If `seed` is specified, the room is reproducible.
 */
export function generateRoom(
  themeIndex?: number,
  seed?: number,
): { definition: RoomDefinition; seed: number } {
  const roomSeed: RoomSeed = seed ?? Math.floor(Math.random() * 0x100000000)
  const rng = mulberry32(roomSeed)

  // Pick theme: use specified index, or random (but different from last)
  let tIdx: number
  if (themeIndex !== undefined) {
    tIdx = ((themeIndex % ROOM_THEMES.length) + ROOM_THEMES.length) % ROOM_THEMES.length
  } else {
    tIdx = seededRandInt(rng, 0, ROOM_THEMES.length - 1)
    let attempts = 0
    while (ROOM_THEMES[tIdx].id === lastGeneratedThemeId && ROOM_THEMES.length > 1 && attempts < 10) {
      tIdx = seededRandInt(rng, 0, ROOM_THEMES.length - 1)
      attempts++
    }
  }

  const theme = ROOM_THEMES[tIdx]
  lastGeneratedThemeId = theme.id

  // Select 4–6 surfaces from pool
  const surfaceCount = seededRandInt(rng, 4, 6)
  const selectedSurfaceTemplates = shuffleAndPick(rng, theme.surfacePool, surfaceCount)

  // Position surfaces with overlap avoidance
  const positionedSurfaces = positionSurfaces(rng, selectedSurfaceTemplates)

  // Select 4–6 items from pool
  const itemCount = seededRandInt(rng, 4, 6)
  const selectedItems = shuffleAndPick(rng, theme.itemPool, itemCount)

  // Generate a unique room ID
  const roomId = `${theme.id}-${roomSeed.toString(16).padStart(8, '0')}`

  const definition: RoomDefinition = {
    id: roomId,
    name: theme.name,
    theme: theme.id,
    wallColor: theme.wallColor,
    floorColor: theme.floorColor,
    items: selectedItems,
    surfaces: positionedSurfaces,
  }

  generatedRooms.set(roomId, definition)

  return { definition, seed: roomSeed }
}

// ── Surface & item init ─────────────────────────────────────────────────────

function initSurfaces(templates: readonly SurfaceTemplate[]): readonly SurfaceState[] {
  return templates.map((tpl) => {
    const cells: CellState[] = []
    for (let row = 0; row < tpl.rows; row++) {
      for (let col = 0; col < tpl.cols; col++) {
        cells.push({ row, col, itemId: null })
      }
    }
    return {
      id: tpl.id,
      label: tpl.label,
      emoji: tpl.emoji,
      type: tpl.type,
      x: tpl.x,
      y: tpl.y,
      width: tpl.width,
      height: tpl.height,
      rows: tpl.rows,
      cols: tpl.cols,
      cells,
    }
  })
}

// ── State helpers ────────────────────────────────────────────────────────────

export function getRoomDefinition(roomId: string): RoomDefinition {
  return generatedRooms.get(roomId) ?? generatedRooms.values().next().value!
}

function countPlaced(items: readonly ItemState[]): number {
  return items.filter((item) => item.surfaceId !== null).length
}

function allItemsPlaced(items: readonly ItemState[]): boolean {
  return items.every((item) => item.surfaceId !== null)
}

// ── Public API ───────────────────────────────────────────────────────────────

export function createInitialState(): SpotOnState {
  const { definition, seed } = generateRoom()
  const rng = mulberry32(seed + 1) // separate stream for scatter positions
  return {
    currentRoomId: definition.id,
    phase: 'idle',
    carriedItemId: null,
    items: scatterItemsWithRng(rng, definition.items),
    surfaces: initSurfaces(definition.surfaces),
    roomSeed: seed,
  }
}

export function pickUpItem(state: SpotOnState, itemId: ItemId): SpotOnState {
  if (state.phase !== 'idle') return state
  const item = state.items.find((i) => i.id === itemId)
  if (!item) return state

  // If the item is on a surface, clear its cell
  let nextSurfaces = state.surfaces
  if (item.surfaceId !== null && item.cellIndex !== null) {
    nextSurfaces = state.surfaces.map((surface) => {
      if (surface.id === item.surfaceId) {
        const nextCells = surface.cells.map((cell, idx) =>
          idx === item.cellIndex ? { ...cell, itemId: null } : cell,
        )
        return { ...surface, cells: nextCells }
      }
      return surface
    })
  }

  const nextItems = state.items.map((i) =>
    i.id === itemId
      ? { ...i, placed: false, surfaceId: null, cellIndex: null }
      : i,
  )

  return {
    ...state,
    phase: 'carrying',
    carriedItemId: itemId,
    items: nextItems,
    surfaces: nextSurfaces,
  }
}

export function placeItem(state: SpotOnState, surfaceId: string, cellIndex: number): SpotOnState {
  if (state.phase !== 'carrying' || state.carriedItemId === null) return state

  const surface = state.surfaces.find((s) => s.id === surfaceId)
  if (!surface) return state

  // Validate cellIndex bounds
  if (cellIndex < 0 || cellIndex >= surface.cells.length) return state

  // Don't allow placing on an occupied cell
  if (surface.cells[cellIndex].itemId !== null) return state

  const carriedItem = state.items.find((i) => i.id === state.carriedItemId)
  if (!carriedItem) return state

  const nextItems = state.items.map((item) =>
    item.id === carriedItem.id
      ? { ...item, placed: true, surfaceId, cellIndex }
      : item,
  )

  const nextSurfaces = state.surfaces.map((s) => {
    if (s.id !== surfaceId) return s
    const nextCells = s.cells.map((cell, idx) =>
      idx === cellIndex ? { ...cell, itemId: carriedItem.id } : cell,
    )
    return { ...s, cells: nextCells }
  })

  const nextPhase = allItemsPlaced(nextItems) ? 'complete' : 'idle'

  return {
    ...state,
    phase: nextPhase,
    carriedItemId: null,
    items: nextItems,
    surfaces: nextSurfaces,
  }
}

export function dropItem(state: SpotOnState): SpotOnState {
  if (state.phase !== 'carrying' || state.carriedItemId === null) return state

  // Clear surfaceId/cellIndex on the carried item (return to floor)
  const nextItems = state.items.map((item) =>
    item.id === state.carriedItemId
      ? { ...item, placed: false, surfaceId: null, cellIndex: null }
      : item,
  )

  return {
    ...state,
    phase: 'idle',
    carriedItemId: null,
    items: nextItems,
  }
}

export function selectNextRoom(state: SpotOnState): SpotOnState {
  // Find current theme to avoid repeating
  const currentRoom = generatedRooms.get(state.currentRoomId)
  const currentThemeId = currentRoom?.theme ?? ''

  // Pick a different theme index
  let themeIndex: number
  let attempts = 0
  do {
    themeIndex = Math.floor(Math.random() * ROOM_THEMES.length)
    attempts++
  } while (ROOM_THEMES[themeIndex].id === currentThemeId && ROOM_THEMES.length > 1 && attempts < 20)

  const { definition, seed } = generateRoom(themeIndex)
  const rng = mulberry32(seed + 1)

  return {
    currentRoomId: definition.id,
    phase: 'idle',
    carriedItemId: null,
    items: scatterItemsWithRng(rng, definition.items),
    surfaces: initSurfaces(definition.surfaces),
    roomSeed: seed,
  }
}

export { countPlaced }