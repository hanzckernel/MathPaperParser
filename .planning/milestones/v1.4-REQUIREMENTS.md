# Requirements: PaperParser

**Defined:** 2026-04-04
**Core Value:** A mathematician can feed in a TeX paper and get a trustworthy dependency artifact that makes the logical structure of the paper easier to navigate.

## v1 Requirements

### Deployment Packaging

- [x] **DEPLOY-01**: User can deploy PaperParser to Google Cloud Run from a supported repo-defined artifact with explicit runtime configuration rather than ad hoc local steps.
- [x] **DEPLOY-02**: User gets a supported combined web/API deployment shape on GCP so the dashboard and API work together without undocumented split-origin behavior.

### Topology and Access

- [x] **ACCESS-01**: User gets an explicit and enforced Cloud Run access model whose ingress and endpoint behavior match the documented operator path for shared deployment.

### Security Hardening

- [x] **AUTH-01**: Shared deployed PaperParser requires authenticated or otherwise explicitly bounded access to data-reading and mutating endpoints instead of anonymous open access by default.
- [x] **AUTH-02**: Shared deployed PaperParser prevents accidental exposure of the raw service path outside the documented ingress and access model.

### API Safety

- [x] **SEC-01**: Deployed PaperParser no longer accepts arbitrary remote filesystem `inputPath` analysis from untrusted clients.
- [x] **SEC-02**: Deployed PaperParser enforces explicit request and upload limits with bounded failure behavior instead of unbounded in-memory buffering.

### Persistence and Operability

- [x] **OPS-01**: User gets `/healthz` and `/readyz` endpoints plus structured logs sufficient to distinguish deployment, readiness, and request failures on Cloud Run.
- [x] **STORE-01**: User gets a supported GCP persistence strategy for the current paper store that is compatible with the shipped bundle contract and documented for operators.
- [x] **OPS-02**: User can deploy, configure, upgrade, and roll back the Cloud Run service from repo docs without hidden local-machine knowledge.

### Reliability & Acceptance

- [x] **REL-03**: Milestone verification covers container packaging, Cloud Run runtime configuration, same-origin web/API behavior, and the bounded deployed ingestion path.
- [x] **REL-04**: Repo acceptance includes a named proof or smoke workflow for the supported Cloud Run deployment path.

### Documentation

- [x] **DOCS-01**: User gets a wiki-style project entry page that explains the main repo surfaces and routes them to the right product, developer, and operator documentation.

## Future Requirements

### Corpus

- **CORP-05**: User can search across the full local stored corpus from one entry point instead of querying one paper at a time.
- **CORP-06**: User sees which paper each corpus-search result comes from before navigating, including paper identity and result-local math metadata.
- **CORP-07**: User can jump directly from a corpus-search result into the existing paper-aware explorer/detail flow.
- **CORP-08**: Corpus-wide search preserves explicit paper boundaries and explainable result attribution rather than acting like an opaque merged graph.

### Collaboration

- **COLLAB-01**: User can export a collaborator-facing review artifact with comments or annotations that do not change the canonical trust model.

### Inputs

- **INPUT-01**: User can ingest PDF or OCR-derived inputs on the same bundle contract as the current TeX and Markdown flows.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Generic multi-cloud deployment in `v1.4` | The milestone is intentionally standardizing on Cloud Run first |
| Corpus-wide search in `v1.4` | Deployment hardening is the current priority after `v1.3` |
| Collaborator-facing review workflows in `v1.4` | The milestone is about supported deployment, not review UX |
| PDF or OCR ingestion in `v1.4` | Broadening inputs would dilute the deployment-hardening scope |
| Full persistence-model redesign beyond the first supported Cloud Run store strategy | The first milestone needs a bounded supported path, not a total data-plane rewrite |
| Broad anonymous-public internet deployment claims without an explicit access model | Shared deployment must be explicit about ingress and access rather than hand-wavy “public by default” behavior |

## Traceability

| Requirement | Planned Phase | Status |
|-------------|---------------|--------|
| DEPLOY-01 | Phase 18 | Complete |
| DEPLOY-02 | Phase 18 | Complete |
| ACCESS-01 | Phase 19 | Complete |
| AUTH-01 | Phase 19 | Complete |
| AUTH-02 | Phase 19 | Complete |
| SEC-01 | Phase 17 | Complete |
| SEC-02 | Phase 17 | Complete |
| OPS-01 | Phase 17 | Complete |
| STORE-01 | Phase 20 | Complete |
| OPS-02 | Phase 20 | Complete |
| REL-03 | Phase 21 | Complete |
| REL-04 | Phase 21 | Complete |
| DOCS-01 | Phase 22 | Complete |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after completing phase 22*
