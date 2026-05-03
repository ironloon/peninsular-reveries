# Plan: Story Trail Loop Plus Travel-Game Polish

## Project Context
- Sources:
  - `README.md` - source of truth for game principles and site values
  - `AGENTS.md` - repo workflow, planning overlays, validation gates, and environment expectations
  - `.agents/skills/gnd-chart/SKILL.md` - current gnd plan structure and `.planning/` location
- Constraints:
  - This plan preserves the existing scope and intent while using the current gnd leg format.
  - Follow repo expectations for calm pacing, accessibility, controller support, responsive checkpoints, and existing shared game-shell behavior.
  - Use `pnpm`-based repo commands for validation and handoff.
- Full validation:
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

You want a focused polish pass across Story Trail, Pixel Passport, and Mission Orbit, aimed at removing interaction awkwardness rather than doing broad rewrites. Story Trail should get a lightweight equip-based inventory loop so items are actively selected before relevant choices. Pixel Passport should feel replayable and less odd by clearing saved memories on restart, letting the current place be revisited without fake travel, keeping the travel vehicle readable, and fixing controller play. Mission Orbit should make its cinematic motion read correctly and become playable on controller from start to finish.

## Legs

### LEG-1: Story Trail - Interactive Inventory Loop
- Status: done
- Confirmed: yes
- Goal link: Make Story Trail inventory part of the active scene loop by requiring the player to equip the relevant item before an item-gated choice succeeds.
- Depends on: none
- Owned files:
  - `games/story-trail/types.ts`
  - `games/story-trail/state.ts`
  - `games/story-trail/renderer.ts`
  - `games/story-trail/input.ts`
  - `games/story-trail/main.ts`
  - `games/story-trail/accessibility.ts`
  - `public/styles/story-trail.css`
