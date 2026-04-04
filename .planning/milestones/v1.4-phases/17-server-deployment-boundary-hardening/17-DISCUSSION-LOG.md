# Phase 17: Server Deployment Boundary Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `17-CONTEXT.md` — this log preserves the rationale for autonomous defaults.

**Gathered:** 2026-04-04
**Status:** Complete

## Discussion Summary

This phase did not need interactive user questions because the repo already had an explicit deployment blocker document and the milestone scope was approved narrowly. The autonomous default was to translate those existing blockers into implementation decisions that keep local workflows possible while making deployed behavior explicit and bounded.

## Defaults Chosen

### 1. Local-only versus deployed behavior
- Local ergonomics may remain where they are clearly development-only.
- Shared deployment must not keep the unsafe localhost contract by default.

### 2. JSON `inputPath` analysis
- Remote JSON `inputPath` analysis is treated as unacceptable in deployed mode.
- If retained for localhost workflows, it must reject explicitly outside local mode.

### 3. Upload hardening
- This phase prioritizes explicit size limits and bounded failure behavior first.
- A full upload streaming redesign is allowed to remain later work if strict limits make the current path safe enough for the supported deployment slice.

### 4. Operability surface
- `/healthz` and `/readyz` are required now rather than being deferred to packaging.
- Structured logging belongs in the app boundary, not just in later Cloud Run docs.

## Alternatives Not Chosen

- Leaving JSON `inputPath` available everywhere and relying on Cloud Run deployment settings to compensate.
- Deferring health/readiness until after packaging work.
- Requiring a full storage redesign in this phase before any deployment-hardening progress can ship.

## Deferred Ideas

- Container packaging, same-origin web/API serving, and Cloud Run deployment manifests.
- Shared-deployment auth/authz and ingress controls, which belong to Phase 19.
- GCP persistence/runbook work, which belongs to Phase 20.

---

*Phase: 17-server-deployment-boundary-hardening*
*Discussion logged: 2026-04-04*
