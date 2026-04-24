# Testing

## Test Split

- E2E tests live in root `e2e/` and should keep the `site-*.spec.ts` naming pattern.
- Unit and Node-side tests live next to the code they exercise: `app/**/*.test.ts`, `client/**/*.test.ts`, and `config/**/*.test.ts`.
- Node-side TypeScript tests should use extensionless workspace imports.
- Game-specific behaviors are covered by colocated unit tests, not e2e. E2E specs cover shared concerns: responsive layout, navigation, semantic HTML, accessibility, favicon, noscript.

## Validation Gates

- Start with `pnpm check` for lint and typecheck.
- Full local validation is `pnpm test:local`.
- When adding a new route or gameplay behavior, prefer a targeted test first, then run the broader gate.

## CI Behavior

- CI runs `pnpm check` and `pnpm test:unit`.
- Playwright stays local-only.
- `pnpm install` configures the repo-owned pre-commit hook, and the hook runs `pnpm test:local` automatically.

## Smoke Test Requirements

- Game smoke tests (`site-07-game-smoke.spec.ts`) must verify more than element presence. After entering the game screen, assert that key interactive elements are within the viewport:
  ```ts
  await expect(page.locator('#interactive-element')).toBeInViewport()
  ```
- `toBeInViewport()` retries until the element is fully visible within viewport bounds, handling CSS transition timing automatically.
- This catches elements that are technically visible but clipped by `overflow: hidden`, positioned off-screen, or pushed out of the viewport by layout bugs.
- For games with a scene container plus a set of overlaid interactive targets (hotspots, choice buttons, drag handles), smoke specs must assert each target's bounding rect is contained within the scene container's bounding rect at the smallest required viewport (typically 390×844). A screenshot alone does not catch this regression.
- For any game that fetches static assets at runtime (recorded SFX, sample manifests, JSON fixtures, sprite atlases), include a smoke spec that loads the page under the production base path (or a base-path-simulating route) and asserts no `404` response is observed for that game's asset URLs. Root-relative URLs (`/<game>/audio/x.ogg`) silently 404 under the GitHub Pages project subpath while passing locally; without this gate the failure is invisible because audio decode errors are swallowed.
- If a game advertises controller/gamepad support, add at least one smoke path driven by mocked gamepad input (`A`, `Start`, or D-pad) so non-pointer regressions are exercised before release.

## Attribution Sync

- If a change updates attribution or info files in `games/*/`, run `pnpm sync:attributions` before considering the work human-ready.
