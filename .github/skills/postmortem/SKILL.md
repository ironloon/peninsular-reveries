---
name: postmortem
description: "Evaluate a completed plan's implementation against its intent, production behavior, and process quality. Use after the orchestrator has pushed and the user has tested in production. Produces findings that feed forward into the next planning cycle."
user-invocable: true
disable-model-invocation: true
---

# Post-Mortem

Use this skill after an orchestrated plan has been implemented, pushed, and tested in production. The user invokes this directly — it is never auto-loaded.

The post-mortem evaluates what worked, what didn't, and feeds corrections forward into both the active plan (for the next planner to read) and the process files themselves (planning skill, orchestrator agent, copilot instructions, review references).

---

## Workflow

```
Gather Context → User Input → Analysis → Findings → Apply
```

### Phase 1 — Gather Context

Collect everything needed for evaluation before engaging the user:

1. **Read the active plan.** Use `memory` to view `/memories/repo/plans/active-plan.md`. Parse all WUs, their intents, owned files, dispatch order, and status. Look for the `## Implementation` section — it contains the commit SHA the orchestrator recorded after pushing.
2. **Read the implementation commit(s).** If the plan has an `## Implementation` section, use that SHA directly. Otherwise, run `git log --oneline -5` to find the commit(s) that landed the plan. Then run `git show <sha> --stat` for a file-level summary and `git diff <sha>~1 <sha> -- <specific files>` for targeted diffs when evaluating individual WUs.
3. **Verify deployment.** Fetch the production root service worker at `https://jwgeller.github.io/peninsular-reveries/sw.js` using `fetch_webpage`. Extract the SHA from the `CACHE_NAME` value (format: `<prefix>-<sha>`). Compare it against the plan's implementation commit SHA. If they match, deployment is confirmed. If they don't match, warn the user that production may still be running an older build — the postmortem can still proceed but production observations may not reflect the plan's changes. If GitHub Pages is still deploying (404 or stale SHA), note this and suggest re-checking later.
4. **Fetch production pages.** Use `fetch_webpage` to load the relevant game/site pages at `https://jwgeller.github.io/peninsular-reveries/` and note any obvious issues (broken layout, missing content, error states).
5. **Read process files.** Skim the current versions of:
   - `.github/skills/planning/SKILL.md`
   - `.github/agents/orchestrator.agent.md`
   - `.github/agents/worker.agent.md`
   - `copilot-instructions.md`

Do not read every file end-to-end. Targeted reads for sections relevant to observed issues.

### Phase 2 — User Input

**Auto mode.** If the user invokes the postmortem with "--auto", "auto", or "no questions" (e.g. "postmortem --auto"), skip the structured walkthrough. Process any free-form observations the user included in their invocation message, then proceed directly to Phase 3 with the agent's own analysis. The agent still presents full findings in Phase 4 for review — auto mode only skips the questions, not the output.

**Interactive mode (default).** Accept the user's observations through both channels:

**Free-form first.** If the user provides observations when invoking the skill, process those immediately — don't ignore them in favor of the structured flow.

**Then structured walkthrough.** Use `vscode_askQuestions` to walk through four evaluation dimensions. Ask one dimension at a time so the user can respond thoughtfully. Mix multiple-choice with freeform.

#### Dimension 1: Plan Quality
- Were WU boundaries well-drawn? Any WUs that should have been split or merged?
- Were dependencies correct? Any ordering issues during dispatch?
- Were intent descriptions specific enough for the sub-agents, or were there gaps?
- Were owned-file lists accurate?

#### Dimension 2: Execution Quality
- Did sub-agents follow the intent faithfully?
- How many post-dispatch corrections did the orchestrator need to make?
- Were there any WUs that needed re-dispatch or significant rework?
- Did the orchestrator's staleness checks catch real issues or miss any?

#### Dimension 3: End-Result Quality
- Does the shipped product match expectations?
- What bugs or UX gaps did the user find in production?
- Are there visual/layout/interaction issues at specific viewport sizes?
- Does the product feel cohesive, or are there seams between WU boundaries?

#### Dimension 4: Process & Tooling
- Did the workshop flow add value, or was it friction?
- Did the orchestrator behave correctly (dispatch, review, integration gate)?
- Were there process bottlenecks or wasted cycles?
- Any context-window or session-length issues?

Skip dimensions where the user has nothing to report. Don't force feedback on every axis.

### Phase 3 — Analysis

Cross-reference the three data sources (plan, code, user observations) to identify:

1. **Intent-vs-implementation gaps.** For each WU, compare the plan's intent description against what actually shipped in the commit diff. Flag:
   - Scope creep (code changes beyond the intent)
   - Incomplete implementation (intent items that didn't land)
   - Drift (the code does something reasonable but different from what was described)

2. **Production issues.** Match user-reported bugs/UX gaps to specific WUs and code paths. Note whether the issue stems from the plan (bad intent), execution (bad implementation of good intent), or an unforeseen interaction between WUs.

3. **Process patterns.** Look for recurring themes:
   - Did multiple WUs hit the same kind of problem?
   - Were certain WU shapes (large, cross-cutting, research-only) more or less successful?
   - Did the orchestrator's review catch issues that should have been prevented by better intent descriptions?

### Phase 4 — Findings

Produce a structured findings summary. Present it to the user in chat before applying anything.

```
## Post-Mortem Findings: [Plan Title]

### What Worked
- [Specific things that went well, with evidence]

### What Didn't
- [Specific problems, each tied to a WU or process step]

### Corrections for Next Cycle
- [Concrete, actionable changes — not vague aspirations]
  - Plan-level: e.g. "Split UI+logic WUs even when files are coupled"
  - Process-level: e.g. "Orchestrator should read renderer output before dispatching animation WU"
  - Skill-level: e.g. "Planning skill should require viewport checkpoint list in visual WU intents"

### Process File Updates
- [List each file that will be updated and what changes]
```

Get user approval before applying changes.

### Phase 5 — Apply

After user approval:

1. **Append to active plan.** Add a `## Post-Mortem` section to `/memories/repo/plans/active-plan.md` with the findings. This section persists so the next planner reads it and incorporates corrections. Structure:

```markdown
## Post-Mortem

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
   - `.github/skills/planning/SKILL.md` — WU structure rules, intent requirements, scoping guidelines
   - `.github/agents/orchestrator.agent.md` — dispatch protocol, review steps, staleness checks
   - `.github/agents/worker.agent.md` — constraints, output format
   - `copilot-instructions.md` — session expectations, workflow rules
   - `.github/skills/review/references/*.md` — architecture, game quality, testing conventions

   Only update files where the findings warrant a change. Don't make drive-by improvements.

3. **Report.** Summarize what was updated and confirm the plan file now has its post-mortem section.

---

## Key Rules

- **Do not delete the active plan.** The plan with its post-mortem section stays in place until the next planning session reads it and replaces it.
- **Evidence over opinion.** Every finding should reference a specific WU, commit diff, or production observation — not just "this could be better."
- **Actionable corrections only.** Each correction must be concrete enough that a future planner or orchestrator can act on it without interpretation. "Be more specific" is not actionable. "Include viewport checkpoint list for any WU that touches CSS layout" is.
- **Don't over-correct.** If 13 of 14 WUs executed cleanly, the process is working. Focus on the gaps, not the defaults.
- **Respect scope.** The post-mortem evaluates the plan and its execution. It doesn't redesign the game, propose new features, or start the next planning cycle.
