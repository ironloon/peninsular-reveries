# Phase 3: Homepage & Visual Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 03-homepage-visual-design
**Areas discussed:** Project card design, Dark mode approach, OG/social sharing, Micro-interactions & 404

---

## Project Card Design

### Card visual style

| Option | Description | Selected |
|--------|-------------|----------|
| Image-forward cards | Large preview image/illustration at top, title + description below — needs artwork per project | |
| Icon + text cards | Icon or emoji left, title + description right — compact, no artwork needed | |
| Text-only (enhanced) | Current style with polish — just title + description, better typography and spacing, hover lift | ✓ |

**User's choice:** Text-only (enhanced)
**Notes:** Aligns with minimal design philosophy. No need to extend GameEntry with image fields.

### Card layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single column stack | 1 column, full width — clean, simple, scales to any number of games | ✓ |
| Responsive grid | 2 columns on tablet+, 1 on mobile — more visual but sparse with few items | |
| You decide | Agent's pick based on what looks best | |

**User's choice:** Single column stack
**Notes:** Only one game currently; single column looks clean regardless of count.

### Card hover effect

| Option | Description | Selected |
|--------|-------------|----------|
| Lift + shadow | Subtle translateY + shadow — clean, minimal, makingsoftware.com vibe | ✓ |
| Border + tint | Accent border (current) + background subtle shift | |
| Gentle scale + shadow | Scale up slightly (1.02x) with shadow — playful but restrained | |
| You decide | Whatever feels right with the earthy palette | |

**User's choice:** Lift + shadow
**Notes:** Replaces the current accent-border-only hover.

---

## Dark Mode Approach

### Theme switching mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| OS preference only | Automatic via prefers-color-scheme — simplest, no UI needed | |
| OS + manual toggle | OS default + manual toggle in header — more control, localStorage persistence | ✓ |
| OS only now, toggle later | OS only for launch; toggle in a later phase | |

**User's choice:** OS + manual toggle
**Notes:** Toggle persists choice in localStorage.

### Dark palette direction

| Option | Description | Selected |
|--------|-------------|----------|
| True dark | Near-black backgrounds, high contrast, strong mood shift | |
| Warm dark | Dark brown/charcoal tones, earthy palette at night, cozy not clinical | |
| Dimmed cream | Darker version of cream palette, less dramatic, twilight not night | ✓ |
| You decide | Agent's discretion to make earthy palette work | |

**User's choice:** Dimmed cream
**Notes:** Subtle shift, same site at twilight. Not a dramatic transformation.

### Toggle placement

| Option | Description | Selected |
|--------|-------------|----------|
| Icon button in nav | Small sun/moon icon in header nav — minimal footprint | |
| Text in footer | Text link in footer ('Switch to dark mode') — super low-key | ✓ |
| You decide | Agent picks best placement | |

**User's choice:** Text in footer
**Notes:** Deliberately understated. Site isn't about theme switching.

---

## OG / Social Sharing

### OG image strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Single site-wide image | One generic image for all pages — simplest | |
| Per-page images | Homepage gets site image, game pages get game-specific — richer but more assets | |
| No images, text only | Just title + description + url — functional, less visual on social | ✓ |
| You decide | Whatever's practical for a personal site | |

**User's choice:** No images, text only
**Notes:** Zero image assets to create or maintain.

### OG meta implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Static per-page HTML | Hardcoded in each HTML file — simple, explicit, crawlers get it | ✓ |
| Dynamic from registry | JS sets meta from game-registry — DRY but crawlers may miss dynamic tags | |
| You decide | Static HTML is fine for now | |

**User's choice:** Static per-page HTML
**Notes:** Static site = static meta tags. Crawlers guaranteed to see them.

---

## Micro-interactions & 404

### 404 page personality

| Option | Description | Selected |
|--------|-------------|----------|
| Playful & fun | Amusing/quirky — joke, unexpected visual, or mini-game | ✓ |
| Warm & helpful | Nice message with personality, clear link home | |
| Minimal | Clean message, link home, done | |
| You decide | Surprise me | |

**User's choice:** Playful & fun
**Notes:** The one place to go all-out on personality.

### Micro-interaction scope

| Option | Description | Selected |
|--------|-------------|----------|
| Cards + links only | Subtle — just card lift/shadow + link underline effects | ✓ |
| A few extras | Cards, links, plus 1-2 extras (hero fade-in, nav transitions) | |
| Layered & considered | Cards, links, page transitions, subtle scroll/load animations | |
| You decide | Agent's call | |

**User's choice:** Cards + links only
**Notes:** Let the content be the personality. No scroll/load animations.

### Animation implementation

| Option | Description | Selected |
|--------|-------------|----------|
| CSS only | Transitions, keyframes, no JS — simpler, more performant | |
| CSS + JS for 404 only | CSS default, JS only for the 404 page interaction | ✓ |
| You decide | Whatever the implementation needs | |

**User's choice:** CSS + JS for 404 only
**Notes:** Vanilla TS constraint means CSS is the natural fit for standard animations.

---

## Agent's Discretion

- Exact dark mode hex values (dimmed cream direction is locked)
- 404 page creative concept (playful & fun brief, execution is open)
- CSS transition timing/easing for card hover
- Font weight / letter-spacing refinements

## Deferred Ideas

None — discussion stayed within phase scope.
