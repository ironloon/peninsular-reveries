# Domain Pitfalls

**Domain:** Personal creative web portfolio with browser games  
**Project:** Peninsular Reveries  
**Researched:** 2026-03-27

## Critical Pitfalls

Mistakes that cause rewrites, stalls, or fundamental architecture problems.

### Pitfall 1: `fetch-router` Is a Server-Side Router — GitHub Pages Has No Server

**What goes wrong:** The project plans to use Remix 3's `fetch-router` for routing on a static GitHub Pages site. But `fetch-router` is a server-side router: it takes `Request` objects, runs middleware chains, and returns `Response` objects. It's designed for Node.js, Bun, Deno, and Cloudflare Workers — environments with a running server process. GitHub Pages serves pre-built static files with no server runtime whatsoever.

**Why it happens:** The Remix 3 "Wake up, Remix!" blog post and the "Religiously Runtime" principle make it sound like everything works at runtime without a build step. That's true — on a *server*. The packages are legitimately excellent for server-side web apps. But "runtime-first" means "runs in a JavaScript runtime (Node/Bun/Deno)," not "runs in a browser without compilation."

**Consequences:** Attempting to use `fetch-router` client-side would mean either: (a) shimming a service worker to intercept navigation requests and route them through `fetch-router` (over-engineered), or (b) discovering at integration time that the routing model doesn't fit and needing to rearchitect. Either path wastes significant time.

**Prevention:**
- For a static portfolio with 3-5 pages, use **multi-page architecture** — each game/project is its own `index.html` file. Navigation is just `<a href="/super-word/">`. No router needed.
- If client-side transitions between pages are desired later, a ~30-line vanilla History API wrapper is sufficient.
- `fetch-router` could power a *build-time* static site generator (Node script that pre-renders pages to HTML files). This is viable but adds complexity — evaluate only after the simple approach proves insufficient.

**Detection:** Ask "Where does this code execute?" If the answer is "in the browser" but the API expects `Request → Response` server semantics, there's a mismatch.

**Confidence:** HIGH — verified from `fetch-router` npm docs (v0.18.0). Every usage example shows server-side patterns (`router.fetch()`, middleware chains, `createRouter()`). No browser/client-side routing API exists in the package.

**Phase impact:** Architecture phase. Must decide routing strategy before building any pages.

---

### Pitfall 2: Browsers Cannot Run TypeScript — Build Step Is Unavoidable

**What goes wrong:** The project wants "minimal or zero build step" and cites Remix 3's "Religiously Runtime" principle. But browsers cannot execute `.ts` files. The `--import` loader approach (e.g., `node --import tsx ./server.ts`) only works in Node.js/Bun/Deno — it modifies the *runtime's* module loader, not the browser's.

**Why it happens:** The Remix 3 principle says "all tests must run without bundling" and permits "`--import` loaders for simple transformations like TypeScript and JSX." This is correct for **development and testing on a server runtime**. It does not mean TypeScript works in browsers without compilation.

**Consequences:** Attempting to serve `.ts` files directly to the browser results in syntax errors (type annotations, import types, etc. are not valid JavaScript). The developer discovers this at deployment time and must retrofit a build step across the entire project.

**Prevention:**
- Accept a **minimal build step** from day one. A single `tsc --noEmit && esbuild src/**/*.ts --outdir=dist` command or equivalent handles everything.
- Use TypeScript for all source code (good DX, catches bugs) but always compile to `.js` before deployment.
- The GitHub Actions workflow should include this compilation. It can be one step, one line.
- Keep the build fast by avoiding heavy bundling. `esbuild` compiles TypeScript in milliseconds.

**Detection:** Try opening a `.ts` file directly in a browser. If you see `SyntaxError: Unexpected token ':'`, you've hit this.

**Confidence:** HIGH — this is a fundamental browser limitation, not a tooling issue.

**Phase impact:** Tooling/infrastructure phase. Build pipeline must exist before any TypeScript is written for the browser.

---

### Pitfall 3: Rewriting a Working Game Before Shipping Anything

