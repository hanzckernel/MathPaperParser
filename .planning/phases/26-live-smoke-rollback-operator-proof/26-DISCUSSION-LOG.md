# Phase 26: Live Smoke, Rollback & Operator Proof - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `26-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-06
**Status:** Complete

## Discussion Summary

The phase discussion focused on the three choices that most change whether the hosted path is truly operational:
- whether smoke should block deploy success or merely report after the fact
- how deep the live smoke should go
- whether rollback should be automatic or explicit when smoke fails

The user chose blocking smoke after every deploy, a bounded authenticated read-only live request in addition to health/readiness, and explicit rollback with surfaced revision/image metadata rather than automatic rollback. That combination keeps the hosted proof real without turning the first automated release path into a high-risk self-healing system.

## Questions and Selections

### 1. Smoke timing
**Question:** When should live smoke run relative to automated deployment?

**Options presented:**
- `1A` Every automated deploy runs blocking post-deploy smoke.
- `1B` Smoke runs after deploy but is report-only.
- `1C` Smoke stays operator-invoked only.

**Selected:** `1A`

**Captured decision:** Every automated deploy should run blocking post-deploy smoke.

### 2. Smoke depth
**Question:** How deep should the live smoke go?

**Options presented:**
- `2A` Health/readiness plus one authenticated read-only live request path.
- `2B` Health/readiness plus a bounded write-path smoke using a dedicated smoke namespace.
- `2C` Full browser/UI smoke against the live service.

**Selected:** `2A`

**Captured decision:** Live smoke should verify `/healthz`, `/readyz`, and one authenticated read-only real request path.

### 3. Rollback policy
**Question:** What should happen when blocking smoke fails?

**Options presented:**
- `3A` Automatically roll back on blocking smoke failure.
- `3B` Surface exact failing revision/image metadata and keep rollback explicit via the supported helper.
- `3C` Keep rollback documentation-only with no pipeline linkage.

**Selected:** `3B`

**Captured decision:** Surface exact failing revision/image metadata and keep rollback explicit through the supported helper instead of auto-rolling back.

## Alternatives Not Chosen

- Report-only or manual-only smoke.
- Write-path or full browser/UI live smoke.
- Automatic rollback or rollback with no pipeline linkage.

## Deferred Ideas

- Auto-rollback behavior.
- Live write-path smoke.
- Full browser/UI smoke against the hosted service.

---

*Phase: 26-live-smoke-rollback-operator-proof*
*Discussion logged: 2026-04-06*