- Read-only:
  - `games/story-trail/controller.tsx` - current screen structure, control copy, and inventory-overlay host markup
  - `games/story-trail/story-weather.ts` - representative required-item and grants-item story pattern
  - `games/story-trail/story-plants.ts` - representative chained item-gated story pattern
  - `games/story-trail/story-habitats.ts` - representative multi-item story pattern
  - `games/story-trail/story-helpers.ts` - representative helper-badge gating pattern
  - `games/story-trail/story-senses.ts` - representative single-tool gating pattern
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/story-trail/types.ts games/story-trail/state.ts games/story-trail/renderer.ts games/story-trail/input.ts games/story-trail/main.ts games/story-trail/accessibility.ts public/styles/story-trail.css`
- Intent: (1) Extend the Story Trail state model with an equipped item field separate from `inventory`, and reset or clear it in `createInitialState()`, `startStory()`, `completeStory()`, and `returnToTrailMap()`. When a choice grants a new item, keep the item persistent in `inventory` but auto-equip it so the loop stays calm and obvious. (2) Change `makeChoice()` so `requiredItemId` checks the equipped item instead of mere possession, while still using short level-1-reading hints and gentle feedback. If the player owns the needed item but has not equipped it, return a hint that teaches the equip action instead of a generic failure. State transitions must remain pure and immutable. (3) Rebuild the scene inventory bar and bag overlay as native `<button>` controls with `aria-pressed`, 44px minimum touch targets, and a shared selected state between bar and overlay. The user-chosen rule is selection-only equip: clicking an item equips/highlights it, but does not directly fire the scene action. (4) Update `input.ts` and `main.ts` so touch, keyboard, and gamepad can still reach both the choices and the inventory controls without breaking the existing calm story pacing. Preserve the current full-screen layout, no document scroll on game screens, and the existing `data-active-screen` activation model. (5) Add accessibility announcements for equipping or clearing an item so the live-region feedback matches the visible state. Visual checkpoint: on both `390x844` and `844x390`, the selected inventory chip is clearly highlighted, mirrors in the bag overlay, and remains obviously tappable without clipping the choice list.

### LEG-2: Story Trail - Guidance And Regression Coverage
- Status: done
- Confirmed: yes
- Goal link: Teach the new equip-before-choice loop explicitly and lock it in with Story Trail-specific tests.
- Depends on: LEG-1
- Owned files:
  - `games/story-trail/controller.tsx`
  - `games/story-trail/state.test.ts`
  - `e2e/site-08-story-trail.spec.ts`
- Read-only:
  - `games/story-trail/main.ts` - callback names and scene flow the tests must exercise
  - `games/story-trail/renderer.ts` - inventory button structure and scene DOM ids the e2e spec should target
- Deferred shared edits:
  - none
- Verification: `node --import tsx --test games/story-trail/state.test.ts && pnpm exec playwright test --config config/playwright.config.ts e2e/site-08-story-trail.spec.ts`
- Intent: (1) Update the visible Story Trail controls/help copy in `controller.tsx` so first-time players are told, in short child-friendly language, that they can tap an item in the scene bar or bag to equip it before using the matching choice. Do not add new menu sections or shared-shell changes. (2) Expand `games/story-trail/state.test.ts` with explicit assertions for: equipped item selection, item-grant auto-equip behavior, item-gated choices requiring the equipped item instead of passive possession, persistent inventory after use, and equipped-item reset on story start/complete/quit. (3) Expand `e2e/site-08-story-trail.spec.ts` with visible happy paths that use real interactions: collect an item, equip it from the scene inventory bar, confirm the selected state mirrors into the bag overlay, verify the correct item enables the gated choice while the unequipped state still blocks it, and keep at least one completion path alive. Use `click`, keyboard input, and `toBeVisible()` or `toBeInViewport()` on active scene UI instead of DOM-event shortcuts.

### LEG-3: Pixel Passport - Reset, Travel, And Globe Polish
- Status: done
- Confirmed: yes
- Goal link: Make Pixel Passport replay-friendly and less awkward by removing stale memory carryover, turning same-place selection into a revisit flow instead of fake travel, improving travel readability, and fixing controller interaction.
- Depends on: none
- Owned files:
  - `games/pixel-passport/main.ts`
  - `games/pixel-passport/state.ts`
  - `games/pixel-passport/renderer.ts`
  - `games/pixel-passport/input.ts`
  - `games/pixel-passport/controller.tsx`
  - `games/pixel-passport/accessibility.ts`
  - `public/styles/pixel-passport.css`
- Read-only:
  - `games/pixel-passport/types.ts` - current phase model, location fields, and destination id types
  - `games/pixel-passport/destinations.ts` - destination ids, names, and transport selection rules
  - `games/pixel-passport/art.ts` - vehicle sprite sizes and proportions when increasing travel-stage readability
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/pixel-passport/main.ts games/pixel-passport/state.ts games/pixel-passport/renderer.ts games/pixel-passport/input.ts games/pixel-passport/controller.tsx games/pixel-passport/accessibility.ts public/styles/pixel-passport.css`
- Intent: (1) Remove the stale-memory restart/persistence behavior at the root: a Pixel Passport restart should be a true fresh run, and browser refresh should not restore old collected memories. Update the load/save path in `main.ts` and any helper state functions so the game no longer resumes old memory shelves after a restart or refresh. (2) Change the globe flow so choosing the current location does not trigger `announceTravel()` or the travel screen. Instead, treat it as a revisit: reopen that destination's fact flow directly, keep the current location coherent, and use a friendly accessible announcement that tells the player they are reading that place again rather than leaving and arriving at the same city. (3) Fix the controller path in `input.ts` by replacing brittle gamepad polling with array-safe polling and phase-aware actions that work in title, globe, revisit/travel selection, room, and menu states. Maintain repo input rules: D-pad navigation, A/Button-0 for select, Start/Button-9 for menu. (4) Update the globe renderer and controller copy so the current place reads as "you are here" but is still revisit-able, and keep pointer, keyboard, and controller behavior consistent. (5) Improve `travel-stage` layering, contrast, and placement so the bus/train/boat/plane remain visibly above the background and midground art on phone portrait and phone landscape layouts. Visual checkpoint: at `390x844` and `844x390`, the vehicle silhouette is clearly legible throughout travel, and revisiting the current place shows facts immediately with no fake movement sequence.

### LEG-4: Mission Orbit - Cinematic Direction And Controller Support
- Status: done
- Confirmed: yes
- Goal link: Make Mission Orbit read correctly at a glance and become fully playable on a controller from start screen to replay.
- Depends on: none
- Owned files:
  - `games/mission-orbit/cinematic.ts`
  - `games/mission-orbit/input.ts`
  - `games/mission-orbit/main.ts`
  - `games/mission-orbit/controller.tsx`
  - `public/styles/mission-orbit.css`