**What goes wrong:** The project calls for a "full rewrite" of Super Word — not a cleanup, a rewrite. The existing prototype has 5 functional puzzles with drag-and-drop, hints, scoring, level progression, and a win screen. It works. Rewriting it "properly" in TypeScript with "proper architecture" can easily take weeks and delays having anything deployed.

**Why it happens:** The AI-generated code is messy (single 500+ line file, hardcoded data, no modules). The instinct is to start clean. But for someone who reports that "sticking with things can be hard" (autism context from PROJECT.md), the rewrite-before-ship pattern is a known project killer.

**Consequences:** Weeks pass building infrastructure and architecture for one game. No deployed site. Motivation wanes. Project stalls. This is the #1 killer of personal portfolio projects.

**Prevention:**
- **Deploy the existing prototype as-is within the first phase.** Get `super-word/` live on GitHub Pages immediately. It's already vanilla HTML/CSS/JS — it'll work.
- Then iteratively improve: add TypeScript, restructure, improve UX — each change shipped incrementally.
- The rewrite can still happen, but it happens *on a live site* where progress is visible and motivating.
- Set a rule: "Nothing gets rewritten that isn't deployed first."

**Detection:** If more than one phase passes without a deployed, publicly accessible URL, scope creep has won.

**Confidence:** HIGH — this pattern is well-documented in developer communities. Personal projects fail from planning, not from poor code quality.

**Phase impact:** Phase 1 should be deployment of existing content, not rewriting.

---

### Pitfall 4: Over-Engineering Infrastructure for a 3-Page Site

**What goes wrong:** The project plans to use a router, a templating library, middleware patterns, and modular architecture for a site that currently needs: one homepage and one game page. The ratio of infrastructure to content approaches infinity.

**Why it happens:** Technical curiosity (Remix 3 packages are genuinely interesting), professional habits (proper architecture!), and the belief that "easy to add new games" requires upfront infrastructure. In practice, making a new game easy to add requires: a folder per game, an `index.html` per game, and a link on the homepage. That's it.

**Consequences:** High re-entry cost after breaks (need to remember how the routing/templating/build system works). More things to debug when something breaks. More dependencies to update. The low-friction requirement from PROJECT.md is violated.

**Prevention:**
- Apply the **"boring technology" rule**: Use the simplest thing that works. For a static portfolio: HTML files, CSS, JavaScript. 
- Reserve Remix 3 package exploration for a *specific* problem that vanilla approaches can't solve (e.g., if form handling becomes complex, which it won't on a static site).
- Define "easy to add new games" concretely: "Copy a folder, edit the homepage list." Not: "Create a route definition, register a controller, add middleware."
- Track the **infrastructure-to-content ratio**. If you have more build/routing/templating code than actual game/page code, stop and simplify.

**Detection:** Count the files that exist solely to support the build/routing/templating system vs. files that contain actual content or game logic. Ratio should be < 1:3.

**Confidence:** HIGH — direct consequence of the project's own constraint: "the site and tooling need to be low-friction enough to return to after breaks."

**Phase impact:** Every phase. Each phase should ship visible content, not just infrastructure.

---

### Pitfall 5: Remix 3 Alpha Churn Breaks Code Between Sessions

**What goes wrong:** All Remix 3 packages are version 0.x (fetch-router is at 0.18.0 with 19 published versions). APIs change between versions. The developer returns after a break, runs `npm update`, and code breaks. Or dependencies conflict. Or documentation no longer matches the installed version.

**Why it happens:** Remix 3 is explicitly alpha ("under active development"). The team's own repo shows constant API evolution — 380 releases, frequent renaming and refactoring. This is normal for alpha software but hazardous for a project where the developer may not touch it for weeks.

**Consequences:** Return-after-break friction multiplied. Instead of jumping back into creative work, time is spent debugging why imports changed, why a middleware API is different, or why types don't match. For someone who already finds returning to projects hard, this is project-lethal.

