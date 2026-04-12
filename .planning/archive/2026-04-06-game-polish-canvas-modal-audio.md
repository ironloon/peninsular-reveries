# Plan: Game Polish — Shared Settings, Canvas Scene, Audio & Layout

## Project Context
- Sources:
  - `README.md` - source of truth for project principles and site values
  - `AGENTS.md` - workflow, validation, and environment expectations
  - `.agents/skills/gnd-chart/SKILL.md` - current plan structure used for archive preservation
  - `.agents/skills/gnd-critique/SKILL.md` - current critique and archive expectations
- Constraints:
  - This is a preserved historical plan archive migrated from repo memory into the current workspace archive.
  - Structural updates are limited to current gnd section names, leg identifiers, dependency references, and archive headings.
  - Preserve the original plan scope, execution state, and critique content.
- Full validation:
  - `pnpm sync:attributions`
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

The user wants a comprehensive quality pass across all 4 games in Peninsular Reveries, with Super Word as the primary target. Goals: (1) shared infrastructure for settings menus, audio controls, and preferences across all games; (2) a canvas-based scene renderer for Super Word that produces dramatically better object scaling and proportions; (3) research-grounded difficulty tiers organized by phonemic complexity (not letter count) with superhero-themed names; (4) independent music/SFX toggles with music and SFX on by default; (5) portrait layout fixes for Super Word; (6) consistent menu styling with two-tab (Settings/Info) modal and X close button across all games. PBS Kids and Khan Academy Kids are the quality/accessibility benchmarks.

## Legs

### LEG-1: Shared — Preferences Module
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `client/preferences.ts`
- Read-only:
  - `client/super-word/sounds.ts` — reference current getMusicEnabled/setMusicEnabled pattern
  - `client/pixel-passport/sounds.ts` — reference getSoundEnabled/setSoundEnabled pattern
- Verification: `npm run test:unit`
- Intent: Expand `client/preferences.ts` to include per-game music-enabled and SFX-enabled preferences with a consistent API. Add functions: `getGamePreference(gameSlug: string, key: string): string | null`, `setGamePreference(gameSlug: string, key: string, value: string): void`, plus typed convenience wrappers `getMusicEnabled(gameSlug)`, `setMusicEnabled(gameSlug, enabled)`, `getSfxEnabled(gameSlug)`, `setSfxEnabled(gameSlug, enabled)`. Defaults: music ON, SFX ON. Storage keys use pattern `{gameSlug}-{key}` in localStorage (e.g., `super-word-music-enabled`). Existing `bindReduceMotionToggle()`, `getStoredReduceMotionPreference()`, etc. remain unchanged. No breaking changes to current callers. Add `bindMusicToggle(gameSlug, toggleEl, helpTextEl?)` and `bindSfxToggle(gameSlug, toggleEl, helpTextEl?)` helpers modeled on `bindReduceMotionToggle()` pattern — each syncs a checkbox element with localStorage state and dispatches custom events (`reveries:music-change`, `reveries:sfx-change`) for other modules to react.

### LEG-2: Shared — Two-Tab Modal System
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `app/ui/game-shell.tsx` — add GameTabbedModal, TabBar, TabPanel, ModalCloseButton components
  - `app/ui/site-styles.ts` — add tabBarStyles, tabButtonStyles, tabPanelStyles, modalCloseStyles, infoSectionStyles, consistent button styles
  - `client/modal.ts` — NEW shared client-side modal behavior
  - `.github/skills/review/references/game-quality.md` — update In-Game Menu Standard (X close, Restart/Quit footer)
- Read-only:
  - `client/super-word/settings-modal.ts` — reference existing focus-trap, modal open/close, Esc handling
  - `public/styles/game.css` — reference existing `.settings-*` rules
- Verification: `npm run test:unit`
- Intent: Create a reusable two-tab modal system with both server-rendered JSX and client-side behavior.

  **Server-side (`app/ui/game-shell.tsx`):**
  Add `GameTabbedModal` component wrapping the existing `GameSettingsModal` pattern but with a tab bar. Props: `title`, `headingId`, `settingsContent` (React node for Settings tab), `infoContent` (React node for Info tab), `overlayStyles`. Renders:
  - Modal overlay (fixed, safe-area-aware)
  - X close button (`<button aria-label="Close menu" class="modal-close" id="settings-close-btn">×</button>`) positioned absolute top-right, min 44×44px
  - Tab bar: two buttons ("Settings" / "Info") with `role="tab"`, `aria-selected`, `aria-controls`
  - Two tab panels (`role="tabpanel"`, `aria-labelledby`) — only active one visible
  - Footer: `SettingsActions` with Restart + Quit only (Close removed, replaced by X)
  
  Also add helper components: `InfoSection({ title, children })` for structured info blocks, `InfoAttribution({ attribution })` for rendering an attribution entry.

  **Client-side (`client/modal.ts`):**
  Export `setupTabbedModal(modalId)` returning `{ open(), close(), toggle() }`. Internally:
  - Focus trap: Tab/Shift+Tab cycles within modal, Esc closes
  - Tab switching: clicking tab buttons shows/hides corresponding panels, updates `aria-selected`
  - Arrow keys navigate between tabs (left/right)
  - `open()` focuses first focusable element in active tab, saves previous focus for restoration
  - `close()` restores focus to the element that triggered open
  - Backdrop click closes modal
  - Exports `window.__settingsToggle` for gamepad integration
  - Gamepad: Start button toggles modal (already handled by games' input.ts, but ensure modal.ts doesn't conflict)

  **Styling (`app/ui/site-styles.ts`):**
  Add css() mixins: `tabBarStyles` (flex row, bottom border), `tabButtonStyles` (active state with accent color underline, hover state), `tabPanelStyles` (scrollable content area), `modalCloseStyles` (absolute positioned, 44×44 touch target, hover/focus ring), `infoSectionStyles` (padded sections with headings). All use CSS custom properties for per-game theming: `--modal-accent`, `--modal-bg`, `--modal-text`.

  **Update game-quality.md:** Change In-Game Menu Standard to specify X close in top-right corner (replacing Close button in footer). Footer now contains Restart + Quit only. Add note about two-tab structure (Settings / Info) as the standard menu pattern.

