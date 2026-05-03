# Cross-game Start Screen Audit & Recommendations

**Date:** 2025-07-09  
**Scope:** All 11 games — heading, subtitle, CTA button, header/menu layout, spacing, shared-component usage  
**Source files audited:** Each game's `controller.tsx`, its per-game CSS, `app/ui/game-shell.tsx`, `app/ui/site-styles.ts`, and `public/styles/game.css`

---

## 1. Summary of Findings

Across 11 games there is **no shared sizing system** for start screens. Every game defines its own heading, subtitle, and CTA button sizes independently. The spread is wide — heading `font-size` ranges from `clamp(1rem, 2.5vw, 1.4rem)` (Waterwall) to `clamp(3rem, 14vw, 5.5rem)` (Super Word). Six of eleven games use the shared `GameHeader` component on their start screen; five do not. Three games lack a traditional "subtitle → CTA" flow entirely.

| Game | Uses `GameScreen` | Uses `GameHeader` | Heading font-size | Subtitle font-size | CTA button | CTA border-radius | CTA min-height |
|------|:-:|:-:|---|---|---|---|---|
| Chompers | No (custom `.game-screen`) | No (GameHeader only on game screen) | `clamp(3rem, 11vw, 5.4rem)` | `clamp(0.95rem, 2.2vw, 1.1rem)` | `.chomp-btn-primary` | `999px` | ~44px implied |
| Drum Pad | ✅ | ✅ | `clamp(2rem, 5vw, 3.6rem)` | `clamp(1rem, 2.2vw, 1.25rem)` | `.drum-pad-primary-btn` | `1rem` | 0 (no min-height) |
| Mission: Orbit | ✅ | ✅ | `clamp(2.7rem, 10vw, 5.4rem)` | `clamp(1rem, 2.5vw, 1.2rem)` | `.mission-btn-primary` | `999px` | 44px |
| Peekaboo | ✅ | ✅ | `clamp(1.5rem, 5vw, 2.5rem)` | `clamp(1rem, 3vw, 1.25rem)` | `.peekaboo-primary-btn` | `999px` | 44px |
| Pixel Passport | ✅ | No (custom layout) | `clamp(3rem, 10vw, 5.6rem)` | `clamp(1rem, 2.6vw, 1.14rem)` | `.passport-btn-primary` | `999px` | 48px |
| Spot On | ✅ | ✅ | `clamp(1.8rem, 5vw, 2.6rem)` | `clamp(1rem, 2.5vw, 1.2rem)` | `.spot-on-primary-btn` | `12px` | 48px |
| Squares | ✅ | ✅ | `clamp(2.3rem, 5vw, 4rem)` | `clamp(1.05rem, 2.3vw, 1.35rem)` | `.squares-primary-btn` | `999px` | 44px |
| Story Trail | No (custom screen class) | No (GameHeader outside start screen) | `clamp(2.6rem, 9vw, 4.2rem)` | `clamp(1rem, 2.6vw, 1.2rem)` | `.trail-btn-primary` | `999px` | 44px |
| Super Word | No (uses `as="div"` w/ custom styles) | No (GameHeader only on game screen) | `clamp(3rem, 14vw, 5.5rem)` | `clamp(0.95rem, 2.8vw, 1.15rem)` | `.btn-primary` | `50px` | 44px |
| Train Sounds | ✅ | ✅ | `clamp(1.65rem, 4vw, 2.6rem)` | `clamp(1.05rem, 2.5vw, 1.4rem)` | `.train-primary-btn` | `999px` | 44px |
| Waterwall | ✅ (single screen) | ✅ (single screen) | `clamp(1rem, 2.5vw, 1.4rem)` | *(none)* | `.waterwall-play-btn` | `12px` | 56px |

---

## 2. Per-game Detail: Heading, Subtitle, CTA, Header, Spacing

### 2.1 Chompers

