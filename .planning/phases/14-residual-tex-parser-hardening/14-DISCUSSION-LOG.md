# Phase 14: Residual TeX Parser Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `14-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-03
**Status:** Complete

## Discussion Summary

The phase discussion focused on four parser-hardening choices that materially change implementation outcome:
- whether figure references should finally become resolvable targets
- how far to go on package-specific reference commands such as `\cref` / `\Cref`
- what deterministic policy should apply when the same label is defined more than once
- how tightly the phase should stay bound to accepted-corpus residuals versus broader hardening

The user first asked for bounded figure-target extraction, then narrowed that choice after the more specific contract options were presented.

## Questions and Selections

### 1. Residual target strategy
**Question:** Should Phase 14 make `fig:*` references resolvable?

**Options presented:**
- `1A` First-class `figure` nodes in the canonical graph.
- `1B` Internal-only figure target resolution without a public node kind.
- `1C` Keep the current node schema and leave figure refs explicit while reducing diagnostics elsewhere.

**Selected:** `1C`

**Captured decision:** Figure references do not need to become resolvable targets in this phase. Phase 14 may leave `fig:*` references explicit and focus its hardening effort elsewhere.

### 2. Package-specific reference commands
**Question:** How much `\cref` / `\Cref` support belongs in this phase?

**Options presented:**
- `2A` Keep them explicit unsupported diagnostics.
- `2B` Support only the narrow singular case where they behave like `\ref`.
- `2C` Support broader cleveref-style behavior in this phase, including more than the singular alias case.

**Selected:** `2C`

**Captured decision:** Phase 14 should broaden deterministic support for `\cref` / `\Cref`, but still only where the parser can map them to known deterministic targets.

### 3. Duplicate-label policy
**Question:** What should happen when the same `\label{...}` appears more than once in the TeX source?

**Clarification requested by the user:** “Meaning two theorems are labelled the same?”

**Clarification given:** Yes — duplicate-label means the source defines the same label more than once, for example two theorem or equation targets sharing one label.

**Options presented:**
- `3A` Treat duplicate labels as explicit ambiguity and do not auto-resolve them.
- `3B` First definition wins deterministically, but emit a warning.
- `3C` Last definition wins deterministically, but emit a warning.

**Selected:** `3B`

**Captured decision:** Duplicate labels should resolve deterministically to the first definition while still emitting an explicit warning.

### 4. Hardening scope
**Question:** How broad should the parser hardening pass be?

**Options presented:**
- `4A` Accepted-corpus first, with only direct residual fixtures.
- `4B` Accepted-corpus first, but allow one adjacent deterministic pattern class if it falls out naturally.
- `4C` Broaden into a more general LaTeX hardening pass.

**Selected:** `4B`

**Captured decision:** Phase 14 should stay anchored to the accepted corpus, but it may absorb one adjacent deterministic pattern class if that comes naturally from the same parser work.

## Alternatives Not Chosen

- First-class or internal-only figure-target extraction was rejected in favor of keeping figure references explicit for now.
- Leaving `\cref` / `\Cref` fully unsupported or reducing them to a singular alias-only case was rejected in favor of broader bounded support.
- Duplicate-label fail-closed ambiguity and last-definition resolution were rejected in favor of deterministic first-definition resolution with a warning.
- A strict corpus-only scope and a broad generalized hardening pass were both rejected in favor of a bounded adjacent-pattern allowance.

## Deferred Ideas

- Figure-target extraction and any first-class `figure` schema work.
- Full package emulation for cleveref or other browser/tooling packages.
- Corpus-wide search and related cross-paper UX.

---

*Phase: 14-residual-tex-parser-hardening*
*Discussion logged: 2026-04-03*
