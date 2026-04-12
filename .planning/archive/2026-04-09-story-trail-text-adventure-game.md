# Plan: Story Trail — Text Adventure Game

## Project Context
- Sources:
  - `README.md` - source of truth for project principles and site values
  - `AGENTS.md` - workflow, validation, and environment expectations
  - `.agents/skills/gnd-chart/SKILL.md` - current plan structure used for archive preservation
  - `.agents/skills/gnd-critique/SKILL.md` - current critique and archive expectations
- Constraints:
  - This is a preserved historical plan archive migrated from repo memory into the current workspace archive.
  - Structural updates are limited to current gnd section names, leg identifiers, dependency references, and archive headings.
  - Preserve the original plan scope, implementation record, critique content, and boundary notes.
- Full validation:
  - `pnpm sync:attributions`
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

Build "Story Trail," a new text-based adventure game for kindergarteners who are learning to read. The game features 5 sequential educational stories (Weather, Plant Life Cycle, Animal Habitats, Community Helpers, Five Senses) unlocked along a trail-map overworld. Each story has simple branching scenes with choice-based navigation, collectible text-based items, and inventory puzzles. The visual design is text-focused — warm storybook typography, an ASCII/text-art trail map, typewriter text reveal with blip sounds, and minimal graphic decoration. Reading level targets K/Grade 1 (Dolch/Fry vocabulary, ≤6-word sentences). The game supports keyboard, touch, and gamepad input, is fully accessible, and follows all existing Peninsular Reveries conventions.

## Legs

### LEG-1: Story Trail — Core types and state machine
- Status: done
- Confirmed: yes
- Goal link: Establishes the entire data model and game logic foundation — every other leg depends on these types and state transitions.
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `games/story-trail/types.ts`
  - `games/story-trail/state.ts`
  - `games/story-trail/state.test.ts`
- Read-only:
  - `games/super-word/types.ts` — reference for type definition conventions (interface naming, readonly arrays, string literal unions)
  - `games/super-word/state.ts` — reference for pure state function patterns
- Deferred shared edits: none
- Verification: `node --import tsx --test games/story-trail/state.test.ts`
- Intent: |
    Design the complete type system and state machine for a text-based adventure game.

    **(1) types.ts — Core data structures:**

    ```typescript
    export interface Item {
      readonly id: string         // e.g. 'umbrella', 'watering-can'
      readonly name: string       // display name, ≤3 words
      readonly description: string // one short sentence
    }

    export interface Choice {
      readonly text: string         // choice button label, ≤4 words
      readonly targetSceneId: string
      readonly requiredItemId?: string  // item needed to pick this choice
      readonly hint?: string            // shown when item is missing, ≤8 words
      readonly grantsItemId?: string    // item received when this choice is picked
    }

    export interface Scene {
      readonly id: string
      readonly description: string    // 1-2 short sentences, K reading level
      readonly choices: readonly Choice[]
      readonly isEnd?: boolean        // true for story completion scenes
      readonly illustration?: string  // optional ASCII art key or short text decoration
    }

    export interface Story {
      readonly id: string           // e.g. 'weather', 'plants'
      readonly title: string        // display title, ≤3 words
      readonly icon: string         // single emoji for trail map marker
      readonly theme: string        // educational theme label
      readonly description: string  // 1-sentence summary
      readonly startSceneId: string
      readonly scenes: readonly Scene[]
      readonly items: readonly Item[]
      readonly badgeEmoji: string   // earned on completion
      readonly badgeName: string    // text badge name for a11y
    }

    export interface GameState {
      readonly currentStoryId: string | null
      readonly currentSceneId: string | null
      readonly inventory: readonly string[]      // item IDs
      readonly completedStoryIds: readonly string[]
      readonly earnedBadges: readonly string[]    // badge names
      readonly lastHint: string | null           // shown when missing item
      readonly lastCollectedItem: string | null  // flash on collect
    }
    ```

    Stories unlock sequentially: story index N is unlocked when `completedStoryIds.length >= N`. The first story (index 0) is always unlocked.

    **(2) state.ts — Pure state transition functions:**

    All functions are pure: `(state, ...args) => newState`. No side effects, no DOM, no imports except from `./types.js`.

    ```typescript
    export function createInitialState(): GameState
    // Returns state with null story/scene, empty inventory, empty completed

    export function startStory(state: GameState, storyId: string, startSceneId: string): GameState
    // Sets currentStoryId, currentSceneId, clears inventory and hints

    export function makeChoice(state: GameState, choice: Choice): GameState
    // If choice.requiredItemId and not in inventory → return state with lastHint set
    // If choice.grantsItemId → add to inventory, set lastCollectedItem
    // Move to choice.targetSceneId, clear lastHint

    export function collectItem(state: GameState, itemId: string): GameState
    // Add itemId to inventory if not already present, set lastCollectedItem

    export function completeStory(state: GameState, storyId: string, badgeName: string): GameState
    // Add storyId to completedStoryIds, add badgeName to earnedBadges
    // Clear currentStoryId, currentSceneId, inventory

    export function returnToTrailMap(state: GameState): GameState
    // Clear currentStoryId, currentSceneId, inventory, hints

    export function isStoryUnlocked(state: GameState, storyIndex: number): boolean
    // storyIndex === 0 || completedStoryIds.length >= storyIndex

    export function getScene(story: Story, sceneId: string): Scene | undefined
    // Lookup helper (pure, no state mutation)

    export function getItem(story: Story, itemId: string): Item | undefined
    // Lookup helper (pure, no state mutation)
    ```

    **(3) state.test.ts — Tests using node:test:**

    ```typescript
    import { describe, it } from 'node:test'
    import assert from 'node:assert/strict'
    ```

    Test cases:
    - `createInitialState()` returns null story/scene, empty arrays
    - `startStory()` sets story and scene, clears inventory
    - `makeChoice()` without required item sets lastHint
    - `makeChoice()` with required item in inventory moves to target scene
    - `makeChoice()` with grantsItemId adds item to inventory and sets lastCollectedItem
    - `collectItem()` adds item; duplicate collect is idempotent
    - `completeStory()` adds to completedStoryIds and earnedBadges, clears current
    - `isStoryUnlocked()` — index 0 always true; index 1 true only after 1 completion
    - `returnToTrailMap()` clears current state but preserves completedStoryIds
    - `getScene()` and `getItem()` return correct entries or undefined

    All state is readonly — tests should verify new references (not mutated originals).

