# Plan: Shared Structure Consolidation and Game Simplification

## Project Context
- Sources:
  - `README.md` - game principles, calm pacing, accessibility-first, offline-first
  - `AGENTS.md` - workflow, planning overlays, environment, validation gates
  - `.github/skills/review/references/architecture.md` - game module contract, DOM-based architecture, styling model, build flow
  - `.github/skills/review/references/game-quality.md` - layout, pacing, input coverage, viewport checkpoints, educational content
  - `.github/skills/gnd-chart/SKILL.md` + `LOCAL.md` - plan structure, workshop checks
  - `.planning/gnd-backlog.md` - backlog items folded into this plan (shared assets, menu/settings redesign, build elimination)
- Constraints:
  - DOM-based game architecture — no canvas except Super Word emoji tiles and Waterwall
  - iOS Safari interactive element rules — native `<button>`/`<a>` only for tap targets
  - 44px minimum touch targets
  - Reduce-motion branches must produce correct visual/positional results, not blank panes
  - Full-screen game layouts with `100dvh`, no document scroll
  - Playfield ≥50% of remaining viewport height at 390×844 portrait
  - Per-page payloads within budget
  - Level-1 reading level for in-game copy
  - Long-hold must never fire a press/highlight — explicit disambiguation required cross-game
  - `-webkit-touch-callout: none; user-select: none` on all long-hold interactive elements
  - Music off by default globally
  - Tests: unit-first, e2e only for browser-behavior-dependent flows. Keep e2e suite lean.
- Full validation:
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

Consolidate and simplify the games in Peninsular Reveries around shared infrastructure and a calmer, less over-configured experience. Strip arcade features (Chompers frenzy), reduce configuration surfaces (Squares to 3×3 with two named modes, Chompers to progressive levels within areas, Pixel Passport to pure exploration without collection), and consolidate Story Trail into one deeper branching story weaving in kindergarten concepts. Extract duplicated per-game boilerplate (audio buses, accessibility, animations, input/gamepad, screen management) into shared client modules. Settings become global (music, SFX, reduce motion) with a named music catalog preserving all 10 existing synthesized tracks and a shared SFX library for developer reuse. Every game gets a unified start screen with integrated entry choices and per-game personality. Waterwall gets a creative start where the title is rendered as grid barriers dissolved by water on play. A global menu shell (Restart, Quit, Music+picker, SFX, Reduce Motion, Controls, per-game flavor, Info) replaces per-game settings modals. A cross-game input audit ensures long-hold never fires press events, documented in architecture. The build pipeline is investigated for native ESM feasibility. All changes locked in with efficient tests.

## Legs

### LEG-1: Chompers - Strip Frenzy Mode
- Status: done
- Confirmed: yes
- Goal link: Remove the arcade-style competitive mode that contradicts the calm game philosophy before shared modules are built on top of this code.
- Depends on: none
- Owned files:
  - `games/chompers/main.ts`
  - `games/chompers/types.ts`
  - `games/chompers/state.ts`
  - `games/chompers/state.test.ts`
  - `games/chompers/renderer.ts`
  - `games/chompers/input.ts`
  - `games/chompers/sounds.ts`
  - `games/chompers/animations.ts`
  - `games/chompers/controller.tsx`
  - `public/styles/chompers.css`
