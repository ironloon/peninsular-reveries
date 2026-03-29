---
phase: 05-progressive-enhancement-performance
plan: 01
subsystem: ui, infra
tags: view-transitions, lighthouse, performance-budget, css-animations

requires:
  - phase: 04-animation-share
    provides: "Completed game UI and site shell to apply View Transitions to"
provides:
  - "Cross-document View Transitions API for MPA navigation (CSS-only)"
  - "Element-level transition names for header and main content"
  - "Universal page-load fallback fade animation"
  - "Reduced motion override for all animations including View Transitions"
  - "200KB per-page build-time performance budget with hard failure gate"
  - "Lighthouse CI post-deploy audit with budget.json"
affects: []

tech-stack:
  added: [treosh/lighthouse-ci-action@v12]
  patterns: [progressive-enhancement, build-time-budget-assertion]

key-files:
  created: [budget.json]
  modified: [public/styles/main.css, build.ts, .github/workflows/deploy.yml]

key-decisions:
  - "MPA cross-document View Transitions via CSS @view-transition rule — no JavaScript needed"
  - "Element-level transition names (site-header, main-content) for independent animation"
  - "Fallback CSS fade for all browsers regardless of View Transitions support"
  - "200KB hard budget enforced at build time; Lighthouse CI is advisory only (continue-on-error)"
  - "Sourcemaps excluded from budget calculation"
  - "LOOK-08 (scroll-driven animations) intentionally descoped"

patterns-established:
  - "Progressive enhancement: CSS-only feature with graceful degradation"
  - "Build-time budget assertion: statSync per-page size check with non-zero exit on failure"

requirements-completed: [LOOK-01, LOOK-08, INFRA-03]

duration: 5min
completed: 2026-03-29
---

# Phase 05 Plan 01: View Transitions, Performance Budget, and Lighthouse CI

**Smooth cross-document page transitions, hard 200KB build budget, and Lighthouse CI audit pipeline — all pages well under budget (11-67KB).**

## Performance

- **Duration:** ~5 min
- **Tasks:** 2/2 completed
- **Files modified:** 4

## Accomplishments
- View Transitions API enables smooth cross-fade navigation in Chrome 126+/Edge 126+/Safari 18.2+ with zero JavaScript
- Element-level transition names give header and main content independent animation tracks
- All browsers get a subtle 0.2s page-load fade as universal polish
- `prefers-reduced-motion` disables View Transitions, fallback fade, and all existing animations
- Build script enforces 200KB per-page budget — fails CI if any page exceeds it
- Current page sizes: homepage 11.5KB, Super Word 66.9KB, 404 10.5KB (massive headroom)
- Lighthouse CI audits live site post-deploy with budget.json, results saved as artifacts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add View Transitions CSS and build size assertion** - `98a0d84` (feat)
2. **Task 2: Add Lighthouse CI to GitHub Actions pipeline** - `d1980e1` (feat)

## Files Created/Modified
- `public/styles/main.css` - Added @view-transition rule, element transition names, fallback fade keyframes, reduced motion overrides
- `build.ts` - Added statSync/join imports, 200KB per-page budget assertion with size report
- `budget.json` - New Lighthouse performance budget definition (document/stylesheet/script/total limits)
- `.github/workflows/deploy.yml` - Added lighthouse job with treosh/lighthouse-ci-action@v12, warn-only

## Decisions Made
- Used `@view-transition { navigation: auto; }` (CSS-only MPA approach) per research and D-01
- Set individual resource budgets generously above current sizes to catch regressions without false positives
- Lighthouse runs=1 sufficient for deterministic size checks
- 404 page excluded from Lighthouse audit (GitHub Pages 404 handling is non-standard)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All Phase 5 requirements complete. LOOK-08 (scroll-driven animations) explicitly descoped per D-05.
Project milestone v1.0 coverage is at final phase.

---
*Phase: 05-progressive-enhancement-performance*
*Completed: 2026-03-29*
