# Phase 23: GCP Bootstrap & First Live Deployment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `23-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-06
**Status:** Complete

## Discussion Summary

The phase discussion focused on the three choices that most change Phase 23 implementation:
- whether the first live GCP environment should be bootstrapped through checked-in automation or remain manual
- whether the first deployment should target a real long-lived service or only an ephemeral proof environment
- whether source-host / CI trigger assumptions should already enter the phase

The user chose the more operationally durable path on all three axes: checked-in bootstrap automation where practical, one concrete long-lived service, and no source-host dependency yet.

## Questions and Selections

### 1. Bootstrap ownership
**Question:** Should Phase 23 create/bootstrap the required GCP resources from checked-in automation, or only document and verify operator-created infrastructure?

**Options presented:**
- `1A` Checked-in bootstrap automation where practical.
- `1B` Docs + manual operator setup only.

**Selected:** `1A`

**Captured decision:** Phase 23 should add repo-owned bootstrap automation where practical instead of relying solely on prose or console-only setup.

### 2. Live target strictness
**Question:** Should the first live deployment go to a concrete long-lived service/environment or only an ephemeral proof target?

**Options presented:**
- `2A` Concrete long-lived service/environment.
- `2B` Ephemeral proof deployment only.

**Selected:** `2A`

**Captured decision:** The first live deployment should land on one concrete long-lived Cloud Run service/environment that later CI/CD can reuse.

### 3. Source-host dependency
**Question:** Should Phase 23 already depend on repository-host integration, or stay operator-driven until the CI/CD phases?

**Options presented:**
- `3A` No source-host dependency in Phase 23.
- `3B` Partially prepare source integration now.

**Selected:** `3A`

**Captured decision:** Phase 23 must not depend on a configured remote, hosted repository integration, or CI trigger path; that remains later `v1.5` work.

## Alternatives Not Chosen

- Manual-only environment setup without checked-in bootstrap artifacts.
- An ephemeral proof deployment that would not survive into later CI/CD work.
- Folding source-host or trigger integration into the first-live-deploy phase.

## Deferred Ideas

- Hosted source integration and CI trigger wiring.
- Secretless CI/CD auth.
- Automated post-deploy smoke and release proof.

---

*Phase: 23-gcp-bootstrap-first-live-deployment*
*Discussion logged: 2026-04-06*
