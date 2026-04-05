---
name: planning
description: "Structured plan format for orchestrated multi-agent execution. Use when producing plans intended for the @orchestrator agent to dispatch as work units via runSubagent."
user-invocable: true
---

# Planning

Use this skill when producing plans that will be dispatched by the `@orchestrator` agent. Plans must be written as structured work units, not prose narratives.

## Plan File Location

Plans live in `/memories/repo/plans/active-plan.md` (Copilot memory, workspace-persistent, not in git). There must be exactly one active plan file — the orchestrator reads only this path.

- When a new plan is approved, **delete** the existing `active-plan.md` first, then create the new one. Do not create separate named plan files — the orchestrator will not discover them.
- When all WUs in a plan are `done` and the orchestrator has completed integration, delete the plan file so a stale completed plan is not mistaken for active work.

## Plan Structure

```markdown
# Plan: [Short Title]

## Work Units

### WU-1: [Game/Area] — [Short description]
- Status: not-started
- Depends on: none | WU-N
- Thinking effort: low | medium | high
- Owned files:
  - `path/to/file.ts`
- Read-only:
  - `path/to/reference.ts` — reason
- Deferred shared edits:
  - `shared/file.ts` — what to change
- Verification: `command to run`
- Intent: [Detailed implementation description]

### WU-2: ...

## Dispatch Order

Sequential via runSubagent (orchestrator reviews between each):

1. WU-1 (label) — no dependencies
2. WU-2 (label) — depends on WU-1

After all complete: [integration steps] → npm run test:local → commit → push.
```

## Field Definitions

### Status
One of: `not-started`, `in-progress`, `done`, `blocked`. Only the orchestrator updates status during dispatch.

### Depends on
`none` or a WU ID like `WU-3`. WUs with no dependencies can be dispatched in any order. The Dispatch Order section makes the actual sequence explicit.

### Thinking effort
Guides the orchestrator's sub-agent configuration:
- **low** — Rename, config change, mechanical transformation. Sub-agent can work quickly.
- **medium** — Feature in a known pattern, moderate judgment needed.
- **high** — Novel design, multi-concern coordination, or creative work requiring deep context.

### Owned files
The exhaustive list of files the sub-agent is allowed to modify. Use globs sparingly and only for asset directories (e.g., `public/game/audio/*`). Never split a single file across multiple WUs — exactly one WU owns each file.

### Read-only
Files the sub-agent should read for reference but must not modify. Include a reason so the sub-agent understands why.

### Deferred shared edits
Changes needed in files that are shared across WUs or owned by the orchestrator (e.g., `package.json`, `build.ts`, `app/routes.ts`). The orchestrator applies these after all WUs complete. Describe the edit precisely enough that the orchestrator can apply it without judgment.

### Verification
A single shell command the sub-agent runs to validate its work. Must cover only the files in this WU's owned set. Never `npm run test:local` — that is the orchestrator's integration gate.

### Intent
The most critical field. This is what the orchestrator enriches into the sub-agent dispatch prompt. It should be:

- **Specific** — Name functions, interfaces, constants, CSS selectors, HTML element IDs. Don't say "update the renderer"; say "replace `renderFallingItems()` with `renderScene()` that creates `<button>` elements per `SceneItem`, positioned via `left/top` percentages from `item.x`/`item.y`."
- **Self-contained** — Embed the project constraints the sub-agent needs so it doesn't have to load skills. Include: budget limits, accessibility requirements, styling rules, test patterns, pacing guidelines — whatever applies.
- **Outcome-oriented** — Describe what the code should do when the WU is complete, not just what to change.
- **Bounded** — If the WU has sub-tasks, number them (e.g., "(1) Replace types. (2) Add problem generator. (3) Rewrite state machine."). This helps the sub-agent track its own progress.

## Scoping Guidelines

### How to draw WU boundaries
- **One module or feature per WU** when files are tightly coupled. Don't split `types.ts` and `state.ts` into separate WUs if `state.ts` imports everything from `types.ts` — they change together.
- **Split by independence** when modules don't share types. A CSS+HTML WU and a state+logic WU can be separate if neither blocks the other.
- **Maximize parallelism** — WUs without dependencies can be dispatched concurrently by the orchestrator in the future. Design boundaries to minimize serial chains.
- **Keep WUs < 15 owned files** — larger WUs are harder for sub-agents to reason about. If a WU grows past this, look for a natural seam to split on.

### When files are tightly coupled
A refactor where types → state → renderer all depend on each other should be one large WU (or at most 2 sequential WUs where WU-1 produces the new types+state and WU-2 consumes them for rendering+input). Don't force artificial boundaries that create compile errors between WUs.

### Shared files
Files used by multiple games or the build system (`package.json`, `build.ts`, `app/routes.ts`, `app/router.ts`, `app/ui/document.tsx`, `public/styles/main.css`) should NOT appear in any WU's owned set. Changes to shared files go in `Deferred shared edits` and are applied by the orchestrator.

## Embedding Project Constraints

The plan's Intent fields must embed the relevant project constraints from the review skill references so sub-agents don't need to load them. Key constraints to include when relevant:

- **Budget**: ≤ 50KB JS, ≤ 30KB CSS, ≤ 200KB total per game page
- **Layout**: Full-screen, no document scroll on game screens, `100dvh`, safe-area padding, 4 viewport checkpoints (390×844, 844×390, 1024×768, 1280×800)
- **Pacing**: Calm, user-controlled, no timing-based failure unless user requests it
- **Reading level**: In-game copy at ~level-1 reading level, short sentences
- **Accessibility**: `#game-status` (polite) and `#game-feedback` (assertive) live regions, focus management, semantic HTML, WCAG2A/2AA compliance
- **Styling**: Hybrid CSS model — `css()` mixins for shared UI, external stylesheets for game-specific visual systems. Don't duplicate game-shell rules.
- **State**: Pure immutable functions (state → newState)
- **Audio**: Hybrid CC0 samples + Web Audio synth, dynamics compressor
- **Testing**: Colocated `*.test.ts` files, `node --import tsx --test` runner
- **Motion**: Respect `isReducedMotion()`, CSS-first animation with JS promise wrappers

Don't dump all constraints into every WU. Include only those relevant to the WU's scope.

## Dispatch Order Section

List WUs in the order the orchestrator should dispatch them. Note dependencies and parallelism opportunities. End with the integration sequence:

```markdown
After all complete: apply deferred edits → npm run sync:attributions → npm run test:local → commit → push.
```

Omit `sync:attributions` if no attribution files changed.
