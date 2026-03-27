# Project Research Summary

**Project:** Peninsular Reveries
**Domain:** Personal creative web portfolio with browser games
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

Peninsular Reveries is a static personal portfolio site with self-contained browser games, deployed to GitHub Pages. The expert consensus is clear: this is a **multi-page static site** built with TypeScript, compiled via esbuild, styled with vanilla CSS, and deployed through GitHub Actions. No server, no framework, no SPA router. Each game is an isolated ES module that owns its DOM subtree. The entire build pipeline is a single ~50-line TypeScript script. The stack is deliberately minimal — 3 dev dependencies and 1 runtime dependency.

The single biggest risk to this project is **not shipping**. The developer's own context notes that sticking with things can be hard, and the research unanimously flags the "rewrite before deploy" pattern as the #1 project killer. The recommended approach inverts the instinct: deploy existing content first, then iterate visually and architecturally on a live site. Every phase should produce something visible at a public URL. Infrastructure exists to serve content, not to be content.

Remix 3's packages are largely inappropriate for this project. `fetch-router` is a server-side router (useless for static hosting), `component` is a Preact-fork component model (explicitly out of scope), and `html-template` is string-based HTML generation unsuited for reactive game UI. The sole exception is `html-template` for one-shot static shell rendering — and even that is trivially reimplementable. The project should start with zero Remix 3 packages and add them only when they solve a concrete problem. Pin all dependency versions exactly to avoid alpha churn breaking code between sessions.

## Key Findings

### Recommended Stack

The stack is intentionally boring and minimal. TypeScript provides type safety for game logic; esbuild compiles it to browser-ready JS in milliseconds; vanilla CSS with custom properties handles all styling; GitHub Pages hosts the static output for free.

**Core technologies:**
- **TypeScript 5.9+**: All source code — catches bugs, enables IDE support, compiles away
- **esbuild 0.25+**: Bundles game TS → single browser JS file per entry point — sub-second builds
- **tsx 4.21+**: Runs the build script directly — no pre-compilation needed for Node-side code
- **Vanilla CSS**: Nesting, custom properties, `:has()` — no preprocessor, no utility framework
- **GitHub Pages + Actions**: Free static hosting with CI/CD from git push

**Key exclusions (with rationale):**
- No `fetch-router` — server-side router, no server to run it on
- No `remix/component` — Preact-fork component model, explicitly rejected in favor of vanilla DOM
- No Vite/Webpack — overkill for static HTML + game bundles
- No Tailwind — unnecessary build step and dependency for a small site
- No Canvas — DOM is correct for UI-heavy word puzzles with <50 elements

### Expected Features

**Must have (table stakes) — v1 launch:**
- Responsive layout (mobile-first, games adapt to viewport)
- Fast initial load (<200KB per page, <1.5s LCP on 3G)
- Working navigation (multi-page, URL-addressable)
- Semantic HTML + basic SEO + Open Graph meta tags
- Keyboard navigability with visible focus indicators
- Touch support via Pointer Events API (not HTML D&D)
- Game feedback states (toast/announcements, `aria-live` regions)
- Error/empty states (`<noscript>` fallback, error catch)
- Favicon (SVG + apple-touch-icon)
- Color contrast (WCAG 2.1 AA)

**Should have (differentiators) — v1.x:**
- View Transitions API for page navigation (progressive enhancement)
- Game score persistence via `localStorage`
- Wordle-style share results (clipboard text/emoji)
- Dark mode via `prefers-color-scheme`
- Reduced motion support via `prefers-reduced-motion`
- Personality micro-interactions (hover effects, subtle animation)

