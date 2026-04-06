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

After that local proof passes, use [RUNBOOK.md](RUNBOOK.md) for the live project checks:

- run `cloudbuild.validate.yaml`
- run `cloudbuild.release.yaml`
- deploy a revision
- open the authenticated service URL
- verify `/health` and `/ready`
- verify upload/query in the deployed dashboard
- verify rollback with `deploy/cloudrun/rollback.sh`
