# Phase 19 Research: Shared Deployment Security Hardening

**Date:** 2026-04-04
**Status:** Complete

## Goal

Codify a low-cost Cloud Run shared-deployment access model that is authenticated by default and hard to accidentally make public.

## Official Cloud Run Findings

### 1. Cloud Run public access is an explicit opt-out from IAM protection

From the official Cloud Run public-access docs:
- Cloud Run enforces the Invoker IAM check by default.
- Making a service public uses `--no-invoker-iam-check` or an `allUsers` invoker grant.

Implication for PaperParser:
- the supported shared deployment path should keep the invoker IAM check enabled
- repo-owned artifacts should never use `--no-invoker-iam-check`
- repo-owned access helpers should reject `allUsers` and `allAuthenticatedUsers`

### 2. Ingress is a separate explicit control

From the official ingress docs:
- ingress must be set explicitly via `--ingress`
- `all`, `internal`, and `internal-and-cloud-load-balancing` are distinct modes
- IAM authentication still applies on top of ingress settings

Implication for PaperParser:
- the repo should declare ingress explicitly, even if the supported model is direct authenticated `run.app` access
- for the lowest-cost first supported path, `all` ingress plus IAM auth is acceptable because authentication remains required and no load balancer is introduced yet

### 3. IAM-protected Cloud Run services use identity tokens and `roles/run.invoker`

From the official custom-audiences and IAM docs:
- invokers authenticate with Google-signed identity tokens
- the access boundary is `roles/run.invoker`
- custom audiences are only needed when clients do not target the default service URL

Implication for PaperParser:
- the simplest first shared model is direct authenticated service access at the service URL
- custom audiences, custom domains, and load balancers can remain deferred

## Recommended Phase-19 Shape

### 1. Add repo-owned deploy/access security scripts

Recommended artifacts:
- `deploy/cloudrun/deploy.sh`
- `deploy/cloudrun/grant-invoker.sh`

Recommended behavior:
- deploy script pins `--invoker-iam-check`
- deploy script sets explicit ingress
- invoker-grant script only grants `roles/run.invoker` to named principals
- invoker-grant script rejects `allUsers` and `allAuthenticatedUsers`

### 2. Document the supported shared deployment model clearly

Recommended docs:
- README and/or `deploy/cloudrun/README.md`
- deployment readiness doc

Recommended statement:
- supported shared deployment in `v1.4` is direct authenticated Cloud Run access
- public access and broader ingress variants are unsupported

### 3. Prove the security contract locally with mocked `gcloud`

Recommended tests:
- mock `gcloud` to capture args from deploy/access scripts
- assert deploy script uses `--invoker-iam-check`
- assert grant script refuses `allUsers` and `allAuthenticatedUsers`

## Suggested File Set

- `deploy/cloudrun/deploy.sh`
- `deploy/cloudrun/grant-invoker.sh`
- `deploy/cloudrun/README.md`
- `packages/cli/test/cloud-run-security-contract.test.ts`
- `README.md`
- `docs/deployment_readiness.md`

## Verification Direction

- targeted mocked-script tests
- `npm run typecheck` to ensure the repo remains green

## Out of Scope for This Phase

- load balancers, IAP, custom domains, and disabled default URLs
- GCP persistence and operator runbook depth
- full Cloud Run smoke deployment

---

*Phase: 19-shared-deployment-security-hardening*
*Research completed: 2026-04-04*
