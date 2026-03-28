# Phase 2: Super Word Game - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 02-super-word-game
**Areas discussed:** Visual identity, Interaction model, Game architecture, Feedback & celebrations

---

## Visual Identity

### Q1: How should the game's visual style relate to the site?

| Option | Description | Selected |
|--------|-------------|----------|
| Inherit site palette | Game uses the earthy site colors for consistency | |
| Own palette | Game gets its own vibrant color scheme, site shell stays earthy | ✓ |
| Hybrid | Site colors for chrome, accent palette for game elements | |

**User's choice:** Own palette — game gets its own colors
**Notes:** User wants a clear visual distinction between the site shell and the game area.

### Q2: Keep the prototype's purple/yellow palette or start fresh?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep prototype palette | Refine the existing purple/yellow/orange scheme for contrast | ✓ |
| Fresh palette | Design a new color scheme from scratch | |
| Explore alternatives | Research game-appropriate palettes before deciding | |

**User's choice:** Keep prototype palette
**Notes:** Refine for WCAG AA contrast, but don't reinvent the wheel. The prototype's vibrant children's aesthetic works for this game.

---

## Interaction Model

### Q1: How should players collect letters from the scene?

| Option | Description | Selected |
|--------|-------------|----------|
| Click/tap to collect | Simple click or tap on scene items to add letters | ✓ |
| Drag to collection area | Drag items from scene into the collection zone | |
| Auto-collect on proximity | Items collect when cursor/finger gets close | |

**User's choice:** Click/tap to collect
**Notes:** User noted that in the prototype, collected items don't disappear — they stay visible with reduced opacity, which is confusing. Items should animate out and fully disappear from the scene when collected.

### Q2: How should players reorder collected letters?

| Option | Description | Selected |
|--------|-------------|----------|
| Click-to-swap only | Click two letters to swap positions | |
| Drag-and-drop only | Drag letters to reorder | |
| Both methods | Support both click-to-swap and drag-and-drop | ✓ |

**User's choice:** Both methods
**Notes:** The prototype supported both but the experience was awkward/unclear. Click-to-swap needs an obvious selection state — glow, lift, color change. The prototype's selection indicator was too subtle. Every action should feel obvious and responsive.

---

## Game Architecture

### Q1: How should the TypeScript rewrite be structured?

| Option | Description | Selected |
|--------|-------------|----------|
| Single module | One file with all game logic (like the prototype) | |
| Separate concerns | Modular split: state, rendering, input, puzzle data, accessibility | ✓ |
| Game framework | Use a lightweight game engine/framework | |

**User's choice:** Separate concerns
**Notes:** User also expressed interest in game engines/frameworks — this became a research question (D-07). User wants configurable game state via URL params and localStorage.

### Q2: What's the configurability use case?

| Option | Description | Selected |
|--------|-------------|----------|
| Dev/debug only | URL params for jumping to specific puzzles during development | |
| Shareable links | URL params that can be shared with others | |
| Full state persistence | URL params + localStorage for mid-game state | ✓ |

**User's choice:** All three — dev/debug tool, shareable links, and localStorage for mid-game state
**Notes:** URL params for initial state (`?puzzle=3`, `?puzzles=CAT,FROG`). localStorage prep for Phase 4 persistence. Architecture should support serializable state from the start.

### Research Question Identified
- DOM vs Canvas vs lightweight game framework — agent flagged that Canvas complicates accessibility (keyboard nav, aria-live). This became D-07, a research question for the phase researcher.

---

## Feedback & Celebrations

### Q1: How elaborate should game feedback be?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | Simple text confirmations, no animation | |
| Playful but lightweight | Emoji toasts, satisfying animations, brief celebrations | ✓ |
| Full celebration | Confetti, particles, elaborate level transitions | |

**User's choice:** Playful but lightweight — with an optional "wow mode"
**Notes:** User wants a lightweight default experience but expressed interest in a setting to "really boost the WOW." This became D-12 — an optional wow mode toggle (URL param `?wow=true` or in-game toggle) for users who want maximal feedback.

---

## Agent's Discretion

- Exact animation timing and easing curves
- Module file structure and naming conventions
- Loading skeleton approach
- Specific "wow mode" effect implementation

## Deferred Ideas

None — all discussion stayed within Phase 2 scope.
