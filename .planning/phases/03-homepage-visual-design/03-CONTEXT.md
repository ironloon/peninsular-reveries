# Phase 3: Homepage & Visual Design - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the site look intentional with visual personality — not just functional. Deliver styled project cards on the homepage, dark mode via CSS custom properties with a manual toggle, Open Graph meta tags for social sharing, and personality micro-interactions including a playful 404 page.

Requirements in scope: SITE-04, SITE-07, LOOK-04, LOOK-06

</domain>

<decisions>
## Implementation Decisions

### Project Card Design
- **D-01:** Text-only cards with enhanced styling — no images or icons. Title + description on surface background with better typography and spacing. GameEntry does not need an image field.
- **D-02:** Single column stack layout for the project grid. Clean and simple; works whether there's 1 game or 20.
- **D-03:** Card hover effect: subtle lift (translateY) + shadow. Clean and minimal, aligned with makingsoftware.com aesthetic.

### Dark Mode
- **D-04:** OS preference via `prefers-color-scheme` as default, plus a manual toggle that persists in localStorage.
- **D-05:** Dimmed cream palette for dark mode — a darker version of the existing warm cream palette. More like twilight than night. Not clinical true-dark, not a dramatic shift.
- **D-06:** Toggle placement: text link in the footer ("Switch to dark mode" / "Switch to light mode"). Super low-key, not in the header nav.

### OG / Social Sharing
- **D-07:** No OG images — text-only meta tags (og:title, og:description, og:url). Functional without requiring image assets.
- **D-08:** Static per-page HTML for OG tags. Hardcoded in each HTML file so crawlers get them without JS. No dynamic generation from registry.

### Micro-interactions & 404
- **D-09:** Playful & fun 404 page — a joke, unexpected visual, or mini-game. Something that makes you smile.
- **D-10:** Micro-interactions limited to cards + links only. Card lift/shadow hover, link underline effects. Let the content be the personality; don't add scroll/load animations.
- **D-11:** CSS transitions/keyframes for all standard animations. JS allowed only for the 404 page interaction (mini-game or interactive element).

### Agent's Discretion
- Exact dark mode color values (dimmed cream direction is locked, specific hex values are flexible)
- 404 page creative concept — playful and fun is the brief, execution is open
- CSS transition timing/easing for card hover lift
- Font weight / letter-spacing refinements within the existing type system

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Project
- `.planning/REQUIREMENTS.md` — SITE-04, SITE-07, LOOK-04, LOOK-06 define the acceptance criteria
- `.planning/PROJECT.md` — Vision, constraints, design reference (makingsoftware.com)
- `.planning/ROADMAP.md` §Phase 3 — Phase goal, success criteria

### Site Foundation (Phase 1 output)
- `public/index.html` — Current homepage HTML (hero + single game-card + footer)
- `public/styles/main.css` — CSS design system with :root custom properties (light mode only), .game-card, .hero, .site-nav, .site-footer styles
- `src/shared/game-registry.ts` — GameEntry interface (slug, name, description) and games array
- `src/shared/shell.ts` — Nav generation from game registry

### Phase 2 Context
- `.planning/phases/02-super-word-game/02-CONTEXT.md` — D-01: game has its own vibrant palette separate from site earthy tones. Site shell stays earthy; game area uses its own colors.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `main.css` design system: complete :root custom properties (colors, spacing, fluid typography) — dark mode needs a parallel set
- `.game-card` component: already styled with surface bg, border hover, 8px radius — needs upgrade to lift+shadow hover
- `.hero` section: centered layout with display type scale — may need refinement
- `.site-footer`: basic centered text — toggle link goes here

### Established Patterns
- CSS custom properties for all colors/spacing — dark mode naturally extends this with `prefers-color-scheme` media query + `[data-theme]` attribute
- Static HTML files per route — OG tags go directly in `<head>`
- esbuild bundles TS per page — 404 page JS would need its own entry point
- `game-registry.ts` drives nav; cards on homepage are currently hardcoded in HTML

### Integration Points
- `public/index.html` `<head>` — add OG meta tags
- `public/super-word/index.html` `<head>` — add game-specific OG meta tags
- `public/styles/main.css` — add dark mode custom properties and media query
- `public/404.html` — new file needed (GitHub Pages serves this automatically)
- `src/pages/home.ts` — currently a stub, could drive dynamic card rendering from registry
- Footer in each HTML file — add theme toggle link
- `build.ts` — may need 404 page entry point if it has JS

</code_context>

<specifics>
## Specific Ideas

- makingsoftware.com aesthetic remains the reference — warm, intentional without overdesign
- Dimmed cream dark mode should feel like the same site at twilight, not a different site
- Footer toggle is deliberately understated — the site isn't about theme switching, it's about the content
- 404 page is the one place to go all-out on personality — it's the fun Easter egg of the site

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-homepage-visual-design*
*Context gathered: 2026-03-28*
