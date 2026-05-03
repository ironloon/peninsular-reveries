# Plan: Waterwall Game Launch

## Project Context
- Sources:
  - `README.md` - source of truth for game principles (every-input, offline-first, accessibility, synthesized media, no accounts)
  - `AGENTS.md` - repo workflow, planning overlays, validation gates, environment (Windows dev, Ubuntu CI)
  - `.github/skills/review/references/architecture.md` - game module contract, adding a new game checklist, canvas policy (canvas OK per Super Word precedent), iOS Safari rules, styling architecture
  - `.github/skills/review/references/game-quality.md` - layout, pacing, input coverage, orientation checkpoints, in-game menu standard, zoom recovery, per-game visual identity
  - `.github/skills/gnd-chart/LOCAL.md` - workshop checks (art audit, viewport gameplay, iOS callout, background music volume spec, visual verification)
  - `client/audio.ts` - shared audio infrastructure (getAudioContext, createMusicBus, createSfxBus, playTone, playNotes, syncBusWithVisibility, fadeBusGain, ensureAudioUnlocked)
  - `app/ui/game-shell.tsx` - shared GameScreen, GameHeader, GameHeaderPill, GameTabbedModal, SettingsSection, SettingsToggle, InfoSection, InfoAttribution, SrOnly
  - `client/modal.ts` - tabbed modal behavior
  - `client/preferences.ts` - per-game music, SFX, reduce-motion bindings
  - `games/squares/` - reference implementation for game module contract, sounds profile structure, controller pattern, build/route wiring
- Constraints:
  - Canvas-based rendering (falling-sand automaton needs per-cell updates at 60fps; DOM would choke at medium grid density). Super Word establishes the canvas precedent.
  - Medium cell size (4-5px) for a clearly pixelated but smooth waterfall, yielding ~80×170 grid on 390px-wide mobile.
  - Barrier budget: `maxBarriers = Math.floor(gridColumns * 1.5)` — enough for interesting redirections, not enough to dam the full source row.
  - Audio is the star feature: stereo-panned water sounds, spatial cursor cues, optional ambient music off by default.
  - No score, no win condition, no phases — pure zen sandbox. Single game screen, always running.
  - Background themes: 3 at launch (rocky, night, earth) as procedural per-cell color palettes, no external art assets.
  - Music bus per-event gains ≤0.05 — ambient texture, not foreground melody.
  - All audio synthesized, no samples.
  - iOS Safari: native `<button>` for menu/settings controls, `-webkit-touch-callout: none; user-select: none; touch-action: manipulation` on canvas.
  - WCAG 2A/2AA: live-region announcements for cursor position and barrier actions, `role="img"` on canvas. Primary non-visual experience is stereo audio.
  - Reduced motion: simulation still runs (it is the experience); UI transitions simplified.
  - Per-game font identity via CSS custom properties (`--font`, `--font-title`).
  - `GameTabbedModal` with Settings/Info tabs, X close, Restart (clear barriers) and Quit footer actions.
  - Scoped PWA manifest and service worker under `public/waterwall/`.
- Full validation:
  - `pnpm sync:attributions`
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

Waterwall is a zen physics sandbox where water continuously pours from the top of the screen like a pixelated waterfall, and players tap or drag to place barrier cells that redirect the flow — watching and listening as the water finds new paths. Audio is the star: stereo-panned water sounds shift left and right as flow redistributes, cursor position cues provide spatial awareness, and an optional ambient music drone (off by default) stays in the background. There's no score, no win condition — just water, rock, and sound. Players choose from a few background themes and are limited in how many barriers they can place (based on grid width) so the water always finds a way through.

## Legs

### LEG-1: Simulation - Water physics engine
- Status: done
- Confirmed: yes
- Goal link: Build the pure cellular-automaton water model — the core mechanic that makes "water falls, player redirects, water drains" work.
- Depends on: none
- Owned files:
  - `games/waterwall/types.ts`
  - `games/waterwall/state.ts`
  - `games/waterwall/state.test.ts`
