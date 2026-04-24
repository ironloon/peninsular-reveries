# Plan: Drum Pad Rename, Train Sounds Polish, Spot On New Game

## Project Context
- Sources:
  - `games/train-sounds/` — existing train sound toy, all modules
  - `games/music-pad/` → `games/drum-pad/` — existing drum pad, all modules
  - `app/data/game-registry.ts` — game catalog for home page
  - `app/routes.ts`, `app/router.ts` — route and controller wiring
  - `build.ts` — esbuild bundle, prerender, budget
  - `client/audio.ts` — shared audio bus (SFX bus gain 0.12, compressor threshold -18 dB)
  - `client/preferences.ts` — reduce-motion, sfx-enabled preferences
  - `client/game-accessibility.ts` — announce() helper
  - `.pi/skills/creative-assets/references/audio-source-notes.md` — CC0 sourcing, audibility gate
  - `.pi/skills/gnd-chart/SKILL.md` — density caps, audibility gates, visual fidelity, pointer touch rules, viewport floors
- Constraints:
  - CC0 or public-domain only for audio/visual assets
  - Per-sample `gain ≥ 1.0` for normal-loudness sources through SFX bus (0.12 gain, compressor at -18 dB); actual floor per LOCAL.md: `gain ≥ 1.0` minimum, aim 2.6–3.2 for one-shots
  - ≤4 interactive hotspots visible at 390×844 without overlap; targets ≥44px; horizontal padding ≥8px between adjacent targets (train-sounds density cap)
  - Spot On playfield must fill ≥50% of remaining viewport height at 390×844 portrait after all chrome elements
  - Pointer mode determined by current carried-item state on touch — no right-click reliance
  - All animations gated by `isReducedMotionEnabled()` / `data-reduce-motion` attribute
  - Emoji art is placeholder — sourcing deferred; note explicitly in leg intent
  - Attribution entries for every CC0 asset; `pnpm sync:attributions` after audio legs
  - New-game feel probe passed: "Spot On" name is readable and evocative; primary mechanic (pick up, place anywhere) communicates tidying without requiring instruction; "toy" quality is high — experimenting with arrangements is inherently rewarding
  - Shared scene perspective for Spot On: side-view (consistent with train-sounds, waterwall) — rooms rendered as illustrated side-view dioramas
- Full validation:
  - `pnpm build`
  - `pnpm test`
  - `pnpm sync:attributions`
- Delivery verification:
  - local-only (dev server verification)

## User Intent
Rename "Music Pad" to "Drum Pad" across all surfaces and replace all its synthesized sounds with real CC0 drum samples. Polish Train Sounds by hiding hotspot word labels (replacing them with invisible clickable spots with descriptive aria labels), adding an "All Aboard!" button that animates the train departing and the next train arriving, and adding scene randomness (rainbow, moving clouds, randomized train direction) with proper reduce-motion gating. Remove all remaining synthesized sounds (including the electric-hum-brightener reinforcement) and replace with CC0 samples, and fix any quiet train sounds. Create a new game called "Spot On" — a cozy room-tidying toy where you pick up misplaced items and place them anywhere you like; there are no right or wrong spots, just whatever feels tidy to you, and a "New Room" button for fresh layouts and items.

## Legs

### LEG-1: Drum Pad Rename — Music Pad → Drum Pad
- Status: pending
- Confirmed: yes
- Goal link: User explicitly asked to rename music pad to drum pad; backlog item also references this rename.
- Depends on: none
- Owned files:
  - `games/music-pad/` → `games/drum-pad/` (entire directory: controller.tsx, main.ts, types.ts, state.ts, renderer.ts, input.ts, accessibility.ts, animations.ts, sounds.ts, info.ts, attributions.ts, sample-manifest.ts, state.test.ts, input.test.ts)
  - `public/music-pad/` → `public/drum-pad/` (manifest.json, sw.js)
  - `public/styles/music-pad.css` → `public/styles/drum-pad.css`
  - `public/favicon-game-music-pad.svg` → `public/favicon-game-drum-pad.svg`
  - `app/data/game-registry.ts`
  - `app/routes.ts`
  - `app/router.ts`
  - `build.ts`
- Read-only:
  - `app/ui/document.tsx` — Document wrapper reference
  - `app/ui/game-shell.tsx` — shared UI component API
- Deferred shared edits:
  - `ATTRIBUTIONS.md` — run `pnpm sync:attributions` after all legs complete