- **DOM structure:** Raw `<section id="start-screen" class="game-screen">` — does **not** use `GameScreen` or `GameHeader` on start screen. Uses its own visibility/transition system.
- **Heading:** `<h1 class="start-title">` — `font-size: clamp(3rem, 11vw, 5.4rem)`, `line-height: 0.94`, `letter-spacing: -0.03em`, font: `var(--font-title)` (Fredoka One)
- **Subtitle:** `<p class="start-kicker">` — `font-size: clamp(0.95rem, 2.2vw, 1.1rem)`, `line-height: 1.5`, color: `var(--ink-muted)`
- **CTA:** No single primary CTA; start screen is an **area-picker** (6 math-area cards). Secondary "Menu" button uses `.chomp-btn-secondary` (`border-radius: 999px`, `padding: 0.65rem 1.4rem`, font-size `clamp(0.88rem, 2vw, 1rem)`)
- **Header/menu button:** Not present on start screen (Menu button is inside area-picker section)
- **Layout rhythm:** Title → kicker → area-picker grid → menu btn → gamepad hint
- **Spacing:** `.start-shell` has `padding: clamp(1.4rem, 4vw, 2.5rem)`, gap handled by flow

**Outliers:** No `GameScreen`/`GameHeader`, no standard CTA, kicker is smaller than most subtitles.

### 2.2 Drum Pad

- **DOM structure:** Uses `GameScreen padded` + `GameHeader`
- **Heading:** `<h1 class="drum-pad-title">` inside `GameHeader leftContent` — `font-size: clamp(2rem, 5vw, 3.6rem)`, `letter-spacing: 0.04em`
- **Subtitle:** `<p class="drum-pad-subtitle">` — `font-size: clamp(1rem, 2.2vw, 1.25rem)`, color: `var(--muted)`
- **CTA:** `<button class="drum-pad-primary-btn">Start</button>` — `font-size: clamp(1.1rem, 2.4vw, 1.4rem)`, `padding: 0.9rem 2rem`, `border-radius: 1rem`, `min-height: not set`
- **Header/menu button:** "Menu" button in `GameHeader rightContent`, `.drum-pad-menu-btn` (`font-size: 0.95rem`, `padding: 0.6rem 1rem`, `border-radius: 0.8rem`)
- **Layout rhythm:** GameHeader(title+menu) → subtitle → CTA button
- **Spacing:** `.drum-pad-start-panel` uses CSS Grid with `gap: clamp(0.8rem, 2vw, 1.4rem)`

**Outliers:** CTA `border-radius: 1rem` (not pill-shaped), no `min-height` on CTA, subtitle sits outside the header block (gap between header and subtitle).

### 2.3 Mission: Orbit

- **DOM structure:** Uses `GameScreen padded` + `GameHeader`
- **Heading:** `<h1 class="mission-title">` inside `GameHeader leftContent` — `font-size: clamp(2.7rem, 10vw, 5.4rem)`, `line-height: 0.92`, `letter-spacing: -0.05em`
- **Subtitle:** `<p class="mission-subtitle">` — `font-size: clamp(1rem, 2.5vw, 1.2rem)`, `line-height: 1.55`, color: `var(--mission-muted)`
- **CTA:** `<button class="mission-btn mission-btn-primary">Begin Mission</button>` — `font-size: 0.98rem`, `padding: 0.95rem 1.4rem`, `border-radius: 999px`, `min-height: 44px`
- **Header/menu button:** "Menu" button in `GameHeader rightContent`, `.mission-btn-secondary` (`border-radius: 999px`, `padding: 0.95rem 1.4rem`, `font-size: 0.98rem`)
- **Layout rhythm:** GameHeader(kicker+title | menu) → subtitle → crew panel → CTA
- **Spacing:** `.start-shell` `padding: clamp(1.4rem, 4vw, 2.8rem)`, `.start-actions` `margin-top: 1.6rem`

**Outliers:** Kicker (`mission-kicker`) is placed inside `GameHeader leftContent` alongside title, creating a two-line heading block that competes for space with the menu button. CTA font-size is fixed `0.98rem` (not responsive).

### 2.4 Peekaboo

- **DOM structure:** Uses `GameScreen padded` + `GameHeader`
- **Heading:** `<h1 class="peekaboo-title">` inside `GameHeader leftContent` — `font-size: clamp(1.5rem, 5vw, 2.5rem)`, `line-height: 1.2`, font: `var(--peekaboo-font-title)` (Georgia)
- **Subtitle:** `<p class="peekaboo-meet-subtitle">` — `font-size: clamp(1rem, 3vw, 1.25rem)`, color: `var(--peekaboo-muted)`
- **CTA:** `<button class="peekaboo-primary-btn peekaboo-proceed-btn">Ready!</button>` — `font-size: clamp(1rem, 2.5vw, 1.15rem)`, `padding: 0.75rem 2rem`, `border-radius: 999px`, `min-height: 44px`
- **Header/menu button:** "Menu" button in `GameHeader rightContent`, `.peekaboo-menu-btn` (`font-size: clamp(0.8rem, 2vw, 0.9rem)`, `padding: 0.35rem 0.9rem`, `border-radius: 999px`, `min-height: 44px`)
- **Layout rhythm:** GameHeader(kicker+title | menu) → hero image → subtitle → CTA
- **Spacing:** Panel gaps: `clamp(0.75rem, 2vh, 1.25rem)`

