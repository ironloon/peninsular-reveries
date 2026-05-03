# Field Review #2: Super Word UX Polish

**Date:** 2026-04-07
**Device:** iPhone 17 (user), desktop Playwright (agent)
**Deployment:** `829cf0a` confirmed via sw.js CACHE_NAME
**Prior lineage:** `2026-04-07-field-review-super-word.md`, `2026-04-06-game-polish-canvas-modal-audio.md`

## Findings

### 1. Music doesn't auto-start on game begin
- **Category:** Bug — **Severity:** high
- **Root cause:** `onStartGame()` in `main.ts` called `ensureAudioUnlocked()` but never `syncMusicPlayback()`, so music stayed silent until the user toggled the setting
- **Fix:** Added `syncMusicPlayback()` call after `ensureAudioUnlocked()` in `onStartGame()`

### 2. "Difficulty" section title unclear
- **Category:** UX issue — **Severity:** medium
- **Fix:** Renamed to "Level" throughout (TSX heading, label, E2E test assertion)

### 3. Emoji in section titles (🎵 Audio, 📚 Difficulty, 🎮 Controls)
- **Category:** UX issue — **Severity:** low
- **Fix:** Removed all emoji from settings section headings — cleaner, better screen reader experience

### 4. Inspiration text on start screen
- **Category:** UX issue — **Severity:** low
- **Evidence:** `<p className="inspiration">` with "Inspired by Super Why!" was prominent but not useful for gameplay
- **Fix:** Removed from start screen

### 5. Menu button on start screen unstyled
- **Category:** UX issue — **Severity:** medium
- **Evidence:** Used `settings-toggle-btn` class, which rendered like an in-game HUD button rather than a cohesive start-screen element
- **Fix:** Changed to `btn btn-secondary` class; created `.btn-secondary` CSS (translucent bg, white border, subtle shadow)

### 6. settings-select class not styled
- **Category:** Bug — **Severity:** medium
- **Evidence:** `className="settings-select"` had no CSS rule; `.puzzle-select` at game.css:333 was the intended rule
- **Fix:** Changed class to `puzzle-select` in TSX

### 7. Info link doesn't anchor to Super Word section
- **Category:** UX issue — **Severity:** low
- **Fix:** Added `#super-word` anchor hash to `infoPagePath`

### 8. Modal always opens to last-viewed tab
- **Category:** UX issue — **Severity:** medium
- **Fix:** `modal.open()` now calls `activateTab(tabBtns[0])` to reset to Settings tab on every open

### 9. Restart/Quit buttons unstyled
- **Category:** UX issue — **Severity:** medium
- **Fix:** Added full CSS for `.settings-restart-btn` and `.settings-quit-link` (min-height 44px, border-radius, hover states, focus-visible outlines)

### 10. Controls grid doesn't collapse on narrow viewports
- **Category:** UX issue — **Severity:** low
- **Fix:** Added `@media (max-width: 400px) { .controls-grid { grid-template-columns: 1fr; } }`

### 11. Header right section lacks gap
- **Category:** UX issue — **Severity:** low
- **Fix:** Added `gap: 0.25rem` to `.game-header-right`

### 12. Canvas emoji invisible on iOS (prior fix)
- **Category:** Bug — **Severity:** blocker
- **Status:** Already fixed in `829cf0a` (EMOJI_FONT constant) — confirmed deployed

### 13. Letter overcounting (prior fix)
- **Category:** Bug — **Severity:** high
- **Status:** Already fixed in `829cf0a` (guard in onLetterCollected) — confirmed deployed

### 14. Contrast audit
- **Category:** Audit — **Severity:** pass
- **Result:** All text/bg combinations meet WCAG AA (white on purple ≥6.7:1, yellow on purple-dark ≥7.3:1)

## Files Modified
- `client/super-word/main.ts` — syncMusicPlayback call
- `app/controllers/super-word.tsx` — section titles, button classes, info link, inspiration removal
- `client/modal.ts` — tab reset on open
- `public/styles/game.css` — btn-secondary, Restart/Quit buttons, controls-grid collapse, header gap
- `e2e/site-04-accessibility.spec.ts` — Difficulty→Level assertion
- `.github/skills/critique/SKILL.md` — user-invocable frontmatter
- `.github/skills/compose/SKILL.md` — user-invocable frontmatter
- `.github/skills/wayback/SKILL.md` — agent-only frontmatter
- `.github/agents/Orchestrator.agent.md` — ironloon URLs, gh run list
- `app/site-config.test.ts` — ironloon URLs

## Process Observations
- The critique skill's FR Phase 4 workflow is sound — severity-ordered fixes with test-after-each works well
- Terminal cannot handle interactive passphrase prompts — SSH key operations should always advise the user to run `ssh-add` manually before agent work begins
- PowerShell UTF-8 encoding should be set at session start to avoid mojibake in commit messages with Unicode