---
name: creative-assets
description: 'Source, adapt, attribute, and integrate CC0 or public-domain visual and audio assets for games and pages in Peninsular Reveries. Use when researching photos, illustrations, icons, NASA imagery, SVG art, pixel art from emoji, CC0 sound effects, or any creative asset that needs license verification, budget discipline, and an ATTRIBUTIONS.md entry.'
argument-hint: 'asset type and context, for example mission-orbit launch sound, pixel-passport destination scene Tokyo, or homepage CC0 illustration'
user-invocable: true
disable-model-invocation: false
---

# Creative Assets

Use this skill for any sourcing, generation, or integration of visual or audio assets in the repo.

## Agentic vs. Human Boundaries

| Task | Agent | Human |
|---|---|---|
| Generate pixel art from emoji | ✅ full | — |
| Write/save SVG from scratch | ✅ full | — |
| Source + vet a raster image URL (license, dimensions) | ✅ | — |
| Download binary PNG/JPG to `public/` | ❌ | ✅ always |
| Write attribution stub + handoff note | ✅ | — |
| Run audio fetch script | ✅ (invoke CLI) | — |
| Verify visual quality of downloaded art | ❌ | ✅ always |
| Verify audio quality / audibility | ❌ | ✅ always |

When a step is marked ❌ agent, pause and write a handoff note instead of silently skipping it or pretending it was done.

---

## Scenario Router

| Task | Go to |
|---|---|
| Source a photo, illustration, icon, texture, badge, or NASA image | [references/art-source-notes.md](./references/art-source-notes.md) |
| Generate pixel art from an emoji for a game scene or sprite | [references/pixel-art-workflow.md](./references/pixel-art-workflow.md) |
| Source or evaluate a CC0 sound effect | [references/audio-source-notes.md](./references/audio-source-notes.md) |
| Fetch, trim, and bundle approved audio samples | [scripts/fetch-game-audio.ts](./scripts/fetch-game-audio.ts) — see **Audio Fetch Tool** below |

---

## Shared Principles

- **CC0 or public domain only.** Verify the license explicitly before download. Do not assume; open the license page and confirm.
- **File-size budget.** Raster images ≤ 60 KB per asset. SVGs ≤ 8 KB. Audio one-shots ≤ 64 kbps mono OGG with tight trims.
- **Attribution required.** Every third-party asset must have an entry in `ATTRIBUTIONS.md` via the per-game data file in `games/<game>/attributions.ts`. Run `pnpm sync:attributions` after updating.
- **Match the visual or sonic language** of the game. External assets that feel generic or out-of-register hurt cohesion more than they help.
- **Minimize processing passes.** Evaluate the rendered file after the real filter or optimization chain, not just a raw preview.

---

## Attribution Format

Entries in `games/<game>/attributions.ts` follow this shape (from `ATTRIBUTIONS.md`):

```
- Type: <sound effect | music | image | other>
- Used in: <brief description of where it appears in the game>
- Creator: <creator name or handle>
- Source: <title> (<full URL>)
- License: Creative Commons 0 (<https://creativecommons.org/publicdomain/zero/1.0/>)
- Modifications: <brief description, or "None">
- Notes: <optional clarifying context>
```

---

## Unified Preferred Sources

### Visual assets
- **Wikimedia Commons** — photos, illustrations, public-domain art, historical works
- **Openverse** — broad CC0/public-domain search across Wikimedia and Flickr
- **NASA** — space imagery, mission badges, crew portraits (U.S. government work, public domain)
- **game-icons.net** — CC0 SVG game icons
- **OpenGameArt.org** — CC0 sprites, tilesets, and decorative game art
- Public-domain vector archives and in-repo redraws when external assets are close but not quite right

### Audio assets
- **Freesound** — filter explicitly to CC0 (not just Creative Commons; select "CC0" in the license filter)
- **NASA audio** — rocket, mission, and space environment recordings (public domain)
- DIY recordings when no good CC0 candidate exists

---

## Audio Fetch Tool

The fetch script stages raw previews and renders final OGG variants per game.

```
# List approved samples for a game
pnpm exec tsx .github/skills/creative-assets/scripts/fetch-game-audio.ts --game <slug> --list

# Regenerate one approved sample
pnpm exec tsx .github/skills/creative-assets/scripts/fetch-game-audio.ts --game <slug> --only <sample-id> --yes

# Regenerate all approved samples for a game
pnpm exec tsx .github/skills/creative-assets/scripts/fetch-game-audio.ts --game <slug> --yes
```

Requires `FREESOUND_API_KEY` in `.env` and `ffmpeg` on `PATH`.

Staged raw previews accumulate under `.github/skills/creative-assets/.sound-staging/<game>/`.

Currently routes:
- `mission-orbit` → `public/mission-orbit/audio/`
- `chompers` → `public/chompers/audio/`

Extend the `gameAudioConfigs` map in the script as other games add sample manifests.

---

## Pixel Art Generator

```
pnpm generate:pixel-art -- --emoji "🗼" --name parisTower --width 20 --height 14 --max-colors 6
pnpm generate:pixel-art -- --codepoints 1F5FC --name parisTower --width 20 --height 14 --max-colors 6
```

See [references/pixel-art-workflow.md](./references/pixel-art-workflow.md) for size targets, tuning levers, and the integration pattern.

---

## Post-Integration Checklist

1. Asset saved under the correct game or public folder.
2. File size within budget (raster ≤ 60 KB, SVG ≤ 8 KB, audio ≤ 64 kbps mono).
3. Attribution data file updated; `pnpm sync:attributions` run.
4. For audio: per-game sample manifest and service-worker cache list updated; cache name bumped if bundled bytes changed.
5. Build passes and page budget checks green.