**Outliers:** Heading is the smallest of all games at `clamp(1.5rem, 5vw, 2.5rem)`. Kicker is inside the heading block but very small (`clamp(0.75rem, 2vw, 0.85rem)`).

### 2.5 Pixel Passport

- **DOM structure:** Uses `GameScreen padded` but **not** `GameHeader` on start screen. Uses custom `start-shell` with grid layout.
- **Heading:** `<h1 class="passport-title">` — `font-size: clamp(3rem, 10vw, 5.6rem)`, `line-height: 0.93`, `letter-spacing: -0.05em`
- **Subtitle:** `<p class="passport-subtitle">` — `font-size: clamp(1rem, 2.6vw, 1.14rem)`, `line-height: 1.55`, color: `var(--ink-soft)`
- **CTA:** `<button class="passport-btn passport-btn-primary">Start 🌍</button>` — no explicit font-size (inherits), `min-height: 48px`, `padding: 0.78rem 1.15rem`, `border-radius: 999px`
- **Header/menu button:** "Menu" button is inside `.start-actions` alongside CTA — `.passport-btn-ghost` (`border-radius: 999px`, `min-height: 48px`)
- **Layout rhythm:** Kicker → title → subtitle → CTA+Menu side by side → globe (decorative)
- **Spacing:** `.start-copy` has `gap: 1rem`; `.start-actions` `gap: 0.75rem`

**Outliers:** No `GameHeader` on start screen. Menu button is next to CTA, not in a header bar. Two-column layout hides globe on narrow screens. CTA `min-height: 48px` (not 44px like most).

### 2.6 Spot On

- **DOM structure:** Uses `GameScreen` (NOT padded) + `GameHeader`
- **Heading:** `<h1 class="spot-on-title">` inside `GameHeader leftContent` — `font-size: clamp(1.8rem, 5vw, 2.6rem)`, `font-weight: 700`, `line-height: 1.2`
- **Subtitle:** `<p class="spot-on-subtitle">` — `font-size: clamp(1rem, 2.5vw, 1.2rem)`, `line-height: 1.5`, `opacity: 0.8`
- **CTA:** `<button class="spot-on-primary-btn">Start</button>` — `font-size: 1.1rem`, `padding: 0.75rem 2.5rem`, `border-radius: 12px`, `min-height: 48px`
- **Header/menu button:** "Menu" button in `GameHeader rightContent`, `.spot-on-menu-btn` (`font-size: 0.9rem`, `padding: 0.4rem 1rem`, `border-radius: 8px`, `min-height: 44px`)
- **Layout rhythm:** GameHeader(title | menu) → subtitle → CTA
- **Spacing:** `.spot-on-panel--start` `padding: 2rem 1.5rem`; `.spot-on-start-body` `gap: 1.5rem`, `margin-top: 2rem`

**Outliers:** CTA `border-radius: 12px` (not pill). CTA `min-height: 48px`. Panel is **not padded** via `GameScreen` prop. `margin-top: 2rem` before start body is a lot of space.

### 2.7 Squares

- **DOM structure:** Uses `GameScreen padded` + `GameHeader`
- **Heading:** `<h1 class="squares-title">` inside `GameHeader leftContent` — `font-size: clamp(2.3rem, 5vw, 4rem)`, `letter-spacing: 0.04em`, font: `var(--squares-font-title)` (Georgia)
- **Subtitle:** `<p class="squares-subtitle">` — `font-size: clamp(1.05rem, 2.3vw, 1.35rem)`, `line-height: 1.45`, color: `var(--squares-muted)`
- **CTA:** Mode cards each have their own `.squares-primary-btn` — `padding: 0.8rem 1.2rem`, `border-radius: 999px`, `min-height: 44px`
- **Header/menu button:** "Menu" button in `GameHeader rightContent`, `.squares-menu-btn` (`border-radius: 999px`, `padding: 0.8rem 1.2rem`, `min-height: 44px`)
- **Layout rhythm:** GameHeader(kicker+title | menu) → subtitle → mode cards (each with CTA) → gamepad hint
- **Spacing:** `.squares-screen-panel` `gap: clamp(1rem, 2.4vw, 1.6rem)`

