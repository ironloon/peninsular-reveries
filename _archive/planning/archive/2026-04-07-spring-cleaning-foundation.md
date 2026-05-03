# Plan: Spring Cleaning & Foundation

## Project Context
- Sources:
  - `README.md` - source of truth for project principles and site values
  - `AGENTS.md` - workflow, validation, and environment expectations
  - `.agents/skills/gnd-chart/SKILL.md` - current plan structure used for archive preservation
  - `.agents/skills/gnd-critique/SKILL.md` - current critique and archive expectations
- Constraints:
  - This is a preserved historical plan archive migrated from repo memory into the current workspace archive.
  - Structural updates are limited to current gnd section names, leg identifiers, dependency references, and archive headings.
  - Preserve the original plan scope, implementation record, critique content, and boundary notes.
- Full validation:
  - `pnpm test:local`
- Delivery verification:
  - `local-only`

## User Intent

Modernize the project's dependency stack, test strategy, and workflow vocabulary in one coordinated pass. The user wants to: (1) finalize the musical vocabulary (WU → MVT) and multi-tier performer agents, (2) upgrade all dependencies including splitting the Remix umbrella into individual packages, (3) replace game-specific e2e tests with broader unit coverage, (4) add deploy verification (SHA on homepage), and (5) improve the critique skill's deploy-failure handling. The motivation is to keep the project on the cutting edge of its ecosystem while rationalizing what's tested and how.

## Legs

### LEG-1: WU → MVT Vocabulary Rename
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `.github/skills/compose/SKILL.md`
  - `.github/agents/Orchestrator.agent.md`
  - `.github/agents/Performer.agent.md`
  - `.github/skills/critique/SKILL.md`
  - `.github/skills/wayback/SKILL.md`
  - `copilot-instructions.md`
- Read-only: none
- Deferred shared edits: none
- Verification: `grep -r "work unit\|WU-\|WU " .github/ copilot-instructions.md --include="*.md" | grep -v "node_modules" | grep -v ".git/"` — should return zero matches (case-insensitive search for stale references).
- Intent:
  Rename all references to "WU" / "work unit" to "MVT" / "movement" across the six owned workflow files.

  **(1) `.github/skills/compose/SKILL.md`**: Replace every occurrence of "WU" with "MVT" and "work unit" with "movement". This includes: the description frontmatter, all prose references, the plan template (WU-1 → MVT-1, "Work Units" section header → "Movements", field definitions referencing WU IDs), the scoping guidelines ("How to draw WU boundaries" → "How to draw MVT boundaries"), and any `WU-N` patterns in examples. Preserve the existing structure and formatting — this is a vocabulary swap, not a rewrite.

  **(2) `.github/agents/Orchestrator.agent.md`**: Replace "work unit" / "WU" references in the description frontmatter and protocol steps. Update the plan template example section header. The sub-agent contract references to "work unit" become "movement".

  **(3) `.github/agents/Performer.agent.md`**: Replace "work unit" in the description frontmatter and the opening paragraph. "You receive a single work unit" → "You receive a single movement".

  **(4) `.github/skills/critique/SKILL.md`**: Replace "WU" / "work unit" references in the evaluation dimensions, analysis steps, and findings template. "For each WU" → "For each MVT", etc.

  **(5) `.github/skills/wayback/SKILL.md`**: Replace "WU" references. "WUs, dispatch order" → "MVTs, dispatch order".

  **(6) `copilot-instructions.md`**: Replace any remaining "WU" / "work unit" references.

  After all replacements, the verification grep must return zero matches. Also rename archived scores in memory: use `memory str_replace` on both `/memories/repo/plans/archive/2026-04-06-game-polish-canvas-modal-audio.md` and `/memories/repo/plans/archive/2026-04-06-project-cleanup-consistency.md` to replace section headers "## Work Units" → "## Movements" and "WU-" → "MVT-" throughout. These are memory files, not repo files — use the `memory` tool, not file editing tools.

### LEG-2: Multi-Tier Performer Agents
- Status: done
- Confirmed: yes
- Depends on: LEG-1
- Thinking effort: low
- Owned files:
  - `.github/agents/Understudy.agent.md` (new)
  - `.github/agents/Soloist.agent.md` (new)
  - `.github/agents/Orchestrator.agent.md`
  - `.github/skills/compose/SKILL.md`
