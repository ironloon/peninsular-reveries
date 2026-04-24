# Local Overrides for gnd-chart

Project-specific extensions that apply in addition to the base skill instructions.

## Do Not Edit SKILL.md

Do not edit `SKILL.md` directly. All project-local overrides go in this file. The base skill file may be updated via npm and any local edits would be overwritten. If you need to change the base behavior, propose it as a community candidate instead.

### Additional Workshop Checks — Audio

**Audio bundle-audit checkpoint:** When a leg modifies or creates a sample manifest, the intent must either include the creative-assets fetch/download step or explicitly state "mark `bundled: false` as placeholder until creative-assets runs." A sample manifest with `bundled: true` entries but no corresponding files on disk is a workshop failure — it produces a game that silently produces no audio. During workshop, ask: "Are sample files already on disk, or does this leg need the creative-assets skill to fetch them?"

**Sound ID enumeration:** When a leg defines audio feedback, enumerate a sample ID for every distinct player action that produces sound. If two actions share a sample, say so explicitly. Omitting actions from the sample list produces invisible UX gaps (e.g., a "drop" action that reuses a "pickup" whoosh). During workshop, list every player action and its corresponding sample ID.