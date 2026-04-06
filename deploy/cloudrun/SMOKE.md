# Cloud Run Smoke Proof

The named local acceptance proof for the `v1.4` Cloud Run milestone is:

```bash
npm run test:acceptance:v1.4
npm run typecheck
```

This bundle proves:

- the deployed request boundary and health/readiness contract
- same-origin deployed dashboard source resolution
- the root Docker deployment artifact
- authenticated shared-access helpers
- the mounted-bucket persistence bridge and rollback helper

After that local proof passes, the hosted release path writes `cloudrun-smoke.json` by running `deploy/cloudrun/live-smoke.sh` after deploy.

That live smoke contract proves:

- the deployed service URL is still authenticated and reachable
- `/health` and `/ready` both report an operational service
- `/api/papers` answers as a real read-only API path against the mounted store
- the deployed revision and immutable image identity are captured together with explicit rollback guidance

In other words, the hosted release must verify `/health` and `/ready`, then confirm the authenticated `GET /api/papers` smoke path before the release is considered good.

Use [RUNBOOK.md](RUNBOOK.md) for the full operator workflow:

- run `cloudbuild.validate.yaml`
- run `cloudbuild.release.yaml`
- confirm `cloudrun-smoke.json`
- verify rollback with `deploy/cloudrun/rollback.sh` when smoke surfaces a bad revision
