# Architecture

## Project

**Peninsular Reveries** is a lo-fi personal website for self-contained web games, puzzles, and code experiments. It is deployed as a static GitHub Pages site and designed to stay simple to extend.

`README.md` is the source of truth for game principles and site values. Read it before building or substantially modifying a game.

## Constraints

- Stack: TypeScript + Remix 3 packages (`component`, `fetch-router`, `node-fetch-server`) + esbuild + hybrid CSS (`css()` mixins for shared/page UI, external stylesheets for large game-specific systems) + GitHub Pages
- Hosting: GitHub Pages with static files in `dist/`
- Build: `tsx --tsconfig config/tsconfig.json build.ts`
- Dev: `tsx --tsconfig config/tsconfig.json server.ts`
- Base path: GitHub Pages deploys under a project subpath; builds use `SITE_BASE_PATH` and `SITE_ORIGIN` env vars for asset URLs, nav links, OG metadata, and service worker registration.
- Design: clean typography, good spacing, a few intentional personality touches without heavy maintenance cost

## Technology Stack

### Remix 3 Packages
- `remix/component` — JSX component system
- `remix/component/server` — `renderToString()` for static HTML generation
- `remix/component/jsx-runtime` — JSX runtime
- `remix/fetch-router` — typed route map and request routing
- `remix/fetch-router/routes` — route helpers
- `remix/node-fetch-server` — dev server bridge from Node HTTP to Fetch

### Core Runtime
- TypeScript `^5.9`
- esbuild `^0.25`
- tsx `^4.21`
- Node `>=22.6` with the repo pinned to `24.14.1`

## Architecture Layout

```text
config/                  toolchain and repo config
  budget.json            Lighthouse budgets
  eslint.config.mjs      ESLint flat config
  playwright.config.ts   Playwright config
  tsconfig.json          TypeScript project config

app/                     server and build-time code
  routes.ts              route map
  router.ts              router setup
  controllers/           page controllers
  ui/                    document shell, shared UI, and shared style helpers
  data/                  registry and content data

client/                  browser code bundled into dist/client/
  shell.ts               theme toggle and service worker registration
  404.ts                 random 404 tagline
  <game>/                game code modules
    *.test.ts            colocated logic/data tests for that game when useful

e2e/                     Playwright browser specs for rendered-site behavior
  site-*.spec.ts         responsive, navigation, semantic HTML, a11y, and gameplay UI checks

public/                  static assets copied to dist/
  styles/                global foundation CSS plus large game-specific stylesheets
  manifest.json          root PWA manifest
  sw.js                  root service worker

build.ts                 static site generator
server.ts                dev server with live reload
```

## Adding a New Game

1. Create `client/[game-slug]/main.ts`.
2. Add the game to `app/data/game-registry.ts` with `status: 'live'`.
3. Create `app/controllers/[game-slug].tsx`.
4. Add the route in `app/routes.ts` and wire it in `app/router.ts`.
5. Add esbuild entries in `build.ts` and `server.ts`.
6. Add `public/styles/[game-slug].css` when the game needs substantial game-specific art, animation, or client-runtime class hooks; use shared `app/ui/` helpers and `css()` mixins for repeated shell/layout rules.
7. Add the static route to `build.ts`.
8. Add scoped PWA assets in `public/[game-slug]/manifest.json` and `public/[game-slug]/sw.js`.
9. Pass `includeNav={false}` and `includeFooter={false}` from the game controller.
10. Add a `Menu` overlay with Home, controls help, settings, reduce-motion, and credits when needed.
11. If media attributions change, update the relevant file in `app/data/attributions/` and run `npm run sync:attributions`.
12. Add both unit and e2e tests for new logic and UI behavior.

## Game Module Contract

Every game in `client/` follows this pattern:

- `main.ts` — entry point and loop coordination
- `types.ts` — TypeScript interfaces and constants
- `state.ts` — pure state transitions
- `renderer.ts` — DOM rendering and updates
- `input.ts` — pointer, keyboard, and gamepad handling via `InputCallbacks`
- `accessibility.ts` — announcements and focus management
- `animations.ts` — CSS-first animation helpers
- `sounds.ts` — Web Audio API synth logic
- `sample-manifest.ts` — optional bundled audio metadata and sourcing info when a game ships curated samples
- `*.test.ts` — colocated pure-logic or data-shape tests when that makes ownership clearer

