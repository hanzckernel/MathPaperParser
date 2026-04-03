# Phase 12: Dashboard Bootstrap & Runtime Guardrails - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `12-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-03
**Status:** Complete

## Discussion Summary

The phase discussion focused on three runtime/bootstrapping choices that materially change robustness:
- how unsupported static `file://` usage should appear to the user
- whether the app should strictly enforce the `#root` mount contract
- whether valid API-backed usage should remain allowed when the page is opened from `file://`

The user asked for the most robust recommendation and then selected the strict/explicit path.

## Questions and Selections

### 1. Static `file://` UX
**Question:** What should users see when a static export is opened directly from `file://`?

**Options presented:**
- `1A` Full-page blocker card with exact local-server command.
- `1B` Inline warning banner while keeping the shell visible.
- `1C` Best-effort load with warning only.

**Selected:** `1A`

**Captured decision:** Unsupported static `file://` usage should fail explicitly with a full-page blocker and an actionable local-server command.

### 2. Missing mount target behavior
**Question:** What should happen if the shell does not provide `#root`?

**Options presented:**
- `2A` Fail fast with an explicit bootstrap error.
- `2B` Fallback automatically from `#root` to `#app`.
- `2C` Auto-create a mount node in `document.body`.

**Selected:** `2A`

**Captured decision:** `#root` is a strict build/shell contract; missing it is an explicit bootstrap failure, not a fallback case.

### 3. API mode over `file://`
**Question:** Should API-backed dashboards still be allowed when the page is opened from `file://`?

**Options presented:**
- `3A` Allow it with no blocker if the source is API-backed.
- `3B` Allow it but show a warning.
- `3C` Block all `file://` usage, including API mode.

**Selected:** `3A`

**Captured decision:** The runtime blocker applies only to static bundle loading; valid API-backed usage remains allowed.

## Alternatives Not Chosen

- Warning-only or best-effort static `file://` handling was rejected in favor of an explicit unsupported-runtime blocker.
- Mount fallbacks and auto-created nodes were rejected in favor of strict shell-contract enforcement.
- Blocking API mode on `file://` was rejected because it would conflate unsupported static loading with a still-valid runtime path.

## Deferred Ideas

- Broad compatibility shims for alternate mount containers.
- True static `file://` compatibility work beyond a clear unsupported-runtime message.

---

*Phase: 12-dashboard-bootstrap-runtime-guardrails*
*Discussion logged: 2026-04-03*
