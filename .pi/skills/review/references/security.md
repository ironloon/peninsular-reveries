# Security

## No-Secrets Rule

- Treat real credentials, API keys, private keys, session cookies, and populated `.env` files as release blockers.
- `.env` may exist locally for tooling, but it must stay untracked. Do not commit it, stage it, or leave real secrets in generated artifacts.
- If you discover a real secret in reachable git history, do not treat that as a note for later. Rotate the secret and rewrite history before calling the repo push-ready.

## Review-Before-Push Checklist

1. Run `git status --short` and make sure only intended files changed.
2. Inspect the staged or final diff for `.env`, `token`, `apikey`, `api_key`, `secret`, `Authorization`, and private-key material.
3. Run the repo validation gate that matches the scope: at minimum `pnpm check`, and for release-ready work prefer `pnpm test:local`.
4. If attributions changed, run `pnpm sync:attributions` before the final validation pass.
5. If media or PWA assets changed, confirm the scoped service worker cache list and version were updated.

## Remediation Expectations

- If a secret is newly introduced in the working tree, remove it before finishing.
- If a secret was already committed, rotate it and rewrite history with a non-interactive git workflow before pushing.
- After a history rewrite, re-run the relevant validation and re-check the diff/log so the cleanup itself did not introduce drift.