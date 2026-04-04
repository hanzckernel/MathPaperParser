# Phase 22 Research: Project Wiki Entry Page

**Date:** 2026-04-04
**Status:** Complete

## Goal

Add one wiki-style entry page that sits above the current README and docs set and routes readers by intent instead of by raw file list.

## Current Documentation Shape

- `README.md`
  - strong quickstart and current status
  - already large and release-oriented
- `docs/user_guide.md`
  - detailed workflow/how-to guide
- `docs/architecture.md`
  - codebase and migration structure
- `docs/deployment_readiness.md`
  - deployment status and blockers
- `deploy/cloudrun/RUNBOOK.md`
  - operator steps for Cloud Run

## Gap

The repo has good leaf docs, but there is no single “start here” page that answers:

- what PaperParser is
- which workflow a reader should follow
- where the major packages live
- which doc to open next for development versus operations

## Recommended Shape

### 1. Add a dedicated wiki-style hub page

Recommended file:
- `docs/project_wiki.md`

Recommended sections:
- what the product is
- choose your path
- repo/package map
- common workflows
- current deployment status
- doc index

### 2. Keep README concise and route into the hub

Recommended behavior:
- add one visible link from `README.md`
- do not rewrite the whole root README into a wiki

### 3. Add a lightweight docs contract test

Recommended proof:
- README links to the wiki page
- wiki page links to user guide, architecture, deployment readiness, and Cloud Run runbook

## Suggested File Set

- `docs/project_wiki.md`
- `README.md`
- `packages/web/test/project-wiki-docs.test.ts`

## Verification Direction

- targeted docs test
- repo typecheck

---

*Phase: 22-create-an-exemplar-readme-page-to-wiki-through-the-project*
*Research completed: 2026-04-04*
