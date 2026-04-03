---
phase: 10-export-contract-hardening
plan: "01"
subsystem: cli-export-contract
tags: [export, cli, static-dashboard, store, vitest]
requires:
  - phase: 10-export-contract-hardening
    provides: Context and execution plan for export contract hardening
provides:
  - Strict `--paper latest` resolution through the explicit store pointer
  - Explicit `data/enrichment.json` output for every static export
  - Deterministic replacement of existing export directories
  - Static loader compatibility coverage for `enrichment.json = null`
affects: [Phase 11, packages/cli/src/export.ts, packages/cli/src/store.ts, packages/web/src/lib/data-source.ts]
tech-stack:
  added: []
  patterns:
    - Build static exports into a temporary directory, then replace the final output path atomically at the filesystem level
    - Treat explicit JSON `null` sidecars as compatible optional artifacts at the loader boundary
key-files:
  created: []
  modified: [packages/cli/src/export.ts, packages/cli/src/store.ts, packages/cli/test/export-command.test.ts, packages/web/test/data-source.test.ts]
key-decisions:
  - "`--paper latest` remains a strict alias to the store pointer file rather than a directory scan heuristic."
  - "Static exports always emit `data/enrichment.json`; absence is encoded as JSON `null`."
  - "Re-exporting into an existing output path is a deterministic replace operation, not an in-place merge."
patterns-established:
  - "Export contract hardening belongs at the CLI/store boundary before dashboard runtime behavior changes."
  - "Static loader compatibility can be proven with focused fixture-backed tests instead of checked-in built snapshots."
requirements-completed: [EXPORT-01, EXPORT-02]
duration: 20min
completed: 2026-04-03
---

# Phase 10 Plan 01 Summary

**Harden the CLI export contract before dashboard runtime work begins**

## Performance

- **Duration:** 20 min
- **Completed:** 2026-04-03
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Tightened store resolution so `paperparser export --paper latest` goes through the explicit `latest.json` pointer path instead of treating `latest` as a literal stored ID.
- Made static exports always emit `data/enrichment.json`, using explicit JSON `null` when no enrichment sidecar exists.
- Reworked the export path to build into a temporary directory and then replace the final output directory so stale files cannot survive across re-exports.
- Added a CLI export regression proving stale files are removed when exporting into an existing output directory.
- Added a static loader compatibility test proving `enrichment.json = null` is treated as an absent optional sidecar rather than as a crash or malformed enrichment object.

## Task Commits

1. **Task 1-3: Lock replacement behavior, harden export replacement, and prove loader compatibility** - pending phase commit

## Verification

- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/cli/test/export-command.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/web/test/data-source.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`

## Next Phase Readiness

- Phase 11 can now assume the static export payload is deterministic and complete before it introduces MathJax rendering and fragment normalization.
- Phase 12 can build on an explicit, replacement-safe export shell instead of debugging stale output artifacts and ambiguous `latest` semantics at the same time.

---
*Phase: 10-export-contract-hardening*
*Completed: 2026-04-03*
