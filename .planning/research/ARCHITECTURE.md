# Architecture Patterns

**Domain:** Static personal portfolio with self-contained browser games
**Researched:** 2026-03-27

## Recommended Architecture

### File-Based Static Architecture with Shared ES Module Shell

```
peninsular-reveries/
├── src/                        ← TypeScript source
│   ├── shared/                 ← Shared modules (imported by all pages)
│   │   ├── shell.ts            ← Navigation, page chrome, layout helpers
│   │   ├── design-tokens.ts    ← CSS custom property values (optional)
│   │   └── game-registry.ts    ← List of games + metadata (feeds homepage & nav)
│   ├── pages/
│   │   └── home.ts             ← Homepage logic (renders game list)
│   └── games/
│       ├── super-word/
│       │   ├── index.ts        ← Game entry point
│       │   ├── state.ts        ← Game state machine
│       │   ├── renderer.ts     ← DOM rendering logic
│       │   └── puzzles.ts      ← Puzzle data
│       └── [next-game]/
│           └── index.ts
├── public/                     ← Static assets (copied directly to output)
│   ├── shared/
│   │   ├── styles.css          ← Global styles + design system
│   │   └── fonts/              ← (if any)
│   ├── super-word/
│   │   └── [game-specific assets]
│   ├── index.html              ← Homepage
│   └── super-word/
│       └── index.html          ← Game page
├── dist/                       ← Build output (deployed to GitHub Pages)
└── build.ts                    ← Minimal build script (tsc + copy)
```

**Why file-based (not SPA)?** GitHub Pages natively serves `directory/index.html` for `directory/` URLs. No routing library needed, no 404.html redirect hacks, no JavaScript required for navigation. Each game page is independently loadable — a user can bookmark `peninsular-reveries.github.io/super-word/` directly. This is the lowest-friction approach for both visitors and the developer.

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Site Shell** | Shared `<nav>`, page header/footer, layout structure. Injected into every page by a shared ES module that mutates the DOM on load. | Game Registry (reads game list for nav links) |
| **Game Registry** | Single source of truth for all games: name, path, description, thumbnail. Array of objects in a `.ts` file. | Shell (feeds nav), Homepage (feeds game grid) |
| **Homepage** | Renders the game list from the registry, personality touches, site identity. | Game Registry (reads), Shell (uses layout) |
| **Game Page HTML** | Minimal HTML skeleton: `<head>`, shared CSS, `<div id="game">`, shared shell script, game-specific ES module. | Shell (layout), Game Module (mounts into `#game`) |
| **Game Module** | Self-contained game: owns its DOM subtree, state, rendering, interaction. Exports an `init(container: HTMLElement)` function. | Its own internal state only. No dependency on other games. |
| **Shared Styles** | CSS custom properties, typography, spacing, color palette. Applied globally. Games can use the tokens but aren't required to. | All pages consume |
| **Build Pipeline** | Compiles TypeScript → JavaScript, copies static assets to `dist/`. | Source files → dist/ output |

### Boundary Rules

1. **Games never import from other games.** Each game is a self-contained module tree.
2. **Games import from `shared/` only for optional design tokens.** No required framework imports — a game could be 100% standalone.
3. **The shell never reaches into game DOM.** It manages the chrome (nav, header); the game manages `#game`.
4. **HTML files are hand-written, not generated.** Keeps the system simple and debuggable. Each game gets its own `index.html` with appropriate `<script type="module">` tag.

## Data Flow

### Navigation Flow (standard browser navigation)
```
User clicks <a href="/super-word/"> in nav
  → Browser requests /super-word/index.html
  → GitHub Pages serves static file
  → Browser loads HTML
  → <link rel="stylesheet" href="/shared/styles.css"> loads shared styles
  → <script type="module" src="/shared/shell.js"> runs, injects nav
  → <script type="module" src="/games/super-word/index.js"> runs, mounts game
```

