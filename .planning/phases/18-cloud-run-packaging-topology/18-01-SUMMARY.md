---
phase: 18-cloud-run-packaging-topology
plan: "01"
requirements-completed:
  - DEPLOY-01
  - DEPLOY-02
duration: 32min
completed: 2026-04-04
---

# Phase 18 Summary

Phase 18 shipped the first supported Cloud Run packaging and topology contract. The repo now has a root multi-stage `Dockerfile`, the CLI server can serve the built dashboard shell and assets in deployed mode, and the web app can bind to the same-origin API automatically from injected runtime config instead of requiring a manual `?api=` deployment URL.

## Delivered

- Added a repo-defined Cloud Run deployment artifact in `Dockerfile` plus `.dockerignore`.
- Extended `paperparser serve` with deployed web-bundle support and container-friendly env defaults.
- Added deployed runtime-config handling so the dashboard can default to same-origin API mode while preserving static export behavior.
- Updated deployment docs to reflect that packaging and topology are now repo-defined, while access/security and persistence remain open.
- Added automated proof for the Docker artifact and the combined-service dashboard/API contract.

## Verification

- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/cli/test/serve-app.test.ts packages/web/test/bundle-data.test.ts packages/cli/test/cloud-run-artifact.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/bin:$PATH npm run build`

## Follow-on Constraints

- Phase 19 must add explicit shared-deployment auth and ingress controls before the Cloud Run path can be called internet-facing safe.
- Phase 20 must define the supported GCP persistence and operator workflow around the new artifact.