**Prevention:**
- **Pin exact versions** in `package.json` (no `^` or `~` prefixes).
- Use `package-lock.json` / `pnpm-lock.yaml` and commit it.
- If using Remix 3 packages, wrap them behind thin project-local abstractions so updates only require changing the wrapper.
- Better yet: minimize Remix 3 dependency surface. `html-template` alone might be the only package that provides genuine value for a static site (auto-escaping in template literals). Skip the rest.
- Have a **vanilla fallback plan**: if Remix 3 packages become untenable, the project should be able to drop them without rewriting game logic.

**Detection:** Run `npm outdated` and check how many Remix 3 packages have new versions. If more than 2 have breaking changes since last session, churn is active.

**Confidence:** HIGH — version 0.x + 19 releases in the package's lifetime = rapid iteration. Verified on npm.

**Phase impact:** Dependency decisions in the stack/tooling phase. Revisit at every milestone boundary.

---

### Pitfall 6: GitHub Pages Base Path Breaks All Asset URLs

**What goes wrong:** Unless the repository is named `username.github.io`, GitHub Pages serves the site at `username.github.io/repo-name/`. Every absolute path (`/style.css`, `/images/logo.png`, `/super-word/`) resolves against the domain root, not the repo subdirectory. All assets 404.

**Why it happens:** Developers build locally at `localhost:3000/` where `/style.css` works fine. They push to GitHub Pages and everything breaks because the actual URL is `username.github.io/peninsular-reveries/style.css`.

**Consequences:** The site deploys but looks broken — no CSS, no JS, no images. Every path needs fixing. If not caught early, it requires a find-and-replace across every HTML file.

**Prevention:**
- Use **relative paths everywhere** from day one: `./style.css`, `../super-word/`, not `/style.css`, `/super-word/`.
- Or configure a custom domain (eliminates the base path issue entirely).
- Test with the actual deployment URL early, not just `localhost`.
- If a build step exists, configure a `base` path variable.
- Add a deploy-and-check step in phase 1 to catch this immediately.

**Detection:** After first deployment, if any resources return 404, this is almost certainly the cause. Check the browser's Network tab.

**Confidence:** HIGH — this is the single most common GitHub Pages gotcha. Documented extensively in GitHub community forums.

**Phase impact:** First deployment phase. Must be addressed before any other content goes live.

## Moderate Pitfalls

### Pitfall 7: Drag-and-Drop Is Inaccessible by Default

**What goes wrong:** The Super Word game uses drag-and-drop for collecting letters and reordering them. Native HTML drag-and-drop (`draggable`, `dragstart`, `drop` events) is completely inaccessible to keyboard-only users and poorly supported by screen readers. The game becomes unusable for anyone not using a mouse/touch.

**Why it happens:** Drag-and-drop is visual and spatial — concepts that don't translate to keyboard/screen reader interaction models. The HTML Drag and Drop API provides no built-in keyboard alternative. Most developers add it as a future task that never happens.

**Consequences:** The project lists "Accessible" as an active requirement. Shipping an inaccessible game violates this. Retrofitting accessibility onto a drag-and-drop system is significantly harder than building it in from the start.

**Prevention:**
- Design **keyboard-first interaction** alongside drag-and-drop. For Super Word: arrow keys to navigate scene items, Enter/Space to collect a letter, Tab to move between slots for reordering.
- Use `aria-live="polite"` regions to announce game state changes (letter collected, word complete, score updated). The existing prototype already has some of this — preserve it.
- Don't try to make drag-and-drop accessible. Build a parallel keyboard interaction model that achieves the same result.
- Test with keyboard-only navigation at the end of each game-related phase.

**Detection:** Unplug the mouse and try to complete a puzzle using only Tab, Enter, Space, and Arrow keys. If you can't, accessibility is broken.

**Confidence:** HIGH — well-established in accessibility community (WCAG 2.1 SC 2.1.1 Keyboard).

**Phase impact:** Super Word rewrite/improvement phase. Keyboard support must be designed alongside the interaction model, not added after.

---

### Pitfall 8: Mobile Touch Events Don't Support HTML Drag-and-Drop

