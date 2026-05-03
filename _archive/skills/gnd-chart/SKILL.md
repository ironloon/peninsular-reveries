---
name: gnd-chart
description: "Structured plan format for manual planning and skill-driven execution. Use when charting multi-step plans intended for gnd-navigate skill dispatch to gnd-diver subagents in any project."
user-invocable: true
disable-model-invocation: true
---

# Chart

Plan multi-step work as structured legs for `gnd-navigate` (skill) to dispatch to `gnd-diver` (subagent).

## Workflow Role

Break the user's goal into bounded, reviewable legs. Project constraints come from project guidance sources, not hidden assumptions.

## Project Context Resolution

Identify authoritative guidance in priority order:

1. User request and attachments
2. Workspace instructions
3. `README.md` and area docs
4. Skills, file instructions, or agent files referenced by those docs
5. Build, test, packaging, deployment, or CI config

Read only what matters. Record useful sources in the plan's `## Project Context`.

---

## Workflow

```text
Discovery → Alignment → Draft → Workshop → Refinement
```

### Phase 1 — Discovery

Explore the codebase: read relevant files, run searches, identify affected modules. Skim archived plans or critiques for prior corrections if they exist. Do not write legs yet.

### Phase 2 — Alignment

One round after Discovery. Summarize findings, then ask scope/approach questions. At minimum: (a) in-scope vs out-of-scope, (b) non-obvious tradeoffs, (c) genuine ambiguities. Skip only when the task maps to a single unambiguous leg.

### Phase 3 — Draft

Present a **plan outline** — not full legs:

- Plan title
- Leg list: ID, label, one-line intent
- Proposed dispatch order

### Phase 4 — Workshop

After the draft, automatically workshop each leg:

1. Present legs one at a time (group tightly coupled ones at your discretion). **One leg per message** — do not batch.
2. For each leg, show in chat:
   - Title, ID
   - **Goal link** — one sentence connecting this leg to the user's overall goal
   - 2–3 bullets of key intent
   - Owned files
   - One alternative or tradeoff if applicable; otherwise state "mechanical"
3. Ask the user. Options: **Approve as-is** (recommended), concrete alternatives from the summary, **Remove**. Freeform always available.
4. Apply feedback immediately. Move to next leg.
5. Mark confirmed legs `Confirmed: yes`.

Do not advance until all legs are confirmed or removed.

### Phase 5 — Refinement

**User Intent confirmation.** Present a 2–4 sentence summary of the user's goal distilled from the conversation. Ask: "Does this capture your goal?" Options: **Looks right** (recommended), **Needs revision**. Update and re-confirm if revised.

Then write the full plan with all fields. Output only:
1. Changes made during workshop
2. Any unconfirmed legs
3. Final dispatch order

The plan file is the source of truth — do not paste the full plan into chat.

---

## Re-entry Triggers

**"review"** or **"walk me through it"**: re-enter workshop for unconfirmed legs, or ask which confirmed leg to revisit. Confirmed legs are not re-presented unless a subsequent change significantly alters their scope.

---

## Plan File Location

Plans live in `.planning/` as `active-plan-YYYY-MM-DD-HHmm-<slug>.md`.

- View existing plans first; leave them in place.
- Each plan gets its own timestamped file. Multiple live plans may coexist.
- Only one plan should be actively dispatched at a time.
- After implementation, leave the plan for critique. `gnd-critique` appends findings then archives.

---

## Plan Structure

```markdown
# Plan: [Short Title]

## Project Context
- Sources:
  - `path/to/doc.md` - why it matters
- Constraints:
  - [Derived rules]
- Full validation:
  - `command` or checklist
- Delivery verification:
  - deployed URL, package check, artifact check, local-only, or `none`

## User Intent
[2-4 sentences confirmed by user during Refinement. Navigator and critique
reference this to evaluate alignment.]

## Legs

### LEG-1: [Area] - [Short description]
- Status: pending
- Confirmed: yes | no
- Goal link: [How this leg serves the User Intent]
- Depends on: none | LEG-N
- Owned files:
  - `path/to/file.ts`
- Read-only:
  - `path/to/reference.ts` - reason
- Deferred shared edits:
  - `shared/file.ts` - what to change
- Verification: `command`
- Intent: [Detailed implementation description]

## Dispatch Order
Sequential via subagent (navigator reviews between each):
1. LEG-1 (label) - no dependencies
2. LEG-2 (label) - depends on LEG-1
After all complete: deferred edits → full validation → delivery verification → commit → push.
```

---

## Field Definitions