- Read-only:
  - `games/chompers/problems.ts` - problem generation stays, verify no frenzy-specific logic
  - `games/chompers/sample-manifest.ts` - check if frenzy uses unique samples
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/chompers/ && node --import tsx --test games/chompers/state.test.ts games/chompers/problems.test.ts`
- Intent:
  (1) Delete all frenzy mode code: `FrenzyConfig`, `FrenzyState`, `NpcHippo` types, NPC AI logic (`npcSelectTarget`, `tickNpcProgress`, `resolveFrenzyRound`), frenzy timer (`tickRoundTimer`, `getRoundTimerMax`), frenzy colors (`FRENZY_COLORS`), team scoring, opponent count config, player color swatches. Remove frenzy-related state fields from `GameState`.
  (2) In `main.ts`: delete `frenzyTickHandle`, `frenzyRoundCount`, `frenzyPlayerScore`, `isResolvingFrenzyRound`, `stopFrenzyTick()`, `assignNpcTargets()`, `startFrenzyTick()`, and all frenzy game loop branches. Keep the solo game loop clean.
  (3) In `sounds.ts`: delete `playFrenzyMusic()`, `stopFrenzyMusic()`, `playFrenzyWin()`, `playFrenzyLose()`, `playNpcChomp()`, `playNpcScore()`, `playTimerWarning()`. NOTE: The "Snack Break" melody composition (pentatonic C D E G A over triangle bass) must be preserved — it will be extracted to the shared music catalog in LEG-6. Copy the synthesis code to a temporary comment or separate constant before deleting the frenzy function wrapper.
  (4) In `renderer.ts`: delete `renderFrenzyScoreboard()`, `renderFrenzyEndScreen()`, `renderNpcHippos()`, `renderRoundTimer()` and any frenzy-specific DOM manipulation.
  (5) In `animations.ts`: delete `animateNpcChomp()` and any frenzy-specific animation helpers.
  (6) In `controller.tsx`: remove frenzy mode toggle, NPC count selector, team mode selector, color swatch picker, and any frenzy-related markup from the start screen and settings modal.
  (7) In `public/styles/chompers.css`: remove frenzy-specific styles (NPC hippos, round timer, frenzy scoreboard, color swatches).
  (8) In `state.test.ts`: remove all frenzy-specific test cases. Keep solo game state tests.
  (9) In `input.ts`: remove any frenzy-specific input handling branches.
  (10) Verify the solo game (6 areas × 3 levels) still works end-to-end after removal.

### LEG-2: Squares - Simplify to 3×3 Two-Mode Puzzle
- Status: done
- Confirmed: yes
- Goal link: Reduce Squares from 9 configuration combinations to a clean 2-mode puzzle on a single board size before shared infrastructure is layered on.
- Depends on: none
- Owned files:
  - `games/squares/types.ts`
  - `games/squares/state.ts`
  - `games/squares/state.test.ts`
  - `games/squares/main.ts`
  - `games/squares/input.ts`
  - `games/squares/input.test.ts`
  - `games/squares/renderer.ts`
  - `games/squares/controller.tsx`
  - `games/squares/controller.test.ts`
  - `games/squares/animations.ts`
  - `games/squares/sounds.ts`
  - `games/squares/sounds.test.ts`
  - `public/styles/squares.css`
- Read-only:
  - `games/squares/info.ts` - may need summary text update (deferred to LEG-10)
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/squares/ && node --import tsx --test games/squares/state.test.ts games/squares/input.test.ts games/squares/sounds.test.ts games/squares/controller.test.ts`
- Intent:
  (1) **Board**: Lock to 3×3 only. Remove 4×4 Courtyard and 5×5 Garden presets from `SQUARES_BOARD_PRESETS`. Remove their auto-paired theme presets and celebration pattern pairings. Keep the 3×3 Harbor Dawn theme.
  (2) **Two modes — "1×1" and "+/×"**: "1×1" mode: tap toggles only the tapped square. "+/×" mode: tap affects the cross or X pattern (the current Classic Hybrid behavior). Rename rulesets accordingly. Remove Easy Plus and Easy X as separate rulesets — "1×1" replaces them as the simpler mode.
  (3) **+/× pattern switching**: In "+/×" mode, the player switches between plus and X patterns via: key press (specific key TBD in intent, e.g., Space or Tab), long-hold on a cell (must NOT trigger a normal press — explicit hold threshold ≥300ms with press cancelled if hold fires), gamepad button (e.g., X/Button-2 or shoulder), or secondary mouse button (right-click). Secondary mouse button is also an aria-accessible discovery path. Apply `-webkit-touch-callout: none; user-select: none` on the board for iOS long-hold safety.
  (4) **Randomized boards**: Remove scramble pickers, level selectors, and preset configuration UI. Each game generates a fresh random solvable 3×3 board. Scramble logic must guarantee solvability for both modes.
  (5) **Celebration patterns**: Keep ALL existing celebration patterns (Ripple Ring, Cross Bloom, Sunburst) and randomize which one plays on each win. Slow down the celebration animation — current speed is too fast. Consider adding more celebration patterns for variety.
  (6) **High score**: One record per mode (1×1 best move count, +/× best move count). Remove per-preset-combo tracking. Store in localStorage under `squares-high-1x1` and `squares-high-plusx`.
  (7) **Remove**: Board preset picker, ruleset picker, theme pair picker, music profile picker (music moves to global in LEG-6), setup summary card, high-score-per-combo tracking.
  (8) **On-screen display**: Show current mode label, move count, and personal record on the game screen alongside the board — not buried in the menu.
  (9) Update all test files to reflect the simplified model.

### LEG-3: Story Trail - Consolidate Into One Deep Story
- Status: done
- Confirmed: yes
- Goal link: Replace 5 shallow separate stories with 1 deeper branching narrative that weaves in kindergarten concepts, has multiple endings, and rewards replay.
- Depends on: none
- Owned files:
  - `games/story-trail/types.ts`
  - `games/story-trail/state.ts`
  - `games/story-trail/state.test.ts`
  - `games/story-trail/stories.ts`
  - `games/story-trail/stories.test.ts`
  - `games/story-trail/story-weather.ts`
  - `games/story-trail/story-plants.ts`
  - `games/story-trail/story-habitats.ts`
  - `games/story-trail/story-helpers.ts`
  - `games/story-trail/story-senses.ts`
  - `games/story-trail/renderer.ts`
  - `games/story-trail/main.ts`
  - `games/story-trail/input.ts`
  - `games/story-trail/accessibility.ts`
  - `games/story-trail/controller.tsx`
  - `public/styles/story-trail.css`
