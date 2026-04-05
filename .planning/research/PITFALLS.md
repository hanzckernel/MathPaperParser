# Pitfalls Research: PaperParser v1.5

**Milestone:** `v1.5 GCP Deployment & CI/CD`
**Status:** Complete
**Date:** 2026-04-05
**Confidence:** HIGH

## Pitfall 1: Automating a different deploy contract than the shipped one

**What goes wrong:**
- CI/CD “works,” but the live service no longer matches the `v1.4` documented Cloud Run topology, access model, or store mount

**Why it happens:**
- teams often rebuild deploy flags from scratch in CI instead of reusing the checked-in contract

**How to avoid:**
- make the pipeline consume the same deploy inputs and invariants as `deploy/cloudrun/deploy.sh`
- regression-test the deploy contract after pipeline work lands

**Warning signs:**
- pipeline deploy flags diverge from the runbook
- CI deploys a public service or omits the mounted store

**Phase to address:**
- earliest CI/CD automation phase

---

## Pitfall 2: Treating source-host integration as “someone else’s problem”

**What goes wrong:**
- the repo gains build scripts but no real automatic trigger path

**Why it happens:**
- the current repo has no configured remote, so it is easy to assume CI will be wired later

**How to avoid:**
- make repository host / trigger wiring an explicit requirement
- document the supported source-of-truth path for automated deploys

**Warning signs:**
- “CI/CD” only runs by manually dispatching from one workstation
- no documented repository connection or workflow location

**Phase to address:**
- environment/bootstrap phase

---

## Pitfall 3: Using long-lived service-account keys in CI

**What goes wrong:**
- deployment succeeds, but the automation path carries static credentials that are hard to rotate and easy to leak

**Why it happens:**
- key JSON is the fastest path when teams first wire hosted pipelines

**How to avoid:**
- prefer Workload Identity Federation
- restrict claims or repository identity as tightly as the chosen CI engine supports

**Warning signs:**
- CI secrets contain service-account JSON
- auth docs normalize key upload instead of federation

**Phase to address:**
- auth / pipeline phase

---

## Pitfall 4: Stopping at build-and-deploy without live smoke proof

**What goes wrong:**
- the pipeline turns green, but the deployed URL is broken or inaccessible

**Why it happens:**
- local tests prove the contract, but not live service reachability, auth wiring, or rollout health

**How to avoid:**
- add a live smoke path after deploy
- capture deployed URL or revision metadata and feed it into verification

**Warning signs:**
- no post-deploy `/healthz` or `/readyz` check
- no rollback criteria tied to smoke failure

**Phase to address:**
- release-proof phase

---

## Pitfall 5: Adopting Cloud Deploy too early

**What goes wrong:**
- the milestone spends time on targets, Skaffold, and promotion plumbing before the first live deploy path is even proven

**Why it happens:**
- Cloud Deploy is attractive as a “complete CD solution,” but it solves a broader staged-release problem than this repo has today

**How to avoid:**
- keep `v1.5` focused on one real deploy path and one real automated rollout
- defer Cloud Deploy unless multiple environments or approval gates become explicit scope

**Warning signs:**
- more time spent on delivery-pipeline scaffolding than on the actual first production-like deploy

**Phase to address:**
- planning/requirements

## Summary

The biggest failure mode is not GCP itself. It is pretending automation exists before the source integration, auth model, and live smoke proof are real. `v1.5` should make the hosted path concrete, secure, and reproducible before adding more release machinery.

## Sources

- Official docs:
  - https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run
  - https://docs.cloud.google.com/build/docs/automating-builds/create-manage-triggers
  - https://cloud.google.com/deploy/docs/deploy-app-run
  - https://github.com/google-github-actions/auth
  - https://github.com/google-github-actions/deploy-cloudrun
- Local docs:
  - `deploy/cloudrun/deploy.sh`
  - `deploy/cloudrun/RUNBOOK.md`
  - `deploy/cloudrun/SMOKE.md`
