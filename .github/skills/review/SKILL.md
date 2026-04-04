---
name: review
description: "Project architecture, game quality standards, and testing conventions for Peninsular Reveries. Use when building features, reviewing code, fixing bugs, auditing layout, checking game quality, testing, adding games, modifying build or deploy behavior, or polishing UX in this repo."
user-invocable: true
---

# Review

Use this skill for substantial work in this repository.

## Load These References

- Load [architecture](./references/architecture.md) for project structure, stack, build flow, game module contract, and implementation conventions.
- Load [game quality](./references/game-quality.md) for layout, pacing, orientation, and sourcing expectations.
- Load [file size](./references/file-size.md) when a task involves large files, refactors, or deciding whether to split a module.
- Load [testing](./references/testing.md) for test organization, validation gates, CI behavior, and attribution sync requirements.
- Load [security](./references/security.md) for secret-handling, review-before-push, and remediation expectations when credentials or generated env files are involved.

## Usage Notes

- Start with the reference most relevant to the task instead of loading everything blindly.
- For feature work touching gameplay or layout, load both architecture and game quality.
- For test changes or release-readiness, load testing as well.
- For anything involving push readiness, env files, third-party APIs, or discovered credentials, load security as well.
