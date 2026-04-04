# File Size

Use these thresholds as a readability heuristic for this repository. They are guidance, not a style-law test.

## TypeScript Targets

- Target: keep most `.ts` and `.tsx` modules at or under 300 lines.
- Investigate at 400 lines: look for natural seams such as data vs. logic, rendering vs. modal wiring, or one input system vs. another.
- Hard ceiling at 600 lines: files above this should be considered refactor candidates unless they are deliberately generated or tightly domain-bound.

## CSS Targets

- Target: keep most stylesheets at or under 800 lines.
- Investigate at 1000 lines: look for repeated layout primitives, duplicated button states, or animation patterns that belong in shared base styles.
- Game stylesheets may exceed this when they carry many breakpoints or animation states, but they should stay heavily sectioned and avoid duplicated shared rules across multiple games.

## Data Files

- Large data files are acceptable when they are mostly static content.
- Separate static data from transformation or generation logic even when the file is still short.
- Prefer thin public API files over monoliths that mix records, helper utilities, and orchestration.

## Good Splits For This Repo

- `puzzles.ts` or `destinations.ts`: split into data files plus builder/query logic.
- `renderer.ts`: extract self-contained UI chrome such as settings modals, focus traps, or celebration overlays.
- `sounds.ts`: split ambient music orchestration from moment-to-moment SFX when both keep growing.
- `input.ts`: split pointer, keyboard, and gamepad paths when they stop sharing enough code to justify a single file.

## Decision Rule

- Split when the new modules make ownership clearer and do not create circular imports.
- Do not split just to satisfy a number if the result would scatter a single coherent concept across too many files.