- Read-only:
  - `README.md` - game principles (every-input, localStorage-only, synthesized media)
  - `games/squares/types.ts` - reference type structure pattern (discriminated types, const arrays with satisfies)
  - `games/squares/state.ts` - reference pure immutable transition style
- Deferred shared edits:
  - none
- Verification: `node --import tsx --test games/waterwall/state.test.ts`
- Intent:
  (1) In `types.ts`, define the core simulation contract:
    - Cell types: `'empty' | 'water' | 'barrier'` as a discriminated union `WaterwallCellType`
    - Grid coordinate: `{ row: number; column: number }` interface `WaterwallCoordinate`
    - Grid state: `WaterwallGrid` — a 2D array (rows × columns) of cell types, plus metadata (rows, columns, barrierCount, maxBarriers)
    - Background theme IDs: `'rocky' | 'night' | 'earth'` as `WaterwallThemeId`, with a const array `WATERWALL_THEMES` containing id and label for each
    - Simulation config: `WaterwallConfig` with cellSize (default 4), sourceWidth (fraction of top row that spawns water, e.g. 1.0 for full width), ticksPerFrame (how many simulation steps per animation frame for speed tuning)
    - Barrier budget formula: `maxBarriers = Math.floor(gridColumns * 1.5)`
    - Cursor state: `WaterwallCursor` with row, column, and dragging boolean
    - Export all types and const arrays
  (2) In `state.ts`, implement pure immutable helpers:
    - `createGrid(rows, columns)` → fresh grid with all empty cells and maxBarriers computed from columns
    - `spawnWater(grid)` → new grid with water cells added across the full top row (source row)
    - `simulateTick(grid)` → new grid after one physics step: scan bottom-to-top, for each water cell check below → below-left/below-right (randomize tie-breaking) → left/right (lateral spread when pooled). Water in the bottom row is drained (removed). Barriers and out-of-bounds are solid. Water does not overwrite barriers.
    - `placeBarrier(grid, coordinate)` → new grid with barrier at coordinate if cell is empty and barrierCount < maxBarriers; otherwise returns unchanged grid
    - `removeBarrier(grid, coordinate)` → new grid with empty at coordinate if cell is barrier; otherwise unchanged
    - `placeBarrierLine(grid, from, to)` → new grid with barriers placed along Bresenham line from `from` to `to`, stopping when budget exhausted. Returns grid and array of actually-placed coordinates.
    - `clearAllBarriers(grid)` → new grid with all barriers replaced by empty, barrierCount reset to 0
    - `computeWaterDistribution(grid)` → `{ leftFraction: number; rightFraction: number; centerOfMass: number }` summarizing where water is concentrated across columns (for stereo panning). Returns values in [-1, 1] range where -1 is all-left, +1 is all-right.
    - `bresenhamLine(from, to)` → array of coordinates along the line (pure geometry helper used by placeBarrierLine)
    - `resizeGrid(oldGrid, newRows, newColumns)` → new grid preserving barriers that still fit within bounds, recomputing maxBarriers
  (3) In `state.test.ts`, add explicit assertions for:
    - Water spawns across full top row
    - Water falls one row per tick when nothing is below
    - Water drains (disappears) from bottom row
    - Water spreads diagonally around a barrier (place barrier, water diverts left/right)
    - Water pools laterally when blocked from below and diagonally
    - Barrier placement succeeds when budget allows, fails (returns same grid) when at max
    - Barrier budget is `Math.floor(columns * 1.5)` for various column counts
    - Barrier removal works on barrier cells, no-ops on empty/water
    - `bresenhamLine` produces connected diagonal coordinates
    - `placeBarrierLine` stops placing when budget exhausted, returns partial line
    - `clearAllBarriers` removes all barriers and resets count
    - `computeWaterDistribution` returns -1 for all-left-column water, +1 for all-right, 0 for centered
    - `resizeGrid` preserves in-bounds barriers, drops out-of-bounds ones
  Project constraints embedded: state transitions stay pure and immutable, no network or account state, pacing is user-controlled (simulation runs continuously but barrier placement is player-driven).