**Outliers:** No single focal CTA — 3 mode cards function as the CTA. Kicker inside header block.

### 2.8 Story Trail

- **DOM structure:** Uses custom `.trail-start-screen` — does **not** use `GameScreen` or `GameHeader` on start screen.
- **Heading:** `<h1 class="trail-title">` — `font-size: clamp(2.6rem, 9vw, 4.2rem)`, `line-height: 1`, color: `var(--trail-accent)`
- **Subtitle:** `<p class="trail-subtitle">` — `font-size: clamp(1rem, 2.6vw, 1.2rem)`, `line-height: 1.45`
- **CTA:** `<button class="trail-btn trail-btn-primary">Begin</button>` — `font-size: clamp(1rem, 2.4vw, 1.15rem)`, `padding: 0.75rem 2rem`, `border-radius: 999px`, `min-height: 44px`
- **Header/menu button:** `GameHeader` is rendered **outside** the start screen, at the top of the document, with just a `☰` menu button on the right.
- **Layout rhythm:** Title → subtitle → CTA → gamepad hint
- **Spacing:** `.trail-start-shell` `gap: 0.6rem`, `.start-actions` `margin-top: 0.6rem`

**Outliers:** No `GameScreen` with slide transitions for start screen. `GameHeader` is at document level, not inside start screen. Shell gap is tight (0.6rem).

### 2.9 Super Word

- **DOM structure:** Uses `GameScreen as="div"` with custom `screenStyles` — no `padded` prop, custom padding via CSS `.start-screen` class.
- **Heading:** `<h1 class="title">` — `font-size: clamp(3rem, 14vw, 5.5rem)`, `line-height: 1.1`, `font-weight: 700`. Letters individually wrapped in `.title-bounce` spans.
- **Subtitle:** `<p class="subtitle">` — `font-size: clamp(0.95rem, 2.8vw, 1.15rem)`, `opacity: 0.9`
- **CTA:** No single CTA — difficulty picker with 5 `.btn-difficulty` buttons. Each: `font-size: clamp(0.95rem, 2.2vw, 1.1rem)`, `padding: 0.55rem 1rem`, `border-radius: 14px`, `min-height: 44px`
- **Header/menu button:** No GameHeader on start screen. Settings button is inside area picker: `.chomp-btn-secondary`
- **Layout rhythm:** Title → subtitle → difficulty chooser → gamepad hint
- **Spacing:** `#start-screen` `gap: var(--game-space-lg)` (1.5rem), `padding: var(--game-space-xl)` (2rem)

**Outliers:** No `GameHeader` on start screen. Heading is the largest of all games. No single primary CTA — difficulty picker is the CTA. No `padded` prop, uses own `#start-screen` padding.

### 2.10 Train Sounds

- **DOM structure:** Uses `GameScreen` (NOT padded) + `GameHeader`
- **Heading:** `<h1 class="train-title">` inside `GameHeader leftContent` — `font-size: clamp(1.65rem, 4vw, 2.6rem)`, `font-weight: 800`, `letter-spacing: 0.08em`, `text-transform: uppercase`
- **Subtitle:** `<p class="train-subtitle">` — `font-size: clamp(1.05rem, 2.5vw, 1.4rem)`, `line-height: 1.4`, color: `var(--ink-soft)`
- **CTA:** `<button class="train-primary-btn">Start</button>` — `font-size: 1.02rem`, `padding: 0.95rem 1.8rem`, `border-radius: 999px`, `min-height: 44px`
- **Header/menu button:** "Menu" button in `GameHeader rightContent`, `.train-menu-btn` (`border-radius: 999px`, `padding: 0.8rem 1rem`, `font-size: inherited`)
- **Layout rhythm:** GameHeader(title | menu) → start body (subtitle + CTA)
- **Spacing:** `.train-panel--start` `gap: clamp(0.8rem, 2vw, 1.3rem)`. `.train-start-body` `gap: clamp(1rem, 2.8vw, 1.6rem)`, `padding: clamp(1.5rem, 4vw, 3rem)`

