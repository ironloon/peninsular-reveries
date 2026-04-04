# Architecture

## Project

**Peninsular Reveries** is a lo-fi personal website for self-contained web games, puzzles, and code experiments. It is deployed as a static GitHub Pages site and designed to stay simple to extend.

`README.md` is the source of truth for game principles and site values. Read it before building or substantially modifying a game.

## Constraints

- Stack: TypeScript + Remix 3 packages (`component`, `fetch-router`, `node-fetch-server`) + esbuild + vanilla CSS + GitHub Pages
- Hosting: GitHub Pages with static files in `dist/`
- Build: `tsx build.ts`
- Dev: `tsx server.ts`
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
app/                     server and build-time code
  routes.ts              route map
  router.ts              router setup
  controllers/           page controllers
  ui/                    document shell and shared UI
  data/                  registry and content data

client/                  browser code bundled into dist/client/
  shell.ts               theme toggle and service worker registration
  404.ts                 random 404 tagline
  <game>/                game code modules

public/                  static assets copied to dist/
  styles/                site and game CSS
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
6. Add `public/styles/[game-slug].css` if needed.
7. Add the static route to `build.ts`.
8. Add scoped PWA assets in `public/[game-slug]/manifest.json` and `public/[game-slug]/sw.js`.
9. Pass `includeNav={false}` from the game controller.
10. Add a `Menu` overlay with Home, controls help, settings, reduce-motion, and credits when needed.
11. If media attributions change, update `app/data/attributions.ts` and run `npm run sync:attributions`.
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

## DOM-Based Game Architecture

Games use vanilla TypeScript with direct DOM manipulation. This is intentional for accessibility, tiny bundles, CSS-first motion, and responsive layout without canvas barriers.

## Game Implementation Rules

- Use a dedicated body class per game page and treat that body as a full-height flex column root.
- Pair `body.<game> main { display: flex; flex: 1; min-height: 0; }` with a full-width scene container.
- Pass `includeNav={false}` to `Document` for full-screen game pages.
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
- State functions should stay pure.
- Normalize game input sources to semantic actions.
- Prefer CSS-first animation with JS promise wrappers.
- Homepage controller navigation should keep keyboard semantics first.
- Keep per-page payloads within the budget target.
- Use scoped PWA manifests with `"start_url": "./"` and `"scope": "./"`.
- Root offline support lives in `public/sw.js`; game workers own game-specific caches.
- `ATTRIBUTIONS.md` is generated from `app/data/attributions.ts`.

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
