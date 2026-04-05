---
name: cc0-audio-curation
description: 'Source, evaluate, fetch, trim, attribute, and integrate CC0 or public-domain audio for any game in Peninsular Reveries. Use when researching Freesound or NASA clips, regenerating bundled OGGs into the correct game folder, tuning light/heavy sample variants, improving speaker-friendly audibility on laptop/phone speakers, layering samples with synth fallback beds, or refreshing cached game audio.'
argument-hint: 'game slug plus audio task, for example mission-orbit launch-rumble-heavy or chompers bite sfx'
user-invocable: true
---

# CC0 Audio Curation

Use this skill for audio sourcing work across games in the repo.

## Use Cases

- Research CC0 or public-domain sound sources for a new game
- Compare multiple candidate sounds before bundling one
- Regenerate approved samples into the right per-game public folder
- Keep explicit light/heavy sample variants aligned for games that use an intensity setting
- Keep attribution, file-size, and PWA caching concerns aligned

## Workflow

1. Define the target sound list for the game and use a per-game manifest or metadata file as the source of truth.
2. Prefer CC0 or public-domain sources first.
3. For sourced assets, store the source URL, creator, license, and processing notes in the game-specific manifest.
4. If a game uses an intensity setting, keep explicit `-light` and `-heavy` sample IDs and filenames instead of relying only on runtime gain scaling.
5. Keep files small: mono when possible, short trims, low bitrates, and loop only when necessary.
6. Compare multiple source windows when trimming and judge the fully rendered output after the actual ffmpeg filter chain, not only the raw preview segment.
7. Avoid over-filtering physical effects into mostly sub-bass. Keep enough midband or harmonic content that launch, thruster, and impact sounds still read on laptop or phone speakers.
8. If a sample adds texture but weakens gameplay readability, prefer a hybrid layer with a quieter synth or noise bed underneath instead of forcing sample-only playback.
9. Use the generic fetch tool to list or regenerate approved samples into the correct game folder.
10. When bundled assets change for an offline-capable game, bump the game-scoped service-worker cache name so clients do not stay pinned to stale media.
11. Update service-worker cache lists and attributions when bundled assets change.
12. Validate build budgets and offline behavior.

## Generic Fetch Tool

- List approved samples for one game: `npx tsx .github/skills/cc0-audio-curation/scripts/fetch-game-audio.ts --game <slug> --list`
- Regenerate one approved sample: `npx tsx .github/skills/cc0-audio-curation/scripts/fetch-game-audio.ts --game <slug> --only <sample-id> --yes`
- Regenerate all approved samples for one game: `npx tsx .github/skills/cc0-audio-curation/scripts/fetch-game-audio.ts --game <slug> --yes`

Today the generic tool knows how to route Mission: Orbit samples into [public/mission-orbit/audio](../../../../public/mission-orbit/audio). Extend its game map as other games add sample manifests.

## Source Priorities

- Freesound CC0
- NASA or other public-domain archives
- Original DIY recordings when no good CC0 candidate exists

## References

- [Audio Source Notes](./references/audio-source-notes.md)
- [Fetch Tool](./scripts/fetch-game-audio.ts)
