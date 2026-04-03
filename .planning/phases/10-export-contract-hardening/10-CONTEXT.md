# Phase 10: Export Contract Hardening - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the existing CLI export contract so static dashboard exports are deterministic before the dashboard starts. This phase covers latest-paper resolution, exported artifact completeness, existing-output replacement behavior, and the automated proof that the exported data contract remains compatible with the current static loader. It does not add new product surfaces or dashboard runtime behavior beyond what is required to keep the exported data contract stable.

</domain>

<decisions>
## Implementation Decisions

### Latest Paper Resolution
- **D-01:** `paperparser export --paper latest` should resolve strictly through the store pointer file (`latest.json`), not through directory scans or fallback heuristics.
- **D-02:** If the store pointer is missing or invalid, export should fail with an actionable error rather than silently guessing a paper.

### Exported Artifact Contract
- **D-03:** Static exports must always write `data/manifest.json`, `data/graph.json`, `data/index.json`, and `data/enrichment.json`.
- **D-04:** When no enrichment sidecar exists in the store, `data/enrichment.json` should contain explicit JSON `null`, not an omitted file and not an empty placeholder object.

### Output Directory Behavior
- **D-05:** Exporting into an existing output directory should be treated as a normal deterministic replace path, not as a merge or refusal path.
- **D-06:** Phase 10 should remove the risk of stale bundle artifacts surviving from previous exports in the same output location.

### Acceptance Proof
- **D-07:** Phase 10 is complete when automated boundary tests prove Markdown and TeX export compatibility, `--paper latest` behavior, explicit enrichment-null export behavior, and compatibility with the static dashboard loader contract.
- **D-08:** This phase does not require checked-in golden export snapshots or a mandatory manual smoke procedure; the acceptance bar is automated tests at the export/data-boundary layer.

### the agent's Discretion
- The exact mechanism used to ensure deterministic replacement of an existing output directory.
- The exact test split between CLI export tests and loader compatibility tests, as long as the accepted boundary is covered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Active milestone goals, hardening-only scope, and constraints around local-first behavior and MathJax follow-on work.
- `.planning/REQUIREMENTS.md` — `EXPORT-01`, `EXPORT-02`, and the milestone traceability rules this phase must satisfy.
- `.planning/ROADMAP.md` — Phase 10 boundary, success criteria, and ordering relative to later dashboard phases.
- `.planning/STATE.md` — Current milestone status and the expectation that Phase 10 starts the approved `v1.2` sequence.

### Export and dashboard contract docs
- `docs/user_guide.md` — Current documented export command and stated static-export file layout.
- `docs/dashboard_spec.md` — Dashboard contract showing the exported app reads from `data/` and should remain compatible with the static bundle layout.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/cli/src/export.ts`: Existing export orchestrator that builds `@paperparser/web` and writes exported bundle files into `output/data/`.
- `packages/cli/src/store.ts`: Owns store path resolution, `latest.json` reading, stored-paper resolution, and serialized bundle/enrichment loading.
- `packages/cli/src/index.ts`: `runExport()` is the public CLI boundary and already reports `paper_id` plus `output`.
- `packages/web/src/lib/data-source.ts`: Static loader contract for `manifest.json`, `graph.json`, `index.json`, and optional `enrichment.json`.
- `packages/cli/test/export-command.test.ts`: Existing CLI export regression coverage already targets Markdown and TeX fixtures and is the natural place to lock the Phase 10 acceptance bar.
- `packages/web/test/data-source.test.ts`: Existing loader compatibility tests already model optional enrichment behavior and static/API dual mode.

### Established Patterns
- Export logic is filesystem-first and deterministic: build once, then write JSON artifacts under `output/data/`.
- Store-level paper selection belongs in `packages/cli/src/store.ts`, not in ad hoc CLI command logic.
- Optional artifacts are tolerated at the loader boundary today, but the milestone can tighten the export contract while preserving loader compatibility.
- Tests use fixture-backed CLI runs rather than checked-in built export snapshots.

### Integration Points
- `packages/cli/src/store.ts` for strict `latest` semantics.
- `packages/cli/src/export.ts` for exported-file completeness and output-directory replacement behavior.
- `packages/cli/src/index.ts` for preserving CLI command behavior and error surfacing.
- `packages/cli/test/export-command.test.ts` and `packages/web/test/data-source.test.ts` for the automated Phase 10 proof.

</code_context>

<specifics>
## Specific Ideas

- `--paper latest` should mean exactly the current store pointer, nothing more.
- Missing enrichment in static exports should be represented as explicit JSON `null`.
- Export should behave predictably when reusing an output path; stale data should not survive between runs.
- Acceptance should stay at the boundary-test layer instead of adding a golden artifact or a required manual verification ritual.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-export-contract-hardening*
*Context gathered: 2026-04-03*
