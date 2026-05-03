# Plan: Squares Game Launch

## Project Context
- Sources:
  - `README.md` - source of truth for game principles and site values
  - `AGENTS.md` - repo workflow, planning overlays, validation gates, and environment expectations
  - `.agents/skills/gnd-chart/SKILL.md` - current gnd plan structure and `.planning/` location
- Constraints:
  - This plan preserves the existing scope and intent while using the current gnd leg format.
  - Follow repo expectations for full-screen game shells, accessibility, reduced-motion handling, calm pacing, localStorage-only persistence, and synthesized audio when possible.
  - Use `pnpm`-based repo commands for validation and handoff.
- Full validation:
  - `pnpm sync:attributions`
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

You want a new full-screen game called Squares that keeps the core feel of your early-2000s TI-Basic puzzle: flip a light/dark grid, switch between plus and X toggle shapes during normal play, and win by making the whole board one shade. It needs to work cleanly across keyboard, mouse, touch, and gamepad, with explicit pattern-switch affordances for each input type, responsive preset sizes, contrast-safe grayscale theme pairs, and synthesized music/SFX with a chill default and a tenser alternative. You want separate local high-score buckets for each preset and ruleset, and those high-score labels need to update clearly whenever the player changes preset or mode. You also want a restart path that replays the current puzzle if the player gets stuck, crunchy but reduced-motion-safe move feedback, and solve celebrations that can send a patterned sweep across the board in a few styles while still offering calmer non-animated equivalents.

## Legs

### LEG-1: Squares - Rules engine
- Status: done
- Confirmed: yes
- Goal link: Create the pure board model that makes Squares faithful, fair, restartable, and scoreable across classic hybrid play and easier locked-pattern variants.
- Depends on: none
- Owned files:
  - `games/squares/types.ts`
  - `games/squares/state.ts`
  - `games/squares/state.test.ts`
- Read-only:
  - `README.md` - source of truth for every-input support, localStorage-only progress, and synthesized-media principles
  - `games/chompers/state.ts` - reference pure immutable transition style and colocated node-side tests
- Deferred shared edits:
  - none
- Verification: `node --import tsx --test games/squares/state.test.ts`
- Intent: (1) In `types.ts`, define the core puzzle contract: board cell values, row/column coordinates, board preset metadata, ruleset IDs (`classic-hybrid`, `easy-plus`, `easy-x`), theme preset IDs, celebration pattern IDs, game phases, and the high-score bucket key shape. Keep these types implementation-oriented so `main.ts`, `renderer.ts`, and settings UI can all read the same preset and ruleset labels without duplicating strings. (2) In `state.ts`, implement pure immutable helpers for creating a board from a preset, computing the affected cells for plus and X patterns with edge clipping, applying a move, switching patterns in classic hybrid mode, locking patterns in easy modes, detecting a solved board when every cell is either all light or all dark, computing the active high-score key, and restarting the current puzzle from its original scramble instead of generating a fresh board. (3) Easy modes must generate guaranteed-solvable starts by reverse-scrambling from a solved board using only the locked pattern for that mode; classic hybrid mode can use the same board-generation machinery but must still allow the player to switch between plus and X during play because that is core to the original design. (4) Keep move counts and local best-score buckets separate by preset and ruleset so guaranteed-solvable easy boards never overwrite classic hybrid highs. (5) In `state.test.ts`, add explicit assertions for plus-shape toggles, X-shape toggles, corner and edge clipping, solved detection for both all-light and all-dark boards, easy-mode pattern locking, restart restoring the original scramble, reverse-scrambled easy boards being built from legal moves, and high-score keys differing for classic hybrid vs easy-plus vs easy-x on the same board preset. Relevant project constraints: state transitions stay pure and immutable, pacing stays calm and user-controlled, and no network or account state is introduced.

### LEG-2: Squares - Interaction and board runtime
- Status: done
- Confirmed: yes
- Goal link: Turn the rules engine into a playable board that is clear and usable across keyboard, mouse, touch, and controller on every supported viewport.
- Depends on: LEG-1
- Owned files:
  - `games/squares/accessibility.ts`
  - `games/squares/animations.ts`
  - `games/squares/input.ts`
  - `games/squares/input.test.ts`
  - `games/squares/renderer.ts`
