# Local Overrides for gnd-navigator

Project-specific extensions that apply in addition to the base instructions above.

## Do Not Edit This Agent File Directly

Do not edit `gnd-navigator.md` directly. All project-local overrides go in this file. The base agent file may be updated via npm and any local edits would be overwritten. If you need to change the base behavior, propose it as a community candidate instead.

### Audio Manifest Review

When reviewing a leg that adds or modifies a sample manifest (any `sample-manifest.ts`), check that `bundled: true` entries have corresponding audio files on disk. Run `ls public/<slug>/audio/` and verify the `.ogg` files exist for every bundled sample. A manifest with `bundled: true` and missing files produces a game with silent audio — mark this as a review failure and either re-dispatch with fetch instructions or change to `bundled: false` as a deferred edit.

### CSS/HTML Class Cross-Reference (Extended)

When reviewing a visual leg that adds or modifies CSS, grep for all `className=` strings in the game's TSX/controller files **and** all `classList.add` / `classList.toggle` / `classList.remove` calls in the game's TS/JS files. Cross-check all of these against CSS class selectors. Any HTML class or classList target without a matching CSS rule is a boundary violation. Conversely, any CSS class selector that never appears in HTML or classList is dead CSS that signals a naming mismatch. Fix before marking the leg done.