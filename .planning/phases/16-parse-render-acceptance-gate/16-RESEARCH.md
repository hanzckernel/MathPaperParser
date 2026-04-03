# Phase 16: Parse/Render Acceptance Gate - Research

**Generated:** 2026-04-03
**Status:** Ready for planning

## Research Question

What is the smallest reproducible acceptance proof that demonstrates the upgraded parser and render workflow on the accepted corpus plus targeted hard-case regressions, without reopening export/runtime scope that already shipped in `v1.2`?

## Current Baseline

The repo already has most of the needed evidence, but it is still scattered:

- `packages/core/test/ingestion-pipeline.test.ts` proves the targeted parser gap classes from Phase 14.
- `packages/core/test/gold-paper-ingestion.test.ts` proves accepted-corpus parser behavior and validation.
- `packages/cli/test/gold-paper-acceptance.test.ts` proves the local CLI workflow on `long_nalini` and the accepted multi-paper corpus.
- `packages/web/test/math-render.test.ts` proves the new render hardening regressions from Phase 15.
- `packages/web/test/proof-graph-render.test.ts` proves the current statement-reading surfaces still use the shared MathJax boundary.
- `package.json` still only publishes `test:acceptance:v1.2`, which is focused on export/runtime/dashboard hardening rather than the new parse/render milestone.

## Findings

### 1. The Phase 16 proof should be a named command, not a new bespoke harness

Phase 13 already established the repo-level acceptance-command pattern. For `v1.3`, the highest-value change is to bundle the existing parser/render proof set behind a new named script rather than inventing a second custom CLI harness.

### 2. The acceptance command needs both real-corpus and hard-case coverage

`ACC-04` and `ACC-05` require two proof layers:

- real-corpus workflow proof
- targeted regression fixtures for the newly hardened parser/render seams

The smallest coherent bundle is:

- `packages/core/test/ingestion-pipeline.test.ts`
- `packages/core/test/gold-paper-ingestion.test.ts`
- `packages/cli/test/gold-paper-acceptance.test.ts`
- `packages/web/test/math-render.test.ts`
- `packages/web/test/proof-graph-render.test.ts`

That combination covers:

- parser hardening fixtures
- accepted-corpus parse validation
- local `analyze -> validate -> inspect` workflow evidence
- render hardening fixtures
- statement-surface wiring

### 3. The current docs-contract test is the right place to keep the command discoverable

`packages/web/test/operator-guidance-docs.test.ts` already exists to prevent drift between root scripts and operator-facing docs. Phase 16 can extend that test to require the `v1.3` proof command in the README and user guide without creating another docs-only test file.

### 4. `v1.2` proof remains valid but should not be treated as the current milestone gate

The existing `v1.2` command still proves export/runtime/dashboard hardening. Phase 16 should add, not replace:

- keep `test:acceptance:v1.2` as the archived milestone proof
- publish `test:acceptance:v1.3` as the current parse/render proof

## Framework Discovery Outcome

1. Existing code and tests are sufficient.
2. No new library or runner is required.
3. The phase is primarily packaging existing evidence into a named proof command plus minimal docs alignment.

Decision: publish a focused `test:acceptance:v1.3` script, update the operator-facing docs to mention it, regression-check that contract, and rerun the named proof plus typecheck.

## Recommended Phase 16 Slice

1. Add a red docs-contract regression that requires `test:acceptance:v1.3` in `package.json`, `README.md`, and `docs/user_guide.md`.
2. Add the new root script and update the top-level/operator docs so users can find the current milestone proof cleanly.
3. Re-run the new acceptance command and workspace typecheck as the final milestone evidence.

## Risks

- If the acceptance command is too broad, it will become slow and harder to rerun; if too narrow, it will miss one of the milestone truths.
- Updating the docs incorrectly could make `v1.2` and `v1.3` proofs sound mutually exclusive instead of milestone-specific.
- The acceptance bundle should stay parse/render-focused and avoid accidentally reabsorbing the broader `v1.2` export/runtime surface.

## Suggested Acceptance Criteria

- The repo publishes `npm run test:acceptance:v1.3`.
- README and user guide point to the new parse/render proof command.
- The command covers both accepted-corpus workflow evidence and targeted parser/render regressions.
- `npm run test:acceptance:v1.3` and `npm run typecheck` pass from the repo root.

## Likely File Touch Points

- `package.json`
- `README.md`
- `docs/user_guide.md`
- `packages/web/test/operator-guidance-docs.test.ts`
