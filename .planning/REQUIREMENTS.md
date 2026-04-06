# Requirements: PaperParser

**Defined:** 2026-04-05
**Core Value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## v1 Requirements

### GCP Environment

- [x] **GCP-01**: Operator can bootstrap or verify the required GCP resources for the supported Cloud Run environment from repo-owned automation or docs, including Artifact Registry, runtime service account, and mounted store bucket.
- [x] **GCP-02**: Operator can execute the first live deployment of PaperParser to GCP Cloud Run from the repo-owned deployment path and obtain the deployed service URL and revision metadata.
- [ ] **GCP-03**: Live deployed PaperParser preserves the shipped `v1.4` runtime contract for same-origin serving, authenticated access, and mounted-store configuration.

### Delivery Pipeline

- [x] **PIPE-01**: Maintainer gets automated CI validation for the supported hosted-source path, covering at least typecheck, build, and the named deployment acceptance bundle before deployment.
- [x] **PIPE-02**: Maintainer gets automated CD that publishes an immutable image to Artifact Registry and hands off that exact digest-backed image identity for the supported Cloud Run deploy path.
- [ ] **PIPE-03**: Pipeline authentication to GCP uses Workload Identity Federation or an equivalently bounded non-key path by default rather than long-lived service-account key JSON.
- [ ] **PIPE-04**: Supported source-host or trigger wiring is documented and checked into the repo so CI/CD is reproducible instead of relying on hidden console-only setup.

### Release Proof And Operations

- [ ] **REL-05**: Maintainer gets a post-deploy live smoke workflow that verifies the deployed service URL, `/health`, `/ready`, and one real request path against the live environment, while `/healthz` and `/readyz` remain compatibility aliases.
- [ ] **REL-06**: Maintainer can roll back the deployed Cloud Run service through the supported automated or operator path using immutable revision or image references.
- [ ] **OPS-03**: Operator docs cover first-time bootstrap, auth/triggers, deploy, smoke, rollback, and failure recovery for the automated GCP path.

## Future Requirements

### Deployment Maturity

- **DEPLOY-03**: Operator gets staged multi-environment promotion, approvals, or canary rollout on the Cloud Run path.
- **DEPLOY-04**: Operator gets a supported custom domain, load balancer, or IAP front door without breaking the current access model.

### Product Scope

- **CORP-05**: User can search across the full local stored corpus from one entry point instead of querying one paper at a time.
- **COLLAB-01**: User can export a collaborator-facing review artifact with comments or annotations that do not change the canonical trust model.
- **INPUT-01**: User can ingest PDF or OCR-derived inputs on the same bundle contract as the current TeX and Markdown flows.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Corpus-wide search in `v1.5` | Live deployment and CI/CD are the current priority |
| Collaborator-facing review workflows in `v1.5` | Hosted delivery needs to be real before expanding product-surface scope |
| PDF or OCR ingestion in `v1.5` | Broader input support would dilute the deployment-execution milestone |
| Broad multi-cloud deployment support | The supported hosted path remains Google Cloud Run first |
| Mandatory Cloud Deploy / multi-environment promotion in `v1.5` | The first live deploy should stay narrower than a full staged-release platform |
| Service-account key JSON as the default CI/CD auth path | Secretless or equivalently bounded automation is the safer contract |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GCP-01 | Phase 23 | Complete |
| GCP-02 | Phase 23 | Complete |
| GCP-03 | Phase 25 | Pending |
| PIPE-01 | Phase 24 | Complete |
| PIPE-02 | Phase 24 | Complete |
| PIPE-03 | Phase 25 | Pending |
| PIPE-04 | Phase 25 | Pending |
| REL-05 | Phase 26 | Pending |
| REL-06 | Phase 26 | Pending |
| OPS-03 | Phase 26 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-06 after Phase 24 completion*
