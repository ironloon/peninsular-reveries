# Plan: Game Polish & Consistency — Chompers Art, Pixel Passport Overhaul, Cross-Game Standards

## Project Context
- Sources:
  - `README.md` - source of truth for project principles and site values
  - `AGENTS.md` - workflow, validation, and environment expectations
  - `.agents/skills/gnd-chart/SKILL.md` - current plan structure used for archive preservation
  - `.agents/skills/gnd-critique/SKILL.md` - current critique and archive expectations
- Constraints:
  - This is a preserved historical plan archive migrated from repo memory into the current workspace archive.
  - Structural updates are limited to current gnd section names, leg identifiers, dependency references, and archive headings.
  - Preserve the original plan scope, implementation record, critique content, and holding list.
- Full validation:
  - `pnpm sync:attributions`
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

The user wants to bring the quality, responsiveness, and structural patterns established in Super Word to the other three games. The central priorities are: (1) rework the Chompers hippo from its current side-view `scaleX` stretched design back to a front-facing, bottom-centered hippo that slides under targets and extends its neck straight up to chomp — preserving player color choice and making frenzy NPC hippos full mini-hippos along the bottom; (2) deep-dive Pixel Passport to fix inaccurate art, typos, rough game loop (ditch mystery mode for now), and visual polish; (3) light refinement of Mission Orbit (remove auto-advance, user-controlled pacing); (4) migrate Chompers and Pixel Passport to use the shared modal/preferences infrastructure; (5) add per-game smoke tests to catch rendering failures.

## Legs

### LEG-1: Chompers — Hippo art & movement rework
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `games/chompers/animations.ts`
  - `games/chompers/renderer.ts`
  - `games/chompers/controller.tsx`
  - `public/styles/chompers.css`
- Read-only:
  - `games/chompers/types.ts` — hippo state types, color picker types, NPC hippo types
  - `games/chompers/state.ts` — hippo state management, frenzy state
  - `games/chompers/main.ts` — how animation results are consumed
  - `games/chompers/input.ts` — gamepad hippo movement
- Deferred shared edits:
  - Delete `public/chompers/hippo-head.svg` — no longer needed
