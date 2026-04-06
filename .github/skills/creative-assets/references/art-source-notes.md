# Art Source Notes

## Selection Rules

- Prefer SVG where possible
- Avoid oversized PNGs for decorative use
- Match the existing game's visual language instead of dropping in unrelated stock art
- Keep attribution data ready before the file is bundled

## Common Tasks

- Recolor or simplify public-domain SVGs
- Crop NASA imagery for cards or game intros
- Build a derivative icon from public-domain geometry
- Replace photographic textures with vector approximations when budget matters more than realism

## Repo Integration Checklist

1. Save the asset under the right game or public folder
2. Optimize or simplify it
3. Update attributions
4. Rebuild and verify the page budget

---

## Binary Asset Handoff

Agents **cannot** save binary PNG/JPG files to disk. Any workflow step that says "download the image" is a **human step**.

**What agents can do:**
- Identify the right asset on a source page
- Open the page and verify the CC0 license explicitly
- Check dimensions and file size from page metadata
- Record the verified URL and all attribution data

**Handoff convention:** When the agent has found a suitable asset but cannot download it, write a handoff note file at:

```
.github/skills/creative-assets/.art-staging/<game>-pending.md
```

The handoff note must include:
- Asset URL
- Confirmed CC0 source (link to license page)
- Full attribution line (ready to paste into `ATTRIBUTIONS.md`)
- Destination path in the repo (e.g. `public/pixel-passport/tokyo-scene.png`)
- Any notes on crop or resize needed

The human then downloads the file to the specified destination path and deletes the pending note.

If no suitable CC0 raster asset is found, fall back to agent-generated SVG (see below) or pixel art.

---

## Agent-Generated SVG

Agents can write SVG XML directly from scratch — no downloading or binary encoding required.

**Quality ceiling:** Functional and clean for geometric or symbolic art. Not suitable for photorealistic illustration.

**Good use cases:**
- UI chrome: progress rings, orbital arcs, indicator dots
- Geometric game objects: planet circles, orbit ellipses, arrows
- Symbolic icons: simplified flags or badges built from rectangles and circles
- Simple character outlines that can be described geometrically
- Decorative borders and card frames

**Poor use cases:**
- Realistic landscapes or environments
- Complex organic shapes requiring Bézier mastery
- Anything where artistic proportions are load-bearing
- Pixel-exact sprite replacements — use the pixel-art generator instead

**Budget constraint:** ≤ 8 KB. Simple geometric SVGs land well under this; complex paths can balloon past it.

**Workflow:**
1. Agent writes the SVG file directly to `public/<game>/` (or the appropriate public subfolder).
2. Run the build to confirm the asset is served correctly.
3. Update attributions with "Agent-generated SVG" as the source.