- Verification: `grep -ri "music.pad" games/drum-pad/ app/data/game-registry.ts app/routes.ts app/router.ts build.ts public/styles/drum-pad.css` returns 0 matches (excluding backwards-compatible URL comments if any); `pnpm build` succeeds
- Intent:
  1. Rename directory `games/music-pad/` → `games/drum-pad/`; update all internal imports to use `./drum-pad/` paths
  2. Rename directory `public/music-pad/` → `public/drum-pad/`; rename `public/styles/music-pad.css` → `public/styles/drum-pad.css`; rename `public/favicon-game-music-pad.svg` → `public/favicon-game-drum-pad.svg`
  3. Update all player-visible strings: game title "Drum Pad", subtitle "Tap, loop, and layer beats.", description "Tap, loop, and layer beats on a neon drum pad.", manifest name/short_name, start/game screen headings, aria labels
  4. Update `app/data/game-registry.ts`: slug `'drum-pad'`, name `'Drum Pad'`, description updated, icon 🥁
  5. Update `app/routes.ts`: `drumPad: '/drum-pad/'`, `drumPadInfo: '/drum-pad/info/'`
  6. Update `app/router.ts`: import from `../games/drum-pad/controller.js`, wire `routes.drumPad` and `routes.drumPadInfo`
  7. Update `build.ts`: entry point `games/drum-pad/main.ts`, static routes for `/drum-pad/` and `/drum-pad/info/`, client dir `drum-pad`, SW stamp `drum-pad/sw.js`, budget page `drum-pad`
  8. Update `games/drum-pad/info.ts`: summary text references "Drum Pad"
  9. Update `games/drum-pad/attributions.ts`: slug `'drum-pad'`, name `'Drum Pad'`
  10. Update `games/drum-pad/sample-manifest.ts`: URL paths `/drum-pad/audio/...`
  11. Update CSS: body class `body.drum-pad`, all `.music-pad-` class prefixes → `.drum-pad-`, CSS custom properties
  12. Update `games/drum-pad/controller.tsx`: Document title/description/path, stylesheets/scripts paths, body class, favicon path, manifest/SW paths, all heading text, noscript message, class names in JSX
  13. Verify no remaining references to "music-pad" in the renamed files (grep audit)

### LEG-2: Train Sounds — Hotspot Overhaul
- Status: pending
- Confirmed: yes
- Goal link: User wants to "hide words, and just make hotspots clickable, the spots on the trains, (maybe aria describe what it looks like, or what it is?)"
- Depends on: none
- Owned files:
  - `games/train-sounds/renderer.ts`
  - `games/train-sounds/catalog.ts`
  - `games/train-sounds/types.ts`
  - `public/styles/train-sounds.css`
- Read-only:
  - `games/train-sounds/accessibility.ts` — announcement patterns
  - `games/train-sounds/main.ts` — hotspot click handler wiring
- Deferred shared edits: none
- Verification: `grep "textContent" games/train-sounds/renderer.ts | grep -v "trainName\|//"` shows 0 hotspot label assignments; TypeScript compiles; `pnpm test` passes
- Intent:
  1. Add `ariaDescription` field to `TrainHotspotDefinition` in `types.ts` — a string describing the visual appearance of the train part (e.g., `"the tall pipe on top of the engine"`, `"mounted below the cab on the steam engine"`, `"the sliding door on the coach car"`)
  2. Add `ariaDescription` values to all 16 hotspot entries in `catalog.ts` across all 4 presets. Descriptions reference visual appearance so screen readers convey spatial information:
     - Steam: whistle = "the tall pipe on top of the engine", bell = "the brass bell hanging below the cab", rods = "the moving bars between the wheels", passenger door = "the sliding door on the coach car"
     - Diesel: horn = "the bright horns on the roof", engine hum = "the low rumble from the engine compartment", brake = "the brake lever near the wheels", cargo latch = "the heavy latch on the boxcar door"
     - Electric: horn = "the twin chime horns on the roof", power hum = "the transformer hum from under the car", brake = "the brake rigging near the wheels", passenger door = "the sliding door between cars"
     - High-speed: horn = "the aerodynamic horn in the nose", power hum = "the quiet motor hum under the floor", brake = "the disc brakes near the wheels", passenger door = "the automatic door in the streamlined car"
  3. Update `createHotspotButton` in `renderer.ts`: remove `button.textContent = getVisibleHotspotLabel(hotspot.label)`, remove `button.title = hotspot.label`, update `aria-label` to combine name + description: `${hotspot.label} — ${hotspot.ariaDescription}`. Remove `getVisibleHotspotLabel` function (no longer needed). Keep `min-width`/`min-height` 44px touch target. Keep `overflow: hidden` on the button.
  4. Restyle `.train-hotspot` in `train-sounds.css`:
     - Default state: `background: transparent; border: 2px solid transparent; box-shadow: none; color: transparent;` — completely invisible when idle
     - `:hover`: `border-color: rgba(12, 79, 130, 0.4); box-shadow: 0 0 12px rgba(12, 79, 130, 0.2); background: rgba(255, 255, 255, 0.15);` — faint discoverable glow
     - `:focus-visible`: `outline: 3px solid rgba(10, 62, 104, 0.5); background: rgba(255, 255, 255, 0.2);` — clear keyboard focus ring
     - `:active` / `.is-pressed`: `transform: scale(0.95); background: rgba(255, 255, 255, 0.3);` — brief press feedback
     - Remove `pointer-events: auto` override since parent is `pointer-events: none` — keep it (buttons still need pointer events)
     - Remove `::after` dashed border pseudo-element (no longer useful on invisible buttons)
  5. Density check: 4 hotspots per train at 390×844 — within LOCAL.md cap of ≤4. Targets min 44px. Horizontal padding ≥8px between adjacent hotspots.

