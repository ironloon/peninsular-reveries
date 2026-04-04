## Project

**Peninsular Reveries**

A lo-fi personal website for hosting self-contained web games, puzzles, and code experiments. Built with web standards and Remix 3 packages. Clean, minimal aesthetic with subtle personality. Deployed as a static site on GitHub Pages. Installable as a PWA for offline play.

**Core Value:** A frictionless home for creative projects — dead simple to add new games and experiments, beautiful to look at, zero maintenance overhead.

### README Reference

`README.md` is the source of truth for game principles and site values.
This file should only capture the repo-specific implementation rules, architecture constraints, and testing conventions that follow from those principles.

Before building or modifying any game, read `README.md` and follow the `Game Principles` section there.

### Session Expectations

- Default to **human-ready completion** for non-trivial feature work. Do not stop at code edits alone when the clear user intent is "ready for me to try it." Continue through generated-file sync, repository validation, and low-risk regression fixes unless the user explicitly scopes the work smaller.
- Treat **`npm run test:local`** as the preferred end-state check before handoff when the change is large enough to affect app behavior beyond a single isolated file.
- If a validation run finds an **objective blocker to human testing** that was introduced or exposed by the current work, fix it before stopping when the fix is clear and low-risk. Examples: stale generated files, shared responsive overflow, broken hidden-state CSS, route/build wiring gaps.
- Ask the user a clarifying question only when the answer would materially change the implementation, or when proceeding would require a destructive, irreversible, or product-direction choice. If a reasonable default exists, use it and keep going.
- If the user says some version of **"continue until done"**, interpret "done" as **human-ready unless genuinely blocked**.
- If the user has made it clear that **pushing finished work is welcome**, and the work is validated and human-ready, the agent may stage, commit, and push without asking for one more round of confirmation.
- Keep the closeout focused on readiness. Do **not** default to optional extra suggestions or "I can also..." follow-ups unless one of these is true:
  1. the user explicitly asked for options,
  2. something still blocks human readiness,
  3. there is a single obvious next required step outside the repo work already completed.
- When everything needed for human testing is complete, end with what changed and what was verified. Avoid trailing suggestions for unrelated polish or future work.

### Constraints

- **Stack**: TypeScript + Remix 3 (component, fetch-router, node-fetch-server) + esbuild + vanilla CSS + GitHub Pages
- **Hosting**: GitHub Pages (static files in dist/)
- **Build**: `tsx build.ts` — pre-renders HTML via Remix JSX components + renderToString, bundles client JS with esbuild
- **Dev**: `tsx server.ts` — single dev server with live reload, no stale files
- **Design**: Must look good with minimal design effort. Clean typography, good spacing, a few intentional personality touches.

## Technology Stack

### Remix 3 Packages (cherry-picked from `remix@next`)
| Package | Import Path | Purpose |
|---------|-------------|---------|
| component | `remix/component` | JSX component system (server rendering + client hydration) |
| component/server | `remix/component/server` | `renderToString()` for static HTML generation |
| component/jsx-runtime | `remix/component/jsx-runtime` | JSX runtime (automatic via tsconfig jsxImportSource) |
| fetch-router | `remix/fetch-router` | Type-safe route map + Request→Response routing |
| fetch-router/routes | `remix/fetch-router/routes` | Route definition helpers (`route()`) |
| node-fetch-server | `remix/node-fetch-server` | Dev server — Node.js HTTP → Fetch API bridge |

### Core Runtime
| Technology | Purpose |
|------------|---------|
| TypeScript ^5.9 | All source code, strict mode, JSX via react-jsx |
| esbuild ^0.25 | Bundle client TS → browser JS (ESM, ES2022, minified) |
| tsx ^4.21 | Run build.ts and server.ts directly |
| Node.js ≥22.6 | Build-time execution |

### Architecture
```
app/                     ← Server/build-time code (Remix components)
  routes.ts              ← Route map (fetch-router)
  router.ts              ← Router setup
  controllers/
    home.tsx             ← GET / — game gallery (JSX + renderToString)
    not-found.tsx        ← 404 page
    super-word.tsx       ← Game page HTML shell
  ui/
    document.tsx         ← HTML document wrapper (JSX component)
    nav.tsx              ← Nav generated from game registry
  data/
    game-registry.ts     ← Game catalogue with status (live/coming-soon)

client/                  ← Browser code (bundled by esbuild → dist/client/)
  shell.ts               ← Theme toggle + service worker registration
  404.ts                 ← Random 404 tagline
  super-word/            ← Game code (vanilla TypeScript + DOM)
    main.ts, state.ts, renderer.ts, input.ts,
    puzzles.ts, sounds.ts, animations.ts,
    accessibility.ts, types.ts

public/                  ← Static assets (copied as-is to dist/)
  styles/main.css, styles/game.css
  manifest.json          ← PWA manifest
  sw.js                  ← Service worker for offline support
  favicon.svg, apple-touch-icon.png, og-image.png

build.ts                 ← Static site generator
server.ts                ← Dev server with live reload
```

### Adding a New Game