- Read-only:
  - `client/spatial-navigation.ts` - nearest-target helper for D-pad and arrow-key focus movement
  - `games/super-word/input.ts` - reference controller polling, roving focus, and button mapping patterns
  - `games/chompers/input.ts` - reference `gamepad-active` handling and menu/start interaction conventions
- Deferred shared edits:
  - none
- Verification: `node --import tsx --test games/squares/input.test.ts`
- Intent: (1) In `renderer.ts`, render the active puzzle as a semantic grid of native `<button>` elements, never generic `<div>` click targets, with stable IDs/data attributes for row, column, and current pattern preview hooks. The grid must stay full-screen friendly with no document scroll, safe-area-aware spacing, and touch targets that remain at least 44px where interaction is expected. (2) Build clear preview state for the next move: before activation, the focused or hovered cell and every affected plus/X neighbor should show a readable preview treatment; when reduced motion is enabled, swap pulsing or flowing emphasis for calmer contrast, outline, or shade changes that still make the target pattern obvious. (3) In `input.ts`, normalize actions around move focus, play cell, toggle pattern, open menu, and restart-current-puzzle. Support arrow keys and Enter/Space for play, provide a direct keyboard shortcut for pattern switching during gameplay, allow mouse users to right-click to switch the active pattern, allow touch users to long-hold to switch the active pattern, and keep a dedicated focusable pattern-toggle control for keyboard and gamepad users so the mechanic is never hidden behind gestures. Gamepad support must include D-pad navigation between grid cells and controls, button 0/A for select, button 9/Start for menu, a dedicated controller button for pattern switching, analog-stick dead zone +/-0.5, roughly 200ms debounce, and graceful handling for connection or disconnection. (4) In `accessibility.ts`, announce pattern changes, moves, restart events, high-score context changes, and solved-state feedback through `#game-status` (polite) and `#game-feedback` (assertive), using short low-reading-level strings. (5) In `animations.ts`, implement crunchy-but-calm feedback for played moves plus solve celebrations that can sweep across the board in a few styles such as snake, wave, and diagonal fan; each effect must have a reduced-motion-safe equivalent that still communicates success without relying on travel-heavy animation. Visual checkpoint: the idle board feels calm and tactile, the currently targeted plus/X pattern is obvious before every move, and a solved board celebrates briefly before settling into a clean unified field. (6) In `input.test.ts`, add explicit assertions for keyboard pattern switching, mouse right-click mapping to pattern toggle without also consuming the move path, long-hold threshold behavior vs tap behavior on touch input helpers, and controller mappings for D-pad, A/select, Start/menu, and the dedicated pattern-switch action. Relevant project constraints: keyboard, touch/pointer, and gamepad must all work; WCAG 2A/2AA semantics and focus handling apply; iOS Safari requires native interactive elements; and reduced-motion support must preserve correct visual state, not just suppress animation.

### LEG-3: Squares - Shell, audio, and game assets
- Status: done
- Confirmed: yes
- Goal link: Present Squares as a finished Peninsular Reveries game with clear settings, visible high scores, calm visuals, synth audio, and install/offline support.
- Depends on: LEG-1, LEG-2
- Owned files:
  - `games/squares/controller.tsx`
  - `games/squares/controller.test.ts`
  - `games/squares/main.ts`
  - `games/squares/sounds.ts`
  - `games/squares/sounds.test.ts`
  - `games/squares/info.ts`
  - `games/squares/attributions.ts`
  - `public/styles/squares.css`
  - `public/squares/manifest.json`
  - `public/squares/sw.js`
  - `public/favicon-game-squares.svg`
- Read-only:
  - `app/ui/game-shell.tsx` - shared full-screen screens, modal shell, header pills, and settings conventions
  - `client/modal.ts` - tabbed modal behavior and controller integration hooks
  - `client/preferences.ts` - shared per-game music, SFX, and reduce-motion bindings
  - `client/audio.ts` - synth buses, compressor, and audio-unlock flow
  - `games/story-trail/sounds.ts` - reference synthesized ambient loop structure
  - `app/site-paths.ts` - base-path-safe quit and info links
