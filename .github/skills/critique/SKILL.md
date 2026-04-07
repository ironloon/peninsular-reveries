---
name: critique
description: "Evaluate completed work against intent and production behavior. Two modes: (1) plan critique — evaluates active score after orchestrator push; (2) field review (--field-review / --fr) — captures user production-testing observations independent of any plan, triages them, implements fixes, and archives findings."
user-invocable: true
disable-model-invocation: true
---

# Critique

Two modes. Detect which one from the user's invocation:

| Flag | Mode | When to use |
|------|------|-------------|
| *(default, no flag)* | **Plan critique** | After an orchestrated plan has been pushed and tested. Requires an active score. |
| `--field-review` or `--fr` | **Field review** | User has production-testing observations that don't map to an active score. No plan required. |

---

## Mode: Field Review

The user tests the deployed site on a real device and reports what they see. No active score is needed. The field review triages observations, implements the fixes, and archives findings.

### FR Phase 1 — Gather Context

1. **Verify deployment.** Same as plan critique Phase 1 step 3: fetch `sw.js`, extract SHA from `CACHE_NAME`, compare to `git log --oneline -1` HEAD. Confirm production matches what's in the repo.
2. **Fetch production pages.** Use `fetch_webpage` on the pages the user mentions to capture current rendered state.
3. **Read relevant code.** Based on the user's observations, read the specific source files (controllers, renderers, stylesheets, state modules) that could cause the reported issues. Read enough to form hypotheses — not the whole codebase.
4. **Check archived plans.** Skim `/memories/repo/plans/archive/` for the most recent score(s) that touched the affected areas. This provides lineage — which MVT originally created the code, and whether the issue was previously flagged.

### FR Phase 2 — Triage Observations

Process each user observation and classify it:

| Category | Meaning | Output |
|----------|---------|--------|
| **Bug** | Something is broken — visible defect, wrong behavior, data corruption | Root cause hypothesis with file + line references |
| **UX issue** | Works but feels wrong — confusing, inconsistent, hard to use | Description + what "right" looks like, with evidence from code |
| **Design question** | Not clearly a bug — user is questioning a design decision | Restate the original intent (from plan/code), note the user's concern, flag for composer |
| **Recurring** | Issue has been flagged in a previous critique or prompt cycle | Link to prior finding, escalate priority |

