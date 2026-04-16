# gnd-critique — Peninsular Reveries Local Extensions

These extend the base `SKILL.md` for this project. Applied after base instructions; override on conflict.

## Community Contribution Flag

When a finding or correction surfaces an idea that seems broadly useful beyond this project — a new workshop check, a navigator guard, a chart pattern — flag it explicitly in the Findings output under a **Community Candidate** note:

```
**Community Candidate:** [brief description of the insight and which base skill/agent it would extend]
```

This is a signal to the user to consider contributing the insight upstream to the gnd base skills or agents. Do not add it to the base managed files directly; record it in the appropriate local file and note it as a community candidate so the user can decide whether to submit it.

## Plan Critique — Holding List Cross-Check

Before routing any Beat 3 (or Beat 2) observation to the Field Review Holding List, cross-check it against every leg's intent in the plan. If the observation matches something a leg was supposed to deliver, it is a missed delivery — classify it under **What Didn't** and fix it in PC Phase 5, not the holding list. The holding list is only for observations that genuinely have no leg covering them.

**Community Candidate:** Promote this cross-check to the base `gnd-critique` SKILL.md PC Phase 2 Beat 3 instructions — before routing to the holding list, verify the observation doesn't appear in any leg's intent. Broadly applicable to any plan-based critique workflow.

## Field Review — Delivery Surface Discovery

During FR Phase 1, if no deployed URL is found in the standard context sources (`## Project Context`, workspace instructions, READMEs, skills), do **not** silently mark delivery verification as "not applicable". Instead, ask the user: *"I couldn't find a deployed URL in the project docs — is there one I should check, or is this local-only?"* Proceed with their answer.

If the URL is confirmed, note where it should be recorded (e.g. `README.md`) so future reviews find it automatically.

**Community Candidate:** Promote this guard to the base `gnd-critique` SKILL.md FR Phase 1 step 2 — when the evaluation surface cannot be determined from context, ask before assuming local-only. Broadly useful for any project where deployment docs live outside the standard context files.

## Backlog Transfer

At the end of PC Phase 5, transfer any Field Review Holding List items to `.planning/gnd-backlog.md`. Append them under the appropriate game or area section (create the section if it doesn't exist). Remove them from the plan's Critique section after transfer — they live in the backlog now, not the archive.

If `.planning/gnd-backlog.md` does not exist, create it with a brief header and the items.
