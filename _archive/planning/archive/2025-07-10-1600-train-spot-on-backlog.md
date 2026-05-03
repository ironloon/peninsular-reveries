# Plan: Train Sounds & Spot On Backlog

## Project Context
- Sources:
  - `games/train-sounds/` — all modules (renderer, catalog, sounds, sample-manifest, types, state, animations, input, main, accessibility, controller.tsx)
  - `games/spot-on/` — all modules (renderer, state, sounds, sample-manifest, types, input, main, accessibility, animations, controller.tsx, attributions, info)
  - `public/styles/train-sounds.css` — train scene layout, hotspot styles, rainbow, track
  - `public/styles/spot-on.css` — room scene layout, item/spot styles
  - `.pi/skills/creative-assets/scripts/fetch-game-audio.ts` — audio download/processing CLI
  - `.pi/skills/creative-assets/references/audio-source-notes.md` — CC0 sourcing, audibility gate
  - `.pi/skills/gnd-chart/LOCAL.md` — ≤8 files/leg, ≤8 sub-tasks/intent, LEG-N ID format
  - `.pi/skills/gnd-critique/LOCAL.md` — LOCAL.md effectiveness review checkpoint
  - `.planning/archive/2026-04-24-1200-drum-pad-train-polish-spot-on.md` — prior plan and critique (source of these backlog items)
- Constraints:
  - CC0 or public-domain only for audio/visual assets
  - Per-sample `gain ≥ 1.0` for normal-loudness sources through SFX bus (0.12 gain, compressor at −18 dB); aim 2.6–3.2 for one-shots
  - ≤4 interactive hotspots visible at 390×844 without overlap; targets ≥44px; horizontal padding ≥8px between adjacent targets (train-sounds density cap)
  - Spot On playfield must fill ≥50% of remaining viewport height at 390×844 portrait after all chrome elements
  - Pointer mode determined by current carried-item state on touch — right-click is not a valid removal path on touch devices
  - All animations gated by `isReducedMotionEnabled()` / `data-reduce-motion` attribute
  - Emoji art is placeholder — sourcing deferred; note explicitly in leg intent
  - Attribution entries for every CC0 asset; `pnpm sync:attributions` after audio legs
  - `-webkit-touch-callout: none; user-select: none` on any element with sustained-touch or long-press behavior (iOS Safari rule)
  - Shared scene perspective for Spot On: side-view
  - ≤8 owned files per leg, ≤8 numbered sub-tasks per intent (LOCAL.md)
- Full validation:
  - `pnpm build`
  - `pnpm test`
  - `pnpm sync:attributions`
- Delivery verification:
  - local-only (dev server verification)

## User Intent
Address all backlog items for Train Sounds and Spot On in one plan. For Train Sounds: simplify to one car per train, add persistent visible indicators on hotspot buttons for touch users, fix the rainbow to look like a real arc and extend the track full-width, and verify audio audibility with an actual loudness probe. For Spot On: fix the dramatically narrowed room scene on phone portrait and missing CSS class rules, redesign the placement mechanic from fixed 1:1 spots to grid-based surfaces where items can go in any cell, replace the fixed 3-room cycle with procedural room generation for replay variety, and add a distinct drop sound while sourcing all missing audio files.

## Legs

### LEG-1: Train Sounds — One car per train
- Status: done
- Confirmed: yes
- Goal link: Backlog says "multiple cars crowd the scene; one car gives larger hotspot targets and more space." Simplifying to 1 car frees scene space and enables LEG-2's visible indicators.
- Depends on: none
- Owned files:
  - `games/train-sounds/catalog.ts`
  - `games/train-sounds/renderer.ts`
  - `games/train-sounds/types.ts`
  - `public/styles/train-sounds.css`
  - `games/train-sounds/state.test.ts`
- Read-only:
  - `games/train-sounds/sounds.ts` — sound routes reference removed hotspot IDs, but no changes needed here (those IDs are already absent from catalog hotspots)
  - `games/train-sounds/main.ts` — verify no references to removed hotspot IDs in event handlers
