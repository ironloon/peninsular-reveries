# Backlog

Things to revisit later. Not committed work — just ideas worth remembering.

## CI / Tooling
- **Lighthouse CI**: Removed from deploy workflow (2026-04-07) due to persistent NO_FCP errors in headless Chrome. Revisit when `treosh/lighthouse-ci-action` or Chrome's headless mode stabilizes. Options to explore: `--chrome-flags="--headless=new"`, Lighthouse Node API with custom Chrome launch, or switching to a different performance auditing approach.
