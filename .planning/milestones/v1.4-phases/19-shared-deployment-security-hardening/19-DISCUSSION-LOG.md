# Phase 19: Shared Deployment Security Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `19-CONTEXT.md` — this log preserves the rationale for autonomous defaults.

**Gathered:** 2026-04-04
**Status:** Complete

## Discussion Summary

This phase did not need interactive user questions because the milestone already narrowed the target to GCP Cloud Run and the user explicitly asked for deployment hardening. The remaining gray area was whether to choose a more complex ingress path now. The autonomous default was the lowest-cost explicit secure path: direct Cloud Run service access with IAM-required authentication and explicit invoker grants, while deferring load balancers and IAP until the project actually needs them.

## Defaults Chosen

### 1. Authentication model
- Keep the Cloud Run Invoker IAM check enabled.
- Treat public flags and `allUsers` grants as unsupported.

### 2. Shared access model
- Support direct authenticated Cloud Run service access.
- Grant access to named users or service accounts explicitly with `roles/run.invoker`.

### 3. Operator guardrails
- Put deploy/access security controls in repo-owned scripts or templates.
- Add local tests that fail if the secure-path contract drifts toward public exposure.

## Alternatives Not Chosen

- Making the service public and relying on app-level secrets later.
- Jumping immediately to a load-balancer or IAP topology with higher cost and more moving parts.
- Leaving the access model as console-only documentation with no repo-backed enforcement.

## Deferred Ideas

- IAP, external load balancing, and custom-domain ingress.
- Full operator runbook and persistence strategy.

---

*Phase: 19-shared-deployment-security-hardening*
*Discussion logged: 2026-04-04*
