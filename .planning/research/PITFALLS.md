# Pitfalls Research: PaperParser v1.4

**Milestone:** `v1.4 GCP Cloud Run Deployment Hardening`
**Status:** Complete
**Date:** 2026-04-04
**Confidence:** HIGH

## Pitfall 1: Deploying the current local-only API surface unchanged

**What goes wrong:**
- Remote clients can ask the server to read arbitrary filesystem paths through JSON `inputPath`
- Upload requests can consume unbounded memory

**Why it happens:**
- The current API was designed for localhost tooling, not shared deployment

**How to avoid:**
- Remove or gate JSON `inputPath` ingestion in deployed mode
- Add explicit request-size and upload-size limits

**Warning signs:**
- Deployed service still accepts local-path analysis over HTTP
- No hard failure on oversized uploads

**Phase to address:**
- earliest deployment-hardening phase

---

## Pitfall 2: Treating split web/API deployment as a free default

**What goes wrong:**
- Browser deployment fails into CORS confusion or undocumented proxy assumptions

**Why it happens:**
- The current repo supports API mode, but not a documented cross-origin production contract

**How to avoid:**
- Make same-origin the default supported topology
- Only split origins if the milestone explicitly adds and tests that contract

**Warning signs:**
- The Cloud Run service ships, but the dashboard only works when manually editing query params or proxy settings

**Phase to address:**
- topology/serving phase

---

## Pitfall 3: Assuming Cloud Storage mounts behave like a local POSIX disk

**What goes wrong:**
- Latency, caching, or write expectations drift from what the mounted object-store bridge actually provides

**Why it happens:**
- The current app is filesystem-oriented, so it is tempting to pretend a mounted bucket is “just disk”

**How to avoid:**
- Use the mount as a bounded store bridge only
- Keep write patterns simple and explicit
- Document the persistence contract and limitations

**Warning signs:**
- Code starts depending on local-disk semantics outside the existing bundle store flow

**Phase to address:**
- persistence phase

---

## Pitfall 4: Exposing the wrong endpoint to the internet

**What goes wrong:**
- Traffic reaches the raw `run.app` service path instead of the intended ingress layer or access model

**Why it happens:**
- Cloud Run ingress defaults are easy to leave open if the operator only thinks about IAM or only thinks about the load balancer

**How to avoid:**
- Define the supported ingress model explicitly
- Restrict ingress and disable the default URL when the load balancer is the intended public entry point

**Warning signs:**
- The service is reachable in more places than the runbook describes

**Phase to address:**
- topology/access phase

---

## Pitfall 5: Shipping a deploy command without an operability contract

**What goes wrong:**
- The app can be deployed, but operators cannot tell whether it is healthy, ready, or safe to roll back

**Why it happens:**
- Teams often stop at “container runs” instead of completing health, logs, and runbook work

**How to avoid:**
- Add `/healthz` and `/readyz`
- Emit structured logs
- Publish rollout and rollback instructions
- Add a deployment acceptance proof

**Warning signs:**
- No documented smoke test after deploy
- No log fields that help distinguish request failures from app failures

**Phase to address:**
- operability and acceptance phase

## Summary

The biggest failure mode is not Cloud Run itself. It is exporting local assumptions into a shared environment:
- local-only filesystem trust
- implicit browser topology
- storage semantics the platform does not actually promise
- deployment success without operational proof

## Sources

- Official docs:
  - https://cloud.google.com/run/docs/securing/ingress
  - https://cloud.google.com/run/docs/authenticating/overview
  - https://cloud.google.com/run/docs/configuring/healthchecks
  - https://cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts
- Local docs:
  - `docs/deployment_readiness.md`
  - `packages/cli/src/server.ts`
