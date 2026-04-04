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
- Add attribution entries in `app/data/attributions.ts` and sync `ATTRIBUTIONS.md` afterward.

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
