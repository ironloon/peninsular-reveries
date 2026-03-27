# Feature Research

**Domain:** Personal creative web portfolio with browser games
**Researched:** 2026-03-27
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features visitors assume exist. Missing these = the site feels broken or abandoned.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Responsive layout** | Visitors will find games via mobile links/shares — site must work on phone, tablet, desktop | MEDIUM | CSS grid/flexbox. Games need special attention for touch targets and viewport fitting. Super Word's drag-and-drop must translate to touch. |
| **Fast initial load** | Static site on GitHub Pages should feel instant. Anything over 2s LCP and visitors bounce | LOW | No framework = inherently fast. Keep total page weight <200KB. Inline critical CSS. Lazy-load game assets. |
| **Working navigation** | Visitors need to move between homepage and individual games/experiments | LOW | Simple — home page links to `/super-word/`, etc. Back button must work. URL-addressable pages (no hash routing hacks). |
| **Semantic HTML & basic SEO** | Search engines and assistive tech need structure. Games linked from social media need to render clean previews | LOW | `<title>`, `<meta description>`, proper heading hierarchy, `<main>`, `<nav>`. Also canonical URLs since GitHub Pages can serve www and non-www. |
| **Open Graph meta tags** | When someone shares a game link on Discord/Twitter/iMessage, it should show a title, description, and preview image — not a blank card | LOW | `og:title`, `og:description`, `og:image`, `og:url` per page. `og:type: website`. Twitter card meta too. Need a 1200×630 preview image per game. |
| **Keyboard navigability** | Users who can't or don't use a mouse must be able to use the site. Basic WCAG 2.1 AA | MEDIUM | All interactive elements focusable via Tab, visible focus indicators, Escape to dismiss overlays. Games need keyboard alternatives for drag-and-drop (e.g., click-to-select then click-to-place). |
| **Color contrast** | WCAG 2.1 AA requires 4.5:1 contrast ratio for normal text, 3:1 for large text | LOW | Choose palette with contrast in mind from the start. Test with browser dev tools. |
| **Touch support for games** | Mobile visitors expect to tap, drag, swipe. Super Word's letter collection must work via touch | MEDIUM | Pointer Events API (unified mouse + touch) over separate mouse/touch handlers. Touch targets ≥44px (WCAG). Drag-and-drop libraries often break on mobile — test explicitly. |
| **Game feedback states** | Players need to know what's happening: correct answer, wrong answer, hint available, level complete | LOW | Visual + text feedback. The existing prototype has toast notifications and screen transitions — carry these forward. Use `aria-live` regions for screen reader announcements. |
| **Error/empty states** | Broken JS, missing assets, or unsupported browsers shouldn't show a white screen | LOW | Graceful degradation. At minimum show the page title and a "This game requires JavaScript" message in `<noscript>`. Catch unhandled errors. |
| **Favicon** | Missing favicon = 404 in console + looks unprofessional | LOW | SVG favicon (scales well, supports dark mode via `prefers-color-scheme` in SVG). Plus 180×180 apple-touch-icon. |

### Differentiators (Competitive Advantage)