1. Create `client/[game-slug]/main.ts` (entry point)
2. Add entry to `app/data/game-registry.ts` with `status: 'live'`
3. Create `app/controllers/[game-slug].tsx` (page JSX via renderToString)
4. Add route to `app/routes.ts` and wire in `app/router.ts`
5. Add esbuild entry in `build.ts` and `server.ts`
6. Add CSS to `public/styles/[game-slug].css` if needed
7. Add static route to `build.ts` `staticRoutes` array
8. Add scoped PWA assets in `public/[game-slug]/manifest.json` and `public/[game-slug]/sw.js`
9. If the game adds or changes credits, update `app/data/attributions.ts` and run `npm run sync:attributions`
10. Add tests in both `tests-node/` and `tests/` when the game introduces new logic and UI behavior

### Game Module Contract

Every game in `client/` follows this file pattern:
- `main.ts` — Entry point, game loop, coordinates all subsystems
- `types.ts` — TypeScript interfaces for game state
- `state.ts` — Pure functions for immutable state transitions
- `renderer.ts` — DOM rendering (creates/updates elements)
- `input.ts` — Unified pointer/keyboard/gamepad handling via InputCallbacks interface
- `accessibility.ts` — ARIA announcements, focus management
- `animations.ts` — CSS-first animation promises, respects prefers-reduced-motion
- `sounds.ts` — Web Audio API synth (no external audio files)

### Games: DOM-Based Architecture

Games use vanilla TypeScript with direct DOM manipulation. This is intentional — DOM rendering provides:
- Free accessibility (screen readers, keyboard nav, ARIA)
- CSS animations with prefers-reduced-motion
- Responsive layout via CSS
- No canvas accessibility barriers
- Tiny bundles (no framework overhead)

### Game Implementation Rules

Game pages should follow these structural rules unless there is a strong reason not to:
- Use a dedicated body class per game page and treat that body as a full-height flex column root
- Pair `body.<game> main { display: flex; flex: 1; min-height: 0; }` with a full-width `.scene-track`
- For full-screen game pages, opt into `viewport-fit=cover` and pad the game root with `env(safe-area-inset-*)` so iPhone/Dynamic Island/home-indicator devices keep content inside visible bounds
- Any fixed overlays (`settings`, celebration popups, noscript banners) need the same safe-area-aware padding as the game root
- On short mobile and landscape viewports, provide a scroll path or tighter layout for non-gameplay screens instead of clipping controls below the fold
- Include scoped install/offline support per game under `public/[game-slug]/`, not at the site root
- Include `#game-status` and `#game-feedback` aria-live regions for narrated state changes
- Include a `noscript` fallback message because the game page itself is pre-rendered even when gameplay needs JS
- Keep settings/credits in the game UI when the game has entries in `app/data/attributions.ts`

## Conventions

- **JSX components** for all server-rendered HTML — `app/` files use `.tsx` extension
- **innerHTML prop** for inline scripts in JSX (Remix component convention, not React's dangerouslySetInnerHTML)
- **Absolute paths** in generated HTML (`/styles/main.css`, `/client/shell.js`) — no relative `./` paths
- **Pure state functions** in game code — all state transitions return new state objects
- **InputCallbacks interface** — all game input sources (pointer, keyboard, gamepad) normalize to semantic game actions
- **CSS-first animation** — animations as CSS classes, JS wraps in Promises, respects `prefers-reduced-motion`
- **200KB per-page budget** — HTML + CSS + JS (excluding sourcemaps)
- **Scoped PWA manifests** — game manifests use `"start_url": "./"` and `"scope": "./"` so Pages/project-site deploys work correctly
- **Playwright spec naming** — browser tests must match `site-*.spec.ts` because `playwright.config.ts` only picks up that pattern
- **Generated attribution file** — `ATTRIBUTIONS.md` is generated from `app/data/attributions.ts`; keep it synced with `npm run sync:attributions`

## Testing Guidance

- Start with `npm run check` for fast lint + typecheck feedback
- Keep pure logic, config, build, workflow, and data-shape checks in `tests-node/`
- Keep rendered-site and browser behavior checks in Playwright under `tests/`
- Node-side TypeScript tests should use extensionless workspace imports
- `npm install` sets `core.hooksPath` to the repo-owned `.githooks/` directory via `prepare`; commits run the local validation gate automatically without an extra hook dependency
- Full local verification is `npm run test:local`
- When adding a new game route, prefer one targeted Playwright spec for the new page rather than expanding unrelated suites first
- After the targeted checks are green, run the repo's broader validation gate before handoff whenever the user intent is manual testing or release-readiness
- If a change updates `app/data/attributions.ts`, keep `ATTRIBUTIONS.md` synced before considering the work human-ready

## Architecture

### Build Flow
1. `build.ts` cleans `dist/`, copies `public/` static assets
2. esbuild bundles `client/*.ts` → `dist/client/` (ESM, minified)
3. Controllers render JSX via `renderToString()`, write HTML to `dist/`
4. Performance budget enforced per page

### Dev Flow
1. `server.ts` starts esbuild in watch mode (client code → `.dev-client/`)
2. node-fetch-server creates HTTP server using the router
3. Router generates HTML fresh on every request (no stale files)
4. Static files served from `public/` and esbuild output
5. SSE-based live reload triggers on any file change in `app/`, `client/`, `public/`
