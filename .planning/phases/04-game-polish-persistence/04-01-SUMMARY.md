---
phase: 04-game-polish-persistence
plan: 01
subsystem: ui
tags: [css-animations, scene-transitions, vanilla-typescript]

requires:
  - phase: 02-super-word-game
    provides: game screen system, scene rendering, letter collection flow
provides:
  - Horizontal camera-pan scene transitions (CSS translateX-based)
  - Fly-to-notepad letter collection animation (clone + CSS keyframes)
  - Notepad-themed collection area with "Super Letters" label
  - Scene-track HTML wrapper for position-based screen system
  - Parallax pseudo-element on scene-wrapper
affects: [04-02-share-reduced-motion]

tech-stack:
  added: []
  patterns: [position-based screen system with translateX transitions, CSS custom property driven keyframe animations, flying clone pattern for cross-element animation]

key-files:
  created: []
  modified:
    - public/super-word/index.html
    - public/super-word/game.css
    - src/super-word/renderer.ts
    - src/super-word/animations.ts
    - src/super-word/main.ts

key-decisions:
  - "Replaced display:none/flex screen system with position:absolute + translateX + visibility for pan transitions"
  - "Flying letter clone uses CSS custom properties for keyframe endpoints rather than JS-computed inline styles"
  - "animateCollectPop kept as fallback; animateFlyToNotepad is primary collection animation"
  - "showScreen uses transitionend + 600ms timeout fallback for cleanup reliability"

patterns-established:
  - "Scene-track wrapper: screens positioned absolutely, active/leaving CSS classes drive translateX transitions"
  - "Flying clone pattern: getBoundingClientRect both endpoints, CSS custom properties for keyframe, cleanup on animationend + timeout"

requirements-completed: [LOOK-02, LOOK-07]

duration: 8min
completed: 2026-03-28
---

# Plan 04-01: Scene Transitions & Letter Collection Animations

**Super Why-inspired horizontal camera-pan between screens and fly-to-notepad letter collection replace the previous opacity-fade transitions.**

## What Changed

1. **HTML**: Wrapped all `.screen` divs in a `.scene-track` container. Added `.notepad` class and "Super Letters" label to collection area.

2. **CSS**: Replaced `display:none`/`opacity` screen system with `position:absolute` + `translateX` + `visibility`. Added `.leaving` class for outgoing screens, `.scene-transitioning` for parallax, `@keyframes flyToNotepad` for letter flight, `.flying-letter` positioning, and `.notepad` border theming.

3. **TypeScript**: Rewrote `showScreen()` to manage pan transitions with proper cleanup. Added `animateFlyToNotepad()` that creates a fixed-position clone flying from scene item to notepad slot. Wired `onLetterCollected` to use fly-to-notepad as primary animation with collectPop as fallback.

## Self-Check: PASSED
- [x] scene-track wrapper in HTML
- [x] notepad class and "Super Letters" label
- [x] CSS pan transition system (active/leaving with translateX)
- [x] flyToNotepad keyframes and .flying-letter class
- [x] showScreen rewritten with pan transitions
- [x] animateFlyToNotepad exported from animations.ts
- [x] main.ts wired to use fly-to-notepad
- [x] TypeScript compiles clean
- [x] Build succeeds