## DOM-Based Game Architecture

Games use vanilla TypeScript with direct DOM manipulation. This is intentional for accessibility, tiny bundles, CSS-first motion, and responsive layout without canvas barriers.

Site pages and shared server-rendered UI may use Remix `css()` mixins for co-located styles without changing the DOM-first game runtime model.

## Styling Architecture

This repo uses a hybrid CSS model.

- Prefer Remix `css()` mixins in `app/` for shared server-rendered UI, page layouts, repeated game shell rules, modal shells, live-region helpers, and other styles that belong next to JSX structure.
- Keep `public/styles/*.css` for global foundation CSS and large game-specific visual systems, especially when browser code relies on stable class hooks or when a game carries art-heavy selectors and long animation sections.
- `public/styles/main.css` is the global foundation stylesheet: root tokens, theme overrides, theme-toggle styling, and view-transition/reduced-motion glue. Avoid moving page-specific layouts or reusable component chrome back into it.
- Shared site/page styling lives in `app/ui/` alongside the owning component or shared helper, for example `site-styles.ts`, `game-card.tsx`, and `game-shell.tsx`.
- Shared full-screen game shell behavior belongs in `app/ui/game-shell.tsx`. Do not duplicate site chrome hiding, game `main` layout, base screen-slide transitions, base settings-modal overlay behavior, or `.sr-only` rules across every game stylesheet unless a game truly needs an override.

## Game Implementation Rules

- Use a dedicated body class per game page and treat that body as the game-specific token/background root.
- Let `Document` apply the shared full-screen `main` layout for games; do not restate `body.<game> main` rules unless a game needs a real override.
- Hide shared site chrome by omitting it in `Document` (`includeNav={false}`, `includeFooter={false}`) instead of re-adding hide rules in each game stylesheet.
- Use shared game shell helpers for screen wrappers, settings modal shells, and live regions when the markup shape matches.
- Use `viewport-fit=cover` and safe-area padding for full-screen game pages.
- Give fixed overlays the same safe-area-aware padding as the game root.
- Keep site navigation inside the game UI, not the shared site header.
- Include scoped install and offline support under `public/[game-slug]/`.
- Include `#game-status` and `#game-feedback` live regions.
- Include a `noscript` fallback.
- Keep a consistent `Menu` button on start and active screens.
- Keep motion controls aligned with OS preference until changed, then persist via `localStorage('reduce-motion')` and `data-reduce-motion` on `<html>`.

## Conventions

- Use `.tsx` for server-rendered JSX in `app/`.
- Use `innerHTML` prop for inline scripts in JSX.
- Generated HTML should use absolute paths.
- Prefer co-located `css()` mixins for shared/page UI and reserve external stylesheets for game-specific, art-heavy, or class-driven runtime styles.
- State functions should stay pure.
- Normalize game input sources to semantic actions.
- Prefer CSS-first animation with JS promise wrappers.
- Homepage controller navigation should keep keyboard semantics first.
- Keep per-page payloads within the budget target.
- Use scoped PWA manifests with `"start_url": "./"` and `"scope": "./"`.
- Root offline support lives in `public/sw.js`; game workers own game-specific caches.
- When a game-scoped service worker precaches media files, bump its `CACHE_NAME` whenever bundled audio or art bytes change so clients do not stay stuck on stale assets.
- `ATTRIBUTIONS.md` is generated from `app/data/attributions/`.

## Build Flow

1. `build.ts` cleans `dist/` and copies `public/`.
2. esbuild bundles client entries into `dist/client/`.
3. Controllers render HTML via `renderToString()` into `dist/`.
4. Performance budget checks run per page.

## Dev Flow

1. `server.ts` starts esbuild in watch mode to `.dev-client/`.
2. `node-fetch-server` runs the dev HTTP server.
3. The router renders HTML fresh on each request.
4. Static files are served from `public/` and the esbuild output.
5. SSE-based live reload watches `app/`, `client/`, and `public/`.
