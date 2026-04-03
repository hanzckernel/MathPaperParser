# Feature Research: PaperParser v1.4

**Milestone:** `v1.4 GCP Cloud Run Deployment Hardening`
**Status:** Complete
**Date:** 2026-04-04
**Confidence:** HIGH

## Category: Cloud Run Packaging

### Table stakes

- A checked-in deployment artifact for Cloud Run, not just manual local commands
- One documented deploy command or workflow that produces a runnable service revision
- Explicit runtime configuration for port, store path, region, and service account

### Differentiators

- Repeatable infra/deploy config, such as Terraform or committed service YAML
- Tagged or immutable image references for rollback-friendly deployment

### Anti-features

- “Just run `gcloud` by hand” as the only deployment story
- A deployment process that depends on unpublished local machine state

## Category: Topology and Access

### Table stakes

- A supported same-origin web/API topology for the browser dashboard
- A defined access model for shared deployment: authenticated internal users, or explicit public access with compensating controls
- Clear ingress expectations for Cloud Run and any load-balancer layer

### Differentiators

- Identity-Aware Proxy for trusted-user access without adding full product auth yet
- Optional custom domain and load-balancer path once the base topology works

### Anti-features

- Split-origin web/API deployment without an explicit CORS contract
- Public `run.app` exposure that bypasses intended load-balancer or auth controls

## Category: API Safety

### Table stakes

- Remove or restrict JSON `inputPath` ingestion for deployed environments
- Add bounded request and upload handling
- Add explicit health and readiness endpoints
- Emit structured logs for operator debugging

### Differentiators

- Environment-aware runtime modes that keep localhost ergonomics while hardening deployed mode
- Safer upload lifecycle and explicit operator-visible limits

### Anti-features

- Keeping local-only filesystem trust assumptions in the internet-facing mode
- Using “it is behind Cloud Run” as a substitute for application-side safety

## Category: Persistence and Operations

### Table stakes

- Define where the persistent paper store lives on GCP
- Document deployment config, persistence, upgrade, and rollback steps
- Add acceptance coverage that proves the Cloud Run target is actually deployable

### Differentiators

- Infra as code for bucket/service wiring
- Production-minded operational checks for logs, readiness, and smoke verification

### Anti-features

- Assuming the ephemeral container filesystem is a persistent store
- Declaring production readiness without a runbook or rollback path

## Research Takeaway

The natural scope split is:
1. harden the current server boundary for deployment
2. package and route the combined web/API runtime for Cloud Run
3. define persistence plus operator proof for the GCP path

## Sources

- Official docs:
  - https://cloud.google.com/run/docs/authenticating/overview
  - https://cloud.google.com/run/docs/securing/ingress
  - https://cloud.google.com/run/docs/configuring/healthchecks
  - https://cloud.google.com/run/docs/configuring/request-timeout
  - https://cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts
- Local docs:
  - `docs/deployment_readiness.md`
