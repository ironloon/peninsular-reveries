---
name: wayback
description: "Browse and search archived plans and critiques. Use when the user wants to review past work: what was planned, what shipped, what went wrong, or how a specific game or area was handled before."
user-invocable: true
---

# Wayback

Search and browse archived plans stored in `/memories/repo/plans/archive/`. Each archive contains the full plan (WUs, dispatch order, implementation commit) and its critique findings.

---

## Workflow

### Step 1 — List archives

Use `memory view` on `/memories/repo/plans/archive/` to list all archived plans. Present them as a dated list with plan titles.

### Step 2 — Understand the query

If the user asked a specific question (e.g., "how did we handle chompers last time?", "what corrections came out of the cleanup plan?"), identify which archive(s) are relevant by date or title.

If the user just said "wayback" with no specific query, show the list and ask what they want to look up.

### Step 3 — Read and answer

Read the relevant archive(s) using `memory view`. Answer the user's question by referencing specific WUs, critique findings, or implementation details from the score.

Common queries:
- **"What went wrong with X?"** — Read the critique's "What Didn't" section and find WUs touching the relevant area.
- **"How did we handle X last time?"** — Find WUs by owned files or intent keywords.
- **"What corrections have we made?"** — Collect "Corrections for Next Cycle" across all archived critiques.
- **"Show me the full plan for X"** — Read and summarize the archive.
- **"Any patterns across plans?"** — Read all critiques and look for recurring themes in "What Didn't" and "Corrections."

### Step 4 — Surface insights

If the user is asking in the context of planning new work, highlight relevant lessons: WU shapes that worked or failed, scoping patterns, owned-file mistakes, or process gaps that were corrected.

---

## Key Rules

- **Read-only.** Never modify archived plans.
- **Concise answers.** Don't dump entire plans unless asked. Summarize and quote the relevant sections.
- **Cross-reference when useful.** If multiple archives touch the same game or pattern, note the trend.