**Defer (v2+):**
- Service Worker / offline play
- PWA manifest
- Formalized "add new game" template (wait until second game reveals what's actually shared)
- Homepage project showcase redesign (wait until 3+ projects)

### Architecture Approach

File-based static architecture with a shared ES module shell. Each game is a self-contained module exporting an `init(container: HTMLElement)` function. Games never import from other games. The shell injects navigation into a known DOM slot. HTML files are hand-written (not generated) — at <10 pages, this is simpler than any templating system. State-driven rendering uses direct DOM manipulation with immutable state transitions — no virtual DOM, no reactive framework.

**Major components:**
1. **Site Shell** — Shared nav, layout chrome; injected by ES module on page load
2. **Game Registry** — Typed array of game metadata; feeds nav and homepage
3. **Game Modules** — Self-contained per-game: own state, rendering, interaction, DOM subtree
4. **Shared Design System** — CSS custom properties for colors, spacing, typography
5. **Build Pipeline** — Single TypeScript script: compile TS via esbuild, copy static assets to `dist/`

### Critical Pitfalls

1. **`fetch-router` is server-side only** — Use multi-page file-based architecture instead. GitHub Pages serves `directory/index.html` natively. No router needed.
2. **Browsers can't run TypeScript** — Accept a minimal esbuild build step from day one. The "religiously runtime" Remix 3 principle applies to server runtimes, not browsers.
3. **Rewriting before shipping kills projects** — Deploy existing Super Word prototype as-is in Phase 1. Iterate on a live site. Nothing gets rewritten that isn't deployed first.
4. **Over-engineering for 3 pages** — Infrastructure-to-content ratio must stay below 1:3. "Easy to add a game" = copy a folder and edit a list, not configure a router and register middleware.
5. **Remix 3 alpha churn** — All packages are 0.x with frequent breaking changes. Pin exact versions. Minimize dependency surface. Have a vanilla fallback plan.
6. **GitHub Pages base path breaks URLs** — Use relative paths everywhere (`./style.css`, not `/style.css`). Test on actual deployment URL in Phase 1. Or use a custom domain.

## Implications for Roadmap

### Phase 1: Project Foundation & Deploy

**Rationale:** Get something live immediately. Establish the build pipeline, deploy skeleton to GitHub Pages. Proves the architecture works and creates the motivational anchor of a public URL. Addresses Pitfall 3 (ship before rewrite) and Pitfall 6 (catch base path issues early).

**Delivers:** Working build pipeline (esbuild + tsx), GitHub Pages deployment via Actions, project skeleton with shared CSS design tokens, site shell with nav, homepage placeholder, `.nojekyll` file, relative path strategy verified on live URL.

**Features addressed:** Fast initial load, working navigation, semantic HTML, favicon, error states.

**Pitfalls avoided:** Base path 404s (Pitfall 6), TypeScript build step (Pitfall 2), over-engineering (Pitfall 4).

### Phase 2: Super Word Game (Rewrite)

**Rationale:** The core content. Rewrite the existing AI prototype into typed, modular TypeScript using the architecture patterns (self-contained ES module, state-driven rendering, declarative puzzle data). This is the highest-value phase — it's the actual product.

**Delivers:** Fully playable Super Word game with 5 puzzles, Pointer Events for mouse + touch, keyboard-first interaction model alongside drag-and-drop, `aria-live` announcements, responsive game layout.

**Features addressed:** Touch support, keyboard navigability, game feedback states, responsive layout within games.

**Pitfalls avoided:** HTML D&D inaccessible (Pitfall 7), mobile touch broken (Pitfall 8), `html-template` misuse for reactive UI (Pitfall 10), Canvas premature optimization (Pitfall 14).

### Phase 3: Homepage & Visual Design

**Rationale:** With the game working and deployed, apply visual polish. Constrain design choices (system fonts, one accent color, base spacing) to avoid design paralysis. Build the game grid/cards on the homepage.

**Delivers:** Styled homepage with project grid, polished typography and spacing, color contrast verification (WCAG AA), SEO meta + Open Graph tags per page.

**Features addressed:** SEO + OG tags, color contrast, homepage project showcase (simple version).

**Pitfalls avoided:** Design paralysis (Pitfall 11) — time-box to 2 hours of visual design per phase.

### Phase 4: Accessibility & Responsive Audit

**Rationale:** Dedicated pass to verify keyboard navigation, screen reader experience, touch targets, and responsive breakpoints across the full site. Better as a focused audit than scattered across phases.

**Delivers:** Full keyboard navigation verified, `aria-live` regions verified, touch targets ≥44px, responsive layout tested on real devices, reduced motion support (`prefers-reduced-motion`).

**Features addressed:** Keyboard navigability (audit), touch support (audit), reduced motion support, color contrast (audit).

### Phase 5: Polish & Delight

**Rationale:** Now that function is solid, add the personality. View Transitions, micro-interactions, dark mode, localStorage persistence, share results. These are the "oh, this is nice" features.

**Delivers:** View Transitions between pages, dark mode, localStorage game save, share-your-score button, subtle hover effects and animation polish.

**Features addressed:** View Transitions, dark mode, game score persistence, Wordle-style share, personality micro-interactions, per-game loading states.

### Phase Ordering Rationale

- **Deploy first (Phase 1)** because the #1 risk is not shipping. A live URL creates accountability and motivation.
- **Game before design (Phase 2 before 3)** because the game IS the content. A beautiful homepage with no game is empty; an ugly homepage with a working game has value.
- **Accessibility as focused audit (Phase 4)** because sprinkling it across phases leads to gaps. A dedicated pass catches what was missed.
- **Polish last (Phase 5)** because delight features are progressive enhancement over working, accessible foundations. View Transitions and dark mode don't matter if the game doesn't work on mobile.
- **Feature dependencies respected:** Touch support (Phase 2) requires responsive layout (Phase 1). View Transitions (Phase 5) require working navigation (Phase 1). Dark mode (Phase 5) requires CSS custom properties (Phase 1). Share results (Phase 5) requires game state (Phase 2).

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Super Word):** Pointer Events drag-and-drop implementation is nuanced — needs specific research on `pointerdown`/`pointermove`/`pointerup` patterns, `touch-action: none`, and how to handle both click-to-collect (keyboard/simple) and drag-to-collect (pointer) in one interaction model.
- **Phase 5 (View Transitions):** MPA cross-document View Transitions are newer (`@view-transition` CSS at-rule). Browser support is good but the API may have edge cases worth researching.