- Deferred shared edits: none
- Verification: `grep "carCount" games/train-sounds/catalog.ts` shows `carCount: 1` for all 4 presets; `grep "train-car--second\|train-coupler--two" public/styles/train-sounds.css` returns 0 matches; `pnpm test` passes; `pnpm build` succeeds
- Intent:
  1. In `catalog.ts`, set `carCount: 1` on STEAM_PRESET, DIESEL_PRESET, ELECTRIC_PRESET, and HIGH_SPEED_PRESET. No other catalog fields change — hotspot data stays the same.
  2. In `types.ts`, remove dead hotspot IDs from the `TrainHotspotId` union that are absent from catalog but still in the type: `steam-coupler`, `diesel-wheels`, `electric-wheels`, `high-speed-wheels`. These were partially cleaned in a prior leg but linger in the union type. Keep all IDs that are present in the current catalog hotspots.
  3. In `renderer.ts`, rewrite `createDisplay()`: remove the `for` loop over `carIndex`. Render exactly one coupler (`createCoupler(0)`) and one car (`createCar(preset, 0)`) after the locomotive, then the track. Remove the `carIndex` parameter from `createCoupler()` and `createCar()` — simplify signatures to `createCoupler()` and `createCar(preset)` since there is only one. Remove `train-car--first`/`train-car--second` and `train-coupler--one`/`train-coupler--two` class logic from both functions. Use the base class names `train-car` and `train-coupler` plus the carriage-token class `train-car--${preset.art.carriage}`.
  4. In `train-sounds.css`, remove `.train-car--second`, `.train-coupler--two` rules. Rename `.train-car--first` to just `.train-car` and widen its positioning: change from `left: 45%` to approximately `left: 42%` and `width: 24%` to `width: 34%` so the single car fills the space vacated by the second car. Adjust `.train-coupler` (was `.train-coupler--one`) width from `4.3%` to approximately `3.5%` and position from `left: 40.5%` to `left: 40%`. Remove `.train-scene--diesel .train-car--first::before` selector (no longer has `--first` modifier).
  5. In `state.test.ts`, verify no test assertion references the removed hotspot IDs (`steam-coupler`, `diesel-wheels`, `electric-wheels`, `high-speed-wheels`). The existing tests use `steam-whistle`, `steam-bell`, `high-speed-brake`, and `diesel-horn` — all still valid. If any removed ID appears, update the test to use a valid hotspot.

### LEG-2: Train Sounds — Visible hotspot indicators on touch
- Status: done
- Confirmed: yes
- Goal link: Backlog says "no hover state on mobile, need persistent visible indicator." Hotspot buttons are currently fully invisible (`background: transparent; color: transparent; border: transparent`) — the primary usability blocker on phone.
- Depends on: LEG-1
- Owned files:
  - `games/train-sounds/renderer.ts`
  - `public/styles/train-sounds.css`
- Read-only:
  - `games/train-sounds/catalog.ts` — hotspot bounds reference for sizing
- Deferred shared edits: none
- Verification: On a 390×844 viewport, all 4 hotspot buttons per train show a visible indicator without hover; `grep "train-hotspot::after" public/styles/train-sounds.css` has at least 1 match; `pnpm build` succeeds
- Intent:
  1. In `renderer.ts`, in `createHotspotButton()`: remove `overflow: hidden` from the inline `button.style.overflow` assignment. This prevents clipping of a `::after` pseudo-element indicator. Also change the `button.style.border` from `2px solid transparent` (set in CSS) to nothing — let CSS own the border entirely.
  2. In `renderer.ts`, add a small inner `<span>` element inside each hotspot button for the visible indicator: `const indicator = createElement('span', ['train-hotspot__indicator']); indicator.setAttribute('aria-hidden', 'true'); button.appendChild(indicator);`. This is more reliable across browsers than a `::after` pseudo-element on `<button>`, which has inconsistent support in some mobile browsers.
  3. In `train-sounds.css`, add the indicator styles: `.train-hotspot__indicator { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, 0.45); border: 1px solid rgba(12, 79, 130, 0.3); pointer-events: none; transition: background 160ms ease, border-color 160ms ease, transform 160ms ease; }`. The indicator is always visible — a small white circle with a subtle border, centered in the 44px touch target.
  4. In `train-sounds.css`, update `.train-hotspot` hover state to brighten the indicator: `.train-hotspot:hover .train-hotspot__indicator { background: rgba(255, 255, 255, 0.8); border-color: rgba(12, 79, 130, 0.5); transform: translate(-50%, -50%) scale(1.3); }`. Update active/pressed: `.train-hotspot:active .train-hotspot__indicator, .train-hotspot.is-pressed .train-hotspot__indicator { background: rgba(255, 255, 255, 0.6); transform: translate(-50%, -50%) scale(0.85); }`. Keep existing outline on `:focus-visible`.
  5. In `train-sounds.css`, add `-webkit-touch-callout: none; user-select: none;` to `.train-hotspot` to prevent iOS Safari's native copy callout from appearing on touch interactions (per project constraint from game-quality.md). `touch-action: manipulation` is already set on the parent selector group.
  6. In `train-sounds.css`, add reduced-motion override: `@media (prefers-reduced-motion: reduce), (data-reduce-motion: reduce) { .train-hotspot__indicator { transition: none; } .train-hotspot:hover .train-hotspot__indicator { transform: translate(-50%, -50%); } .train-hotspot:active .train-hotspot__indicator, .train-hotspot.is-pressed .train-hotspot__indicator { transform: translate(-50%, -50%); } }` — no scaling transitions, indicator stays static.
  7. Verify density: 4 hotspots per train at 390×844, targets ≥44px, ≥8px horizontal padding. With one car (LEG-1), the scene has more room — check that all 4 indicator dots are visible without overlap after the car/coupler simplification. If the carriage-zone hotspot (passenger door / cargo latch) is too close to a engine-zone hotspot after the car width increase, adjust its `bounds` in `catalog.ts` (this is the only case where LEG-2 should touch catalog — document the adjustment).

