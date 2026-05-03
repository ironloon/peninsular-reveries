# Field Review: Music Pad

Date: 2026-04-20
Delivery: verified local runtime (`http://localhost:3000/music-pad/`)

### Findings

#### 1. Low-end range expectation
- Reported: A user expected some lower bass notes and wondered whether Music Pad should have extra spots to hit or drone notes.
- Category: Design question
- Severity: medium
- Evidence: `Music Pad` is described as a drum pad instrument that triggers percussion sounds in [games/music-pad/info.ts](games/music-pad/info.ts#L2). The shipped pad set is all percussion, with the lowest voices limited to Kick and Tom in [games/music-pad/sounds.ts](games/music-pad/sounds.ts#L11) and [games/music-pad/sounds.ts](games/music-pad/sounds.ts#L164), and the exported pad names remain percussion-only in [games/music-pad/sounds.ts](games/music-pad/sounds.ts#L214).
- Hypothesis: The current instrument is behaving like a drum kit, but the neon pad presentation can make some players expect a broader low-end toy range. Hidden extra hit zones or a flip-side metaphor would be a poor fit for touch and gamepad discoverability.
- Workshop note: If Music Pad gets a low-end follow-up, workshop the direction before implementation. Candidate directions include deeper existing kick/tom behavior, a clearly visible alternate bank with a few short bass notes, or a larger secondary low-end pad treatment on bigger screens. Hidden hotspots, flip-side controls, and sustained drone notes should be evaluated as discoverability and looper-feel risks rather than assumed answers.

### Workshop Prompts
1. Should low-end range stay inside the current percussion kit by deepening the existing Kick and Tom voices in [games/music-pad/sounds.ts](games/music-pad/sounds.ts#L11) and [games/music-pad/sounds.ts](games/music-pad/sounds.ts#L164), or does the game want a visibly broader instrument identity?
2. If Music Pad grows beyond the current 8-pad kit, is a visible `Kit / Bass` bank, a small dedicated bass row, or a larger low-end pad treatment on bigger screens the clearest presentation for touch, keyboard, and gamepad?
3. If drone-style notes or hidden extra hit areas are considered, do they stay discoverable and readable enough for the looper, or do they make the instrument harder to understand?

### Process Observations
- No new process correction. This is the kind of expectation-setting that the new chart-time feel-probes check should catch earlier on future toy-style game plans.

### Verification
- Local Music Pad runtime was available at `/music-pad/` during review.
- No product code changes were made in this field-review pass.