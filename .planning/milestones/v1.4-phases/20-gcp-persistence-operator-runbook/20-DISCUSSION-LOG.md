# Phase 20: GCP Persistence & Operator Runbook - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `20-CONTEXT.md` — this log preserves the rationale for autonomous defaults.

**Gathered:** 2026-04-04
**Status:** Complete

## Discussion Summary

This phase did not need interactive user questions because the codebase still relies on a filesystem-backed store and the milestone research already pointed to Cloud Storage volume mounts as the bounded persistence bridge. The autonomous default was to embrace that bridge explicitly and document its limits instead of pretending the service is storage-agnostic.

## Defaults Chosen

### 1. Persistence bridge
- Use a dedicated Cloud Storage bucket mounted into the service filesystem.
- Keep the existing store contract path rather than rewriting persistence in `v1.4`.

### 2. Operational posture
- Treat the mounted bucket as a low-concurrency shared-deployment bridge.
- Call out Cloud Storage FUSE write/concurrency limitations explicitly.

### 3. Runbook scope
- Cover image build/push, bucket setup, service account access, deploy, invoker grants, verify, upgrade, and rollback from repo docs.

## Alternatives Not Chosen

- Re-architecting the store onto a database in this milestone.
- Pretending ephemeral instance storage is sufficient for the shipped deployment path.
- Deferring rollback commands to tribal knowledge outside the repo.

## Deferred Ideas

- A deeper persistence redesign.
- Live acceptance against a real GCP project.

---

*Phase: 20-gcp-persistence-operator-runbook*
*Discussion logged: 2026-04-04*
