# Backlog

Items collected from field reviews, critiques, and conversations. The `gnd-critique` skill transfers Field Review Holding List items here at the end of PC Phase 5. Items are grouped by area. **Remove an item once it's absorbed into a plan or implemented directly — the git commit message is the implementation record, no separate note needed.**

## Waterwall

- **Pointer barrier placement UX follow-up:** After the barrier-in-water fix, confirm the tap-to-toggle feel is right on device. If water fills too fast, per-cell visual feedback (brief flash on placement) may be needed.

## Story Trail

- **Inventory feel refinement (iPhone portrait):** The equip loop is mechanically correct but the feel isn't settled — visual weight/density of selection state and interaction pacing on phone portrait may need tuning. (From plan critique 2026-04-17.)

## Drum Pad

- **Low-end workshop:** Some players may expect more low bass range than the current percussion-only kit provides. Workshop options before implementation: deepen the existing kick/tom voices, add a visible `Kit / Bass` bank, or explore a larger secondary low-end pad treatment on bigger screens. Also pressure-test whether hidden extra hit zones or sustained drones are discoverable enough to be worth keeping in scope. (From field review 2026-04-20.)
- **Audio sourcing needed:** All 8 drum pad samples are `bundled: false` with placeholder Freesound IDs and no audio files on disk. The game is playable but completely silent. Needs creative-assets workflow pass to fetch and convert CC0 samples. (From plan critique 2026-04-24.)
- **Sounds broken:** After recent audio updates, Drum Pad/Music Pad sounds are broken — nothing plays. 3 e2e tests failing (start screen, pad grid, controller menu). (From critique 2025-07-10.)

## Spot On

- **Room scene still squished on phone portrait:** LEG-5 reduced margins but the play area still doesn't fill the viewport at 390×844. Surfaces and grid cells are too small to see and interact with comfortably. (From critique 2025-07-10; original item from 2026-04-24.)
- **Items must fill all cells:** Room generation should produce exactly as many items as there are total cells across all surfaces — no empty cells, no leftover items. (From critique 2025-07-10.)
- **Rooms need visual identity — furniture, art, windows:** Procedural rooms are just colored rectangles with labeled grid cells. Rooms need decorative elements (furniture shapes, art, windows, doorways) as part of the procedural engine to feel like real rooms. (From critique 2025-07-10.)
- **Audio files mostly missing:** Only 1 of 5 Spot On audio files exists on disk (`drop-put-down.ogg`). The other 4 samples (`pick-up-whoosh`, `place-thunk`, `completion-chime`, `room-transition`) have `bundled: true` but no `.ogg` files. Freesound source IDs are non-CC0 or deleted. Game is effectively silent. (From critique 2025-07-10; original from 2026-04-24.)
- **Stale `.room-item--placed` selector:** `input.ts` line 24 still references `.room-item--placed` but the class is never applied. The `:not(.room-item--placed)` filter is a no-op. (From critique 2025-07-10.)

## Train Sounds

- **Double hotspot indicators:** LEG-2 added both `::after` and `<span class="train-hotspot__indicator">` — two overlapping indicator circles per hotspot. Plan intent chose the `<span>` approach only. The `::after` CSS rules should be removed. (From critique 2025-07-10.)
- **Stale controller.tsx:** `train-sounds/controller.tsx` lines 146–149 still reference old `train-coupler--one`, `train-car--first`, `train-coupler--two`, `train-car--second` classes with no matching CSS. Start screen train display is broken. (From critique 2025-07-10.)
- **Rainbow opacity too subtle:** Bands at 0.18 alpha are barely visible. Increase to 0.3. (From critique 2025-07-10.)
- **Rainbow hidden under reduced-motion:** Static gradient hidden via `display: none !important`. A non-animated visual shouldn't be removed for reduced-motion users. (From critique 2025-07-10.)
- **Landscape layout issues:** Rotating to landscape shrinks everything vertically. "All aboard" button should be next to train name. Tracks should stay fixed at full width, not follow the train. (From critique 2025-07-10.)
- **Remove arrow buttons:** Left/right arrow buttons no longer needed now that "all aboard" button exists. (From critique 2025-07-10.)
- **Audio audibility still unverified:** `electric-horn.ogg` is completely silent (all-zero samples). Other gains were adjusted by manual calculation, not an actual loudness probe. (From critique 2025-07-10; original from 2026-04-24.)

## Cross-Game

- **Manual gamepad hardware testing:** Pixel Passport, Mission Orbit, and Story Trail all received controller support but have not been tested on a real gamepad yet. (From plan critique 2026-04-17.)
- **Start screen visual consistency:** Start screens are directionally right but need more visual consistency across games — shared layout rhythm, font sizing, spacing. (From plan critique 2026-04-17.)

## App / Architecture

- **Shared assets between games:** Audio buses, font tokens, and UI patterns now use shared modules (LEG-5/LEG-7 of consolidation plan). Remaining: sprite sheets and per-game CSS identity tokens not yet shared.
- **Build step elimination:** Investigated in LEG-13 of consolidation plan — deferred indefinitely. No bare specifiers, TS transpilation still needed, unbundled request count too high.
- **Menu UX refinement:** Global menu shell shipped (LEG-8) but user reports menus still need work — layout, interaction feel, and content. (Updated from plan critique 2026-04-17.)
- **Menu contrast/accessibility:** Shared `GameTabbedModal` uses semi-transparent overlay backgrounds (`rgba(4, 10, 20, 0.72)`) and `rgba(255, 255, 255, 0.5)` text that create poor contrast. User reports this is a persistent issue across games. Fixing the shared component once (making overlays opaque, improving text contrast) would improve all games. Individual games like peekaboo can also customize overlay opacity per-game. (From peekaboo plan critique 2026-04-22.)

## Meta / gnd Tooling

- **gnd-backlog skill:** A skill that scans `.planning/archive/` for unfinished Field Review Holding List items and reconciles against this file. Could surface forgotten backlog items at charting time automatically, without relying on gnd-chart's manual check.
- **gnd-critique community flag as opt-in:** The community contribution flag in `gnd-critique/LOCAL.md` prompts the user to consider upstream contributions during every critique. This may be too opinionated for general gnd use — consider making it an opt-in install flag rather than default behavior. Worth proposing to the gnd community as a feature request.