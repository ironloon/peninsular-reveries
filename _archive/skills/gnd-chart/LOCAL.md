# Local Overrides for gnd-chart

Project-specific extensions that apply in addition to the base skill instructions.

## Do Not Edit SKILL.md

Do not edit `SKILL.md` directly. All project-local overrides go in this file. The base skill file may be updated via npm and any local edits would be overwritten. If you need to change the base behavior, propose it as a community candidate instead.

### Additional Workshop Checks — Audio

**Audio bundle-audit checkpoint:** When a leg modifies or creates a sample manifest, the intent must either include the creative-assets fetch/download step or explicitly state "mark `bundled: false` as placeholder until creative-assets runs." A sample manifest with `bundled: true` entries but no corresponding files on disk is a workshop failure — it produces a game that silently produces no audio. During workshop, ask: "Are sample files already on disk, or does this leg need the creative-assets skill to fetch them?"

**Sound ID enumeration:** When a leg defines audio feedback, enumerate a sample ID for every distinct player action that produces sound. If two actions share a sample, say so explicitly. Omitting actions from the sample list produces invisible UX gaps (e.g., a "drop" action that reuses a "pickup" whoosh). During workshop, list every player action and its corresponding sample ID.

### Scoping and Leg Discipline

**File cap:** ≤8 owned files per leg (overrides the base skill's ≤15). If a leg needs more than 8 files, find a seam to split on. If splitting would break semantic cohesion, keep the leg intact and note why in the intent.

**Intent sub-task cap:** ≤8 numbered sub-tasks per intent. If the intent needs more than 8 steps, the leg is doing too much — split or defer secondary work to a later leg.

**Leg ID format:** Always use `LEG-N` numbering as specified in the plan template — never ad-hoc prefixes like `TS-1` or `SO-2`. The game or area name goes in the leg's subtitle (e.g., `LEG-1: Train Sounds - One car per train`), not in the ID.

**Rationale:** File count alone is a loose proxy for subagent difficulty. The real risk is cognitive load from coordinating too many files and too many distinct sub-tasks. These two caps together bind both the namespace and the actual work per leg.

### Owned-File Overlap Analysis

During Refinement (Phase 5), after all legs are confirmed, perform an overlap analysis on owned files within each dispatch batch:

1. For each pair of legs in the same dispatch batch, check whether their owned-file sets intersect.
2. If two legs share any owned file, they **cannot run in the same parallel batch**. Note the conflict in the Dispatch Order section explicitly, e.g.: > LEG-1 and LEG-3 share `public/styles/train-sounds.css` — must be sequential.
3. Legs that share NO owned files and have no dependency edge between them can safely run in parallel without filesystem isolation.
4. Record conflict-free sub-batches explicitly in the Dispatch Order. Rewrite a single "Batch 1 (parallel)" that contains file conflicts as sequential sub-batches: > Batch 1a (parallel, no file conflicts): LEG-1, LEG-4, LEG-5, LEG-8 > Batch 1b (sequential, shares CSS with LEG-1): LEG-3

**Rationale:** The navigator uses the Dispatch Order to compose `subagent({ tasks: [...] })` calls. If two legs in the same `tasks` array share an owned file, the last diver to write wins and the first diver's changes are silently lost. Explicit sub-batching prevents this. In most game projects, legs from different games never share files, so conflicts are rare — but when they occur (e.g., two CSS-heavy legs on the same game's stylesheet), the cost of sequential dispatch is small compared to the risk of data loss.

**Workshop checkpoint.** If a workshop discussion reveals that two potentially-parallel legs share a file, ask the user: *"LEG-N and LEG-M both own `file.ts`. They'll need to run sequentially. Should I split the file between legs (each leg owns a different section), or is sequential dispatch acceptable?"* Splitting by section is possible when the intent touches clearly separate areas of the file, but it requires the divers to be careful about write scope — sequential is safer.

### Visual Verification for Layout/Design Legs

Any leg that modifies CSS layout, viewport rendering, or game-scene positioning must include a visual verification step in the plan. Code review and lint alone cannot catch squished containers, overlapping elements, or invisible indicators.

**Required checkpoint for layout legs:** During workshop, ask: *"How will we verify this looks right at 390×844 portrait and 844×390 landscape?"* At minimum, the leg's Verification field must include one of:
1. A Playwright screenshot assertion (`page.screenshot` or similar)
2. An explicit "manual visual check required" note
3. A CSS dimension assertion (e.g., `getComputedStyle` check that the element fills ≥50% of viewport)

**Rationale:** Two legs in this project shipped squished play areas and double-indicator bugs that lint could not catch. Visual verification is not optional for layout changes.

### Grid/Cell Mechanics: Item-Cell Parity

When a leg introduces grid-based placement (cells, slots, positions) where items are placed into cells:

1. **Constrain item count to equal total cell count.** Every cell should have a corresponding item, and no item should be left without a cell. Empty cells look like broken UI; leftover items look like dangling affordances.
2. **During workshop, ask:** *"How many total cells do the surfaces have, and how many items will be in the room? Do they match?"* If they don't match, adjust the room generation parameters.
3. **State the cell/item parity explicitly in the leg intent.** For example: "Room generation selects 4–6 surfaces with a total of 12–18 cells, and generates exactly 12–18 items (one per cell)."

### Room Decor Generation

When a leg replaces fixed room layouts with procedural generation:

1. **Room decor is not optional.** A room that only has labeled grid cells on a colored rectangle does not feel like a room. Surfaces must be visually dressed — furniture shapes, art, windows, doorways — as generated elements, not just data containers.
2. **During workshop, ask:** *"What makes this room feel like a [bedroom/kitchen/study] beyond its wall color and placement zones? What visual elements identify the space?"*
3. **Include decor rendering in the leg intent** — either as CSS pseudo-elements per surface type, inline SVG, or emoji-based decoration elements positioned alongside the grid.