- Deferred shared edits:
  - `app/data/game-registry.ts` - add a live Squares card entry with its slug, short description, and final icon text
  - `app/routes.ts` - add `squares` and `squaresInfo` route definitions
  - `app/router.ts` - import `squaresAction` and register `/squares/` plus `/squares/info/`
  - `app/data/attribution-index.ts` - import Squares info and attribution exports and append them to `gameEntries`
  - `build.ts` - add Squares client bundling, output directory creation, service-worker stamping for `squares/sw.js`, static HTML generation for `/squares/` and `/squares/info/`, and a Squares page entry in the budget table
  - `server.ts` - add `games/squares/main.ts` to the watched game entry points
  - `app/site-config.test.ts` - extend manifest-alignment coverage to include `public/squares/manifest.json`
  - `config/build.test.ts` - extend expected built assets and rendered HTML assertions for Squares JS, CSS, favicon, manifest, service worker, and generated page output
  - `e2e/site-01-responsive.spec.ts` - add `/squares/` to the shared page list and add explicit Squares viewport assertions that the grid and pattern control stay visible with no horizontal overflow at the project checkpoints
  - `e2e/site-02-navigation.spec.ts` - add homepage link, card-body navigation, direct URL, and Quit-in-menu coverage for Squares
  - `e2e/site-03-semantic-html.spec.ts` - add Squares start-page semantic control coverage and heading hierarchy expectations
  - `e2e/site-04-accessibility.spec.ts` - add Squares start-screen and active-game Axe checks, menu focus-restore coverage, and live-region announcement checks for moves, pattern changes, and win context
  - `e2e/site-05-favicon.spec.ts` - add Squares favicon and manifest expectations
  - `e2e/site-06-noscript.spec.ts` - add Squares JS-disabled load coverage
  - `e2e/site-07-game-smoke.spec.ts` - add Squares smoke tests for start, pointer play, keyboard or right-click pattern switching, menu open via controller, and in-viewport grid interaction
- Verification: `node --import tsx --test games/squares/controller.test.ts games/squares/sounds.test.ts`
- Intent: (1) In `controller.tsx`, create the full SSR page using `Document` with `includeNav={false}`, `includeFooter={false}`, `viewportFitCover`, `GameScreen`, `GameHeader`, `GameTabbedModal`, `#game-status`, `#game-feedback`, and a noscript fallback. Ship start, gameplay, and win states. The menu baseline must include a home-or-quit path, controls help, audio settings, reduce-motion control, and info/credits path. Keep `Restart` wired to replay the current scramble so a stuck player can try the same puzzle again instead of being kicked to a new board. Keep the MVT self-contained by sourcing menu summary copy from local `games/squares/info.ts` data in the controller rather than requiring the deferred `app/data/attribution-index.ts` edit for the controller to render successfully. (2) Surface the active local high score clearly in both the HUD and the settings flow. When the player changes board preset or ruleset, update the label immediately so it is obvious which high-score bucket is active before play begins; use plain "high score" language, not vague "record" wording. (3) In settings, provide curated board presets, ruleset selection for classic hybrid vs easy-plus vs easy-x, preset theme pairs only, music choice, sound toggles, high-score reset, and concise controls copy that explains the pattern-switch affordances for mouse, keyboard, touch, and controller. (4) In `main.ts`, wire the shared preference bindings, localStorage high-score persistence, start/restart flows, menu open/close behavior, selector changes, and solved-state celebration handoff. The main loop should trigger one of the solve celebration patterns, then settle the board cleanly and keep replay/start-over actions user-controlled rather than auto-advancing into a frantic sequence. (5) In `sounds.ts`, synthesize minor action SFX with a little crunch for move confirmation, a distinct pattern-switch sound, a win cue, and two music profiles with chill as the default and a tenser option as the alternate. Use the shared music/SFX buses and dynamics setup; do not add external bundled music if synth can cover it. (6) In `public/styles/squares.css`, build a grayscale-forward game-specific visual system with custom properties for theme presets, safe-area-aware full-screen layout, no document scroll, responsive grid sizing at 390x844, 844x390, 1024x768, and 1280x800, and readable state styles for hover, focus, preview, solved, and menu layers. Do not duplicate shared game-shell rules already owned by `app/ui/game-shell.tsx`; keep this stylesheet focused on Squares-specific art direction and runtime class hooks. Visual checkpoint: the board feels calm and tactile when idle, played moves have brief crunchy feedback, preview targets are obvious, reduced-motion mode preserves the same information without pulse-heavy movement, and the win celebration resolves to a tidy single-color field. (7) In `info.ts` and `attributions.ts`, document the game summary and note that Squares uses synthesized audio at runtime unless implementation proves external media necessary. (8) Add `controller.test.ts` assertions that the rendered page includes the start/game/win screens, menu dialog, `restart-btn`, `settings-close-btn`, high-score UI hooks, the live regions, and the Squares manifest/favicon references. Add `sounds.test.ts` assertions that the chill profile is the default, the tense profile exists, and both profile definitions expose deterministic scheduling metadata for the runtime. Relevant project constraints: full-screen layout with no document scroll, safe-area padding, calm user-controlled pacing, localStorage-only persistence, synthesized audio when possible, and keeping the page within the project size budgets.

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

