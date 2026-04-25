---
name: gnd-navigate
description: "Dispatch a structured plan from .planning/ to gnd-diver subagents. Use when implementing an active plan — resolves the plan, dispatches legs, reviews results, runs the integration gate, and lands the work."
user-invocable: true
disable-model-invocation: true
---

# Navigate

Dispatch a structured plan from `.planning/` by delegating each leg to `gnd-diver` via the `subagent` tool, reviewing results, and running the integration gate.

## Invocation

```
/skill:gnd-navigate              # dispatch the active plan
/skill:gnd-navigate train-sounds  # dispatch by slug
/skill:gnd-navigate dispatch      # same as no argument — resolve and dispatch
```

Extended cues (no argument needed): `dispatch`, `dive`, `dive dive dive`, `dive, dive, dive!`, `submerge`, `🤿`, `start`, `run`, `go`, `begin`, `active plan`.

---

## Core Rule

**Dispatch every leg to `gnd-diver`. Do not implement legs yourself.**

You may edit source files only for small post-review corrections — typos, a missed import, a single CSS property. If you catch yourself writing more than a few lines of implementation code, STOP and re-dispatch that work to `gnd-diver`.

The only files you should edit freely are plan status files in `.planning/`.

---

## Quick Reference

| Phase | Steps | Key rule |
|-------|-------|----------|
| **Start** | 1–3 | Resolve plan → validate structure → find dispatchable legs |
| **Dispatch loop** | 4–10 | Staleness → compose → mark in-progress → dispatch → review → mark done → next leg |
| **Wrap-up** | 11–17 | Integration gate → finalize → land → record → verify delivery |

---

## Protocol

**Process ALL legs in a single session.** After each sub-agent returns and review completes, immediately dispatch the next pending leg. Do NOT stop, summarize, or prompt the user between legs. You are done only when every leg is `done` or `failed` and the gate has run.

**Bootstrap cues are not plan input.** If the user message consists solely of a startup cue (`dispatch`, `dive`, `start`, `run`, `go`, `begin`, `active plan`, `🤿`), ignore it as substantive input and resolve the live plan from `.planning/`. Only treat the message as meaningful input if it contains substance beyond such a cue.

**Project guidance is layered.** Rules come from the plan's `## Project Context`, workspace instructions, READMEs, and repo-local skills. When they conflict, the narrower and more explicit source wins.

### 1. Resolve the plan

List `.planning/` (exclude `archive/`). Look for `active-plan-*.md`.

- User-selected plan (by title/slug/file) takes priority.
- Prefer a plan with an `in-progress` leg (resume), then one with `done` legs but no `## Implementation` (interrupted), then one with no implementation yet.
- Multiple ambiguous candidates → ask the user.
- Already has `## Implementation` → tell user it needs critique (`gnd-critique`), not re-dispatch.

### 2. Read the plan

Parse `## Project Context`, `## User Intent`, legs, dispatch order, and any `## Implementation` / `## Critique` sections.

### 3. Validate plan structure

Before dispatching, confirm the plan contains:

- `## Project Context` with at least a `Full validation` entry
- `## User Intent` (non-empty)
- Every leg has `Status`, `Confirmed`, `Owned files`, `Verification`, and `Intent`. A leg missing any field is not dispatchable — report the gap.
- `## Dispatch Order`

If any required section is missing or empty, stop and tell the user what needs to be added. Do NOT guess or fill in missing sections yourself.

### 4. Find dispatchable legs

Status `pending`, `Confirmed: yes`, and dependencies are `none` or all `done`.

### 5. Staleness check

Before each dispatch, use `bash` with `grep` to search for 2–3 key identifiers (function names, class names, selectors, route paths) from the leg intent in the owned files. Go/no-go:

- **All found** in expected files → proceed.
- **Renamed or moved** (found elsewhere, or a clear successor exists) → update the leg intent with current names, note the change, proceed.
- **Owned file missing entirely** → escalate to user; do not dispatch.
- **Identifier deleted with no successor** → escalate to user; the plan may need re-charting.

Otherwise, do NOT read full files — just confirm the plan is not stale.

### 6. Compose dispatch prompt

Include:

- Leg intent verbatim from the plan
- Sub-agent contract (see below)
- owned_files and read-only lists
- Verification command
- Brief anchoring context from the staleness check
- Do NOT rewrite intent into step-by-step instructions.

### 7. Mark in-progress

