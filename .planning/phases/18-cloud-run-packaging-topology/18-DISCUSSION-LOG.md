# Phase 18: Cloud Run Packaging & Topology - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `18-CONTEXT.md` — this log preserves the rationale for autonomous defaults.

**Gathered:** 2026-04-04
**Status:** Complete

## Discussion Summary

This phase did not need interactive user questions because the milestone and research already narrowed the target to Google Cloud Run and a combined web/API deployment path. The autonomous default was to choose the smallest repo-owned artifact and topology that make the deployed dashboard first-class without prematurely mixing in Phase 19 security policy or Phase 20 persistence details.

## Defaults Chosen

### 1. Deployment artifact
- Use a repo-defined root container image as the supported Cloud Run artifact.
- Build the web bundle inside the image so deployment does not depend on a local prebuilt `dist/` directory.

### 2. Browser/runtime topology
- Support one combined same-origin service for both dashboard and API.
- Do not treat split-origin deployment plus handwritten reverse-proxy setup as the supported path.

### 3. Dashboard boot behavior
- The deployed dashboard should enter same-origin API mode automatically.
- Static export behavior should stay intact for local/operator workflows instead of being redefined around Cloud Run.

### 4. Server ownership
- Extend the current CLI HTTP server rather than introducing Express, a separate web server, or a second process model in this phase.

## Alternatives Not Chosen

- A static-only Cloud Run deployment that still expects a separate API origin.
- Requiring operators to hand-edit dashboard URLs with `?api=http://...` after deployment.
- Introducing a new server framework solely for static asset serving.

## Deferred Ideas

- Authentication, authorization, and ingress lock-down.
- Persistence strategy, backups, and Cloud Storage wiring.
- Cloud Run smoke proof and deployment acceptance, which belong to later phases.

---

*Phase: 18-cloud-run-packaging-topology*
*Discussion logged: 2026-04-04*