- Verification: `npx tsc --noEmit -p config/tsconfig.json && node --import tsx --test games/chompers/state.test.ts games/chompers/problems.test.ts`
- Intent: |
    Rework the Chompers hippo from the current side-view horizontal-stretch design to a front-facing, bottom-centered all-CSS hippo with vertical neck extension.

    **Current state (what to replace):**
    - Side-view hippo at left edge: purple CSS body (`clip-path: polygon(...)`) + separate green SVG head (`/chompers/hippo-head.svg`)
    - Horizontal neck stretch via `scaleX(calc(1 + var(--neck-extension)))` with `transform-origin: left center`
    - Head counter-scales via `scaleX(calc(1 / (1 + var(--neck-extension))))` to prevent distortion
    - `atan2(dy, dx)` rotation calculates angle from hippo to target
    - Hippo stays at fixed left position

    **New design:**
    1. **Positioning**: Hippo sits at bottom-center of the arena, facing the player (front-on view like looking at a hippo in a pool from above).
    2. **Movement**: When player selects an answer item, the hippo slides horizontally along the bottom to position directly below/near that item. Use CSS `left` property with `transition: left 200ms ease-out`.
    3. **Chomp**: After sliding into position, neck extends straight UP toward the item using `--neck-height` CSS variable. Jaw opens (`.hippo-jaw` rotates or translates down). Timing: slide to position (200ms) → neck extend + jaw open (300ms) → jaw close (at 500ms) → necket (at 700ms) → outcome feedback (600ms more).
    4. **CSS structure**: All-CSS construction, NO external SVG. Elements:
       - `.hippo` container (absolute positioned, bottom of arena)
       - `.hippo-body` (rounded rectangle or soft polygon, the main bulk)
       - `.hippo-neck` (rectangle that grows via height, `transition: height 0.3s ease-out`)
       - `.hippo-head` (rounded top with ears, eyes, nostrils)
       - `.hippo-ear-left`, `.hippo-ear-right` (small rounded shapes on top of head)
       - `.hippo-eye-left`, `.hippo-eye-right` (white circles with dark pupils)
       - `.hippo-nostril-left`, `.hippo-nostril-right` (small dark ovals)
       - `.hippo-jaw` (hinged piece that rotates open via `--jaw-angle`)
       - `.hippo-tooth-left`, `.hippo-tooth-right` (small white rectangles)
    5. **Color**: Driven by `--hippo-color` CSS custom property (player's chosen color). Derive body, neck, ears, jaw tones from this base via `color-mix()` or manual shading. The green `#8BC34A` family from the old SVG head is a good default. Provide 4-6 preset colors in the color picker.
    6. **Frenzy NPC hippos**: Same `.hippo` structure but smaller (60% scale via `transform: scale(0.6)`). All positioned along the bottom. Each has its own `--hippo-color` from the NPC color pool. They slide and extend independently toward their targets. Render 1/3/5 NPC hippos based on frenzy config. Avoid player's chosen color.

    **`animations.ts` changes:**
    - `animateHippoChomp()`: Remove `atan2` angle calculation and `--neck-angle` rotation. Instead:
      (a) Set hippo `left` to align under target item's x% position
      (b) Wait for slide transition (200ms)
      (c) Set `--neck-height` to reach toward target's y% position
      (d) Open jaw (`--jaw-angle: 1`)
      (e) Close jaw at 500ms (`--jaw-angle: 0`)
      (f) Retract neck at 700ms (`--neck-height` back to default)
      (g) Apply outcome class (correct/wrong) for 600ms
    - Keep reduced-motion path: jaw only, no slide or neck extend.

    **`renderer.ts` changes:**
    - `renderHippo()`: Update to set `left` position and `--neck-height` (not `--neck-extension` and `--neck-angle`)
    - `renderNpcHippos()`: Update NPC positioning to be along bottom axis, set size via scale

    **`controller.tsx` changes:**
    - Replace `#hippo` HTML: remove `<img>` SVG reference, build full CSS hippo structure (body, neck, head with ears/eyes/nostrils, jaw with teeth). Keep `aria-hidden="true"`.
    - NPC hippo elements: give them the same inner structure (or simplified version) instead of empty `<div>`s

    **`chompers.css` changes:**
    - Rewrite `.hippo` section: bottom-centered positioning, vertical neck growth, jaw rotation
    - `.hippo-neck`: `height: var(--neck-height, 20px)`, `transition: height 0.3s ease-out`, vertical orientation
    - `.hippo-head`: positioned on top of neck, contains facial features
    - `.hippo-jaw`: `transform-origin: top center`, `transform: rotateX(calc(var(--jaw-angle, 0) * 15deg))` or translateY
    - `.npc-hippo`: scale(0.6), same structure, positioned along bottom
    - Remove all `--neck-extension`, `--neck-angle`, `scaleX` rules

    **Constraints:**
    - Budget: ≤150KB JS, ≤60KB CSS, ≤400KB total per game page
    - Full-screen layout, no document scroll, `100dvh`, safe-area padding
    - Respect `isReducedMotion()` — reduced motion path skips slide and neck extend
    - 4 viewport checkpoints: 390×844, 844×390, 1024×768, 1280×800
    - Hippo + NPC hippos must fit and be visible at all viewport sizes. Scale down on small screens.

### LEG-2: Chompers — Shared component migration
- Status: done
- Confirmed: yes
- Depends on: LEG-1
- Thinking effort: low
- Owned files:
  - `games/chompers/renderer.ts`
  - `games/chompers/main.ts`
- Read-only:
  - `client/modal.ts` — shared `setupTabbedModal()` to migrate to
  - `client/preferences.ts` — shared toggle bind functions
  - `games/super-word/main.ts` — reference for how Super Word wires modal and preferences
  - `games/chompers/controller.tsx` — verify HTML structure has expected IDs/roles
- Verification: `npx tsc --noEmit -p config/tsconfig.json`
- Intent: |
    Replace Chompers' custom `setupSettingsModal()` in `renderer.ts` with the shared `setupTabbedModal()` from `client/modal.ts`.

    **What to remove from `renderer.ts`:**
    - The entire `setupSettingsModal()` function (~80 lines) including its `SettingsModalController` interface
    - The `getFocusableElements()` helper (only used by the custom modal)
    - The `setupZoomReset()` function (if it's only called from setupSettingsModal; check if it's used elsewhere)
    - The `bindReduceMotionToggle` import (will be handled differently)

    **What to add in `main.ts`:**
    - Import `setupTabbedModal` from `../../client/modal.js`
    - Import `bindMusicToggle`, `bindSfxToggle`, `bindReduceMotionToggle` from `../../client/preferences.js`
    - Call `const modal = setupTabbedModal('settings-modal')` during init
    - Call bind functions for each toggle input element (music, SFX, reduce-motion), matching the pattern in Super Word's `main.ts`
    - Wire `modal.toggle()` to the gamepad Start button handler (check `input.ts` for where `settingsModal.open()` is called and update to use the new modal reference)
    - Expose `window.__settingsToggle = modal.toggle` for gamepad integration (same as Super Word)

    **What to keep/verify:**
    - The controller.tsx already renders `GameTabbedModal` which produces the expected HTML (`role="dialog"`, `role="tab"`, `role="tabpanel"`, `data-settings-open` triggers, `settings-close-btn` button). Verify IDs match what `setupTabbedModal` expects: modal element ID `settings-modal`, close button ID `settings-close-btn`, triggers with `data-settings-open="true"`.
    - If the controller uses different IDs, update the controller HTML to match or pass custom IDs to `setupTabbedModal()`.

    **Restart/Quit behavior:**
    - The shared modal dispatches a `'restart'` custom event when the Restart button is clicked. Verify Chompers' `main.ts` listens for this event (or add a listener) to handle game restart.

### LEG-3: Pixel Passport — Game loop & content overhaul
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `games/pixel-passport/state.ts`
  - `games/pixel-passport/types.ts`
  - `games/pixel-passport/destinations.ts`
  - `games/pixel-passport/art.ts`
  - `games/pixel-passport/renderer.ts`
  - `games/pixel-passport/controller.tsx`
  - `games/pixel-passport/main.ts`
  - `games/pixel-passport/input.ts`
  - `games/pixel-passport/animations.ts`
  - `games/pixel-passport/accessibility.ts`
- Read-only:
  - `games/pixel-passport/sounds.ts` — audio hooks (don't change but be aware of them)
  - `games/pixel-passport/info.ts` — game summary (update needed in deferred edits)
  - `app/ui/game-shell.tsx` — shared components to use
  - `client/modal.ts` — shared modal
  - `client/preferences.ts` — shared preferences
- Deferred shared edits:
  - `games/pixel-passport/info.ts` — update summary to remove mystery mode references
  - `games/pixel-passport/attributions.ts` — update if any attribution entries reference mystery mode
- Verification: `npx tsc --noEmit -p config/tsconfig.json && node --import tsx --test games/pixel-passport/destinations.test.ts games/pixel-passport/art.test.ts games/pixel-passport/state.test.ts`
- Intent: |
    Overhaul Pixel Passport's game loop, content quality, and pixel art. Remove mystery mode. Fix typos and inaccuracies.

    **1. Remove mystery mode:**
    - `types.ts`: Remove `MysteryState`, `MysteryTarget`, `mystery-screen`, `mystery-result-screen` from screen/phase types. Remove mystery-related fields from `GameState` (e.g., `mysteryTarget`, `mysteriesCompleted`, `mysteryGuesses`). Keep explore + travel + memory collection as the core loop.
    - `state.ts`: Remove `startMystery()`, `guessMystery()`, `resolveMystery()` and related state transitions. Simplify screen flow to: start → globe → travel → explore → memory → room (shelf) → back to globe.
    - `controller.tsx`: Remove `#mystery-screen` and `#mystery-result-screen` sections and their content. Remove any mystery-mode toggle/button from the start screen.
    - `renderer.ts`: Remove `renderMystery*()` functions. Remove mystery marker group updates.
    - `main.ts`: Remove mystery event handlers and screen transitions.
    - `input.ts`: Remove mystery-related input handlers.

    **2. Fix game loop clarity:**
    - The core loop should be: Globe (pick destination) → Travel (animated journey) → Explore (see the place, read a fact) → Collect Memory (token earned) → Return to Globe (see progress on shelf).
    - The "room" screen (memory shelf) should be accessible from the globe screen as a button ("My Memories" or similar), not a forced step.
    - Make the loop feel complete: after collecting a memory, show brief celebration, then return to globe with the new marker checked off.
    - Consider showing a "journey complete" screen when all destinations are visited.

    **3. Fix typos and copy:**
    - Audit ALL text in `destinations.ts`: destination names, country names, facts[], clues[] (remove clues since mystery mode is gone). Fix "mysterys" and any other typos.
    - Facts should be accurate real-world information, written at ~level-1 reading level. Short sentences, simple words.
    - Remove `clues` field from destination data entirely (was for mystery mode).

    **4. Rework pixel art:**
    - The current pixel art uses 20×14 grids with single-digit palette indices. The art is too abstract to be recognizable.
    - For each destination, redesign the scene art to be more identifiable:
      - Paris: Eiffel Tower silhouette should be taller and more pointed, surrounded by trees
      - Cairo: Pyramids should be more triangular with golden sand, maybe a sphinx silhouette
      - Tokyo: Cherry blossoms + red torii gate or pagoda
      - New York: Statue of Liberty or skyline with Brooklyn Bridge
      - Rio: Christ the Redeemer statue on mountain + green hills
      - Sydney: Opera House with distinctive sail shapes against harbor
      - Nairobi: Savanna landscape with acacia tree silhouette + wildlife hint
      - Reykjavik: Northern lights over snowy mountains
      - Beijing: Great Wall segments or Temple of Heaven
    - Keep the 20-wide grid but potentially increase height to 16-18 rows for more detail.
    - Keep palette to 6-7 colors per scene (existing constraint).
    - Each scene should be immediately recognizable to a child who has seen pictures of these places.

    **5. Pip art audit:**
    - Pip sprites (wave, guide, cheer, think) are 6×8 pixel art. Check they look good and are correctly proportioned. Fix any that look off.

    **Constraints:**
    - Budget: ≤150KB JS, ≤60KB CSS, ≤400KB total per page
    - Full-screen layout, no document scroll
    - State is pure immutable functions
    - Pacing: calm, user-controlled. No timing-based failure.
    - Reading level: ~level-1 for in-game copy
    - Accessibility: `#game-status` (polite) and `#game-feedback` (assertive) live regions
    - Motion: respect `isReducedMotion()`

### LEG-4: Pixel Passport — Visual polish & responsive
- Status: done
- Confirmed: yes
- Depends on: LEG-3
- Thinking effort: medium
- Owned files:
  - `public/styles/pixel-passport.css`
- Read-only:
  - `games/pixel-passport/controller.tsx` — verify class names and structure after LEG-3 changes
  - `games/pixel-passport/renderer.ts` — verify screen IDs and dynamic classes
- Verification: `npm run build 2>&1`
- Intent: |
    Polish Pixel Passport's CSS across all remaining screens (start, globe, travel, explore, memory, room) at all 4 viewport checkpoints.

    **Screens to verify and polish (mystery screens are now removed by LEG-3):**
    1. **Start screen**: Stats pills layout (memories collected, destinations visited), guide card intro, action buttons. Ensure balanced spacing and readable text at all sizes.
    2. **Globe screen**: Marker size and tap targets (minimum 44px touch target), globe pixel art sizing, guide card positioning. On landscape phone (844×390) the globe + sidebar should not clip.
    3. **Travel screen**: Vehicle animation smoothness, parallax layer alignment, guide card readability over moving background. Status text ("almost there" etc.) contrast.
    4. **Explore screen**: Destination scene pixel art display size, fact card readability, visual theme application (sky colors, accent, horizon). Ensure facts are readable on dark backgrounds.
    5. **Memory screen**: Token display (emoji + label), guide card celebration text, transition in/out.
    6. **Room screen (shelf)**: Grid column count should scale smoothly (2 col phone portrait → 3 col tablet → 4-5 col desktop). Collected vs uncollected items visual distinction.

    **Global polish:**
    - Consistent border-radius across cards and panels
    - Consistent shadow depth (inner glow on globe, card elevation, etc.)
    - Consistent transition timing (use site-standard 520ms cubic-bezier for screen transitions, 200-300ms for interactive feedback)
    - Remove any CSS that referenced mystery screens (`.mystery-*` selectors)
    - Ensure all interactive elements have `:focus-visible` outlines
    - Ensure `[data-reduce-motion="reduce"]` disables globe spin animation and travel parallax

    **Constraints:**
    - Full-screen, no scroll, 100dvh, safe-area
    - 4 viewports: 390×844, 844×390, 1024×768, 1280×800
    - ≤60KB CSS budget

### LEG-5: Pixel Passport — Shared component migration
- Status: done
- Confirmed: yes
- Depends on: LEG-3
- Thinking effort: low
- Owned files:
  - `games/pixel-passport/main.ts`
- Read-only:
  - `client/modal.ts` — shared `setupTabbedModal()`
  - `client/preferences.ts` — shared toggle bind functions
  - `games/super-word/main.ts` — reference for wiring pattern
  - `games/pixel-passport/renderer.ts` — check if it has custom modal code to remove
  - `games/pixel-passport/controller.tsx` — verify GameTabbedModal HTML produces expected IDs
- Verification: `npx tsc --noEmit -p config/tsconfig.json`
- Intent: |
    Wire Pixel Passport to use the shared `setupTabbedModal()` from `client/modal.ts` and shared preference bindings.

    **In `main.ts`:**
    - Import `setupTabbedModal` from `../../client/modal.js`
    - Import `bindMusicToggle`, `bindSfxToggle`, `bindReduceMotionToggle` from `../../client/preferences.js`
    - Call `const modal = setupTabbedModal('settings-modal')` during init
    - Call bind functions for toggle inputs
    - Expose `window.__settingsToggle = modal.toggle` for gamepad integration
    - Wire any gamepad Start button to `modal.toggle()`

    **Check `renderer.ts`:**
    - If renderer.ts has any custom modal setup code (like Chompers had), remove it.
    - If `showScreen()` uses `setTimeout` for cleanup, consider upgrading to match Super Word's approach (but this is lower priority — if the current approach works, leave it).

    **Verify controller.tsx HTML:**
    - Confirm `GameTabbedModal` renders with `id="settings-modal"`, close button `id="settings-close-btn"`, triggers with `data-settings-open="true"`. Update if needed.

### LEG-6: Mission Orbit — Refinement
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `games/mission-orbit/renderer.ts`
  - `games/mission-orbit/controller.tsx`
  - `games/mission-orbit/main.ts`
  - `games/mission-orbit/state.ts`
  - `games/mission-orbit/types.ts`
  - `public/styles/mission-orbit.css`
- Read-only:
  - `games/mission-orbit/input.ts` — interaction handlers
  - `games/mission-orbit/accessibility.ts` — announcements
  - `games/mission-orbit/sounds.ts` — audio hooks
  - `client/modal.ts` — verify modal wiring
  - `client/preferences.ts` — verify preference bindings
- Verification: `npx tsc --noEmit -p config/tsconfig.json && node --import tsx --test games/mission-orbit/state.test.ts games/mission-orbit/sample-manifest.test.ts`
- Intent: |
    Remove auto-advance timers and add user-controlled pacing. Light visual polish.

    **1. Remove auto-advance:**
    - Currently briefing phases auto-advance after 2.5s and cinematic phases after 3s (check `main.ts` and `state.ts` for timer logic).
    - Replace ALL auto-advance timers with explicit user action: display a "Tap to continue" / "Press any key" prompt at the bottom of the briefing/cinematic panels.
    - Player taps/clicks/presses any key to advance to the next phase.
    - This matches the project's pacing principle: "calm, user-controlled, no timing-based failure."

    **2. "Continue" prompt:**
    - Add a subtle prompt element to the narrative pane: "Tap to continue →" or similar, appearing after the text is fully rendered.
    - Style: small, muted, bottom of narrative pane. Gentle fade-in (300ms delay + 200ms opacity transition).
    - On reduced motion: show immediately without fade.

    **3. Interaction controls polish:**
    - Hold progress bar: ensure it has a visible border/track so the empty state is clear
    - Tap counter ("X / Y"): ensure readable sizing on small viewports
    - Tap button: verify minimum 44px touch target on all viewports

    **4. Narrative pane layout:**
    - On 1-column layout (< 600px), ensure briefing text doesn't clip
    - On landscape phone (844×390), the 2-column split might be too cramped — check and adjust column ratio if needed
    - Ensure scene title text doesn't clip or overflow on narrow viewports

    **5. Cinematic pane:**
    - Current CSS gradients per scene are static. Add a subtle breathing animation to the gradients (very slow hue shift or opacity pulse, 8-10s cycle) to make scenes feel less dead.
    - Respect reduced motion: disable breathing animation.

    **6. Verify shared component wiring:**
    - Mission Orbit already uses `GameTabbedModal`. Verify it's wired to `setupTabbedModal()` and shared preference bindings (music, SFX, reduce-motion). If not, fix.

    **Constraints:**
    - Pacing: calm, user-controlled. NO auto-advance. Player controls every transition.
    - Full-screen, no scroll, 100dvh, safe-area padding
    - 4 viewports: 390×844, 844×390, 1024×768, 1280×800
    - Accessibility: live regions for phase announcements
    - Motion: respect isReducedMotion()

### LEG-7: Cross-game — E2E & smoke tests
- Status: done
- Confirmed: yes
- Depends on: LEG-1, LEG-2, LEG-3, LEG-4, LEG-5, LEG-6
- Thinking effort: medium
- Owned files:
  - `e2e/site-01-responsive.spec.ts`
  - `e2e/site-02-navigation.spec.ts`
  - `e2e/site-03-semantic-html.spec.ts`
  - `e2e/site-04-accessibility.spec.ts`
  - `e2e/site-07-game-smoke.spec.ts` (new file)
- Read-only:
  - `games/chompers/controller.tsx` — verify changed selectors
  - `games/pixel-passport/controller.tsx` — verify changed selectors (mystery removed)
  - `games/mission-orbit/controller.tsx` — verify changed selectors
  - `config/playwright.config.ts` — test runner config
- Verification: `npx playwright test --reporter=list 2>&1`
- Intent: |
    Update e2e tests for changed DOM structures and add per-game smoke tests.

    **1. Update existing e2e specs:**
    - `site-01-responsive.spec.ts`: Verify Chompers, Pixel Passport, Mission Orbit pages still pass responsive checks. Update any selectors that changed (hippo structure, mystery screen removal, new "continue" prompt).
    - `site-02-navigation.spec.ts`: Verify game page navigation still works. Remove any mystery-mode navigation assertions.
    - `site-03-semantic-html.spec.ts`: Verify semantic structure still valid after DOM changes.
    - `site-04-accessibility.spec.ts`: Verify aria attributes on new hippo elements, removed mystery screens, new continue prompts.

    **2. Add per-game smoke tests (new file `site-07-game-smoke.spec.ts`):**
    Create a new spec file with lightweight smoke tests for each game:

    **Chompers smoke test:**
    - Navigate to `/chompers/`
    - Verify start screen is visible (heading "Chompers" visible)
    - Verify start button is clickable
    - Click "Start" button
    - Verify game screen becomes visible (arena element visible)
    - Verify hippo element is present and visible (not zero-size)
    - Verify at least one scene item (answer choice) is rendered

    **Pixel Passport smoke test:**
    - Navigate to `/pixel-passport/`
    - Verify start screen visible
    - Click start/explore button
    - Verify globe screen appears with destination markers
    - Verify at least one marker is clickable

    **Mission Orbit smoke test:**
    - Navigate to `/mission-orbit/`
    - Verify start screen visible
    - Click start button
    - Verify game screen appears with narrative content
    - Verify "continue" prompt appears (since briefing no longer auto-advances)

    **Super Word smoke test (for completeness):**
    - Navigate to `/super-word/`
    - Verify start screen visible
    - Click play button
    - Verify game screen appears with canvas element that has non-zero dimensions

    **Naming pattern:** Follow existing `site-NN-*.spec.ts` convention. Each test should complete in < 10s.

    **Testing constraints:**
    - Use Playwright, follow `config/playwright.config.ts` configuration
    - Tests run local-only (not CI)
    - Each smoke test should verify "the game loads and renders something visible," not gameplay mechanics

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

1. LEG-1 (Chompers hippo art rework) — no dependencies
2. LEG-3 (Pixel Passport game loop overhaul) — no dependencies, can parallel with LEG-1
3. LEG-6 (Mission Orbit refinement) — no dependencies, can parallel with LEG-1 and LEG-3
4. LEG-2 (Chompers shared modal migration) — depends on LEG-1
5. LEG-4 (Pixel Passport CSS polish) — depends on LEG-3
6. LEG-5 (Pixel Passport shared modal migration) — depends on LEG-3
7. LEG-7 (E2E & smoke tests) — depends on all above

After all complete: apply deferred edits (delete hippo-head.svg, update info.ts, update attributions.ts) → `pnpm sync:attributions` → `pnpm test:local` → commit → push.

## Implementation
Commit: 814179e
Pushed: 2026-04-07

## Critique

Completed: 2026-04-08
Evaluated by: user + agent (interactive review)

### What Worked
- Mystery mode removal (LEG-3) landed cleanly — types, state, renderer, tests all consistent.
- Auto-advance removal (LEG-6) correctly implemented — timers removed, click/keyboard handlers added, continue prompt with reduced-motion guard.
- Shared modal migration (LEG-2/5) eliminated custom modal code in both games.
- Commit hygiene: single well-scoped commit, descriptive message, CI green.
- Deferred edits (SVG deletion, info/attributions updates) all applied.

### What Didn't
1. **Chompers hippo doesn't slide or extend neck (Bug, high).** `#hippo` CSS lacks `transform: translateX(-50%)`, so `left` positions the left edge, not the center. Neck extension via `--neck-height` is technically functional but visually broken by misalignment.
2. **Hippo face mispositioned / head orientation wrong (Bug, high).** `flex-direction: column-reverse` + head→neck→body ordering renders body→neck→head. Jaw opens downward (toward player) but user expected mouth to face upward toward food targets.
3. **NPC hippos don't animate (Bug, medium).** `renderNpcHippos()` sets `--hippo-x` but never sets `--neck-height`. `animateNpcChomp()` only toggles a CSS class, no neck/jaw animation.
4. **Pixel Passport "0 memorys" (Bug, medium).** `formatCount()` appends 's' for all non-1 counts; doesn't handle irregular "memory"→"memories".
5. **Pixel Passport art quality (UX, high).** Agent-generated numeric arrays remain abstract. Creative-assets skill was not used.
6. **Pixel Passport small viewport overflow (Bug, medium).** `.passport-panel` uses `overflow: hidden`, clipping interactive elements on iPhone 17 portrait (390×844).
7. **Mission Orbit cinematic art invisible (Bug, high).** CSS gradients are extremely dark/low-contrast. Pane has no visible content children — just a faint background.
8. **Modal UX inconsistencies (UX, medium).** Restart/Quit styling poor, Info tab too long without link to info page, emoji section headers unwanted, sections scroll when they shouldn't.
9. **Smoke tests don't verify visibility (Testing, medium).** Tests use `toBeVisible()` but don't check bounding boxes are within viewport.

### Compose Gaps
1. **Pixel art quality.** Creative-assets skill exists but wasn't referenced. Compose drafted "rewrite numeric arrays" instead of routing through asset workflow. Failed phase: Draft.
2. **Head orientation ambiguity.** Intent said "front-facing, bottom-centered" but didn't specify mouth direction. Failed phase: Workshop — visual design question not surfaced.

### User Effectiveness
- Original prompt was clear about hippo direction. Implementation diverged on head orientation detail — a reference image or explicit "mouth faces up" during workshop would have caught it.
- "Art is terrible" is a recurring pattern: agent-generated artistic content underperforms. Explicitly calling out "use creative-assets skill for art" during alignment would help compose route correctly.
- Smoke test visibility concern is a strong recurring signal across multiple review cycles.

### Corrections for Next Cycle
- **Plan-level:** Visual art legs must reference the creative-assets skill or `generate-pixel-art.ts` with iteration steps. Do not assign freeform pixel art to code performers.
- **Plan-level:** CSS visual design legs must include a "visual checkpoint" describing expected appearance at key states (idle, animating, complete).
- **Plan-level:** If NPCs share the player character's structure, explicitly state whether they animate identically or are static.
- **Process-level:** Navigator post-dispatch review should verify irregular noun handling when intent mentions "fix typos."
- **Process-level:** Smoke tests should include "visibility-within-viewport" assertion: key interactive elements have bounding boxes within viewport bounds.
- **Skill-level:** Compose skill should require that visual art legs reference the creative-assets skill.
- **Skill-level:** Testing references should list "visibility-within-viewport" as a smoke test requirement.

### Field Review Holding List
- NPC hippo size: user prefers same size as player hippo, not 60% scale. (Design question — user decides.)