### LEG-2: Story Trail — Five educational adventure stories
- Status: done
- Confirmed: yes
- Goal link: Creates the educational heart of the game — five age-appropriate adventure stories that teach K-level science and social studies vocabulary through gameplay.
- Depends on: LEG-1
- Thinking effort: medium
- Owned files:
  - `games/story-trail/story-weather.ts`
  - `games/story-trail/story-plants.ts`
  - `games/story-trail/story-habitats.ts`
  - `games/story-trail/story-helpers.ts`
  - `games/story-trail/story-senses.ts`
  - `games/story-trail/stories.ts`
  - `games/story-trail/stories.test.ts`
- Read-only:
  - `games/story-trail/types.ts` — Story, Scene, Choice, Item type definitions
- Deferred shared edits: none
- Verification: `node --import tsx --test games/story-trail/stories.test.ts`
- Intent: |
    Create 5 complete educational adventure stories as pure data conforming to the Story/Scene/Choice/Item types from types.ts. Import types with `import type { Story, Scene, Choice, Item } from './types.js'`. Each story file exports a single `const` of type `Story`.

    **Language constraints (K/Grade 1 reading level):**
    - Scene descriptions: 1-2 sentences, ≤6 words per sentence
    - Choice text: ≤4 words per choice button
    - Item names: ≤3 words
    - Use only Dolch/Fry high-frequency words + domain-specific vocabulary introduced in context
    - Every word should be concrete and imageable — a 5-year-old should be able to picture it
    - No scary, violent, or shame-based content. Wrong choices get gentle hints, not punishment.

    **Story structure pattern (each story):**
    - 8-10 scenes connected by choices
    - Mostly linear with 1-2 branch-and-rejoin points (not deep trees)
    - 2-3 collectible items earned via specific choices
    - 1-2 puzzle scenes where a choice requires having a specific item
    - One completion scene (`isEnd: true`) with a warm congratulatory message
    - Optional illustration field: short text decoration per scene (e.g., "~ * ~ rain falling ~ * ~")

    **Story 1 — Weather Watcher (story-weather.ts):**
    - `id: 'weather'`, icon: '🌦️', badgeEmoji: '🌈', badgeName: 'Rainbow Badge'
    - Theme: weather types and what causes them
    - Educational vocabulary: rain, sun, cloud, wind, snow, storm, rainbow, warm, cold, wet, dry
    - Items: umbrella, sun hat, warm coat
    - Scenes: sunny park → cloudy sky → rainy path → windy hill → snowy field → rainbow ending
    - Puzzle: need umbrella to cross rainy path; need warm coat for snowy field

    **Story 2 — Tiny Seed (story-plants.ts):**
    - `id: 'plants'`, icon: '🌱', badgeEmoji: '🌻', badgeName: 'Sunflower Badge'
    - Theme: plant life cycle (seed → roots → stem → leaves → flower)
    - Educational vocabulary: seed, soil, roots, stem, leaf, flower, sun, water, grow, dig, plant
    - Items: watering can, shovel, seeds
    - Scenes: garden start → dig hole → plant seed → water soil → watch roots → stem grows → leaves appear → flower blooms
    - Puzzle: need shovel to dig; need watering can to water

    **Story 3 — Animal Homes (story-habitats.ts):**
    - `id: 'habitats'`, icon: '🏡', badgeEmoji: '🦋', badgeName: 'Butterfly Badge'
    - Theme: matching animals to their habitats
    - Educational vocabulary: forest, pond, ocean, desert, bird, fish, fox, crab, frog, nest, den, shell
    - Items: binoculars, net, map
    - Scenes: trail start → forest (bird in nest, fox in den) → pond (frog on lily, fish below) → ocean (crab in shell) → desert (lizard under rock) → nature center ending
    - Puzzle: need binoculars to spot bird in forest; need map to find desert path

    **Story 4 — Helper Town (story-helpers.ts):**
    - `id: 'helpers'`, icon: '🚒', badgeEmoji: '⭐', badgeName: 'Gold Star Badge'
    - Theme: community helpers and what they do
    - Educational vocabulary: firefighter, doctor, teacher, farmer, mail, truck, hose, stethoscope, book, seed, letter, help
    - Items: thank-you card, helper badge, tool kit
    - Scenes: town square → fire station (help firefighter) → clinic (help doctor) → school (help teacher) → farm (help farmer) → post office → town celebration
    - Puzzle: need tool kit to help fix the fire truck; need helper badge to enter the clinic

    **Story 5 — Super Senses (story-senses.ts):**
    - `id: 'senses'`, icon: '👃', badgeEmoji: '🎭', badgeName: 'Senses Badge'
    - Theme: five senses and what each one detects
    - Educational vocabulary: see, hear, smell, taste, touch, eyes, ears, nose, tongue, hands, loud, soft, sweet, sour, rough, smooth
    - Items: magnifying glass, earplugs (ironic — to notice silence), blindfold
    - Scenes: sense garden entrance → sight station (colors, shapes) → sound station (loud/soft) → smell station (flowers, food) → taste station (sweet/sour) → touch station (rough/smooth) → sense celebration
    - Puzzle: need magnifying glass at sight station to find hidden detail

    **stories.ts (index file):**
    ```typescript
    import { weatherStory } from './story-weather.js'
    import { plantsStory } from './story-plants.js'
    import { habitatsStory } from './story-habitats.js'
    import { helpersStory } from './story-helpers.js'
    import { sensesStory } from './story-senses.js'
    import type { Story } from './types.js'

    export const allStories: readonly Story[] = [
      weatherStory,
      plantsStory,
      habitatsStory,
      helpersStory,
      sensesStory,
    ] as const
    ```

    The order in this array determines the unlock sequence.

    **stories.test.ts — Data integrity validation:**
    ```typescript
    import { describe, it } from 'node:test'
    import assert from 'node:assert/strict'
    ```

    For each story:
    - All scene IDs are unique within the story
    - `startSceneId` references an existing scene
    - Every `choice.targetSceneId` references an existing scene
    - Every `choice.requiredItemId` references an item in `story.items`
    - Every `choice.grantsItemId` references an item in `story.items`
    - At least one scene has `isEnd: true`
    - All items are obtainable: for each item, there exists a choice with `grantsItemId` referencing it
    - All scenes are reachable from `startSceneId` via BFS/DFS through choices
    - No dead-end scenes (every non-end scene has at least one choice)
    - Scene descriptions are ≤80 characters
    - Choice text is ≤30 characters
    - Item names are ≤30 characters