| Field | Notes |
|-------|-------|
| **Status** | `pending`, `in-progress`, `done`, `failed`. Only navigator updates during dispatch. |
| **Confirmed** | `yes`/`no`. Set to `yes` on user approval in workshop. Navigator won't dispatch `no`. |
| **Depends on** | `none` or a leg ID. Dispatch Order makes the sequence explicit. |
| **Dispatch agent** | Always `gnd-diver`. If a leg seems too vague, tighten the intent or split it — don't assign a different agent. |
| **Owned files** | Exhaustive list the sub-agent may modify. No globs. One leg per file — never split. Grep during Draft/Workshop to confirm targets exist. |
| **Read-only** | Reference files the sub-agent reads but must not modify. Include a reason. |
| **Deferred shared edits** | Changes to shared files (`package.json`, routers, etc.) the navigator applies after all legs complete. Be precise. |
| **Verification** | Single shell command covering only this leg's files. Not the project's full gate. For test legs: list explicit per-file expected assertions. |
| **Intent** | The critical field. Must be **specific** (name functions, interfaces, selectors), **self-contained** (embed needed constraints), **outcome-oriented** (what code does when done), and **bounded** (number sub-tasks). |

---

## Scoping Guidelines

- **One module or feature per leg** when files are tightly coupled. Don't split types and state that always change together.
- **Split by independence** when modules don't share types.
- **Maximize parallelism** — minimize serial dependency chains.
- **≤15 owned files per leg.** Larger → find a seam to split on. If splitting would break semantic cohesion, keep the leg intact and note why in the intent.
- **Shared files** (`package.json`, `build.ts`, routers, shared styles) never appear in owned sets. Use deferred shared edits.

---

## Embedding Project Constraints

Leg intents must embed relevant project constraints so sub-agents don't rediscover them. Common categories: performance/bundle budgets, layout checkpoints, accessibility, content/copy rules, state/persistence, styling/design-system, build/test/release, motion/audio/media. Include only what affects each leg.

---

## Dispatch Order Section

List legs in dispatch order. Note dependencies and parallelism. The dispatch order must be acyclic — no circular dependencies between legs. End with:

```markdown
After all complete: deferred edits → `## Project Context` full-validation → delivery verification → commit → push.
```

Project-specific sync, packaging, or publish steps belong in `## Project Context`.

---

## Project-Local Extensions

These extensions are merged from the project's local overrides and apply in addition to the base instructions above.

### Backlog Check

At the start of Discovery or Alignment, check whether `.planning/gnd-backlog.md` exists. If it does, skim it for items related to the current request — same game slug, same feature area, or same architectural concern. If any match, surface them to the user before proceeding:

> "There are backlog items related to this request. Do you want to include any of them in this plan?"

List the candidates briefly with their backlog text. Wait for the user's response before continuing. Do not add backlog items to the plan without user confirmation.

### Additional Workshop Checks

**Art and placeholder audit:** For any leg with visual assets, sprite files, or `art.ts` as a read-only reference, scan for emoji or other placeholder art. List each placeholder explicitly in the leg intent as "placeholder — sourcing deferred" or open a companion `creative-assets` leg. Reference the `creative-assets` skill in the intent if sourcing work is in scope.

**Gameplay at viewport (new-mechanic legs):** When a leg introduces or changes a gameplay mechanic, ask: *"Does this mechanic remain clear and comfortable at 390×844 portrait and 844×390 landscape?"* Add responsive gameplay confirmation to the intent alongside layout checkpoints — not just layout correctness. For game-panel layouts with a playfield, add an explicit board-area floor: "the playfield must fill ≥50% of remaining viewport height at 390×844 portrait after all chrome elements."

**Game design lenses (optional, new-mechanic legs):** For legs introducing a new loop or mechanic, run a quick lens check before finalising the intent: Does it satisfy basic Feedback and Loop lenses (Schell)? Is it simple enough for the youngest intended player? Is there enough "toy" quality that experimenting is rewarding without instruction?

**New-game feel probes:** For a new game or toy, run a short idea probe before finalising legs: pressure-test the public name, how the primary mechanic communicates timing/state, and 2-3 concise experiential alternatives. The goal is not a long brainstorm; it is to surface whether the concept is readable and evocative enough before LEG-1 locks routes, shell copy, and other player-facing labels.

**iOS long-press mechanics:** When a leg specifies long-hold, long-press, or sustained-touch mechanics, explicitly require `-webkit-touch-callout: none; user-select: none` on the affected interactive elements in the leg intent. iOS Safari's native copy callout fires at a similar threshold and will intrude on the game UI otherwise.

