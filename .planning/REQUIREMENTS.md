# Requirements: Peninsular Reveries

**Defined:** 2026-03-27
**Core Value:** A frictionless home for creative projects — dead simple to add new games and experiments, beautiful to look at, zero maintenance overhead.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Site Foundation

- [ ] **SITE-01**: Site has responsive layout that works on phone, tablet, and desktop *(Phase 1 — pending automated verification in Phase 6)*
- [ ] **SITE-02**: User can navigate between homepage and individual game pages via simple links; back button works; all pages are URL-addressable *(Phase 1 — pending automated verification in Phase 6)*
- [ ] **SITE-03**: Every page has semantic HTML structure (title, meta description, heading hierarchy, main, nav) *(Phase 1 — pending automated verification in Phase 6)*
- [x] **SITE-04**: Every page has Open Graph meta tags (og:title, og:description, og:image, og:url) for social sharing previews
- [ ] **SITE-05**: Site has SVG favicon and apple-touch-icon *(Phase 1 — pending automated verification in Phase 6)*
- [ ] **SITE-06**: Pages show graceful fallback when JS is unavailable (noscript message) and catch unhandled errors *(Phase 1 — pending automated verification in Phase 6)*
- [x] **SITE-07**: Homepage displays projects as visual cards with name, one-line description, and preview image/icon

### Super Word Game

- [x] **GAME-01**: Full TypeScript rewrite of Super Word — same find-letters-spell-words concept, polished visuals and UX
- [x] **GAME-02**: All interactive game elements navigable via keyboard (Tab, visible focus indicators, keyboard alternatives to drag-and-drop)
- [x] **GAME-03**: Game supports touch interaction via Pointer Events API with 44px+ touch targets
- [x] **GAME-04**: Game provides visual and text feedback for all state changes (correct letter, wrong item, hint shown, level complete, game win) with aria-live announcements
- [x] **GAME-05**: Game meets WCAG 2.1 AA color contrast requirements (4.5:1 for normal text, 3:1 for large text)

### Visual Design & Polish

- [x] **LOOK-01**: Site uses View Transitions API for smooth animated page navigation (progressive enhancement — degrades gracefully)
- [ ] **LOOK-02**: Game progress and scores persist in localStorage across sessions — *descoped from v1 per D-01*
- [x] **LOOK-03**: Game completion screen offers "share results" button that copies emoji score summary to clipboard
- [x] **LOOK-04**: Site supports dark mode via prefers-color-scheme with CSS custom properties
- [x] **LOOK-05**: All animations respect prefers-reduced-motion (tone down or skip entirely)
- [x] **LOOK-06**: Site has personality micro-interactions (hover effects, subtle animations, playful 404 page)
- [ ] **LOOK-07**: Games show branded/fun loading indicator while assets initialize — *descoped from v1 per D-09*
- [ ] **LOOK-08**: Site includes privacy-respecting, cookie-free analytics (Plausible or similar) — *descoped from v1 per D-05*

### Build & Deploy

- [ ] **INFRA-01**: TypeScript source compiles to static files via minimal build step (esbuild) *(Phase 1 — pending automated verification in Phase 6)*
- [ ] **INFRA-02**: Site deploys to GitHub Pages via GitHub Actions on push to main *(Phase 1 — pending automated verification in Phase 6)*
- [x] **INFRA-03**: Total page weight under 200KB per page, LCP under 1.5s on 3G

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Future Enhancements

- **PWA-01**: Service Worker for offline play (cache game assets on first visit)
- **PWA-02**: PWA manifest for installable app experience
- **TMPL-01**: Formalized "add new game" template pattern (emerge after game #2)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / login | Requires backend, auth, security maintenance — massive complexity for personal site |
| Backend / database | Hosting costs, maintenance overhead, violates "zero maintenance" core value |
| Blog / CMS | Writing-heavy content explicitly excluded — not interested |
| Comments / guestbook | Spam moderation, backend requirements, privacy concerns |
| Complex game leaderboards | Requires backend, abuse prevention — localStorage personal best suffices |
| Newsletter / email signup | Email service costs, GDPR compliance, not aligned with creative/experimental nature |
| Cookie consent banner | No cookies used — cookie-free analytics eliminates the need |
| Multiplayer / real-time | WebSocket server, state sync — enormous complexity for personal games |
| React / heavy framework | Explicitly excluded — web standards philosophy, no vendor lock-in |
| Complex build pipeline (Vite/Webpack) | Configs bitrot, setup friction after breaks — minimal esbuild script only |
| Internationalization (i18n) | Massive overhead for a personal site — English only for now |
| Remix 3 packages at launch | Research concluded fetch-router is server-side only, html-template is marginal — revisit later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SITE-01 | Phase 1, Phase 6 | Pending |
| SITE-02 | Phase 1, Phase 6 | Pending |
| SITE-03 | Phase 1, Phase 6 | Pending |
| SITE-04 | Phase 3 | Complete |
| SITE-05 | Phase 1, Phase 6 | Pending |
| SITE-06 | Phase 1, Phase 6 | Pending |
| SITE-07 | Phase 3 | Complete |
| GAME-01 | Phase 2 | Complete |
| GAME-02 | Phase 2 | Complete |
| GAME-03 | Phase 2 | Complete |
| GAME-04 | Phase 2 | Complete |
| GAME-05 | Phase 2 | Complete |
| LOOK-01 | Phase 5 | Complete |
| LOOK-02 | Phase 4 | Descoped |
| LOOK-03 | Phase 4 | Complete |
| LOOK-04 | Phase 3 | Complete |
| LOOK-05 | Phase 4 | Complete |
| LOOK-06 | Phase 3 | Complete |
| LOOK-07 | Phase 4 | Descoped |
| LOOK-08 | Phase 5 | Descoped |
| INFRA-01 | Phase 1, Phase 6 | Pending |
| INFRA-02 | Phase 1, Phase 6 | Pending |
| INFRA-03 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23 ✓
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-29 after v1.0 milestone audit gap closure planning*