- Read-only:
  - `games/story-trail/sounds.ts` - ambient loop stays, verify no story-specific sound triggers
  - `games/story-trail/animations.ts` - animation helpers stay
  - `games/story-trail/info.ts` - may need summary text update (deferred to LEG-10)
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/story-trail/ && node --import tsx --test games/story-trail/state.test.ts games/story-trail/stories.test.ts`
- Intent:
  (1) **One story, many paths**: Write a single original branching story that naturally weaves in the kindergarten unit concepts — weather, plants, habitats, community helpers, and senses — as story beats, not forced curriculum. The story should be longer than any current individual story, with more steps, more decision points, and at least 3 meaningfully different endings. Creative freedom to make it good.
  (2) **Consolidate story files**: Delete `story-weather.ts`, `story-plants.ts`, `story-habitats.ts`, `story-helpers.ts`, `story-senses.ts`. Replace with a single story definition in `stories.ts` (or rename the file). The story data structure stays the same — scenes, choices, items, required items — just one story instead of five.
  (3) **Remove trail map / story picker**: The game starts directly into the one story. No story selection screen. The start screen (LEG-10) leads straight into the narrative.
  (4) **No auto-item-select**: The equip mechanic from the prior plan stays — the player must manually equip items before using them at gated choices. Do not auto-equip on item grant. Keep the existing equip UI from the prior plan implementation.
  (5) **UI/UX polish**: Improve the scene layout, choice presentation, and inventory interaction. Ensure the story feels like a calm, immersive experience — not a quiz. Scene transitions should be gentle. Reading level stays at level 1.
  (6) **Multiple endings**: At least 3 endings that feel meaningfully different — not just "you won" vs "you lost" but different narrative outcomes based on choices made. Encourage replay to discover other paths.
  (7) **Update tests**: Rewrite `stories.test.ts` for the new single-story structure. Update `state.test.ts` for any state model changes. Ensure item gating, equip, and branching are covered.
  (8) **Viewport checkpoints**: Story scenes must be comfortable at 390×844 portrait and 844×390 landscape. Choice lists, inventory bar, and scene text must not clip or require scrolling.

### LEG-4: Pixel Passport - Simplify to Pure Exploration
- Status: done
- Confirmed: yes
- Goal link: Strip Pixel Passport to a clean visit-and-discover loop, remove collection mechanics, fix mobile viewport issues, and remove Pip guide character.
- Depends on: none
- Owned files:
  - `games/pixel-passport/main.ts`
  - `games/pixel-passport/state.ts`
  - `games/pixel-passport/state.test.ts`
  - `games/pixel-passport/types.ts`
  - `games/pixel-passport/renderer.ts`
  - `games/pixel-passport/input.ts`
  - `games/pixel-passport/accessibility.ts`
  - `games/pixel-passport/controller.tsx`
  - `games/pixel-passport/art.ts`
  - `games/pixel-passport/sounds.ts`
  - `public/styles/pixel-passport.css`
- Read-only:
  - `games/pixel-passport/destinations.ts` - destination data stays, verify no collection-specific fields
  - `games/pixel-passport/destinations.test.ts` - may need updates
  - `games/pixel-passport/info.ts` - summary text update deferred to LEG-10
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/pixel-passport/ && node --import tsx --test games/pixel-passport/state.test.ts games/pixel-passport/destinations.test.ts`
- Intent:
  (1) **Remove memory room and collection**: Delete the memory room screen, memory shelf UI, collected memory count, "Pip found a new memory" flow, and all collection/souvenir tracking. The player visits places and discovers things — that IS the experience, nothing is collected or taken home.
  (2) **Remove Pip**: Delete the Pip guide sprite (`PIP_SPRITES`, `pipPalette`), all `guide-sprite` DOM elements (`title-pip`, `globe-pip`, `travel-pip`, `explore-pip`, `memory-pip`, `room-pip`), all `guide-text` elements, and `sfxPipSpeak()`. Facts appear as plain text on the destination screen without a character narrator.
  (3) **Simplify landing**: Start button → globe. No ceremony, no Pip greeting.
  (4) **Different discoveries on revisit**: When visiting the same destination again, show different facts/discoveries — not the same content every time. The destination data in `destinations.ts` should support multiple fact sets per location, cycling or randomizing on revisit.
  (5) **Fix travel viewport**: The vehicle (bus/plane/etc.) is positioned too high and gets cut off above the top of the viewport on small iPhone portrait (e.g., iPhone 17). Bring the vehicle down into the visible viewport area. Ensure vehicle silhouette is clearly legible at 390×844 portrait throughout the travel animation.
  (6) **Loosen globe on mobile**: The globe interaction area is too tight on phone portrait. Add breathing room — larger tap targets for destination pins, more padding around the globe.
  (7) **Keep**: Globe destination picker, travel animation with visible vehicle, destination discovery screens, transport auto-selection by geography. The core loop is start → globe → pick → travel → discover → globe → repeat.
  (8) **Art cleanup**: Remove Pip sprite data from `art.ts`. Keep vehicle sprites and destination art.
  (9) Update `state.test.ts` — remove memory/collection assertions, add revisit-different-content assertions.

### LEG-5: Shared Client Modules
- Status: done
- Confirmed: yes
- Goal link: Extract duplicated utility code from all 7 games into shared client modules so migration has clean import targets.
- Depends on: LEG-1, LEG-2, LEG-3, LEG-4
- Owned files:
  - `client/game-audio.ts` (new)
  - `client/game-accessibility.ts` (new)
  - `client/game-animations.ts` (new)
  - `client/game-screens.ts` (new)
  - `client/game-input.ts` (new)
- Read-only:
  - `games/chompers/sounds.ts` - reference for audio bus pattern
  - `games/chompers/accessibility.ts` - reference for announce/focus pattern
  - `games/chompers/animations.ts` - reference for isReducedMotion/animateClass pattern
  - `games/chompers/main.ts` - reference for showScreen pattern
  - `games/chompers/input.ts` - reference for isModalOpen/focusableElements/gamepad pattern
  - `games/waterwall/input.ts` - reference for continuous-input gamepad variant
  - `games/squares/input.ts` - reference for coordinate-based gamepad variant
  - `client/audio.ts` - existing audio helpers that game-audio.ts wraps
  - `client/preferences.ts` - existing preference helpers
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs client/game-audio.ts client/game-accessibility.ts client/game-animations.ts client/game-screens.ts client/game-input.ts`
- Intent:
  (1) **`client/game-audio.ts`**: Export `getGameAudioBuses(slug: string): { music: GainNode; sfx: GainNode; ctx: AudioContext }`. Internally manages singleton pairs per slug using `createMusicBus`/`createSfxBus` from `client/audio.ts`. Replaces the per-game `_musicBus`/`_sfxBus`/`getCtx()`/`getMusicBusNode()`/`getSfxBusNode()` boilerplate (~15 lines × 7 games).
  (2) **`client/game-accessibility.ts`**: Export `announce(message: string, priority: 'polite' | 'assertive'): void` dispatching to `#game-status` (polite) or `#game-feedback` (assertive). Export `moveFocusAfterTransition(elementId: string, delayMs?: number): void` with default 260ms delay and `requestAnimationFrame` focus. (~10 lines × 6 games).
  (3) **`client/game-animations.ts`**: Export `isReducedMotion(): boolean` wrapping `isReducedMotionEnabled()` from preferences. Export `animateClass(element: HTMLElement | null, className: string, durationMs?: number): Promise<void>` with reflow-force and reduced-motion early-resolve. (~12 lines × 5 games).
  (4) **`client/game-screens.ts`**: Export `showScreen(screenId: string, allScreenIds: string[]): void` toggling `hidden` and `aria-hidden` attributes. (~8 lines × 5 games).
  (5) **`client/game-input.ts`**: Export `isModalOpen(modalId?: string): boolean` checking `hidden` attribute on settings modal. Export `focusableElements(root: ParentNode | null): HTMLElement[]` with the standard focusable selector and visibility filter. Export `createGamepadPoller(callbacks: GamepadCallbacks): GamepadPoller` owning the `requestAnimationFrame` loop, standardized dead-zone at ±0.5, 200ms D-pad debounce, and `gamepadconnected`/`gamepaddisconnected` events. Callback interface: `{ onDpad(direction: 'up'|'down'|'left'|'right'): void, onButtonA(): void, onButtonStart(): void, onDisconnect?(): void, onRawAxis?(axes: readonly number[]): void }`. The `onRawAxis` callback supports games needing continuous input (Waterwall cursor movement). Return type `GamepadPoller` has `start()`, `stop()`, and `isConnected()`.

