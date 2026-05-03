# Backlog

Items collected from field reviews, critiques, and conversations. The `gnd-critique` skill transfers Field Review Holding List items here at the end of PC Phase 5. Items are grouped by area. **Remove an item once it's absorbed into a plan or implemented directly — the git commit message is the implementation record, no separate note needed.**

## Waterwall

- **Pointer barrier placement UX follow-up:** After the barrier-in-water fix, confirm the tap-to-toggle feel is right on device. If water fills too fast, per-cell visual feedback (brief flash on placement) may be needed.

## Story Trail

- **Inventory feel refinement (iPhone portrait):** The equip loop is mechanically correct but the feel isn't settled — visual weight/density of selection state and interaction pacing on phone portrait may need tuning. (From plan critique 2026-04-17.)

## Music Pad

- **Potential rename after live use:** "Drum Pad" may land better than "Music Pad" after seeing it shipped; revisit the public title on the live surface before planning any rename pass. (From plan critique 2026-04-20.)
- **Low-end workshop:** Some players may expect more low bass range than the current percussion-only kit provides. Workshop options before implementation: deepen the existing kick/tom voices, add a visible `Kit / Bass` bank, or explore a larger secondary low-end pad treatment on bigger screens. Also pressure-test whether hidden extra hit zones or sustained drones are discoverable enough to be worth keeping in scope. (From field review 2026-04-20.)

## Cross-Game

- **Manual gamepad hardware testing:** Pixel Passport, Mission Orbit, and Story Trail all received controller support but have not been tested on a real gamepad yet. (From plan critique 2026-04-17.)
- **Start screen visual consistency:** Start screens are directionally right but need more visual consistency across games — shared layout rhythm, font sizing, spacing. (From plan critique 2026-04-17.)

## App / Architecture

- **Shared assets between games:** Audio buses, font tokens, and UI patterns now use shared modules (LEG-5/LEG-7 of consolidation plan). Remaining: sprite sheets and per-game CSS identity tokens not yet shared.
- **Build step elimination:** Investigated in LEG-13 of consolidation plan — deferred indefinitely. No bare specifiers, TS transpilation still needed, unbundled request count too high.
- **Menu UX refinement:** Global menu shell shipped (LEG-8) but user reports menus still need work — layout, interaction feel, and content. (Updated from plan critique 2026-04-17.)

## Meta / gnd Tooling

- **gnd-backlog skill:** A skill that scans `.planning/archive/` for unfinished Field Review Holding List items and reconciles against this file. Could surface forgotten backlog items at charting time automatically, without relying on gnd-chart's manual check.
- **gnd-critique community flag as opt-in:** The community contribution flag in `gnd-critique/LOCAL.md` prompts the user to consider upstream contributions during every critique. This may be too opinionated for general gnd use — consider making it an opt-in install flag rather than default behavior. Worth proposing to the gnd community as a feature request.