Use `edit` on the plan file: replace `pending` → `in-progress` for this leg.

### 8. Dispatch

Use the `subagent` tool with `agent: "gnd-diver"` and the composed task.

**Parallel dispatch:** When multiple legs are dispatchable simultaneously (status `pending`, `Confirmed: yes`, all dependencies `done`), dispatch them in a single parallel batch using `tasks:`. Before batching, compare owned files across candidates — two legs conflict if they share any owned file. Conflicting legs must run sequentially.

```typescript
subagent({
  tasks: [
    { agent: "gnd-diver", task: "<composed prompt for LEG-N>" },
    { agent: "gnd-diver", task: "<composed prompt for LEG-M>" },
    ...
  ],
  concurrency: <batch size>
})
```

### 9. Post-dispatch review

a. **Scope check.** Use `bash` with `git diff --name-only` to list files modified since dispatch. Compare against the leg's `owned_files`. Any file modified outside that set is a boundary violation.
b. Read every file the sub-agent modified.
c. Verify changes match intent — no scope creep, no skipped requirements.
d. Check numeric targets (counts, pool sizes, etc.) if the intent specifies them.
e. Check text quality — irregular plurals, dynamic formatters — if intent involves copy.
f. Run the leg's verification command.
g. **Boundary violations:** Revert out-of-scope modifications to their previous state. Record needed changes as deferred edits. Note violations in a `## Boundary Notes` section.
h. Small corrections → fix directly. Larger problems → re-dispatch with specifics.
i. Genuine product-direction blockers → escalate to user.
j. Mark `done` only after review AND verification pass.

**For parallel batches:** Review EACH leg individually. If one leg fails but others succeed, mark the successful legs `done` and re-dispatch only the failing leg. Do NOT re-dispatch the entire batch. Review legs that unblock downstream dependents first.

### 10. Update status

Use `edit` on the plan: `in-progress` → `done` or `failed`.

### 11. Loop

Check for newly dispatchable legs. Repeat from step 4. Do NOT stop after one leg.

### 12. Integration gate

When all legs are `done`:

- Apply deferred shared-file edits.
- Run sync, build, lint, test, packaging, or release steps from `## Project Context`, workspace instructions, READMEs, or relevant skills.
- Run the full-validation command or checklist.

### 13. Finalize statuses

Every leg must be `done` or `failed`. No `in-progress` or `pending` left.

### 14. Land the work

Commit and push is the default — always land unless the user explicitly requested otherwise.

- Compare changed files against the union of all leg owned-file lists + deferred edits. Stage ONLY those files. Unrelated working-tree changes must not block the commit.
- Commit with a summary message referencing the plan title. Push to the default branch.
- `Delivery verification: local-only` means "verify the result locally" — it does NOT mean skip committing or pushing.

### 15. Record outcome

Append to the plan using `edit`:

```markdown
## Implementation
Commit: <short-sha> | none (local-only)
Pushed: <date>
```

### 16. Verify delivery

Run the delivery verification from `## Project Context`.

- `local-only`: confirm validation passed and the working tree is clean for plan-owned files.
- deployed URL / package / artifact: check the deployed or published result.
- `none`: skip verification.

### 17. Handle failures

Diagnose, fix, re-run. Escalate only if genuinely stuck.

### 18. Resumption

On re-invocation: resolve the plan again, prefer one with `in-progress` legs, complete post-dispatch review or recovery for that leg before dispatching anything new, skip `done` legs, and otherwise resume from the first dispatchable confirmed pending leg.

---

## Sub-Agent Contract

Prepend to every dispatch prompt:

---

**CONTRACT — Read before doing anything.**

- ONLY create or modify files in your owned_files set.
- Do NOT modify shared infrastructure (`package.json`, `build.ts`, routers, routes, shared styles, etc.). Report needed changes as deferred edits.
- Run your verification command. Report pass/fail and error output.
- Hit a blocker → explain specifically. Do not silently skip.
- Complete ALL steps. Do not stop partway or ask whether to continue.
- Report ONLY: (a) files created/modified, (b) deferred edits if any, (c) verification outcome, (d) blockers.
- No suggestions, follow-ups, or optional improvements.

---

## Visual Legs Review

If the leg's intent names a visual checkpoint (e.g., specific viewport dimensions, vehicle visibility, sprite legibility, board-area floor) and the `Verification` field is lint-only, lint passing alone is not sufficient to mark the leg done. Flag it for a manual visual check, note the gap in the plan, and confirm with the user before closing.

