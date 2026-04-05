# Workflow Notes

## Size Targets

- Pixel Passport destination scenes in [client/pixel-passport/destinations.ts](../../../../client/pixel-passport/destinations.ts) currently use `20x14` rows.
- Pixel Passport vehicles in [client/pixel-passport/art.ts](../../../../client/pixel-passport/art.ts) use `10x6` rows.
- Small reusable sprites usually stay readable between `8x8` and `12x12`.

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