### LEG-3: Story Trail — Renderer and CSS
- Status: done
- Confirmed: yes
- Goal link: Creates everything the player sees — the visual layer that renders the trail map, scene reading, inventory, and completion screens with a warm text-focused storybook aesthetic.
- Depends on: LEG-1
- Thinking effort: medium
- Owned files:
  - `games/story-trail/renderer.ts`
  - `public/styles/story-trail.css`
- Read-only:
  - `games/story-trail/types.ts` — type definitions for Story, Scene, Item, GameState
  - `app/ui/game-shell.tsx` — GameScreen, GameHeader, GameTabbedModal component patterns
  - `games/super-word/renderer.ts` — reference for DOM rendering patterns (lazy element cache, screen helpers)
  - `public/styles/game.css` — reference for shared game CSS patterns
- Deferred shared edits: none
- Verification: `npx tsc --noEmit -p config/tsconfig.json 2>&1 | Select-String 'story-trail'`
- Intent: |
    Build the DOM renderer and CSS for Story Trail. This game is purely DOM-based (no canvas). All rendering is text-focused with warm storybook typography.

    **Imports:**
    ```typescript
    import type { Story, Scene, Item, GameState } from './types.js'
    ```

    **(1) renderer.ts — Screen rendering functions:**

    Lazy-cache all DOM elements at module scope:
    ```typescript
    let trailMapEl: HTMLElement | null = null
    function getTrailMap(): HTMLElement { return trailMapEl ??= document.getElementById('trail-map')! }
    // ... etc for scene-view, inventory-bar, etc.
    ```

    Export these functions:

    `renderTrailMap(stories: readonly Story[], state: GameState): void`
    - Renders an overworld-style trail map into `#trail-map`
    - Display as a vertical trail of 5 story stops connected by ASCII-art path segments
    - Each stop: story title + icon text. If unlocked and current: highlighted (bold, bright color). If unlocked and completed: show badge name. If locked: faded with "🔒" text.
    - Path segments between stops: ASCII art like `│`, `╰──╮`, `│` — simple vertical path with slight offsets
    - Trail connects top to bottom (first story at top)
    - Each unlocked stop is a `<button>` (iOS Safari rule — native interactive elements only). Locked stops are `<div>` with `aria-disabled="true"`.
    - Touch targets ≥44px. `touch-action: manipulation` on buttons.

    `renderScene(story: Story, scene: Scene, state: GameState): void`
    - Renders scene into `#scene-view`
    - Top area: scene description text in a `<p class="scene-text">` element. This element is populated but text reveal is handled by animations.ts typewriter (renderer just sets the raw text content for accessibility; the visual reveal is layered on top).
    - If scene has `illustration` field, render it in a `<div class="scene-illustration">` as text.
    - Below: choice buttons in a `<div class="choices">`. Each choice is a `<button class="choice-btn">` with `data-choice-index="N"`.
      - If choice has `requiredItemId` and item NOT in inventory, button shows the choice text but is styled with a lock indicator (CSS class `choice-locked`). Still clickable — clicking shows the hint.
      - If choice has `requiredItemId` and item IS in inventory, button is styled as unlocked.
    - Inventory bar at bottom: `<div class="inventory-bar">` with collected items as `<span class="inventory-item">` with item name text.

    `renderInventoryOverlay(story: Story, state: GameState): void`
    - Renders a larger inventory view into `#inventory-overlay`
    - Lists all collected items with name and description
    - "Close" button to dismiss

    `renderStoryComplete(story: Story): void`
    - Renders into `#completion-view`
    - Shows badge name in large text, congratulations message (1-2 short sentences)
    - "Back to Trail" `<button id="back-to-trail-btn">`

    `renderHint(hint: string): void`
    - Briefly displays hint text in `#hint-area` (a positioned overlay or inline element)

    `renderItemCollected(item: Item): void`
    - Flash "You found: [item name]!" in `#item-flash`

    `showScreen(screenId: string): void`
    - Uses CSS class swapping to transition between screens: `trail-map`, `scene-view`, `completion-view`
    - Pattern: set `data-active-screen` attribute on `#game-area`, CSS controls visibility

    `updateInventoryBar(story: Story, state: GameState): void`
    - Updates the inventory strip shown during scene view

    **(2) public/styles/story-trail.css — Visual design:**

    CSS custom properties at `.story-trail-game` scope:
    ```css
    .story-trail-game {
      --font: 'Georgia', 'Times New Roman', serif;
      --font-title: 'Georgia', 'Times New Roman', serif;
      --trail-bg: #f5f0e8;         /* warm parchment */
      --trail-text: #3a2e1f;        /* dark brown */
      --trail-accent: #6b8e4e;      /* forest green */
      --trail-highlight: #d4a853;   /* warm gold */
      --trail-locked: #b0a89a;      /* muted gray */
      --trail-badge: #e8a840;       /* badge gold */
    }
    ```

    Layout rules:
    - `height: 100dvh; min-height: 100svh` — full screen, no document scroll
    - `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)`
    - Grid layout: `display: grid; grid-template-rows: auto 1fr;` (header + content)

    Trail map:
    - Centered vertical trail, stops as blocks with padding
    - ASCII path segments styled in monospace font, `opacity: 0.6`
    - Unlocked stop: `background: var(--trail-accent); color: white; border-radius: 8px`
    - Locked stop: `opacity: 0.4; pointer-events: none`
    - Completed stop: border accent with badge text

    Scene view:
    - `.scene-text`: large font (`1.4rem`), `line-height: 1.6`, warm text color
    - `.choices`: flex column, gap `0.75rem`
    - `.choice-btn`: large touch target (`min-height: 48px`), border-radius `12px`, warm accent bg, `font-size: 1.1rem`, `touch-action: manipulation`
    - `.choice-locked`: dashed border, muted text
    - `.inventory-bar`: horizontal scroll, flex row, gap `0.5rem`, items as pills
    - `.scene-illustration`: monospace font, text-align center, `opacity: 0.7`, `white-space: pre`

    Completion view:
    - Centered text, large badge display, warm congratulatory colors

    **Viewport checkpoints** (390×844, 844×390, 1024×768, 1280×800):
    - Phone portrait: single column, full-width choices, compact trail stops
    - Phone landscape: compress header, scene text smaller
    - Tablet+: wider content area, trail map with more horizontal space, 2-column choices if ≥3 choices

    **Reduce motion**: No animation-dependent CSS. All transitions gated by `@media (prefers-reduced-motion: reduce)` or `[data-reduce-motion] &` selectors — instant state changes.