### LEG-3: Train Sounds — Rainbow arc + track full-width
- Status: done
- Confirmed: yes
- Goal link: Backlog says the rainbow "doesn't look like a rainbow" (conic-gradient produces a fan), and the track "doesn't cover the full screen side-to-side." Both are CSS-only visual fixes.
- Depends on: none
- Owned files:
  - `public/styles/train-sounds.css`
- Read-only: none
- Deferred shared edits: none
- Verification: Viewing `.train-scene--rainbow` at 390×844 shows a curved ROYGBIV arc across the sky (not a fan/wedge); `.train-track::before` and `::after` span from `left: 0` to `right: 0`; `pnpm build` succeeds
- Intent:
  1. Replace the `.train-scene--rainbow::after` `background` property. Change from `conic-gradient(from 180deg at 50% 100%, ...)` to a `radial-gradient` that produces concentric color arcs: `radial-gradient(ellipse 60% 100% at 50% 100%, transparent 33%, rgba(136, 0, 204, 0.18) 34%, rgba(136, 0, 204, 0.18) 40%, rgba(0, 102, 255, 0.18) 41%, rgba(0, 102, 255, 0.18) 47%, rgba(0, 204, 68, 0.18) 48%, rgba(0, 204, 68, 0.18) 54%, rgba(255, 255, 0, 0.18) 55%, rgba(255, 255, 0, 0.18) 62%, rgba(255, 136, 0, 0.18) 63%, rgba(255, 136, 0, 0.18) 69%, rgba(255, 0, 0, 0.18) 70%, rgba(255, 0, 0, 0.18) 78%, transparent 79%)`. This renders as concentric colored arcs (red outermost, violet innermost) rising from the bottom of the overlay, curving as a natural rainbow — not a fan. The low opacity and blur filter already on the overlay soften the bands. Adjust the `top`, `left`, `right`, and `height` values to center the arc in the sky area if the visual doesn't read well at default values.
  2. Extend track rails edge-to-edge. In `.train-track::before`, change `left: 0.4rem; right: 0.4rem` to `left: 0; right: 0`. In `.train-track::after`, same change. The scene already has `overflow: hidden` at `.train-scene`, so extending to the edges is safe — nothing bleeds outside the scene.
  3. Extend sleeper positions to cover the full width. Adjust the `nth-child` percentages for `.train-sleeper` to spread evenly from 2% to 98% instead of 6% to 86%. Update: `nth-child(1) { left: 4%; }`, `nth-child(2) { left: 20%; }`, `nth-child(3) { left: 36%; }`, `nth-child(4) { left: 52%; }`, `nth-child(5) { left: 68%; }`, `nth-child(6) { left: 84%; }`. Consider adding 2 more sleepers (8 total) for better coverage at full width: add `nth-child(7) { left: 92%; }` and `nth-child(8) { left: 98%; }`, and update the sleepers count in `renderer.ts`'s `createTrack()` — NO, renderer.ts is not owned by this leg. Instead, use CSS-only: keep 6 sleepers but space them 2%–96%: `nth-child(1) { left: 2%; }` through `nth-child(6) { left: 96%; }` — even 6-column spacing at `2%, 20.8%, 39.6%, 58.4%, 77.2%, 96%`.
  4. Verify the rainbow in `prefers-reduced-motion` rule: the existing `.train-sounds .train-scene--rainbow::after { display: none !important; }` already hides it under reduced motion — no change needed, just confirm it still applies after the gradient swap.

### LEG-4: Train Sounds — Audio audibility verification
- Status: done
- Confirmed: yes
- Goal link: Backlog says "gain values were raised but the diver skill's OfflineAudioContext loudness probe was never actually run." Making the check real rather than aspirational.
- Depends on: none
- Owned files:
  - `games/train-sounds/sample-manifest.ts`
- Read-only:
  - `games/train-sounds/sounds.ts` — playback pipeline reference; the `playSample()` function and envelope creation pattern inform the probe
  - `public/train-sounds/audio/*.ogg` — source files to probe (already on disk)
  - `client/audio.ts` — SFX bus defaults (0.12 gain, compressor −18 dB threshold)
- Deferred shared edits: none
- Verification: Running the loudness probe on all 12 samples produces a report where every post-chain peak ≥ −18 dB; `grep "gain:" games/train-sounds/sample-manifest.ts` shows no value below 1.0; `pnpm test` passes
- Intent:
  1. Write and execute a Node.js loudness probe script (one-off, does not need to be committed as a permanent file, but save it for reference). The script: (a) reads each `.ogg` file from `public/train-sounds/audio/`, (b) decodes it into an OfflineAudioContext at 48kHz, (c) applies the SFX bus chain: `GainNode(0.12)` → `DynamicsCompressorNode({ threshold: -18, ratio: 12, knee: 0, attack: 0.003, release: 0.25 })`, (d) renders the full chain offline, (e) measures the post-chain peak amplitude (in dB) and post-chain RMS (in dB), (f) prints a table: sample ID, per-sample gain, post-chain peak dB, post-chain RMS dB, flag (PASS/FAIL where FAIL = post-chain peak < −18 dB). Use `fs.readFile` → `AudioContext.decodeAudioData` (or the `audio-decode` npm package if OfflineAudioContext is not available in Node; check if the project has a Node-compatible audio decode library; if not, use the Web Audio API shim `web-audio-engine` or similar). If no audio decode is available in Node, write the probe as a browser-accessible script that can be run in the dev server context.
  2. Review the probe output. For any sample flagged FAIL, raise the `gain` value in `sample-manifest.ts` incrementally (e.g., +0.3) until the post-chain peak meets or exceeds −18 dB. The target range is 2.6–3.2 for one-shots — only increase beyond 3.2 if a sample still fails, and add a comment explaining why.
  3. After adjusting gains, re-run the probe to confirm all samples now pass. Report the final gain values as part of the leg output.
  4. If the probe cannot run due to tooling limitations (no Node audio decode available), fall back to manual calculation: for each sample, multiply `sample.gain × bus.gain (0.12)` and check that the product reaches at least 0.12 (the level where peaks would hit the compressor). Since all current gains are ≥2.8, `2.8 × 0.12 = 0.336`, which in dB is ≈ −9.5 dB — well above the −18 dB threshold. If this manual check confirms all samples pass, document the result and close the leg without changes to the manifest.

