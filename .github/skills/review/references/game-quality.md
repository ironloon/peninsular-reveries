# Game Quality

## Layout

- Game screens should be full-screen with no document scrolling on any target device.
- Prefer `height: 100dvh`, `min-height: 100svh`, grid layouts with `minmax(0, 1fr)`, and safe-area padding using `env(safe-area-inset-*)`.
- On short mobile and landscape viewports, compress chrome such as headers, toolbars, and status bars instead of clipping content.
- Content should not be cut off. If a layout cannot fit, tighten the layout before accepting scroll as a fallback.
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
- Add attribution entries in the relevant file under `app/data/attributions/` and sync `ATTRIBUTIONS.md` afterward.

## Visual and Logical Consistency

- Visual feedback must match gameplay logic.
- If hit testing or movement uses percentage-based coordinates, visual ranges must scale with the same frame of reference.
- Avoid fixed pixel motion values when gameplay space is responsive.

## Orientation Coverage

- Verify portrait phone, landscape phone, landscape tablet, and desktop.
- Recommended checkpoints:
  - `390x844`
  - `844x390`
  - `1024x768`
  - `1280x800`

## Input Coverage

- Every game must support keyboard, touch/pointer, and gamepad input (README principle 1).
- Gamepad support requires: D-pad navigation between interactive elements, A/Button-0 for select, Start/Button-9 for menu/settings.
- Analog stick navigation should use ±0.5 dead zone thresholds and 200ms debounce between actions.
- Tab order and arrow-key navigation must work independently of gamepad polling.
- When refactoring input handling, verify all three input methods still function.
- Gamepad connection/disconnection should be handled gracefully (no errors when controller is unplugged mid-game).

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

Every game's settings modal uses a two-tab layout (Settings / Info) rendered by `GameTabbedModal`. An X close button (`aria-label="Close menu"`, `id="settings-close-btn"`, `className="modal-close"`) appears in the top-right corner of the dialog. The footer inside the dialog contains exactly two actions: **Restart** (a `<button>` with `id="restart-btn"` wired in the game's `main.ts`, returns player to the game's own start screen — no navigation away from the page) and **Quit** (an `<a>` element pointed at the site root via `withBasePath('/', siteBasePath)`, `className="...-quit-link"`). Use the exact labels "Restart" and "Quit". The former "Home" link in existing games must be relabeled "Quit". Games still using the legacy `GameSettingsModal` will be migrated to `GameTabbedModal` in WU-8/9. Restart does not apply on the start screen itself (hide or omit in that context if needed, but consistency across games is more important — keeping it visible and simply re-showing the same screen is acceptable).

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
