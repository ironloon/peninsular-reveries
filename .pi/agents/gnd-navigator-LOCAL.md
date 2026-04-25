# Local Overrides for gnd-navigator

Project-specific extensions that apply in addition to the base instructions above.

## ⚠️ Investigation Needed: LOCAL.md Not Merging at Runtime

Observed 2025-04-24: Ran `gnd-navigator` with task `"dive"` — one of the extended bootstrap cues defined below. The navigator did NOT treat it as a bootstrap cue. Instead it performed a full codebase reconnaissance (725k tokens, 3m14s) and never dispatched a single `gnd-diver` or read the plan in `.planning/`.

The base `gnd-navigator.md` lists only base cues (`cue`, `start`, `run`, `dispatch`, `go`, `begin`, `active plan`). The extended cues (`dive`, `submerge`, `🤿`, etc.) are only in this LOCAL.md file. It appears **this LOCAL.md was not merged into the effective system prompt at runtime**, so the model never saw the extended cue list.

Suspected cause: The agent config uses `systemPromptMode: replace` and `inheritSkills: false`. The base prompt says "Project-local extensions are merged," but pi-subagents may not actually perform that merge for agent LOCAL.md files. Needs confirmation of how pi-subagents handles LOCAL.md merging for agents vs. skills.

## Do Not Edit This Agent File Directly

Do not edit `gnd-navigator.md` directly. All project-local overrides go in this file. The base agent file may be updated via npm and any local edits would be overwritten. If you need to change the base behavior, propose it as a community candidate instead.

### Parallel Dispatch

When multiple legs are dispatchable simultaneously (status `pending`, `Confirmed: yes`, and all dependencies `done`), dispatch them in a single parallel batch instead of one at a time.

**Conflict detection.** Before parallel dispatch, compare owned files across all candidate legs. Two legs **conflict** if they share any owned file. Conflicting legs MUST NOT run in the same parallel batch — dispatch them sequentially instead.

**Composing a parallel batch:**
1. Find all dispatchable legs (base protocol step 4).
2. Group them into conflict-free subsets using a greedy algorithm: add the next dispatchable leg to the current batch only if it shares no owned files with any leg already in the batch; otherwise start a new sub-batch.
3. Dispatch the first conflict-free batch using:
   ```
   subagent({
     tasks: [
       { agent: "gnd-diver", task: "<composed prompt for LEG-N>" },
       { agent: "gnd-diver", task: "<composed prompt for LEG-M>" },
       ...
     ],
     concurrency: <batch size>
   })
   ```
4. After the entire batch completes, review EACH leg's results individually (scope check, verification command — base protocol step 9 applied per leg).
5. Mark each leg `done` or `failed` based on its own review.
6. Find newly dispatchable legs. Group into conflict-free batches. Repeat.

**Review order within a batch.** Review legs that unblock downstream dependents first. If LEG-1 has LEG-2 waiting on it, review LEG-1 before reviewing other legs in the same batch — this allows the next batch to start sooner. If no leg in the batch has pending dependents, review order does not matter.

**Parallel-batch review.** Apply steps 9a–9j from the base protocol to EACH leg in the batch. If one leg fails but others succeed, mark the successful legs `done` and escalate or re-dispatch only the failing leg. Do NOT re-dispatch the entire batch.

**Status marking.** Mark ALL legs in a batch `in-progress` before dispatching (using `edit` on the plan file for each). Mark each `done` or `failed` individually after its own review completes.

**Sequential fallback.** If pi-subagents' `tasks` mode is not available, fall back to the base sequential dispatch (one leg at a time).

**Extended bootstrap cues.** In addition to the base agent's recognized startup cues (`cue`, `start`, `run`, `dispatch`, `go`, `begin`, `active plan`), also treat the following as bootstrap-only cues (ignore as plan input, resolve the live plan from memory): `dive`, `dive dive dive`, `dive, dive, dive!`, `submerge`, `🤿`.

**Conflict-free batching example (active plan):**
- Batch 1 contains {LEG-1, LEG-3, LEG-4, LEG-5, LEG-8}, but LEG-1 and LEG-3 both own `public/styles/train-sounds.css`.
- Conflict-free sub-batches: 1a = {LEG-1, LEG-4, LEG-5, LEG-8}, 1b = {LEG-3} (after LEG-1 lands).
- Navigator dispatches sub-batch 1a in parallel, reviews all four results, then dispatches LEG-3 sequentially.

### Audio Manifest Review

When reviewing a leg that adds or modifies a sample manifest (any `sample-manifest.ts`), check that `bundled: true` entries have corresponding audio files on disk. Run `ls public/<slug>/audio/` and verify the `.ogg` files exist for every bundled sample. A manifest with `bundled: true` and missing files produces a game with silent audio — mark this as a review failure and either re-dispatch with fetch instructions or change to `bundled: false` as a deferred edit.

### CSS/HTML Class Cross-Reference (Extended)

When reviewing a visual leg that adds or modifies CSS, grep for all `className=` strings in the game's TSX/controller files **and** all `classList.add` / `classList.toggle` / `classList.remove` calls in the game's TS/JS files. Cross-check all of these against CSS class selectors. Any HTML class or classList target without a matching CSS rule is a boundary violation. Conversely, any CSS class selector that never appears in HTML or classList is dead CSS that signals a naming mismatch. Fix before marking the leg done.