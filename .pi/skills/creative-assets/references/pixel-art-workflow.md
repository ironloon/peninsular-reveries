# Workflow Notes

## Size Targets

- Pixel Passport destination scenes in [games/pixel-passport/destinations.ts](../../../../games/pixel-passport/destinations.ts) currently use `20x14` rows.
- Pixel Passport vehicles in [games/pixel-passport/art.ts](../../../../games/pixel-passport/art.ts) use `10x6` rows.
- Small reusable sprites usually stay readable between `8x8` and `12x12`.

## Per-Size Example Commands

```sh
# 20×14 (Pixel Passport destination)
pnpm generate:pixel-art -- --emoji 🗼 --name eiffel-tower --width 20 --height 14

# 10×6 (compact icon)
pnpm generate:pixel-art -- --emoji 🚀 --name rocket --width 10 --height 6

# 12×12 (square sprite)
pnpm generate:pixel-art -- --emoji 🌍 --name earth --width 12 --height 12 --max-colors 4
```

## Problematic Emoji Categories

These categories reliably produce poor results and should be avoided or require extra cleanup:

| Category | Problem |
|---|---|
| Flags | Rectangular, no silhouette — auto-crop fails |
| Faces at 16×16 | Fine gradients collapse into dominant skin tone, loses expression |
| Skin-tone ZWJ sequences | Unexpected alpha blending muddles k-means |
| Text / keycap sequences | Downsampling destroys legibility |

**Tip:** For soft-edged emoji with feathered outlines, add `--alpha-threshold 0.30` to reduce edge noise.

## Tuning Levers

- Raise `--alpha-threshold` when anti-aliased fringe pixels look muddy.
- Raise `--padding` when tall or wide emoji tips get cropped too tightly.
- Lower `--max-colors` when gradients look noisy and you want a flatter retro read.
- Raise `--font-size` when tiny details disappear before downsampling.

## Integration Pattern

1. Generate the snippet.
2. Paste the palette and rows next to the target art definition.
3. Adjust a few rows by hand so the silhouette is cleaner.
4. Use overlays only when a generated base needs a small accent pass rather than a full redraw.

## Final Readability Check

- Zoom out and judge the art at actual gameplay scale, not just in monospace rows.
- Prefer fewer, clearer shapes over keeping every emoji detail.
- If the result still looks like a blurry downsample, simplify it manually instead of increasing color count.