### LEG-3: Train Sounds — All Aboard & Scene Animation
- Status: pending
- Confirmed: yes
- Goal link: User asked for "All Aboard!" button, train departure animation, scene randomness, and reduce-motion gating.
- Depends on: LEG-2 (hotspot changes affect renderer structure)
- Owned files:
  - `games/train-sounds/animations.ts`
  - `games/train-sounds/state.ts`
  - `games/train-sounds/types.ts`
  - `games/train-sounds/renderer.ts`
  - `games/train-sounds/controller.tsx`
  - `games/train-sounds/main.ts`
  - `games/train-sounds/input.ts`
  - `games/train-sounds/accessibility.ts`
  - `public/styles/train-sounds.css`
- Read-only:
  - `client/preferences.ts` — `isReducedMotionEnabled()`
  - `client/game-animations.ts` — `isReducedMotion()`
- Deferred shared edits: none
- Verification: `grep "train-exiting\|train-entering\|train-scene--rainbow\|train-all-aboard" public/styles/train-sounds.css` shows new rules; `grep "allAboard" games/train-sounds/main.ts` shows handler; `pnpm build` succeeds; `pnpm test` passes
- Intent:
  1. Add types in `types.ts`:
     - `TrainDirection = 'left' | 'right'` — which way the locomotive faces
     - Add to `TrainSoundsState`: `trainDirection: TrainDirection`, `hasRainbow: boolean`, `cloudOffset: number` (random horizontal shift % for clouds)
  2. Update `state.ts`:
     - `createInitialTrainSoundsState()` — randomize `trainDirection`, `hasRainbow` (30% chance), `cloudOffset` (random 0–15)
     - `selectNextTrain()` / `selectPreviousTrain()` — re-randomize direction, rainbow, cloud offset
     - New `allAboard(state)` — sets a `departing: boolean` flag and advances to next/previous train (wrapping); randomizes new scene params
     - Add `departing: boolean` to state (set true during departure, cleared after transition)
  3. Rewrite `animations.ts` — replace no-ops with real implementations:
     - `animateTrainSwitch(scene, trainName, triggerButton)` — add `.train-exiting` class to display; on `transitionend` (or 600ms timeout), remove old train, render new train with `.train-entering` class, then remove class after settle. Gated by `isReducedMotion()` — if reduced: no animation classes, instant switch.
     - `animateHotspotPress(scene, hotspotButton)` — add `.is-pressed` class, remove after 150ms. Gated by reduce-motion — if reduced: add/remove immediately without visual change.
     - `animateAllAboard(scene, displayFrame)` — add `.train-departing` class (train exits in facing direction); returns a Promise that resolves when exit animation completes (or immediately under reduce-motion). Caller renders next train and calls `animateTrainArrival`.
     - `animateTrainArrival(scene, displayFrame)` — add `.train-entering` class (train enters from opposite side); resolves when settled.
     - `resetTrainAnimationState(scene, trainName)` — remove all animation classes
  4. Update `renderer.ts`:
     - Add "All Aboard!" button rendering: new button element created in `initTrainSoundsRenderer`, placed in the game panel (below selector bar, above scene). Button text: "All Aboard! 🚂". Exposed on renderer return type.
     - Apply `trainDirection` to display: if `'right'`, add `transform: scaleX(-1)` to `.train-display`. Hotspot positions in `layoutHotspots` must mirror horizontally when direction is right (recalculate `anchorXPx` as `displayLeft + displayWidth - originalXPx`).
     - Apply scene randomness: toggle `.train-scene--rainbow` class based on `hasRainbow`; set cloud inline `style.left` offsets based on `cloudOffset`.
     - Support `departing` state: when `state.departing` is true, display gets `.train-departing` class.
  5. Update `controller.tsx` — add "All Aboard!" button in game screen panel, between selector bar and scene. Button id: `all-aboard-btn`. Class: `train-all-aboard-btn`.
  6. Update `main.ts`:
     - Bind click handler on all-aboard button: plays the current train's signal sound (whistle/horn), then calls `allAboard()` in state, then triggers departure animation sequence.
     - In reduce-motion: play departure sound, immediately switch to next train (no animation).
  7. Update `input.ts` — add All Aboard button to keyboard/gamepad focus navigation. New callback: `onAllAboard`. Gamepad: map to button B or specific binding.
  8. Update `accessibility.ts` — add `announceAllAboard(trainName)`: announces `"All aboard! ${trainName} departing."` on departure and `"${nextTrainName} arriving."` on arrival.
  9. CSS additions in `train-sounds.css`:
     - `.train-all-aboard-btn` — styled like `.train-primary-btn` but with train emoji, prominent position
     - `.train-departing .train-display` — keyframe: `translateX` from 0 to 100% (left-facing) or -100% (right-facing) over 600ms ease-in
     - `.train-entering .train-display` — keyframe: `translateX` from -100% to 0 (left-facing) or 100% to 0 (right-facing) over 500ms ease-out
     - `.train-display[data-direction='right']` — `transform: scaleX(-1)`
     - `.train-scene--rainbow::after` — CSS rainbow arc overlay in sky area (using `conic-gradient` or stacked colored bands, subtle opacity)
     - `.train-cloud` — `animation: cloud-drift 50s linear infinite` keyframe, `translateX` ±8% gentle drift
     - `@media (prefers-reduced-motion: reduce)` and `html[data-reduce-motion='reduce']` — disable all new animations: `.train-cloud { animation: none; }`, `.train-departing .train-display, .train-entering .train-display { transition: none; transform: none; }`, `.train-scene--rainbow::after { display: none; }` (but "All Aboard!" still plays sound and switches train)
     - Hotspot position mirroring handled in JS (renderer), not CSS

