# gnd-navigator — Peninsular Reveries Local Extensions

These extend the base agent instructions for this project. Applied after base instructions; override on conflict.

## Visual Legs Review

If the leg's intent names a visual checkpoint (e.g., specific viewport dimensions, vehicle visibility, sprite legibility, board-area floor) and the `Verification` field is lint-only, lint passing alone is not sufficient to mark the leg done. Flag it for a manual visual check, note the gap in the plan, and confirm with the user before closing. **Community Candidate** (for gnd upstream): the navigator-side enforcement of visual verification is the complement to the chart-side rule — both should travel together.

## Runtime Wiring Review

If a leg creates a helper module or claims a user-facing affordance layer (live regions, indicators, prompts, overlays, and similar), file presence is not enough. During review, verify that the runtime imports or calls the helper, or that the affordance produces at least one observable effect in browser or test verification, before marking the leg done. **Community Candidate** (for gnd upstream): general review guard for shipped behavior vs. file-only completion.

## Plan File Commit Timing

The plan file (`.planning/active-plan-*.md`) should be committed by gnd-chart when first written — before any implementation begins. Do not bundle the plan file into the implementation commit. During wrap-up, update `## Implementation` with commit SHA and push date, then commit that update separately with a short message like `Update plan: record implementation commit SHA`. **Community Candidate** (for gnd upstream): purely a workflow hygiene rule with no project-specific coupling.

## Clarifying Questions

**Always use `vscode_askQuestions` for navigator-side user prompts.** When the navigator needs the user's input — gating questions between legs, ambiguity escalations from a diver, integration-gate decisions, or wrap-up confirmations — present them through the askQuestions tool rather than as prose. **Community Candidate** (for gnd upstream): pure UX improvement, no project coupling.