- Read-only:
  - `.github/agents/Performer.agent.md` — reference for agent file structure
- Deferred shared edits: none
- Verification: Confirm all three agent files exist, Orchestrator lists all three in `agents:` frontmatter, and compose skill documents the thinking-effort-to-agent mapping.
- Intent:
  Create two new agent files and update Orchestrator dispatch logic to support three tiers based on `thinking_effort`.

  **(1) Create `.github/agents/Understudy.agent.md`:**
  ```yaml
  ---
  description: "Lightweight performer for mechanical, low-complexity movements: renames, config bumps, find-and-replace. Use for all dispatched movements with thinking_effort: low."
  model: "Claude Haiku 4.5"
  user-invocable: false
  agents: []
  ---
  ```
  Body: Identical to Performer.agent.md — same constraints, approach, and output format. The only difference is the model frontmatter.

  **(2) Create `.github/agents/Soloist.agent.md`:**
  ```yaml
  ---
  description: "High-capability performer for research, exploration, and complex movements requiring deep reasoning. Use for all dispatched movements with thinking_effort: high."
  model: "Claude Opus 4.6"
  user-invocable: false
  agents: []
  ---
  ```
  Body: Identical to Performer.agent.md.

  **(3) Update `.github/agents/Orchestrator.agent.md`:**
  - Change `agents: [Performer]` → `agents: [Understudy, Performer, Soloist]`
  - In step 5 (dispatch), replace the hard-coded `agentName: "Performer"` instruction with dispatch logic based on `thinking_effort`:
    - `low` → `agentName: "Understudy"`
    - `medium` → `agentName: "Performer"` (default)
    - `high` → `agentName: "Soloist"`
  - Keep the existing mandate that an agent name MUST be specified.

  **(4) Update `.github/skills/compose/SKILL.md`:**
  - In the `### Thinking effort` field definition, add a note documenting the agent mapping:
    > The orchestrator dispatches based on this field: `low` → Understudy (Haiku), `medium` → Performer (Sonnet), `high` → Soloist (Opus).

### LEG-3: Node 25 + @types/node
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `package.json`
  - `.github/workflows/deploy.yml`
- Read-only: none
- Deferred shared edits: none
- Verification: `node -e "console.log(process.version)"` to confirm local Node version; `grep -E "node.*25|NODE_VERSION.*25" package.json .github/workflows/deploy.yml` to confirm version strings.
- Intent:
  **(1) `package.json`:** Change `"engines": { "node": "24.14.1" }` → `"engines": { "node": ">=25.0.0" }`. Change `"@types/node": "24.12.2"` → `"@types/node": "25.5.2"` in devDependencies.

  **(2) `.github/workflows/deploy.yml`:** Change `NODE_VERSION: 24.14.1` → `NODE_VERSION: 25` (GitHub Actions resolves to latest 25.x).

  **(3)** Run `npm install` to regenerate package-lock.json with the new @types/node version.

  Do NOT run `npm run test:local` — that is the orchestrator's integration gate.

### LEG-4: Remix → Individual Packages
- Status: done
- Confirmed: yes
- Depends on: LEG-3
- Thinking effort: medium
- Owned files:
  - `server.ts`
  - `app/router.ts`
  - `app/routes.ts`
  - `app/controllers/attributions.tsx`
  - `app/controllers/chompers.tsx`
  - `app/controllers/home.tsx`
  - `app/controllers/mission-orbit.tsx`
  - `app/controllers/not-found.tsx`
  - `app/controllers/pixel-passport.tsx`
  - `app/controllers/super-word.tsx`
  - `app/ui/document.tsx`
  - `app/ui/game-card.tsx`
  - `app/ui/game-shell.tsx`
  - `app/ui/nav.tsx`
- Read-only: none
- Deferred shared edits:
  - `package.json` — Remove `"remix": "3.0.0-alpha.4"` from `dependencies`. Add to `devDependencies`: `"@remix-run/component": "0.6.0"`, `"@remix-run/fetch-router": "0.18.0"`, `"@remix-run/node-fetch-server": "0.13.0"`. Then run `npm install`.
