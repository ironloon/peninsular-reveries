---
name: critique
description: "Evaluate a completed plan's implementation against its intent, production behavior, and process quality. Use after the orchestrator has pushed and the user has tested in production. Produces findings that feed forward into the next planning cycle."
user-invocable: false
---

# Critique

Use this skill after an orchestrated plan has been implemented, pushed, and tested in production. The user invokes this directly — it is never auto-loaded.

The critique evaluates what worked, what didn't, and feeds corrections forward into both the active score (for the next composer to read) and the process files themselves (compose skill, orchestrator agent, copilot instructions, review references).

---

## Workflow

```
Gather Context → User Input → Analysis → Findings → Apply
```

### Phase 1 — Gather Context

Collect everything needed for evaluation before engaging the user:

1. **Read the active score.** Use `memory` to view `/memories/repo/plans/active-score.md`. Parse all MVTs, their intents, owned files, dispatch order, and status. Look for the `## Implementation` section — it contains the commit SHA the orchestrator recorded after pushing.
2. **Read the implementation commit(s).** If the plan has an `## Implementation` section, use that SHA directly. Otherwise, run `git log --oneline -5` to find the commit(s) that landed the plan. Then run `git show <sha> --stat` for a file-level summary and `git diff <sha>~1 <sha> -- <specific files>` for targeted diffs when evaluating individual MVTs.
3. **Verify deployment.** Fetch the production root service worker at `https://jwgeller.github.io/peninsular-reveries/sw.js` using `fetch_webpage`. Extract the SHA from the `CACHE_NAME` value (format: `<prefix>-<sha>`). Compare it against the plan's implementation commit SHA. If they match, deployment is confirmed. If they don't match, warn the user that production may still be running an older build — the critique can still proceed but production observations may not reflect the plan's changes. When the SHA does not match, also check the GitHub Actions deployment status: use `fetch_webpage` to load `https://github.com/jwgeller/peninsular-reveries/actions` and look for the most recent workflow run. If the run failed or is still in progress, report the status. A failed deployment is a **blocker** — flag it as a critical finding in Phase 4 and recommend the user investigate the Actions log before proceeding with the critique. If GitHub Pages is still deploying (404 or stale SHA), note this and suggest re-checking later.
4. **Fetch production pages.** Use `fetch_webpage` to load the relevant game/site pages at `https://jwgeller.github.io/peninsular-reveries/` and note any obvious issues (broken layout, missing content, error states).
5. **Read process files.** Skim the current versions of:
   - `.github/skills/compose/SKILL.md`
   - `.github/agents/orchestrator.agent.md`
   - `.github/agents/performer.agent.md`
   - `copilot-instructions.md`

Do not read every file end-to-end. Targeted reads for sections relevant to observed issues.

### Phase 2 — User Input

**Auto mode.** If the user invokes the critique with "--auto", "auto", or "no questions" (e.g. "critique --auto"), skip the structured walkthrough. Process any free-form observations the user included in their invocation message, then proceed directly to Phase 3 with the agent's own analysis. The agent still presents full findings in Phase 4 for review — auto mode only skips the questions, not the output.

**Interactive mode (default).** Accept the user's observations through both channels:

**Free-form first.** If the user provides observations when invoking the skill, process those immediately — don't ignore them in favor of the structured flow.

**Then structured walkthrough.** Use `vscode_askQuestions` to walk through four evaluation dimensions. Ask one dimension at a time so the user can respond thoughtfully. Mix multiple-choice with freeform.

#### Dimension 1: Plan Quality
- Were MVT boundaries well-drawn? Any MVTs that should have been split or merged?
- Were dependencies correct? Any ordering issues during dispatch?
- Were intent descriptions specific enough for the sub-agents, or were there gaps?
- Were owned-file lists accurate?

#### Dimension 2: Execution Quality
- Did sub-agents follow the intent faithfully?
- How many post-dispatch corrections did the orchestrator need to make?
- Were there any MVTs that needed re-dispatch or significant rework?
- Did the orchestrator's staleness checks catch real issues or miss any?

#### Dimension 3: End-Result Quality
- Does the shipped product match expectations?
- What bugs or UX gaps did the user find in production?
- Are there visual/layout/interaction issues at specific viewport sizes?
- Does the product feel cohesive, or are there seams between MVT boundaries?

