## Workflow

`README.md` is the source of truth for game principles and site values.

For project architecture, game quality standards, and testing conventions, load the `review` skill in `.github/skills/review/` before doing substantial repo work.

## Session Expectations

- Default to **human-ready completion** for non-trivial feature work. Do not stop at code edits alone when the clear user intent is "ready for me to try it." Continue through generated-file sync, repository validation, and low-risk regression fixes unless the user explicitly scopes the work smaller.
- Treat **`npm run test:local`** as the preferred end-state check before handoff when the change is large enough to affect app behavior beyond a single isolated file.
- If a validation run finds an **objective blocker to human testing** that was introduced or exposed by the current work, fix it before stopping when the fix is clear and low-risk.
- Ask the user a clarifying question only when the answer would materially change the implementation, or when proceeding would require a destructive, irreversible, or product-direction choice. If a reasonable default exists, use it and keep going.
- If the user says some version of **"continue until done"**, interpret "done" as **human-ready unless genuinely blocked**.
- If the user says **"wrap it up"** or otherwise makes it clear that **pushing finished work is welcome**, treat that as permission to finish the current task end-to-end. When the work is validated and human-ready, and the commit scope is clear with no ambiguous unrelated changes, the agent may stage the intended files, create a concise commit, and push without asking for one more round of confirmation. If the working tree is mixed or risky, stop short of commit/push and explain the blocker briefly.
- Keep the closeout focused on readiness. Do **not** default to optional extra suggestions or "I can also..." follow-ups unless the user explicitly asked for options, something still blocks human readiness, or there is a single obvious next required step outside the repo work already completed.
- When everything needed for human testing is complete, end with what changed and what was verified. Avoid trailing suggestions for unrelated polish or future work.

## Plan Mode

- When producing plans, write extremely detailed step-by-step plans with explicit file paths, function names, exact commands when helpful, contingency steps for likely failure points, and clear verification gates.
- Assume the executing agent is less capable and needs unambiguous instructions. Avoid shorthand, omitted steps, or "figure it out" transitions.
- Include rollback or recovery notes for risky edits.
- Write plans with calm, supportive framing so the executing agent has enough context and confidence to finish the whole job without extra prompting.

## Executing Agent Guidance

- You are capable of completing every step in an approved plan. When you finish one step, immediately start the next. Do not stop partway through a plan to ask whether you should continue.
- Keep momentum through the checkpoints built into the plan. Finish the current phase before pausing unless you hit a real blocker.
- If you hit an error, diagnose it and fix it. If you are genuinely stuck, explain the specific blocker. Do not abandon the remaining steps.
- After completing all planned work, run the relevant verification. If it passes, report what changed and what was verified.
- Do not suggest follow-up work, future ideas, or extra polish unless the user explicitly asks. The goal is completion of the approved scope, not expansion of scope.

## Environment Context

- Dev OS: Windows
- CI OS: Ubuntu (`ubuntu-latest`)
- Shell: PowerShell
- Node: `24.14.1`
- npm: `11.12.0`
- Editor: VS Code with GitHub Copilot
- GitHub CLI: `gh` is available and should be assumed authenticated; if auth fails, help the user recover and use `gh --help` for command discovery.
- No Docker or container workflow is expected; use direct Node execution.

## Key Commands

- `npm run dev` — local dev server
- `npm run check` — lint + typecheck
- `npm run test:local` — full local validation gate
- `npm run build` — static build
- `npm run sync:attributions` — regenerate `ATTRIBUTIONS.md`

`npm install` configures the repo-owned pre-commit hook, and the hook runs `npm run test:local` automatically.