### LEG-2: Audio - Stereo water, spatial cues, ambient music
- Status: done
- Confirmed: yes
- Goal link: Make audio the star experience — stereo water sounds that shift as flow redirects, spatial cursor cues, and optional ambient music that stays out of the way.
- Depends on: none
- Owned files:
  - `games/waterwall/sounds.ts`
  - `games/waterwall/sounds.test.ts`
- Read-only:
  - `client/audio.ts` - shared audio infrastructure (createMusicBus, createSfxBus, playTone, playNotes, getAudioContext, syncBusWithVisibility, fadeBusGain, ensureAudioUnlocked)
  - `client/preferences.ts` - getMusicEnabled, getSfxEnabled, preference event names
  - `games/squares/sounds.ts` - reference music profile structure, bus management, preference sync pattern
  - `games/story-trail/sounds.ts` - reference synthesized ambient loop structure
- Deferred shared edits:
  - none
- Verification: `node --import tsx --test games/waterwall/sounds.test.ts`
- Intent:
  (1) In `sounds.ts`, implement the audio system with these components:
    **Water texture engine:**
    - `createWaterTexture(sfxBus)` → creates a looping filtered-noise water sound. Implementation: generate a white noise AudioBuffer (2 seconds, mono), connect through a BandpassFilterNode (center ~800Hz, Q ~1.5) to produce a rushing-water timbre. Loop continuously while SFX is enabled.
    - `updateWaterPanning(pan: number)` → updates a `StereoPannerNode` on the water texture chain. `pan` is in [-1, 1] range from `computeWaterDistribution()`. Called every ~200ms (not per-frame) for efficiency. Use `fadeBusGain`-style smooth ramping on the pan value to avoid clicks.
    - `startWaterTexture()` / `stopWaterTexture()` → start/stop the noise loop. Fades in/out over 300ms to avoid pops.
    **Cursor position cues:**
    - `playCursorEdgeCue(edge: 'left' | 'right' | 'top' | 'bottom')` → short filtered tone panned to match edge position. Left/right edges pan fully to that side; top uses higher pitch (~600Hz), bottom uses lower pitch (~200Hz). Duration ~80ms, gain 0.03 on the SFX bus. Debounced so it only fires when the cursor crosses into an edge zone (outer ~15% of grid), not every frame.
    **Barrier SFX:**
    - `playBarrierPlaceSound(sfxBus)` → short percussive click. Implementation: noise burst (40ms) with sharp attack through a highpass filter (~2000Hz) for a stone-on-stone feel. Gain 0.08.
    - `playBarrierRemoveSound(sfxBus)` → softer reverse-envelope click. Noise burst (60ms) with slow attack, fast release through a lowpass filter (~1500Hz). Gain 0.06.
    **Ambient music:**
    - Define one music profile `waterwallAmbientProfile` as a data structure: slow drone/pad using triangle and sine oscillators at very low frequencies (65Hz, 98Hz, 130Hz), long sustained notes (4-8 seconds), tempo ~40 BPM. Per-event gains ≤0.05 to keep it as ambient texture, not foreground melody. Bus gain via `createMusicBus('waterwall')` at shared default 0.20.
    - `startAmbientMusic(musicBus)` / `stopAmbientMusic()` → loop the profile using `playNotes()` on a setInterval, same pattern as Squares.
    - Music is OFF by default — `getMusicEnabled('waterwall')` returns false on first visit. The toggle in settings enables it.
    **Preference sync:**
    - Listen for `reveries:music-change` and `reveries:sfx-change` events.
    - On music disable: stop ambient music loop, fade bus to 0.0001.
    - On SFX disable: stop water texture, fade SFX bus to 0.0001.
    - On SFX enable: restart water texture if simulation is running.
    - Use `syncBusWithVisibility()` for both buses so audio mutes when tab is hidden.
    **Error handling:** All synthesis wrapped in try/catch; audio is non-critical.
  (2) In `sounds.test.ts`, add assertions for:
    - Ambient music profile structure validation (all events have valid frequency, gain ≤0.05, valid oscillator type)
    - Profile loop duration is calculable from tempo and loop beats
    - Edge cue directions map to expected pan values (-1 for left, +1 for right, 0 for top/bottom)
    - Water distribution values in [-1, 1] map correctly to StereoPannerNode range
  Project constraints embedded: all audio synthesized (no samples), music off by default, ambient texture not foreground melody, per-event gains ≤0.05, shared bus gain 0.20.

