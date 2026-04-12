# Plan: Project Cleanup & Consistency

## Project Context
- Sources:
  - `README.md` - source of truth for project principles and site values
  - `AGENTS.md` - workflow, validation, and environment expectations
  - `.agents/skills/gnd-chart/SKILL.md` - current plan structure used for archive preservation
  - `.agents/skills/gnd-critique/SKILL.md` - current critique and archive expectations
- Constraints:
  - This is a preserved historical plan archive migrated from repo memory into the current workspace archive.
  - Structural updates are limited to current gnd section names, leg identifiers, dependency references, and archive headings.
  - Preserve the original plan scope, implementation record, and critique content.
- Full validation:
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

Audit the project for dead code, unused exports, redundant config, and inconsistencies — then clean it all up. Started as a strict cleanup pass (dead exports, stale ESLint ignores, build test gaps, missing SW precaching), then expanded to include three consistency improvements the audit surfaced: automating CACHE_NAME versioning so developers never forget to bump it, simplifying attribution display in game menus by linking to the existing shared page instead of rendering entries inline, and normalizing menu button labels and overlay z-index across games while keeping per-game visual theming.

## Legs

### LEG-1: Planning Skill — Alignment & Workshop Improvements
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `.github/skills/planning/SKILL.md`
- Read-only: none
- Deferred shared edits: none
- Verification: Read back the modified file and confirm the two sections are updated.
- Intent:
  Two targeted edits to `.github/skills/planning/SKILL.md`:

  **(1) Replace Phase 2 — Alignment** (currently at line ~24, the paragraph starting "Confirm the goal with the user if anything is ambiguous"):

  New text:
  > Always run one alignment round after Discovery. Present a brief summary of what you found, then ask scope/approach questions via `vscode_askQuestions`. At minimum, surface: (a) what's in scope vs. out of scope, (b) any non-obvious tradeoffs or alternatives the research revealed, and (c) anything genuinely ambiguous. Do not ask about things you can infer from the code. One round maximum. Skip Alignment only when the task maps to a single, unambiguous MVT with no design choices.

  **(2) Replace the Workshop loop** (currently steps 1-6 under Phase 4):

  New text:
  > 1. Present MVTs one at a time. Group tightly coupled MVTs (e.g., two MVTs that depend on each other's outputs) and present them together at the planner's discretion.
  > 2. For each MVT (or group), show a **brief summary as regular Markdown in chat** — not inside the `vscode_askQuestions` tool:
  >    - Title and ID
  >    - 2–3 concise bullet points of key intent (what changes and why)
  >    - Owned files list
  >    - One alternative approach or tradeoff, if one exists. If the MVT is purely mechanical, state that.
  >    Keep the summary scannable — no prose paragraphs.
  > 3. After showing the summary, call `vscode_askQuestions`. Options: **Approve as-is** (recommended), one option per concrete alternative from the summary (e.g., "Alternative: [short label]"), and **Remove**. Do not add a "Request changes" option — freeform text input is always available. The question text should be a one-line MVT reference — all detail lives in the Markdown above.
  > 4. Apply feedback immediately (update that MVT's design) before moving to the next MVT.
  > 5. When approved, mark the MVT `Confirmed: yes` in the plan file.

  Do not change any other sections of the file.

### LEG-2: Chompers — Dead Exports & Reduced-Motion Consistency
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `client/chompers/animations.ts`
  - `client/chompers/renderer.ts`
- Read-only:
  - `client/preferences.ts` — reference for `isReducedMotionEnabled()` signature
  - `client/mission-orbit/animations.ts` — reference for how other games wrap `isReducedMotion()`
- Deferred shared edits: none
- Verification: `npx tsx --tsconfig config/tsconfig.json --test client/chompers/**/*.test.ts`
- Intent:
  (1) Delete `animateNpcDisappointed()` function (exported, zero callers).
  (2) Delete `pulseElement()` function and its `pulseTimeouts`/`pulseFrames` WeakMap declarations (marked "Legacy helper", zero callers — pixel-passport has its own independent version).
  (3) In `renderer.ts`, remove the `_scene` parameter from `renderNpcHippos()` signature. Update all call sites of `renderNpcHippos` within the same file (or in `main.ts` if called there) to drop that argument.
  (4) Rewrite `isReducedMotion()` to delegate to `isReducedMotionEnabled()` from `../preferences.js`, matching mission-orbit/pixel-passport/super-word pattern. Import `isReducedMotionEnabled` from `'../preferences.js'`.

### LEG-3: Super-Word — Dead Exports
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `client/super-word/animations.ts`
- Read-only: none
- Deferred shared edits: none
- Verification: `npx tsx --tsconfig config/tsconfig.json --test client/super-word/**/*.test.ts`
- Intent:
  (1) Delete `setWowMode()` function (exported, zero callers).
  (2) Delete `animateScenePan()` function (empty no-op placeholder, zero callers). If the CSS-driving explanation is useful context, leave a brief comment at the location but do not keep the exported function.

### LEG-4: Pixel-Passport — Dead Export
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `client/pixel-passport/destinations.ts`
- Read-only: none
- Deferred shared edits: none
- Verification: `npx tsx --tsconfig config/tsconfig.json --test client/pixel-passport/**/*.test.ts`
- Intent:
  Delete `getDestinationIndex()` function (exported, zero callers across codebase).

### LEG-5: ESLint Config — Stale Ignores
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `config/eslint.config.mjs`
- Read-only: none
- Deferred shared edits: none
- Verification: `npx eslint --config config/eslint.config.mjs .`
- Intent:
  (1) Remove `'gen-og-image.cjs'` from the ignores array — the file does not exist in the repo.
  (2) Remove `'super-word/**'` from the ignores array — no top-level `super-word/` directory exists; ESLint flat config resolves relative to config directory, so this pattern matches `config/super-word/**` which is empty. The actual game code at `client/super-word/` is already linted via the `files` globs.

### LEG-6: Build Test — Missing Game Assertions
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `config/build.test.ts`
- Read-only:
  - `config/build.test.ts` — existing super-word/pixel-passport assertions as the template pattern
- Deferred shared edits: none
- Verification: `npm run build && npx tsx --tsconfig config/tsconfig.json --test config/build.test.ts`
- Intent:
  Add mission-orbit and chompers build output assertions, following the existing pattern for super-word and pixel-passport:
  (1) Add file-existence checks: `mission-orbit/index.html`, `mission-orbit/manifest.json`, `mission-orbit/sw.js`, `styles/mission-orbit.css`, `client/mission-orbit/main.js`, `chompers/index.html`, `chompers/manifest.json`, `chompers/sw.js`, `styles/chompers.css`, `client/chompers/main.js`.
  (2) Add HTML content assertions for both game pages (read HTML, assert manifest link, assert service worker data attribute, assert no main.css link) — matching the existing super-word/pixel-passport pattern.

### LEG-7: Root Service Worker — Chompers Audio Precaching
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `public/sw.js`
- Read-only:
  - `public/sw.js` — existing mission-orbit audio entries as the template pattern
- Deferred shared edits: none
- Verification: Read back the file and confirm 5 new chompers audio URLs are in the ASSETS array and CACHE_NAME is bumped.
- Intent:
  (1) Add these 5 files to the precache ASSETS array, following the existing mission-orbit audio URL pattern: `chompers/audio/chomp-splash.ogg`, `chompers/audio/collect-pop.ogg`, `chompers/audio/hazard-snap.ogg`, `chompers/audio/miss-plop.ogg`, `chompers/audio/ui-tap.ogg`.
  (2) Also add `chompers/` page, `styles/chompers.css`, `client/chompers/main.js`, and `chompers/manifest.json` to ASSETS if not already present (matching mission-orbit's page/CSS/JS/manifest entries).
  (3) Skip manual CACHE_NAME bump — LEG-8 handles versioning at build time.

### LEG-8: Build-Time CACHE_NAME Automation
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: medium
- Owned files:
  - `build.ts`
- Read-only:
  - `public/sw.js` — reference current CACHE_NAME format
  - `public/chompers/sw.js` — reference current CACHE_NAME format
  - `public/mission-orbit/sw.js` — reference current CACHE_NAME format
  - `public/super-word/sw.js` — reference current CACHE_NAME format
  - `public/pixel-passport/sw.js` — reference current CACHE_NAME format
- Deferred shared edits: none
- Verification: `npx tsx --tsconfig config/tsconfig.json build.ts && grep -r "CACHE_NAME" dist/`
- Intent:
  After the existing `cpSync('public', outputDir, { recursive: true })` step, add a post-copy pass that rewrites `CACHE_NAME` in all 5 service worker files in the output directory.

  (1) Get the current git commit SHA via `execSync('git rev-parse --short HEAD')`.
  (2) For each sw.js file in dist/ (`sw.js`, `chompers/sw.js`, `mission-orbit/sw.js`, `super-word/sw.js`, `pixel-passport/sw.js`), read the file, regex-replace `const CACHE_NAME = '...'` with `const CACHE_NAME = '<prefix>-<sha>'` where prefix is the existing prefix (e.g. `site`, `chompers`, `mission-orbit`), and write back.
  (3) Extract the prefix from the existing CACHE_NAME value (everything before the last `-v` segment) to keep naming consistent.

  This makes manual CACHE_NAME bumping unnecessary. LEG-7 should skip step (3) since this leg handles versioning.

### LEG-9: Attribution Simplification — Link Out From Modals
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `app/controllers/chompers.tsx`
  - `app/controllers/mission-orbit.tsx`
  - `app/controllers/pixel-passport.tsx`
  - `app/controllers/super-word.tsx`
- Read-only:
  - `app/data/attributions/types.ts` — reference for `GameAttribution` shape
  - `app/data/attributions/index.ts` — reference for `attributionsPagePath`
- Deferred shared edits: none
- Verification: `npx tsx --tsconfig config/tsconfig.json build.ts`
- Intent:
  In each game controller, replace the inline attribution entry rendering in the Credits/License SettingsSection with a compact block:

  (1) Keep: code license line (`<p>Code license: {attribution.codeLicense}</p>`), summary line (`<p>{attribution.summary}</p>`).
  (2) Replace: all per-entry JSX (the `map()` over `attribution.entries`) with a single link: `<a href="{attributionsPagePath}#{attribution.slug}">View full credits</a>`.
  (3) Import `attributionsPagePath` from `../data/attributions/index.js` (it's already exported there) and compose the href using `withBasePath()`.
  (4) Remove any `<details>` disclosure wrappers, `.settings-attribution-card` containers, and per-entry rendering code.
  (5) Keep the `SettingsSection` wrapper with the existing title.

  The link target already exists — the shared attributions page at `/attributions/` renders per-game sections with id anchors matching each game's slug.

### LEG-10: Menu Label & Z-Index Consistency
- Status: done
- Confirmed: yes
- Depends on: LEG-9
- Thinking effort: low
- Owned files:
  - `public/styles/mission-orbit.css`
  - `public/styles/chompers.css`
  - `public/styles/pixel-passport.css`
  - `public/styles/game.css`
- Read-only:
  - `app/controllers/chompers.tsx` — reference existing "Menu" button pattern
  - `app/controllers/super-word.tsx` — reference existing "Menu" button pattern
- Deferred shared edits:
  - `app/controllers/mission-orbit.tsx` — rename all "Settings" button labels to "Menu"; also move any inline modal overlay `zIndex` to CSS if present
  - `app/controllers/chompers.tsx` — if overlay `zIndex` is inline (not in CSS), move it to CSS or adjust the inline value to 100
  - `app/controllers/pixel-passport.tsx` — if overlay `zIndex` is inline (not in CSS), move it to CSS or adjust the inline value to 100
  - `app/controllers/super-word.tsx` — if overlay `zIndex` is inline (not in CSS), move it to CSS or adjust the inline value to 100
- Verification: `npx tsx --tsconfig config/tsconfig.json build.ts`
- Intent:
  (1) In `app/controllers/mission-orbit.tsx`, rename all button labels from "Settings" to "Menu" (both the start screen button and any in-game button text). Keep the same id/class attributes.
  (2) In each game's CSS file, find the modal overlay z-index rule and normalize to `z-index: 100`. Currently: chompers=200, mission-orbit=100, pixel-passport=30, super-word=150. Check whether the z-index is set in CSS or inline in the controller JSX — in some games the overlay `zIndex` may be an inline style in the controller rather than CSS. Normalize wherever it's set.
  (3) Keep all overlay background colors, opacity, and blur as-is (game-themed, intentional).
  (4) Do NOT change button positioning or visual styling beyond the label text and z-index.

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

1. LEG-1 (Planning Skill) — no dependencies, do first so improved process is in place
2. LEG-2 (Chompers cleanup) — parallel with LEG-3, LEG-4, LEG-5, LEG-6, LEG-7
3. LEG-3 (Super-Word cleanup) — parallel with LEG-2, LEG-4, LEG-5, LEG-6, LEG-7
4. LEG-4 (Pixel-Passport cleanup) — parallel with LEG-2, LEG-3, LEG-5, LEG-6, LEG-7
5. LEG-5 (ESLint config) — parallel with LEG-2, LEG-3, LEG-4, LEG-6, LEG-7
6. LEG-6 (Build test) — parallel with LEG-2, LEG-3, LEG-4, LEG-5, LEG-7
7. LEG-7 (Root SW chompers) — parallel with LEG-2, LEG-3, LEG-4, LEG-5, LEG-6
8. LEG-8 (CACHE_NAME automation) — after LEG-7 (build.ts is a shared file, but this leg owns it; must run after LEG-7 so the SW has chompers entries before build-time versioning is added)
9. LEG-9 (Attribution simplification) — parallel with LEG-2 through LEG-8 (owns 4 controllers; no overlap with other legs)
10. LEG-10 (Menu consistency) — after LEG-9 (both touch mission-orbit controller; LEG-9 simplifies credits, LEG-10 renames button label)

After all complete: `pnpm test:local` → commit → push.

## Implementation
Commit: b73573e
Pushed: 2026-04-06

## Critique

Completed: 2026-04-06
Evaluated by: user + agent

### What Worked
- Dead-code removal (LEG-2/3/4) was surgical and correct — all 4 dead exports removed, zero collateral damage.
- CACHE_NAME automation (LEG-8) works in production — `site-33658aa` confirms build-time SHA stamping is live.
- Attribution simplification (LEG-9) landed cleanly in all 4 controllers, ~100 lines replaced with a single link.
- LEG parallelization was sensible — no file conflicts among LEG-2 through LEG-7.
- E2E tests were updated to match changed text (though the plan didn't account for them — see below).

### What Didn't
- E2E test files were missing from owned-file lists. LEG-9 changed credit text and LEG-10 renamed "Settings"→"Menu", both breaking E2E assertions in `e2e/site-04-accessibility.spec.ts` and `e2e/site-07-mission-orbit.spec.ts`. These files weren't in any leg's owned-files, forcing out-of-scope edits.
- LEG-10 listed 4 CSS files as owned but modified none — overlay z-index was inline in controller JSX, not in CSS. Owned-file list was inaccurate.
- LEG-1 exceeded its stated scope ("Two targeted edits… Do not change any other sections") by modifying Phase 5 Refinement, plan template, and Thinking effort sections. Navigator review should have caught this.

### Corrections for Next Cycle
- Planning skill: When a leg changes user-visible text, grep E2E specs for assertions on that text and include spec files in owned-file list. (Applied to `.github/skills/planning/SKILL.md`)
- Planning skill: During Draft/Workshop, grep proposed owned files to confirm target code lives there before finalizing. (Applied to `.github/skills/planning/SKILL.md`)
- Navigator: When post-dispatch review modifies files outside any leg's owned set, document what and why in a `## Boundary Notes` section. (Applied to `.github/agents/orchestrator.agent.md`)
- Navigator: Before committing, compare changed files against the union of all LEG owned-file lists. If external changes exist (user edits, out-of-scope fixes), ask the user whether to include or leave unstaged. (Applied to `.github/agents/orchestrator.agent.md`)