- Verification: `npx tsc --noEmit -p config/tsconfig.json` — must pass with zero errors.
- Intent:
  Replace all imports from `remix/...` with imports from the corresponding `@remix-run/...` packages. The project uses exactly three sub-packages:

  **(1) `remix/component` → `@remix-run/component`:**
  - `import { css } from 'remix/component'` → `import { css } from '@remix-run/component'`
  - `import { css, type RemixNode } from 'remix/component'` → `import { css, type RemixNode } from '@remix-run/component'`
  - Files: `app/controllers/home.tsx`, `app/controllers/attributions.tsx`, `app/controllers/not-found.tsx`, `app/ui/document.tsx`, `app/ui/game-card.tsx`, `app/ui/game-shell.tsx`, `app/ui/nav.tsx`

  **(2) `remix/component/server` → `@remix-run/component/server`:**
  - `import { renderToString } from 'remix/component/server'` → `import { renderToString } from '@remix-run/component/server'`
  - Files: `app/controllers/chompers.tsx`, `app/controllers/mission-orbit.tsx`, `app/controllers/pixel-passport.tsx`, `app/controllers/super-word.tsx`
  - Some files import from both `remix/component` and `remix/component/server` — e.g. `app/controllers/home.tsx` imports `css` from `remix/component` AND `renderToString` from `remix/component/server` (check each file). Update accordingly.

  **(3) `remix/fetch-router` → `@remix-run/fetch-router`:**
  - `import { createRouter } from 'remix/fetch-router'` → `import { createRouter } from '@remix-run/fetch-router'`
  - File: `app/router.ts`

  **(4) `remix/fetch-router/routes` → `@remix-run/fetch-router/routes`:**
  - `import { route } from 'remix/fetch-router/routes'` → `import { route } from '@remix-run/fetch-router/routes'`
  - File: `app/routes.ts`

  **(5) `remix/node-fetch-server` → `@remix-run/node-fetch-server`:**
  - `import { createRequestListener } from 'remix/node-fetch-server'` → `import { createRequestListener } from '@remix-run/node-fetch-server'`
  - File: `server.ts`

  Read each owned file first to confirm the exact import statements, then apply replacements. The package.json change is a deferred shared edit — do not modify package.json yourself.

### LEG-5: ESLint 10 + @eslint/js 10
- Status: done
- Confirmed: yes
- Depends on: LEG-3
- Thinking effort: medium
- Owned files:
  - `config/eslint.config.mjs`
- Read-only:
  - `package.json` — check current eslint, @eslint/js, and typescript-eslint versions
- Deferred shared edits:
  - `package.json` — Change `"eslint": "9.39.4"` → `"eslint": "10.1.0"`, `"@eslint/js": "9.39.4"` → `"@eslint/js": "10.0.1"`. Check if `typescript-eslint` 8.58.0 is compatible with ESLint 10 — if not, bump it too. Then run `npm install`.
- Verification: `npx eslint --config config/eslint.config.mjs .` — must pass with zero errors.
- Intent:
  **(1)** Read `config/eslint.config.mjs` to understand the current flat config structure.

  **(2)** Check ESLint 10 migration notes — ESLint 10 may change default behaviors or deprecate config options. The flat config format should be stable, but verify:
  - `@eslint/js` 10 compatibility with `eslint` 10
  - `typescript-eslint` compatibility (check if 8.58.0 supports eslint 10 — if not, report the needed version bump as an additional deferred edit)
  - `eslint-plugin-jsx-a11y` 6.10.2 compatibility
  - `globals` 17.4.0 compatibility

  **(3)** If the eslint config file needs any changes to work with ESLint 10 (e.g., renamed options, removed defaults), apply them. If no config changes are needed, report that in the output.

  **(4)** Run the verification command and fix any new lint errors in source files. If lint fixes are needed in files outside the owned set, report them as deferred edits.

### LEG-6: esbuild + Playwright Bumps
- Status: done
- Confirmed: yes
- Depends on: LEG-3
- Thinking effort: low
- Owned files:
  - `config/playwright.config.ts`
- Read-only:
  - `package.json` — check current versions
- Deferred shared edits:
  - `package.json` — Change `"esbuild": "0.25.12"` → `"esbuild": "0.28.0"`, `"@playwright/test": "1.58.2"` → `"@playwright/test": "1.59.1"`. Then run `npm install`.