### LEG-4: Replace Synthesized Sounds & Fix Quiet Audio
- Status: pending
- Confirmed: yes
- Goal link: User said "let's try to get actual sounds for all of them instead of any synthesized sounds" and "some of them don't seem to work well at all (can't hear)."
- Depends on: LEG-1 (drum-pad directory must exist before modifying its sounds)
- Owned files:
  - `games/drum-pad/sounds.ts`
  - `games/drum-pad/sample-manifest.ts`
  - `games/drum-pad/main.ts`
  - `games/drum-pad/info.ts`
  - `games/drum-pad/attributions.ts`
  - `games/train-sounds/sounds.ts`
  - `games/train-sounds/sample-manifest.ts`
  - `games/train-sounds/sounds.test.ts`
- Read-only:
  - `client/audio.ts` — `resolveAssetUrl`, `createSfxBus`, `ensureAudioUnlocked`
  - `games/train-sounds/sounds.ts` — reference pattern for sample decode/play pipeline
  - `.pi/skills/creative-assets/references/audio-source-notes.md` — CC0 sourcing, audibility gate
- Deferred shared edits:
  - `ATTRIBUTIONS.md` — run `pnpm sync:attributions` after all legs complete
- Verification: `grep -c "createOscillator\|createBufferSource" games/drum-pad/sounds.ts` returns 0; `grep -c "electric-hum-brightener\|playElectricHumReinforcement" games/train-sounds/sounds.ts` returns 0; `pnpm test` passes; TypeScript compiles
- Intent:
  1. **Drum Pad: replace all 8 synthesized sounds with CC0 recorded samples**
     - Replace `sounds.ts` entirely: remove all 8 synth functions (`playKick`, `playSnare`, `playHiHatClosed`, `playHiHatOpen`, `playClap`, `playRim`, `playTom`, `playCymbal`) and the `createNoiseBuffer` helper
     - Replace with a sample-manifest-based decode/play pipeline modeled on train-sounds: `preloadDrumPadSamples()`, `playDrumPadSample(sampleId)`, `ensureDrumPadAudioUnlocked()`
     - New `sample-manifest.ts` with 8 DrumPadSampleId entries: `drum-kick`, `drum-snare`, `drum-hihat-closed`, `drum-hihat-open`, `drum-clap`, `drum-rimshot`, `drum-tom`, `drum-cymbal`. All `bundled: true`. Per-sample `gain` values 2.8–3.2 to ensure audibility through the SFX bus chain (bus gain 0.12, compressor threshold -18 dB). Freesound IDs and processing specs to be filled with real CC0 sources (sourcing candidate search below).
     - Update `main.ts`: add `preloadDrumPadSamples()` call on game start and after first interaction. Replace direct `PAD_SOUNDS[padId](buses.sfx, buses.ctx)` calls with `playDrumPadSample(sampleId)`.
     - The `PAD_SOUNDS` and `PAD_NAMES` arrays are replaced by mapping from `PadId` → `DrumPadSampleId` in the new sounds module. `PAD_NAMES` stays as display labels.
     - Sourcing candidates (CC0 on Freesound, to be verified and adjusted):
       - Kick: Freesound search for "kick drum" CC0 — candidates: sound IDs around 450000-500000 range
       - Snare: Freesound "snare hit" CC0
       - Hi-hat closed: Freesound "hihat closed" CC0
       - Hi-hat open: Freesound "hihat open" CC0
       - Clap: Freesound "hand clap" CC0
       - Rimshot: Freesound "rimshot" CC0
       - Tom: Freesound "tom drum" CC0
       - Cymbal: Freesound "cymbal hit" CC0
     - Note: actual Freesound IDs and download require the creative-assets workflow (API key + ffmpeg). The sub-agent should write the sample-manifest with placeholder IDs (soundId: 0) and mark `bundled: false` if the .ogg files don't exist yet, then the creative-assets skill will fill them in a companion pass. Alternatively, if the agent can run the fetch script, it should source real IDs.
     - Create `public/drum-pad/audio/` directory placeholder
  2. **Train Sounds: remove electric-hum-brightener synth reinforcement**
     - Remove `playElectricHumReinforcement` function from `sounds.ts`
     - Remove `reinforcement` field from `TrainHotspotSoundRoute` interface
     - Remove `reinforcement: 'electric-hum-brightener'` from `electric-power-hum` route in `TRAIN_PRESET_HOTSPOT_SOUND_ROUTES`
     - Remove the reinforcement playback block in `playTrainHotspotSound` (the `if (route.reinforcement === ...)` branch)
     - Compensate by raising `electric-hum` sample gain in `sample-manifest.ts` from 2.3 → 2.8
  3. **Fix quiet train sounds** — audit and raise gain values for samples that may be undercompressing through the SFX bus:
     - `diesel-idle`: gain 2.5 → 3.0 (low-pass filtered, needs more push)
     - `electric-hum`: gain 2.3 → 2.8 (already adjusted above for reinforcement removal)
     - `passenger-door-chime`: gain 2.6 → 3.0 (high-pass filtered, thin sound)
     - `highspeed-passby` (used as power-hum at 0.62 volumeScale): raise base gain 2.8 → 3.2 so the 0.62 scaling still reaches the compressor
  4. **Update drum-pad attributions and info**
     - `info.ts`: change summary from "All sounds are synthesized in the browser at runtime" to "Tap eight color-coded pads to trigger percussion sounds, record loops, and layer up to three parts with adjustable tempo."
     - `attributions.ts`: replace synthesized-drum and UI-sound entries with real CC0 Freesound entries once sample IDs are confirmed; keep the placeholder entry until then

