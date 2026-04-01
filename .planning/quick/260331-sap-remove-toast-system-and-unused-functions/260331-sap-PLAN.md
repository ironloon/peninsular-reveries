---
phase: quick-260331-sap
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/super-word/renderer.ts
  - src/super-word/main.ts
  - public/super-word/index.html
  - public/super-word/game.css
autonomous: true
requirements: [quick-task]

must_haves:
  truths:
    - "No toast notification appears during gameplay"
    - "Screen reader feedback still works via aria-live regions"
    - "Game builds without errors"
  artifacts:
    - path: "src/super-word/renderer.ts"
      provides: "Renderer without toast functions"
    - path: "src/super-word/main.ts"
      provides: "Main without toast calls or imports"
    - path: "public/super-word/index.html"
      provides: "HTML without toast markup"
    - path: "public/super-word/game.css"
      provides: "CSS without toast styles"
  key_links:
    - from: "src/super-word/main.ts"
      to: "src/super-word/renderer.ts"
      via: "import — no toast exports referenced"
---

<objective>
Remove the toast notification system and unused code from Super Word.

Purpose: The toast system is semantically unappealing to the user. Accessibility feedback already handled via aria-live regions. Also clean up dead code (renderCompleteScreen, unused SceneItem import).
Output: Cleaner codebase with no toast infrastructure.
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/super-word/renderer.ts
@src/super-word/main.ts
@public/super-word/index.html
@public/super-word/game.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove toast infrastructure from renderer.ts and unused code</name>
  <files>src/super-word/renderer.ts</files>
  <action>
    1. Remove `SceneItem` from the type import (keep `GameState`, `Puzzle`)
    2. Remove cached elements: `feedbackToastEl` (line 10), `solvedWordEl` (line 11), `toastDismissHandler` (line 14)
    3. Remove lazy getters: `getFeedbackToast()` (line 20), `getSolvedWord()` (line 21)
    4. Remove exports: `showToast()` (lines 174-188), `dismissToast()` (lines 191-194), `isToastVisible()` (lines 196-199)
    5. Remove `renderCompleteScreen()` export (lines 268-277) — dead code, never imported
  </action>
  <verify>
    <automated>npx tsx build.ts 2>&1 | head -20</automated>
  </verify>
  <done>renderer.ts has no toast functions, no renderCompleteScreen, no unused SceneItem import</done>
</task>

<task type="auto">
  <name>Task 2: Remove toast calls/imports from main.ts and toast HTML/CSS</name>
  <files>src/super-word/main.ts, public/super-word/index.html, public/super-word/game.css</files>
  <action>
    1. In main.ts: Remove `showToast`, `dismissToast`, `isToastVisible` from renderer imports
    2. In main.ts: Remove all 5 `showToast(...)` calls. The accessibility announcements remain — they already provide feedback. Remove just the showToast lines, keep surrounding logic intact.
    3. In index.html: Remove the toast markup block (`#feedback-toast` div with `#toast-message` span and `#toast-dismiss-btn` button)
    4. In game.css: Remove `--game-toast-bg` design token, `.toast` block (lines ~663-687), `.toast-dismiss` block (lines ~689-713), reduced-motion `.toast` override (lines ~1053-1055)
  </action>
  <verify>
    <automated>npx tsx build.ts 2>&1 | head -20</automated>
  </verify>
  <done>No toast references anywhere in Super Word source, HTML, or CSS. Game builds cleanly. Accessibility announcements unaffected.</done>
</task>

</tasks>

<verification>
- `npx tsx build.ts` completes without errors
- `grep -r "toast" src/super-word/` returns no matches
- `grep -r "toast" public/super-word/` returns no matches
- `grep -r "renderCompleteScreen" src/super-word/` returns no matches
</verification>

<success_criteria>
Toast system fully removed. No showToast calls, no toast HTML, no toast CSS, no toast exports. Dead code (renderCompleteScreen, unused SceneItem import) also removed. Build succeeds. Accessibility aria-live feedback unaffected.
</success_criteria>

<output>
After completion, create `.planning/quick/260331-sap-remove-toast-system-and-unused-functions/260331-sap-SUMMARY.md`
</output>