- Verification: `npx tsc --noEmit -p config/tsconfig.json` — must pass (confirms no breaking type changes in esbuild or playwright).
- Intent:
  **(1)** Read `config/playwright.config.ts` to check if any config options need updating for Playwright 1.59.1.

  **(2)** If the config file needs changes (e.g., new required options, deprecated options), apply them. If no changes are needed, report that.

  **(3)** Note: `npx playwright install` will need to be run to update browser binaries, but this is a CI/local concern — the orchestrator handles it during integration.

### LEG-7: Drop Game-Specific E2E Tests
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `e2e/site-07-mission-orbit.spec.ts` (delete)
  - `e2e/site-08-chompers.spec.ts` (delete)
  - `e2e/site-09-pixel-passport.spec.ts` (delete)
  - `.github/skills/review/references/testing.md`
- Read-only:
  - `e2e/site-07-mission-orbit.spec.ts` — read before deleting to understand what's being removed
  - `e2e/site-08-chompers.spec.ts` — read before deleting
  - `e2e/site-09-pixel-passport.spec.ts` — read before deleting
- Deferred shared edits: none
- Verification: `ls e2e/` — should show only site-01 through site-06 specs. `npx playwright test --config config/playwright.config.ts --list` — should list only shared specs.
- Intent:
  **(1)** Read all three game-specific e2e files to catalog what behaviors they test (for handoff to WU-8's unit test expansion).

  **(2)** Delete the three files:
  - `e2e/site-07-mission-orbit.spec.ts`
  - `e2e/site-08-chompers.spec.ts`
  - `e2e/site-09-pixel-passport.spec.ts`

  **(3)** Update `.github/skills/review/references/testing.md`:
  - In the "Test Split" section, add a note: "Game-specific behaviors are covered by colocated unit tests, not e2e. E2E specs cover shared concerns: responsive layout, navigation, semantic HTML, accessibility, favicon, noscript."
  - Do not change any other sections.

  **(4)** In the final report, list every behavior/assertion that was covered by the deleted e2e specs. This catalog feeds into WU-8's unit test expansion as context for the orchestrator.

### LEG-8: Expand Unit Test Coverage
- Status: done
- Confirmed: yes
- Depends on: LEG-7
- Thinking effort: medium
- Owned files:
  - `app/data/game-registry.test.ts` (new)
  - `app/router.test.ts` (new)
  - `client/chompers/state.test.ts`
  - `client/chompers/problems.test.ts`
  - `client/mission-orbit/state.test.ts`
  - `client/pixel-passport/state.test.ts`
  - `client/pixel-passport/destinations.test.ts`
  - `client/super-word/state.test.ts`
- Read-only:
  - `app/data/game-registry.ts` — source for new tests
  - `app/router.ts` — source for new tests
  - `app/routes.ts` — imported by router
  - `client/chompers/state.ts` — understand existing logic for gap analysis
  - `client/chompers/problems.ts` — understand existing logic
  - `client/chompers/types.ts` — type definitions
  - `client/mission-orbit/state.ts` — understand existing logic
  - `client/mission-orbit/types.ts` — type definitions
  - `client/pixel-passport/state.ts` — understand existing logic
  - `client/pixel-passport/types.ts` — type definitions
  - `client/super-word/state.ts` — understand existing logic
  - `client/super-word/types.ts` — type definitions
- Deferred shared edits: none
- Verification: `node --import tsx --test app/**/*.test.ts client/**/*.test.ts config/**/*.test.ts` — all tests must pass.
- Intent:
  Expand unit test coverage to fill gaps identified during audit and to replace behaviors previously covered by the deleted game-specific e2e specs. Use `node:test` and `node:assert/strict` exclusively. Follow existing test patterns: colocated `.test.ts` files, descriptive test names, no mocks unless unavoidable.

  **(1) New file: `app/data/game-registry.test.ts`:**
  - Test that `games` array is non-empty
  - Test that every entry has required fields (slug, name, description, icon, status)
  - Test that slugs are unique
  - Test that slugs match expected directory structure (each slug should correspond to a `client/<slug>/` directory and a `public/<slug>/` directory — use `existsSync` or just validate the known expected set)
  - Test that all live games have a corresponding route in `app/routes.ts` (import routes and check)

  **(2) New file: `app/router.test.ts`:**
  - Test that `createAppRouter()` returns a router object
  - Test that the router responds to each defined route with a 200 status (use `router.fetch()` with the Fetch API — Remix fetch-router supports this natively for testing)
  - Test that an unknown path returns 404

  **(3) Expand `client/chompers/state.test.ts`:**
  - Current tests cover: initial state, correct/wrong answer flow, game over (rounds and lives), streak tracking
  - Add: area switching between rounds preserves game progress, difficulty level affects problem parameters

  **(4) Expand `client/chompers/problems.test.ts`:**
  - Current tests cover: all 18 area+level combos generate valid problems, scene items have no duplicate IDs, correct answer is present, positions in range
  - Add: distractor count validation (each problem has a reasonable number of wrong answers), answer values are valid for their area type

  **(5) Expand `client/mission-orbit/state.test.ts`:**
  - Current tests are thorough (17 tests covering tap, hold, tick, phase transitions)
  - Add: scene navigation (advanceScene), full mission playthrough (all scenes to completion), crew member selection affects state

  **(6) Expand `client/pixel-passport/state.test.ts`:**
  - Current tests cover: initial state, explore/mystery mode, travel progress, memory collection, mystery guesses, globe navigation
  - Add: mode switching preserves progress, completing all mysteries in a session

  **(7) Expand `client/pixel-passport/destinations.test.ts`:**
  - Add: every destination has at least one memory and one mystery clue, all destination slugs are unique, transport types cover reasonable variety

  **(8) Expand `client/super-word/state.test.ts`:**
  - Current tests cover: tile selection/swap, answer checking/scoring
  - Add: full puzzle flow (select tiles → check → advance → new puzzle), game completion (all puzzles solved), settings affect game behavior (difficulty selection)

  Read each source file's state module to understand the actual function signatures and state shapes before writing tests. Do not guess at API surfaces — verify against the code.

### LEG-9: SHA on Homepage
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `app/controllers/home.tsx`
- Read-only:
  - `build.ts` — understand existing SHA stamping mechanism
  - `app/ui/document.tsx` — understand Document component props
- Deferred shared edits:
  - `build.ts` — After the existing SW stamping loop, add a step that reads `app/controllers/home.tsx` from the output directory (or the rendered HTML) and replaces a placeholder like `__BUILD_SHA__` with the actual SHA. Alternative: write a small JSON or JS file to the output that the home controller reads at build time. The simplest approach: add a `<meta name="build-sha" content="__BUILD_SHA__">` to the Document component and have build.ts replace it in the rendered HTML output. Report the exact approach chosen so the orchestrator can apply the deferred edit precisely.
- Verification: `grep "__BUILD_SHA__\|build-sha" app/controllers/home.tsx` — should show the placeholder or meta tag in the source.
- Intent:
  Add a visible short git SHA to the homepage footer for deploy verification.

  **(1)** In `app/controllers/home.tsx`, add a small footer element after the `</section>` closing tag for the games list. Use minimal styling consistent with the page:
  ```tsx
  <footer mix={[css({ textAlign: 'center', padding: 'var(--space-md) 0', color: 'var(--color-muted)', fontSize: 'var(--text-xs)' })]}>
    <small>Build __BUILD_SHA__</small>
  </footer>
  ```
  The `__BUILD_SHA__` placeholder will be replaced by `build.ts` during the build step (deferred edit).

  **(2)** Report the exact deferred edit needed for `build.ts`: after the existing SW stamping loop, add a step that reads all `.html` files from the output directory and replaces `__BUILD_SHA__` with the `sha` constant (already computed via `git rev-parse --short HEAD`). This ensures the SHA appears in the rendered output without requiring build-time imports.

### LEG-10: Critique Skill Updates
- Status: done
- Confirmed: yes
- Depends on: none
- Thinking effort: low
- Owned files:
  - `.github/skills/critique/SKILL.md`
- Read-only: none
- Deferred shared edits: none
- Verification: Read back the modified file and confirm: (a) Phase 1 step 3 includes Actions investigation on SHA mismatch, (b) deploy verification failure is classified as a blocker.
- Intent:
  Two targeted edits to `.github/skills/critique/SKILL.md`:

  **(1) Update Phase 1, step 3 (Verify deployment).**
  After the existing text about SHA mismatch ("warn the user that production may still be running an older build"), add:

  > When the SHA does not match, also check the GitHub Actions deployment status: use `fetch_webpage` to load `https://github.com/jwgeller/peninsular-reveries/actions` and look for the most recent workflow run. If the run failed or is still in progress, report the status. A failed deployment is a **blocker** — flag it as a critical finding in Phase 4 and recommend the user investigate the Actions log before proceeding with the critique.

  **(2) In Phase 4 (Findings), add deploy verification as a blocker category.**
  In the findings template, after the "### What Didn't" section, add:

  ```markdown
  ### Blockers
  - [Deploy verification failures or Actions errors that prevent production evaluation]
  ```

  Add a note that if any blockers exist, the critique should recommend resolving them before the findings are considered complete.

## Dispatch Order

Sequential via runSubagent (navigator reviews between each):

1. LEG-1 (WU → MVT vocabulary) — no dependencies
2. LEG-2 (Multi-tier agents) — depends on LEG-1
3. LEG-3 (Node 25 + @types/node) — no dependencies, can parallel with LEG-1
4. LEG-4 (Remix → individual packages) — depends on LEG-3
5. LEG-5 (ESLint 10) — depends on LEG-3
6. LEG-6 (esbuild + Playwright) — depends on LEG-3
7. LEG-7 (Drop game-specific e2e) — no dependencies
8. LEG-8 (Expand unit tests) — depends on LEG-7
9. LEG-9 (SHA on homepage) — no dependencies
10. LEG-10 (Critique skill updates) — no dependencies

Parallel opportunities: LEG-1 and LEG-3 can dispatch in parallel. LEG-7, LEG-9, LEG-10 have no dependencies and can dispatch alongside the LEG-3→4/5/6 chain.

After all complete: apply deferred edits (package.json changes from LEG-3/4/5/6, build.ts from LEG-9) → npm install → npx playwright install → `pnpm test:local` → commit → push.

## Boundary Notes
- `config/tsconfig.json` — LEG-4 import migration also required updating `jsxImportSource` from `remix/component` to `@remix-run/component`; navigator applied this fix directly.
- `.github/skills/review/references/game-quality.md` — Contained a residual `WU-8/9` reference not caught by LEG-1 (outside that leg's owned set); navigator fixed it after LEG-2 sub-agent flagged it.

## Implementation
Commit: 1070ca1
Pushed: 2026-04-07

## Critique

Completed: 2026-04-07
Evaluated by: user + agent

### What Worked
- All 10 legs executed and shipped in one coordinated 40-file commit.
- LEG-9 (SHA on homepage) verified working in production — "Build fb54bec" visible.
- LEG-4 (Remix → individual packages) was the most complex migration (14 files) and shipped cleanly. Navigator caught the tsconfig gap.
- LEG-7+8 (test strategy pivot) replaced 540 lines of flaky game-specific e2e with targeted unit tests.
- LEG-1+2 (vocabulary + multi-tier agents) — good fit for Understudy tier, clean execution.

### What Didn't
- LEG-5 (ESLint 10): eslint-plugin-jsx-a11y peer dep conflict not caught. Plan explicitly called out checking compatibility, but sub-agent didn't flag the peer dep issue. Local `npm install` was lenient; CI's `npm ci` enforced it. Deploy Run #51 failed, requiring manual follow-up commit (fb54bec) adding `legacy-peer-deps=true` to `.npmrc`.
- Navigator protocol stopped at push — no step to verify GitHub Actions workflow succeeded or production SHA matched.
- Lighthouse CI hit NO_FCP errors (headless Chrome issue). Not a code defect.

### Corrections Applied
- **Navigator**: Added step 14 — post-push deploy verification (fetch Actions page, confirm deploy status, verify production SHA).
- **Compose skill**: Added peer dependency audit requirement for upgrade legs; documented CI-vs-local `npm ci` strictness gap.
- **Critique skill**: Removed interactive Q&A mode; auto behavior is now the default. User provides observations at invocation or in follow-ups.
- **Deploy workflow**: Removed lighthouse job (persistent NO_FCP issues). Added to backlog for future revisit.
- **Backlog**: Created `.github/skills/review/references/backlog.md` for tracking deferred considerations.