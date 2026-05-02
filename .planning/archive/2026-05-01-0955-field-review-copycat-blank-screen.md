## Field Review: Copycat Dance — Blank Screen on Start
Date: 2026-05-01
Delivery: local-only

### Findings

#### 1. Blank game screen after clicking Start
- **Reported:** "I can't see the game at all when I hit start. just blank after I click start."
- **Category:** Bug
- **Severity:** blocker
- **Evidence:** `games/copycat/main.ts` — `initStage()` called in `boot()` while `#game-screen` is `hidden` (`display: none`). PixiJS `resizeTo` measures hidden container as 0×0, producing 1×1 canvas framebuffer. CSS stretches single pixel to fill screen — looks blank. `layoutCats` also ran before screen shown, compounding layout failure.
- **Hypothesis:** Canvas framebuffer initialized at 1×1 due to hidden container, then never resized when screen became visible.

#### 2. Input handlers destroyed on replay and never re-attached
- **Category:** Bug
- **Severity:** high
- **Evidence:** `games/copycat/main.ts:213` — `resetToStart()` calls `cleanupCopycatInput()` which removes all keyboard listeners and stops gamepad poller. `setupCopycatInput()` only called once in `boot()`. After replay, keyboard/gamepad navigation dead.
- **Hypothesis:** Input teardown should not happen on replay; handlers should persist for whole session.

### Implementation Plan (applied)

| Fix | File | Change |
|-----|------|--------|
| Show screen BEFORE resizing | `games/copycat/main.ts` | Moved `showScreen('game-screen')` to top of `enterGame()`, followed by `app.renderer.resize()` to actual container dimensions. Then `layoutCats` runs with correct `app.screen.width/height`. |
| Don't tear down input on replay | `games/copycat/main.ts` | Removed `cleanupCopycatInput()` from `resetToStart()`. Keyboard/gamepad handlers now persist across screen transitions. |
| Remove dead import | `games/copycat/main.ts` | Removed unused `cleanupCopycatInput` import. |
| Drop `resizeTo` from init | `games/copycat/renderer.ts` | Removed `resizeTo: canvasContainer` from `app.init()` to avoid ResizeObserver sizing canvas to 0×0 when parent is hidden. Manual resize in `enterGame()` handles sizing. |

### Verification
- `pnpm check` → lint + typecheck pass
- `pnpm test:unit` → 373 pass
- `pnpm test:e2e` → copycat 4/4 pass

### Next Step
Reload `/copycat/` in browser and try clicking Start again. Canvas should render at full container size and cats should be visible.