### LEG-6: Global Preferences + Music and SFX Catalogs
- Status: done
- Confirmed: yes
- Goal link: Move settings from per-game to global and catalog all existing synthesized audio so no compositions are lost and all sounds are available for developer reuse.
- Depends on: LEG-5
- Owned files:
  - `client/preferences.ts`
  - `client/music-catalog.ts` (new)
  - `client/sfx-catalog.ts` (new)
- Read-only:
  - `client/audio.ts` - bus creation helpers
  - `games/chompers/sounds.ts` - frenzy melody to extract as "Snack Break"
  - `games/squares/sounds.ts` - chill/tense profiles to extract as "Driftwood"/"Ember"
  - `games/super-word/sounds.ts` - ambient music to extract as "Starfield"
  - `games/story-trail/sounds.ts` - ambient loop to extract as "Canopy"
  - `games/pixel-passport/sounds.ts` - transport loops to extract as "Boulevard"/"Sleeper Car"/"Harbor"/"Contrails"
  - `games/waterwall/sounds.ts` - water texture to extract as "Tideline"
- Deferred shared edits:
  - Each game's `sounds.ts` loses music functions and gains imports from catalogs — handled in LEG-7
- Verification: `pnpm exec eslint --config config/eslint.config.mjs client/preferences.ts client/music-catalog.ts client/sfx-catalog.ts`
- Intent:
  (1) **Global preferences**: Change `client/preferences.ts` so `music-enabled`, `sfx-enabled`, and `reduce-motion` are single global localStorage keys (not per-game `chompers-music-enabled` etc.). Events become global dispatches (`reveries:music-change`, `reveries:sfx-change`). Remove per-game slug parameter from `getMusicEnabled()`/`getSfxEnabled()`/`setMusicEnabled()`/`setSfxEnabled()` and their corresponding `bind*Toggle()` functions. Keep `getGamePreference()`/`setGamePreference()` for truly per-game state (e.g., Waterwall theme).
  (2) **Music catalog** (`client/music-catalog.ts`): Collect all 10 existing synthesized music compositions under creative names. Each track is a named export with `start(musicBus: GainNode)` and `stop()` functions. Track list:
    - "Snack Break" — Pentatonic melody + triangle bass (from Chompers frenzy, 120 BPM)
    - "Driftwood" — Warm triangle+sine progression (from Squares chill, 78 BPM)
    - "Ember" — Bright sawtooth+triangle (from Squares tense, 96 BPM)
    - "Starfield" — Pad + sparkling bells, 4-chord rotation (from Super Word)
    - "Canopy" — Breathing D-minor chord bed (from Story Trail)
    - "Boulevard" — Low sawtooth engine drone (from PP bus transport)
    - "Sleeper Car" — Square wave rail hum (from PP train transport)
    - "Harbor" — Sine wave harbor tone (from PP boat transport)
    - "Contrails" — Higher sawtooth soar (from PP plane transport)
    - "Tideline" — Bandpass-filtered white noise (from Waterwall)
  Export a `MUSIC_TRACKS` array with `{ id, name, start, stop }` for the global picker.
  Music is **off by default**. Selected track ID persists in `localStorage('reveries-music-track')`.
  Music selection is global — once playing, continues across page navigation.
  (3) **SFX catalog** (`client/sfx-catalog.ts`): Collect reusable synthesized SFX from all games into a shared library. This is **developer infrastructure** — games import what they need. Each SFX is a named function taking an `sfxBus: GainNode` parameter. Catalog SFX by character (e.g., `sfxClick`, `sfxCorrect`, `sfxWrong`, `sfxCelebration`, `sfxWhoosh`, `sfxSplash`, `sfxChime`, etc.). Game-specific SFX that aren't reusable stay in per-game `sounds.ts`.

### LEG-7: Migrate All Games to Shared Modules
- Status: done
- Confirmed: yes
- Goal link: Wire all 7 games to the shared client modules and global catalogs, deleting per-game boilerplate.
- Depends on: LEG-5, LEG-6
- Owned files:
  - `games/chompers/sounds.ts`
  - `games/chompers/main.ts`
  - `games/chompers/accessibility.ts`
  - `games/chompers/animations.ts`
  - `games/chompers/input.ts`
  - `games/squares/sounds.ts`
  - `games/squares/main.ts`
  - `games/squares/accessibility.ts`
  - `games/squares/animations.ts`
  - `games/squares/input.ts`
  - `games/story-trail/sounds.ts`
  - `games/story-trail/main.ts`
  - `games/story-trail/accessibility.ts`
  - `games/story-trail/animations.ts`
  - `games/story-trail/input.ts`
  - `games/pixel-passport/sounds.ts`
  - `games/pixel-passport/main.ts`
  - `games/pixel-passport/accessibility.ts`
  - `games/pixel-passport/animations.ts`
  - `games/pixel-passport/input.ts`
  - `games/mission-orbit/sounds.ts`
  - `games/mission-orbit/main.ts`
  - `games/mission-orbit/accessibility.ts`
  - `games/mission-orbit/animations.ts`
  - `games/mission-orbit/input.ts`
  - `games/super-word/sounds.ts`
  - `games/super-word/main.ts`
  - `games/super-word/accessibility.ts`
  - `games/super-word/animations.ts`
  - `games/super-word/input.ts`
  - `games/waterwall/sounds.ts`
  - `games/waterwall/main.ts`
  - `games/waterwall/accessibility.ts`
  - `games/waterwall/animations.ts`
  - `games/waterwall/input.ts`
