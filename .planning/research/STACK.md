# Stack Research: PaperParser v1.4

**Milestone:** `v1.4 GCP Cloud Run Deployment Hardening`
**Status:** Complete
**Date:** 2026-04-04
**Confidence:** HIGH

## Recommendation

Default recommendation:
- Keep the existing TypeScript monorepo and current Node HTTP server as the serving runtime.
- Package the app as a versioned container image and deploy it to Cloud Run from Artifact Registry.
- Serve the React dashboard and the API from the same Cloud Run service so the browser path is same-origin by default.
- Use a Cloud Storage volume mount only as the bounded persistence bridge for the current filesystem-backed store, not as a general-purpose local disk replacement.
- Treat Cloud Run ingress, IAM, request limits, and health checks as part of the product contract, not just deployment settings.

## Core Stack

| Technology | Purpose | Why Recommended |
|------------|---------|-----------------|
| Cloud Run services | Primary deployment target | Native fit for HTTP container workloads, autoscaling, and the chosen GCP target |
| Artifact Registry | Container image storage | Standard image registry for Cloud Run deployments |
| Versioned Dockerfile | Supported packaging artifact | More reproducible than ad hoc source deploy for a repo that wants a durable deployment contract |
| Cloud Storage volume mount | Store-path persistence bridge | Lets the current file-backed bundle store run on Cloud Run with bounded code churn |
| Cloud Logging via stdout/stderr | Structured logs and request correlation | Cloud Run automatically ships container logs and request logs to Cloud Logging |

## Supporting GCP Services

| Service | When to Use | Notes |
|---------|-------------|-------|
| External Application Load Balancer | When the dashboard and API need one shared public hostname with load-balancer controls | Cloud Run ingress can be restricted to `internal-and-cloud-load-balancing` to force traffic through the load balancer |
| Identity-Aware Proxy | When access should be limited to trusted users without building a full app-auth system first | Better fit than a public unauthenticated API for the current app state |
| Secret Manager | When deployment needs API keys or other operator secrets later | Better than baking secrets into images or env files |
| Terraform | When the deployment path needs repeatable infra creation | Useful, but not required for the first supported deployment slice |

## Recommended Stack Decision

1. **Use Cloud Run + Artifact Registry as the primary deploy path.**
2. **Prefer a checked-in Dockerfile** over relying only on `gcloud run deploy --source`, because the milestone goal is a supported packaging story, not a one-off deploy shortcut.
3. **Serve web + API from one runtime** so the deployed dashboard does not depend on a separate CORS strategy.
4. **Use Cloud Storage volume mounts only as a transitional persistence layer** for the current store structure.
5. **Keep the first supported shared access model authenticated and bounded**, ideally through load-balancer controls or a private Cloud Run service, unless the milestone explicitly adds end-user auth.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Versioned Dockerfile | `gcloud run deploy --source` | Fine for quick experiments, but weaker as the repo’s supported packaging contract |
| Same-origin combined service | Split static site + separate API service with CORS | Only when there is a strong reason to decouple front and back ends |
| Cloud Storage mount bridge | Full persistence redesign first | Better long term, but likely too much scope for the first deployment milestone |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Direct public exposure of the current API surface | The repo still has remote-path ingestion, unbounded uploads, and no app auth | Harden the API first and keep access bounded |
| Treating the Cloud Storage mount like a normal local SSD | It is a mounted object-store bridge with different performance and semantics | Use it as a bounded store path, not as a general mutable scratch disk |
| A split-origin dashboard/API deployment by default | The current app has no supported CORS deployment contract | Same-origin serving through one service or a deliberate load-balancer setup |

## Key Official Findings

- Cloud Run can deploy from source, but that path builds behind the scenes with Cloud Build and stores images in Artifact Registry.
- Cloud Run services are private by default at the IAM layer.
- Cloud Run ingress defaults still allow internet reachability unless explicitly restricted.
- Cloud Run supports startup and liveness probes.
- Cloud Run supports Cloud Storage volume mounts in the second-generation execution environment.
- Cloud Run request timeout defaults to 300 seconds and can be configured.

## Sources

- Official docs:
  - https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service
  - https://cloud.google.com/run/docs/deploying-source-code
  - https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling
  - https://cloud.google.com/run/docs/configuring/healthchecks
  - https://cloud.google.com/run/docs/configuring/request-timeout
  - https://cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts
  - https://cloud.google.com/run/docs/securing/ingress
  - https://cloud.google.com/run/docs/authenticating/overview
  - https://cloud.google.com/run/docs/logging
- Local docs:
  - `docs/deployment_readiness.md`
  - `README.md`
