# Testing

## Test Split

- E2E tests live in root `e2e/` and should keep the `site-*.spec.ts` naming pattern.
- Unit and Node-side tests live next to the code they exercise: `app/**/*.test.ts`, `client/**/*.test.ts`, and `config/**/*.test.ts`.
- Node-side TypeScript tests should use extensionless workspace imports.
- Game-specific behaviors are covered by colocated unit tests, not e2e. E2E specs cover shared concerns: responsive layout, navigation, semantic HTML, accessibility, favicon, noscript.

## Validation Gates

- Start with `npm run check` for lint and typecheck.
- Full local validation is `npm run test:local`.
- When adding a new route or gameplay behavior, prefer a targeted test first, then run the broader gate.

## CI Behavior

- CI runs `npm run check` and `npm run test:unit`.
- Playwright stays local-only.
- `npm install` configures the repo-owned pre-commit hook, and the hook runs `npm run test:local` automatically.

## Attribution Sync

- If a change updates files in `app/data/attributions/`, run `npm run sync:attributions` before considering the work human-ready.