### LEG-4: Story Trail — Input, accessibility, animations, and sounds
- Status: done
- Confirmed: yes
- Goal link: Makes the game playable across all input methods and accessible to screen readers, with typewriter text reveal, polished transitions, and audio feedback.
- Depends on: LEG-1
- Thinking effort: medium
- Owned files:
  - `games/story-trail/input.ts`
  - `games/story-trail/accessibility.ts`
  - `games/story-trail/animations.ts`
  - `games/story-trail/sounds.ts`
- Read-only:
  - `games/story-trail/types.ts` — type definitions
  - `games/super-word/input.ts` — reference for InputCallbacks pattern and gamepad wiring
  - `games/super-word/accessibility.ts` — reference for announce/focus patterns
  - `games/super-word/animations.ts` — reference for CSS animation + Promise wrappers
  - `games/super-word/sounds.ts` — reference for Web Audio synth pattern
  - `client/audio.ts` — getAudioContext, createMusicBus, createSfxBus, ensureAudioUnlocked
  - `client/preferences.ts` — getMusicEnabled, getSfxEnabled, isReducedMotionEnabled
- Deferred shared edits: none
- Verification: `npx tsc --noEmit -p config/tsconfig.json 2>&1 | Select-String 'story-trail'`
- Intent: |
    Build the interaction, accessibility, animation, and audio layers for Story Trail.

    **(1) input.ts — Keyboard, touch, and gamepad input:**

    ```typescript
    import type { GameState, Choice } from './types.js'

    export interface InputCallbacks {
      onStorySelected: (storyId: string) => void
      onChoiceMade: (choiceIndex: number) => void
      onInventoryOpen: () => void
      onInventoryClose: () => void
      onBackToTrail: () => void
    }

    export function setupInput(
      getState: () => GameState,
      callbacks: InputCallbacks,
    ): void
    ```

    **Keyboard:**
    - Trail map: Arrow Up/Down to move between unlocked story stops, Enter/Space to select
    - Scene view: Arrow Up/Down to move between choice buttons, Enter/Space to select, I key to toggle inventory
    - Inventory: Escape or I to close, Arrow keys to browse items
    - Completion: Enter to go back to trail

    **Touch/Pointer:**
    - All interactive elements are native `<button>` elements — standard click/tap handling
    - Use event delegation on `#game-area` with `.closest('[data-choice-index]')` for choice clicks
    - Use event delegation for trail map stops: `.closest('[data-story-id]')`
    - `touch-action: manipulation` on all interactive containers

    **Gamepad:**
    - D-pad Up/Down navigates between choices or trail stops
    - A button (Button 0) selects
    - Start button (Button 9) opens/closes settings modal
    - B button (Button 1) goes back (inventory close, or return to trail)
    - Poll with `requestAnimationFrame` loop
    - Dead zone: ±0.5 on analog sticks, 200ms debounce between actions
    - Handle gamepad connection/disconnection gracefully

    **(2) accessibility.ts — Screen reader announcements and focus management:**

    ```typescript
    export function announceSceneDescription(description: string): void
    // Sets #game-status (polite) with scene text

    export function announceChoiceResult(text: string): void
    // Sets #game-feedback (assertive) — "You chose: [text]"

    export function announceItemCollected(itemName: string): void
    // Sets #game-feedback (assertive) — "You found: [itemName]!"

    export function announceHint(hint: string): void
    // Sets #game-feedback (assertive) with hint text

    export function announceStoryComplete(badgeName: string): void
    // Sets #game-feedback (assertive) — "You earned the [badgeName]!"

    export function announceTrailMap(unlockedCount: number, totalCount: number): void
    // Sets #game-status (polite) — "Trail map. [N] of [total] stories unlocked."

    export function moveFocus(element: HTMLElement): void
    // element.focus() after requestAnimationFrame

    export function moveFocusToFirstChoice(delayMs?: number): void
    // Focus first .choice-btn after optional delay (default 100ms)

    export function moveFocusToTrailMap(delayMs?: number): void
    // Focus first unlocked trail stop button
    ```

    Pattern: Two `aria-live` regions already in the SSR HTML — `#game-status` (polite) and `#game-feedback` (assertive). Set `.textContent` to announce.

    **(3) animations.ts — Typewriter effect and scene transitions:**

    ```typescript
    import { isReducedMotionEnabled } from '../../client/preferences.js'

    export function isReducedMotion(): boolean {
      return isReducedMotionEnabled()
    }

    export function typeText(
      element: HTMLElement,
      text: string,
      onChar?: () => void,
      speedMs?: number,
    ): Promise<void>
    ```

    `typeText` implementation:
    - If reduced motion: set `element.textContent = text` immediately, resolve. Do not call `onChar`.
    - Otherwise: clear element, then reveal one character at a time using `setTimeout` chain
    - Speed: `speedMs` default 80ms per character
    - Call `onChar()` callback on each character reveal (main.ts wires this to sound blip)
    - Return Promise that resolves when all characters are shown
    - Store a cancel token (module-scope `let activeTypewriter: number | null`) so starting a new typeText cancels any in-progress one

    ```typescript
    export function animateScreenTransition(
      fromScreenId: string,
      toScreenId: string,
    ): Promise<void>
    ```
    - CSS class-based slide transition between screens
    - If reduced motion: instant swap (no animation, resolve immediately)
    - Otherwise: slide left/right with 300ms transition, resolve on `transitionend` with timeout fallback

    ```typescript
    export function animateItemFlash(element: HTMLElement): Promise<void>
    ```
    - Brief scale-up + fade on item collection flash
    - If reduced motion: just show/hide instantly
    - CSS class `item-flash-active` triggers `@keyframes` animation
    - `animationend` + timeout fallback pattern

    ```typescript
    export function animateTrailAdvance(stopElement: HTMLElement): Promise<void>
    ```
    - Highlight the newly unlocked trail stop (pulse/glow)
    - If reduced motion: just apply final highlighted state

    **(4) sounds.ts — Web Audio synth:**

    ```typescript
    import { getAudioContext, createMusicBus, createSfxBus, ensureAudioUnlocked } from '../../client/audio.js'
    import { getMusicEnabled, getSfxEnabled } from '../../client/preferences.js'

    export { ensureAudioUnlocked }

    let _musicBus: GainNode | null = null
    let _sfxBus: GainNode | null = null
    function getMusicBusNode(): GainNode { return _musicBus ??= createMusicBus('story-trail') }
    function getSfxBusNode(): GainNode { return _sfxBus ??= createSfxBus('story-trail') }
    ```

    Export these synth functions:

    `playTypingBlip(): void`
    - Short noise burst (10-20ms), slightly randomized pitch each call
    - Gentle, not harsh — think soft typewriter key, not mechanical click
    - Check `getSfxEnabled()` before playing
    - Use white noise + bandpass filter at 800-1200 Hz, gain envelope with 5ms attack, 15ms decay

    `playItemCollect(): void`
    - Warm ascending chime: two sine oscillators a major third apart, 200ms duration
    - Check `getSfxEnabled()`

    `playChoiceConfirm(): void`
    - Soft click/pop: very short (30ms) sine at ~440Hz with quick decay
    - Check `getSfxEnabled()`

    `playHintNudge(): void`
    - Gentle descending tone: sine from 400→300Hz over 150ms — "not quite" feel, not punishing
    - Check `getSfxEnabled()`

    `playStoryComplete(): void`
    - Short fanfare: ascending arpeggio of 4 notes (C-E-G-C'), each 100ms, sine+triangle
    - Check `getSfxEnabled()`

    `playAmbientLoop(): void`
    - Very soft ambient pad on trail map screen: slow chord changes, triangle oscillators
    - Check `getMusicEnabled()` before starting
    - Store reference to stop it: `stopAmbientLoop(): void`

    All oscillators/nodes connect through the game-scoped bus nodes (music bus for ambient, sfx bus for everything else). Use `getAudioContext().currentTime` for scheduling.

### LEG-5: Story Trail — Controller, main, info, attributions, PWA
- Status: done
- Confirmed: yes
- Goal link: Wires the game into the site — SSR page shell, browser entry point that connects all modules, info page, attributions, and PWA assets for offline play.
- Depends on: LEG-1, LEG-2, LEG-3, LEG-4
- Thinking effort: medium
- Owned files:
  - `games/story-trail/controller.tsx`
  - `games/story-trail/main.ts`
  - `games/story-trail/info.ts`
  - `games/story-trail/attributions.ts`
  - `public/story-trail/manifest.json`
  - `public/story-trail/sw.js`
- Read-only:
  - `games/story-trail/types.ts` — type definitions
  - `games/story-trail/state.ts` — state functions
  - `games/story-trail/stories.ts` — allStories array
  - `games/story-trail/renderer.ts` — rendering functions
  - `games/story-trail/input.ts` — setupInput + InputCallbacks
  - `games/story-trail/accessibility.ts` — announcement and focus functions
  - `games/story-trail/animations.ts` — typeText, screen transitions
  - `games/story-trail/sounds.ts` — synth functions
  - `app/ui/game-shell.tsx` — GameScreen, GameHeader, GameTabbedModal, SettingsSection, SettingsToggle, SrOnly, InfoSection
  - `app/ui/document.tsx` — Document component
  - `app/site-config.ts` — withBasePath, siteBasePath
  - `client/shell.ts` — setupThemeToggle, registerServiceWorker
  - `client/audio.ts` — ensureAudioUnlocked
  - `client/modal.ts` — setupTabbedModal
  - `client/preferences.ts` — bindMusicToggle, bindSfxToggle, bindReduceMotionToggle
  - `games/super-word/controller.tsx` — reference for SSR page pattern
  - `games/super-word/main.ts` — reference for entry point wiring pattern
  - `public/super-word/manifest.json` — reference for PWA manifest pattern
  - `public/super-word/sw.js` — reference for service worker cleanup pattern
- Deferred shared edits:
  - `app/data/game-registry.ts` — Add entry: `{ slug: 'story-trail', name: 'Story Trail', description: 'Read, explore, and solve puzzles on five adventure trails.', icon: '📖', status: 'live' }`
  - `app/routes.ts` — Add: `storyTrail: '/story-trail/'` and `storyTrailInfo: '/story-trail/info/'`
  - `app/router.ts` — Import `storyTrailAction` from `./controllers/story-trail-controller.js` (or wherever the compiled output lands), wire `router.get(routes.storyTrail, () => storyTrailAction())` and `router.get(routes.storyTrailInfo, () => gameInfoAction('story-trail'))`
  - `app/data/attribution-index.ts` — Import `storyTrailAttribution` from `../../games/story-trail/attributions.js` and `storyTrailInfo` from `../../games/story-trail/info.js`, add to `gameAttributions` map and `gameInfoMap`
  - `build.ts` — Add `'games/story-trail/main.ts'` to esbuild entryPoints array. Add static routes: `{ url: 'http://localhost/story-trail/', outPath: 'story-trail/index.html' }` and `{ url: 'http://localhost/story-trail/info/', outPath: 'story-trail/info/index.html' }`
  - `server.ts` — Add `'games/story-trail/main.ts'` to dev server esbuild entryPoints array
  - `app/controllers/home.tsx` — Add Story Trail game card in appropriate position
- Verification: `npx tsc --noEmit -p config/tsconfig.json 2>&1 | Select-String 'story-trail'`
- Intent: |
    Build the SSR page shell, browser entry point, metadata, and PWA assets for Story Trail.

    **(1) controller.tsx — SSR page controller:**

    Follow the exact pattern from `games/super-word/controller.tsx`:

    ```typescript
    import { renderToString } from 'remix/component/server'
    import { css } from 'remix/component'
    import { Document } from '../../app/ui/document.js'
    import { GameScreen, GameHeader, GameHeaderPill, GameTabbedModal, SettingsSection, SettingsToggle, SrOnly, InfoSection } from '../../app/ui/game-shell.js'
    import { withBasePath, siteBasePath } from '../../app/site-config.js'
    import { storyTrailInfo } from './info.js'
    ```

    Export: `export function storyTrailAction(): Response`

    Page structure:
    - `<Document>` with `title="Story Trail"`, `description="Read, explore, and solve puzzles on five adventure trails."`, `bodyClass="story-trail-game"`, `scripts={[withBasePath('/client/story-trail/main.js', siteBasePath)]}`, `styles={[withBasePath('/styles/story-trail.css', siteBasePath)]}`, `includeNav={false}`, `includeFooter={false}`
    - `<GameHeader>` with left content: `<GameHeaderPill id="badge-counter" icon="📖" value="0/5" />`, right content: menu button `<button id="menu-btn" class="menu-btn" aria-label="Open menu">☰</button>`
    - Main content area `<div id="game-area">`:
      - `<GameScreen id="trail-map" labelledBy="trail-heading">` — the overworld trail map screen (default visible)
        - `<h1 id="trail-heading">Story Trail</h1>`
        - `<div id="trail-stops">` — populated by renderer
      - `<GameScreen id="scene-view" labelledBy="scene-heading">` — scene reading screen
        - `<h2 id="scene-heading" class="sr-only">Scene</h2>`
        - `<div id="scene-illustration" class="scene-illustration"></div>`
        - `<p id="scene-text" class="scene-text" aria-live="polite"></p>`
        - `<div id="hint-area" class="hint-area" role="alert" hidden></div>`
        - `<div id="item-flash" class="item-flash" role="status" hidden></div>`
        - `<div id="choices" class="choices"></div>`
        - `<div id="inventory-bar" class="inventory-bar" aria-label="Inventory"></div>`
      - `<GameScreen id="completion-view" labelledBy="completion-heading">` — story complete screen
        - Content populated by renderer
      - `<div id="inventory-overlay" class="inventory-overlay" role="dialog" aria-modal="true" aria-label="Inventory" hidden></div>`
    - `<SrOnly id="game-status" ariaLive="polite" />`
    - `<SrOnly id="game-feedback" ariaLive="assertive" />`
    - `<GameTabbedModal>` with:
      - Settings tab: Music toggle (`id="music-enabled-toggle"`), SFX toggle (`id="sfx-enabled-toggle"`), Reduce Motion toggle (`id="reduce-motion-toggle"`)
      - Info tab: `<InfoSection title="About Story Trail">` with summary from info.ts, link to `/story-trail/info/`
      - Quit href: `withBasePath('/', siteBasePath)`

    Return `new Response(renderToString(<Document>...</Document>), { headers: { 'Content-Type': 'text/html' } })`

    **(2) main.ts — Browser entry point:**

    ```typescript
    import { allStories } from './stories.js'
    import { createInitialState, startStory, makeChoice, completeStory, returnToTrailMap, isStoryUnlocked, getScene, getItem } from './state.js'
    import type { GameState, Story, Scene } from './types.js'
    import { renderTrailMap, renderScene, renderStoryComplete, renderHint, renderItemCollected, showScreen, updateInventoryBar, renderInventoryOverlay } from './renderer.js'
    import { setupInput } from './input.js'
    import type { InputCallbacks } from './input.js'
    import { announceSceneDescription, announceChoiceResult, announceItemCollected, announceHint, announceStoryComplete, announceTrailMap, moveFocusToFirstChoice, moveFocusToTrailMap } from './accessibility.js'
    import { typeText, animateScreenTransition, animateItemFlash, animateTrailAdvance, isReducedMotion } from './animations.js'
    import { playTypingBlip, playItemCollect, playChoiceConfirm, playHintNudge, playStoryComplete, playAmbientLoop, stopAmbientLoop, ensureAudioUnlocked } from './sounds.js'
    import { setupTabbedModal } from '../../client/modal.js'
    import { bindMusicToggle, bindSfxToggle, bindReduceMotionToggle } from '../../client/preferences.js'
    ```

    Global state:
    ```typescript
    let gameState: GameState = createInitialState()
    function getState(): GameState { return gameState }
    function setState(s: GameState): void { gameState = s; refreshUI() }
    function currentStory(): Story | undefined { return allStories.find(s => s.id === gameState.currentStoryId) }
    function currentScene(): Scene | undefined { const s = currentStory(); return s ? getScene(s, gameState.currentSceneId!) : undefined }
    ```

    Core flow functions:

    `refreshUI()`: Based on current state, re-render the active screen (trail map or scene or completion). Update badge counter `#badge-counter` with `completedStoryIds.length / 5`.

    `onStorySelected(storyId)`:
    1. `ensureAudioUnlocked()`
    2. `stopAmbientLoop()`
    3. Start story: `setState(startStory(gameState, storyId, story.startSceneId))`
    4. `showScreen('scene-view')`
    5. Render scene, then typewriter the description text: `typeText(sceneTextEl, scene.description, playTypingBlip)`
    6. After typewriter completes: `moveFocusToFirstChoice()`
    7. `announceSceneDescription(scene.description)`

    `onChoiceMade(choiceIndex)`:
    1. Get scene, get choice at index
    2. `playChoiceConfirm()`
    3. `const newState = makeChoice(gameState, choice)`
    4. If `newState.lastHint`:
       - `playHintNudge()`
       - `renderHint(newState.lastHint)`
       - `announceHint(newState.lastHint)`
       - return (don't advance scene)
    5. If `newState.lastCollectedItem`:
       - `playItemCollect()`
       - Render item flash, `animateItemFlash(itemFlashEl)`
       - `announceItemCollected(itemName)`
    6. `setState(newState)`
    7. Check if new scene `isEnd` → call `onStoryComplete()`
    8. Otherwise: animate scene transition, render new scene, typewriter text, focus first choice, announce
    9. `announceChoiceResult(choice.text)`

    `onStoryComplete()`:
    1. `const story = currentStory()!`
    2. `playStoryComplete()`
    3. `setState(completeStory(gameState, story.id, story.badgeName))`
    4. `renderStoryComplete(story)`, `showScreen('completion-view')`
    5. `announceStoryComplete(story.badgeName)`

    `onBackToTrail()`:
    1. `setState(returnToTrailMap(gameState))`
    2. `showScreen('trail-map')`, `renderTrailMap(allStories, gameState)`
    3. `playAmbientLoop()`, `announceTrailMap(...)`
    4. If a new story was just unlocked: `animateTrailAdvance(newStopEl)`
    5. `moveFocusToTrailMap()`

    `onInventoryOpen()` / `onInventoryClose()`: Toggle `#inventory-overlay` hidden attribute.

    Initialization:
    ```typescript
    // Load saved progress from localStorage
    const saved = localStorage.getItem('story-trail-progress')
    if (saved) { /* restore completedStoryIds and earnedBadges */ }

    // Initial render
    renderTrailMap(allStories, gameState)
    playAmbientLoop()
    announceTrailMap(...)

    // Wire input
    setupInput(getState, { onStorySelected, onChoiceMade, onInventoryOpen, onInventoryClose, onBackToTrail })

    // Wire settings
    setupTabbedModal()
    bindMusicToggle('story-trail')
    bindSfxToggle('story-trail')
    bindReduceMotionToggle()

    // Save progress on story complete
    function saveProgress(): void {
      localStorage.setItem('story-trail-progress', JSON.stringify({
        completedStoryIds: gameState.completedStoryIds,
        earnedBadges: gameState.earnedBadges,
      }))
    }
    ```

    **(3) info.ts:**
    ```typescript
    export const storyTrailInfo = {
      summary: 'Five adventure stories for young readers. Explore weather, plants, animal homes, community helpers, and the five senses. Read scenes, collect items, and solve puzzles along the trail.'
    }
    ```

    **(4) attributions.ts:**
    ```typescript
    import { repositoryCodeLicense } from '../../app/data/attribution-types.js'
    import type { GameAttribution } from '../../app/data/attribution-types.js'

    export const storyTrailAttribution: GameAttribution = {
      slug: 'story-trail',
      name: 'Story Trail',
      codeLicense: repositoryCodeLicense,
      entries: [
        {
          title: 'Ambient synth soundtrack',
          type: 'music',
          usedIn: 'Story Trail trail map ambient music',
          creator: 'Peninsular Reveries',
          source: 'Generated in-browser with the Web Audio API',
          license: repositoryCodeLicense,
          modifications: 'Not applicable',
          notes: 'Procedurally generated ambient pad using triangle and sine oscillators.'
        },
        {
          title: 'Sound effects',
          type: 'sound effect',
          usedIn: 'Story Trail typing blips, item collect chimes, choice confirms, and story complete fanfare',
          creator: 'Peninsular Reveries',
          source: 'Generated in-browser with the Web Audio API',
          license: repositoryCodeLicense,
          modifications: 'Not applicable',
          notes: 'All sound effects are synthesized in real-time.'
        },
      ],
    }
    ```

    **(5) public/story-trail/manifest.json:**
    Follow exact pattern from `public/super-word/manifest.json`:
    ```json
    {
      "id": "./",
      "name": "Story Trail",
      "short_name": "Story Trail",
      "description": "Read, explore, and solve puzzles on five adventure trails.",
      "start_url": "./",
      "scope": "./",
      "display": "standalone",
      "background_color": "#f5f0e8",
      "theme_color": "#f5f0e8",
      "icons": [
        {
          "src": "../favicon-game-story-trail.svg",
          "sizes": "any",
          "type": "image/svg+xml"
        }
      ]
    }
    ```

    **(6) public/story-trail/sw.js:**
    Follow exact pattern from `public/super-word/sw.js` — cleanup worker that unregisters itself:
    ```javascript
    self.addEventListener('install', () => self.skipWaiting())
    self.addEventListener('activate', (event) => {
      event.waitUntil((async () => {
        const keys = await caches.keys()
        await Promise.all(
          keys.filter((k) => k.startsWith('story-trail')).map((k) => caches.delete(k))
        )
        await self.registration.unregister()
      })())
    })
    ```

### LEG-6: Story Trail — E2E Playwright tests
- Status: done
- Confirmed: yes
- Goal link: Validates the complete user journey through the game in a browser — story selection, reading, choices, inventory, item use, and story completion.
- Depends on: LEG-1, LEG-2, LEG-3, LEG-4, LEG-5
- Thinking effort: medium
- Owned files:
  - `e2e/site-08-story-trail.spec.ts`
- Read-only:
  - `e2e/site-07-game-smoke.spec.ts` — reference for E2E test patterns and assertions
  - `games/story-trail/stories.ts` — story data for assertion values
  - `games/story-trail/story-weather.ts` — first story scene/choice data for detailed flow test
- Deferred shared edits: none
- Verification: `npx playwright test e2e/site-08-story-trail.spec.ts --reporter=list`
- Intent: |
    Write Playwright E2E tests for Story Trail following the patterns in `e2e/site-07-game-smoke.spec.ts`.

    ```typescript
    import { test, expect } from '@playwright/test'

    test.describe('SITE-08: Story Trail', () => { ... })
    ```

    **Specific assertions per test:**

    1. `'trail map renders with 5 story stops'`:
       - `await page.goto('/story-trail/')`
       - `await expect(page.locator('#trail-map')).toBeVisible()`
       - `await expect(page.getByRole('heading', { name: 'Story Trail' })).toBeVisible()`
       - First story stop is a button (unlocked): `await expect(page.locator('[data-story-id="weather"]')).toBeVisible()`
       - Remaining 4 stops exist but are locked (have aria-disabled or locked styling)
       - Total of 5 trail stops: `await expect(page.locator('[data-story-id]')).toHaveCount(5)`

    2. `'first story is selectable and shows scene'`:
       - Navigate to `/story-trail/`, click the Weather story stop
       - `await expect(page.locator('#scene-view')).toBeVisible()`
       - Scene text appears (non-empty): `await expect(page.locator('#scene-text')).not.toBeEmpty()`
       - Choice buttons are visible: `await expect(page.locator('.choice-btn').first()).toBeVisible()`
       - Choice buttons have ≥44px touch target height

    3. `'making a choice navigates to next scene'`:
       - Start Weather story, click a choice button
       - Scene text changes (different from initial)
       - New choices appear

    4. `'inventory shows collected items'`:
       - Navigate to a scene where an item is granted (use specific Weather story choice data)
       - Inventory bar shows the item name
       - Item is visible as text in `.inventory-bar`

    5. `'locked choice shows hint when item missing'`:
       - Navigate to a puzzle scene (specific Weather scene with requiredItemId)
       - Click the locked choice
       - Hint area becomes visible: `await expect(page.locator('#hint-area')).toBeVisible()`
       - Hint text is non-empty

    6. `'story completion shows badge and returns to trail'`:
       - Play through Weather story to completion (click through known choice sequence)
       - Completion view is visible: `await expect(page.locator('#completion-view')).toBeVisible()`
       - Badge text is shown
       - Click "Back to Trail" button
       - Trail map is visible again
       - Weather stop shows completed state
       - Second story (Plants) stop is now unlocked

    7. `'settings modal opens, tabs switch, close works'`:
       - Open menu via `#menu-btn`
       - Settings modal is visible
       - Two tabs exist (Settings, Info)
       - Tab switching shows/hides panels
       - Music and SFX toggles are present
       - Close button (`#settings-close-btn`) dismisses modal

    8. `'keyboard navigation through choices'`:
       - Start Weather story
       - Press Tab to reach first choice, press ArrowDown to move between choices
       - Press Enter to select — scene advances
       - Verify focus management: after scene change, first choice receives focus

    9. `'locked stories cannot be selected'`:
       - On trail map, verify locked story stops have `aria-disabled="true"` or equivalent
       - Clicking/tapping a locked stop does not navigate to a scene

    10. `'progress persists across page reload'`:
        - Complete Weather story
        - Reload the page (`page.reload()`)
        - Trail map shows Weather as completed, Plants as unlocked

    All tests use `page.getByRole()` and semantic locators where possible. Use `data-*` attributes as fallbacks. Assert `toBeInViewport()` for visibility checks on game screens.

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

1. LEG-1 (Types + State) — no dependencies
2. LEG-2 (Story Content) — depends on LEG-1
3. LEG-3 (Renderer + CSS) — depends on LEG-1
4. LEG-4 (Input + A11y + Animations + Sounds) — depends on LEG-1
5. LEG-5 (Controller + Main + Wiring + PWA) — depends on LEG-1, LEG-2, LEG-3, LEG-4
6. LEG-6 (E2E Tests) — depends on all

After all complete: apply deferred edits → `pnpm sync:attributions` → `pnpm test:local` → commit → push.

## Implementation
Commit: c9193f5
Pushed: 2026-04-08

## Boundary Notes
- `public/styles/story-trail.css` corrected by navigator after LEG-6 flagged CSS visibility bug (GameScreen visibility: hidden inherited from shared @layer rmx class). Added `visibility: visible` to active-screen rules.

## Critique

Completed: 2026-04-09
Evaluated by: user + agent (interactive review)

### What Worked
- Deployment verified: production `sw.js` matched implementation commit `c9193f5`.
- User confirmed the score's User Intent still matched the desired Story Trail outcome.
- Route, info page, home-page integration, and metadata all landed in production.

### What Didn't
- Active Story Trail screens ship off-canvas: the shared GameScreen `transform: translateX(100%)` remained in effect while Story Trail restored only display and visibility, leaving the live route visually blank except for the header.
- Story Trail e2e normalized invisible UI by using `dispatchEvent()` and DOM-text assertions instead of visible user interaction and viewport checks, so the blank-screen regression shipped.
- Ambient loop drifted from the approved intent: the shipped track is a fixed pulsing triad rather than an evolving ambient pad with slow chord changes.

### Compose Gaps
- Menu and settings standards were under-specified in workshop. The plan treated "menu exists" as sufficient instead of checking the game against the repo menu baseline.

### User Effectiveness
- No material intent gap surfaced from the user's prompt or workshop responses.
- If menu UX must match a stricter house pattern than the existing baseline, call that out explicitly during alignment.

### Corrections for Next Cycle
- Keep Navigator as the workflow agent and Performer as the only implementation subagent; retire Understudy and Soloist.
- Replace Claude-specific workflow references with GPT-5.4 or picker-driven model selection, and move workspace instructions to `AGENTS.md`.
- Legs that customize GameScreen activation must explicitly account for shared transform and visibility behavior.
- Menu or settings legs must enumerate the baseline sections and actions instead of accepting "wire GameTabbedModal."
- Visible gameplay e2e happy paths must use real user interaction plus visible or in-viewport assertions; do not normalize off-canvas UI with `dispatchEvent()`.