No client-side routing. No hydration. No framework overhead. Standard multi-page architecture.

### Game State Flow (per-game, fully encapsulated)
```
Game Module init(container)
  → Creates game state object (plain object or class)
  → Renders initial DOM into container
  → Attaches event listeners
  → User interaction → state mutation → re-render affected DOM nodes
  → Optional: persist progress to localStorage
```

### Adding a New Game
```
1. Create src/games/[name]/ with index.ts
2. Create public/[name]/index.html (copy template, change <script> src)
3. Add entry to game-registry.ts
4. Run build → game appears in nav and homepage automatically
```

## Patterns to Follow

### Pattern 1: Game as Self-Contained ES Module
**What:** Each game exports a single init function. No globals, no side effects on import.
**When:** Every game, always.
**Why:** Isolation means games can't break each other. Easy to develop and test in isolation.

```typescript
// src/games/super-word/index.ts
import { createGameState } from './state.ts'
import { render } from './renderer.ts'
import { PUZZLES } from './puzzles.ts'

export function init(container: HTMLElement): void {
  const state = createGameState(PUZZLES)
  render(container, state)
}
```

```html
<!-- public/super-word/index.html -->
<div id="game"></div>
<script type="module">
  import { init } from '/games/super-word/index.js'
  init(document.getElementById('game'))
</script>
```

### Pattern 2: State-Driven Rendering (No Virtual DOM)
**What:** Game state is a plain object. Rendering functions read state and update specific DOM nodes. No full re-render — targeted updates only.
**When:** All game UI updates.
**Why:** Direct DOM manipulation is simpler, faster, and requires no framework for the small-to-medium DOM trees games produce.

```typescript
// State is a plain object
interface GameState {
  currentPuzzle: number
  collectedLetters: string[]
  score: number
  phase: 'playing' | 'checking' | 'complete' | 'won'
}

// State transitions are explicit functions
function collectLetter(state: GameState, letter: string): GameState {
  return {
    ...state,
    collectedLetters: [...state.collectedLetters, letter],
  }
}

// Rendering targets specific elements
function updateScore(scoreEl: HTMLElement, score: number): void {
  scoreEl.textContent = String(score)
}
```

### Pattern 3: Declarative Game Data
**What:** Game content (puzzles, levels, items) is defined as typed data structures, separate from rendering logic.
**When:** Any game with configurable content (which is most games).
**Why:** Separating data from logic makes games easier to extend and makes puzzle data independently testable.

```typescript
// src/games/super-word/puzzles.ts
export interface Puzzle {
  answer: string
  prompt: string
  hint: string
  items: PuzzleItem[]
}

export const PUZZLES: readonly Puzzle[] = [
  { answer: 'CAT', prompt: '...', hint: '...', items: [...] },
  // ...
] as const
```

### Pattern 4: Shell Injection via ES Module Side Effects
**What:** The shared shell module runs on import and injects navigation into a known DOM slot (e.g., `<nav id="site-nav">`).
**When:** Every page includes the shell script.
**Why:** Keeps HTML files minimal. Navigation updates propagate automatically to all pages.

