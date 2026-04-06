# Phase 25: Secretless CD & Source Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `25-CONTEXT.md` — this log preserves the alternatives considered.

**Gathered:** 2026-04-06
**Status:** Complete

## Discussion Summary

The phase discussion focused on the three choices that most change how hosted automation becomes real:
- which hosted source becomes the source of truth for trigger wiring
- whether deploy auth should come from external-runner federation or GCP-native bounded execution
- whether mainline updates should auto-deploy or stop at a pre-deploy checkpoint

The user chose GitHub as the hosted source, a dedicated bounded Cloud Build service account with no key JSON, and automatic deploys from mainline updates. That combination makes Phase 25 about connecting GitHub into the Cloud Build-based pipeline chosen in Phase 24, not about replacing the pipeline host or adding manual approval machinery.

## Questions and Selections

### 1. Source host
**Question:** Which hosted source should become the source of truth for pipeline triggers?

**Options presented:**
- `1A` GitHub becomes the hosted source of truth, and Cloud Build triggers from it.
- `1B` A non-GitHub hosted git source is connected to Cloud Build instead.
- `1C` Keep source host unspecified and only document manual trigger setup.

**Selected:** `1A`

**Captured decision:** GitHub becomes the supported hosted source of truth for this phase, with Cloud Build triggered from the GitHub repository.

### 2. Secretless auth shape
**Question:** Should deploy execution run through external-runner federation or through GCP-native bounded execution?

**Options presented:**
- `2A` GCP-native trigger/build execution uses a dedicated bounded Cloud Build service account, with no external key JSON.
- `2B` An external hosted workflow runner authenticates to GCP through WIF.
- `2C` Allow service-account key JSON as a fallback path.

**Selected:** `2A`

**Captured decision:** Use GCP-native build/deploy execution under a dedicated bounded Cloud Build service account, with no long-lived key JSON.

### 3. Deploy trigger policy
**Question:** When should automated deployment happen?

**Options presented:**
- `3A` Mainline source updates publish and then deploy automatically to the long-lived Cloud Run service.
- `3B` Mainline source updates publish automatically, but deploy is a separate approval/manual step.
- `3C` Only version tags trigger deploys.

**Selected:** `3A`

**Captured decision:** Mainline source updates should publish and then deploy automatically to the one long-lived Cloud Run service.

## Alternatives Not Chosen

- Non-GitHub source-host integration.
- Keeping source-host wiring unspecified.
- External runner federation as the primary deploy execution model.
- Any service-account key JSON path.
- Approval-gated or tag-only deploy triggering.

## Deferred Ideas

- GitHub Actions as a separate deployment engine.
- External-runner WIF patterns.
- Manual approval gates or staged multi-environment promotion.

---

*Phase: 25-secretless-cd-source-integration*
*Discussion logged: 2026-04-06*