### LEG-5: Spot On — New Game Scaffold
- Status: pending
- Confirmed: yes
- Goal link: User asked for a new game "Spot On" — this leg creates the full shell, routing, and layout so the game loads and renders a start screen and empty game screen.
- Depends on: none (independent of other legs)
- Owned files:
  - `games/spot-on/controller.tsx`
  - `games/spot-on/main.ts`
  - `games/spot-on/types.ts`
  - `games/spot-on/state.ts`
  - `games/spot-on/renderer.ts`
  - `games/spot-on/input.ts`
  - `games/spot-on/accessibility.ts`
  - `games/spot-on/animations.ts`
  - `games/spot-on/sounds.ts`
  - `games/spot-on/info.ts`
  - `games/spot-on/attributions.ts`
  - `games/spot-on/sample-manifest.ts`
  - `public/styles/spot-on.css`
  - `public/spot-on/manifest.json`
  - `public/spot-on/sw.js`
  - `public/favicon-game-spot-on.svg`
- Read-only:
  - `games/waterwall/controller.tsx` — scaffold pattern
  - `games/train-sounds/controller.tsx` — scaffold pattern
  - `app/ui/game-shell.tsx` — GameHeader, GameScreen, GameTabbedModal, etc.
  - `app/ui/document.tsx` — Document wrapper
