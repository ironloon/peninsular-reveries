# Field Review: Super Word

**Date:** 2026-04-07  
**Device:** iPhone 17 portrait  
**Deployment:** SHA `fb54bec` (confirmed via sw.js CACHE_NAME)

## Findings

### 1. Canvas emoji invisible on iOS Safari
- **Category:** Bug  
- **Severity:** Blocker  
- **Evidence:** `client/super-word/renderer.ts` used `ctx.font = '... serif'` for emoji rendering. iOS Safari canvas doesn't render emoji glyphs with generic `serif`.
- **Fix:** Added explicit `EMOJI_FONT` constant (`'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', serif`) and separate `LETTER_FONT` for letter overlays.

### 2. Letter count shows "18/4" - no collection guard
- **Category:** Bug  
- **Severity:** High  
- **Evidence:** `client/super-word/main.ts` `onLetterCollected` had no guard against exceeding answer length. Combined with invisible emoji (#1), blind tapping accumulated unlimited letters.
- **Fix:** Added `if (getState().collectedLetters.length >= currentPuzzle().answer.length) return` guard at top of `onLetterCollected`.

### 3. Redundant music toggles (3 controls)
- **Category:** UX issue  
- **Severity:** Medium  
- **Evidence:** Landing page toggle (`#start-music-toggle`), HUD toggle (`.music-toggle-btn-inline`), and settings modal toggle all controlled the same preference.
- **Fix:** Removed landing page and HUD toggles. Music is now controlled exclusively via the settings modal. Removed all standalone toggle JS from `main.ts`, HTML from `super-word.tsx`, and CSS from `game.css`.

### 4. Header text clipping at 390px wide
- **Category:** UX issue  
- **Severity:** High  
- **Evidence:** `.game-header-right` had `flex: 0 0 auto` which couldn't shrink. HUD music toggle competed for space with prompt bubble and letters count.
- **Fix:** Changed to `flex: 0 1 auto` with `overflow: hidden`. Added `word-break: break-word` to `.prompt-bubble`. Changed `.letters-count` to `flex-shrink: 1` with `white-space: nowrap`. Removing the HUD music toggle also freed significant space.

### 5. Info tab not visually scrollable on iOS
- **Category:** UX issue  
- **Severity:** Medium  
- **Evidence:** iOS hides scrollbars by default, giving no visual hint that the Info tab content extends beyond the visible area.
- **Fix:** Added CSS `mask-image` gradient fade at the bottom of `tabPanelStyles` in `app/ui/site-styles.ts` - `linear-gradient(to bottom, black calc(100% - 1.5rem), transparent 100%)`.

### 6. Info tab too verbose - should link to full page
- **Category:** UX issue  
- **Severity:** Medium  
- **Evidence:** Info tab contained full attribution content duplicating the dedicated `/attributions/` page.
- **Fix:** Trimmed to a brief "About Super Word" paragraph with a "More info, credits & attributions ->" link to the attributions page.

### 7. Restart/Quit button styling hierarchy
- **Category:** Design question  
- **Severity:** Low  
- **Disposition:** Deferred. Not implemented - flagged for future consideration.

### 8. iOS audio not playing
- **Category:** Design question  
- **Severity:** Low  
- **Disposition:** Deferred. May need on-device debugging. Web Audio API autoplay policies on iOS are strict; requires user gesture to resume AudioContext.

## E2E Test Updates

Two tests updated to reflect music toggle removal:
- `site-01-responsive.spec.ts`: Renamed test to "keeps menu controls inside a tablet landscape viewport", removed `.music-toggle-btn-inline` assertions.
- `site-04-accessibility.spec.ts`: Replaced `#start-music-toggle` visibility test with settings modal music toggle test ("settings music toggle is discoverable and controls audio preference").

## Validation

- 149/149 unit tests passed (15 suites)
- 73/73 e2e tests passed