For each observation, include:
- **What the user reported** (their words)
- **Category** (from table above)
- **Evidence** (code references, production page content, prior critique findings)
- **Hypothesis** (what's causing it and where the fix lives)
- **Severity** (blocker / high / medium / low)

### FR Phase 3 — Findings & Plan

Present triaged findings to the user in chat, then immediately propose an implementation plan. Don't stop at documentation.

Structure:

```
## Field Review: [Area/Game Name]

Date: [date]
Device: [if user mentioned]
Deployment: [SHA confirmed/mismatch]

### Findings

#### 1. [Short title]
- **Reported:** [user's words, condensed]
- **Category:** Bug / UX issue / Design question / Recurring
- **Severity:** blocker / high / medium / low
- **Evidence:** [file:line references, production observations]
- **Hypothesis:** [root cause + where to fix]

...

### Implementation Plan
Ordered list of fixes to implement, with files and approach for each.
Items marked "Design question" are flagged but not implemented — the user decides.

### Process Observations
If findings reveal a gap in any skill, agent, or workflow file, note the process-level correction. All skills — including the critique skill itself — are eligible for improvement. Otherwise omit.
```

### FR Phase 4 — Implement

After presenting findings, proceed to implement fixes (bugs and UX issues). Design questions are presented to the user for a decision before acting. Work through fixes in severity order (blockers first).

Run tests after each fix. If tests break, diagnose and resolve before moving on.

### FR Phase 5 — Deploy & Re-verify

1. **Run full validation.** `npm run test:local` + `npm run build`.
2. **Commit and push** with a descriptive message summarizing the field review fixes.
3. **Confirm deployment.** Wait for the Actions run to succeed (`gh run list --limit 1`). Then fetch the production `sw.js` and confirm the deployed SHA matches the commit just pushed.
4. **Instruct user to hard-refresh.** Service workers cache aggressively. Tell the user: "Force-close your browser, reopen, and reload the page. If issues persist, go to Settings → Safari → Clear Website Data (or equivalent)." Do not declare the field review complete until the user confirms they see the new version.
5. **User re-verifies on device.** The user tests the same observations from Phase 2 on the same device. Any findings that persist or new findings that appear trigger a new round of Phase 4 fixes. This loop continues until the user confirms the issues are resolved.
6. **Only then: archive.** Create `/memories/repo/plans/archive/<YYYY-MM-DD>-field-review-<slug>.md` with the findings + what was implemented + what was re-verified. Same archive directory as plan critiques.
7. **Update process files** if findings reveal a process gap.

---

## Mode: Plan Critique

Use after an orchestrated plan has been implemented, pushed, and tested in production.

The plan critique evaluates what worked, what didn't, and feeds corrections forward into both the active score (for the next composer to read) and the process files themselves (compose skill, orchestrator agent, copilot instructions, review references).

### Workflow

```
Gather Context → User Input → Analysis → Findings → Apply
```

### PC Phase 1 — Gather Context

Collect everything needed for evaluation before engaging the user:

1. **Read the active score.** Use `memory` to view `/memories/repo/plans/active-score.md`. Parse all MVTs, their intents, owned files, dispatch order, and status. Look for the `## Implementation` section — it contains the commit SHA the orchestrator recorded after pushing.
2. **Read the implementation commit(s).** If the plan has an `## Implementation` section, use that SHA directly. Otherwise, run `git log --oneline -5` to find the commit(s) that landed the plan. Then run `git show <sha> --stat` for a file-level summary and `git diff <sha>~1 <sha> -- <specific files>` for targeted diffs when evaluating individual MVTs.
3. **Verify deployment.** Fetch the production service worker at `https://ironloon.github.io/peninsular-reveries/sw.js` using `fetch_webpage`. Extract the SHA from the `CACHE_NAME` value (format: `<prefix>-<sha>`). Compare it against the expected commit SHA. If they don't match, check deployment status via `gh run list --limit 3 --json status,conclusion,headSha` (faster than scraping the Actions page). A failed deployment is a **blocker**.
4. **Fetch production pages.** Use `fetch_webpage` to load the relevant game/site pages at `https://ironloon.github.io/peninsular-reveries/` and note any obvious issues (broken layout, missing content, error states).
5. **Read process files.** Skim the current versions of:
   - `.github/skills/compose/SKILL.md`
   - `.github/agents/orchestrator.agent.md`
   - `.github/agents/performer.agent.md`
   - `copilot-instructions.md`

Do not read every file end-to-end. Targeted reads for sections relevant to observed issues.

### PC Phase 2 — User Input

Process any free-form observations the user included in their invocation message, then proceed directly to Phase 3 with the agent's own analysis. Do not ask structured questions or use `vscode_askQuestions`. The user provides feedback at invocation time (or in follow-up messages after seeing findings) — there is no interactive walkthrough.

If the user provides no observations, that's fine — proceed with the agent's analysis of the plan, code, and production state alone.

### PC Phase 3 — Analysis

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

### PC Phase 4 — Findings

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

### PC Phase 5 — Apply

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

2. **Update process files.** Apply approved changes to the relevant files. Every skill, agent, and instruction file is eligible — not just the ones most commonly touched:
   - `.github/skills/compose/SKILL.md` — MVT structure rules, intent requirements, scoping guidelines
   - `.github/skills/critique/SKILL.md` — this skill itself: triage categories, phase workflow, archive format
   - `.github/skills/review/SKILL.md` — quality standards, testing conventions, architecture references
   - `.github/skills/wayback/SKILL.md` — archive browsing, plan history search
   - `.github/skills/creative-assets/SKILL.md` — asset sourcing, licensing, attribution workflow
   - `.github/agents/Orchestrator.agent.md` — dispatch protocol, review steps, staleness checks
   - `.github/agents/performer.agent.md` — constraints, output format
   - `copilot-instructions.md` — session expectations, workflow rules

   Only update files where the findings warrant a change. Don't make drive-by improvements.

3. **Archive the score.** Rename `/memories/repo/plans/active-score.md` to `/memories/repo/plans/archive/<YYYY-MM-DD>-<slug>.md` where `<slug>` is the plan title slugified (e.g., `2026-04-06-project-cleanup-consistency.md`). This frees the active-score path for the next session and preserves the full score + critique for historical reference.

4. **Report.** Summarize what was updated, confirm the plan was archived, and state the archive path.

---

## Key Rules (Both Modes)

- **Archive, don't delete.** After appending the critique section and updating process files, rename the score to the archive path. The active-score slot should be empty when the critique is done.
- **Evidence over opinion.** Every finding should reference a specific MVT, commit diff, or production observation — not just "this could be better."
- **Actionable corrections only.** Each correction must be concrete enough that a future planner or orchestrator can act on it without interpretation. "Be more specific" is not actionable. "Include viewport checkpoint list for any MVT that touches CSS layout" is.
- **Don't over-correct.** If 13 of 14 MVTs executed cleanly, the process is working. Focus on the gaps, not the defaults.
- **Respect scope.** Plan critique evaluates what shipped — it doesn't redesign the game or start a new composing cycle. Field review implements fixes for what the user observed, but design questions get flagged for the user to decide before acting.
