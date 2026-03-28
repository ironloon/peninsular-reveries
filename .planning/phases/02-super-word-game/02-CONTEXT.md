# Phase 2: Super Word Game - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Full TypeScript rewrite of the Super Word puzzle game with accessibility baked in. Users can play all 5 puzzles from start to finish on the live site. All interactions are keyboard-navigable, touch-friendly (Pointer Events, 44px+ targets), and provide visual + aria-live feedback. WCAG 2.1 AA contrast throughout.

</domain>

<decisions>
## Implementation Decisions

### Visual Identity
- **D-01:** Game gets its own vibrant palette, separate from the site's earthy tones. The site shell (header/footer) stays earthy; the game area uses its own colors.
- **D-02:** Keep the prototype's purple/yellow/orange color scheme (`--purple: #6C3FC5`, `--yellow: #FFD93D`, `--orange: #FF6B35`, `--green: #43A047`, `--sky: #7EC8E3`) as the starting point. Refine for WCAG AA contrast, don't reinvent.

### Interaction Model
- **D-03:** Click/tap to collect letters from the scene. Collected items animate out and fully disappear from the scene — not ghost/dim in place like the prototype does.
- **D-04:** Both click-to-swap AND drag-and-drop for reordering collected letters. Click-to-swap needs an obvious visual "selected" state (glow, lift, color change) — the prototype's selection was too subtle and unclear.
- **D-05:** Use Pointer Events API with 44px+ touch targets (GAME-03). All interactions must feel clear and responsive — every action should have obvious visual feedback.

### Game Architecture
- **D-06:** Modular separation of concerns — state management, rendering, input handling, puzzle data, and accessibility should be separate modules.
- **D-07:** Research question for phase researcher: DOM vs Canvas vs lightweight game framework. Must weigh accessibility heavily — GAME-02 and GAME-04 require keyboard nav + aria-live announcements, which complicates Canvas approaches.
- **D-08:** Puzzle data in a separate config file (JSON or TS data module). Adding new words = adding data, not changing game code.
- **D-09:** URL params for initial state — `?puzzle=3`, `?puzzles=CAT,FROG`, etc. Serves both dev/debug and shareable links.
- **D-10:** localStorage architecture prep for mid-game state. Phase 4 (LOOK-02) wires up actual persistence; Phase 2 sets up serializable state that could be saved.

### Feedback & Celebrations
- **D-11:** Playful but lightweight by default — emoji toasts, satisfying collect animations, bounce-in tiles, brief level-complete celebration.
- **D-12:** Optional "wow mode" toggle for full celebration effects (confetti, particles, bigger animations). Can be URL param (`?wow=true`) or in-game toggle.
- **D-13:** All feedback paired with aria-live announcements (GAME-04). LOOK-05 (prefers-reduced-motion) would naturally override wow mode in Phase 4.

### Agent's Discretion
- Exact animation timing and easing for collect/swap/celebration effects
- Module file structure and naming conventions
- Loading skeleton approach (if needed for asset initialization)
- Specific implementation of "wow mode" effects (confetti library vs custom particles vs CSS animations)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Project
- `.planning/REQUIREMENTS.md` — GAME-01 through GAME-05 define the acceptance criteria for this phase
- `.planning/PROJECT.md` — Project vision, principles, and non-negotiables
- `.planning/ROADMAP.md` §Phase 2 — Phase goal, dependencies, and success criteria

### Prototype Reference
- `super-word/app.js` — Original game prototype (~450 lines). Contains puzzle data structure, game flow, drag-and-drop + click-to-swap logic. This is the concept reference for the rewrite.
- `super-word/index.html` — Prototype HTML structure (start screen, game screen, level complete screen, win screen)
- `super-word/style.css` — Prototype color palette and layout. Source for D-02 color values.

### Site Foundation (Phase 1 output)
- `src/shared/game-registry.ts` — GameEntry interface and games array. Super Word already registered.
- `src/shared/shell.ts` — Nav generation from game registry. New game page must integrate.
- `public/styles/main.css` — Site CSS design system (earthy palette, fluid typography, spacing scale). Game shell uses this; game area uses its own palette.
- `build.ts` — esbuild build script. New game entry point must be added here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `game-registry.ts`: Super Word already registered with slug `super-word`. Game page routing is pre-wired.
- `shell.ts`: Nav generation — new game page gets nav automatically via registry.
- `main.css` design system: CSS custom properties, fluid typography, and spacing scale available for the site shell wrapping the game.

### Established Patterns
- esbuild bundling with entry points per page — game will need its own entry point added to `build.ts`
- Vanilla TypeScript with no framework — game modules follow the same pattern
- CSS custom properties for theming — game can define its own property set scoped to the game container

### Integration Points
- `build.ts` needs a new entry point for the game page TypeScript
- `public/super-word/index.html` currently has a placeholder — will be replaced with the real game page
- Game must render inside the site shell (header/nav from `shell.ts`) while having its own visual palette in the game area

</code_context>

<specifics>
## Specific Ideas

- Collected items should animate out of the scene (not just fade/dim). The prototype's approach of adding a `collected` CSS class that reduces opacity was confusing — items looked ghosted but still present.
- Click-to-swap selection state must be unmistakable: think glow, lift/scale, or color highlight. The prototype's selection indicator was too subtle for users to notice.
- Prototype's PUZZLES array structure (answer, prompt, hint, items with letter + emoji + label) is a good starting data model — extract to config.
- URL params like `?puzzle=3` or `?puzzles=CAT,FROG` serve double duty: dev/debug shortcut + shareable "try this puzzle" links.
- "Wow mode" could be a fun Easter egg OR an accessibility preference (some users love maximal feedback). Consider `?wow=true` URL param and/or an in-game toggle.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-super-word-game*
*Context gathered: 2026-03-28*