**Background music legs:** When a leg specifies a background or ambient music profile, require an explicit target volume character in the intent — e.g., "ambient texture, not foreground melody" — or a numeric bus gain reference. The shared `createMusicBus` defaults to 0.20 bus gain; per-event gains of 0.06–0.10 are still perceptible as foreground at that level.

**Recorded SFX audibility gate:** When a leg ships recorded one-shot SFX through `createSfxBus()`, require a final-chain loudness check in the leg's verification — not just human-listen. The shared SFX bus defaults to 0.12 gain with a compressor at threshold −18 dB. Per-sample `gain` values must be sized so the net signal (sample.gain × bus.gain) reaches the compressor's threshold on peaks; otherwise the result reads as silent on phone speakers and many laptops. Suggested floor: per-sample `gain ≥ 1.0` for normal-loudness sources.

**Visual fidelity for stylized DOM/CSS scenes:** When a plan says "stylized DOM/CSS scene" with multiple variants (e.g., several train types, several characters, several environments), the leg intent must declare:
- A single shared scene perspective (side / top-down / 3/4 isometric) that all layers (vehicle, ground, background) follow.
- Per-variant structural specs that make each variant visually distinct (e.g., "high-speed train: aerodynamic nose, no smoke stack, low-profile silhouette").
- Per-car/per-segment differentiation when the variant has multiple cars (e.g., "passenger car: row of windows; cargo car: closed sides with latches; tender: coal hump").

Without these, the implementation tends to ship visually-similar variants that fail the "feels like a real X" bar.

**Density caps for small viewports:** When a leg adds N interactive targets to a single scene, declare an explicit cap for the smallest required viewport (typically 390×844 portrait): "≤4 hotspots visible at 390×844 without overlap; targets ≥44px; horizontal padding ≥8px between adjacent targets." Without a cap, sound-toy and similar plans tend to crowd the playfield.

**Reduce-motion default is a question, not an assumption:** Do not auto-include a "reduce-motion" toggle in Settings just because the repo standard mentions it. For sound toys and other low-animation games, ask during Workshop: *"Does this game have animations that warrant a reduce-motion toggle, or should the toggle be skipped (no animations)?"* The repo standard from `.pi/skills/review/references/game-quality.md` permits skipping the toggle when there are no animations to gate.

**Sandbox budget limits:** For any game with a placement, resource, or move budget, ask during Workshop: *"What is the single-row or single-path saturation threshold — how many placements does it take to block the primary game channel completely?"* The budget must be set below that threshold. Also ask: *"Can a player exhaust the game experience using the budget alone — i.e., is there a state where no more interesting play is possible before the budget runs out?"*

**Pointer interaction on touch (toggle mechanics):** When a leg specifies "tap on empty → place, tap on barrier → remove" or similar touch-toggle behavior, explicitly state this in the leg intent as *"pointer mode is determined by the current cell type at tap, not by mouse button — right-click is not a valid removal path on touch devices."* Do not leave it implied by keyboard behavior.

### Workshop Pacing

**One leg per message.** Do not batch multiple legs into a single chat message during Workshop. Present exactly one leg (or one tightly-coupled group explicitly noted as grouped), then stop and wait for the user's explicit response before advancing to the next leg. Do not present the next leg in the same message as the previous leg's approval.

**User Intent confirmation is a hard gate.** During Refinement, present the User Intent summary and wait for explicit confirmation before writing the plan file. Do not skip or combine this step with final plan output.

### Visual Verification

For visual legs (CSS layout, art, animation): lint alone is insufficient — add a Playwright screenshot assertion, a `page.screenshot` step, or a clearly labeled "manual visual check required" note in the leg intent so the navigator has acceptance criteria beyond lint.

### CSS-Class Alignment Checkpoint

When a plan has separate legs for CSS (styling) and HTML/JSX (controller/markup), the CSS leg's intent must explicitly list every HTML class name the CSS file must define, and the HTML leg's intent must list every CSS class it depends on. After both legs are implemented, the navigator must grep for class names in the HTML/TSX files and cross-reference against CSS selectors — any HTML class without a matching CSS rule, or any CSS class not used in HTML, is a boundary violation.

### Removal Intent Decomposition

When a leg says "remove X" or "strip X," workshop must decompose X into its constituent parts and ask which parts the user values vs. wants gone. Specifically: separate the *player experience* (what happens on screen) from the *tracking/collecting/persistence* mechanism before writing the intent.

### Branching Depth Criteria

When a leg introduces branching narrative with item gating (or similar gating mechanic), the intent must specify a minimum gating density — e.g., "at least N choices require an equipped item," "no complete path avoids item use," or "≥X% of branch points are gated." Without this, the implementation can ship the branching structure but leave the gating mechanic optional on every path.