# Roadmap: Peninsular Reveries

## Overview

Ship a live personal site fast, then fill it with a polished game and visual personality. Phase 1 gets a skeleton deployed to GitHub Pages — a public URL creates accountability and momentum. Phase 2 delivers the actual product (Super Word game, fully accessible). Phases 3–5 layer on visual design, game polish, and progressive enhancements. Every phase produces visible progress at the live URL. The #1 risk is not shipping — the structure fights that by deploying first and iterating on a live site.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Deploy** - Build pipeline, site skeleton, and live GitHub Pages deployment
 (completed 2026-03-28)
- [ ] **Phase 2: Super Word Game** - Full TypeScript rewrite of the word puzzle game with accessibility baked in
- [ ] **Phase 3: Homepage & Visual Design** - Styled homepage with project cards, dark mode, OG tags, and personality touches
- [ ] **Phase 4: Game Polish & Persistence** - Score saving, share results, loading states, and motion preferences
- [ ] **Phase 5: Progressive Enhancement & Performance** - View Transitions, analytics, and performance budget enforcement

## Phase Details

### Phase 1: Foundation & Deploy
**Goal**: A working site skeleton is live at a public GitHub Pages URL with automatic deployment
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, SITE-01, SITE-02, SITE-03, SITE-05, SITE-06
**Success Criteria** (what must be TRUE):
  1. Site is live at a public GitHub Pages URL and renders without errors
  2. Pushing to main automatically builds TypeScript via esbuild and deploys to GitHub Pages
  3. User can navigate between homepage and game page via links; back button works; all pages are URL-addressable
  4. Pages have semantic HTML, responsive layout across phone/tablet/desktop, and show a noscript fallback when JS is unavailable
  5. Site has an SVG favicon visible in the browser tab
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Build infrastructure (package.json, tsconfig, esbuild build script, GitHub Actions deployment)
- [x] 01-02-PLAN.md — Site skeleton (CSS design system, HTML pages, TypeScript nav modules, SVG favicon)

**UI hint**: yes

### Phase 2: Super Word Game
**Goal**: Users can play a fully accessible, polished word puzzle game on the live site
**Depends on**: Phase 1
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05
**Success Criteria** (what must be TRUE):
  1. User can play all 5 Super Word puzzles from start to finish on the live site
  2. All interactive game elements are navigable via keyboard with visible focus indicators and keyboard alternatives to drag-and-drop
  3. User can play the game on a touchscreen device with 44px+ touch targets via Pointer Events
  4. Game provides visual and text feedback for every state change (correct letter, wrong item, hint, level complete, win) with aria-live announcements
  5. All game text meets WCAG 2.1 AA color contrast ratios (4.5:1 normal, 3:1 large)
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Game foundation: types, puzzle data, state management, HTML page, game CSS, build integration
- [x] 02-02-PLAN.md — Game rendering & input: DOM renderer, Pointer Events + keyboard navigation
- [x] 02-03-PLAN.md — Accessibility, animations & wiring: aria-live announcements, CSS animations, main entry point

**UI hint**: yes

### Phase 3: Homepage & Visual Design
**Goal**: The site looks intentional and has visual personality — not just functional
**Depends on**: Phase 2
**Requirements**: SITE-04, SITE-07, LOOK-04, LOOK-06
**Success Criteria** (what must be TRUE):
  1. Homepage displays each project as a visual card with name, one-line description, and preview image/icon
  2. Sharing any page URL on social media renders a rich preview card (title, description, image)
  3. Site switches between light and dark themes based on OS preference via CSS custom properties
  4. Site has personality micro-interactions — hover effects, subtle animations, and a playful 404 page
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Visual design system: dark mode CSS, card hover, link transitions, OG meta tags
- [x] 03-02-PLAN.md — Interactivity: theme toggle, dynamic cards from registry, playful 404 page
- [x] 03-03-PLAN.md — Gap closure: card emoji icon + OG image for social previews

