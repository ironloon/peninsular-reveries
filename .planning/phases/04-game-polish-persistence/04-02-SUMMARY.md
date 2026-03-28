---
phase: 04-game-polish-persistence
plan: 02
subsystem: ui
tags: [accessibility, reduced-motion, share, clipboard-api, vanilla-typescript]

requires:
  - phase: 04-game-polish-persistence
    plan: 01
    provides: scene pan transitions, fly-to-notepad animation, notepad theming
provides:
  - Share results button with emoji score summary and encoded share URL
  - Comprehensive prefers-reduced-motion: reduce support for all animations
  - isReducedMotion() helper for JS-side reduced motion detection
  - Per-puzzle hint tracking for accurate share text generation
affects: []

tech-stack:
  added: []
  patterns: [navigator.clipboard API with textarea fallback, per-puzzle hint tracking via module-level array, CSS-first reduced motion with JS fallback for animation-dependent logic]

key-files:
  created: []
  modified:
    - public/super-word/game.css
    - src/super-word/renderer.ts
    - src/super-word/animations.ts
    - src/super-word/main.ts

key-decisions:
  - "Per-puzzle hint tracking as module-level array (not in GameState) since it's a display concern"
  - "Share URL uses base64-encoded 'score,hintbits' format for compact encoding"
  - "Reduced motion: CSS handles animation disabling, JS skips animation calls and shows descriptive text toasts"
  - "Wow mode auto-disabled under reduced motion at initialization"
  - "Clipboard API with textarea fallback for browsers without clipboard support"

patterns-established:
  - "isReducedMotion() check before any animation call in main.ts, with descriptive toast alternatives"
  - "CSS @media (prefers-reduced-motion: reduce) block as comprehensive animation override"

requirements-completed: [LOOK-03, LOOK-05]

duration: 10min
completed: 2026-03-28
---

# Plan 04-02: Share Results & Reduced Motion

**Win screen now shows "Share Results 📋" button with emoji score summary, and all animations gracefully degrade under prefers-reduced-motion: reduce.**

## What Changed

1. **Share Results**: Win screen renders a share button that generates `Super Word 🔤 {score}/{max} ⭐⭐💡...` text with an encoded `?s=` share URL. Clipboard API copies with "Copied! ✓" green flash feedback. Textarea fallback for unsupported browsers. Per-puzzle hint tracking via `hintUsedPerPuzzle` array in main.ts.

2. **Reduced Motion CSS**: Comprehensive `@media (prefers-reduced-motion: reduce)` block disables all animations (collecting, shaking, appearing, wrong-shake, solved-pop, title-bounce, tile-pulse, flying-letter, confetti, parallax) and makes transitions instant.

3. **Reduced Motion JS**: `isReducedMotion()` helper in animations.ts. showScreen does instant cut. onLetterCollected skips fly animation. onDistractorClicked and onCheckAnswer skip shake animations, show descriptive text toasts instead. Wow mode auto-disabled at init.

## Self-Check: PASSED
- [x] Share button rendered with clipboard copy
- [x] Share text format matches spec
- [x] Encoded share URL with ?s= param
- [x] Copy success/failure feedback
- [x] Comprehensive reduced motion CSS block
- [x] isReducedMotion helper exported
- [x] JS reduced motion branches in all animation paths
- [x] Wow mode disabled under reduced motion
- [x] TypeScript compiles clean
- [x] Build succeeds