#### Dimension 4: Process & Tooling
- Did the workshop flow add value, or was it friction?
- Did the orchestrator behave correctly (dispatch, review, integration gate)?
- Were there process bottlenecks or wasted cycles?
- Any context-window or session-length issues?

Skip dimensions where the user has nothing to report. Don't force feedback on every axis.

### Phase 3 — Analysis

Cross-reference the three data sources (plan, code, user observations) to identify:

1. **Intent-vs-implementation gaps.** For each MVT, compare the plan's intent description against what actually shipped in the commit diff. Flag:
   - Scope creep (code changes beyond the intent)
   - Incomplete implementation (intent items that didn't land)
   - Drift (the code does something reasonable but different from what was described)

2. **Production issues.** Match user-reported bugs/UX gaps to specific MVTs and code paths. Note whether the issue stems from the plan (bad intent), execution (bad implementation of good intent), or an unforeseen interaction between MVTs.

3. **Process patterns.** Look for recurring themes:
   - Did multiple MVTs hit the same kind of problem?
   - Were certain MVT shapes (large, cross-cutting, research-only) more or less successful?
   - Did the orchestrator's review catch issues that should have been prevented by better intent descriptions?

### Phase 4 — Findings

Produce a structured findings summary. Present it to the user in chat before applying anything.

```
## Critique Findings: [Plan Title]

### What Worked
- [Specific things that went well, with evidence]

### What Didn't
- [Specific problems, each tied to an MVT or process step]

### Blockers
- [Deploy verification failures or Actions errors that prevent production evaluation]

If any blockers exist, the critique should recommend resolving them before the findings are considered complete.

### Corrections for Next Cycle
- [Concrete, actionable changes — not vague aspirations]
  - Plan-level: e.g. "Split UI+logic MVTs even when files are coupled"
  - Process-level: e.g. "Orchestrator should read renderer output before dispatching animation MVT"
  - Skill-level: e.g. "Compose skill should require viewport checkpoint list in visual MVT intents"

### Process File Updates
- [List each file that will be updated and what changes]
```

Get user approval before applying changes.

### Phase 5 — Apply

After user approval:

1. **Append to active score.** Add a `## Critique` section to `/memories/repo/plans/active-score.md` with the findings. Structure:

```markdown
## Critique

Completed: [date]
Evaluated by: user + agent

### What Worked
- ...

### What Didn't
- ...

### Corrections for Next Cycle
- ...
```

2. **Update process files.** Apply approved changes to the relevant files:
   - `.github/skills/compose/SKILL.md` — MVT structure rules, intent requirements, scoping guidelines
   - `.github/agents/orchestrator.agent.md` — dispatch protocol, review steps, staleness checks
   - `.github/agents/performer.agent.md` — constraints, output format
   - `copilot-instructions.md` — session expectations, workflow rules
   - `.github/skills/review/references/*.md` — architecture, game quality, testing conventions

   Only update files where the findings warrant a change. Don't make drive-by improvements.

3. **Archive the score.** Rename `/memories/repo/plans/active-score.md` to `/memories/repo/plans/archive/<YYYY-MM-DD>-<slug>.md` where `<slug>` is the plan title slugified (e.g., `2026-04-06-project-cleanup-consistency.md`). This frees the active-score path for the next session and preserves the full score + critique for historical reference.

4. **Report.** Summarize what was updated, confirm the plan was archived, and state the archive path.

---

## Key Rules

- **Archive, don't delete.** After appending the critique section and updating process files, rename the score to the archive path. The active-score slot should be empty when the critique is done.
- **Evidence over opinion.** Every finding should reference a specific MVT, commit diff, or production observation — not just "this could be better."
- **Actionable corrections only.** Each correction must be concrete enough that a future planner or orchestrator can act on it without interpretation. "Be more specific" is not actionable. "Include viewport checkpoint list for any MVT that touches CSS layout" is.
- **Don't over-correct.** If 13 of 14 MVTs executed cleanly, the process is working. Focus on the gaps, not the defaults.
- **Respect scope.** The critique evaluates the score and its execution. It doesn't redesign the game, propose new features, or start the next composing cycle.