### LEG-5: Spot On — CSS gaps + room scene width
- Status: done
- Confirmed: yes
- Goal link: Backlog says the room scene is dramatically narrowed on iPhone portrait (nearly letterboxed) and two CSS classes toggled by JS have no rules. This is the CSS baseline fix before LEG-6.
- Depends on: none
- Owned files:
  - `public/styles/spot-on.css`
- Read-only:
  - `games/spot-on/renderer.ts` — confirm which CSS classes JS toggles and how
- Deferred shared edits: none
- Verification: At 390×844 portrait, `.room-scene` fills the full available width with no significant dead zones on left/right; `grep "room-scene--complete\|room-spot--highlight" public/styles/spot-on.css` returns matches; `pnpm build` succeeds
- Intent:
  1. Add missing `.room-scene--complete` rule: a subtle visual confirmation that all items are placed. Add after the `.room-scene--carrying` block: `.room-scene--complete { box-shadow: inset 0 0 40px rgba(255, 210, 120, 0.2); }` — a warm inner glow. Under reduce-motion, no animation — just the static glow. The JS already toggles this class when `state.phase === 'complete'`.
  2. Add missing `.room-spot--highlight` rule: a static highlight state for spots that are individually highlighted (separate from the carrying-mode animation). Add: `.room-spot--highlight { border-color: rgba(58, 47, 40, 0.5); border-style: solid; background: rgba(255, 248, 220, 0.6); }` — a warm solid-bordered zone. This provides a reduce-motion-compatible fallback and a standalone highlight state the JS can toggle independently of carrying mode.
  3. Fix room scene width at 390×844 portrait. The scene currently has `margin: 0.5rem` which creates the narrowed appearance. In the `@media (max-width: 420px) and (orientation: portrait)` block, change `.room-scene { margin: 0.25rem; }` to `.room-scene { margin: 0.15rem 0.1rem; }` — nearly edge-to-edge with minimal safe area padding. Also check the parent `.spot-on-panel--game` for width-constraining rules — if it inherits a `max-width` or `width: min(100%, ...)` from the train-sounds pattern, ensure it passes full width through.
  4. Verify playfield height: count the combined height of all chrome elements (header with title, status bar, new-room button) and confirm the room scene fills ≥50% of the remaining viewport height at 390×844. If the room scene's `min-height: 50%` is relative to the parent rather than the viewport, change to a calculated value or `flex: 1 1 auto` (it already has this). The key fix is the `margin` — once the scene spans the width, the `flex: 1 1 auto` should give it the remaining height.
  5. Under `@media (prefers-reduced-motion: reduce), (data-reduce-motion: reduce)`, add `.room-spot--highlight { transition: none; }` and `.room-scene--complete { transition: none; }` to keep reduced-motion consistency.

### LEG-6: Spot On — Grid-based placement
- Status: done
- Confirmed: yes
- Goal link: Backlog says "1:1 item-to-spot mapping is too rigid." User confirmed grid-based: items can be placed on any cell on any surface. This is the core mechanic redesign.
- Depends on: LEG-5
- Owned files:
  - `games/spot-on/types.ts`
  - `games/spot-on/state.ts`
  - `games/spot-on/renderer.ts`
  - `games/spot-on/input.ts`
  - `games/spot-on/main.ts`
  - `games/spot-on/accessibility.ts`
  - `public/styles/spot-on.css`
- Read-only:
  - `games/spot-on/animations.ts` — animation function signatures may need to match new element types, but this file is not modified
  - `client/preferences.ts` — `isReducedMotionEnabled()` reference
  - `client/game-accessibility.ts` — `announce()` reference
