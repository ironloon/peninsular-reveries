# gnd-chart — Peninsular Reveries Local Extensions

These extend the base `SKILL.md` for this project. Applied after base instructions; override on conflict.

## Backlog Check

At the start of Discovery or Alignment, check whether `.planning/gnd-backlog.md` exists. If it does, skim it for items related to the current request — same game slug, same feature area, or same architectural concern. If any match, surface them to the user before proceeding:

> "There are backlog items related to this request. Do you want to include any of them in this plan?"

List the candidates briefly with their backlog text. Wait for the user's response before continuing. Do not add backlog items to the plan without user confirmation.

**Community Candidate** (for gnd upstream): surfacing backlog at chart-time is broadly useful — not project-specific.

## Additional Workshop Checks

**Art and placeholder audit:** For any leg with visual assets, sprite files, or `art.ts` as a read-only reference, scan for emoji or other placeholder art. List each placeholder explicitly in the leg intent as "placeholder — sourcing deferred" or open a companion `creative-assets` leg. Reference the `creative-assets` skill in the intent if sourcing work is in scope.

**Gameplay at viewport (new-mechanic legs):** When a leg introduces or changes a gameplay mechanic, ask: *"Does this mechanic remain clear and comfortable at 390×844 portrait and 844×390 landscape?"* Add responsive gameplay confirmation to the intent alongside layout checkpoints — not just layout correctness. For game-panel layouts with a playfield, add an explicit board-area floor: "the playfield must fill ≥50% of remaining viewport height at 390×844 portrait after all chrome elements." Cramped controls or playfields that work visually but feel awkward are a UX concern, not just a layout concern. **Community Candidate** (for gnd upstream): the viewport floor principle and responsive gameplay distinction are universally applicable to canvas game legs.

**Game design lenses (optional, new-mechanic legs):** For legs introducing a new loop or mechanic, run a quick lens check before finalising the intent: Does it satisfy basic Feedback and Loop lenses (Schell)? Is it simple enough for the youngest intended player? Is there enough "toy" quality that experimenting is rewarding without instruction?

**New-game feel probes:** For a new game or toy, run a short idea probe before finalising legs: pressure-test the public name, how the primary mechanic communicates timing/state, and 2-3 concise experiential alternatives. The goal is not a long brainstorm; it is to surface whether the concept is readable and evocative enough before LEG-1 locks routes, shell copy, and other player-facing labels. **Community Candidate** (for gnd upstream): a compact feel-probe pass for new toy/mechanic plans would generalize beyond this repo.

**iOS long-press mechanics:** When a leg specifies long-hold, long-press, or sustained-touch mechanics, explicitly require `-webkit-touch-callout: none; user-select: none` on the affected interactive elements in the leg intent. iOS Safari's native copy callout fires at a similar threshold and will intrude on the game UI otherwise. **Community Candidate** (for gnd upstream): universal mobile web concern, not project-specific.

**Background music legs:** When a leg specifies a background or ambient music profile, require an explicit target volume character in the intent — e.g., "ambient texture, not foreground melody" — or a numeric bus gain reference. The shared `createMusicBus` defaults to 0.20 bus gain; per-event gains of 0.06–0.10 are still perceptible as foreground at that level.

**Recorded SFX audibility gate:** When a leg ships recorded one-shot SFX through `createSfxBus()`, require a final-chain loudness check in the leg's verification — not just human-listen. The shared SFX bus defaults to 0.12 gain with a compressor at threshold −18 dB. Per-sample `gain` values must be sized so the net signal (sample.gain × bus.gain) reaches the compressor's threshold on peaks; otherwise the result reads as silent on phone speakers and many laptops. Suggested floor: per-sample `gain ≥ 1.0` for normal-loudness sources, with the OfflineAudioContext loudness probe documented in `.github/skills/creative-assets/references/audio-source-notes.md`. **Community Candidate** (for gnd upstream): general principle for any project mixing recorded audio through a quiet shared bus.

**Visual fidelity for stylized DOM/CSS scenes:** When a plan says "stylized DOM/CSS scene" with multiple variants (e.g., several train types, several characters, several environments), the leg intent must declare:
- A single shared scene perspective (side / top-down / 3/4 isometric) that all layers (vehicle, ground, background) follow.
- Per-variant structural specs that make each variant visually distinct (e.g., "high-speed train: aerodynamic nose, no smoke stack, low-profile silhouette").
- Per-car/per-segment differentiation when the variant has multiple cars (e.g., "passenger car: row of windows; cargo car: closed sides with latches; tender: coal hump").

