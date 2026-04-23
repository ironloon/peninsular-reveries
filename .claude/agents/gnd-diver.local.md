# gnd-diver — Peninsular Reveries Local Extensions

These extend the base agent instructions for this project. Applied after base instructions; override on conflict.

## Clarifying Questions

**Always use `vscode_askQuestions` for diver-side user prompts.** When a leg is genuinely blocked by ambiguity that the navigator cannot resolve and the user must answer, present the question through the askQuestions tool rather than as freeform prose. Prefer surfacing one question at a time with concrete options. **Community Candidate** (for gnd upstream): pure UX improvement, no project coupling.

## Audio Audibility Verification

When implementing a leg that ships recorded SFX through `createSfxBus()` (default 0.12 bus gain, compressor at −18 dB threshold), do not declare the leg done on lint pass alone. Run an OfflineAudioContext loudness probe against at least one representative sample using the same chain configuration the runtime uses, and confirm the net peak reaches the compressor threshold. If the net signal is more than ~6 dB below threshold on phone speakers, the result will read as silent regardless of how clean the source file is.

## Visual Scene Verification

When implementing a leg that renders a stylized DOM/CSS scene with multiple variants (trains, characters, environments), open the page at the smallest required viewport (typically 390×844) before declaring done. Visually confirm: (a) every interactive target is positioned within the scene container, (b) variants are structurally distinct, and (c) all scene layers share the perspective declared in the plan.