1. LEG-1 (Squares - Rules engine) - no dependencies
2. LEG-2 (Squares - Interaction and board runtime) - depends on LEG-1
3. LEG-3 (Squares - Shell, audio, and game assets) - depends on LEG-1 and LEG-2

After all complete: apply deferred edits -> `pnpm sync:attributions` -> `pnpm test:local` -> commit -> push.

## Implementation
Commit: abc7e105b216c4a34a641f361a0a2d7d463cd4f7
Pushed: yes (origin/main)

## Critique
Date: 2026-04-14

### What Worked
- Rules engine solid: plus/X patterns, edge clipping, reverse-scrambled easy boards, per-bucket high scores, restart all correct.
- All deferred shared edits landed: registry, routes, build, all e2e suites, attributions.
- Settings correct: preset, ruleset, theme high-score bucket update together and persist.
- Input breadth: keyboard, right-click, long-hold touch, gamepad all wired with roving tabindex.
- Accessibility live regions wired; move/pattern-change/restart/win all announced.

### What Didn't
1. **Board invisible on small portrait screens (blocker).** Dual-toolbar stacking — SSR GameHeader pills (~150px) + renderer toolbar (~122px) — consumed nearly all viewport at 445px height; board measured 3px visible. Root cause: renderer toolbar included a full title/moves/score block duplicating the SSR HUD pills. Fix: collapsed renderer toolbar to controls-only (Pattern + Restart); removed redundant `hud-high-score-context` row from game panel; updated grid-template-rows to 2 rows.
2. **iOS long-press triggers native copy callout (high).** Board cells lacked `-webkit-touch-callout: none; user-select: none`. Fix: added to `.squares-board-cell` in injected runtime styles.
3. **Chill music too prominent (medium).** Shared music bus gain 0.20 × per-event gains 0.06–0.10 reads as foreground. Fix: reduced chill profile event gains ~35% (max 0.065 → previously 0.1).
4. **Settings discoverability on mobile (medium).** Preset/ruleset selectors hidden inside modal, not discoverable without exploring. Flagged as design question — no code fix this cycle; tracked in Field Review Holding List.

### Chart Gaps
1. **No minimum board-area floor.** Workshop listed viewport sizes but not a concrete "playfield ≥ N% of remaining height" checkpoint. Corrected in `gnd-chart/LOCAL.md` and `game-quality.md`.
2. **iOS long-hold mechanics omitted from spec.** Leg specified long-hold threshold and pointercancel but not the required UA callout suppression. Corrected in `gnd-chart/LOCAL.md` and `game-quality.md`.
3. **Music bus gain not specified.** "Chill default" intent wasn't translated into an ambient-volume target. Corrected in `gnd-chart/LOCAL.md`.

### User Effectiveness
- "Classic Hybrid vs easy modes" distinction well-described in User Intent but not mapped to start-screen UX discoverability — only to a settings field. Worth specifying discoverability expectations at chart time for primary mechanism selectors.
- Visual checkpoints should name a pass/fail metric (e.g., "board fills ≥50% of remaining viewport height"), not just a breakpoint list.

### Corrections for Next Cycle
- gnd-chart/LOCAL.md: viewport floor + iOS touch spec + ambient-volume spec + visual verification note (created)
- gnd-navigator.local.md: visual-legs review rule (created)
- game-quality.md: viewport floor rule + iOS touch-callout rule (updated)

### Field Review Holding List
- Settings discoverability: preset/ruleset selectors inside modal only — consider inline quick-change on start screen