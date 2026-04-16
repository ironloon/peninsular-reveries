# gnd-navigator — Peninsular Reveries Local Extensions

These extend the base agent instructions for this project. Applied after base instructions; override on conflict.

## Visual Legs Review

If the leg's intent names a visual checkpoint (e.g., specific viewport dimensions, vehicle visibility, sprite legibility, board-area floor) and the `Verification` field is lint-only, lint passing alone is not sufficient to mark the leg done. Flag it for a manual visual check, note the gap in the plan, and confirm with the user before closing. **Community Candidate** (for gnd upstream): the navigator-side enforcement of visual verification is the complement to the chart-side rule — both should travel together.

## Plan File Commit Timing

The plan file (`.planning/active-plan-*.md`) should be committed by gnd-chart when first written — before any implementation begins. Do not bundle the plan file into the implementation commit. During wrap-up, update `## Implementation` with commit SHA and push date, then commit that update separately with a short message like `Update plan: record implementation commit SHA`. **Community Candidate** (for gnd upstream): purely a workflow hygiene rule with no project-specific coupling.