**Outliers:** Title is `text-transform: uppercase` + wide letter-spacing, making it feel different from all other games. Start body has its own distinct card-like container with gradients.

### 2.11 Waterwall

- **DOM structure:** Uses `GameScreen` (single screen, no transitions) + `GameHeader`
- **Heading:** `<h1 class="waterwall-title">` inside `GameHeader leftContent` — `font-size: clamp(1rem, 2.5vw, 1.4rem)`, `font-weight: 700`
- **Subtitle:** None
- **CTA:** `<button class="waterwall-play-btn">Play</button>` — `font-size: 1.2rem`, `padding: 0.8rem 2rem`, `border-radius: 12px`, `min-height: 56px`, absolutely positioned over canvas
- **Header/menu button:** "Menu" button in `GameHeader rightContent`, `.waterwall-menu-btn` (`border-radius: 6px`, `padding: 0.4rem 0.8rem`, `min-height: 44px`)
- **Layout rhythm:** GameHeader(title | menu) → canvas with overlaid Play button
- **Spacing:** N/A (zen sandbox, no traditional start screen)

**Outliers:** No subtitle. Heading is smallest of all games. CTA is overlaid on canvas with `position: absolute`. No real "start screen" — just a play button over the simulation. Menu button uses `border-radius: 6px` (not pill).

---

## 3. Cross-game Comparison Tables

### 3.1 Heading font-size

| Game | font-size min | font-size preferred | font-size max | Line-height | Letter-spacing |
|------|---|---|---|---|---|
| Waterwall | 1rem | 2.5vw | 1.4rem | default | default |
| Peekaboo | 1.5rem | 5vw | 2.5rem | 1.2 | default |
| Spot On | 1.8rem | 5vw | 2.6rem | 1.2 | default |
| Train Sounds | 1.65rem | 4vw | 2.6rem | default | 0.08em |
| Drum Pad | 2rem | 5vw | 3.6rem | default | 0.04em |
| Squares | 2.3rem | 5vw | 4rem | default | 0.04em |
| Story Trail | 2.6rem | 9vw | 4.2rem | 1 | default |
| Mission: Orbit | 2.7rem | 10vw | 5.4rem | 0.92 | -0.05em |
| Chompers | 3rem | 11vw | 5.4rem | 0.94 | -0.03em |
| Pixel Passport | 3rem | 10vw | 5.6rem | 0.93 | -0.05em |
| Super Word | 3rem | 14vw | 5.5rem | 1.1 | default |

**Spread:** 1rem → 3rem (min), 2.5vw → 14vw (preferred), 1.4rem → 5.6rem (max).  
**Outliers:**
- **Waterwall** heading is 3–4× smaller than the median group. It intentionally reads as an in-game toolbar title, not a hero heading.
- **Super Word** at `14vw` preferred grows 2–3× larger than most on wide screens.
- **Peekaboo** heading is notably small for a start screen hero (2.5rem max).

### 3.2 Subtitle font-size

| Game | font-size min | font-size preferred | font-size max |
|------|---|---|---|
| Drum Pad | 1rem | 2.2vw | 1.25rem |
| Peekaboo | 1rem | 3vw | 1.25rem |
| Mission: Orbit | 1rem | 2.5vw | 1.2rem |
| Story Trail | 1rem | 2.6vw | 1.2rem |
| Chompers | 0.95rem | 2.2vw | 1.1rem |
| Super Word | 0.95rem | 2.8vw | 1.15rem |
| Squares | 1.05rem | 2.3vw | 1.35rem |
| Spot On | 1rem | 2.5vw | 1.2rem |
| Pixel Passport | 1rem | 2.6vw | 1.14rem |
| Train Sounds | 1.05rem | 2.5vw | 1.4rem |
| Waterwall | *(none)* | — | — |

**Spread:** Subtitles are fairly consistent at `clamp(1rem, ~2.5vw, ~1.2rem)`.  
**Outliers:**
- **Train Sounds** max is 1.4rem (slightly larger).
- **Chompers** and **Super Word** min is 0.95rem (slightly smaller).
- **Squares** max is 1.35rem (slightly larger).

### 3.3 CTA button

