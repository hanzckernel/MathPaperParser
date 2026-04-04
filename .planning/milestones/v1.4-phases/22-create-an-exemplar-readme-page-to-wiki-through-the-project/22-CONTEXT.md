# Phase 22: Create an exemplar README page to wiki through the project - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Publish one wiki-style project entry page that helps a reader understand how the repo is organized and where to go next depending on whether they are evaluating the product, developing locally, or operating the Cloud Run deployment path. This phase is about documentation routing and onboarding clarity, not feature work.

</domain>

<decisions>
## Implementation Decisions

### Documentation Shape
- **D-01:** The deliverable should be a dedicated docs hub page, not another overloaded root `README`.
- **D-02:** The root `README` should link into that hub page as the “start here” route.

### Scope
- **D-03:** The page should route readers to existing docs instead of duplicating whole guides.
- **D-04:** The page should explain the repo by workflow and persona: product overview, local developer path, deployment/operator path, and codebase map.

### Milestone Fit
- **D-05:** This phase adds an explicit docs/onboarding requirement to `v1.4` so the milestone remains auditable after the new phase insertion.

### the agent's Discretion
- The final doc filename, section order, and tone as long as it is concise and wiki-like.
- Whether to add a small docs contract test to keep the new hub linked from the root `README`.

</decisions>

<specifics>
## Specific Ideas

- A file such as `docs/project_wiki.md` can act as the entry hub.
- The page should link out to `README.md`, `docs/user_guide.md`, `docs/architecture.md`, `docs/deployment_readiness.md`, `deploy/cloudrun/RUNBOOK.md`, and the core package directories.
- A lightweight doc test can prove the README points to the new hub and that the hub references the main docs.

</specifics>

<canonical_refs>
## Canonical References

- `README.md`
- `docs/user_guide.md`
- `docs/architecture.md`
- `docs/deployment_readiness.md`
- `deploy/cloudrun/RUNBOOK.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `packages/web/test/operator-guidance-docs.test.ts`

</canonical_refs>

---

*Phase: 22-create-an-exemplar-readme-page-to-wiki-through-the-project*
*Context gathered: 2026-04-04*
