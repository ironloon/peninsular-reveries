---
name: emoji-pixel-art
description: 'Generate emoji-derived pixel art snippets for Pixel Passport and other Peninsular Reveries games. Use when converting emoji ideas into buildSceneArt palette/rows output, especially for destination scenes, sprite sheets, markers, or quick art exploration.'
argument-hint: 'emoji plus target size, for example 🗼 20x14 scene or 🚌 10x6 sprite'
user-invocable: true
---

# Emoji Pixel Art

Use this skill when you want a quick pixel-art base from an emoji before hand-tuning it into repo art.

## Use Cases

- Create a new Pixel Passport destination scene base
- Explore alternate emoji for vehicle or character sprites
- Turn a marker or souvenir idea into palette-and-row output quickly
- Generate buildSceneArt-ready snippets without adding site runtime weight

## Workflow

1. Match the output size to the target art before generating. Destination scenes usually read well around `20x14`, vehicle sprites around `10x6`, and tiny character or prop sprites around `8x8` to `12x12`.
2. Run the generator from the repo root: `npm run generate:pixel-art -- --emoji "🗼" --name parisTower --width 20 --height 14 --max-colors 6`
3. If terminal emoji input is awkward, use codepoints instead: `npm run generate:pixel-art -- --codepoints 1F5FC --name parisTower --width 20 --height 14 --max-colors 6`
4. Paste the emitted palette and rows into the target module, usually next to existing `buildSceneArt` calls.
5. Hand-tune silhouettes, remove noisy fringe pixels, and simplify gradients until the art reads like intentional pixel art instead of a raw downsample.
6. Re-run the relevant checks after integrating the generated art.

## Output Constraints

- The current `buildSceneArt` helper reads one digit per pixel, so the palette must stay within `10` total entries including `transparent`.
- This generator is a development tool only. It should not be imported by runtime client code.
- Generated output is a starting point. Expect a manual cleanup pass for final in-game art.

## Common Commands

- `npm run generate:pixel-art -- --emoji "🗼" --name parisTower --width 20 --height 14 --max-colors 6`
- `npm run generate:pixel-art -- --emoji "🚌" --name busSprite --width 10 --height 6 --max-colors 5`
- `npm run generate:pixel-art -- --emoji "🌸" --name blossom --grid 12 --format json`
- `npm run generate:pixel-art -- --emoji "🏰" --name castle --width 20 --height 14 --max-colors 7 --out temp/castle-art.ts`

## References

- [Workflow Notes](./references/workflow.md)