**What goes wrong:** The HTML Drag and Drop API (`draggable`, `dragstart`, `dragover`, `drop`) does not work on mobile browsers. Touch events fire instead. The game is unplayable on phones and tablets, which may be the primary audience for a children's word game.

**Why it happens:** Mobile browsers implement touch events and pointer events but do not fire drag events from touch gestures. Safari on iOS has historically been the worst offender, but this affects all mobile browsers. Developers test in desktop Chrome's responsive mode, which simulates viewport size but not touch behavior.

**Consequences:** Game works on desktop, fails on mobile. For a children's game (Super Word targets kids), mobile is likely the primary device. Discovering this at testing time requires a rewrite of the interaction layer.

**Prevention:**
- Use **Pointer Events API** (`pointerdown`, `pointermove`, `pointerup`) instead of both mouse events and touch events. Pointer Events unify mouse, touch, and pen input.
- Implement drag-and-drop manually with pointer events: track `pointerdown` → `pointermove` (update position) → `pointerup` (check drop target).
- Add `touch-action: none` on the game area to prevent browser scroll/zoom during gameplay.
- Test on **actual mobile devices**, not just browser responsive mode. Browser DevTools simulates viewport, not touch behavior.

**Detection:** Open the game on a phone. Try to drag a letter. If nothing happens, this is the issue.

**Confidence:** HIGH — HTML Drag and Drop API not firing on touch is a well-known, long-standing limitation.

**Phase impact:** Game interaction design phase. Must choose Pointer Events from the start, not retrofit.

---

### Pitfall 9: Emoji Rendering Differs Wildly Across Platforms

**What goes wrong:** Super Word uses emoji extensively as game elements — letters are labeled with emoji (`🌙`, `🍎`, `🌲`), scenes have emoji decorations (`☁️`, `☀️`, `🌸`), and scoring/UI uses emoji. Emoji appearance varies drastically between Windows, macOS, iOS, Android, and Linux. Some emoji may not render at all on older systems.

**Why it happens:** Each OS has its own emoji font (Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji). Character widths, heights, line-height behavior, and even whether an emoji is rendered as color or monochrome differ. Positioning emoji in a game layout with percentage-based coordinates assumes consistent sizing that doesn't exist.

**Consequences:** The game looks designed on one platform and broken on another. Emoji positioned at `x: 58, y: 16` may overlap on Windows but have gaps on macOS. A carefully designed scene becomes messy on platforms the developer didn't test on.

**Prevention:**
- Don't rely on **pixel-precise emoji positioning**. Use generous spacing and hit targets.
- Accept platform-native rendering — don't fight it. The game will look *different* everywhere and that's fine.
- Use `font-size` on emoji containers to normalize sizing somewhat, but expect ±20% variation.
- Test on Windows + one Apple device (iOS/macOS) + Android minimum.
- If visual consistency is critical later, consider switching to SVG icons — but this is a future optimization, not a launch blocker.

**Detection:** Open the same page on Windows and macOS side-by-side. If the layout looks noticeably different around emoji, you've hit this.

**Confidence:** HIGH — emoji cross-platform inconsistency is well-documented and inherent to how operating systems implement Unicode.

**Phase impact:** Visual polish phase. Don't block on this for initial deployment, but be aware during game layout design.

---

### Pitfall 10: `html-template` Is Server-Side HTML Generation, Not Reactive UI

**What goes wrong:** The project plans to use Remix 3's `html-template` for HTML generation. The `html` template tag produces `SafeHtml` strings — it's a tagged template literal that auto-escapes interpolations. It creates HTML as a *string*, not a reactive DOM. Using it for game UI that updates frequently (score changes, letter collection, scene state) means calling `innerHTML` on every state change — no diffing, no preservation of focus/selection, no animation continuity.

**Why it happens:** The template tag looks like it could be a lightweight client-side template solution. But it's designed for server responses: generate HTML once, send it, done. It has no concept of re-rendering, updating, or DOM lifecycle.

