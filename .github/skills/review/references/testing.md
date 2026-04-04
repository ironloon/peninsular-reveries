# Testing

## Test Split

- E2E tests live in `tests/e2e/` and should keep the `site-*.spec.ts` naming pattern.
- Unit tests live in `tests/unit/` and cover pure logic, config, build, workflow, and data-shape checks.
- Node-side TypeScript tests should use extensionless workspace imports.

## Validation Gates

- Start with `npm run check` for lint and typecheck.
- Full local validation is `npm run test:local`.
- When adding a new route or gameplay behavior, prefer a targeted test first, then run the broader gate.

## CI Behavior

- CI runs `npm run check` and `npm run test:unit`.
- Playwright stays local-only.
- `npm install` configures the repo-owned pre-commit hook, and the hook runs `npm run test:local` automatically.

## Attribution Sync

- If a change updates `app/data/attributions.ts`, run `npm run sync:attributions` before considering the work human-ready.