- Deferred shared edits:
  - `app/data/game-registry.ts` — add spot-on entry
  - `app/routes.ts` — add spotOn + spotOnInfo routes
  - `app/router.ts` — import spotOnAction, wire routes
  - `build.ts` — add entry point, static routes, client dir, SW stamp, budget page
- Verification: `pnpm build` succeeds; `ls dist/spot-on/index.html` exists; TypeScript compiles; `pnpm test` passes
- Intent:
  1. **Game identity** — Slug: `spot-on`. Public name: "Spot On". Description: "Tidy up cozy rooms by picking up items and finding the right spot for each one." Icon: 🧹.
  2. **Controller (`controller.tsx`)** — Start screen: title "Spot On", subtitle "Pick up items. Put them away. Your room, your way.", Start button. Game screen: GameHeader with title, Menu button; room-scene container (`#room-scene`, position relative, overflow hidden); status bar (`#room-status`) showing "Items placed: 0 / 5"; "New Room" button (`#new-room-btn`). GameTabbedModal with Settings (SFX toggle, reduce-motion toggle) and Info tabs. SrOnly for game-status and game-feedback. Noscript message. Document wrapper with `title="Spot On"`, `path="/spot-on/"`, `stylesheets=['/styles/spot-on.css']`, `scripts=['/client/spot-on/main.js']`, `bodyClass="spot-on"`, `faviconPath="/favicon-game-spot-on.svg"`, `manifestPath="/spot-on/manifest.json"`, `serviceWorkerPath="/spot-on/sw.js"`.
  3. **Types (`types.ts`)** — `RoomId = 'bedroom' | 'kitchen' | 'study'`. `ItemId = string`. `SpotId = string`. `SpotOnPhase = 'idle' | 'carrying' | 'complete'`. `ItemState = { id, name, emoji, placed, spotId (which surface it's on, or null) }`. `SpotState = { id, label, emoji, itemId (which item is here, or null) }`. `RoomDefinition = { id, name, theme (CSS class), items, spots }`. `SpotOnState = { currentRoomId, phase, carriedItemId (null or ItemId), items, spots }`.
  4. **State (`state.ts`)** — `ROOMS: RoomDefinition[]` with 3 room definitions:
     - Bedroom: wall color soft blue, floor warm wood; items: 🧸 teddy bear, 👕 shirt, 📖 book, 💤 pillow, 🔔 alarm clock; spots: 🛏️ bed, 📚 bookshelf, 👔 hanger, 🗄️ nightstand, 🧺 toy box
     - Kitchen: wall color cream, floor tile; items: ☕ mug, 🍳 pan, 🌿 herb jar, 🍎 apple, 🧴 bottle; spots: 🪝 hook, 🍳 rack, 🗄️ shelf, 📐 counter, 🥣 bowl
     - Study: wall color greenAccent, floor dark wood; items: 🖊️ pen, 📖 book, ☕ mug, ✉️ letter, 🌱 plant; spots: 📝 desk, 📚 shelf, ⬜ coaster, 📬 tray, 🪟 windowsill
     - `createInitialState()`: selects first room, scatters items at random "messy" floor positions
     - `pickUpItem(state, itemId)`: sets carriedItemId, phase → 'carrying'
     - `placeItem(state, spotId)`: moves carried item to spot, clears carriedItemId, phase → 'idle' (unless all items placed → 'complete')
     - `dropItem(state)`: returns carried item to its previous floor position, clears carriedItemId, phase → 'idle'
     - `selectNextRoom(state)`: cycle to next room, reset items/scatter positions, phase → 'idle'
  5. **Renderer (`renderer.ts`)** — `initSpotOnRenderer()`: creates refs to room-scene, status bar, new-room button. `render(state)`: toggles room theme class, renders item buttons and spot divs, updates carried-item visual state. `syncLayout()`: responsive layout pass. `dispose()`: cleanup.
  6. **Input (`input.ts`)** — Keyboard: arrow keys navigate between items/spots, Enter/Space picks up or places, Escape drops item. Gamepad: dpad + A button. Basic spatial navigation between focusable elements.
  7. **Accessibility (`accessibility.ts`)** — `announceItemPickedUp(itemName)`, `announceItemPlaced(itemName, spotName)`, `announceItemDropped(itemName)`, `announceRoomChange(roomName)`, `announceAllPlaced()`.
  8. **Animations (`animations.ts`)** — No-op placeholders (real animations come in LEG-6): `animateItemPickup`, `animateItemPlace`, `animateRoomTransition`.
  9. **Sounds (`sounds.ts`)** — No-op placeholder: `playSpotOnSfx()` returns false. Real sounds in LEG-6.
  10. **Sample manifest (`sample-manifest.ts`)** — Placeholder entries, all `bundled: false`.
  11. **Info (`info.ts`)** — `spotOnInfo = { summary: 'Spot On is a cozy room-tidying toy. Pick up misplaced items and put them wherever feels right — there are no wrong answers. When you are happy, get a new room.' }`.
  12. **Attributions (`attributions.ts`)** — Minimal code-only attribution (placeholder for future CC0 sound entries).
  13. **CSS (`public/styles/spot-on.css`)** — Warm cozy palette: `--bg: #faf6ee`, `--ink: #3a2f28`, `--room-wall: #c5d5e4` (bedroom default), `--room-floor: #d4a76a`, `--paper: rgba(255, 252, 245, 0.92)`, soft shadows, rounded corners. Room scene: min-height 50% of remaining viewport after chrome. `.room-item` and `.room-spot` buttons: min 44px, emoji content, subtle shadows. Reduce-motion overrides. Responsive breakpoints: 390×844, 844×390.
  14. **Static assets** — `manifest.json` with name "Spot On"; `sw.js` (root-SW-replacement pattern); `favicon-game-spot-on.svg` (simple sparkle/broom emoji-based SVG).
  15. **Emoji art is placeholder** — sourcing deferred; all item/spot emojis noted as "placeholder — sourcing deferred"

