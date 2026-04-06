# Audio Source Notes

## Prerequisites

Before running the audio fetch script, ensure:
- `FREESOUND_API_KEY=<your_key>` is set in `.env` (register at https://freesound.org/apiv2/apply/)
- `ffmpeg` is installed and available on `PATH` (verify: `ffmpeg -version`)

If either is missing, the script will fail. There is no in-script diagnostic for missing prerequisites.

---

## Good Defaults

- Mono OGG
- 48kHz output
- 48-64kbps for short one-shots
- Tight trims with short fades
- Explicit `-light` / `-heavy` filenames for games that expose sound intensity variants

## Audibility Checks

- Compare more than one source window before settling on a trim
- Evaluate the rendered file after the real filter chain, not just the raw source preview
- Do not assume a loud waveform is speaker-audible if most of its energy lives below typical laptop or phone playback
- Preserve some midband or harmonic information for physical cues that must read quickly in play
- If the sample improves texture but loses clarity, layer it under a quieter synth or noise bed instead of making it fully replace gameplay audio

## DIY Ideas

- Thrusters: tube breath, compressed air, aerosol burst
- Ambience: vents, fans, HVAC, laptop cooling, fluorescent hum
- Water: bowl, sink, tub, paddle, bottle dunk, cloth slap into water
- Fabric and parachutes: sheets, towels, jackets, backpacks, umbrellas

## Repo Integration Checklist

1. Add or update the per-game sample manifest / audio metadata
2. Route output into the correct per-game public asset folder
3. If the game has intensity variants, render both `-light` and `-heavy` files
4. If the game has a scoped service worker, update its cached asset list and bump its cache name when bundled media bytes change
5. Update attributions
6. Rebuild and test

## Generic Fetching

- The generic fetch script stages raw previews under `.github/skills/creative-assets/.sound-staging/<game>/`
- The game slug determines the destination folder and which sample manifest is loaded
