# Peninsular Reveries

Peninsular Reveries is a quiet home for web games, puzzles, and playful experiments.
Each project is small on purpose: fast to load, easy to revisit, and simple to keep alive.

## Game Principles

When a new game lands here, it should follow these principles:

1. **Every input, every screen.** Keyboard, touch, mouse, gamepad. Phone, tablet, desktop. If it has a screen and a button, it plays.
2. **Offline-first.** Every game is a PWA. Install it, lose signal, keep playing.
3. **Accessibility is not a feature.** Screen readers narrate the action. Audio cues signal when to move. `prefers-reduced-motion` is respected. Nobody's an afterthought.
4. **Nothing downloaded that can be made.** Sound is synthesized. HTML is pre-rendered. Budgets are enforced. The whole game fits in a service worker cache.
5. **No accounts, no tracking.** Progress lives in `localStorage` and nowhere else.
6. **Heart in, pixels out.** Tools change. The taste, the care, the odd little touches - those are the point.

## Project Shape

- Server-rendered pages live in `app/`.
- Browser game code lives in `client/`.
- Static assets and PWA files live in `public/`.
- `build.ts` pre-renders static HTML and bundles browser code.
- `server.ts` runs the dev server with live reload.

## Quality Benchmarks

Peninsular Reveries holds itself to the same standards as [PBS Kids](https://pbskids.org) and Khan Academy Kids: accessible via keyboard and assistive technology, calm and non-punitive (wrong answers get warm feedback, never shame), grounded in published educational research, and visually inviting for every child. Correct answers are celebrated, but so is every genuine attempt.

## Adding a Game

1. Add the game to `app/data/game-registry.ts`.
2. Add a page controller in `app/controllers/`.
3. Add the route in `app/routes.ts` and `app/router.ts`.
4. Add the browser entry point in `client/[game-slug]/main.ts`.
5. Add the build and dev-server entry points in `build.ts` and `server.ts`.
6. Add scoped PWA assets in `public/[game-slug]/`.
7. Add tests for state logic and page behavior.