| Game | Padding | border-radius | min-height | font-size | Shape |
|------|---|---|---|---|---|
| Chompers | 0.65rem 1.4rem | 999px | ~44px | clamp(0.88rem, 2vw, 1rem) | Pill |
| Drum Pad | 0.9rem 2rem | 1rem | *(none)* | clamp(1.1rem, 2.4vw, 1.4rem) | Rounded rect |
| Mission: Orbit | 0.95rem 1.4rem | 999px | 44px | 0.98rem | Pill |
| Peekaboo | 0.75rem 2rem | 999px | 44px | clamp(1rem, 2.5vw, 1.15rem) | Pill |
| Pixel Passport | 0.78rem 1.15rem | 999px | 48px | inherits | Pill |
| Spot On | 0.75rem 2.5rem | 12px | 48px | 1.1rem | Rounded rect |
| Squares | 0.8rem 1.2rem | 999px | 44px | inherits | Pill |
| Story Trail | 0.75rem 2rem | 999px | 44px | clamp(1rem, 2.4vw, 1.15rem) | Pill |
| Super Word | 0.5rem 1rem 1rem 1.5rem | 50px | 44px | clamp(1.15rem, 4vw, 1.5rem) | Rounded rect |
| Train Sounds | 0.95rem 1.8rem | 999px | 44px | 1.02rem | Pill |
| Waterwall | 0.8rem 2rem | 12px | 56px | 1.2rem | Rounded rect |

**Outliers:**
- **Drum Pad** — CTA has no `min-height`, uses `border-radius: 1rem` (not pill). Risk of tap target too small.
- **Spot On** — `border-radius: 12px` + `min-height: 48px` make it look more like a card button than a CTA.
- **Super Word** — `border-radius: 50px` approximates pill, but the button padding is very different (large horizontal, tight vertical).
- **Waterwall** — `border-radius: 12px` + `min-height: 56px` (largest tap target). Uniquely `position: absolute`.
- **Pixel Passport** — `min-height: 48px` instead of 44px.

### 3.4 Menu button on start screen

| Game | border-radius | min-height | font-size | Placement |
|------|---|---|---|---|
| Chompers | 999px | ~44px | clamp(0.88rem, 2vw, 1rem) | Inside area-picker section |
| Drum Pad | 0.8rem | *(none)* | 0.95rem | GameHeader rightContent |
| Mission: Orbit | 999px | 44px | 0.98rem | GameHeader rightContent |
| Peekaboo | 999px | 44px | clamp(0.8rem, 2vw, 0.9rem) | GameHeader rightContent |
| Pixel Passport | 999px | 48px | inherits | Beside CTA (not in header) |
| Spot On | 8px | 44px | 0.9rem | GameHeader rightContent |
| Squares | 999px | 44px | inherits | GameHeader rightContent |
| Story Trail | N/A | N/A | N/A | GameHeader at document level |
| Super Word | 999px | 44px | 1rem | Hidden in area-picker |
| Train Sounds | 999px | 44px | inherits | GameHeader rightContent |
| Waterwall | 6px | 44px | 0.9rem | GameHeader rightContent |

**Outliers:**
- **Drum Pad** — `border-radius: 0.8rem`, no `min-height`.
- **Spot On** — `border-radius: 8px` (rectangular, not pill).
- **Waterwall** — `border-radius: 6px` (tightest).
- **Pixel Passport** — menu not in header, placed next to CTA.
- **Story Trail** — menu rendered at document level, outside start screen flow.

### 3.5 Shared component usage on start screen

| Uses GameScreen | Uses GameHeader | Game |
|:-:|:-:|---|
| ✅ | ✅ | Drum Pad, Mission: Orbit, Peekaboo, Squares, Train Sounds |
| ✅ | No | Pixel Passport, Spot On, Waterwall |
| No | No | Chompers, Story Trail, Super Word |

**Outliers:**
- **Chompers** and **Super Word** and **Story Trail** do not use the shared `GameScreen`/`GameHeader` system on their start screens. This means:
  - Screen transition animations are not shared
  - Header layout is not consistent
  - Visibility and padding logic is duplicated per-game

---

## 4. Spacing Rhythm Audit

The ideal start-screen rhythm is: **Header bar → (gap) → Hero heading → (small gap) → Subtitle → (gap) → CTA**.