Without these, the implementation tends to ship visually-similar variants that fail the "feels like a real X" bar.

**Density caps for small viewports:** When a leg adds N interactive targets to a single scene, declare an explicit cap for the smallest required viewport (typically 390×844 portrait): "≤4 hotspots visible at 390×844 without overlap; targets ≥44px; horizontal padding ≥8px between adjacent targets." Without a cap, sound-toy and similar plans tend to crowd the playfield.

**Reduce-motion default is a question, not an assumption:** Do not auto-include a "reduce-motion" toggle in Settings just because the repo standard mentions it. For sound toys and other low-animation games, ask during Workshop: *"Does this game have animations that warrant a reduce-motion toggle, or should the toggle be skipped (no animations)?"* The repo standard from `.github/skills/review/references/game-quality.md` permits skipping the toggle when there are no animations to gate.

## Clarifying Questions

**Always use `vscode_askQuestions` for clarifying questions.** When a chart, alignment, or workshop question needs a user response, present it through the askQuestions tool — not as plain prose in chat. This applies to every phase of the chart workflow: Discovery, Alignment, Workshop, and Refinement. The tool gives the user explicit options and structured input that is easier to answer reliably than freeform chat. **Community Candidate** (for gnd upstream): pure UX improvement for any agent-driven workflow that asks the user questions.

**Sandbox budget limits:** For any game with a placement, resource, or move budget, ask during Workshop: *"What is the single-row or single-path saturation threshold — how many placements does it take to block the primary game channel completely?"* The budget must be set below that threshold. Also ask: *"Can a player exhaust the game experience using the budget alone — i.e., is there a state where no more interesting play is possible before the budget runs out?"*

**Pointer interaction on touch (toggle mechanics):** When a leg specifies "tap on empty → place, tap on barrier → remove" or similar touch-toggle behavior, explicitly state this in the leg intent as *"pointer mode is determined by the current cell type at tap, not by mouse button — right-click is not a valid removal path on touch devices."* Do not leave it implied by keyboard behavior.

## Workshop Pacing

**One leg per message.** Do not batch multiple legs into a single chat message during Workshop. Present exactly one leg (or one tightly-coupled group explicitly noted as grouped), then stop and wait for the user's explicit response before advancing to the next leg. Do not present the next leg in the same message as the previous leg's approval. **Community Candidate** (for gnd upstream): pure process discipline, no project coupling.

**Use `vscode_askQuestions` for workshop approvals.** Present the leg summary in chat, then use the askQuestions tool for the approval prompt with options (Approve as-is, Remove, plus any leg-specific alternatives). This keeps the approval interaction structured and reduces friction. **Community Candidate** (for gnd upstream): pure UX improvement, no project coupling.

**User Intent confirmation is a hard gate.** During Refinement, present the User Intent summary and wait for explicit confirmation before writing the plan file. Do not skip or combine this step with final plan output. **Community Candidate** (for gnd upstream): pure process discipline, no project coupling.

## Visual Verification

For visual legs (CSS layout, art, animation): lint alone is insufficient — add a Playwright screenshot assertion, a `page.screenshot` step, or a clearly labeled "manual visual check required" note in the leg intent so the navigator has acceptance criteria beyond lint. **Community Candidate** (for gnd upstream): lint-insufficiency for visual legs is a general pattern, not project-specific.

## Removal Intent Decomposition

When a leg says "remove X" or "strip X," workshop must decompose X into its constituent parts and ask which parts the user values vs. wants gone. Specifically: separate the *player experience* (what happens on screen) from the *tracking/collecting/persistence* mechanism before writing the intent. Example: "remove souvenir collection" could mean removing the collection tracking while keeping the discovery page, or removing both. Ask. **Community Candidate** (for gnd upstream): removal-intent ambiguity is a general charting risk, not project-specific.

## Branching Depth Criteria

When a leg introduces branching narrative with item gating (or similar gating mechanic), the intent must specify a minimum gating density — e.g., "at least N choices require an equipped item," "no complete path avoids item use," or "≥X% of branch points are gated." Without this, the implementation can ship the branching structure but leave the gating mechanic optional on every path.