Features that make visitors think "oh, this is nice" — the stated design goal.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **View Transitions between pages** | Smooth animated transitions when navigating between homepage and games. Makes the site feel like an app, not a bunch of HTML files. Directly supports the "pause and think 'oh, this is nice'" goal. | MEDIUM | View Transition API has full support in Chrome 111+, Edge 111+, Firefox 144+, Safari 18+. MPA (cross-document) transitions supported via `@view-transition` CSS at-rule. Progressive enhancement — works without in older browsers. Zero JavaScript needed for basic cross-fade. |
| **Personality micro-interactions** | Small unexpected delights — hover effects, subtle animations on game elements, a playful 404 page. The "quirky personality touches" called out in PROJECT.md. | LOW-MEDIUM | CSS animations + transitions. Keep lightweight. Examples: letters wiggle when found, stars twinkle, hover reveals something fun. Respect `prefers-reduced-motion`. |
| **Reduced motion support** | Respect `prefers-reduced-motion: reduce`. Games tone down animations; page transitions become instant cross-fades or are skipped entirely. Accessibility *as* a feature. | LOW | `@media (prefers-reduced-motion: reduce)` to disable/simplify animations. Already Baseline Widely Available across all browsers. |
| **Dark mode support** | Respect `prefers-color-scheme`. Site looks good in both light and dark. | MEDIUM | CSS custom properties for theme colors. `prefers-color-scheme: dark` media query. Games need themed palettes too. SVG favicon can adapt. Good for late-night gaming sessions. |
| **Game score persistence (localStorage)** | Players can close the tab and come back to their progress. Especially important for kids playing Super Word — if they leave, they shouldn't lose everything. | LOW | `localStorage` for scores, current level, collected letters. No backend needed. Clear/reset option. Small data, no expiry concerns. |
| **Wordle-style share results** | "Share your score" button that copies a text/emoji summary to clipboard. Social proof drives traffic back to the site. | LOW | `navigator.clipboard.writeText()` with emoji grid or score summary. No image generation needed. Example: "Super Word ⭐⭐⭐ 5/5 puzzles solved!" |
| **Service Worker for offline play** | Once loaded, games work offline. Perfect for kids on tablets with spotty wifi, or playing on a plane. | MEDIUM | Cache game assets via service worker. Static site is ideal for this — cache all HTML/CSS/JS on first visit. Use `workbox` recipes or hand-written SW. Not required for GitHub Pages deployment. PWA manifest optional but nice. |
| **Per-game loading states** | Show a branded/fun loading indicator while game assets initialize, rather than a blank screen or flash of unstyled content. | LOW | Skeleton screen or simple spinner with the game's branding. CSS-only preferred. |
| **Easy "add new game" pattern** | The site architecture makes adding a new game/experiment as simple as creating a directory with an `index.html`. Minimal boilerplate. This is the developer UX differentiator — directly supports the "return after breaks" requirement. | MEDIUM | Convention-based routing (folder = page). Shared layout/nav as a reusable template. New game = copy template, write game logic, deploy. No config files to edit. |
| **Subtle homepage project showcase** | Projects displayed with care — not just a list of links, but a visual grid or cards with preview images and one-line descriptions. | LOW-MEDIUM | CSS Grid with project cards. Each card: name, one-line description, preview image or icon. Links to game page. Keep minimal — 3-6 projects max before it scrolls. |
| **Privacy-respecting analytics** | Know if anyone visits without selling their data. Lightweight, no cookie banners needed. | LOW | Plausible, Fathom, or Umami (self-hosted). All are <1KB script, no cookies, GDPR-compliant without consent banners. Alternatively: use zero analytics — it's a personal site. Can add later without architectural changes. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to deliberately NOT build. These create maintenance burden or complexity out of proportion to value for a personal creative site.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User accounts / login** | "Let players save scores across devices" | Requires backend, database, auth flow, password reset, security maintenance. Massive complexity for a personal site. OWASP implications. | localStorage for per-device persistence. Share scores via clipboard text. |
| **Backend / database** | "Store high scores, analytics, user data" | Hosting costs, maintenance overhead, security surface area. Violates the "zero maintenance" core value. Developer will abandon it after a break. | Static-only. localStorage for client state. Third-party analytics if wanted. |
| **Blog / CMS** | "You should write about your projects" | Writing-heavy content explicitly out of scope (PROJECT.md). Blog maintenance is a separate commitment. Markdown-to-HTML pipeline adds build complexity. | Project pages can have brief descriptions. Link to GitHub repos for deeper context. |
| **Comments / guestbook** | "Let visitors leave feedback" | Spam moderation, backend requirements, or third-party widget loading (Disqus etc.) that destroys performance and privacy. | Link to GitHub Issues or social media profiles for feedback. |
| **Complex game leaderboards** | "Show top scores from all players" | Requires backend, moderation of names, abuse prevention. Players submit fake scores. Maintenance burden. | Personal best stored locally. "Share your score" for social comparison. |
| **Newsletter / email signup** | "Build an audience" | Email service costs, GDPR compliance, unsubscribe management. Not aligned with the project's creative/experimental nature. | GitHub follow, RSS feed (if blog ever added). |
| **Cookie consent banner** | "GDPR requires it" | Only required if you use cookies for tracking/analytics. The recommended stack uses no cookies. Adding a consent banner to a personal game site is absurd UX. | Don't use cookies. Use cookie-free analytics (Plausible/Fathom) or no analytics at all. |
| **Multiplayer / real-time features** | "Make games collaborative" | WebSocket server, state synchronization, conflict resolution, hosting costs. Enormous complexity. | Design games as single-player experiences. Social sharing for connection. |
| **React / heavy framework** | "Better component model, ecosystem" | Explicitly out of scope. Adds build complexity, bundle size, vendor lock-in. Violates web standards philosophy. Remix 3 is no-React by design. | Web Components, `html-template` from Remix 3, or plain DOM manipulation. TypeScript for type safety. |
| **Complex build pipeline** | "Need Vite/Webpack for HMR, bundling, tree-shaking" | Build tools break, configs bitrot, setup friction after breaks. Remix 3's "Religiously Runtime" philosophy avoids this. | TypeScript via `--import` loaders or a minimal esbuild script for static output. No HMR needed for game dev (just refresh). |
| **Internationalization (i18n)** | "Reach global audience" | String extraction, translation files, RTL layout, locale-aware formatting. Massive overhead for a personal site with a few games. | English only. If a game has minimal text (like Super Word's target words), keep strings in data files for easy future extraction. |

## Feature Dependencies

```
Responsive Layout
    └──enables──> Touch Support for Games
                      └──enables──> Game Score Persistence (need working game first)

Semantic HTML & SEO
    └──enables──> Open Graph Meta Tags (both are <head> concerns)
    └──enables──> Service Worker (needs well-structured pages to cache)

Working Navigation
    └──enhanced-by──> View Transitions (layer transitions on top of working nav)

Easy "Add New Game" Pattern
    └──requires──> Working Navigation (shared layout/template)
    └──requires──> Responsive Layout (template must be responsive)

Game Feedback States
    └──requires──> Keyboard Navigability (feedback must be announced to screen readers)
    └──enhanced-by──> Personality Micro-interactions (make feedback feel delightful)
    └──enhanced-by──> Reduced Motion Support (animations must be tone-downable)

Dark Mode Support
    └──requires──> CSS Custom Properties (theme architecture)
    └──conflicts-with──> Hard-coded colors in game assets (must use themed values)

Service Worker
    └──requires──> Fast Initial Load (don't cache bloated pages)
    └──enhanced-by──> Game Score Persistence (offline play needs state)

Wordle-style Share Results
    └──requires──> Game Score Persistence (need score data to format)
    └──requires──> Game Feedback States (share button appears on completion)
```

### Dependency Notes

- **Touch Support requires Responsive Layout:** Game UI must reflow for mobile before touch interactions make sense — no point handling touch events on a desktop-only layout.
- **View Transitions enhance Navigation:** Navigation must work first (plain links between pages). View Transitions are purely progressive enhancement layered on top.
- **Easy "Add New Game" requires Working Navigation + Responsive Layout:** The shared template/layout is the foundation for the low-friction game creation pattern.
- **Dark Mode conflicts with hard-coded game colors:** If Super Word uses inline color values, dark mode will look wrong. Game colors must use CSS custom properties from day one.
- **Service Worker requires fast initial load:** Caching bloated pages offline doesn't help — keep pages lean first, then cache them.

## MVP Definition

### Launch With (v1)

Minimum to validate the concept — "does this site feel good and is it easy to add projects?"

- [ ] **Homepage with project grid** — Shows Super Word (and placeholder for future games). Clean design, responsive.
- [ ] **Super Word game (rewritten)** — TypeScript rewrite of the AI prototype. Same concept (find letters, spell words), polished visuals, working touch + keyboard.
- [ ] **Responsive layout** — Works on phone, tablet, desktop. Games adapt to viewport.
- [ ] **Basic SEO + OG tags** — Every page has title, description, OG meta, preview image.
- [ ] **Keyboard navigability** — Full site and game navigable via keyboard. Visible focus indicators.
- [ ] **Favicon** — SVG favicon, apple-touch-icon.
- [ ] **Fast load** — <200KB total per page, <1.5s LCP on 3G.
- [ ] **Game feedback states** — Toast/announcements for correct/wrong, level complete, game complete.
- [ ] **Error states** — `<noscript>` fallback, unhandled error catch.

### Add After Validation (v1.x)

Features to add once core site + first game ship and feel right.

- [ ] **View Transitions** — Add cross-fade between pages once navigation is solid.
- [ ] **Game score persistence** — localStorage for level progress and scores.
- [ ] **Wordle-style share results** — Share button on game completion screen.
- [ ] **Dark mode** — Via `prefers-color-scheme` with CSS custom properties.
- [ ] **Reduced motion support** — `prefers-reduced-motion` for all animations.
- [ ] **Personality micro-interactions** — Hover effects, subtle animation polish.
- [ ] **Per-game loading states** — Branded loading indicator.
- [ ] **Privacy-respecting analytics** — Plausible or similar, only if curiosity demands it.

### Future Consideration (v2+)

Features to defer until the site has 2+ games and the pattern is proven.

- [ ] **Service Worker / offline play** — Once multiple games exist and caching strategy is clear.
- [ ] **PWA manifest** — Installable app, only if offline play is added.
- [ ] **Subtle homepage project showcase** — Cards with preview images/animations. Only worth the effort with 3+ projects.
- [ ] **Easy "add new game" template** — Formalize the pattern once you've added a second game and know what's actually shared.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Responsive layout | HIGH | MEDIUM | P1 |
| Fast initial load | HIGH | LOW | P1 |
| Working navigation | HIGH | LOW | P1 |
| Super Word game (rewrite) | HIGH | HIGH | P1 |
| Semantic HTML & SEO | MEDIUM | LOW | P1 |
| Open Graph meta tags | MEDIUM | LOW | P1 |
| Keyboard navigability | HIGH | MEDIUM | P1 |
| Touch support for games | HIGH | MEDIUM | P1 |
| Game feedback states | HIGH | LOW | P1 |
| Color contrast | HIGH | LOW | P1 |
| Favicon | LOW | LOW | P1 |
| Error/empty states | MEDIUM | LOW | P1 |
| View Transitions | MEDIUM | LOW | P2 |
| Game score persistence | MEDIUM | LOW | P2 |
| Reduced motion support | HIGH | LOW | P2 |
| Dark mode | MEDIUM | MEDIUM | P2 |
| Wordle-style share | MEDIUM | LOW | P2 |
| Micro-interactions | MEDIUM | LOW | P2 |
| Per-game loading states | LOW | LOW | P2 |
| Analytics | LOW | LOW | P2 |
| Service Worker / offline | MEDIUM | MEDIUM | P3 |
| PWA manifest | LOW | LOW | P3 |
| Easy "add new game" template | HIGH (developer) | MEDIUM | P3 |
| Homepage project showcase | MEDIUM | LOW-MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — site/game doesn't work without it
- P2: Should have, add after v1 ships — makes the site feel polished and delightful
- P3: Nice to have, defer until pattern emerges — worth doing once there are 2+ games

## Competitor Feature Analysis

| Feature | neal.fun | makingsoftware.com | wordle (NYT) | oimo.io | Our Approach |
|---------|----------|-------------------|--------------|---------|--------------|
| Navigation | Minimal — list of experiments | Clean nav, warm aesthetic | Single page, no nav | Grid of experiments | Simple homepage grid, links to game pages. Minimal nav. |
| Responsive design | Good — games adapt | Excellent | Excellent | Varies per experiment | Full responsive. Games must reflow for mobile. |
| Game save state | No — games reset | N/A | Cookie-based daily state | No | localStorage per game |
| Social sharing | No | No | Share emoji grid (signature feature) | No | Wordle-style text sharing on game completion |
| Loading states | Minimal | Smooth | Instant (tiny page) | Varies | Branded per-game loading. CSS-only. |
| Offline support | No | No | Yes (PWA) | No | Service Worker (future, P3) |
| Accessibility | Minimal | Good | Good (keyboard, screen reader) | Minimal | Full keyboard nav, aria-live, reduced motion, color contrast. Competitive advantage. |
| Dark mode | No | No | Yes | No | Yes, via `prefers-color-scheme` |
| Page transitions | No | Some | N/A | No | View Transitions API — distinctive when few sites use it |
| Personality / delight | High — core identity | Warm typography, intentional | Minimal, functional | High — creative experiments | Subtle personality touches. Intentional, not overdone. |
| Analytics | Unknown | Unknown | NYT analytics | Unknown | Plausible or none. Zero cookies. |

**Key takeaway:** The strongest creative portfolio sites (neal.fun, oimo.io) succeed via unique content and personality, not feature checklists. Accessibility and polish (dark mode, transitions, reduced motion) are where this site can differentiate from typical creative portfolios that neglect these. Making games genuinely accessible (keyboard + touch + screen reader) is rare in this space and worth doing properly.

## Sources

- MDN: View Transition API — https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API (verified browser support: Chrome 111+, Edge 111+, Firefox 144+, Safari 18+) [HIGH confidence]
- MDN: Making PWAs installable — https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable (service worker, manifest requirements) [HIGH confidence]
- Open Graph Protocol — https://ogp.me/ (required OG tags: og:title, og:type, og:image, og:url) [HIGH confidence]
- web.dev: Web Vitals — https://web.dev/articles/vitals (LCP <2.5s, INP <200ms, CLS <0.1) [HIGH confidence]
- MDN: prefers-reduced-motion — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion (Baseline Widely Available all browsers) [HIGH confidence]
- MDN: prefers-color-scheme — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme (Baseline Widely Available all browsers) [HIGH confidence]
- Existing Super Word prototype reviewed for current game feature set [HIGH confidence]
- Creative portfolio site patterns from training data (neal.fun, oimo.io, makingsoftware.com patterns) [MEDIUM confidence — based on training data, not live verification]

---
*Feature research for: Personal creative web portfolio with browser games*
*Researched: 2026-03-27*
