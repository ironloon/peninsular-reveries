# Game Quality

## Layout

- Game screens should be full-screen with no document scrolling on any target device.
- Prefer `height: 100dvh`, `min-height: 100svh`, grid layouts with `minmax(0, 1fr)`, and safe-area padding using `env(safe-area-inset-*)`.
- On short mobile and landscape viewports, compress chrome such as headers, toolbars, and status bars instead of clipping content.
- Content should not be cut off. If a layout cannot fit, tighten the layout before accepting scroll as a fallback.
- On active game screens, the playfield must remain the dominant element. At 390×844 portrait, the playfield should fill ≥50% of the remaining height after all chrome (headers, toolbars, control bars). Audit the combined height of all fixed chrome elements against the viewport before declaring a layout leg done.
- Keep consistent edge buffers around the screen.

## Pacing

- Favor narrative, calm, user-controlled pacing over reflex or QTE mechanics.
- Do not introduce timing-based failure states unless the user explicitly asks for them.
- Let players choose when to proceed at key beats, especially at emotionally important moments.

## Reading Level

- In-game copy should read at roughly a level-1 reading level.
- Prefer short words, short sentences, and one or two sentences per beat.
- Keep narrative language simple and immersive, not noisy or overly gamey.

## Real-World Sourcing

- When referencing real missions, people, or events, use verified public sources.
- Prefer NASA, ESA, CSA, or other primary public-domain or official sources.
- Add attribution entries in the relevant `games/<game>/attributions.ts` file and sync `ATTRIBUTIONS.md` afterward.

## Visual and Logical Consistency

- Visual feedback must match gameplay logic.
- If hit testing or movement uses percentage-based coordinates, visual ranges must scale with the same frame of reference.
- Avoid fixed pixel motion values when gameplay space is responsive.
- For stylized DOM/CSS scenes with multiple variants (e.g., several vehicles, characters, or environments), declare a single shared scene perspective (side, top-down, or 3/4 isometric) and apply it consistently across all scene layers — vehicle, ground, background, and any overlays. Mixing perspectives (e.g., top-down tracks beneath a side-view train) reads as broken even when individual elements look correct.
- Multi-variant scenes must give each variant a structurally distinct silhouette and per-segment differentiation when the variant has multiple parts (e.g., passenger car windows vs. cargo car latches; high-speed train aerodynamic nose vs. steam train smoke stack). Variants that differ only by color tend to read as the same object.

## Orientation Coverage

- Verify portrait phone, landscape phone, landscape tablet, and desktop.
- Recommended checkpoints:
  - `390x844`
  - `844x390`
  - `1024x768`
  - `1280x800`
- For legs introducing or changing gameplay mechanics, verify the mechanic is clear and comfortable at each checkpoint — not just layout correctness. Cramped choice lists, inventory bars, or interactive overlays that work visually but feel awkward to use are a UX concern, not just a layout concern.

## Input Coverage

- Every game must support keyboard, touch/pointer, and gamepad input (README principle 1).
- For game interactions that rely on long-press or sustained-touch mechanics (hold threshold ~300–500ms), apply `-webkit-touch-callout: none; user-select: none` on the interactive elements. iOS Safari's native copy callout fires at a similar threshold and will overlay the game UI otherwise. `touch-action: manipulation` does not suppress the callout.
- Gamepad support requires: D-pad navigation between interactive elements, A/Button-0 for select, Start/Button-9 for menu/settings.
- Analog stick navigation should use ±0.5 dead zone thresholds and 200ms debounce between actions.
- Tab order and arrow-key navigation must work independently of gamepad polling.
- When refactoring input handling, verify all three input methods still function.
- Gamepad connection/disconnection should be handled gracefully (no errors when controller is unplugged mid-game).

## Bug Fix Escalation

- When a reported bug survives a fix attempt, escalate investigation before guessing again: dump computed styles and stacking context for visual bugs, bisect CSS rules, toggle pseudo-elements, or add diagnostic logging. Do not repeat surface-level guesses across multiple rounds.
- **Diagnose before coding.** When the user reports “X is broken,” reproduce the exact failure path mentally (or with tests) before writing a fix. Especially: determine which element types, event types, and browser quirks are involved.
- **One fix, one deploy.** Do not ship a speculative fix and wait for the user to re-test. If you’re not confident the fix addresses the root cause, investigate further first.
- **Read the game loop end-to-end** before fixing game progression bugs. Stuck-state bugs are usually missing auto-advance logic, not event handler issues.
- **iOS Safari deserves its own mental model.** Events, layout, font rendering, and animation timing all behave differently. Check the iOS Safari Rules in architecture.md before fixing any mobile bug.
- **Ask what the user actually sees.** "Stuck" can mean: event not firing, state not advancing, render not updating, or auto-advance missing. Narrow down which layer before choosing a fix strategy.

## Educational Content