| Game | Header→Heading | Heading→Subtitle | Subtitle→CTA | Total first→CTA feel |
|------|---|---|---|---|
| Drum Pad | 0 (heading in header) | Grid gap `0.8–1.4rem` | Grid gap `0.8–1.4rem` | Tight |
| Mission: Orbit | 0 (heading in header) | `1rem` margin-top | `1.6rem` margin-top (after crew panel) | Loose (crew panel adds height) |
| Peekaboo | 0 (heading in header) | Panel gap `0.75–1.25rem` | Panel gap `0.75–1.25rem` | Tight |
| Squares | 0 (heading in header) | `0.7rem` gap | `1rem+` gap (mode cards) | Moderate |
| Train Sounds | 0 (heading in header) | Panel gap `1–1.6rem` | Panel gap `1–1.6rem` | Moderate |
| Pixel Passport | Kicker→title `0.7rem` margin | `0.9rem` margin-top | `0.75rem` gap | Moderate |
| Spot On | 0 (heading in header) | `1.5rem` gap + `2rem` margin-top | `1.5rem` gap | Loose |
| Chompers | Inline (start-shell) | `0.6rem` margin-top | `1.4rem` margin-top | Moderate |
| Story Trail | N/A (no header) | `0.6rem` gap | `0.6rem` margin-top | Tight |
| Super Word | Inline | `game-space-lg` gap | `game-space-sm` gap | Moderate |

**Outliers:**
- **Spot On** has an excessive `2rem margin-top` before `.spot-on-start-body`, plus 1.5rem gap inside.
- **Story Trail** is very tight at 0.6rem throughout.
- **Mission: Orbit** has an entire crew roster panel between subtitle and CTA, making the CTA further from the heading than any other game.

---

## 5. Recommendations: Shared Rhythm

### 5.1 Target heading scale

```
clamp(1.8rem, 5.5vw, 3.2rem)
```

Rationale: The median cluster (Drum Pad, Squares, Spot On, Train Sounds) sits around `5vw` preferred with `2–2.6rem` min and `2.6–4rem` max. A single value of `clamp(1.8rem, 5.5vw, 3.2rem)` hits:
- At 375px: ~2.06rem (readable)
- At 428px: ~2.35rem
- At 768px: ~2.64rem
- At 1024px: ~2.82rem  
- Caps at 3.2rem

**Games that should adopt this:** Peekaboo (currently too small), Spot On, Train Sounds, Drum Pad — all already close.

**Games with large hero titles** (Chompers, Pixel Passport, Mission: Orbit, Super Word, Story Trail) use big display type as a brand moment. These can keep a larger heading **if** the kicker/subtitle system is unified. For these, a secondary hero heading scale is appropriate:

```
clamp(2.6rem, 8vw, 4.5rem)
```

**Waterwall** should remain at its small toolbar-style heading since it has no traditional start screen.

### 5.2 Target subtitle scale

```
clamp(1rem, 2.5vw, 1.2rem)
```

Rationale: 9 of 10 games with subtitles already land at `clamp(1rem, ~2.5vw, ~1.2rem)`. This is already de facto standard.

### 5.3 Target CTA button sizing

```
min-height: 44px;
padding: 0.75rem 2rem;
border-radius: 999px;
font-size: clamp(1rem, 2.5vw, 1.15rem);
```

Rationale: 44px is the de facto touch-target standard and already used by 7 of 11 games. Pill shape (`border-radius: 999px`) is used by 7 of 11 games and signals "primary action". `0.75rem 2rem` padding gives comfortable horizontal breathing room.

**Games that should adjust:**
- Spot On: `border-radius: 12px → 999px`, `min-height: 48px → 44px`
- Drum Pad: add `min-height: 44px`, `border-radius: 1rem → 999px`
- Super Word: `border-radius: 50px → 999px`, normalize padding to `0.75rem 2rem`
- Waterwall: `border-radius: 12px → 999px` (if Play button is repositioned into a proper start screen)

### 5.4 Target header layout

All start screens should use the shared `GameHeader` component:

```
GameHeader
  leftContent:  <kicker?> <h1>Title</h1>
  rightContent: <Menu button>
```

**Menu button target:**
```
min-height: 44px;
min-width: 44px;
padding: 0.4rem 0.9rem;
border-radius: 999px;
font-size: clamp(0.8rem, 2vw, 0.95rem);
```

**Games that should adopt:**
- Chompers: Move menu into `GameHeader`, add `GameScreen` for start screen
- Super Word: Add `GameHeader` to start screen
- Story Trail: Move document-level `GameHeader` inside start screen using `GameScreen`
- Pixel Passport: Move menu from CTA row into `GameHeader`
- Waterwall: Already uses `GameHeader`, but `border-radius: 6px` → `999px`