- Deferred shared edits: none
- Verification: `pnpm build` succeeds; `pnpm test` passes (if any spot-on tests exist); at 390×844, carrying an item and tapping any empty cell places the item; tapping an occupied cell picks the item up; tapping floor returns item; `grep "SpotState\|SpotTemplate" games/spot-on/types.ts` returns 0 (old types removed); `grep "SurfaceState\|CellState" games/spot-on/types.ts` returns matches
- Intent:
  1. In `types.ts`, replace `SpotTemplate`, `SpotState`, and `SpotId` with the surface/cell model. New types: `SurfaceTemplate = { id: string, label: string, emoji: string, type: string, rows: number, cols: number, x: number, y: number, width: number, height: number }` (position and size as % of scene). `CellState = { row: number, col: number, itemId: ItemId | null }`. `SurfaceState = { id: string, label: string, emoji: string, type: string, x: number, y: number, width: number, height: number, rows: number, cols: number, cells: CellState[] }`. Update `ItemState`: remove `spotId`, add `surfaceId: string | null` and `cellIndex: number | null` (index into `SurfaceState.cells`). Update `RoomDefinition`: replace `spots: SpotTemplate[]` with `surfaces: SurfaceTemplate[]`. Update `SpotOnState`: replace `spots: SpotState[]` with `surfaces: SurfaceState[]`. Remove `SpotId` type alias (replace usages with `string` for surface/cell addressing). Keep `RoomId` for now (LEG-7 may change it to `string`).
  2. In `state.ts`, replace the fixed room definitions. For the 3 existing rooms, convert each `spots` array to a `surfaces` array with grid dimensions: bedroom surfaces = bookshelf (3×1, at shelf position), bed (2×2, at bed position), nightstand (1×1), hanger (1×1), toy-box (2×1). Kitchen surfaces = rack (2×1), shelf (3×1), counter (3×1), hook (1×1), bowl (1×1). Study surfaces = desk (3×1), shelf (3×1), coaster (1×1), tray (2×1), windowsill (3×1). Position/size values match current spot positions plus reasonable surface dimensions. Rewrite `initSpots()` → `initSurfaces()`: flatten each surface template's grid into `CellState[]` (row-major), total cells = `rows × cols`. Rewrite `pickUpItem()`: accept item from a surface cell (look up which surface/cell holds the item). Rewrite `placeItem(state, surfaceId, cellIndex)`: place carried item in the target cell. Update `dropItem()`: return item to floor position, clear `surfaceId`/`cellIndex`. Update `selectNextRoom()`: use `surfaces` in place of `spots`. Remove `countPlaced` reference to `spotId` — check `item.surfaceId !== null` instead.
  3. In `renderer.ts`, rewrite rendering to use surfaces and cells. Replace `createSpotDiv()` with `createSurfaceElement()` and `createCellElement()`. Each surface renders as a positioned `<div>` container (`class="room-surface"`, positioned via `left`, `top`, `width`, `height` from SurfaceState). Cells render as children inside the surface (`class="room-cell"`, sized as `100%/cols` width and `100%/rows` height within the surface grid). Empty cells are subtle dashed outlines; occupied cells show the item emoji. Floor items (not yet placed) render as `<button class="room-item">` as before. Carried items get the `room-item--carried` class. The scene structure becomes: surfaces (z-index 2) → floor items on top (z-index 5) → carried item (z-index 20). Remove all references to `createSpotDiv` and `.room-spot` patterns.
  4. In `input.ts`, update click delegation: item clicks still call `onPickUpItem(itemId)` (also handles picking up from a cell — the item's `surfaceId` is non-null). Cell clicks (on `.room-cell[data-cell-index]` elements within a `.room-surface`) call a new `onPlaceItem(surfaceId, cellIndex)` callback. Replace `SpotId` with `(surfaceId: string, cellIndex: number)` in the callback types. Keyboard navigation: Tab/arrows cycle through floor items and surface cells. Escape drops carried item. Pointer mode determined by carried-item state, not mouse button — right-click IS NOT a valid path on touch. Update `updateSpotOnInputState` and callback types.
  5. In `main.ts`, update event handlers to use the new `placeItem(state, surfaceId, cellIndex)` signature. Update `handlePlaceItem(surfaceId, cellIndex)`: find the surface, validate cell is empty, call state's `placeItem`. Update `handlePickUpItem(itemId)`: when the picked-up item was on a surface, clear its cell in the surface state (the state function handles this, but verify the UI updates correctly). Update accessibility calls: `announceItemPlaced(item.name, surface.label)`.
  6. In `accessibility.ts`, update `announceItemPlaced(itemName, surfaceLabel)` signature (replace `spotName` with `surfaceLabel`). Update `announceItemDropped` — unchanged. Add `announceItemPickedUpFromSurface(itemName, surfaceLabel)` variant if needed for picking up from a surface (vs floor).
  7. In `spot-on.css`, replace `.room-spot` rules with `.room-surface` and `.room-cell` rules. `.room-surface`: positioned container with label, subtle background, rounded corners. `.room-cell`: grid cell within surface, 44px minimum touch target, dashed outline when empty, solid background when occupied. `.room-scene--carrying .room-cell:not(.room-cell--occupied)`: highlight animation for empty cells while carrying. `.room-cell--occupied`: solid subtle zone with item emoji. Keep `.room-item` rules for floor items. Update `.room-item--placed` to apply to items inside cells. Add reduce-motion overrides for cell highlight animation. Remove all `.room-spot` selectors.

### LEG-7: Spot On — Procedural room generation
- Status: done
- Confirmed: yes
- Goal link: Backlog says "instead of fixed 3-room cycle, generate rooms procedurally for more replay variety." User confirmed. This replaces the fixed ROOMS array with a generator.
- Depends on: LEG-6
- Owned files:
  - `games/spot-on/state.ts`
  - `games/spot-on/types.ts`
  - `games/spot-on/renderer.ts`
  - `public/styles/spot-on.css`
- Read-only:
  - `games/spot-on/accessibility.ts` — announcement signatures reference room name
  - `games/spot-on/input.ts` — no changes needed
  - `games/spot-on/main.ts` — verify `handleNewRoom()` still works with generated rooms
- Deferred shared edits: none
- Verification: Starting a new game produces a room with a random theme; clicking "New Room" produces a different room with different surfaces, items, and colors; rooms never repeat identically in sequence; `pnpm build` succeeds; `pnpm test` passes; manual visual check required (surface positioning, theme colors, item scatter)
- Intent:
  1. In `types.ts`, add `RoomTheme = { id: string, name: string, wallColor: string, floorColor: string, surfacePool: SurfaceTemplate[], itemPool: ItemTemplate[] }`. Remove `RoomId` literal union — rooms are now identified by a generated string ID (e.g., `"bedroom-3"` or `"kitchen-7"`). Update `RoomDefinition` to carry the theme's color tokens (`wallColor`, `floorColor`) for dynamic CSS variable setting. Add `RoomSeed` type for optional reproducibility: `type RoomSeed = number` (used with a seeded PRNG).
  2. In `state.ts`, define a `ROOM_THEMES: RoomTheme[]` array with at least 5 themes: bedroom (soft blue walls, warm wood floor), kitchen (cream walls, light tile floor), study (green walls, dark wood floor), playroom (lavender walls, colorful rug floor), bathroom (pale teal walls, white tile floor). Each theme has 5–8 `SurfaceTemplate` candidates (the pool) and 6–10 `ItemTemplate` candidates (the item pool). Add `generateRoom(themeIndex?: number): RoomDefinition`: pick a theme (random or specified), randomly select 4–6 surfaces from the surface pool (positioned to avoid overlap using the existing `generateScatterPositions` overlap-avoidance pattern), randomly select 4–6 items from the item pool, scatter items on the floor, return a `RoomDefinition`. Replace `ROOMS` array and `selectNextRoom()` — `selectNextRoom()` now calls `generateRoom()` with a random theme (different from current). Remove fixed `ROOMS`, `ROOM_IDS`, `getRoomDefinition()`. Add a seeded PRNG (mulberry32 or similar) so rooms can be optionally reproducible (store the seed in state for debugging).
  3. In `renderer.ts`, replace fixed theme class toggling (`.room-bedroom`, `.room-kitchen`, `.room-study`) with dynamic CSS custom properties: when rendering a room, set `scene.style.setProperty('--spot-on-room-wall', room.wallColor)` and `scene.style.setProperty('--spot-on-room-floor', room.floorColor)`. Update `.room-scene` to use `var(--spot-on-room-wall)` and `var(--spot-on-room-floor)` instead of hardcoded colors. Remove all theme-specific CSS class toggling from `render()` — the `room.theme` string still adds a data attribute for debugging but no longer drives CSS rules. Remove the `ROOM_THEME_CLASSES` constant and its cleanup loop.
  4. In `renderer.ts`, remove rendering of furniture silhouettes via `::before`/`::after` — surfaces ARE the furniture now. Each surface renders as a visually distinct zone (subtle background, label, grid cells) that implicitly represents the furniture. This eliminates the need for theme-specific pseudo-element silhouettes.
  5. In `spot-on.css`, remove all `.room-bedroom`, `.room-kitchen`, `.room-study` rules and their `::before`/`::after` pseudo-element definitions. Update `.room-scene::after` (floor gradient) to use `var(--spot-on-room-floor)` instead of hardcoded colors: `background: linear-gradient(to bottom, transparent, var(--spot-on-room-floor));`. Set default custom property values on `.room-scene`: `--spot-on-room-wall: #c5d5e4; --spot-on-room-floor: #d4a76a;` (bedroom defaults, overridden by renderer). Remove `.room-bedroom::before`, `.room-kitchen::before`, `.room-study::before` silhouette rules.
  6. Verify the density cap: each generated room has 4–6 items and 4–6 surfaces, each surface with cells totaling at most 8 cells. At 390×844, targets ≥44px, ≤8 interactive elements visible without overlap, horizontal padding ≥8px. The `generateRoom()` function should enforce minimum surface dimensions and spacing.

### LEG-8: Spot On — Distinct drop sound + missing audio files
- Status: done
- Confirmed: yes
- Goal link: Backlog says "same audio for lift and let go" and "no .ogg files exist on disk, game is completely silent." This leg gives Spot On distinct feedback per action and makes audio actually play.
- Depends on: none
- Owned files:
  - `games/spot-on/sample-manifest.ts`
  - `games/spot-on/sounds.ts`
  - `games/spot-on/attributions.ts`
  - `.pi/skills/creative-assets/scripts/fetch-game-audio.ts`
- Read-only:
  - `public/spot-on/audio/` — target directory (will be created)
  - `client/audio.ts` — SFX bus defaults reference
  - `.pi/skills/creative-assets/references/audio-source-notes.md` — CC0 sourcing, audibility gate
- Deferred shared edits:
  - `ATTRIBUTIONS.md` — run `pnpm sync:attributions` after all legs complete
- Verification: `ls public/spot-on/audio/*.ogg` shows 5 .ogg files; `grep "drop-put-down" games/spot-on/sounds.ts` shows the 'drop' action routed to the new sample; `grep "drop-put-down" games/spot-on/sample-manifest.ts` shows the new entry; `pnpm build` succeeds; running the game in the dev server produces audio for pickup, place, drop, completion, and new-room actions
- Intent:
  1. Add `drop-put-down` to `SpotOnSampleId` union in `sample-manifest.ts`. Add its manifest entry with a real CC0 Freesound source: search Freesound for a short "put down" / "plop" / "soft impact" sound that reads as a downward motion (distinct from the upward whoosh of `pick-up-whoosh`). Good candidate: a soft thud or object-set-down recording. Set `gain: 2.6`, `loop: false`, `bundled: true`. Fill in real Freesound `soundId`, `title`, `creator`, `sourceUrl`, and `processing` specs (duration ~0.4s, mono, 48kbps OGG, high-pass at 80Hz, low-pass at 2800Hz). If the Freesound API key is available, search and select; otherwise use a known CC0 sound ID from the Freesound catalog (e.g., a muffled thud or soft drop candidate).
  2. In `sounds.ts`, change the `'drop'` route in `validNames` from `'pick-up-whoosh'` to `'drop-put-down'`. The player action mapping is now: pickup → `pick-up-whoosh`, place → `place-thunk`, drop → `drop-put-down`, completion → `completion-chime`, new-room → `room-transition`. All 5 actions have distinct sample IDs.
  3. In `attributions.ts`, add an entry for `drop-put-down` with the Freesound source metadata (title, creator, sourceUrl, license CC0, modifications note). Update the entry for `pick-up-whoosh` notes to clarify it's now the pickup-only sound (not shared with drop).
  4. Add spot-on config to `fetch-game-audio.ts` in the `gameAudioConfigs` object: `'spot-on': { outputDir: join(repoRoot, 'public', 'spot-on', 'audio'), getDownloadableSamples: () => getDownloadableSpotOnSamples() as readonly GenericGameAudioDefinition[] }`. Add the import for `getDownloadableSpotOnSamples` from `../../../../games/spot-on/sample-manifest.js` at the top of the file, following the existing import pattern.
  5. Create directory `public/spot-on/audio/`. Run the fetch script: `node --experimental-strip-types .pi/skills/creative-assets/scripts/fetch-game-audio.ts --game spot-on --yes`. This downloads and processes all 5 samples (4 existing + 1 new) into OGG files. If `FREESOUND_API_KEY` or `ffmpeg` are not available, the fetch will fail — in that case, mark this step as a handoff note ("audio files require manual fetch: run `node fetch-game-audio.ts --game spot-on --yes` with FREESOUND_API_KEY set") and continue with the code changes. The game will still be silent until someone runs the fetch, but the code paths will be correct.
  6. Verify all 5 .ogg files exist on disk after fetch. Per-sample `gain ≥ 2.6` for all entries per audibility gate. Run `pnpm sync:attributions` (or note as deferred shared edit) and `pnpm build` to verify.

## Dispatch Order
Parallel via subagent (navigator dispatches conflict-free batches, reviews between batches).

**Note:** LEG-1 and LEG-3 both own `public/styles/train-sounds.css`. They cannot run in the same parallel batch. LEG-3 must run after LEG-1 completes and its CSS changes are landed.

**Batch 1a (parallel, no file conflicts):**
1. LEG-1 (One car per train) — no dependencies
2. LEG-4 (Audio audibility verification) — no dependencies
3. LEG-5 (CSS gaps + room scene width) — no dependencies
4. LEG-8 (Distinct drop sound + audio files) — no dependencies

**Batch 1b (sequential, after LEG-1 lands CSS):**
5. LEG-3 (Rainbow arc + track full-width) — no dependencies, shares `train-sounds.css` with LEG-1

**Batch 2 (parallel, no file conflicts):**
6. LEG-2 (Visible hotspot indicators) — depends on LEG-1
7. LEG-6 (Grid-based placement) — depends on LEG-5

**Batch 3 (sequential, depends on batch 2):**
8. LEG-7 (Procedural room generation) — depends on LEG-6

After all complete: deferred shared edits (`ATTRIBUTIONS.md` sync) → `pnpm build` → `pnpm test` → `pnpm sync:attributions` → delivery verification → commit → push.

## Boundary Notes
- **LEG-1 bridge edit:** Removed 4 dead hotspot route entries (`steam-coupler`, `diesel-wheels`, `electric-wheels`, `high-speed-wheels`) from `games/train-sounds/sounds.ts` — this file was read-only for LEG-1 but the entries referenced removed type members.
- **LEG-4 blocker:** `electric-horn.ogg` is completely silent (all-zero samples, 3.2KB). The file must be regenerated from its Freesound source (soundId 783760). Gain is 2.9 with a comment noting the issue.
- **LEG-4 gain adjustments:** `highspeed-passby` gain raised from 3.2 → 7.2; `coupler-clank` gain raised from 3.1 → 22. Both documented with comments in the manifest.
- **LEG-8 gap:** Only 1/5 spot-on audio files exists on disk (`drop-put-down.ogg`). The 4 pre-existing samples (`pick-up-whoosh`, `place-thunk`, `completion-chime`, `room-transition`) have Freesound source IDs that are either non-CC0 licensed or deleted. Replacement CC0 sources need to be found and the audio re-fetched.

## Implementation
Commit: d39ec7d | none (local-only)
Pushed: 2025-07-10

## Critique

### What Worked
- LEG-1 car simplification — clean removal of dead types, routes, and CSS modifiers
- LEG-3 rainbow + track CSS — proper radial-gradient arc, edge-to-edge rails
- LEG-5 CSS gap fills — missing classes added, reduced-motion overrides included
- LEG-6 type overhaul — complete spot→surface migration across all 7 owned files, no stale types in production code
- LEG-7 procedural generation — 5 themes, seeded PRNG, CSS custom properties, theme classes removed
- LEG-8 drop sound routing — correct sample mapping, attribution, and fetch config

### What Didn't
- **LEG-2: Double hotspot indicators** — Both `::after` and `.train-hotspot__indicator` are active in CSS. Plan intent chose the `<span>` approach over `::after` for mobile reliability. The `::after` rules should have been removed.
- **LEG-1 miss: stale controller.tsx** — `train-sounds/controller.tsx` lines 146–149 still reference `train-coupler--one`, `train-car--first`, `train-coupler--two`, `train-car--second`. No matching CSS exists. File was not in LEG-1's owned set and not listed as read-only.
- **LEG-4: Audibility unverified** — Loudness probe never ran; gains adjusted by manual calculation. `electric-horn.ogg` is silent (all-zero samples), unresolved.
- **LEG-5: Room scene still squished** — Margin tweak (`0.5rem` → `0.15rem 0.1rem`) insufficient. Room scene doesn't fill viewport at phone portrait.
- **LEG-6: Grid cells too small to see** — Surfaces and cells are cut off because play area is too small (compounds LEG-5). Cells at 44px minimum are hard to distinguish.
- **LEG-6: Items don't fill cells** — Rooms generate 4–6 items but surfaces have more total cells. Empty cells look like wasted space. User wants exact item-to-cell count.
- **LEG-6/7: Rooms don't look like rooms** — Furniture silhouettes removed in LEG-7; surfaces are minimal labeled grids. Missing furniture shapes, art, windows — decorative elements that make rooms feel lived-in.
- **LEG-8: 4/5 Spot On audio missing** — Only `drop-put-down.ogg` on disk. Pre-existing samples have no `.ogg` files. Game is effectively silent.
- **Stale `.room-item--placed` selector** — `input.ts` line 24 has `.room-item:not(.room-item--placed)` but the class is never applied. Filter is a no-op.
- **LEG-3: Rainbow opacity too subtle** — Bands at 0.18 alpha; user wants 0.3.
- **LEG-3: Rainbow hidden under reduced-motion** — Static gradient hidden via `display: none !important`. Not an animation; questionable to remove for reduced-motion users.

### Chart Gaps
- **No visual verification in plan** — Layout/design legs had no Playwright screenshot checkpoints or explicit "manual visual check required" markers. Multiple issues (room scene sizing, grid cell visibility) could only be caught visually.
- **Rooms should feel like rooms** — Chart captured "grid-based placement" as a type/state change but missed the atmospheric requirement: rooms need furniture, art, windows for visual identity.
- **Item count must fill cells** — Plan specified "4–6 items, 4–6 surfaces" without constraining item count to match total cells.

### User Effectiveness
- Backlog items were concrete (fix width, add classes, change types) but underlying aesthetic goals ("rooms that look like rooms," "items fill all the spots") weren't surfaced until critique. Earlier charting with prototype screenshots could have drawn these out.

### Blockers
- `electric-horn.ogg` is all-zero samples — electric train horn produces no sound
- 4/5 Spot On audio files missing — game is silent except for drop sound

### Corrections for Next Cycle
- `.pi/skills/gnd-chart/LOCAL.md` — Add mandatory visual checkpoint for layout/design legs (screenshot assertions at 390×844 and 844×390, or explicit "manual visual check required" markers).
- `.pi/skills/gnd-chart/LOCAL.md` — When charting grid/cell mechanics, constrain item count to equal total cell count.
- `.pi/skills/gnd-chart/LOCAL.md` — Room generation legs must include room decor (furniture shapes, art, windows) as generated elements.
- `.pi/skills/gnd-navigate/LOCAL.md` (new) — Review step: grep removed CSS class names across ALL project files, not just owned files.

