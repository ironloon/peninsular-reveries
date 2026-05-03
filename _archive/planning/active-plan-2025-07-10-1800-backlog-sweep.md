# Plan: Backlog Sweep

## Project Context
- Sources:
  - `.planning/gnd-backlog.md` — source of all items in this plan
  - `README.md` — game principles, project shape, quality benchmarks
  - `.pi/skills/creative-assets/references/audio-source-notes.md` — CC0 sourcing, audibility gate, repo integration checklist
  - `.pi/skills/gnd-chart/SKILL.md` — workshop checks including Recorded SFX audibility gate, pointer interaction on touch
  - Archived plans: `2025-07-10-1600-train-spot-on-backlog.md` — prior attempt at Train Sounds/Spot On backlog; probe was designed but never run, electric-horn remained silent
- Constraints:
  - Per-sample `gain ≥ 1.0` for normal-loudness sources through SFX bus (0.12 gain, compressor at −18 dB); aim 2.6–3.2 for one-shots; normalize source audio rather than pushing software gain past 4.0
  - All audio files: mono OGG, 48kHz, tight trims with short fades
  - Touch targets ≥44px; horizontal padding ≥8px between adjacent targets
  - `-webkit-touch-callout: none; user-select: none` on interactive elements with sustained touch
  - Pointer mode determined by current cell/item state at tap, not by mouse button — right-click is not a valid path on touch devices
  - Full validation: `pnpm check && pnpm test:local`
  - Delivery verification: `pnpm build` produces static site without errors

## User Intent
Clear the full backlog by fixing visual bugs, broken audio, missing assets, and UX friction across Train Sounds, Spot On, Drum Pad (renamed to Beat Pad with expanded bass/drone bank), Waterwall (long-press erase, touch feedback, SFX throttle), Story Trail (inventory feel), and the shared app shell (menu contrast, Quit button styling). Also: build a reusable audio loudness probe script, rename Drum Pad to Beat Pad, and produce a start-screen consistency audit.

## Legs

### LEG-1: Train Sounds — CSS & HTML cleanup
- Status: done
- Confirmed: yes
- Goal link: Clear all the visual and structural bugs in Train Sounds so later legs (landscape layout, audio) land on clean ground.
- Depends on: none
- Owned files:
  - `games/train-sounds/controller.tsx`
  - `games/train-sounds/renderer.ts`
  - `public/styles/train-sounds.css`
- Read-only:
  - `games/train-sounds/types.ts` — verify renderer interface changes
