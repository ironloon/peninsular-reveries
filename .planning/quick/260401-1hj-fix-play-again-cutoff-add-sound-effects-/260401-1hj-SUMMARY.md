# Quick Task 260401-1hj: Fix win screen cutoff, add sound effects, show gamepad button prompts

**Date:** 2026-04-01
**Commit:** 8920723

## Changes

### 1. Win Screen Layout Fix
- Changed `#win-screen` gap from `--game-space-lg` to `--game-space-md` and padding from `--game-space-xl` to `--game-space-lg`
- Added `justify-content: safe center` and `overflow-y: auto` to prevent Play Again button cutoff

### 2. Sound Effects (Web Audio API)
- Created `src/super-word/sounds.ts` — synthesized tones using Web Audio API (no external audio files)
- Effects: collect (ascending pop), distractor (low buzz), correct (happy arpeggio), wrong (descending wobble), win (triumphant fanfare), button click, tile swap
- All sounds are short, non-intrusive, volume ~10-15%

### 3. Gamepad Button Prompts
- Added fixed bottom bar showing contextual controller mappings when gamepad is detected
- Start/Win screen: "Start → Play"
- Game screen: "D-pad → Move, A → Pick, B → Check, LB/RB → Tiles, LT/RT → Swap"
- Celebration: "A → Continue, Start → Continue"
- Prompts auto-hide when mouse/keyboard input detected
- Visual style: semi-transparent backdrop with colored button icons matching Xbox controller

### 4. Bug Fix
- Fixed leftover `hintEmoji`/`hint` property references in puzzle creator suggestion chips (from earlier hint removal)

## Files Changed
- `src/super-word/sounds.ts` (new)
- `src/super-word/main.ts` (sound effect imports + calls)
- `src/super-word/input.ts` (gamepad prompt logic)
- `src/super-word/renderer.ts` (fix suggestion chip text)
- `public/super-word/index.html` (gamepad prompts container)
- `public/super-word/game.css` (win screen fix + gamepad prompt styles)