```typescript
// src/shared/shell.ts
import { games } from './game-registry.ts'

const nav = document.getElementById('site-nav')
if (nav) {
  nav.innerHTML = `
    <a href="/" class="site-title">Peninsular Reveries</a>
    <ul class="game-links">
      ${games.map(g => `<li><a href="/${g.path}/">${g.name}</a></li>`).join('')}
    </ul>
  `
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Router for Static Games
**What:** Using a SPA router (hash-based or History API) to handle navigation between games.
**Why bad:** Adds complexity with zero benefit for static content. Breaks deep linking without server-side config (GitHub Pages has no `_redirects`). Makes each game depend on a shared runtime. Accessibility and SEO suffer compared to real page navigation.
**Instead:** File-based routing. Each game is a standalone page. Browser handles navigation.

### Anti-Pattern 2: Using fetch-router for Client-Side Routing
**What:** Trying to use Remix 3's `fetch-router` package as a client-side router.
**Why bad:** `fetch-router` is a server-side router designed for `Request`/`Response` semantics. It creates a router with `router.fetch()` that returns `Response` objects. There is no client-side navigation, no `pushState`, no link interception. It cannot be used for browser page transitions. (HIGH confidence — verified from source code and README)
**Instead:** Standard `<a>` links and file-based routing. If you later want SPA transitions, use the View Transitions API (browser-native, no library needed).

### Anti-Pattern 3: Shared Mutable Game State
**What:** Multiple games sharing state through a global store, event bus, or shared module.
**Why bad:** Creates coupling between games. One game's bugs affect another. Can't develop or test games in isolation.
**Instead:** Each game owns its state completely. Cross-game concerns (if any) go through `localStorage` with namespaced keys.

### Anti-Pattern 4: Template-Generated HTML Files
**What:** Using a templating system to generate each game's `index.html` at build time.
**Why bad:** Adds build complexity for a handful of pages. Makes the HTML files harder to read and debug. Over-engineering for < 10 pages.
**Instead:** Hand-write the HTML files. They're small (< 30 lines), mostly identical, and rarely change. Copy-paste is fine at this scale.

### Anti-Pattern 5: Bundling All Games Together
**What:** A single JavaScript bundle containing all game code, loaded on every page.
**Why bad:** Users visiting one game download code for all games. Bundle size grows with every new game. Any change requires redeploying everything.
**Instead:** Separate ES module entry points per game. The browser loads only what's needed for the current page.

## Remix 3 Package Assessment for This Project

| Package | Useful Here? | Verdict | Rationale |
|---------|-------------|---------|-----------|
| `fetch-router` | **No** | Skip | Server-side router. No value for static site with file-based routing. (HIGH confidence) |
| `html-template` | **Maybe** | Evaluate | Works in browsers, zero deps. Auto-escaping is nice. But returns branded `String` (requires `.innerHTML` assignment), not DOM nodes. For game UIs with frequent updates, direct DOM manipulation is more ergonomic. Useful for one-shot HTML generation (shell, static content). (HIGH confidence) |
| `route-pattern` | **No** | Skip | URL pattern matching for server routing. No value client-side. |
| `component` | **Maybe later** | Defer | Preact-fork component model with SSR streaming. If the project later wants reactive UI components, this could work. But for v1 with direct DOM games, it's extra complexity. (MEDIUM confidence — less explored) |

**Recommendation:** Start without any Remix 3 packages. The `html-template` tagged template is trivially reimplementable (it's ~60 lines of code) if you want auto-escaping for shell rendering. Add Remix 3 packages only when they solve a concrete problem. The project's "web standards first" ethos is better served by using browser APIs directly than by adopting alpha-stability packages for a static site.

## Routing Decision: File-Based

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **File-based** (recommended) | Zero JS required for nav, native deep linking, GitHub Pages compatible, simplest mental model, best for SEO/accessibility | Layout duplication (mitigated by shell injection), no page transitions | **Use this** |
| Hash routing (`/#/game`) | SPA feel, single HTML file | Ugly URLs, all JS loaded upfront, poor SEO, breaks expectations | Skip |
| History API SPA | Clean URLs, page transitions | Needs 404.html redirect hack on GitHub Pages, all JS loaded upfront, adds framework-level complexity | Skip |
| View Transitions API | Native page transitions with file-based routing | Browser support still emerging (Chrome yes, Safari yes, Firefox behind flag as of 2026). Can be added later as progressive enhancement | **Add later** |

## TypeScript Strategy

**Problem:** GitHub Pages serves static files. Browsers can't run TypeScript directly. Remix 3's "religiously runtime" `--import` loaders work in Node.js/Bun but not in browser `<script>` tags.

**Solution:** Light build step using `tsc` (or `esbuild` if module resolution gets complex).

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noEmit": false,
    "declaration": false,
    "sourceMap": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