- Deferred shared edits: none
- Verification: `pnpm check` passes; grep confirms no `.train-hotspot::after` CSS rules remain; grep confirms no `train-coupler--one`, `train-car--first`, `train-coupler--two`, `train-car--second` in controller.tsx; grep confirms no `train-prev-btn` or `train-next-btn` in controller.tsx or renderer.ts
- Intent:
  1. Remove all `.train-hotspot::after` CSS rules (content, position, size, border, transition, hover/active/focus/hidden variants, responsive overrides, reduced-motion overrides). The `<span class="train-hotspot__indicator">` in the renderer already provides the indicator circle — the `::after` duplicates it.
  2. Remove stale ordinal classes from `controller.tsx` lines 146–149: replace `<span className="train-coupler train-coupler--one"></span>`, `<div className="train-car train-car--first"></div>`, `<span className="train-coupler train-coupler--two"></span>`, `<div className="train-car train-car--second"></div>` with just `<span className="train-coupler"></span>` and `<div className="train-car"></div>`. The renderer's `createDisplay()` generates dynamic classes (`train-coupler` with no ordinal, `train-car--{carriage}`) — the SSR template must not conflict.
  3. Increase rainbow band opacity from 0.18 to 0.3 in `.train-scene--rainbow::after` gradient. The rainbow is a static gradient with no animation, so no reduced-motion branching is needed.
  4. Delete the reduced-motion rule that hides the rainbow: `html[data-reduce-motion='reduce'] .train-sounds .train-scene--rainbow::after { display: none !important; }` and its responsive counterpart. A non-animated gradient should not be removed for reduced-motion users.
  5. Remove prev/next arrow button elements from `controller.tsx`: the `<div className="train-selector-bar">` section containing `#train-prev-btn` and `#train-next-btn`. Remove the entire selector bar markup including the Prev/Next buttons and labels. Keep the train name display and All Aboard button (they'll be restructured in LEG-10).
  6. Remove corresponding CSS: `.train-switch-btn`, `.train-switch-btn--prev`, `.train-switch-btn--next`, `.train-selector-bar` rules and all responsive/reduced-motion overrides. Keep `.train-all-aboard-btn` and `.train-name` styles.
  7. Remove `prevButton` and `nextButton` from `RendererRefs` interface and renderer initialization in `renderer.ts`. Remove the `prevButton`/`nextButton` properties from the returned `TrainSoundsRenderer` object. The renderer currently queries `#train-prev-btn` and `#train-next-btn` via `requireElement` — these will throw at init if the buttons don't exist, so they must be removed from the renderer alongside the template removal.

### LEG-2: Train Sounds — Audio probe & electric horn
- Status: done
- Confirmed: yes
- Goal link: Build a reusable loudness probe and use it to fix the silent electric horn and verify all Train Sounds samples are audible through the SFX bus chain.
- Depends on: none
- Owned files:
  - `scripts/audio-loudness-probe.ts` (new)
  - `games/train-sounds/sample-manifest.ts`
  - `public/train-sounds/audio/electric-horn.ogg`
  - `public/train-sounds/audio/coupler-clank.ogg` (possible re-render)
- Read-only:
  - `client/game-audio.ts` — SFX bus chain parameters (gain 0.12, compressor threshold −18 dB)
  - `client/audio.ts` — bus creation reference
- Deferred shared edits:
  - `.pi/skills/gnd-chart/SKILL.md` — update the "Recorded SFX audibility gate" workshop check to reference `pnpm exec tsx scripts/audio-loudness-probe.ts --game <slug>` as the concrete verification command for any leg shipping recorded one-shot SFX through `createSfxBus()`. Replace the current aspirational wording with a mandatory step.
- Verification: `pnpm exec tsx scripts/audio-loudness-probe.ts --game train-sounds` — all 12 samples report PASS (post-chain peak ≥ −18 dB)
- Intent:
  1. Create `scripts/audio-loudness-probe.ts` — a project-root script alongside `sync-attributions.ts`. It takes a `--game <slug>` argument (or `--all`). For the given game slug, it: (a) imports the game's `sample-manifest.ts`, (b) locates each `.ogg` file under `public/<slug>/audio/`, (c) decodes each one into an OfflineAudioContext at 48kHz (use Node-compatible audio decode — check `package.json` for `audio-decode`, `web-audio-engine`, or similar; add a dependency if needed), (d) applies the SFX bus chain: `GainNode(0.12)` → `DynamicsCompressorNode({ threshold: -18, ratio: 12, knee: 0, attack: 0.003, release: 0.25 })`, (e) renders offline, (f) measures post-chain peak (dB) and RMS (dB), (g) prints a table: sample ID, per-sample gain, post-chain peak dB, post-chain RMS dB, flag (PASS if post-chain peak ≥ −18 dB, FAIL otherwise). Exit code 0 if all pass, 1 if any fail. Save for reference and reuse across all games.
  2. Replace `electric-horn.ogg` — the file on disk is all-zero samples (peak −91 dB). Regenerate from the Freesound source (soundId 783760, "Moscow Metro 81-717 two chime horn" by chungus43A) with corrected `startSeconds` trim (the current 0.68s trim likely produced a silent clip). Re-render using the creative-assets workflow: download, trim to find the audible portion, fade, mono OGG at 48kHz/64kbps.
  3. Run the probe. For any FAIL, normalize the source audio (re-render with ffmpeg `loudnorm`) rather than pushing software gain past 4.0. The `coupler-clank` gain of 22 is a defect — normalize and re-render that file. Adjust manifest gains to the 2.6–3.2 target range for normal-loudness one-shots.
  4. Re-run the probe after adjustments. All 12 samples must pass.
  5. Update the chart skill's "Recorded SFX audibility gate" local extension: add a concrete reference to `pnpm exec tsx scripts/audio-loudness-probe.ts --game <slug>` as the mandatory verification command for any leg shipping recorded one-shot SFX through `createSfxBus()`. If the probe reports any FAIL, the leg is not done.

### LEG-3: Spot On — Room layout & item fill
- Status: done
- Confirmed: yes
- Goal link: Make Spot On rooms feel like real rooms you can comfortably interact with on phone portrait, and ensure the gameplay loop always fills every cell.
- Depends on: none
- Owned files:
  - `games/spot-on/state.ts`
  - `games/spot-on/renderer.ts`
  - `games/spot-on/input.ts`
  - `games/spot-on/types.ts`
  - `public/styles/spot-on.css`
- Read-only:
  - `games/spot-on/controller.tsx` — DOM structure reference
- Deferred shared edits: none
- Verification: `pnpm check && pnpm test:local`; manual visual check at 390×844 portrait — play area fills ≥65% viewport height, surfaces use ≥80% available width, all cells visible
- Intent:
  1. Fix squished phone-portrait layout: the play area must fill ≥65% of viewport height at 390×844 after all chrome elements (header, status bar, new-room button). Surfaces must use ≥80% of the available width. Cell sizing must stay comfortable: 44px touch targets, 8px gaps. Adjust `public/styles/spot-on.css` room scene, surface, and cell sizing rules to achieve this.
  2. Ensure room generation produces exactly as many items as there are total cells across all surfaces — no empty cells, no leftover items. In `state.ts` `generateRoom()`, after selecting surfaces and counting their total cells (`rows × cols` summed), select exactly that many items from the item pool. If the item pool is smaller than total cells, reduce surface count until the pools match, or expand item pools per theme. Update `shuffleAndPick` call to use the total-cell count.
  3. Add visual identity to rooms: each room theme gets procedural decorative elements (furniture shapes, art, windows, doorways) that make rooms feel like real rooms, not labeled rectangles. Shared scene perspective: top-down, looking slightly down at walls/floor (2D with subtle depth). Per-theme decorative specs: bedroom gets a headboard silhouette, window frame; kitchen gets a counter edge, stove outline; study gets a desk lamp shape, book end; playroom gets a crayon basket shape; bathroom gets a mirror frame, towel bar. Implement as CSS-drawn decorative elements (border, box-shadow, background patterns) or absolutely-positioned decorative `<div>` elements in the renderer, below the surface grid layer. Per-surface visual differentiation: storage surfaces get shelf-edge lines; furniture surfaces get drawer/door lines; fixture surfaces get hook shapes; ledge surfaces get a thin top edge highlight.
  4. Remove the stale `.room-item--placed` selector reference in `input.ts` line 24: `document.querySelectorAll<HTMLElement>('.room-item:not(.room-item--placed)')`. The class `room-item--placed` is never applied in the renderer. Change the selector to just `.room-item` or use a data-attribute check if placed items should be excluded from the focusable set.

### LEG-4: Spot On — Audio sourcing
- Status: done
- Confirmed: yes
- Goal link: Spot On is currently silent — only 1 of 5 audio files exists on disk. Make the game sound complete.
- Depends on: none
- Owned files:
  - `games/spot-on/sample-manifest.ts`
  - `public/spot-on/audio/pick-up-whoosh.ogg` (new)
  - `public/spot-on/audio/place-thunk.ogg` (new)
  - `public/spot-on/audio/completion-chime.ogg` (new)
  - `public/spot-on/audio/room-transition.ogg` (new)
- Read-only:
  - `games/spot-on/sounds.ts` — playback pipeline reference
  - `scripts/audio-loudness-probe.ts` — verification tool (owned by LEG-2)
- Deferred shared edits:
  - `app/data/attribution-index.ts` — update Spot On attribution entries after new Freesound sources are finalized
- Verification: `pnpm exec tsx scripts/audio-loudness-probe.ts --game spot-on` — all samples pass; all 5 `.ogg` files exist in `public/spot-on/audio/`
- Intent:
  1. Source CC0 audio for the 4 missing samples: `pick-up-whoosh`, `place-thunk`, `completion-chime`, `room-transition`. Each must meet the creative-assets sourcing workflow: find real Freesound CC0 sounds, download, trim, fade, convert to mono OGG at 48kHz. Use `FREESOUND_API_KEY` from `.env` and ffmpeg. The existing Freesound IDs in the manifest (soundId 414, 33508, 395, 17787) are non-CC0 or deleted — find fresh CC0 sources instead.
  2. Update `sample-manifest.ts` with real Freesound source IDs, titles, creators, and source URLs for all 4 new files. Set `bundled: true` and appropriate gain (2.6–3.2 target range), processing specs (duration, mono, bitrate, filters, fades).
  3. Place all 5 `.ogg` files (4 new + existing `drop-put-down.ogg`) in `public/spot-on/audio/`. Verify the existing `drop-put-down.ogg` is valid (not silent).
  4. Run `pnpm exec tsx scripts/audio-loudness-probe.ts --game spot-on`. All samples must pass. Adjust gains if needed per probe results.

### LEG-5: Drum Pad — Fix broken sounds & e2e route
- Status: done
- Confirmed: yes
- Goal link: Drum Pad is completely silent — all 8 samples are `bundled: false` with placeholder Freesound IDs, no audio files exist on disk. The e2e tests also reference the wrong route (`/music-pad/` instead of `/drum-pad/`). Fix both.
- Depends on: none
- Owned files:
  - `games/drum-pad/sample-manifest.ts`
  - `games/drum-pad/sounds.ts`
  - `public/drum-pad/audio/*.ogg` (8 new files)
  - `e2e/site-07-game-smoke.spec.ts`
- Read-only:
  - `games/drum-pad/controller.tsx` — e2e test structure reference
  - `games/drum-pad/main.ts` — startup pipeline
- Deferred shared edits:
  - `app/data/attribution-index.ts` — update Drum Pad attribution entries after new Freesound sources are finalized
- Verification: `pnpm exec tsx scripts/audio-loudness-probe.ts --game drum-pad` — all 8 samples pass; `pnpm test:local` e2e tests for drum-pad pass
- Intent:
  1. Fix the e2e test route mismatch: update all `page.goto('/music-pad/')` references in `site-07-game-smoke.spec.ts` to `/drum-pad/`. Update any "Music Pad" heading assertions to match the current game title "Drum Pad". There are 3 test blocks affected (lines ~630, ~636, ~648).
  2. Investigate the playback pipeline in `sounds.ts`: confirm that `bundled: false` samples are skipped at decode time and silently fail. The `getBundledDrumPadSamples()` function filters for `bundled: true` — with all samples at `bundled: false`, the preload step returns an empty array and no audio is ever decoded or played.
  3. Source CC0 audio for all 8 samples (kick, snare, hihat-closed, hihat-open, clap, rimshot, tom, cymbal). Use the creative-assets workflow: find real Freesound CC0 sounds, download with `FREESOUND_API_KEY`, trim, fade, convert to mono OGG at 48kHz. Each sample should have distinct tonal character fitting its role.
  4. Set `bundled: true` on all 8 entries in `sample-manifest.ts`. Replace placeholder Freesound source metadata (soundId 0, "TBD" titles) with real source IDs, titles, creators, URLs.
  5. Place all 8 `.ogg` files in `public/drum-pad/audio/`.
  6. Run `pnpm exec tsx scripts/audio-loudness-probe.ts --game drum-pad`. All 8 samples must pass. Adjust gains per probe results.
  7. Verify the 3 previously-failing e2e tests now pass under the corrected `/drum-pad/` route.

### LEG-6: Beat Pad — Bank toggle & low-end sounds (rename from Drum Pad)
- Status: done
- Confirmed: yes
- Goal link: Rename the game from Drum Pad to Beat Pad and add a Kit/Bass bank toggle with deeper kick/tom and new bass/drone sounds, so the pad invites layered rhythmic play.
- Depends on: LEG-5
- Owned files:
  - Everything currently in `games/drum-pad/` (renamed to `games/beat-pad/`)
  - `games/beat-pad/sample-manifest.ts`
  - `games/beat-pad/sounds.ts`
  - `games/beat-pad/state.ts`
  - `games/beat-pad/renderer.ts`
  - `games/beat-pad/controller.tsx`
  - `games/beat-pad/input.ts`
  - `games/beat-pad/types.ts`
  - `public/styles/beat-pad.css` (renamed from `drum-pad.css`)
  - `public/beat-pad/audio/*.ogg` (8 new bass bank files + 2 re-rendered kit files)
  - `public/favicon-game-beat-pad.svg` (new, updated visual — music note or sound-wave motif rather than drum)
  - `app/routes.ts`
  - `app/router.ts`
  - `app/data/game-registry.ts`
  - `build.ts`
  - `e2e/site-07-game-smoke.spec.ts`
- Read-only:
  - `scripts/audio-loudness-probe.ts`
  - `app/ui/game-shell.tsx`
- Deferred shared edits:
  - `app/data/attribution-index.ts` — update attribution entries from drum-pad to beat-pad
- Verification: `pnpm exec tsx scripts/audio-loudness-probe.ts --game beat-pad` — all 16 samples pass (8 kit + 8 bass); `pnpm test:local` e2e tests pass under `/beat-pad/`; `pnpm build` succeeds
- Intent:
  1. **Rename everywhere:** rename `games/drum-pad/` directory to `games/beat-pad/`. Update all internal imports from `../drum-pad/` or `./drum-pad/` paths. Update `app/routes.ts`: `drumPadInfo: '/drum-pad/info/'` → `beatPadInfo: '/beat-pad/info/'`, `drumPad: '/drum-pad/'` → `beatPad: '/beat-pad/'`. Update `app/router.ts`: import path, route binding. Update `app/data/game-registry.ts`: `slug: 'drum-pad'` → `slug: 'beat-pad'`, name "Drum Pad" → "Beat Pad". Update `build.ts`: all `drum-pad/` references → `beat-pad/` (entry points, HTML output, service worker, cache manifest). Rename `public/styles/drum-pad.css` → `public/styles/beat-pad.css`. Rename `public/drum-pad/` → `public/beat-pad/` (manifest.json, sw.js, audio/). Rename `public/favicon-game-drum-pad.svg` → `public/favicon-game-beat-pad.svg`. Update e2e test routes from `/drum-pad/` → `/beat-pad/`. Update heading text in controller.tsx from "Drum Pad" to "Beat Pad". Update meta description. Update all `bodyClass` references.
  2. **New game icon:** create `public/favicon-game-beat-pad.svg` — replace the 4-pad grid with a visual that reads as "beat/sound" rather than "drum." Use a music note (♩) or sound-wave motif. Keep the 32×32 viewBox and neon color palette for consistency with the game's visual system.
  3. **Add bank system:** new `BeatPadBankId` type: `'kit' | 'bass'`. Add `activeBank: BeatPadBankId` to game state (default `'kit'`). Add a bank toggle button in the UI — compact pill-style toggle near the mode bar. When switching banks, pads re-render with the new bank's labels and sounds. Cap at ≤4 hotspots visible at 390×844 without overlap; targets ≥44px; 8px horizontal padding between adjacent targets.
  4. **Deepen kick & tom:** re-render `drum-kick.ogg` and `drum-tom.ogg` with adjusted processing filters to emphasize 40–200 Hz range. Increase gain for punchy low-end presence through phone speakers. Re-run loudness probe to verify.
  5. **Add bass bank samples (≈8 sounds):** sub-bass hit, bass drone (sustained low hum), saw buzz (sustained mid), tonal hit, chord stab, filtered noise sweep, and 1–2 more typical beat pad bass/rhythmic tones. All CC0-sourced via creative-assets workflow, mono OGG, processed. Add to `sample-manifest.ts` with `bundled: true`.
  6. **Update `sounds.ts`:** route bank selection to the correct sample set. Handle sustained/drone samples with appropriate looping envelope — use `source.loop = true` for drones with a finite play duration, and a longer release envelope.
  7. **Update controller, renderer, CSS:** bank toggle UI, pad labels per bank (e.g. "Sub Bass", "Drone", "Saw Buzz" etc.), visual differentiation between Kit and Bass banks (e.g. Bass bank pads use a warm/amber color set vs. Kit's neon palette).

### LEG-7: Waterwall — Touch feedback, SFX throttle & long-press erase
- Status: done
- Confirmed: yes
- Goal link: Make barrier placement feel responsive without being noisy, and add a satisfying long-press erase mechanic that gives players a powerful way to clear space.
- Depends on: none
- Owned files:
  - `games/waterwall/input.ts`
  - `games/waterwall/state.ts`
  - `games/waterwall/renderer.ts`
  - `games/waterwall/sounds.ts`
  - `games/waterwall/types.ts`
  - `games/waterwall/animations.ts`
  - `games/waterwall/main.ts`
- Read-only: none
- Deferred shared edits: none
- Verification: `pnpm check && pnpm test:local`; Playwright screenshot at 390×844 showing flash on placement and erase circle during hold
- Intent:
  1. **Visual flash on placement:** When a cell transitions from empty to barrier, render a brief (~150ms) bright overlay that decays. Add a per-cell flash timer to the render model (`WaterwallRenderModel` gets a `flashCells: Map<string, number>` where the key is `row,col` and the value is remaining flash duration in ms). In `renderFrame()`, for each cell in `flashCells`, draw a white semi-transparent overlay with alpha proportional to remaining duration. Decay flash timers each frame (subtract frame delta; remove entries at 0). When `placeBarrier()` succeeds, add the cell to `flashCells` with 150ms.
  2. **SFX throttle:** Throttle `playBarrierPlaceSound()` so it fires at most once per 120ms during drag operations. Add a `lastPlaceSoundTime` variable in `sounds.ts`. On call, skip if `context.currentTime - lastPlaceSoundTime < 0.12`. For the initial tap (pointer-down), play the full plink. For drag-extends, play a shorter, quieter "settle" variant (shorter duration ~60ms, lower gain 0.015) at throttled intervals. Alternatively: play sound only on the first cell of each tap/drag, not on every drag-extend cell — this is simpler and eliminates chatter entirely.
  3. **Long-press erase mechanic:** New action type `{ type: 'erase-burst'; coordinate: WaterwallCoordinate; radius: number }`. Hold pointer on a cell for ≥400ms to begin expanding erase radius. The radius grows from 1 cell to max radius 5 over ~2s of continued hold. On release, all cells within the circular radius (using Euclidean distance from center cell) that are barriers become empty (barriers removed), and all water cells within the radius become empty (water temporarily displaced — it flows back naturally via simulation on subsequent ticks). Visual indicator: during hold, draw an expanding circle outline on the canvas at the hold position, with radius matching the current erase radius. Circle border: white, alpha 0.4, lineWidth 2. Use a distinct `playEraseBurstSound()` on release — a "whoosh-clear" effect (filtered noise burst, ~200ms, lowpass sweep 3000→400 Hz), played once on release not per-cell. New state field for tracking active erase hold: `eraseHold: { coordinate: WaterwallCoordinate; startTime: number } | null`. Input handler sets this on pointer-down after 400ms, updates radius each frame, fires erase-burst on pointer-up if hold is active.
  4. **Erase burst in state.ts:** new `eraseBurst(grid, coordinate, radius)` function that iterates cells within the Euclidean radius, converts barriers to empty and water to empty. Returns new grid. Update `barrierCount` and `barrierOrder` accordingly (remove erased barriers from order).
  5. **iOS protection:** ensure `-webkit-touch-callout: none; user-select: none` is set on the canvas (already present in `renderer.ts` runtime styles; confirm it also covers the long-press threshold to prevent iOS native copy callout). Add `touch-action: manipulation` if not already present.
  6. **Pointer interaction clarification:** pointer mode is determined by current cell type at tap — tap empty = place barrier, tap water = no-op (water can't be replaced). Tap on barrier during a short press = no-op (short press doesn't remove barriers anymore — that was already the case with the "always place" logic). Long-press erase is the removal mechanic, available on all cell types. Right-click is not a valid path on touch devices.

### LEG-8: Story Trail — Inventory feel refinement
- Status: done
- Confirmed: yes
- Goal link: The equip loop is mechanically correct but the visual weight and interaction pacing don't feel settled on phone portrait.
- Depends on: none
- Owned files:
  - `public/styles/story-trail.css`
  - `games/story-trail/renderer.ts`
  - `games/story-trail/accessibility.ts`
- Read-only:
  - `games/story-trail/input.ts` — inventory interaction flow
  - `games/story-trail/state.ts` — equipped item state
  - `games/story-trail/controller.tsx` — DOM structure
- Deferred shared edits: none
- Verification: Playwright screenshot at 390×844 portrait showing equipped item state is visually distinct from unequipped items; manual visual check at both orientations
- Intent:
  1. Tune inventory selection state visual weight on phone portrait: increase contrast/border/background of the equipped item in `#inventory-bar` so it reads clearly as "selected" at 390×844. The equipped item should have a distinct visual treatment: brighter border (e.g. 2px solid accent color), subtle background glow or fill, slight scale-up (1.05×). Unequipped items should appear muted by comparison (default/dimmed state).
  2. Tune interaction pacing: add a brief tactile confirmation when equipping/unequipping — a short scale bounce (1.0 → 1.1 → 1.0 over ~150ms) or a pulse flash on the item button. Use CSS transition/animation so it feels responsive.
  3. Test at 390×844 portrait and 844×390 landscape — equipped state must be obvious in both orientations.
  4. Touch targets in `#inventory-bar` and `#inventory-overlay` must be ≥44px. Verify existing sizing and adjust if needed.

### LEG-9: App — Menu contrast, accessibility & Quit button styling
- Status: done
- Confirmed: yes
- Goal link: The shared modal overlay has poor contrast and the Quit link doesn't read as a button. Fix once in the shared component to improve all games.
- Depends on: none
- Owned files:
  - `app/ui/game-shell.tsx`
  - `app/ui/site-styles.ts`
  - `public/styles/game.css`
  - `games/train-sounds/controller.tsx`
  - `games/drum-pad/controller.tsx` (will become `games/beat-pad/controller.tsx` after LEG-6, but this leg may dispatch before LEG-6)
- Read-only:
  - Other game controllers that set `overlayStyles` — to audit which custom overrides exist and can be removed
- Deferred shared edits: none
- Verification: `pnpm check` passes; manual visual check — modal overlay is near-opaque, text reads at WCAG AA contrast, Quit action looks like a pill button matching Restart
- Intent:
  1. Increase modal overlay opacity for WCAG AA contrast: change the shared default `background: 'rgba(4, 10, 20, 0.72)'` in `settingsModalBaseStyles` (game-shell.tsx line 62) to at least `rgba(4, 10, 20, 0.92)`. This makes the game content behind the modal sufficiently obscured and ensures modal text has adequate contrast against the background.
  2. Raise text contrast in `site-styles.ts`: change `color: 'rgba(255, 255, 255, 0.5)'` in `tabButtonStyles` (line 237) to at least `rgba(255, 255, 255, 0.87)` for inactive tabs. Active tabs and other text should also meet WCAG AA (4.5:1 contrast ratio against the dark overlay).
  3. Audit and update per-game overlay overrides: Train Sounds uses `rgba(9, 20, 36, 0.82)` — bump to 0.92. Drum Pad uses `rgba(6, 6, 18, 0.82)` — bump to 0.92. Any other custom overlays should also be ≥0.92 or removed entirely if the shared default is now sufficient.
  4. Fix Quit link styling: the Quit action (`<a className="settings-quit-link">`) must render as a visually identical pill button to Restart (`<button className="settings-restart-btn">`). The shared CSS already declares them together with matching styles (border-radius, padding, background, border), but the `<a>` element likely inherits global link styles (color, text-decoration, underline) that break the button appearance. Add explicit overrides to `.settings-quit-link` in `game.css`: `color: var(--game-white)`, `text-decoration: none`, `border: 2px solid rgba(255, 255, 255, 0.25)`, `background: rgba(255, 255, 255, 0.12)`, and any other properties needed to neutralize inherited link styles. Ensure hover/focus states also match. A subtle color difference is acceptable (e.g. Quit gets a slightly muted border or background), but it must read as a button, not a floating link.

### LEG-10: Train Sounds — All Aboard beside train name
- Status: done
- Confirmed: yes
- Goal link: The selector bar should be a compact horizontal row with the All Aboard button beside the train name, regardless of orientation.
- Depends on: LEG-1
- Owned files:
  - `games/train-sounds/controller.tsx`
  - `public/styles/train-sounds.css`
- Read-only:
  - `games/train-sounds/renderer.ts`
- Deferred shared edits: none
- Verification: Playwright screenshot at 390×844 portrait and 844×390 landscape — All Aboard button visible beside train name, tracks full-width
- Intent:
  1. Reflow the game screen selector area so the train name and All Aboard button sit side by side in a horizontal row, regardless of orientation. In `controller.tsx`, restructure the markup: the train name (`#train-name`) and All Aboard button (`#all-aboard-btn`) should be sibling elements in a flex row container (e.g. `<div className="train-selector-row">`).
  2. Remove any landscape-specific compensations in CSS that were trying to fix vertical stacking — the new horizontal layout works in all viewports.
  3. The train scene and tracks stay full-width at all viewport sizes. The selector row sits above the scene as a compact bar.
  4. Adjust CSS: `.train-selector-row` uses `display: flex; align-items: center; justify-content: center; gap: clamp(0.5rem, 2vw, 1rem);` with appropriate padding. Train name and All Aboard button share the horizontal space. All Aboard keeps its existing styling but may need minor sizing adjustments to fit beside the name.

### LEG-11: Spot On — Touch interaction & target clarity
- Status: done
- Confirmed: yes
- Goal link: Ensure every tap target is unambiguous — cells fully visible, floor items never overlapping, and pointer behavior is purely state-based.
- Depends on: LEG-3
- Owned files:
  - `games/spot-on/input.ts`
  - `games/spot-on/renderer.ts`
  - `games/spot-on/state.ts`
  - `public/styles/spot-on.css`
- Read-only:
  - `games/spot-on/types.ts` — coordinate/item types
- Deferred shared edits: none
- Verification: Playwright screenshot at 390×844 portrait — all cells visible, no floor item overlaps; tap-empty-places, tap-occupied-picks-up flow verified
- Intent:
  1. Pointer mode is determined by cell/item state at tap: tap empty cell while carrying → place, tap occupied cell → pick up item from that cell, tap carried item on floor → drop. Right-click is not a valid path on touch devices. Verify the existing `input.ts` click handlers implement this correctly — they appear to (cell click checks `cell.dataset.itemId`, item click checks carry state). Document this as the canonical behavior in a code comment.
  2. Every cell in every surface must be 100% visible: no cells hidden behind other surfaces, no overflow clipping, no overlap between adjacent surface grids. At 390×844 portrait, all cells must be clearly visible and tappable. If any surfaces overlap (positioned too closely in `positionSurfaces()`), increase `SURFACE_GAP` or reduce surface count. Check for `overflow: hidden` on `room-scene` or `room-surface` that might clip cells.
  3. Pre-placement floor items must not overlap each other: currently `scatterItemsWithRng()` in `state.ts` only enforces `MIN_GAP_X = 14` (horizontal gap) with no vertical gap check, and items at similar Y positions will overlap. Replace `generateScatterPositionsWithRng()` with a proper overlap-avoidance algorithm: for each item, generate candidate `(x, y)` positions and check that no previously-placed item's bounding circle overlaps. Each item has a minimum 44px touch area and 8px gap to neighbors. Account for the item button size (emoji + padding) when computing overlap.
  4. Add `-webkit-touch-callout: none; user-select: none; touch-action: manipulation` on the room scene container (`.room-scene`) for iOS protection.
  5. Verify `role="button"` and `tabindex="0"` on cells in `renderer.ts` `createCellElement()` — these are already set. Confirm keyboard accessibility works alongside touch.

### LEG-12: Cross-game — Start screen audit & recommendations
- Status: done
- Confirmed: yes
- Goal link: Document the current inconsistencies across game start screens so a future leg can address them with clear targets.
- Depends on: none
- Owned files:
  - `.planning/start-screen-audit.md` (new — audit report)
- Read-only:
  - All game `controller.tsx` files — DOM structure audit
  - All per-game CSS files — sizing audit
  - `app/ui/game-shell.tsx` — shared component structure
  - `public/styles/game.css` — shared styles
- Deferred shared edits: none
- Verification: audit report file exists and covers all games
- Intent:
  1. Audit all game start screens for: heading font-size, subtitle font-size, CTA button sizing/padding/border-radius, header/menu button placement, overall layout rhythm (header → subtitle → CTA), spacing between elements, and use of shared `GameHeader`/`GameScreen` components.
  2. For each game, record the current CSS values for the above properties. Flag outliers — games that use significantly different sizes, spacing, or layout patterns from the majority.
  3. Include concrete recommendations for a shared rhythm: target heading scale, subtitle scale, CTA button sizing, header layout, and spacing. These should be implementable values (e.g. `clamp(1.6rem, 5vw, 2.4rem)` for headings) that future legs can apply.
  4. No code changes — audit and report only.

## Implementation
Commit: 5fb6686
Pushed: 2025-07-10

### Post-review corrections
- LEG-1 deferred: Fixed `games/train-sounds/main.ts` and `games/train-sounds/input.ts` to remove prevButton/nextButton references (8 type errors)
- LEG-1 deferred: Updated `games/train-sounds/input.test.ts` to remove prev/next button mocks and use callback-based navigation
- LEG-2 boundary: Accepted re-render of `highspeed-passby.ogg` (tightly coupled to manifest gain change)
- LEG-10 deferred: Fixed `games/train-sounds/renderer.ts` to measure selector row height instead of both train name + All Aboard individually (panelGapPx * 2 instead of * 3)
- Lint fixes: `const` for `flashCells` in waterwall/main.ts, removed unused `MissionOrbitSampleProcessingPlan` import in audio-loudness-probe.ts
- LEG-6 lint: Removed unused `bassNames` variable and `PAD_NAMES` import in beat-pad files
- LEG-6 deferred: Updated `app/data/attribution-index.ts` for drum-pad → beat-pad rename
- LEG-9 deferred: Bumped overlay opacity to 0.92 for chompers, mission-orbit, pixel-passport, squares, super-word controllers
- Synced ATTRIBUTIONS.md with `pnpm sync:attributions`
Parallel group 1 (no dependencies, no conflicts):
1. LEG-1 (Train Sounds CSS/HTML) — no dependencies
2. LEG-2 (Train Sounds audio probe) — no dependencies
3. LEG-3 (Spot On layout) — no dependencies
4. LEG-4 (Spot On audio) — no dependencies
5. LEG-5 (Drum Pad fix + e2e route) — no dependencies
6. LEG-7 (Waterwall feedback + erase) — no dependencies
7. LEG-8 (Story Trail inventory) — no dependencies
8. LEG-9 (Menu contrast + Quit styling) — no dependencies
9. LEG-12 (Start screen audit) — no dependencies

Sequential after dependencies:
10. LEG-10 (Train Sounds All Aboard layout) — depends on LEG-1
11. LEG-6 (Beat Pad rename + bank) — depends on LEG-5
12. LEG-11 (Spot On touch) — depends on LEG-3

After all complete: deferred edits → `## Project Context` full-validation → delivery verification → commit → push.