- Read-only:
  - `games/mission-orbit/types.ts` - scene ordering, cinematic ids, and interaction prompts
  - `games/mission-orbit/state.ts` - phase transitions and tap/hold semantics that controller input must respect
  - `games/mission-orbit/renderer.ts` - scene DOM ids and interaction visibility rules used by `main.ts`
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/mission-orbit/cinematic.ts games/mission-orbit/input.ts games/mission-orbit/main.ts games/mission-orbit/controller.tsx public/styles/mission-orbit.css`
- Intent: (1) Audit each Mission Orbit cinematic in `cinematic.ts` and correct rocket rotation so the nose points in the direction of motion during outbound transfer, approach, orbit, and return beats. Use a fuller moon treatment in distant approach/transfer scenes so the Moon reads as the body the crew is flying toward instead of a side-lit crescent icon. Keep reduced-motion branches visually complete, not blank. (2) Add real controller support across the whole flow in `input.ts` and `main.ts`: A/Button-0 begins the mission, advances continue prompts, performs tap scenes, and starts/ends hold scenes while pressed/released; Start/Button-9 opens the menu; D-pad navigates when multiple visible buttons exist on start, menu, or end screens. Preserve touch and keyboard behavior and keep the mission pacing user-driven at each beat. (3) Update the controls copy and any focus/active styling in `controller.tsx` and `public/styles/mission-orbit.css` so controller-driven affordances remain obvious, 44px reachable, and WCAG-friendly. Visual checkpoint: on the outbound and return scenes, the rocket's nose matches the path at a glance, the Moon no longer looks like a crescent destination, and controller play can complete at least the first tap and hold scenes without touching the mouse.

### LEG-5: Cross-Game Regression Coverage
- Status: done
- Confirmed: yes
- Goal link: Lock the new Pixel Passport and Mission Orbit behavior into automated checks so replay, revisit, and controller regressions do not slip back in.
- Depends on: LEG-3, LEG-4
- Owned files:
  - `games/pixel-passport/state.test.ts`
  - `e2e/site-07-game-smoke.spec.ts`
- Read-only:
  - `games/pixel-passport/main.ts` - restart, revisit, and travel entry behavior under test
  - `games/mission-orbit/main.ts` - controller flow and phase progression under test
  - `games/mission-orbit/input.ts` - controller button mappings and phase-aware actions under test
- Deferred shared edits:
  - none
- Verification: `node --import tsx --test games/pixel-passport/state.test.ts && pnpm exec playwright test --config config/playwright.config.ts e2e/site-07-game-smoke.spec.ts --grep "Pixel Passport|Mission Orbit"`
- Intent: (1) Expand `games/pixel-passport/state.test.ts` with explicit assertions for the new replay/revisit semantics: fresh starts do not preserve collected memories, revisit logic reopens the current destination without pretending to travel, and current-location bookkeeping stays correct after a revisit or a new trip. If the implementation introduces a helper such as `restartGame()` or `revisitDestination()`, test those helpers directly. (2) Extend `e2e/site-07-game-smoke.spec.ts` with real mock-gamepad flows for Pixel Passport and Mission Orbit. For Pixel Passport, assert that controller input can start the game, move the globe selection, revisit the current place without showing the travel screen, take a real new trip to a different destination, open the menu with Start, and show a cleared memory count after restart. For Mission Orbit, assert that controller input can start the mission, advance at least one continue prompt, complete a visible tap interaction path, complete a visible hold interaction path, and open the menu with Start. (3) Follow the visible-interaction rule: use real controller/button input plus `toBeVisible()` or `toBeInViewport()` on active game UI, not hidden-event shortcuts.

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

1. LEG-1 (Story Trail - Interactive Inventory Loop) - no dependencies
2. LEG-3 (Pixel Passport - Reset, Travel, And Globe Polish) - no dependencies
3. LEG-4 (Mission Orbit - Cinematic Direction And Controller Support) - no dependencies
4. LEG-2 (Story Trail - Guidance And Regression Coverage) - depends on LEG-1
5. LEG-5 (Cross-Game Regression Coverage) - depends on LEG-3 and LEG-4

After all complete: apply deferred edits (none expected) -> `pnpm test:local` -> commit -> push.

## Implementation
Commit: 60b9ef8
Pushed: 2026-04-10

## Critique
Date: 2026-04-17

### What Worked
- All 5 legs executed cleanly — no boundary violations, scope creep, or failures.
- Story Trail equip model is architecturally sound: pure state, toggleEquippedItem separate from makeChoice, auto-equip on grant, reset on story boundaries.
- Inventory bar and overlay rebuilt as native buttons with aria-pressed and focus management between bar↔overlay.
- Pixel Passport fresh restart and same-place revisit landed exactly as intended.
- Mission Orbit controller support is comprehensive with phase-aware gamepad polling.
- Responsive CSS uses clamp() and grid layouts with viewport-appropriate breakpoints.

### What Didn't
- LEG-1 feel (design question): User reports the inventory equip loop is mechanically correct but wants further refinement — likely visual weight/density or interaction pacing on iPhone portrait.

### Chart Gaps
- None.

### User Effectiveness
- Good scoping: "removing interaction awkwardness rather than broad rewrites" gave clear boundaries.
- Primary test surface (iPhone 17 portrait) aligns with the plan's 390×844 viewport checkpoint.

### Blockers
- None.

### Corrections for Next Cycle
- Visual leg verification enforcement: LEG-1's intent included a visual checkpoint but verification was eslint-only. The navigator should have flagged this per gnd-navigator.local.md § Visual Legs Review. Existing docs cover this — the gap was execution, not documentation.

### Field Review Holding List
- Transferred to `.planning/gnd-backlog.md`.