**Consequences:** Game UI built with `html-template` + `innerHTML` will lose focus state on every update (breaking keyboard accessibility), interrupt CSS animations, and feel janky. The developer ends up building a reactive rendering system on top of it — or abandoning it for direct DOM manipulation.

**Prevention:**
- Use `html-template` only for **static page shells** (initial HTML of a page). This is a great fit — auto-escaping prevents XSS.
- For game UI that changes (score display, scene elements, letter slots), use **direct DOM manipulation** (`createElement`, `textContent`, `classList`). It's more verbose but gives precise control needed for games.
- Don't build a reactive renderingsystem from scratch. The game's DOM update needs are simple enough for imperative code.

**Detection:** If you're calling `container.innerHTML = html\`...\`` inside a game loop or event handler, you've misused the tool.

**Confidence:** HIGH — verified from `html-template` npm docs. The API surface is `html` and `html.raw` template tags returning `SafeHtml` strings. No DOM API exists.

**Phase impact:** Game architecture decisions in the Super Word phase.

---

### Pitfall 11: Design Paralysis — "Clean Minimal Aesthetic with Personality" Is Undefined

**What goes wrong:** The project describes the desired aesthetic as "clean, minimal design with subtle quirky personality touches" and references makingsoftware.com. But "subtle personality" and "the kind of site that makes you pause and think 'oh, this is nice'" are subjective, undefined goals. The developer iterates endlessly on typography, colors, and spacing without shipping.

**Why it happens:** Design is a discipline with its own expertise. Developers who don't design professionally often oscillate between "this looks bad" and changing things without a clear direction. The reference site (makingsoftware.com) has a specific, practiced aesthetic that can't be reverse-engineered quickly.

**Consequences:** Weeks of CSS tweaking. Multiple redesigns. No deployed site. The design never feels "right" because the goal was never concrete.

**Prevention:**
- **Constrain choices upfront:** Pick a system font stack, one accent color, and base spacing unit. Commit to them for v1.
- Use a **proven minimal CSS baseline**: normalize.css or a classless CSS framework (e.g., Water.css, MVP.css) as a starting point. Customize later.
- Ship the first version ugly. Seriously. Deploy black-on-white with system fonts. Then iterate visually on a live site where changes are immediately visible.
- Budget design iteration: "I will spend max 2 hours on visual design per phase." Anything more goes on a backlog.
- Reference: makingsoftware.com uses basic serif/sans-serif pairing, generous whitespace, subtle color. Achievable with ~30 lines of CSS.

**Detection:** If you have more than 3 browser tabs open with CSS color palette tools and haven't committed code today, you're in paralysis.

**Confidence:** MEDIUM — based on common patterns in developer portfolio projects. The specific impact depends on the developer's design comfort.

**Phase impact:** Every phase that touches visual output. Explicitly time-box design work.

## Minor Pitfalls

### Pitfall 12: GitHub Pages Deployment Requires `.nojekyll` and Actions Workflow

**What goes wrong:** GitHub Pages historically used Jekyll to process files. Without a `.nojekyll` file, directories/files starting with `_` (like `_includes/`, `_components/`) are ignored. Additionally, the older `gh-pages` branch approach is being superseded by GitHub Actions deployment, which is more reliable but requires a workflow file.

**Prevention:**
- Add an empty `.nojekyll` file to the repo root.
- Use GitHub Actions for deployment (Settings → Pages → Source → GitHub Actions). Create a simple workflow that copies built files to Pages.
- Don't use the `gh-pages` branch approach — it's legacy and creates confusing git history.

**Phase impact:** Infrastructure/deployment phase.

---

### Pitfall 13: GitHub Pages Has No SPA Routing — But You Don't Need It

**What goes wrong:** Developers try to implement single-page application routing (History API + catch-all) on GitHub Pages. When a user directly navigates to `site.com/game/super-word`, GitHub Pages looks for that exact file path. Without a server to rewrite all routes to `index.html`, the request 404s.