**UI hint**: yes

### Phase 4: Game Polish & Persistence
**Goal**: The game experience is delightful to complete and share with others
**Depends on**: Phase 2
**Requirements**: LOOK-02, LOOK-03, LOOK-05, LOOK-07
**Success Criteria** (what must be TRUE):
  1. Game progress and scores persist in localStorage across browser sessions
  2. After completing the game, user can tap "share results" to copy an emoji score summary to clipboard
  3. All site animations respect prefers-reduced-motion — toned down or skipped entirely
  4. Games show a branded/fun loading indicator while assets initialize
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Scene transitions (horizontal pan), letter fly-to-notepad animation, notepad theming
- [x] 04-02-PLAN.md — Share results (emoji clipboard copy, encoded URL), comprehensive reduced motion

**UI hint**: yes

### Phase 5: Progressive Enhancement & Performance
**Goal**: The site is measurably fast, has smooth transitions, and performance is enforced via build-step and CI checks
**Depends on**: Phase 3, Phase 4
**Requirements**: LOOK-01, LOOK-08, INFRA-03
**Success Criteria** (what must be TRUE):
  1. Page navigation uses View Transitions API for smooth animation in supporting browsers; degrades gracefully in others
  2. Site includes privacy-respecting, cookie-free analytics tracking page views
  3. Every page loads under 200KB total weight with LCP under 1.5s on simulated 3G
**Plans:** 1 plan

Plans:
- [x] 05-01-PLAN.md — View Transitions CSS, build-step size assertion, Lighthouse CI pipeline

**UI hint**: no
**Note**: LOOK-08 (analytics) descoped from v1 per discuss-phase decision D-05

### Phase 6: Automated Test Harness & Phase 1 Verification
**Goal**: Add Playwright test infrastructure with a local dev server, write automated tests that verify all Phase 1 requirements, fix stale REQUIREMENTS.md checkboxes, and prevent this class of verification gap from recurring
**Depends on**: Phase 5
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-05, SITE-06, INFRA-01, INFRA-02
**Gap Closure**: Closes 7 partial requirements from v1.0 milestone audit (all Phase 1 verification gaps) + 11 stale REQUIREMENTS.md checkboxes
**Success Criteria** (what must be TRUE):
  1. `npm test` runs Playwright tests against a local server serving `dist/` and exits 0
  2. Automated tests verify responsive layout renders without errors at phone/tablet/desktop viewports (SITE-01)
  3. Automated tests verify navigation between pages, back button, and URL-addressability (SITE-02)
  4. Automated tests verify semantic HTML structure — main, nav, heading hierarchy, meta description (SITE-03)
  5. Automated tests verify SVG favicon link element exists and resolves (SITE-05)
  6. Automated tests verify noscript fallback content renders with JS disabled (SITE-06)
  7. Automated tests verify `npx tsx build.ts` exits 0 and produces expected output files (INFRA-01)
  8. All REQUIREMENTS.md checkboxes match actual verification status
**Plans:** 2 plans

Plans:
- [ ] 06-01-PLAN.md — Playwright infrastructure + SITE-01, SITE-02, SITE-03 tests
- [ ] 06-02-PLAN.md — SITE-05, SITE-06, INFRA-01, INFRA-02 tests + CI gate + REQUIREMENTS.md fix

**UI hint**: no

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6
(Phases 3 and 4 could run in parallel — both depend on Phase 2, not each other)

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation & Deploy | 2/2 | Complete   | 2026-03-28 |
| 2. Super Word Game | 0/3 | Planned | - |
| 3. Homepage & Visual Design | 0/2 | Planned | - |
| 4. Game Polish & Persistence | 0/? | Not started | - |
| 5. Progressive Enhancement & Performance | 0/? | Not started | - |
| 6. Test Harness & Phase 1 Verification | 0/? | Not started | - |
