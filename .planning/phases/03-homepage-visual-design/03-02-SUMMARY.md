---
phase: 03-homepage-visual-design
plan: 02
subsystem: ui
tags: [typescript, theme-toggle, game-registry, 404-page]

requires:
  - phase: 03-homepage-visual-design/plan-01
    provides: CSS classes for theme toggle, game cards, 404 page, dark mode tokens
provides:
  - Theme toggle button in footer (all pages)
  - Dynamic homepage card rendering from game-registry
  - Playful 404 page with floating digits and random tagline
  - 404.ts build entry point
affects: []

tech-stack:
  added: []
  patterns: [JS-generated toggle for progressive enhancement, single source of truth via game-registry]

key-files:
  created:
    - public/404.html
    - src/pages/404.ts
  modified:
    - src/shared/shell.ts
    - src/pages/home.ts
    - build.ts

key-decisions:
  - "Theme toggle is JS-generated so it doesn't appear without JS — CSS media query handles dark mode natively"
  - "Homepage cards rendered dynamically from game-registry.ts — single source of truth for game metadata"
  - "404.ts uses simple random tagline selection — graceful degradation if JS fails (empty tagline)"

patterns-established:
  - "Theme toggle pattern: read localStorage + matchMedia, toggle data-theme attribute, persist to localStorage"
  - "Dynamic card rendering: import games array, clear section, create DOM elements per entry"

requirements-completed: [SITE-07, LOOK-04, LOOK-06]

duration: 3min
completed: 2026-03-28
---

# Plan 03-02: Theme Toggle + Dynamic Cards + 404 Page Summary

**Theme toggle, registry-driven game cards, and playful 404 page complete all interactive features for the homepage visual design.**

## What was built

- Theme toggle button appended to footer by shell.ts on all pages — reads current theme from localStorage/matchMedia, toggles between light/dark, persists preference
- home.ts now imports game-registry and dynamically renders game cards into the `#games` section, replacing the static HTML fallback
- 404.html with three floating digit spans (staggered animation delays), tagline placeholder, and link back to homepage
- 404.ts picks a random tagline from 4 options on page load
- build.ts updated with `src/pages/404.ts` entry point — esbuild compiles to `dist/pages/404.js`

## Self-Check: PASSED