- Read-only:
  - `client/game-audio.ts` - import target
  - `client/game-accessibility.ts` - import target
  - `client/game-animations.ts` - import target
  - `client/game-screens.ts` - import target
  - `client/game-input.ts` - import target
  - `client/music-catalog.ts` - import target
  - `client/sfx-catalog.ts` - import target
  - `client/preferences.ts` - updated global API
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/`
- Intent:
  (1) **sounds.ts (all 7)**: Remove per-game bus singleton boilerplate (`_musicBus`, `_sfxBus`, `getCtx()`, `getMusicBusNode()`, `getSfxBusNode()`). Import `getGameAudioBuses` from `client/game-audio.ts`. Music functions already moved to `client/music-catalog.ts` in LEG-6 — delete local copies. Reusable SFX import from `client/sfx-catalog.ts`. Game-specific SFX stay local but use the shared bus.
  (2) **main.ts (all 7)**: Remove `setupTabbedModal()` + `bindMusicToggle()` + `bindSfxToggle()` + `bindReduceMotionToggle()` boilerplate. Import shared versions. Remove local `showScreen()` — import from `client/game-screens.ts`. Wire global preference events instead of per-game events.
  (3) **accessibility.ts (all 7)**: Remove local `announce()` and `moveFocusAfterTransition()`. Import from `client/game-accessibility.ts`. Keep game-specific announcement functions (e.g., `announceProblem()`, `announceBarrierPlaced()`) that call the shared `announce()`.
  (4) **animations.ts (all 7)**: Remove local `isReducedMotion()` wrapper. Import from `client/game-animations.ts`. Keep game-specific animation functions that call the shared helpers.
  (5) **input.ts (all 7)**: Remove local `isModalOpen()` and `focusableElements()`. Import from `client/game-input.ts`. Replace per-game gamepad polling with `createGamepadPoller(callbacks)` from the shared scaffold. Each game provides its own callback object with phase-aware actions. Waterwall passes `onRawAxis` for continuous cursor input. Standard games pass `onDpad`/`onButtonA`/`onButtonStart`.
  (6) Per-game verification: run lint on each game directory after migration.

### LEG-8: Global Menu Shell
- Status: done
- Confirmed: yes
- Goal link: Replace per-game settings modals with a single shared menu shell carrying global settings plus per-game flavor.
- Depends on: LEG-6, LEG-7
- Owned files:
  - `client/modal.ts`
  - `client/game-menu.ts` (new)
  - `games/chompers/controller.tsx`
  - `games/chompers/main.ts`
  - `games/squares/controller.tsx`
  - `games/squares/main.ts`
  - `games/story-trail/controller.tsx`
  - `games/story-trail/main.ts`
  - `games/pixel-passport/controller.tsx`
  - `games/pixel-passport/main.ts`
  - `games/mission-orbit/controller.tsx`
  - `games/mission-orbit/main.ts`
  - `games/super-word/controller.tsx`
  - `games/super-word/main.ts`
  - `games/waterwall/controller.tsx`
  - `games/waterwall/main.ts`
- Read-only:
  - `client/preferences.ts` - global preference API
  - `client/music-catalog.ts` - track list for picker
  - `app/ui/game-shell.tsx` - existing shared game shell helpers
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs client/game-menu.ts client/modal.ts games/*/controller.tsx games/*/main.ts`
- Intent:
  (1) **Shared menu structure** (`client/game-menu.ts`): Create a shared menu builder that generates the standard modal content. Menu items in order:
    - **Restart** — returns to that game's start/landing screen
    - **Quit** — navigates to app home page
    - **Music** — on/off toggle + track picker dropdown (lists all tracks from `MUSIC_TRACKS`)
    - **Sound Effects** — on/off toggle
    - **Reduce Motion** — toggle
    - **Controls** — shared input legend showing keyboard, touch, gamepad mappings. Per-game specifics injected via config.
    - **[Per-game flavor slot]** — optional section injected by each game (e.g., Waterwall theme picker, Chompers area display)
    - **Info** — brief game description + link to game's info page
  (2) **Per-game flavor**: Each game provides an optional `menuFlavor` config object with additional markup/controls. Waterwall: theme picker. Chompers: current area indicator. Squares: current mode display. Others: empty.
  (3) **Remove per-game modal markup**: Each game's `controller.tsx` stops hand-coding the full settings modal. Instead, a shared `<GameMenu>` component or DOM builder generates it. Per-game `controller.tsx` provides only the flavor slot content and game-specific Document props.
  (4) **Wire in main.ts**: Replace per-game modal setup code with a single `setupGameMenu(config)` call that handles modal creation, toggle binding, and event wiring using the global preference API.
  (5) Standard a11y: modal traps focus, Escape closes, ARIA labels on all controls. 44px touch targets.

### LEG-9: Simplify Chompers Start Screen
- Status: done
- Confirmed: yes
- Goal link: Replace the complex area/level picker with a clean 2×3 area card landing and progressive levels within areas.
- Depends on: LEG-1, LEG-8
- Owned files:
  - `games/chompers/controller.tsx`
  - `games/chompers/main.ts`
  - `games/chompers/state.ts`
  - `games/chompers/types.ts`
  - `games/chompers/renderer.ts`
  - `public/styles/chompers.css`