### LEG-6: Spot On — Gameplay Implementation
- Status: pending
- Confirmed: yes
- Goal link: User asked for a cozy organization game where you pick up items and place them anywhere you like, then click "New Room" for a fresh layout.
- Depends on: LEG-5 (scaffold must exist)
- Owned files:
  - `games/spot-on/state.ts`
  - `games/spot-on/types.ts`
  - `games/spot-on/renderer.ts`
  - `games/spot-on/animations.ts`
  - `games/spot-on/sounds.ts`
  - `games/spot-on/sample-manifest.ts`
  - `games/spot-on/controller.tsx`
  - `games/spot-on/main.ts`
  - `games/spot-on/input.ts`
  - `games/spot-on/accessibility.ts`
  - `games/spot-on/info.ts`
  - `games/spot-on/attributions.ts`
  - `public/styles/spot-on.css`
- Read-only:
  - `client/preferences.ts` — `isReducedMotionEnabled()`
  - `client/game-accessibility.ts` — `announce()`
  - `games/train-sounds/sounds.ts` — sample playback pattern reference
- Deferred shared edits:
  - `ATTRIBUTIONS.md` — run `pnpm sync:attributions` after all legs complete
- Verification: `pnpm build` succeeds; `pnpm test` passes; `grep -c "place-correct\|pick-up\|completion" games/spot-on/sounds.ts` ≥ 3 sample routes; TypeScript compiles; manual visual check required per LOCAL.md
- Intent:
  1. **Room catalog — 3 rooms with distinct layouts** — Each room has: a name, a CSS class for visual theme (wall color, floor style, furniture), 5 items, and 5+ spots (cozy surfaces where items can be placed). Rooms are: (a) Bedroom — book, shirt, pillow, teddy bear, alarm clock; spots: bed, bookshelf, hanger, nightstand, toy box. (b) Kitchen — mug, pan, herb jar, apple, bottle; spots: hook, rack, shelf, counter, bowl. (c) Study — pen, book, mug, letter, plant; spots: desk, shelf, coaster, tray, windowsill. Items can go on ANY spot — there is no right or wrong placement. Side-view perspective (per LOCAL.md rule). Each room's CSS class controls wall color, floor texture, and furniture silhouette via `::before`/`::after` pseudo-elements.
  2. **Item rendering** — Items are `<button>` elements with `position: absolute` in the room scene. Content: emoji + invisible `aria-label`. Unplaced items render at scattered "messy" positions on the floor/foreground area (randomized on room init). Items have: subtle shadow, rounded corners, warm background. Focused items get a dashed outline. Carried item gets `scale(1.1)`, elevated `z-index`, stronger shadow, and a "carrying" class. Placed items render at their spot's position with a settled appearance (no dashed outline, subtle glow border). Emoji art is placeholder — sourcing deferred.
  3. **Spot rendering** — Spots are `<div role="button" tabindex="0">` elements with `position: absolute` positioned on furniture surfaces. Content: emoji hint + invisible label. Styled as soft dashed-outline zones when empty, solid subtle zone when occupied. When an item is being carried, ALL empty spots get a gentle highlight pulse (CSS animation, gated by reduce-motion — no pulse under reduced-motion, spots just get a subtle border brightening). Any spot accepts any item — no matching.
  4. **Pick-up / place mechanic** — Tap/click an unplaced item → item becomes "carried" (visual lift: scale, z-index, shadow). While carried: tap any spot → item snaps there with a settling animation (translateY bounce, gated by reduce-motion). Tap the carried item again or press Escape → item drops back to its floor position. Pointer mode determined by carried-item state, not mouse button (per LOCAL.md — no right-click on touch). While carrying, focus moves to the nearest empty spot for keyboard accessibility.
  5. **"New Room" flow** — "New Room" button is always available (not gated by completion). Clicking it: fades out current room (CSS opacity transition, gated by reduce-motion — instant swap under reduced-motion), cycles to next room in catalog (wrapping), scatters items at new random floor positions, resets spots to empty. Announcement: "Switching to [room name]."
  6. **Completion message** — When all items in a room are placed on spots, state enters `phase: 'complete'`. A congratulatory message appears over the scene ("All tidy! ✨") with a gentle fade-in animation (gated by reduce-motion). The "New Room" button remains the exit action. No gate — player could also click "New Room" before all items are placed.
  7. **Sound design** — 4 CC0 samples, loaded via sample-manifest + decode/play pipeline:
     - Pick-up: soft "whoosh" / lifting sound (sample `pick-up-whoosh`)
     - Place: satisfying "thunk" / soft click (sample `place-thunk`) — plays for ANY spot, no "wrong" sound
     - Completion: short cheerful chime/jingle (sample `completion-chime`) — plays when all items placed
     - New room: gentle "whoosh" or transition sound (sample `room-transition`)
     - All `bundled: true`, per-sample `gain ≥ 2.6` per audibility gate. Sourcing from Freesound CC0 (actual IDs to be filled, placeholder IDs if fetch not available).
     - Reduce-motion does NOT gate these sounds (they're feedback, not motion).
  8. **Update controller.tsx** — Add completion message area in game screen (hidden by default, shown when complete). Ensure "New Room" button is prominent.
  9. **Animations implementation** — `animateItemPickup(element)`: scale + shadow increase, 100ms. `animateItemPlace(element)`: translateY bounce (0 → -4px → 0), 200ms. `animateRoomTransition(scene)`: opacity 1 → 0, swap, 0 → 1, 300ms each. All gated by `isReducedMotion()`. `animateCompletion(messageEl)`: fade-in 400ms.
  10. **Responsive gameplay** — Playfield fills ≥50% of remaining viewport height at 390×844 portrait. Item/spot targets ≥44px. ≤7 interactive elements per room (meets density cap). Horizontal padding ≥8px between adjacent spots. At landscape 844×390, room compresses floor area.
  11. **Update attributions** — Add CC0 sound entries for the 4 samples (with real Freesound IDs once sourced, or placeholder TBD entries).
  12. **Update info.ts** — Ensure summary matches the "no wrong answers" philosophy.

## Dispatch Order
Sequential via runSubagent (navigator reviews between each):
1. LEG-1 (Drum Pad Rename) - no dependencies
2. LEG-2 (Train Sounds Hotspot Overhaul) - no dependencies (parallel with LEG-1 possible but sequential for safety)
3. LEG-3 (Train Sounds All Aboard & Scene Animation) - depends on LEG-2
4. LEG-4 (Replace Synthesized Sounds & Fix Quiet Audio) - depends on LEG-1
5. LEG-5 (Spot On — New Game Scaffold) - no dependencies (parallel with earlier legs possible)
6. LEG-6 (Spot On — Gameplay Implementation) - depends on LEG-5

After all complete: `pnpm sync:attributions` → `pnpm build` → `pnpm test` → delivery verification → commit → push.