**Phases with standard patterns (skip research):**
- **Phase 1 (Foundation):** esbuild + GitHub Actions + static site deployment is thoroughly documented. Standard patterns.
- **Phase 3 (Homepage & Design):** CSS Grid card layout, OG meta tags, system font stacks — all well-established.
- **Phase 4 (Accessibility Audit):** WCAG 2.1 AA criteria are well-documented. Testing methodology is standard.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via official sources. esbuild, TypeScript, vanilla CSS are proven at this scale. Remix 3 exclusion rationale is solid — verified from source code. |
| Features | HIGH | Feature landscape well-mapped. MVP scope is realistic. Anti-features clearly justified. Competitor analysis provides useful context. |
| Architecture | HIGH | File-based static architecture is the established pattern for this exact use case. Component boundaries are clean. Build order dependencies are clear. |
| Pitfalls | HIGH | Critical pitfalls (fetch-router, TypeScript in browser, rewrite trap) are verified and high-impact. Prevention strategies are concrete. |

**Overall confidence:** HIGH

### Gaps to Address

- **Emoji cross-platform rendering:** Acknowledged but not deeply researched. Accept visual differences across platforms; don't block on it. Test on Windows + iOS minimum during Phase 2.
- **Remix 3 `html-template` value prop:** Research says "maybe useful for shell rendering." During Phase 1 planning, make a binary decision: use it for shell injection or skip it entirely. Don't waffle.
- **Custom domain vs. repo subdirectory:** Using a custom domain eliminates the base path problem entirely. Decide before Phase 1 — it changes the relative path strategy.
- **Game data format for Super Word:** The existing prototype has hardcoded puzzle data inline. Phase 2 planning should research whether puzzles should be JSON files, TypeScript const arrays, or a different format. Minor decision but affects the "add puzzles easily" developer UX.

## Sources

### Primary (HIGH confidence)
- Remix 3 monorepo source code and README — package APIs, architecture principles
- Remix 3 `fetch-router` npm docs (v0.18.0) — server-side routing API verification
- Remix 3 `html-template` npm docs — string-based HTML generation, auto-escaping behavior
- GitHub Pages documentation — static hosting behavior, base path, deployment methods
- MDN: View Transition API — browser support (Chrome 111+, Edge 111+, Firefox 144+, Safari 18+)
- MDN: Making PWAs installable — service worker, manifest requirements
- WCAG 2.1 SC 2.1.1 Keyboard — accessibility requirements
- ES modules in browsers — web platform standard

### Secondary (MEDIUM confidence)
- View Transitions API MPA support — based on known 2025-2026 browser shipping status, not re-verified today
- `remix/component` capabilities — less explored, deferred to v2+ anyway

### Tertiary (LOW confidence)
- Emoji rendering cross-platform behavior — known issue, not deeply researched for specific game layout impact

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
