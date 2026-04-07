## Workflow

`README.md` is the source of truth for game principles and site values.

For project architecture, game quality standards, and testing conventions, load the `review` skill in `.github/skills/review/` before doing substantial repo work.

## Styling Guidance

- This repo uses a hybrid CSS model. Prefer Remix `css()` mixins in `app/` for shared server-rendered UI, page layouts, shared game shell helpers, modal shells, and accessibility utilities.
- Keep `public/styles/*.css` for global foundation CSS and large game-specific visual systems, especially where client DOM code depends on stable class hooks or art-heavy selector/animation sections.
- Do not reintroduce duplicated per-game shell rules such as hiding site chrome, full-screen `main` layout, base screen transitions, base settings-modal overlay behavior, or `.sr-only` when `app/ui/game-shell.tsx` or other shared UI modules already own them.
- When updating a server-rendered component in `app/`, prefer co-located style objects or shared modules in `app/ui/` over adding new page-specific rules to `public/styles/main.css`.
- Treat `public/styles/main.css` as the global foundation stylesheet for tokens, theme overrides, theme toggle styling, and view-transition/reduced-motion glue.

## Knowledge Persistence

- Do not use Copilot memory files (`/memories/repo/`) to store project learnings. Memory files are invisible to humans, other tools, and collaborators.
- **Exception:** Orchestrated workflow plans live in `/memories/repo/plans/` because they are ephemeral dispatch state, not project knowledge.
- When you learn something reusable about this project, record it in the appropriate in-repo file instead:
	- Architecture, conventions, build and deploy patterns → `.github/skills/review/references/architecture.md`
	- Game quality, layout, pacing, visual rules → `.github/skills/review/references/game-quality.md`
	- Testing conventions, validation gates, CI behavior → `.github/skills/review/references/testing.md`
	- Workflow, session expectations, environment → `copilot-instructions.md`
- Keep additions concise. If the insight is game-specific rather than project-wide, note the game slug inline.

## Session Expectations

- Default to **human-ready completion** for non-trivial feature work. Do not stop at code edits alone when the clear user intent is "ready for me to try it." Continue through generated-file sync, repository validation, and low-risk regression fixes unless the user explicitly scopes the work smaller.
- Treat **`npm run test:local`** as the preferred end-state check before handoff when the change is large enough to affect app behavior beyond a single isolated file.
- Treat **secret hygiene as blocking release work**. Do not leave real credentials, tokens, private keys, or committed `.env` secrets in the working tree or reachable history when the task is about review, release readiness, pushing, or security cleanup.
- If a validation run finds an **objective blocker to human testing** that was introduced or exposed by the current work, fix it before stopping when the fix is clear and low-risk.
- Ask the user a clarifying question only when the answer would materially change the implementation, or when proceeding would require a destructive, irreversible, or product-direction choice. If a reasonable default exists, use it and keep going.
- If the user says some version of **"continue until done"**, interpret "done" as **human-ready unless genuinely blocked**.
- If the user says **"wrap it up"** or otherwise makes it clear that **pushing finished work is welcome**, treat that as permission to finish the current task end-to-end. When the work is validated and human-ready, and the commit scope is clear with no ambiguous unrelated changes, the agent may stage the intended files, create a concise commit, and push without asking for one more round of confirmation. If the working tree is mixed or risky, stop short of commit/push and explain the blocker briefly.
- After completing work, report what changed and what was verified.

## Composing Plans

- At the start of any new composing session, check for an existing `active-score.md` in `/memories/repo/plans/`. If one exists, read its Critique section (if present) and incorporate findings into the new score, then replace it. Never write scores to `/memories/session/` or any path other than the canonical `/memories/repo/plans/active-score.md`.
- When producing plans, write extremely detailed step-by-step plans with explicit file paths, function names, exact commands when helpful, contingency steps for likely failure points, and clear verification gates.
- Include rollback or recovery notes for risky edits.
- When producing plans intended for orchestrated execution, load the compose skill in `.github/skills/compose/` and output work units in its format. Embed the relevant project constraints (from the review skill references) directly into each work unit's intent so that dispatched sub-agents do not need to load skills independently.

## Executing Agent Guidance

- Complete every step in the approved plan. When you finish one step, immediately start the next. Do not stop partway to ask whether you should continue.
- If you hit an error, diagnose it and fix it. If you are genuinely stuck, explain the specific blocker. Do not abandon the remaining steps.
- Before any push-ready handoff, inspect the changed files for accidental secrets or credential-like strings, and if a real secret was already committed, treat rotation plus history cleanup as required work rather than a documentation note.
- After completing all planned work, run the relevant verification. If it passes, report what changed and what was verified.
- When dispatched by the orchestrator, respect your `owned_files` boundary strictly. Do not modify files outside your owned set.
- When dispatched by the orchestrator, do not load repository skills. The dispatch prompt already incorporates project constraints extracted from the relevant skills during plan composition. Loading skills redundantly wastes context budget and slows execution.
- Run only your unit's verification command. Do not run `npm run test:local` — that is the orchestrator's job.
- If you need a change to a shared file (package.json, build.ts, router, routes, shared styles), report it as a deferred edit rather than modifying it.

## Orchestrated Workflow

- When the user says **"cue"** referencing an active score, tell the user to start a **new chat session** with the `@orchestrator` agent. Do not begin execution directly, do not invoke the orchestrator mid-session, and do not attempt to execute work units yourself. The orchestrator must start with a fresh context — it owns dispatch, sub-agent coordination, integration gating, and commit/push.
- Plans live in `/memories/repo/plans/active-score.md` as structured markdown with work units (workspace-persistent, not in git). There is exactly one active score.
- Plans are composed in agent mode using the compose skill; the `@orchestrator` agent dispatches them via `runSubagent`.
- The orchestrator reads source code before each dispatch to enrich the plan's intent description into a specific implementation prompt.
- The orchestrator reviews sub-agent results, resolves fixable issues, and escalates genuine blockers to the user.
- Each work unit has an explicit `owned_files` set — the performing agent may ONLY modify those files.
- The orchestrator runs `npm run test:local` once after all units complete as the integration gate.

## Environment Context

- Dev OS: Windows
- CI OS: Ubuntu (`ubuntu-latest`)
- Shell: PowerShell
- Node: `24.14.1`
- npm: `11.12.0`
- Editor: VS Code with GitHub Copilot
- GitHub CLI: `gh` is available and should be assumed authenticated; if auth fails, help the user recover and use `gh --help` for command discovery.
- No Docker or container workflow is expected; use direct Node execution.

## Key Commands

- `npm run dev` — local dev server
- `npm run check` — lint + typecheck
- `npm run test:local` — full local validation gate
- `npm run build` — static build
- `npm run sync:attributions` — regenerate `ATTRIBUTIONS.md`

`npm install` configures the repo-owned pre-commit hook, and the hook runs `npm run test:local` automatically.
