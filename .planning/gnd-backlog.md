# Backlog

Items collected from field reviews, critiques, and conversations. The `gnd-critique` skill transfers Field Review Holding List items here at the end of PC Phase 5. Items are grouped by area; remove an item once it's absorbed into a plan.

## Waterwall

- **Pointer barrier placement UX follow-up:** After the barrier-in-water fix, confirm the tap-to-toggle feel is right on device. If water fills too fast, per-cell visual feedback (brief flash on placement) may be needed.
- **Water running visual texture:** ~~Add per-cell animation/texture variation to water so it looks like running water rather than a solid blue mass.~~ Implemented: time-based sine wave scrolling downward across cells.

## App / Architecture

- **Shared assets between games:** Common audio buses, font identity tokens, sprite sheets, and UI patterns are duplicated per game. Explore a shared module layer — needs architecture planning.
- **Build step elimination:** User wants to explore removing the esbuild step entirely (import maps or native ESM). Large scope — needs investigation leg before charting.
- **Menu / settings redesign:** Revisit the `GameTabbedModal` pattern across all games. User wants to reconsider what belongs in a menu, simplify quit paths, and possibly unify help/controls layout.

## Meta / gnd Tooling

- **gnd-backlog skill:** A skill that scans `.planning/archive/` for unfinished Field Review Holding List items and reconciles against this file. Could surface forgotten backlog items at charting time automatically, without relying on gnd-chart's manual check.
- **gnd-critique community flag as opt-in:** The community contribution flag in `gnd-critique/LOCAL.md` prompts the user to consider upstream contributions during every critique. This may be too opinionated for general gnd use — consider making it an opt-in install flag rather than default behavior. Worth proposing to the gnd community as a feature request.
