---
verified: 2026-04-04T10:54:00Z
status: passed
score: 3/3 must-haves verified
---

# Phase 18 Verification: Cloud Run Packaging & Topology

## Result

Phase 18 passes. The repo now ships a root Cloud Run container artifact, the CLI server can serve the built dashboard as a same-origin companion to the API, and the browser can default into that deployed same-origin API mode without breaking static export defaults.

## Verified Truths

### 1. The repo ships a supported Cloud Run artifact

Evidence:
- `Dockerfile`
- `packages/cli/test/cloud-run-artifact.test.ts`

What is true now:
- The repo root contains a versioned multi-stage `Dockerfile`.
- The image builds the monorepo and starts `paperparser serve --deployed`.
- The image carries explicit deployed-mode runtime env for the store and packaged web bundle path.

### 2. The deployed dashboard and API now have an explicit same-origin topology

Evidence:
- `packages/cli/src/server.ts`
- `packages/cli/test/serve-app.test.ts`
- `packages/web/src/lib/data-source.ts`
- `packages/web/test/bundle-data.test.ts`

What is true now:
- The CLI server can serve `index.html` and built web assets from a configured `webDistPath`.
- The served dashboard shell injects deployed runtime config pointing the browser at the same-origin API.
- The web app keeps static export defaults when no deployed runtime config exists.

### 3. The packaging/topology contract is re-proved and buildable

Evidence:
- `PATH=/opt/homebrew/bin:$PATH npm test -- packages/cli/test/serve-app.test.ts packages/web/test/bundle-data.test.ts packages/cli/test/cloud-run-artifact.test.ts`
- `PATH=/opt/homebrew/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/bin:$PATH npm run build`

What is true now:
- The combined-service request/data-source contract is covered by automated tests.
- Cross-workspace typing is green.
- The workspace build path required by the Docker artifact completes successfully.

## Remaining Deferred Work

- Shared-deployment auth/authz and ingress hardening remain Phase 19 work.
- GCP persistence and operator runbook work remain Phase 20 work.
- End-to-end Cloud Run smoke proof remains Phase 21 work.

---

*Phase: 18-cloud-run-packaging-topology*
*Verified: 2026-04-04*
