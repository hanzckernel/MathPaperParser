# Phase 10: Export Contract Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `10-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-03
**Status:** Complete

## Discussion Summary

The phase discussion focused on four export-boundary choices that change implementation outcome:
- what `--paper latest` means
- how exports represent missing enrichment
- how export behaves when the output directory already exists
- what proof point counts as Phase 10 completion

The user selected all four areas for discussion and chose explicit options for each.

## Questions and Selections

### 1. Latest semantics
**Question:** What should `--paper latest` mean?

**Options presented:**
- `1A` Strict store pointer — use `.paperparser-data/latest.json` only; fail if missing or invalid.
- `1B` Recover by scan — fall back to the most recently updated stored paper directory.
- `1C` Alias to “last listed” — derive latest from store listing order.

**Selected:** `1A`

**Captured decision:** `--paper latest` should resolve strictly through the store pointer file, with no fallback heuristics.

### 2. Missing enrichment representation
**Question:** How should “no enrichment exists” be exported?

**Options presented:**
- `2A` Always write `data/enrichment.json` as JSON `null`.
- `2B` Omit `data/enrichment.json` entirely when absent.
- `2C` Write an empty placeholder object instead of `null`.

**Selected:** `2A`

**Captured decision:** Export should always write `data/enrichment.json`; absence is represented by explicit JSON `null`.

### 3. Existing output directory behavior
**Question:** What should export do if `--output` already exists and contains files?

**Options presented:**
- `3A` Deterministic replace — clear/rebuild output so stale files do not survive.
- `3B` Refuse to export into a non-empty directory.
- `3C` Merge in place and only overwrite files the export writes.

**Selected:** `3A`

**Captured decision:** Existing output directories are a normal export target, but the implementation must behave as a deterministic replace path rather than preserving stale artifacts.

### 4. Phase 10 acceptance proof
**Question:** What should count as done for this phase?

**Options presented:**
- `4A` Automated boundary tests only — CLI export tests for Markdown/TeX/latest/enrichment plus static loader compatibility checks.
- `4B` Automated tests plus a checked-in golden exported artifact snapshot.
- `4C` Automated tests plus a required manual smoke procedure for every phase completion.

**Selected:** `4A`

**Captured decision:** Phase completion is proved through automated boundary tests only.

## Alternatives Not Chosen

- Fallback scanning for latest-paper resolution was rejected in favor of strict store-pointer semantics.
- Omitting `enrichment.json` or writing a placeholder object was rejected in favor of explicit JSON `null`.
- Refusing non-empty output directories or merging in place was rejected in favor of deterministic replacement behavior.
- Golden export snapshots and mandatory manual smoke checks were rejected in favor of automated boundary verification.

## Deferred Ideas

None.

---

*Phase: 10-export-contract-hardening*
*Discussion logged: 2026-04-03*