- Read-only:
  - `games/chompers/problems.ts` - problem generation by area/level
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/chompers/ && node --import tsx --test games/chompers/state.test.ts`
- Intent:
  (1) **Landing screen**: 2-column × 3-row grid of area cards: Matching, Counting, Addition, Subtraction, Multiplication, Division. Each card is a `<button>` with the area name and a brief emoji/icon for personality. Tap → game starts in that area. 44px minimum touch targets. Gamepad D-pad navigates cards, A selects.
  (2) **No level picker**: Start at L1 within the selected area. Levels are earned by playing — advance to L2 after completing a round threshold (e.g., 8/10 correct), then L3 similarly. Level progress can be shown as a subtle indicator during play (e.g., "Level 1 ★" in the HUD).
  (3) **Progressive level logic**: Add level advancement to `state.ts`. Track correct-in-current-level count. On threshold met, advance level and generate next round at the new difficulty. If the player gets the current level's problems consistently wrong, stay at current level (no regression to prevent frustration).
  (4) **Restart from menu**: Returns to the 2×3 area card landing screen. Level progress resets.
  (5) **Viewport**: Area cards must be comfortable at 390×844 portrait and 844×390 landscape. Cards should have clear visual separation and not feel cramped.

### LEG-10: Unified Start Screens
- Status: done
- Confirmed: yes
- Goal link: Give every game a consistent start screen with integrated entry choices and per-game visual personality.
- Depends on: LEG-8
- Owned files:
  - `games/chompers/controller.tsx`
  - `games/squares/controller.tsx`
  - `games/mission-orbit/controller.tsx`
  - `games/pixel-passport/controller.tsx`
  - `games/story-trail/controller.tsx`
  - `games/super-word/controller.tsx`
  - `games/chompers/info.ts`
  - `games/squares/info.ts`
  - `games/pixel-passport/info.ts`
  - `games/story-trail/info.ts`
  - `public/styles/chompers.css`
  - `public/styles/squares.css`
  - `public/styles/mission-orbit.css`
  - `public/styles/pixel-passport.css`
  - `public/styles/story-trail.css`
  - `public/styles/super-word.css` (if exists, or `public/styles/game.css`)
- Read-only:
  - `app/ui/game-shell.tsx` - shared screen/shell helpers
  - `client/game-screens.ts` - shared showScreen
  - `client/game-input.ts` - shared gamepad hint logic
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/*/controller.tsx`
- Intent:
  (1) **Shared pattern**: Every game's start screen has: styled title (per-game fonts/colors), brief subtitle/tagline, game's entry choices (if any), hidden gamepad hint (shown when controller detected via `gamepadconnected` event).
  (2) **Per-game start screens**:
    - Chompers: Title + 2×3 area card grid (from LEG-9)
    - Squares: Title + two mode buttons ("1×1" and "+/×") + current records display
    - Super Word: Title + difficulty level buttons (Sidekick through Legend)
    - Mission Orbit: Title + subtitle + single Play button
    - Pixel Passport: Title + subtitle + single Start button → globe
    - Story Trail: Title + subtitle + single Begin button → story
  (3) **Waterwall excluded** — handled by LEG-11's creative start.
  (4) **Consistent visual structure**: Title at top, choices in center, gamepad hint at bottom. Per-game CSS identity (colors, fonts, background) preserved. Shared layout rhythm via a shared CSS pattern or utility.
  (5) **Update info.ts**: Update game summary text for any games whose description changed due to simplification.
  (6) **Viewport**: All start screens comfortable at 390×844 and 844×390. Touch targets ≥44px.

### LEG-11: Waterwall - Creative Start Screen
- Status: done
- Confirmed: yes
- Goal link: Give Waterwall a unique start experience where the title is rendered as grid barriers that water dissolves on play.
- Depends on: LEG-7, LEG-8
- Owned files:
  - `games/waterwall/main.ts`
  - `games/waterwall/renderer.ts`
  - `games/waterwall/state.ts`
  - `games/waterwall/controller.tsx`
  - `public/styles/waterwall.css`
