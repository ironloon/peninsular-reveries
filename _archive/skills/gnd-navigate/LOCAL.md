# Local Overrides for gnd-navigate

Project-specific extensions that apply in addition to the base skill instructions.

## Do Not Edit SKILL.md

Do not edit `SKILL.md` directly. All project-local overrides go in this file. The base skill file may be updated via npm and any local edits would be overwritten. If you need to change the base behavior, propose it as a community candidate instead.

### Cross-File CSS Class Grep

When reviewing a leg that removes or renames CSS class names, the navigator must grep for those class names across **all project files** — not just the leg's owned files. This includes:

- Controller/template files (`.tsx`, `.astro`, `.html`, etc.)
- SSR shell markup
- Test files
- Any other file that references CSS classes

**Why:** A leg may remove CSS rules (e.g., `.train-car--first`, `.train-coupler--two`) from its owned stylesheet, but static HTML in an unowned controller file may still reference those classes. Without the matching CSS, those elements render unstyled.

**Review step:** After a diver returns and the diffs are reviewed, run:

```bash
git diff --name-only HEAD~1
```

Then, for any CSS class names that were removed or renamed in the diff, grep the entire project:

```bash
grep -r "removed-class-name" --include="*.tsx" --include="*.ts" --include="*.html" --include="*.astro" .
```

If any references are found outside the leg's owned files, flag it as a boundary violation and either (a) re-dispatch a cleanup leg, (b) report it as a deferred edit, or (c) add the file to the leg's read-only list and fix it manually if small enough.

**Rationale:** During the Train Sounds & Spot On backlog plan, LEG-1 removed `.train-car--first`, `.train-car--second`, `.train-coupler--one`, `.train-coupler--two` from the CSS, but `controller.tsx` still referenced them in static HTML markup. The start screen rendered with unstyled car/coupler elements. The controller file was not in any leg's owned set and was not checked during review.