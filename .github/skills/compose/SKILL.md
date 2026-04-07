---
name: compose
description: "Structured plan format for orchestrated multi-agent execution. Use when composing plans intended for the @orchestrator agent to dispatch as work units via runSubagent."
user-invocable: false
---

# Compose

Use this skill when composing plans that will be dispatched by the `@orchestrator` agent. Plans must be written as structured work units, not prose narratives.

---

## Default Workflow

Every plan follows five phases in order. Do not skip phases or collapse them.

```
Discovery → Alignment → Draft → Workshop → Refinement
```

### Phase 1 — Discovery
Explore the codebase to understand scope: read relevant files, run searches, identify affected modules. Do not start writing WUs yet.

### Phase 2 — Alignment
Always run one alignment round after Discovery. Present a brief summary of what you found, then ask scope/approach questions via `vscode_askQuestions`. At minimum, surface: (a) what's in scope vs. out of scope, (b) any non-obvious tradeoffs or alternatives the research revealed, and (c) anything genuinely ambiguous. Do not ask about things you can infer from the code. One round maximum. Skip Alignment only when the task maps to a single, unambiguous WU with no design choices.

### Phase 3 — Draft
Produce a **plan outline** and present it to the user. The outline contains:
- Plan title
- WU list with ID, short label, and a one-line description of intent
- Proposed dispatch order

Show this outline explicitly so the user sees the overall shape. State clearly: "This is the skeleton — we'll confirm each WU in the next step." Do NOT write full Intent fields or owned-file lists yet. The draft is a skeleton, not the final plan.

### Phase 4 — Workshop (default, no trigger required)
After the draft is shown, automatically enter workshop. Walk through each WU for user confirmation before the plan is finalized.