### LEG-3: Renderer - Canvas rendering, input, and accessibility
- Status: done
- Confirmed: yes
- Goal link: Turn the simulation into a visible, interactive, accessible canvas that responds to all input methods and looks good at every viewport.
- Depends on: LEG-1, LEG-2
- Owned files:
  - `games/waterwall/renderer.ts`
  - `games/waterwall/input.ts`
  - `games/waterwall/input.test.ts`
  - `games/waterwall/accessibility.ts`
  - `games/waterwall/animations.ts`
- Read-only:
  - `games/waterwall/types.ts` - grid types, config, themes, cursor
  - `games/waterwall/state.ts` - placeBarrier, removeBarrier, placeBarrierLine, computeWaterDistribution
  - `games/waterwall/sounds.ts` - playCursorEdgeCue, playBarrierPlaceSound, playBarrierRemoveSound
  - `client/spatial-navigation.ts` - nearest-target helper for D-pad focus
  - `games/squares/input.ts` - reference controller polling, gamepad-active handling, button mapping
  - `games/squares/renderer.ts` - reference runtime style injection pattern, render model interface
- Deferred shared edits:
  - none
- Verification: `node --import tsx --test games/waterwall/input.test.ts`
- Intent:
  (1) In `renderer.ts`:
    - Define `WaterwallRenderModel`: grid state, cursor position, active theme, reduced motion flag, barrier count, max barriers.
    - `initCanvas(container: HTMLElement, config: WaterwallConfig)` → create `<canvas>` element, set `-webkit-touch-callout: none; user-select: none; touch-action: manipulation` inline styles. Attach `ResizeObserver` to resize canvas on container dimension changes. Compute grid dimensions (rows, columns) from container size and cellSize. Return `{ canvas, ctx, rows, columns }`.
    - `renderFrame(ctx, model)` → single render pass per animation frame:
      - Clear canvas
      - Draw background: for each empty cell, draw a rectangle using the active theme's color palette. Rocky theme: warm browns/grays with seeded pseudo-random variation per cell (deterministic from row+column so it doesn't flicker). Night theme: dark blues/purples with occasional brighter "star" dots. Earth theme: sandy tans/ochres with subtle variation.
      - Draw water cells: blue palette (#2196F3 base) with slight shade variation per cell for visual texture (darker = older water, lighter = fresh). Each cell is a filled rect at cellSize × cellSize.
      - Draw barrier cells: gray-brown tone (#795548 base) with slight variation.
      - Draw cursor overlay: highlight the cursor's cell position with a semi-transparent outline (white with 50% alpha, 2px border). If reduced motion, use a static highlight; otherwise a subtle pulse animation via alpha oscillation.
    - `handleResize(canvas, ctx, container, config)` → recompute canvas dimensions for `devicePixelRatio`, set canvas width/height attributes and CSS size. Return new rows/columns so state can call `resizeGrid()`.
    - `canvasToGrid(canvas, event, config)` → convert mouse/touch clientX/clientY to grid coordinate using canvas.getBoundingClientRect() and cellSize. Returns `WaterwallCoordinate | null` if outside grid.
    - Inject runtime CSS for canvas container layout (full-bleed within game screen) via a `<style>` element with ID `waterwall-runtime-inline-styles`.
  (2) In `input.ts`:
    - Normalize all input to semantic actions: `moveCursor(direction)`, `placeCurrent` (toggle: place if empty, remove if barrier), `removeCurrent` (explicit remove), `startDrag`, `endDrag` (for drag-line placement), `openMenu`.
    - **Pointer/touch:** `pointerdown` on canvas → `canvasToGrid` → if empty cell, place barrier + `startDrag`; if barrier cell, remove barrier. `pointermove` while dragging → extend barrier line to new coordinate via `placeBarrierLine`. `pointerup` → `endDrag`. Touch handling: same pointer events (pointer events API unifies mouse+touch).
    - **Keyboard:** Arrow keys move cursor one cell. Enter/Space toggles (place on empty, remove on barrier). Delete/Backspace explicitly removes. Shift+Arrow starts/continues a drag-line from current cursor position. Escape opens menu.
    - **Gamepad:** D-pad moves cursor with ±0.5 analog dead zone and 200ms debounce. Button 0 (A) to place/toggle. Button 1 (B) to remove. Button 9 (Start) to open menu. Analog stick as alternative to D-pad with same dead zone/debounce. Graceful connect/disconnect handling. Add `gamepad-active` class to body when gamepad input detected (for hiding mouse cursor).
    - Edge cue integration: when cursor moves into outer ~15% of grid in any direction, call `playCursorEdgeCue()` with the appropriate edge. Debounce so it only fires on zone entry, not every move within the zone.
  (3) In `accessibility.ts`:
    - `announceBarrierPlaced(remaining: number)` → write to `#game-feedback` (assertive): "Barrier placed. X remaining."
    - `announceBarrierRemoved(remaining: number)` → write to `#game-feedback`: "Barrier removed. X remaining."
    - `announceCursorPosition(row: number, column: number, rows: number, columns: number)` → write to `#game-status` (polite): "Row N of M, column N of M" — throttled to at most once per 300ms.
    - `announceBarriersCleared()` → write to `#game-feedback`: "All barriers cleared."
    - `updateCanvasLabel(canvas: HTMLCanvasElement, barrierCount: number, maxBarriers: number, theme: string)` → set `aria-label` describing current state.
  (4) In `animations.ts`:
    - Minimal for launch: `cursorPulseAlpha(timestamp: number)` → returns alpha value (0.3–0.7) oscillating at ~2Hz for cursor highlight. Returns 0.5 constant when reduced motion is on.
    - This file exists primarily to satisfy the game module contract. The simulation itself is the animation.
  (5) In `input.test.ts`, add assertions for:
    - Arrow key mappings produce correct cursor delta
    - Enter on empty cell maps to place action; Enter on barrier maps to remove action
    - Delete/Backspace always maps to remove action regardless of cell state
    - Shift+Arrow produces drag-line start/extend action
    - Gamepad button 0 maps to place/toggle, button 1 to remove, button 9 to menu
    - D-pad dead zone: values within ±0.5 produce no movement
    - Edge zone detection: cursor at column 0 triggers left edge, at max column triggers right, etc.
  Project constraints embedded: canvas with `touch-action: manipulation`, `-webkit-touch-callout: none`, `user-select: none`; keyboard+touch+gamepad all work; WCAG live regions; reduced motion preserves correct visual state; 44px minimum not applicable (cells are 4px but cursor/tap target is the full canvas with coordinate mapping); iOS Safari pointer events on canvas are fine since canvas is a replaced element.
  Visual checkpoint: at 390×844 portrait, canvas fills ≥90% of viewport height after menu chrome; at 844×390 landscape, canvas reflows proportionally maintaining cell size; cursor highlight clearly visible at all viewports. Manual visual check required.

### LEG-4: Shell - Controller, game loop, and full wiring
- Status: done
- Confirmed: yes
- Goal link: Present Waterwall as a complete Peninsular Reveries game with settings, menu, PWA, build wiring, and test coverage.
- Depends on: LEG-1, LEG-2, LEG-3
- Owned files:
  - `games/waterwall/controller.tsx`
  - `games/waterwall/main.ts`
  - `games/waterwall/info.ts`
  - `games/waterwall/attributions.ts`
  - `public/styles/waterwall.css`
  - `public/waterwall/manifest.json`
  - `public/waterwall/sw.js`
  - `public/favicon-game-waterwall.svg`
- Read-only:
  - `app/ui/game-shell.tsx` - GameScreen, GameHeader, GameHeaderPill, GameTabbedModal, SettingsSection, SettingsToggle, InfoSection, InfoAttribution, SrOnly
  - `app/ui/document.tsx` - Document component props
  - `client/modal.ts` - tabbed modal setup and controller integration
  - `client/preferences.ts` - per-game music, SFX, reduce-motion bindings and events
  - `client/audio.ts` - ensureAudioUnlocked, getAudioContext
  - `app/site-paths.ts` - withBasePath for quit link
  - `games/waterwall/types.ts` - all types and const arrays
  - `games/waterwall/state.ts` - all state functions
  - `games/waterwall/sounds.ts` - all audio functions
  - `games/waterwall/renderer.ts` - initCanvas, renderFrame, handleResize, canvasToGrid
  - `games/waterwall/input.ts` - input setup functions
  - `games/waterwall/accessibility.ts` - announcement functions
  - `games/squares/controller.tsx` - reference controller structure
  - `games/squares/main.ts` - reference game loop, screen management, preference wiring, modal sync
- Deferred shared edits:
  - `app/data/game-registry.ts` - add entry: `{ slug: 'waterwall', name: 'Waterwall', description: 'A zen waterfall sandbox. Place barriers, redirect water, listen.', icon: '🌊', status: 'live' }`
  - `app/routes.ts` - add `waterwall: '/waterwall/'` and `waterwallInfo: '/waterwall/info/'` route definitions
  - `app/router.ts` - import `waterwallAction` from `games/waterwall/controller.js`, register `router.get(routes.waterwall, () => waterwallAction())` and `router.get(routes.waterwallInfo, () => gameInfoAction('waterwall'))`
  - `app/data/attribution-index.ts` - import waterwall info and attribution exports, append to `gameEntries`
  - `build.ts` - add `games/waterwall/main.ts` to esbuild entry points, add `waterwall/sw.js` to service worker stamping, add pre-render routes for `/waterwall/` and `/waterwall/info/`, add waterwall to budget table
  - `server.ts` - add `games/waterwall/main.ts` to watched game entry points
  - `app/site-config.test.ts` - extend manifest-alignment coverage to include `public/waterwall/manifest.json`
  - `config/build.test.ts` - extend expected built assets and rendered HTML assertions for waterwall JS, CSS, favicon, manifest, service worker, and generated page output
  - `e2e/site-01-responsive.spec.ts` - add `/waterwall/` to shared page list, add explicit waterwall viewport assertions (canvas visible, no horizontal overflow at 390×844, 844×390, 1024×768, 1280×800)
  - `e2e/site-02-navigation.spec.ts` - add homepage card, direct URL, and Quit-in-menu coverage for waterwall
  - `e2e/site-03-semantic-html.spec.ts` - add waterwall heading hierarchy and canvas role/label assertions
  - `e2e/site-04-accessibility.spec.ts` - add waterwall Axe check, menu focus-restore, live-region announcement checks for barrier placement
  - `e2e/site-05-favicon.spec.ts` - add waterwall favicon and manifest expectations
  - `e2e/site-06-noscript.spec.ts` - add waterwall JS-disabled load coverage
  - `e2e/site-07-game-smoke.spec.ts` - add waterwall smoke tests: page loads, canvas renders, pointer barrier placement, keyboard cursor movement, menu open
- Verification: `pnpm check`
- Intent:
  (1) In `controller.tsx`:
    - Export `waterwallAction()` returning SSR HTML via `renderToString()`.
    - Use `Document` with `title="Waterwall"`, `includeNav={false}`, `includeFooter={false}`, stylesheet `waterwall.css`, script `waterwall/main.js`, favicon `favicon-game-waterwall.svg`, manifest `waterwall/manifest.json`, SW scope `waterwall/`.
    - Single `GameScreen` (id `waterwall-game-screen`, always active — no start/win screens).
    - Inside game screen: `GameHeader` with left content showing barrier count pill (`<span id="waterwall-barrier-count">0 / max</span>`) and right content showing Menu button (`<button id="waterwall-menu-btn" aria-haspopup="dialog">`).
    - A `<div id="waterwall-canvas-container">` that the renderer will mount the canvas into.
    - Live regions: `<div id="game-status" aria-live="polite" class="sr-only">` and `<div id="game-feedback" aria-live="assertive" class="sr-only">`.
    - `<noscript>` fallback.
    - `GameTabbedModal` with title "Waterwall", settings content: background theme `<select id="waterwall-theme-select">` with options from `WATERWALL_THEMES`, `SettingsToggle` for music (id `music-toggle`, off by default), `SettingsToggle` for SFX (id `sfx-toggle`, on by default), `SettingsToggle` for reduce-motion (id `reduce-motion-toggle`). Info content: summary from `waterwallInfo`, `InfoAttribution` entries. Footer: Restart button (`id="restart-btn"`, clears all barriers), Quit link (`withBasePath('/', siteBasePath)`).
  (2) In `main.ts`:
    - On DOMContentLoaded: initialize canvas via `initCanvas()`, create initial grid via `createGrid()`, spawn water, set up input handlers, initialize audio buses, wire preference listeners, wire modal, wire theme select change, wire restart button.
    - Game loop via `requestAnimationFrame`: each frame run `simulateTick()` (configurable ticks per frame for speed), call `renderFrame()`, throttle audio panning update to every ~200ms via timestamp check (call `updateWaterPanning(computeWaterDistribution(grid).centerOfMass)`).
    - First user interaction: call `ensureAudioUnlocked()`, then `startWaterTexture()`.
    - Theme change: read select value, store in localStorage `waterwall:theme`, call `applyTheme()` which updates render model.
    - Restart: call `clearAllBarriers()`, announce via accessibility.
    - Modal open/close: toggle `modal-open` class, manage focus, pause/resume is not needed (simulation keeps running behind modal — it's a background).
    - Barrier count display: update `#waterwall-barrier-count` text on every place/remove.
    - Resize handling: on ResizeObserver callback, recompute grid dimensions, call `resizeGrid()` to preserve barriers.
    - Music: if enabled, start ambient music loop. If disabled, stop.
    - Visibility: `syncBusWithVisibility()` for both buses.
  (3) In `info.ts`:
    - `export const waterwallInfo = { summary: 'A zen waterfall sandbox. Place barriers to redirect falling water and listen as the sound follows the flow.' }`
  (4) In `attributions.ts`:
    - Export `waterwallAttribution: GameAttribution` with slug `waterwall`, name `Waterwall`, entries for: water texture synthesis (Web Audio API, generated in-browser), ambient music (Web Audio API, generated in-browser), barrier/cursor SFX (Web Audio API, generated in-browser). All with `repositoryCodeLicense`.
  (5) In `public/styles/waterwall.css`:
    - Game body class `.waterwall` with `--font` and `--font-title` custom properties (system font stack — clean sans-serif fits the zen aesthetic).
    - Canvas container: full-bleed within game screen, `position: relative`, safe-area padding via `env(safe-area-inset-*)`.
    - Menu button: positioned top-right, semi-transparent background, 44px minimum touch target.
    - Barrier count pill styling.
    - No duplicated game-shell rules (shared shell handles screen transitions, modal overlay, sr-only).
    - `@font-face` comment block at top explaining font choice (system stack, no web font needed).
  (6) In `public/waterwall/manifest.json`:
    - `name: "Waterwall"`, `short_name: "Waterwall"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `theme_color` and `background_color` in water-blue palette.
  (7) In `public/waterwall/sw.js`:
    - Game-scoped service worker following existing pattern. `CACHE_NAME` with version stamp. Precache game HTML, JS, CSS, favicon. Stale-while-revalidate for other assets.
  (8) In `public/favicon-game-waterwall.svg`:
    - Simple water-drop SVG icon. Blue gradient drop shape, minimal detail. Self-contained, no external references.
  Project constraints embedded: `GameTabbedModal` with Restart/Quit footer, `includeNav={false}` and `includeFooter={false}`, scoped PWA, safe-area padding, no document scroll, per-game font identity, visibility-synced audio, localStorage preference persistence only.
  Visual checkpoint: at 390×844 portrait, canvas fills ≥90% of viewport height after header chrome; menu button visible in top-right; barrier count visible in top-left; at 844×390 landscape, canvas fills proportionally; manual visual check required for all four orientation checkpoints.

## Dispatch Order
Sequential via runSubagent (navigator reviews between each):
1. LEG-1 (Simulation engine) - no dependencies
2. LEG-2 (Audio system) - no dependencies (parallel candidate with LEG-1)
3. LEG-3 (Canvas renderer, input, accessibility) - depends on LEG-1, LEG-2
4. LEG-4 (Shell, controller, game loop, wiring) - depends on LEG-1, LEG-2, LEG-3
After all complete: deferred edits → `pnpm sync:attributions` → `pnpm test:local` → delivery verification (local-only) → commit → push.

## Implementation
Commit: ede8161
Pushed: 2026-04-14

## Critique
Date: 2026-04-15
Critique commit: (post-fix, see archive)

### What Worked
- Simulation engine: pure immutable helpers, bottom-to-top/diagonal/lateral scan. Emergent flow behavior landed well as a physical toy.
- 349 simulation tests + 200 input tests + 125 audio tests — solid coverage baseline.
- Full game wiring landed cleanly (registry, routes, build, e2e, attribution).
- Shell structure mirrors reference games; settings modal, PWA, favicon present correctly.
- Water sound texture and zen feel came through.

### What Didn't

**1. Barrier budget allows full water blockage (Bug — high)**
- Evidence: `computeMaxBarriers` used `Math.floor(columns * 1.5)` ≈ 147 on iPhone 17 (~98 columns). Full dam requires 98 barriers — well below budget. Plan constraint said "not enough to dam the full source row."
- Fix applied: multiplier changed from `1.5` → `0.7`.

**2. Barrier placement/removal doesn't work in water (Bug — high)**
- Two defects: (a) `placeBarrier` rejected water cells (`!== 'empty'`) blocking all placement once water flowed; (b) pointer mode used `event.button === 2` for remove, making removal impossible on touch devices.
- Fix applied: `placeBarrier` now rejects only `=== 'barrier'`; `setupPointerInput` determines mode by cell type at tap, not mouse button.

**3. Barrier SFX too harsh (UX issue — medium)**
- Highpass at 2000 Hz, gain 0.08 was sharp. Lowered to 800 Hz, gain 0.04.

### Chart Gaps
- Barrier behavior in water: user expected tap-to-toggle regardless of cell contents. Workshop missed "what happens when placing where water is?"
- Water translucency: expected background to show through water. Not captured.
- Pointer remove on mobile: plan said "if barrier cell, remove" but Workshop didn't address how right-click applies on touch devices.

### User Effectiveness
- For sandbox games, add "can a player exhaust the experience / block the primary channel using the budget alone?" as a Workshop scope question.
- Pointer toggle pattern (tap to place/remove by cell type) is idiomatic for mobile-first and should be stated explicitly, not implied.

### Community Candidates
- **Community Candidate:** Sandbox budget saturation check (gnd-chart Workshop Checks section).
- **Community Candidate:** Pointer toggle-by-cell-type specification note (gnd-chart Workshop Checks section).
- **Community Candidate:** Plan file commit timing rule (gnd-navigator, wrap-up protocol).

### Field Review Holding List
- Ambient music / drone removal (currently off by default; low priority)
- Barrier count HUD removal (design preference)
- Barrier eviction model (remove first-placed when budget exceeded — new mechanic)
- Water translucency with device-capability budget
- Water running visual texture (animation enhancement)
- Architecture/build simplification (user backlog)