### 5.5 Target spacing rhythm

Using the `GameScreen padded` prop provides `padding: clamp(0.9rem, 2.5vw, 1.6rem)`, which is good for the outer screen. For internal flow:

```
--start-gap-heading-subtitle: 0.5rem;
--start-gap-subtitle-cta: 1.25rem;
```

Or simply:
- **Heading → Subtitle:** `0.5rem` gap (tight coupling, they read as a unit)
- **Subtitle → CTA:** `1.25rem` gap (gives breathing room before action)
- **Between CTA and secondary actions:** `0.75rem` gap

**Games that should adjust:**
- Story Trail: `0.6rem` everywhere is too tight; increase heading→subtitle to `0.5rem` and subtitle→CTA to `1.25rem`
- Spot On: `2rem margin-top` on start body is too much; reduce to `1rem`

### 5.6 Implementable CSS custom properties (for future shared token file)

```css
:root {
  /* Start screen rhythm */
  --start-heading-size: clamp(1.8rem, 5.5vw, 3.2rem);
  --start-heading-hero-size: clamp(2.6rem, 8vw, 4.5rem);
  --start-heading-line-height: 1.1;
  --start-heading-letter-spacing: -0.02em;

  --start-subtitle-size: clamp(1rem, 2.5vw, 1.2rem);
  --start-subtitle-color: var(--color-muted, inherit);
  --start-subtitle-line-height: 1.5;

  --start-cta-min-height: 44px;
  --start-cta-padding: 0.75rem 2rem;
  --start-cta-radius: 999px;
  --start-cta-font-size: clamp(1rem, 2.5vw, 1.15rem);
  --start-cta-font-weight: 700;

  --start-menu-min-height: 44px;
  --start-menu-min-width: 44px;
  --start-menu-padding: 0.4rem 0.9rem;
  --start-menu-radius: 999px;
  --start-menu-font-size: clamp(0.8rem, 2vw, 0.95rem);

  --start-gap-heading-subtitle: 0.5rem;
  --start-gap-subtitle-cta: 1.25rem;
  --start-gap-cta-secondary: 0.75rem;
}
```

Games with hero-scale headings (Chompers, Pixel Passport, Mission: Orbit, Super Word, Story Trail) would use `--start-heading-hero-size` instead of `--start-heading-size`. All other values would be shared.

---

## 6. Migration Priority

| Priority | Game | Changes needed |
|---|---|---|
| **P0** | Chompers | Adopt `GameScreen`+`GameHeader` on start screen; unify heading into header; move Menu into header |
| **P0** | Story Trail | Adopt `GameScreen` on start screen; move document-level `GameHeader` inside; adjust spacing |
| **P0** | Super Word | Add `GameHeader` to start screen; set `padded` on `GameScreen` |
| **P1** | Drum Pad | Add `min-height: 44px` to CTA; change `border-radius: 1rem → 999px` |
| **P1** | Spot On | Change CTA `border-radius: 12px → 999px`; reduce `margin-top: 2rem → 1rem`; change menu `border-radius: 8px → 999px` |
| **P1** | Pixel Passport | Move menu from CTA row into `GameHeader` on start screen |
| **P2** | Mission: Orbit | Consider responsive font-size on CTA (`0.98rem` → `clamp(1rem, 2.5vw, 1.15rem)`) |
| **P2** | Peekaboo | Consider bumping heading from `clamp(1.5rem, 5vw, 2.5rem)` → `clamp(1.8rem, 5.5vw, 3.2rem)` |
| **P2** | Waterwall | Change menu `border-radius: 6px → 999px` |
| **P3** | Squares | Minor: already close to targets |
| **P3** | Train Sounds | Minor: already close to targets |

---

## 7. Deferred Edits

No code changes are made in this leg. All findings and recommendations above are for future legs to implement. The following shared infrastructure changes would be needed as **deferred edits**:

1. **`app/ui/site-styles.ts`** — Add `--start-*` custom properties or a `startScreenStyles` export object with the target values from section 5.6
2. **`app/ui/game-shell.tsx`** — Consider a `StartScreen` wrapper component that bundles `GameScreen padded` + internal rhythm CSS, or at minimum document the expected DOM pattern

These deferred edits are outside the owned-files set for this leg and are recorded here for planning purposes only.