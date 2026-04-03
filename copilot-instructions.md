<!-- GSD:project-start source:PROJECT.md -->
## Project

**Peninsular Reveries**

A lo-fi personal website for hosting self-contained web games, puzzles, and code experiments. Built with web standards and cherry-picked Remix 3 packages. Clean, minimal aesthetic with subtle personality. Deployed as a static site on GitHub Pages.

**Core Value:** A frictionless home for creative projects — dead simple to add new games and experiments, beautiful to look at, zero maintenance overhead.

### Constraints

- **Stack**: TypeScript + Remix 3 packages (html-template, fetch-router, node-fetch-server, response) + esbuild + vanilla CSS + GitHub Pages
- **Hosting**: GitHub Pages (static files in dist/)
- **Build**: `tsx build.ts` — pre-renders HTML via fetch-router, bundles client JS with esbuild
- **Dev**: `tsx server.ts` — single dev server with live reload, no stale files
- **Design**: Must look good with minimal design effort. Clean typography, good spacing, a few intentional personality touches.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

### Remix 3 Packages (cherry-picked from `remix@next`)
| Package | Import Path | Purpose |
|---------|-------------|---------|
| html-template | `remix/html-template` | Safe HTML generation via tagged template literals with auto-XSS-escaping |
| fetch-router | `remix/fetch-router` | Type-safe route map + Request→Response routing |
| fetch-router/routes | `remix/fetch-router/routes` | Route definition helpers (`route()`) |
| node-fetch-server | `remix/node-fetch-server` | Dev server — Node.js HTTP → Fetch API bridge |
| response/html | `remix/response/html` | `createHtmlResponse()` helper |

### Core Runtime
| Technology | Purpose |
|------------|---------|
| TypeScript ^5.9 | All source code, strict mode |
| esbuild ^0.25 | Bundle client TS → browser JS (ESM, ES2022, minified) |
| tsx ^4.21 | Run build.ts and server.ts directly |
| Node.js ≥22.6 | Build-time execution |

### Architecture
```
app/                     ← Server/build-time code (Remix packages)
  routes.ts              ← Route map (fetch-router)
  router.ts              ← Router setup
  controllers/
    home.ts              ← GET / — game gallery (server-rendered)
    not-found.ts         ← 404 page
    super-word.ts        ← Game page HTML shell
  ui/
    document.ts          ← HTML document wrapper (html template tag)
    nav.ts               ← Nav generated from game registry
  data/
    game-registry.ts     ← Game catalogue (single source of truth)

client/                  ← Browser code (bundled by esbuild → dist/client/)
  shell.ts               ← Theme toggle
  404.ts                 ← Random 404 tagline
  super-word/            ← Game code (vanilla TypeScript + DOM)
    main.ts, state.ts, renderer.ts, input.ts,
    puzzles.ts, sounds.ts, animations.ts,
    accessibility.ts, types.ts

public/                  ← Static assets (copied as-is to dist/)
  styles/main.css, styles/game.css
  favicon.svg, apple-touch-icon.png, og-image.png

build.ts                 ← Static site generator
server.ts                ← Dev server with live reload
```

### Adding a New Game

1. Create `client/[game-slug]/main.ts` (entry point)
2. Add entry to `app/data/game-registry.ts`
3. Create `app/controllers/[game-slug].ts` (page HTML via html template)
4. Add route to `app/routes.ts` and wire in `app/router.ts`
5. Add esbuild entry in `build.ts` and `server.ts`
6. Add CSS to `public/styles/[game-slug].css` if needed
7. Add static route to `build.ts` `staticRoutes` array

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

Do NOT convert game code to Remix components or any framework. The vanilla DOM approach is optimal for accessible educational games.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **html template tag** for all HTML generation in controllers — auto-escapes by default, use `html.raw` only for trusted fragments
- **Absolute paths** in generated HTML (`/styles/main.css`, `/client/shell.js`) — no relative `./` paths
- **Pure state functions** in game code — all state transitions return new state objects
- **InputCallbacks interface** — all game input sources (pointer, keyboard, gamepad) normalize to semantic game actions
- **CSS-first animation** — animations as CSS classes, JS wraps in Promises, respects `prefers-reduced-motion`
- **200KB per-page budget** — HTML + CSS + JS (excluding sourcemaps)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

### Build Flow
1. `build.ts` cleans `dist/`, copies `public/` static assets
2. esbuild bundles `client/*.ts` → `dist/client/` (ESM, minified)
3. Router pre-renders each route: `router.fetch(url)` → write HTML to `dist/`
4. Performance budget enforced per page

### Dev Flow
1. `server.ts` starts esbuild in watch mode (client code → `.dev-client/`)
2. node-fetch-server creates HTTP server using the router
3. Router generates HTML fresh on every request (no stale files)
4. Static files served from `public/` and esbuild output
5. SSE-based live reload triggers on any file change in `app/`, `client/`, `public/`

### Request Handling (Dev)
1. `/__reload` → SSE endpoint for live reload
2. `/client/*` → esbuild output (bundled JS)
3. `/styles/*`, `/favicon.svg`, etc. → static files from `public/`
4. `/`, `/super-word/`, etc. → router generates HTML via controllers
5. Anything else → 404 controller
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