- When a game has learning objectives, ground difficulty progression in published research. See the [educational research](./educational-research.md) reference for approved sources.
- Document the research basis for number ranges and difficulty levels in code comments adjacent to the defining constants.
- Level progression should be age-appropriate: Level 1 should be accessible to the youngest intended audience, each level adds a research-supported step.
- Avoid difficulty jumps that span more than one grade level within a single level step.

## Per-Game Visual Identity

- Each game defines its own typographic identity via CSS custom properties.
- Required properties: `--font` (body/UI text), `--font-title` (display/heading font — may be the same as `--font` or a dedicated display font).
- Title fonts should reinforce the game's personality (e.g., bulbous/rounded for a kids' math game, sharp/technical for a space game, handwritten for a word game).
- Web fonts are permitted for title/display use when the subset is ≤ 5KB WOFF2, self-hosted under `public/{game}/`, and licensed as OFL or CC0.
- System font stacks remain the default for body/UI text. Web fonts for body text need strong justification.
- Each game's font choices should be documented as a `@font-face` block at the top of its CSS file with a comment explaining the choice.
- Add font attributions to `ATTRIBUTIONS.md` with license type.

## Zoom Recovery

- Games must not set `user-scalable=no` or `maximum-scale=1` in the viewport meta (WCAG 1.4.4 requires user zoom).
- All games use `touch-action: manipulation` on interactive areas to prevent double-tap zoom.
- The `setupZoomReset()` helper exists in `renderer.ts` files and may be called if needed, but no visible "Reset Zoom" button in the HUD is required.

## In-Game Menu Standard

Every game's settings modal uses a two-tab layout (Settings / Info) rendered by `GameTabbedModal`. An X close button (`aria-label="Close menu"`, `id="settings-close-btn"`, `className="modal-close"`) appears in the top-right corner of the dialog. The footer inside the dialog contains exactly two actions: **Restart** (a `<button>` with `id="restart-btn"` wired in the game's `main.ts`, returns player to the game's own start screen — no navigation away from the page) and **Quit** (an `<a>` element pointed at the site root via `withBasePath('/', siteBasePath)`, `className="...-quit-link"`). Use the exact labels "Restart" and "Quit". The former "Home" link in existing games must be relabeled "Quit". Games still using the legacy `GameSettingsModal` will be migrated to `GameTabbedModal` in a future migration pass. Restart does not apply on the start screen itself (hide or omit in that context if needed, but consistency across games is more important — keeping it visible and simply re-showing the same screen is acceptable).

The Settings tab includes audio toggles (SFX, music when applicable). A reduce-motion toggle is **only** included when the game actually has animations to gate. Sound toys and other low-animation experiences should skip the reduce-motion toggle entirely rather than ship a no-op control.

## Quality Benchmarks

Aspirational references for design decisions in Peninsular Reveries:

**PBS Kids (pbskids.org)**
- Warm, inviting visuals with high contrast
- Simple, consistent navigation patterns children can learn
- Content is never scary, violent, or shame-based
- Pacing is calm and forgiving — wrong answers get gentle feedback, not punishment
- Accessible via keyboard and assistive technology

**Khan Academy Kids**
- Research-driven progression (phonemic awareness before phonics before fluency)
- Celebrates all attempts, not only correct ones
- Offline-first reliability
- Clean, uncluttered interface that focuses the child's attention on the learning task
- Uses concrete, imageable vocabulary so children can visualize every word

**Applying these benchmarks:**
When making design decisions, ask:
1. Would a 5-year-old find this calming or stressful?  
2. Is feedback warm and encouraging, regardless of whether the answer is right?
3. Does the visual hierarchy guide the child's eyes to the learning task?
4. Can a child with low vision, motor difficulty, or hearing impairment complete this game?
5. Is every word or concept concrete and imageable for a child at this grade level?

## Field Testing Checklist

Before declaring a game human-ready for field testing, walk through this checklist:

### Completeness
- [ ] Every game phase is reachable: start → gameplay → completion → end screen / replay
- [ ] Every phase has auto-advance or user-driven advance logic — no dead ends
- [ ] Every visual pane has actual rendered content, not just background colors/gradients
- [ ] Interaction feedback is visible: tapping/holding produces a visual response in the scene

### iOS Safari
- [ ] All tappable progression points use native `<button>` or `<a>`, not `<div>` click handlers
- [ ] Tested with Reduce Motion ON: game is fully playable with correct visual positioning
- [ ] Touch targets are ≥44px
- [ ] No reliance on `click` or `pointerup` on non-interactive elements

### User Reports
- [ ] When a user says "stuck," determine which layer: event → state → render → auto-advance
- [ ] When a user says "nothing there," check if the visual content was ever implemented, not just the container/background
- [ ] When a user says "no improvement," the previous fix did not reach the actual root cause — escalate investigation rather than trying a variant of the same approach
