# Phase 05 Research

## Findings

1. The highest-signal acceptance surface is the CLI workflow.
   - The milestone starts from a TeX project path and ends with a local artifact.
   - `runCli()` already exercises the same user-facing command surface used in README examples.

2. The built CLI flow now works on the real gold paper.
   - A manual run of `analyze -> enrich -> validate -> export` on `long_nalini` completed successfully.
   - Current observed artifact shape on 2026-04-02:
     - canonical graph: 416 nodes, 617 edges
     - enrichment sidecar: 20 candidate edges
     - static export includes `data/enrichment.json`

3. The acceptance test should stay robust to future parser improvements.
   - Exact counts are useful in summaries, but the regression gate should mainly prove:
     - success codes
     - expected artifact files
     - schema-valid workflow
     - non-trivial graph size
     - optional enrichment present and separate

## Recommendation

Implement Phase 5 as one acceptance-plan:

- add a gold-paper end-to-end CLI regression test
- assert the workflow produces diagnostics, canonical bundle files, `enrichment.json`, and a static export
- assert the validated graph is non-trivial and the enrichment sidecar is populated
- update roadmap/state/requirements only after the acceptance harness is green