### LEG-3: Shared — Audio Module
- Status: done
- Confirmed: yes
- Depends on: LEG-1
- Thinking effort: medium
- Owned files:
  - `client/audio.ts` — NEW shared audio infrastructure
- Read-only:
  - `client/super-word/sounds.ts` — reference ambient pad/bell/tone implementations
  - `client/chompers/sounds.ts` — reference frenzy music, sample playback, compressor chain
  - `client/mission-orbit/sounds.ts` — reference setupSounds callback pattern
  - `client/pixel-passport/sounds.ts` — reference travel loop, chord helper
  - `client/preferences.ts` — depends on LEG-1 getMusicEnabled/getSfxEnabled API
- Verification: `npm run test:unit`
- Intent: Create `client/audio.ts` providing shared Web Audio API infrastructure that all games import.

  **Core exports:**
  - `getAudioContext(): AudioContext` — lazy-creates and resumes a singleton AudioContext
  - `ensureAudioUnlocked(): void` — must be called from user gesture; plays silent buffer, sets unlocked flag. Replaces per-game unlock implementations.
  - `createMusicBus(gameSlug: string): GainNode` — creates a music-channel GainNode connected through a DynamicsCompressorNode to destination. Initial gain based on `getMusicEnabled(gameSlug)`. Listens for `reveries:music-change` custom event to fade gain up/down.
  - `createSfxBus(gameSlug: string): GainNode` — same pattern for SFX channel. Listens for `reveries:sfx-change`.
  - `fadeBusGain(bus: GainNode, targetGain: number, durationMs: number): void` — smooth gain ramp (linearRampToValueAtTime for fade-in, exponentialRampToValueAtTime for fade-out)
  - `playTone(bus: GainNode, options: ToneOptions): void` — convenience for single oscillator tones (frequency, type, gain, duration, envelope). Short-circuits if bus gain is effectively 0.
  - `playNotes(bus: GainNode, notes: NoteSequence): void` — scheduled note sequence.
  - `syncBusWithVisibility(bus: GainNode, gameSlug: string, channel: 'music' | 'sfx'): void` — pauses/resumes bus gain on `visibilitychange` events.

  **Volume normalization baseline:**
  - Music bus default gain: 0.20 (up from current 0.08–0.14 range across games)
  - SFX bus default gain: 0.12 (slightly reduced from current 0.08–0.14 range)
  - DynamicsCompressor on each bus prevents clipping when both channels are active simultaneously
  - Per-game synth functions continue to set their own oscillator gains relative to the bus — but the bus establishes the master level

  **Games keep their own sound functions.** Each game's `sounds.ts` continues to define game-specific synth instruments (ambient pads, collect pops, frenzy melodies). They import `getAudioContext()`, `createMusicBus()`, `createSfxBus()`, `playTone()` etc. from `audio.ts` instead of reimplementing. The shared module owns the plumbing; games own the sound design.

### LEG-4: Super Word — Canvas Scene Renderer
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `client/super-word/renderer.ts` — rewrite renderScene() to use canvas; keep all other render functions as DOM
  - `app/controllers/super-word.tsx` — replace `<div id="scene">` with `<canvas id="scene-canvas">` + `<div id="scene-a11y" class="sr-overlay">`
  - `public/styles/game.css` — canvas sizing rules, sr-overlay positioning
- Read-only:
  - `client/super-word/scene-builder.ts` — provides positioned items with 0-100% coordinates
  - `client/super-word/scene-art.ts` — ItemArt data (will be updated in LEG-5, but LEG-4 works with current data)
  - `client/super-word/input.ts` — binds to a11y overlay buttons
  - `client/super-word/types.ts` — SceneItem interface