**Multi-entry:** No bundler needed. `tsc` compiles all `.ts` files to `.js` preserving directory structure. ES module `import` statements in the browser resolve to the compiled `.js` files. Each game's `index.html` points to its own entry module.

**Build script:** A minimal Node/TypeScript script that:
1. Runs `tsc` to compile TypeScript
2. Copies `public/` assets to `dist/`
3. Copies HTML files to `dist/`

That's it. No Vite, no Webpack, no Rollup. Under 50 lines.

## Asset Organization

```
public/
├── shared/
│   ├── styles.css        ← Design system, layout, typography
│   ├── reset.css         ← CSS reset (or use styles.css @layer)
│   └── fonts/            ← If custom fonts are used
├── super-word/
│   ├── assets/           ← Game-specific images, sounds
│   └── styles.css        ← Game-specific styles (augments shared)
├── favicon.ico
└── [game-name]/
    ├── assets/
    └── styles.css
```

**Rules:**
- Shared assets in `public/shared/` — fonts, global styles, site identity
- Per-game assets in `public/[game-name]/` — scoped by convention
- CSS: one shared stylesheet loaded on every page, optional per-game stylesheet
- No CSS-in-JS, no CSS modules — plain CSS with custom properties for theming

## Scalability Considerations

| Concern | At 3 games | At 10 games | At 30+ games |
|---------|------------|-------------|-------------|
| **Build time** | < 1s | < 3s (tsc is fast) | Consider incremental builds |
| **Navigation** | Simple list | Grouped/categorized nav | Search, tags, filtering |
| **Game discovery** | Show all on homepage | Categories or featured section | Consider pagination or filtering |
| **Shared styles** | Single CSS file | Still fine | May want CSS layers or splitting |
| **Registry** | Flat array | Still fine | Consider generating from filesystem |
| **HTML templates** | Hand-written | Starting to feel repetitive | Consider a simple HTML generator |

**Phase boundary:** The hand-written HTML approach works well up to ~10 games. Beyond that, a simple build-time HTML generator (which *could* use `html-template`) would be worth the setup cost.

## Build Order (Dependencies Between Components)

```
1. Shared Design System (CSS)      ← No dependencies, foundation for everything
   ↓
2. Site Shell Module               ← Depends on: design system, game registry
   + Game Registry                 ← No dependencies (just data)
   ↓
3. HTML Page Templates             ← Depends on: design system (link), shell (script)
   + Homepage Logic                ← Depends on: shell, registry
   ↓
4. Build Pipeline                  ← Depends on: source structure being established
   ↓
5. First Game (Super Word)         ← Depends on: build pipeline, page template
   ↓
6. GitHub Pages Deployment         ← Depends on: build pipeline producing dist/
   ↓
7. Additional Games                ← Depends on: all above being stable
```

**Critical path:** Design system → Shell → Build pipeline → First game → Deploy. Everything else can be parallelized or deferred.

**Suggested phase groupings for roadmap:**
1. **Foundation:** Design system + shell + build pipeline + deployment (get the skeleton live)
2. **First game:** Super Word rewrite (proves the architecture works)
3. **Polish:** Homepage design, personality touches, responsive/accessibility audit
4. **Growth:** Add more games using the established pattern

## Sources

- Remix 3 fetch-router source code and README: https://github.com/remix-run/remix/tree/main/packages/fetch-router (HIGH confidence — direct source review)
- Remix 3 html-template source code and README: https://github.com/remix-run/remix/tree/main/packages/html-template (HIGH confidence — direct source review)
- Remix 3 monorepo README and principles: https://github.com/remix-run/remix (HIGH confidence — direct source review)
- GitHub Pages static hosting behavior: established platform knowledge (HIGH confidence)
- ES modules in browsers: web platform standard (HIGH confidence)
- View Transitions API browser support: based on known 2025-2026 browser shipping status (MEDIUM confidence — not re-verified today)