## Runtime Wiring Review

If a leg creates a helper module or claims a user-facing affordance layer (live regions, indicators, prompts, overlays, and similar), file presence is not enough. During review, verify that the runtime imports or calls the helper, or that the affordance produces at least one observable effect in browser or test verification, before marking the leg done.

## CSS/HTML Class Cross-Reference

When reviewing a visual leg that adds or modifies CSS, grep for all `className=` strings in the game's TSX/controller files **and** all `classList.add` / `classList.toggle` / `classList.remove` calls in TS/JS files. Cross-check against CSS class selectors. Any HTML class or classList target without a matching CSS rule is a boundary violation. Any CSS class selector that never appears in HTML or classList is dead CSS. Fix before marking the leg done.

## Audio Manifest Review

When reviewing a leg that adds or modifies a sample manifest (any `sample-manifest.ts`), check that `bundled: true` entries have corresponding audio files on disk. Run `ls public/<slug>/audio/` and verify the `.ogg` files exist for every bundled sample. A manifest with `bundled: true` and missing files produces a game with silent audio — mark this as a review failure.

## Plan File Commit Timing

The plan file (`.planning/active-plan-*.md`) should be committed by `gnd-chart` when first written — before any implementation begins. Do not bundle the plan file into the implementation commit. During wrap-up, update `## Implementation` with commit SHA and push date, then commit that update separately with a short message like `Update plan: record implementation commit SHA`.

## Clarifying Questions

When you need the user's input — gating questions between legs, ambiguity escalations from a diver, integration-gate decisions, or wrap-up confirmations — ask one question at a time with concrete options. Keep questions focused and actionable.

---

## Community Contributions

This skill evolved from the `gnd-navigator` agent (`.pi/agents/gnd-navigator.md`), which was converted to a skill to eliminate the dispatcher-vs-implementer identity conflict that caused the agent to skip delegation and implement legs directly.

If you want to propose changes to this dispatch protocol:

- **Project-local overrides** go in `.pi/skills/gnd-navigate/LOCAL.md` (same pattern as agent LOCAL.md files). The skill loads SKILL.md first, then LOCAL.md.
- **Upstream contributions** should be proposed against the base skill, not edited locally. Fork or PR against the source repo.
- **The `gnd-diver` agent** (`.pi/agents/gnd-diver.md` and its LOCAL override) remains an agent — it's the implementation subagent that this skill dispatches to.

### Conversion Notes

Key changes from the agent version:

- **No separate process**: The skill runs in the main conversation, not a spawned subagent. This means the main agent already has project context and doesn't need to re-derive it.
- **No identity conflict**: The agent was told "you are a dispatcher, not an implementer" but had implementation tools — leading to skipped dispatches. The skill simply says "dispatch every leg to gnd-diver" — no identity contradiction.
- **Bridge edits are natural**: Post-review corrections are just the main agent doing its normal job, not a special exception to a "don't implement" rule.
- **LOCAL.md merge bug is gone**: The agent's LOCAL.md was not reliably merged at runtime. The skill loads both files, avoiding that class of bug.
- **All LOCAL.md extensions are included**: Parallel dispatch, extended bootstrap cues, audio manifest review, CSS classList cross-reference, visual/runtime verification guards — all merged into this skill.

## Plan Format Reference

Plans live in `.planning/` as `active-plan-YYYY-MM-DD-HHmm-<slug>.md`.

```markdown
# Plan: [title]

## Project Context
- Sources:
  - `path/to/doc.md` - why it matters
- Constraints:
  - [Derived rules the plan relies on]
- Full validation:
  - `command` or checklist
- Delivery verification:
  - deployed URL, package check, artifact check, local-only, or `none`

## User Intent
[2–4 sentences: what the user wants and why.]

## Legs

### LEG-[N]: [short title]
- Status: pending | in-progress | done | failed
- Confirmed: yes | no
- Depends on: none | LEG-[X], LEG-[Y]
- Owned files:
  - `path/to/file.ts`
- Read-only:
  - `path/to/context-file.ts`
- Deferred shared edits:
  - `shared/file.ts` - description
- Verification: `command`
- Intent: [what and why]

## Dispatch Order
1. LEG-1 (label) - no dependencies
2. LEG-2 (label) - depends on LEG-1
After all complete: deferred edits → full validation → delivery verification → commit → push.
```