- Read-only:
  - `games/waterwall/types.ts` - grid types and config
  - `games/waterwall/input.ts` - input disabled during title dissolve
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/waterwall/ && node --import tsx --test games/waterwall/state.test.ts`
- Intent:
  (1) **Title as barriers**: On page load, render "WATERWALL" as letter-shaped barriers positioned on the game grid canvas. Use pre-defined pixel-font bitmaps for each letter (W, A, T, E, R, L) mapped to grid coordinates. The grid is visible but static — no water flowing yet.
  (2) **Play button**: A stylized Play button overlays the grid (centered, prominent, 44px+ touch target). Gamepad A also triggers play. Gamepad hint shown when controller connected.
  (3) **Water dissolve on play**: Player presses Play → water begins flowing from the top row. The title letter barriers interact with the water simulation naturally — water flows around them, builds up, and gradually dissolves/erodes them away. Letters become regular empty cells as they dissolve. The dissolution should feel organic, not instant.
  (4) **Transition to gameplay**: Once all letter barriers are dissolved (or after a maximum time, e.g., 3 seconds), the player has a clean grid and full barrier-placement control. The Play button fades out as water starts.
  (5) **Reduced-motion path**: Letters fade out over ~1 second without water animation. Grid transitions to clean state immediately. Water simulation starts after fade.
  (6) **Restart**: Returns to the title-as-barriers state with static grid.
  (7) **Visual checkpoint**: At 390×844 portrait and 844×390 landscape, the "WATERWALL" text should be centered and legible on the grid, and the water dissolve should be visually satisfying. Manual visual check required.

### LEG-12: Long-Hold vs Press Audit
- Status: done
- Confirmed: yes
- Goal link: Ensure long-hold interactions never accidentally fire a press/highlight across all games, and document the convention in architecture.
- Depends on: LEG-7
- Owned files:
  - `games/squares/input.ts`
  - `games/mission-orbit/input.ts`
  - `games/waterwall/input.ts`
  - `client/game-input.ts`
  - `.github/skills/review/references/architecture.md`
- Read-only:
  - `games/chompers/input.ts` - audit for hold patterns
  - `games/pixel-passport/input.ts` - audit for hold patterns
  - `games/story-trail/input.ts` - audit for hold patterns
  - `games/super-word/input.ts` - audit for hold patterns
- Deferred shared edits:
  - none
- Verification: `pnpm exec eslint --config config/eslint.config.mjs games/*/input.ts client/game-input.ts`
- Intent:
  (1) **Audit all 7 games**: Check every `input.ts` for press vs hold disambiguation. Identify any case where a hold interaction (≥300ms) could also trigger a press callback. Fix by cancelling the press if hold threshold is reached.
  (2) **Squares +/× pattern switch**: Ensure the long-hold pattern switch (in "+/×" mode) never triggers a cell toggle. Hold begins on pointerdown, if held ≥300ms → switch pattern and cancel the press. If released before 300ms → normal cell toggle. Apply `-webkit-touch-callout: none; user-select: none` on the board.
  (3) **Mission Orbit hold scenes**: Verify that hold-scene interactions (hold to perform action) have clean press/release boundaries — pressing and immediately releasing should not count as a completed hold.
  (4) **Shared gamepad scaffold**: Ensure `createGamepadPoller` in `client/game-input.ts` has a hold-detection helper if any game needs gamepad-based hold (e.g., hold A for Mission Orbit). Add `onButtonAHold?(durationMs: number): void` and `onButtonARelease?(): void` to the callback interface if needed.
  (5) **Document convention**: Add an "Input Timing Conventions" section to `.github/skills/review/references/architecture.md` covering: hold threshold (≥300ms), press cancellation on hold, iOS `-webkit-touch-callout` suppression requirement, gamepad hold pattern, and the rule that hold-release must never trigger a press action.

### LEG-13: Build Pipeline Investigation
- Status: done
- Confirmed: yes
- Goal link: Research whether the esbuild bundling step can be replaced with native ESM / import maps, and prototype if feasible.
- Depends on: none
- Owned files:
  - `build.ts` (prototype modifications only — revertible)
  - `server.ts` (prototype modifications only — revertible)
- Read-only:
  - `package.json` - current dependency graph
  - `config/tsconfig.json` - module resolution settings
  - `config/budget.json` - size budgets that must still be met
- Deferred shared edits:
  - none
- Verification: skipped (no prototype attempted)
- Findings: **Defer indefinitely.** No bare specifiers in client code (import maps solve nothing). TS transpilation still required. Unbundled Waterwall would produce ~19 sequential HTTP requests vs 2 bundled. Budgets met easily with bundles. Dev rebuild already sub-second. Cache invalidation far more complex unbundled. No files modified.
- Intent:
  (1) **Research**: Evaluate browser import map support across target browsers (modern evergreen). Assess whether the existing dependency graph (Remix packages, client modules, game entries) can resolve via import maps without a bundler. Consider: dev server implications, TypeScript compilation (still needed), file count vs bundle count tradeoffs, cache invalidation.
  (2) **Prototype if feasible**: Try converting one game (e.g., Waterwall, simplest dependency graph) to unbundled ESM with an import map in the HTML. Measure: page load time, number of network requests, total transfer size vs current bundled size, dev experience.
  (3) **Budget check**: Verify the prototype still meets `config/budget.json` size targets. If unbundled files exceed budgets, document why and whether budgets should be adjusted.
  (4) **Document findings**: Write a brief recommendation — implement across all games, implement for simple games only, or defer. Include specific blockers if found.
  (5) **Revert prototype**: If the prototype is not viable, revert all changes. This leg does not commit to shipping the change.

### LEG-14: Cross-Game Regression Tests
- Status: done
- Confirmed: yes
- Goal link: Lock all plan changes into efficient automated tests — unit-first, e2e only where needed.
- Depends on: LEG-1, LEG-2, LEG-3, LEG-4, LEG-5, LEG-6, LEG-7, LEG-8, LEG-9, LEG-10, LEG-11, LEG-12
- Owned files:
  - `client/game-audio.test.ts` (new)
  - `client/game-accessibility.test.ts` (new)
  - `client/game-animations.test.ts` (new)
  - `client/game-screens.test.ts` (new)
  - `client/game-input.test.ts` (new)
  - `client/music-catalog.test.ts` (new)
  - `games/chompers/state.test.ts`
  - `games/squares/state.test.ts`
  - `games/story-trail/state.test.ts`
  - `games/story-trail/stories.test.ts`
  - `games/pixel-passport/state.test.ts`
  - `e2e/site-07-game-smoke.spec.ts`
- Read-only:
  - all shared client modules — test targets
  - all game state/main modules — test targets
- Deferred shared edits:
  - none
- Verification: `pnpm test:local`
- Intent:
  (1) **Shared module unit tests**: Test `client/game-audio.ts` (singleton behavior, bus creation), `client/game-accessibility.ts` (announce dispatches to correct live region), `client/game-animations.ts` (reduced-motion early-resolve, animateClass lifecycle), `client/game-screens.ts` (screen toggling, aria-hidden), `client/game-input.ts` (gamepad callback dispatch, dead-zone filtering, debounce, hold detection). Test `client/music-catalog.ts` (all 10 tracks have start/stop, MUSIC_TRACKS array shape).
  (2) **Simplified game state tests**: Update `chompers/state.test.ts` — no frenzy assertions, add progressive level advancement. Update `squares/state.test.ts` — 3×3 only, two modes, randomized solvable boards. Update `story-trail/state.test.ts` — single story, branching, multiple endings, equip mechanic. Update `pixel-passport/state.test.ts` — no memory collection, revisit-different-content.
  (3) **E2e — use sparingly**: Update `e2e/site-07-game-smoke.spec.ts` for: global settings persistence across game navigation (set music off on one game page, verify it's off on another), Waterwall title-dissolve flow (Play → water → letters gone → interactive grid), gamepad start/menu/restart via mock-gamepad for 2-3 representative games. Do NOT e2e what unit tests cover.
  (4) **Testing efficiency**: Prefer `node --import tsx --test` unit tests for all logic. Use Playwright only for browser-dependent behaviors (DOM rendering, cross-page navigation, gamepad simulation). Keep the e2e suite lean per user guidance.

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

**Phase 1 — Simplify (parallel, no dependencies):**
1. LEG-1 (Strip Chompers Frenzy) - no dependencies
2. LEG-2 (Simplify Squares) - no dependencies
3. LEG-3 (Consolidate Story Trail) - no dependencies
4. LEG-4 (Simplify Pixel Passport) - no dependencies

**Phase 2 — Foundation (sequential):**
5. LEG-5 (Shared Client Modules) - depends on LEG-1, LEG-2, LEG-3, LEG-4
6. LEG-6 (Global Preferences + Music/SFX Catalogs) - depends on LEG-5

**Phase 3 — Migration + Shell:**
7. LEG-7 (Migrate All Games) - depends on LEG-5, LEG-6
8. LEG-8 (Global Menu Shell) - depends on LEG-6, LEG-7

**Phase 4 — Start screens (parallel after LEG-8):**
9. LEG-9 (Simplify Chompers Start) - depends on LEG-1, LEG-8
10. LEG-10 (Unified Start Screens) - depends on LEG-8
11. LEG-11 (Waterwall Creative Start) - depends on LEG-7, LEG-8

**Phase 5 — Cross-cutting (parallel):**
12. LEG-12 (Long-Hold vs Press Audit) - depends on LEG-7
13. LEG-13 (Build Pipeline Investigation) - no dependencies

**Phase 6 — Validation:**
14. LEG-14 (Cross-Game Regression) - depends on all implementation legs

After all complete: deferred edits (none expected) → `pnpm test:local` → delivery verification (local-only) → commit → push.

## Boundary Notes
- `games/super-word/input.ts` and `games/super-word/main.ts` were fixed by navigator during integration gate — `#start-btn` references replaced with `.btn-difficulty` selectors after LEG-10 removed the start button but LEG-7 input migration preserved the old reference.
- `games/story-trail/controller.tsx` was fixed by navigator — missing `leftContent` prop on `GameHeader` after LEG-3 restructured the controller.
- LEG-10 deferred edits (start button wiring in story-trail/main.ts, super-word/main.ts; gamepad-active class in squares/input.ts, story-trail/input.ts, pixel-passport/input.ts) applied by navigator before integration gate.

## Implementation
Commit: 73f658b
Pushed: 2025-07-13

## Critique
Date: 2026-04-17

### What Worked
- 14-leg plan executed cleanly — all legs marked done, integration gate passed, 97 files changed with no boundary violations beyond 3 small navigator fixes.
- Shared module extraction (LEG-5) is solid architecture — game-audio, game-accessibility, game-animations, game-screens, game-input all have correct APIs and are used by all 7 games.
- Chompers frenzy strip (LEG-1) and Squares simplification (LEG-2) landed exactly as intended with no user issues.
- Music catalog preserves all 10 compositions with creative names — no audio lost.
- Long-hold audit (LEG-12) delivered correct 300ms threshold with press suppression and architecture documentation.
- Build investigation (LEG-13) was the right call to defer — documented clearly with evidence.
- Progressive levels in Chompers (LEG-9) and unified start screen pattern (LEG-10) landed directionally right.

### What Didn't
- **LEG-3 (Story Trail depth):** The Hidden Garden has 27 scenes and 3 endings, but a player can click the bottom button on every page and complete the story without engaging the equip/item-gating mechanic. The story needs more dead ends that require item collection and equipping. The branching structure shipped but the gating depth didn't.
- **LEG-4 (Pixel Passport discovery page):** The implementation removed the destination discovery/exploration result page along with the collection mechanic. The user wanted to keep the "you found a boomerang" experience — just not collect it as a souvenir. The endpoint experience was the game's payoff and shouldn't have been deleted.
- **LEG-4 (Pixel Passport vehicle viewport — recurring):** Travel vehicle still cut off on iPhone 17 portrait. This was flagged in the prior plan's LEG-3 and this plan's LEG-4. Two implementation attempts haven't fixed it.
- **LEGs 6-7 (Music cross-game persistence):** Track selection saves to localStorage but music doesn't actually continue playing when navigating between games. The intent said "once playing, continues across page navigation" but the playback restart on page load isn't wired.

### Chart Gaps
- **LEG-4 intent conflation (Workshop phase):** "Nothing is collected or taken home" was ambiguous — it conflated removing collection tracking with removing the destination experience page. Workshop should have asked: "When the player arrives, what do they see and do before returning to the globe?" Root cause: Discovery phase — the existing destination flow wasn't decomposed into its two parts (experience + collection) before the intent was written.
- **LEG-3 missing gating depth criteria (Workshop phase):** The intent said "more decision points" but didn't specify how many choices should require equipped items or what fraction of paths should be gated. Root cause: Workshop phase — the Schell lens and gameplay-at-viewport checks should have asked about item-gating density.

### User Effectiveness
- Scope direction was clear and well-bounded — "consolidate and simplify" held through all 14 legs.
- Start screen consistency and menu refinement desires emerged during testing, not charting — reasonable for a plan this size. These are future refinement, not missed intent.

### Blockers
- None. All legs executed and `pnpm test:local` passed.

### Corrections for Next Cycle
1. **Workshop: decompose removal intents.** When a leg says "remove X," workshop should ask what parts of X the user values vs. wants gone. Specifically: separate the experience from the tracking/collecting before writing the intent.
2. **Workshop: quantify gating/branching depth for story legs.** When a leg introduces branching with item gating, the intent should specify a minimum gating density (e.g., "at least N choices require an equipped item" or "no complete path avoids item use").
3. **Recurring viewport bugs get escalated verification.** When a visual bug persists across two plans, the leg verification must include a screenshot assertion or explicit "manual visual check confirmed" note — lint-only is not acceptable for a recurring visual issue.

### Field Review Holding List
- Transferred to `.planning/gnd-backlog.md` (start screen consistency, menu UX refinement).
- Waterwall dissolve mechanic refinement implemented directly (see below).