**Prevention:**
- This is a non-issue if you use multi-page architecture (each page = its own `index.html`). GitHub Pages natively serves `/super-word/index.html` when you visit `/super-word/`.
- If SPA routing is absolutely needed later, the `404.html` redirect hack works but is fragile and has SEO implications. Don't go there for a portfolio site.
- The project has <10 pages planned. Multi-page is simpler, faster, and more robust.

**Phase impact:** Architecture phase. Choose multi-page from the start.

---

### Pitfall 14: Canvas vs. DOM for Game Rendering — Premature Optimization

**What goes wrong:** Developers assume games need Canvas 2D or WebGL for performance. They rewrite working DOM-based games to Canvas, losing accessibility, CSS styling, and standard event handling. For a word puzzle game with <50 elements, DOM is faster to develop and fast enough to render.

**Prevention:**
- Start with DOM. The existing Super Word prototype uses DOM elements and works fine.
- Canvas only becomes worthwhile with 100+ simultaneously animated elements, pixel-level effects, or real-time physics. Word puzzles don't need this.
- If performance problems appear, profile first (`Performance` tab in DevTools). The bottleneck is almost never "DOM is too slow for 30 emoji."

**Phase impact:** Game architecture phase. Don't switch rendering technology without evidence.

---

### Pitfall 15: Mixing `import` Specifiers — Bare vs. Relative Paths in Browser

**What goes wrong:** Remix 3 packages use bare import specifiers (`import { html } from 'remix/html-template'`). This works in Node.js with `node_modules` resolution. In browsers, bare specifiers don't resolve without an import map or bundler. The developer writes code that works in Node.js tests but fails in the browser.

**Prevention:**
- If using Remix 3 packages client-side, you need either: (a) a bundler that resolves bare specifiers (esbuild, rollup), or (b) an import map in the HTML (`<script type="importmap">`).
- Import maps are well-supported in modern browsers but require listing every bare specifier mapping.
- Simplest: use esbuild to bundle. It handles bare specifiers, TypeScript, and tree-shaking in one fast step.
- Or: don't use Remix 3 packages client-side at all. They're server packages. Use them in build scripts only.

**Phase impact:** Build pipeline phase. Must be resolved before any Remix package is imported in browser code.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Initial deployment | Base path 404s (Pitfall 6) | Use relative paths, test on actual GitHub Pages URL |
| Build pipeline | TypeScript can't run in browser (Pitfall 2) | Accept esbuild/tsc from day one |
| Routing/architecture | `fetch-router` is server-side (Pitfall 1) | Use multi-page architecture, skip client router |
| Super Word rewrite | Scope creep delays shipping (Pitfall 3) | Deploy existing prototype first, iterate |
| Game interactions | Touch + drag broken on mobile (Pitfall 8) | Use Pointer Events, not HTML D&D API |
| Game interactions | Drag-and-drop inaccessible (Pitfall 7) | Design keyboard controls alongside pointer controls |
| Dependency decisions | Alpha churn breaks code (Pitfall 5) | Pin exact versions, minimize Remix 3 surface |
| Visual design | Design paralysis (Pitfall 11) | Constrain choices, time-box, ship ugly first |
| Game rendering | DOM vs Canvas false choice (Pitfall 14) | Stay DOM until profiling shows a problem |
| Client-side Remix packages | Bare imports fail in browser (Pitfall 15) | Use a bundler or skip Remix packages in browser |

## Sources

- Remix 3 GitHub Repository: https://github.com/remix-run/remix (README: "under active development", alpha)
- "Wake up, Remix!" blog post: https://remix.run/blog/wake-up-remix (May 27, 2025 — principles, direction)
- `@remix-run/fetch-router` npm: https://www.npmjs.com/package/@remix-run/fetch-router (v0.18.0, 19 versions, server-side API)
- GitHub Pages documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
- PROJECT.md context: developer notes about autism + low-friction requirements
- Existing Super Word prototype: `super-word/app.js`, `super-word/index.html` (working vanilla prototype)
- WCAG 2.1 SC 2.1.1 Keyboard: https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html