- Verification: `npm run test:unit && npm run build`
- Intent: Replace the DOM-based scene rendering in Super Word with a `<canvas>` element for the play area, while keeping all UI (header, prompt, collection area, modals, screens) as DOM.

  **HTML structure change (`app/controllers/super-word.tsx`):**
  Replace:
  ```html
  <div id="scene-wrapper"><div id="scene" role="group">...</div></div>
  ```
  With:
  ```html
  <div id="scene-wrapper">
    <canvas id="scene-canvas" role="img" aria-label="Game scene with letters and objects"></canvas>
    <div id="scene-a11y" role="group" aria-label="Interactive scene items" class="sr-overlay">
      <!-- Buttons injected by renderer.ts -->
    </div>
  </div>
  ```

  **Canvas rendering (`renderer.ts` `renderScene()`):**
  1. Get canvas element, set `canvas.width = canvas.clientWidth * devicePixelRatio`, `canvas.height = canvas.clientHeight * devicePixelRatio`. Scale context by devicePixelRatio.
  2. Paint background: linear gradient from sky color (#7EC8E3) to grass color (#5CB85C). Add subtle cloud shapes (ellipses with low alpha) in top 40%. Add grass texture (small random vertical lines) in bottom 15%.
  3. Sort items by draw order: ground zone large items first → ground zone small items → sky zone large → sky zone small → middle zone (letters) last (letters always on top).
  4. For each item: calculate pixel position from 0-100% coordinates (`item.x / 100 * canvas.width`, `item.y / 100 * canvas.height`). Calculate font size from item's scale (or sizeCategory after WU-5): base = `canvas.height * scaleFraction`. For ground-anchored items, offset Y so bottom of emoji aligns with the Y coordinate. Draw emoji with `ctx.font = '${fontSize}px serif'; ctx.fillText(item.emoji, x, y)`.
  5. For collected items: draw with `ctx.globalAlpha = 0.25` and apply grayscale by drawing to an offscreen canvas with `ctx.filter = 'grayscale(100%)'`.
  6. For letter items: draw a colored circle badge behind the emoji showing the letter character. Badge color cycles through the 5-color palette (--game-badge-0 through --game-badge-4).

  **A11y overlay (`renderer.ts` `renderScene()`):**
  After canvas draw, update `#scene-a11y` div with positioned `<button>` elements:
  - One button per interactive (non-collected) item
  - Position: `position: absolute; left: {x}%; top: {y}%; width: {hitSize}px; height: {hitSize}px; transform: translate(-50%, -50%)`
  - Hit size: max(44px, fontSize) to ensure WCAG touch target compliance
  - `aria-label`: same as current (e.g., "Apple — contains letter A")
  - `tabindex`: 0 for first uncollected letter, -1 for rest (consistent with current keyboard nav)
  - `data-item-id` attribute for input.ts to identify which item was activated
  - Buttons are transparent (`opacity: 0`) but receive all pointer/keyboard events
  - Collected items: remove button from overlay (not interactive)

  **Resize handling:**
  - `ResizeObserver` on `#scene-wrapper` triggers canvas resize + re-render + a11y overlay repositioning
  - Debounce resize to 100ms to avoid thrashing

  **Animation equivalents:**
  - Collect animation: instead of CSS `collectShake`, animate on canvas by drawing the item at decreasing opacity + slight scale reduction over 6-8 frames (requestAnimationFrame), then remove
  - Hover effect: track pointer position via canvas `mousemove`, scale hovered item by 1.12x on next draw (same as current CSS `:hover` scale)
  - Scene transition: render current scene, slide-paint left over ~180ms, clear, render new scene sliding in from right over ~260ms

  **CSS changes (`public/styles/game.css`):**
  - `#scene-canvas { width: 100%; height: 100%; display: block; }` — fill scene-wrapper
  - `.sr-overlay { position: absolute; inset: 0; pointer-events: none; }` — overlay container
  - `.sr-overlay button { pointer-events: auto; position: absolute; opacity: 0; cursor: pointer; min-width: 44px; min-height: 44px; }` — invisible but interactive buttons
  - Remove all existing `.scene-item`, `.item-emoji`, `.item-badge` rules (no longer needed)

### LEG-5: Super Word — Scene Art Overhaul
- Status: done
- Confirmed: yes
- Depends on: LEG-4
- Thinking effort: medium
- Owned files:
  - `client/super-word/scene-art.ts` — add sizeCategory and anchor to ItemArt, update all entries, expand pool
  - `client/super-word/scene-builder.ts` — update positionItemY and layout for size categories + anchoring
  - `client/super-word/scene-builder.test.ts` — proportional rule tests
  - `client/super-word/types.ts` — add SizeCategory type, anchor property to ItemArt/SceneItem
- Read-only:
  - `client/super-word/renderer.ts` — canvas renderer reads sizeCategory for font-size calculation
- Verification: `npm run test:unit`
- Intent: Overhaul the scene art data to use real-world size categories that produce dramatically better proportional rendering on the canvas.

  **New type (`types.ts`):**
  ```ts
  type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge'
  type AnchorPoint = 'bottom' | 'center'
  ```
  Add `sizeCategory: SizeCategory` and `anchor: AnchorPoint` to `ItemArt` interface. Remove numeric `scale` property (replaced by sizeCategory).

  **Size category → canvas fraction mapping (documented in `scene-art.ts`):**
  | Category | Canvas height fraction | Real-world examples |
  |----------|----------------------|---------------------|
  | tiny     | 0.06                 | butterfly, snowflake, feather, music note |
  | small    | 0.10                 | tulip, cookie, seashell, pencil |
  | medium   | 0.16                 | teddy bear, backpack, cactus, soccer ball |
  | large    | 0.26                 | tree, slide, sunflower, anchor |
  | huge     | 0.38                 | castle, mountain, rocket, rainbow |

  Ratios: huge/tiny = 6.3×, huge/small = 3.8×, large/tiny = 4.3×. Dramatically wider than current 3.4× max ratio.

  **Update all distractor entries (42 existing + 15-20 new):**
  Assign sizeCategory and anchor to every entry. Ground items that represent standing/rooted objects get `anchor: 'bottom'` (castle, mountain, tree, slide, cactus, sunflower). Floating objects get `anchor: 'center'` (balloon, cloud, butterfly, snowflake). Sitting objects get `anchor: 'bottom'` with small yOffset (backpack, teddy bear, rock).

  **New distractors to add (expand pool to ~60):**
  Sky: airplane (medium), hot air balloon (large), dragonfly (tiny), star (small), satellite (small), rainbow (huge), helicopter (medium)
  Ground: house (huge), bus (large), bicycle (medium), campfire (medium), lighthouse (large), bridge (huge), garden (large), swing set (large), treasure chest (medium), wagon (medium)

  **Letter art updates:** All letter art entries get `sizeCategory: 'medium'` and `anchor: 'center'` (letters float at consistent interactive size).

  **Scene-builder updates (`scene-builder.ts`):**
  - `positionItemY()` reworked: for `anchor: 'bottom'`, the Y coordinate represents the item's ground contact point. Canvas renderer draws upward from there. For `anchor: 'center'`, Y is the item's center (current behavior).
  - `getVerticalPlacementOffset()` simplified: no longer uses `(scale - 1) * 15` formula. Instead, huge ground items get pushed toward bottom of ground zone, tiny sky items toward top of sky zone. Offset based on sizeCategory lookup table.
  - `BASE_LAYOUTS` may need expansion if more items appear on screen. Currently supports 8-9 positions; if word length + distractors exceeds 9, add BASE_LAYOUTS[10-12].

  **New tests (`scene-builder.test.ts`):**
  - "huge items render at ≥ 4× the canvas fraction of tiny items" — validates SizeCategory mapping
  - "ground-anchored items have Y position in bottom third of ground zone" — validates anchoring
  - "sky items never have Y positions in ground zone" — zone integrity
  - "all letter items have sizeCategory medium" — consistent letter sizing
  - "new distractors have valid sizeCategory and anchor" — data integrity for expanded pool
  - "draw order: ground-huge before ground-tiny before sky items before letters" — layering

### LEG-6: Research — Word Bank & Quality Benchmarks
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: high
- Owned files:
  - `README.md` — add PBS Kids + Khan Academy Kids as inspirational quality benchmarks
  - `.github/skills/review/references/game-quality.md` — add quality benchmark section referencing PBS Kids and Khan Academy Kids
  - `.github/skills/review/references/educational-research.md` — update with phonemic complexity tiers, expanded sources
- Deferred shared edits:
  - `/memories/session/word-bank-research.md` — research output consumed by MVT-7
- Verification: manual review of research document
- Intent: Research-only MVT. No game code changes. Produce a structured word bank specification organized by phonemic complexity (not letter count) and establish site-wide quality benchmarks.

  **Quality benchmark documentation:**
  Update README.md game principles section to reference PBS Kids (pbskids.org) and Khan Academy Kids as aspirational benchmarks for: accessibility, age-appropriate content, calm/non-punitive pacing, educational grounding, and visual polish. Update game-quality.md with a new "Quality Benchmarks" section describing what to emulate from these platforms (warm visuals, clear feedback, research-grounded progression, celebrates effort, never punishes failure).

  **Educational research expansion:**
  Update educational-research.md with:
  - Phonemic complexity progression: CVC → CCVC/CVCC → CVCe → vowel teams → multi-syllable
  - Dolch sight word tiers (Pre-Primer, Primer, Grade 1, Grade 2, Grade 3)
  - Fry Instant Words frequency bands (first 100, 101-200, 201-300)
  - National Reading Panel phonemic awareness → phonics → fluency → vocabulary → comprehension pipeline
  - Age-appropriate content filtering guidelines

  **Word bank research document (`/memories/session/word-bank-research.md`):**
  Produce a structured spec with 5 tiers:

  **Tier 1 — Sidekick (Pre-K / Kindergarten):**
  Criteria: High-frequency sight words (Dolch Pre-Primer/Primer), CVC words with short vowels, 2-4 letters. Focus on concrete, imageable nouns and common verbs. Words kids encounter in everyday life.
  Target: 50+ words, mixed 2-4 letter lengths.
  Phonemic patterns: sight words (I, GO, UP, ME, WE, NO, HI), CVC (CAT, SUN, DOG, BUG, HIP, MOP).

  **Tier 2 — Hero (Kindergarten / Grade 1):**
  Criteria: CVC mastery + initial consonant blends (bl, cr, st, tr), digraphs (sh, ch, th). Dolch Primer + Grade 1. 3-4 letters.
  Target: 50+ words.
  Phonemic patterns: CCVC (FROG, STAR, SHIP, CRAB, DRUM), digraphs (FISH, CHAT, THIN).

  **Tier 3 — Super (Grade 1 / Grade 2):**
  Criteria: Blends + digraphs mastered, introducing silent-e (CVCe), common vowel teams (ee, oa, ai). Dolch Grade 1-2, Fry 101-200. 3-5 letters.
  Target: 50+ words.
  Phonemic patterns: CVCe (CAKE, BIKE, HOME, CUTE), vowel teams (TREE, BOAT, RAIN).

  **Tier 4 — Ultra (Grade 2 / Grade 3):**
  Criteria: Long vowel patterns, r-controlled vowels (ar, er, ir, or), multi-syllable words beginning. Dolch Grade 2-3, Fry 201-300. 4-6 letters.
  Target: 50+ words.
  Phonemic patterns: r-controlled (STORM, TIGER, BIRD), multi-syllable start (GARDEN, FLOWER, OCEAN).

  **Tier 5 — Legend (Grade 3+):**
  Criteria: Fluent reader vocabulary, multi-syllable, complex patterns. Compound words, suffixed words. 5-7 letters.
  Target: 50+ words.
  Phonemic patterns: compound (SUNSET, RAINBOW), suffixed (ROCKET, PLANET), complex (MOUNTAIN, DOLPHIN).

  Each word entry includes: `answer`, `hint` (kid-friendly, 1-2 sentences), `theme` tag (nature, animals, food, space, etc.), `phonemicPattern` (CVC, CCVC, CVCe, etc.), `gradeAlign` (K, 1, 2, 3), `sources` (which word lists include it: Dolch-PP, Dolch-P, Dolch-1, Fry-100, CCSS-K.RF, etc.).

  Filter rules: no words with violent/scary associations, no body-related terms that could be inappropriate, no words requiring cultural context a young child might lack, no words that are only concrete in certain dialects. Prefer universal, concrete, imageable words.

### LEG-7: Super Word — Word Bank + Difficulty Implementation
- Status: done
- Confirmed: yes
- Depends on: LEG-6
- Thinking effort: medium
- Owned files:
  - `client/super-word/puzzles.ts` — rebuilt word bank from research spec
  - `client/super-word/types.ts` — new Difficulty type: 'sidekick' | 'hero' | 'super' | 'ultra' | 'legend'
  - `client/super-word/scene-builder.ts` — dynamic item count (answer length + target distractor count)
  - `client/super-word/puzzles.test.ts` — updated assertions for new tiers, word counts, phonemic metadata
  - `client/super-word/state.test.ts` — update difficulty references
  - `app/controllers/super-word.tsx` — difficulty select options (Sidekick→Legend), Info tab educational content
  - `app/data/attributions/super-word.ts` — update word progression attribution with new research sources
- Read-only:
  - `/memories/session/word-bank-research.md` — research spec from MVT-6
  - `.github/skills/review/references/educational-research.md` — updated research reference from MVT-6
- Verification: `npm run test:unit`
- Intent: Implement the research-grounded word bank and superhero-themed difficulty tiers.

  **Type changes (`types.ts`):**
  Replace `type Difficulty = 'starter' | 'easy' | 'medium' | 'hard' | 'expert'` with `type Difficulty = 'sidekick' | 'hero' | 'super' | 'ultra' | 'legend'`. Update `DIFFICULTIES` array. Add to `WordSpec` interface: `phonemicPattern: string`, `gradeAlign: string`, `sources: string[]`.

  **Word bank rebuild (`puzzles.ts`):**
  Replace entire `WORD_BANK` with new entries from research spec. Structure:
  ```ts
  const WORD_BANK: Record<Difficulty, WordSpec[]> = {
    sidekick: [ { answer: 'CAT', hint: 'A small furry pet...', theme: 'animals', phonemicPattern: 'CVC', gradeAlign: 'K', sources: ['Dolch-PP', 'Fry-100'] }, ... ],
    hero: [ ... ],
    super: [ ... ],
    ultra: [ ... ],
    legend: [ ... ],
  }
  ```
  Each tier: 50+ words with per-word metadata. Mixed letter lengths within each tier (verified by test). Hints remain kid-friendly, 1-2 sentences, ~level-1 reading level.

  **Scene-builder dynamic item count (`scene-builder.ts`):**
  Replace `TOTAL_ITEMS_BY_DIFFICULTY` (currently hardcoded 8-9) with dynamic calculation: `totalItems = answer.length + TARGET_DISTRACTORS` where `TARGET_DISTRACTORS` varies slightly by tier:
  - sidekick: 3-4 distractors (simpler scene for youngest players)
  - hero: 4-5 distractors
  - super/ultra/legend: 5-6 distractors
  This means a 3-letter sidekick word has 6-7 total items while a 6-letter legend word has 11-12 total items. Add BASE_LAYOUTS entries for counts 10-12 if not already present.

  **Controller updates (`app/controllers/super-word.tsx`):**
  - Difficulty `<select>` options: Sidekick ⭐, Hero 🦸, Super 💫, Ultra ⚡, Legend 🏆 (with emoji for visual flair)
  - Info tab content section titled "How Words Are Chosen": paragraph explaining phonemic complexity progression, citing Dolch, Fry, Common Core. Table showing tier → phonemic focus → grade alignment. Link text: "Based on research from the National Reading Panel, Dolch sight words, and Common Core State Standards."

  **Attribution update (`app/data/attributions/super-word.ts`):**
  Update the word-progression entry to reflect new phonemic-based organization and expanded source citations.

  **Test updates:**
  - `puzzles.test.ts`: validate 50+ words per tier, phonemicPattern non-empty for all words, sources array non-empty, mixed letter lengths within at least tiers 1-3, no duplicate words across tiers, all words filtered for age-appropriateness (no entries from a blocklist).
  - `state.test.ts`: update any references from 'starter'/'easy'/etc. to 'sidekick'/'hero'/etc.

### LEG-8: Super Word — Full Integration
- Status: in-progress
- Confirmed: yes
- Depends on: LEG-1, LEG-2, LEG-3, LEG-5, LEG-7
- Thinking effort: medium
- Owned files:
  - `client/super-word/main.ts` — rewire to shared modal/prefs/audio
  - `client/super-word/sounds.ts` — delegate to client/audio.ts buses, keep game-specific synth functions
  - `app/controllers/super-word.tsx` — rewrite modal markup to use GameTabbedModal, populate Settings + Info tabs
  - `public/styles/game.css` — portrait layout media query fixes, remove old .settings-* rules replaced by shared styles
  - `client/super-word/settings-modal.ts` — DELETE this file (replaced by client/modal.ts)
- Read-only:
  - `client/modal.ts` — shared modal from LEG-2
  - `client/preferences.ts` — shared prefs from LEG-1
  - `client/audio.ts` — shared audio from LEG-3
- Verification: `npm run test:unit && npm run build`
- Intent: Wire all shared infrastructure into Super Word and fix the portrait layout issue.

  **Modal rewire (`main.ts`):**
  Replace `import { setupSettingsModal, openModal, closeModal } from './settings-modal.js'` with `import { setupTabbedModal } from '../modal.js'`. In `init()`, call `const modal = setupTabbedModal('settings-modal')` and use `modal.open()`, `modal.close()`, `modal.toggle()`. Remove all inline modal logic.

  **Preferences rewire (`main.ts`):**
  Replace `getMusicEnabled()` / `setMusicEnabled()` from `./sounds.js` with `getMusicEnabled('super-word')` / `setMusicEnabled('super-word', enabled)` from `../preferences.js`. Same for SFX: add `getSfxEnabled('super-word')` / `setSfxEnabled('super-word', enabled)`.

  **Audio rewire (`sounds.ts`):**
  Replace local `getCtx()`, `ensureAudioUnlocked()`, `getMusicBus()` with imports from `../audio.js`: `getAudioContext()`, `ensureAudioUnlocked()`, `createMusicBus('super-word')`, `createSfxBus('super-word')`. Keep all game-specific synth functions (playAmbientPad, playAmbientBell, sfxCollect, sfxCorrect, etc.) but route them through the shared buses. Remove local music preference state — delegate to preferences module.

  **Music + SFX defaults:**
  Music starts ON (getMusicEnabled returns true when localStorage key absent). SFX starts ON. Start-screen music button label synced correctly from preference state on initial render. Music bus gain: 0.20 (up from 0.08). SFX gains adjusted relative to new bus level.

  **Controller rewrite (`app/controllers/super-word.tsx`):**
  Replace existing `GameSettingsModal` with `GameTabbedModal`. Settings tab content:
  - Music toggle (SettingsToggle with id="music-enabled-toggle")
  - SFX toggle (SettingsToggle with id="sfx-enabled-toggle") — NEW
  - Difficulty selector (Sidekick→Legend from LEG-7)
  - Reduce Motion toggle
  - Controls reference grid
  Info tab content:
  - Game description
  - "How Words Are Chosen" section (from LEG-7)
  - Attributions (rendered from getGameAttribution('super-word'))
  - Version

  **Portrait layout fix (`public/styles/game.css`):**
  Current issue: on ~393×852 phones with Dynamic Island, effective viewport height is ~780px. Header (44px) + prompt (40px) + scene (clamp 150-220px) + collection area (~160px with 5-letter word) + padding = ~470px minimum. That fits in 780px, but barely. The issue likely compounds with safe-area padding.

  Fixes:
  - `@media (max-height: 850px) and (orientation: portrait)`: compress header to `padding: 0.25rem 0.7rem`, prompt to `font-size: clamp(0.72rem, 2.8vw, 0.88rem)` and `padding: 0.2rem 0.6rem`, `#scene-wrapper min-height: clamp(160px, 36dvh, 240px)`
  - `@media (max-height: 750px) and (orientation: portrait)`: further compress: header padding: `0.2rem 0.5rem`, prompt inline with header (flex row instead of separate block), scene-wrapper `min-height: clamp(140px, 32dvh, 200px)`
  - Ensure `#scene-wrapper` has `flex: 1 1 auto; min-height: 0` so it takes ALL remaining space after chrome
  - Safe-area padding: verify `env(safe-area-inset-top)` correctly accounts for Dynamic Island on iPhone 14+ (should be ~59px for Dynamic Island models)

  **Delete `client/super-word/settings-modal.ts`:** Fully replaced by `client/modal.ts`.

### LEG-9: Cross-Game — Menu Rollout
- Status: not-started
- Confirmed: yes
- Depends on: LEG-1, LEG-2, LEG-3
- Thinking effort: medium
- Owned files:
  - `client/chompers/main.ts` — rewire modal/prefs/audio
  - `client/mission-orbit/main.ts` — rewire modal/prefs/audio
  - `client/pixel-passport/main.ts` — rewire modal/prefs/audio
  - `client/chompers/sounds.ts` — delegate to shared audio buses
  - `client/mission-orbit/sounds.ts` — delegate to shared audio buses
  - `client/pixel-passport/sounds.ts` — delegate to shared audio buses
  - `app/controllers/chompers.tsx` — rewrite modal to GameTabbedModal
  - `app/controllers/mission-orbit.tsx` — rewrite modal to GameTabbedModal
  - `app/controllers/pixel-passport.tsx` — rewrite modal to GameTabbedModal
- Read-only:
  - `client/modal.ts` — shared modal
  - `client/preferences.ts` — shared prefs
  - `client/audio.ts` — shared audio
  - `app/data/attributions/chompers.ts` — attribution content for Info tab
  - `app/data/attributions/mission-orbit.ts` — attribution content for Info tab
  - `app/data/attributions/pixel-passport.ts` — attribution content for Info tab
- Verification: `npm run test:unit && npm run build`
- Intent: Apply the shared two-tab modal, preferences, and audio infrastructure to all three remaining games. Each game gets the same structural polish as Super Word.

  **Per-game pattern (repeated for each):**

  1. **Controller (`app/controllers/{game}.tsx`):**
     Replace existing settings modal markup with `GameTabbedModal`:
     - Settings tab: Music toggle (if game has music), SFX toggle, game-specific settings (Chompers: area picker, level selector, mode toggle; Mission Orbit: none beyond audio; Pixel Passport: none beyond audio), reduce-motion toggle.
     - Info tab: game description, attributions (from `getGameAttribution('{game}')`), credits for any research basis.
     - Footer: Restart + Quit. X close in top-right corner.

  2. **Main.ts (`client/{game}/main.ts`):**
     Replace inline modal open/close logic with `import { setupTabbedModal } from '../modal.js'`. Call `setupTabbedModal('settings-modal')`. Replace any direct `settings-modal` DOM manipulation with modal.open()/close().
     Add preference listeners: `import { getMusicEnabled, getSfxEnabled } from '../preferences.js'`.

  3. **Sounds.ts (`client/{game}/sounds.ts`):**
     Replace local AudioContext creation with `import { getAudioContext, createMusicBus, createSfxBus, ensureAudioUnlocked } from '../audio.js'`.
     - **Chompers**: Frenzy music → music bus. Sample playback + synth SFX → SFX bus. Remove hardcoded `getMusicEnabled = true`.
     - **Mission Orbit**: No music currently. SFX → SFX bus. Replace `setupSounds(getSfxEnabledFn)` callback pattern with direct `getSfxEnabled('mission-orbit')` from preferences.
     - **Pixel Passport**: Travel loop → music bus. Other sounds → SFX bus. Replace local `getSoundEnabled()`/`setSoundEnabled()` with shared preferences API.

  4. **Verify "Quit" label**: Confirm all 3 games use "Quit" (not "Home") for the site-root link. The SettingsActions component should enforce this, but verify in rendered HTML.

  5. **Styling**: Each game's CSS file may have inline `.settings-*` overrides. Audit and remove any that conflict with shared tab/modal styles. Keep game-specific color theming via CSS custom properties.

### LEG-10: Verification — Tests & Responsive Audit
- Status: not-started
- Confirmed: yes
- Depends on: LEG-4, LEG-5, LEG-7, LEG-8, LEG-9
- Thinking effort: medium
- Owned files:
  - `client/super-word/scene-builder.test.ts` — canvas-related proportional tests (if not already covered in WU-5)
  - `client/super-word/puzzles.test.ts` — word bank validation (if not already covered in WU-7)
  - `e2e/site-01-responsive.spec.ts` — viewport tests for new menu + portrait layout
  - `e2e/site-07-mission-orbit.spec.ts` — menu tab structure assertions
  - `e2e/site-08-chompers.spec.ts` — menu tab structure assertions
  - `e2e/site-09-pixel-passport.spec.ts` — menu tab structure assertions
  - `ATTRIBUTIONS.md` — regenerated via sync
- Verification: `npm run test:unit && npm run test:e2e && npm run build && npm run sync:attributions`
- Intent: Final verification pass ensuring all changes work together correctly.

  **Unit test gaps to fill:**
  - Canvas font-size mapping from SizeCategory (if not in WU-5 tests)
  - Modal tab switching logic (client/modal.ts) — verify aria-selected toggling, panel visibility
  - Preferences module: getMusicEnabled/setSfxEnabled round-trip with localStorage mock

  **E2E test updates:**
  - `site-01-responsive.spec.ts`: Add iPhone 17-like viewport (393×852). Verify no content clipping on Super Word game screen. Verify scene canvas visible and ≥ 140px tall. Verify check button within viewport bounds.
  - For each game's E2E spec: open settings modal, verify two tabs exist ("Settings" / "Info"), verify tab switching shows/hides panels, verify X close button dismisses modal, verify Restart + Quit in footer (no Close button), verify music and SFX toggles present (where applicable), verify difficulty selector shows Sidekick→Legend labels (Super Word only).

  **Attribution sync:**
  Run `npm run sync:attributions` to regenerate `ATTRIBUTIONS.md` from updated `app/data/attributions/super-word.ts` (changed in LEG-7).

  **Cross-game responsive audit:**
  Test all 4 games at checkpoints: 390×844 (portrait phone), 844×390 (landscape phone), 1024×768 (tablet), 1280×800 (desktop). Verify:
  - No horizontal overflow on any page
  - No content clipping (header, prompt, scene, collection area all visible)
  - Settings modal accessible and usable at all sizes
  - Canvas scene renders proportionally at all sizes (Super Word)

  **Budget check:**
  Build and verify all pages stay within budget.json limits (HTML ≤ 20KB, CSS ≤ 30KB, JS ≤ 50KB, total ≤ 200KB). The new shared modules (audio.ts, modal.ts, expanded preferences.ts) add JS weight — verify the total stays under 50KB per page. If word bank expansion pushes puzzles.ts over budget, consider lazy-loading word bank data or splitting into per-tier modules.

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

1. LEG-1 (Shared Preferences) — no dependencies
2. LEG-2 (Shared Two-Tab Modal) — parallel with LEG-1
3. LEG-3 (Shared Audio) — depends on LEG-1
4. LEG-6 (Word Bank Research) — parallel with LEG-1/2/3 (research only, no code deps)
5. LEG-4 (Canvas Scene Renderer) — parallel with LEG-3/6 (independent of shared infra)
6. LEG-5 (Scene Art Overhaul) — depends on LEG-4
7. LEG-7 (Word Bank + Difficulty) — depends on LEG-6
8. LEG-8 (Super Word Integration) — depends on LEG-1, LEG-2, LEG-3, LEG-5, LEG-7
9. LEG-9 (Cross-Game Rollout) — depends on LEG-1, LEG-2, LEG-3; parallel with LEG-8
10. LEG-10 (Verification) — depends on all

After all complete: `pnpm sync:attributions` → `npm run test:unit` → `npm run test:e2e` → `npm run build` → commit → push.

## Critique

Completed: 2026-04-06
Evaluated by: user + agent

### What Worked
- Shared infrastructure (preferences, modal, audio) is clean and well-consumed across all 4 games.
- Word bank: 257 words across 5 phonemic tiers with metadata, verified by tests.
- Canvas renderer with DPR handling, layered draw order, and a11y overlay with 44px+ hit targets.
- Cross-game rollout wired all 3 remaining games to shared modal/preferences/audio.
- Commit message with per-leg documentation makes tracing what shipped easy.

### What Didn't
- Incomplete canvas features (LEG-4): grayscale filter for collected items and hover effect (mousemove + 1.12x scale) were specified in intent but not implemented. Only `globalAlpha = 0.25` for collected items.
- Scene art expansion shortfall (LEG-5): plan specified ~60 total entries with 15-20 new distractors. Only 9 new entries added (116→125). Navigator knew ("6 new sky+ground art") but didn't flag the gap.
- E2E two-tab modal coverage gap (LEG-10): plan specified per-game assertions for tab existence, switching, X close, footer buttons, toggles. Only 1 tab assertion landed. Chompers E2E spec wasn't modified at all despite being in owned-file list.
- Score bookkeeping incomplete: LEG-8 left as in-progress, LEG-9/LEG-10 left as not-started. No `## Implementation` section with commit SHA. Navigator protocol steps 8 and 12 were skipped.
- Pixel Passport missing from sw.js precache ASSETS (pre-existing, but LEG-9 touched PP extensively and navigator didn't catch it).

### Corrections for Next Cycle
- Navigator must update ALL leg statuses to done/failed before committing and must write the `## Implementation` section after push (protocol steps 8 and 12).
- Navigator must flag numeric target shortfalls from intent during post-dispatch review (e.g., "~60 entries" vs 125 actual).
- Verification leg intents should list explicit per-file assertions rather than vague "fill E2E gaps" — e.g., "in site-08-chompers.spec.ts, assert two tabs exist with roles."