**Workshop loop:**
1. Present WUs one at a time. Group tightly coupled WUs (e.g., two WUs that depend on each other's outputs) and present them together at the planner's discretion.
2. For each WU (or group), show a **brief summary as regular Markdown in chat** — not inside the `vscode_askQuestions` tool:
   - Title and ID
   - 2–3 concise bullet points of key intent (what changes and why)
   - Owned files list
   - One alternative approach or tradeoff, if one exists. If the WU is purely mechanical, state that.
   Keep the summary scannable — no prose paragraphs.
3. After showing the summary, call `vscode_askQuestions`. Options: **Approve as-is** (recommended), one option per concrete alternative from the summary (e.g., "Alternative: [short label]"), and **Remove**. Do not add a "Request changes" option — freeform text input is always available. The question text should be a one-line WU reference — all detail lives in the Markdown above.
4. Apply feedback immediately (update that WU's design) before moving to the next WU.
5. When approved, mark the WU `Confirmed: yes` in the plan file.

Do not advance past workshop until all WUs are either confirmed or removed.

### Phase 5 — Refinement
After workshop is complete, write the full score with all fields populated for confirmed WUs. Begin the score with the **User Intent** section — a concise summary of the user's goal and motivation, distilled from the conversation. This section is the reference point for evaluating whether each WU serves the score and for critique analysis. Then output a brief post-workshop summary (see Plan Output Rules below). Do not output the full score to the user.

---

## Plan Output Rules

After workshop, do **not** paste the full plan into the chat. Instead output only:

1. **What changed during workshop** — a brief list of any WUs that were modified or removed based on user feedback.
2. **Unconfirmed WUs** — list any WUs that are still `Confirmed: no` (should be empty if workshop completed, but name them if not).
3. **Dispatch order** — the final ordered list of WUs with their IDs and labels.

The plan file is the source of truth. The user has already seen every WU individually during workshop, so re-dumping the file is noise.

---

## Re-entry Trigger Phrases

If the user says **"review"** or **"walk me through it"**:
- If there are unconfirmed WUs, re-enter the workshop loop starting from the first unconfirmed WU.
- If all WUs are confirmed, ask which WU they want to revisit and re-open workshop for that specific WU.

Confirmed WUs are **not** re-presented automatically in subsequent workshop rounds. If the planner reworks the plan based on feedback and a confirmed WU is materially affected by the change, use judgment on whether to re-workshop it — default to not re-asking unless the change significantly alters that WU's scope, owned files, or approach.

---

## Plan File Location

Scores live in `/memories/repo/plans/active-score.md` (Copilot memory, workspace-persistent, not in git). There must be exactly one active score — the orchestrator reads only this path.

- At the start of a new composing session, check whether `/memories/repo/plans/active-score.md` already exists. If it does (e.g., the critique was skipped or the session was interrupted), delete it before creating the new one. Corrections from critiques are applied to process files during the critique itself — the composer does not need to read old scores.
- Do not silently create scores in a different location. Do not create separate named score files — the orchestrator will not discover them.
- After the orchestrator completes integration and pushes, **leave the score in place** — the user may run the `critique` skill to evaluate the result and append findings. The score is replaced only when the next composing session starts.

---

## Plan Structure

The plan file is for orchestrator consumption and persistence, not for showing the user in bulk. Write it after workshop is complete.

```markdown
# Plan: [Short Title]

## User Intent

[2–4 sentence summary of what the user wants to achieve and why. Written
during Refinement; updated during workshop if scope shifts. The orchestrator
and critique both reference this section to evaluate whether finished
work aligns with original goals.]

## Work Units

### WU-1: [Game/Area] — [Short description]
- Status: pending
- Confirmed: yes | no
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

---

## Field Definitions

### Status
One of: `pending`, `in-progress`, `done`, `failed`. Only the orchestrator updates status during dispatch.

### Confirmed
`yes` or `no`. Set to `yes` when the user approves the WU during workshop. Defaults to `no` in the draft. The orchestrator will not dispatch a WU with `Confirmed: no`.

### Depends on
`none` or a WU ID like `WU-3`. WUs with no dependencies can be dispatched in any order. The Dispatch Order section makes the actual sequence explicit.

### Thinking effort
Guides the orchestrator on WU complexity:
- **low** — Rename, config change, mechanical transformation.
- **medium** — Feature in a known pattern, moderate judgment needed.
- **high** — Reserved for research/exploration WUs (e.g., an `Explore` sub-agent gathering context for later WUs).

**Default to medium or low.** If a WU requires high thinking effort for *implementation*, that complexity should be resolved during composition — break it into smaller WUs, add more specificity to the Intent, or move the hard reasoning into a preceding research WU. A well-written score should rarely produce high-effort implementation WUs.

### Owned files
The exhaustive list of files the sub-agent is allowed to modify. Use globs sparingly and only for asset directories (e.g., `public/game/audio/*`). Never split a single file across multiple WUs — exactly one WU owns each file.

**E2E impact check.** When a WU changes user-visible text (button labels, modal content, link text, aria labels), grep E2E specs (`e2e/**/*.spec.ts`) for assertions on that text and include matching spec files in the owned-file list.

**Verification step.** During Draft/Workshop, do a quick grep of proposed owned files to confirm the code to be changed actually lives there. If the target code (e.g., a CSS property, function call, or selector) doesn't appear in the listed files, fix the owned-file list before finalizing.

### Read-only
Files the sub-agent should read for reference but must not modify. Include a reason so the sub-agent understands why.

### Deferred shared edits
Changes needed in files that are shared across WUs or owned by the orchestrator (e.g., `package.json`, `build.ts`, `app/routes.ts`). The orchestrator applies these after all WUs complete. Describe the edit precisely enough that the orchestrator can apply it without judgment.

### Verification
A single shell command the sub-agent runs to validate its work. Must cover only the files in this WU's owned set. Never `npm run test:local` — that is the orchestrator's integration gate.

**For verification/testing WUs:** The intent must list explicit per-file expected assertions, not vague directives like "fill E2E gaps." For each owned test file, name the specific checks: e.g., "in `site-08-chompers.spec.ts`, assert two `role=tab` elements exist, tab switching shows/hides panels, X close button dismisses modal." This gives the sub-agent concrete acceptance criteria.

### Intent
The most critical field. This is what the orchestrator enriches into the sub-agent dispatch prompt. It should be:

- **Specific** — Name functions, interfaces, constants, CSS selectors, HTML element IDs. Don't say "update the renderer"; say "replace `renderFallingItems()` with `renderScene()` that creates `<button>` elements per `SceneItem`, positioned via `left/top` percentages from `item.x`/`item.y`."
- **Self-contained** — Embed the project constraints the sub-agent needs so it doesn't have to load skills. Include: budget limits, accessibility requirements, styling rules, test patterns, pacing guidelines — whatever applies.
- **Outcome-oriented** — Describe what the code should do when the WU is complete, not just what to change.
- **Bounded** — If the WU has sub-tasks, number them (e.g., "(1) Replace types. (2) Add problem generator. (3) Rewrite state machine."). This helps the sub-agent track its own progress.

---

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

---

## Embedding Project Constraints

The plan's Intent fields must embed the relevant project constraints from the review skill references so sub-agents don't need to load them. Key constraints to include when relevant:

- **Budget**: ≤ 150KB JS, ≤ 60KB CSS, ≤ 400KB total per game page
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

---

## Dispatch Order Section

List WUs in the order the orchestrator should dispatch them. Note dependencies and parallelism opportunities. End with the integration sequence:

```markdown
After all complete: apply deferred edits → npm run sync:attributions → npm run test:local → commit → push.
```

Omit `sync:attributions` if no attribution files changed.
