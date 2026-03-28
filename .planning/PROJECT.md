# Peninsular Reveries

## What This Is

A lo-fi personal website for hosting self-contained web games, puzzles, and code experiments. Built with web standards — TypeScript, vanilla CSS, esbuild, no framework. Clean, minimal aesthetic with subtle personality — the kind of site that makes you pause and think "oh, this is nice." Deployed as a static site on GitHub Pages.

## Core Value

A frictionless home for creative projects — dead simple to add new games and experiments, beautiful to look at, zero maintenance overhead.

## Requirements

### Validated

- [x] Super Word game: full rewrite of the AI prototype — same letter-finding concept, polished visuals and UX (Validated in Phase 02: super-word-game)
- [x] TypeScript throughout, web standards first (Validated in Phase 02: super-word-game)

### Active

- [ ] Static site with homepage and per-project pages
- [ ] Clean, minimal design with subtle quirky personality touches
- [ ] Easy to add new games/experiments (just create files, minimal boilerplate)
- [ ] GitHub Pages deployment
- [ ] Accessible and responsive

### Out of Scope

- Remix 3 packages — research concluded fetch-router is server-side only, html-template is marginal
- Blog/writing features — not interested in writing-heavy content right now
- Backend/database — everything is client-side
- React or any virtual DOM framework — web standards only

## Context

- **Existing code:** `super-word/` contains an AI-generated prototype of a children's word puzzle game (vanilla HTML/CSS/JS). Kids find emoji-labeled letters hidden in a scene to spell words. 5 puzzles (CAT, SUN, FROG, STAR, plus one more). Drag-and-drop collection, hints, score tracking, level progression, win screen. This is the starting point for the remake — concept stays, implementation gets rewritten in TypeScript with proper architecture.
- **Remix 3 evaluated:** Research concluded fetch-router is server-side only (no server here), html-template is marginal. Revisit in future milestones if server-side features are needed.
- **Design references:** makingsoftware.com (warm, intentional aesthetic without overdesign). Goal is minimal effort to maintain but visually delightful.
- **Developer context:** Autism means sticking with things can be hard — the site and tooling need to be low-friction enough to return to after breaks. Minimizing setup/maintenance overhead is a real requirement, not a nice-to-have.
- **Minimal tooling:** esbuild for TS compilation (sub-second builds). No Vite, no Webpack, no complex config.

## Constraints

- **Stack**: TypeScript + esbuild + vanilla CSS + GitHub Pages. No React. No heavy frameworks.
- **Hosting**: GitHub Pages (static files). Cloudflare Pages as backup if perf is an issue.
- **Build**: Minimal esbuild build step — TypeScript → browser JS. Single ~50-line build script.
- **Design**: Must look good with minimal design effort. Clean typography, good spacing, a few intentional personality touches.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No Remix 3 packages at launch | Research: fetch-router is server-side only, html-template marginal. Revisit later. | ✓ Good |
| TypeScript over plain JS | Better DX for game logic, catches bugs early | — Pending |
| GitHub Pages hosting | Free, deploys from git, familiar workflow | — Pending |
| Full rewrite of Super Word (not cleanup) | AI prototype has useful concept but needs proper architecture | ✓ Good — 8 TS modules, proper state/render/input separation |
| No React / no virtual DOM | Web standards alignment, Remix 3 philosophy, simpler mental model | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: after Phase 02 (super-word-game) completion*
