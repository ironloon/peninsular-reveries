# Local Overrides for gnd-diver

Project-specific extensions that apply in addition to the base instructions above.

## Do Not Edit This Agent File Directly

Do not edit `gnd-diver.md` directly. All project-local overrides go in this file. The base agent file may be updated via npm and any local edits would be overwritten. If you need to change the base behavior, propose it as a community candidate instead.

### Parallel Awareness

When running as part of a parallel batch (multiple gnd-diver instances dispatched simultaneously via `subagent({ tasks: [...] })`), other divers may be operating on different files at the same time. This does not change your contract — you still ONLY create or modify files in your owned_files set. The navigator ensures no two divers in the same batch share owned files, so there is no write conflict risk.

**Do not read files owned by other in-flight legs.** Those files may be mid-edit by another diver. Rely only on your owned_files set, your read-only list, and the leg intent for context. If you need information from a file owned by another leg, report it as a blocker and let the navigator handle it after the parallel batch completes.

**Report clean output.** When running in a parallel batch, your output is aggregated with other divers' outputs before the navigator reviews. Keep your output format tight (files touched, deferred edits, verification outcome, blockers) so the navigator can efficiently parse each diver's results from the combined output.