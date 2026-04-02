# Phase 1: Gold-Paper TeX Ingestion Hardening - Research

**Researched:** 2026-04-02
**Domain:** Existing local LaTeX ingestion hardening in the TypeScript monorepo
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Gold Paper Contract
- Use `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex` as the representative heavy-paper entrypoint for Phase 1 and the milestone acceptance flow.
- Treat the real multi-file source tree as canonical for this phase; do not downgrade acceptance to the already-flattened `main.flat.tex`.
- Keep the user-facing acceptance harness anchored to the existing local analyze flow, so success means the repo can ingest the chosen TeX project through the current product surface rather than through an ad hoc helper script alone.
- Assume local fixture assets already present in `ref/papers/long_nalini/arXiv-2502.12268v2/` are part of the supported input for this phase.

### Hardening Strategy
- Start from the existing `createDocumentInput` -> `analyzeDocumentPath` -> `flattenLatex` -> `parseLatexDocument` path and patch the real failure modes revealed by `long_nalini` before reaching for architectural replacement.
- Prefer the smallest code change that makes the gold paper ingest reliably; only escalate to a deeper parser rewrite inside Phase 1 if the actual paper failures show the current regex-first path cannot satisfy the phase goal.
- Keep the current `manifest` / `graph` / `index` contract intact in this phase unless a gold-paper ingestion bug makes a narrowly scoped schema adjustment unavoidable.
- Keep Phase 1 scoped to ingestion reliability and diagnostics. Typed object richness, deterministic relation provenance, and explorer behavior belong to later phases unless a Phase 1 fix is a direct prerequisite.

### Diagnostics and Regression Gate
- Missing optional graphics or bibliography files may remain explicit warnings if the parse can still produce a usable artifact.
- Missing required TeX inputs, unreadable source files, or other issues that prevent trustworthy ingestion must surface as explicit actionable diagnostics, not silent degradation.
- Gold-paper ingestion behavior must be regression-tested at the core ingestion boundary, with failing tests written around discovered issues before fixes where practical.
- The output and diagnostics for repeated deterministic runs on the same gold paper should be stable enough to support the later canonical-artifact guarantees.

### Claude's Discretion
- The agent may introduce reduced regression fixtures derived from `long_nalini` if the full paper is too large for targeted edge-case tests, as long as the real paper remains the acceptance target.
- The agent may add narrowly scoped normalization or preprocessing helpers inside `packages/core/src/ingestion/` if they directly serve gold-paper ingestion and preserve the local-first CLI/API flow.

### Deferred Ideas (OUT OF SCOPE)
- Replacing the parser wholesale with an AST-first architecture is deferred unless gold-paper failures prove it necessary inside this phase.
- Canonical object identity, deterministic relation provenance, and stable rerun guarantees beyond ingestion are deferred to Phase 2.
- Local explorer behavior is deferred to Phase 3.
- Optional agent enrichment is deferred to Phase 4.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INGEST-01 | User can analyze a TeX paper or TeX project rooted at `main.tex` and produce a parsed artifact without requiring PDF input. | Keep the current `main.tex` -> flattener -> parser -> bundle flow, add a real-paper acceptance test on `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`, and prove it through the existing CLI analyze/validate commands. |
| INGEST-02 | User can parse one representative heavy TeX paper with the include, macro, and package handling required by that paper. | The real paper already flattens cleanly and produces a valid bundle; Phase 1 should patch the concrete trust gaps revealed by that run: title parsing, author parsing, bibliography handling, unsupported `\cref`, and diagnostics completeness. |
| INGEST-03 | User receives explicit parser diagnostics for unresolved references, citations, includes, or unsupported constructs instead of silent failure. | Add structured diagnostics for unresolved `\ref`/`\eqref`, unsupported `\cref` (and similar commands), bibliography/citation source issues, and persist/expose diagnostics after `analyze` so they survive the local store boundary. |
</phase_requirements>

## Summary

The gold paper already goes through the current built local pipeline without PDF input. Running `node packages/cli/dist/index.js analyze ref/papers/long_nalini/arXiv-2502.12268v2/main.tex --store /tmp/paperparser-phase1-research-store` succeeded, `validate --json` returned `ok`, and the produced graph had 294 nodes, 60 edges, and a real extracted main result (`Theorem 1.5`). That is strong evidence that Phase 1 should **not** start with parser replacement.

The real gaps are trust and diagnostics, not basic ingestability. On the same gold paper, the stored manifest title becomes `Untitled (auto-extracted)`, the first author is truncated to `Nalini Anantharaman\\textsuperscript{1`, the only surfaced warning is `missing_bibliography`, and diagnostics disappear completely once the CLI writes the bundle to disk. A scan of the flattened gold paper found 634 labels, 967 `\ref`/`\eqref` targets, 8 unresolved labels, and 6 uses of `\cref`; none of those currently become explicit diagnostics. The paper also ships `main.bbl` but no `bibliography.bib`, so the current bibliography warning is at least too blunt for this acceptance target.

**Primary recommendation:** Stay on the current regex/flattener stack for Phase 1, harden it with targeted metadata parsing and explicit diagnostics, and only escalate to an AST-first replacement if those focused fixes still fail on the real gold paper.

## Project Constraints (from CLAUDE.md)

- Stay within the existing TypeScript monorepo and reuse the current `manifest` / `graph` / `index` bundle contract unless a phase explicitly evolves that contract.
- Keep this milestone TeX-only.
- Keep deterministic parse output as the trusted baseline artifact; do not mix in semantic inference work here.
- Optimize for a single local mathematician, not collaborative or internet-facing workflows.
- Treat one representative heavy paper parsed well as sufficient Phase 1 success; do not broaden Phase 1 into generic corpus support.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PaperParser core ingestion (`flattenLatex` + `parseLatexDocument` + `buildBundleFromParsedDocument`) | `0.2.0-alpha.2` | Real `main.tex` ingestion, parsing, and bundle assembly | It already parses the gold paper; this is the lowest-risk place to harden behavior. |
| PaperParser CLI analyze/validate flow (`packages/cli/dist/index.js`) | `0.2.0-alpha.2` | Local-first acceptance harness | The phase contract explicitly anchors acceptance to the existing local analyze flow. |
| Vitest | `3.2.4` | Regression and acceptance tests | Already wired across `packages/*/test/**/*.test.ts` and fast enough for commit-time gates. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `SchemaValidator` + `ConsistencyChecker` | `0.2.0-alpha.2` | Verify that hardening changes preserve bundle validity | Every core and CLI acceptance test. |
| Store-side diagnostics sidecar (recommended `diagnostics.json`) | repo-local extension | Preserve diagnostics after `analyze` without changing the canonical bundle contract | When CLI/API/MCP/web need post-ingest diagnostics from stored results. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Targeted hardening on the current regex/flattener stack | AST-first LaTeX parser replacement | Not justified now: the gold paper already ingests end-to-end, and the observed failures are metadata/diagnostic gaps rather than structural parse collapse. |

**Installation:**
```bash
npm install
```

**Version verification:** No new package adoption is recommended in Phase 1. Verified locally in this repo: Node `v22.20.0`, npm `10.9.3`, root package `paperparser@0.2.0-alpha.2`, and Vitest `3.2.4`.

## Investigation Order

1. **Prove the real-paper baseline first.**
   Current evidence: the gold paper already analyzes and validates through the built CLI, so parser replacement is not the starting point.

2. **Fix front-matter trust gaps.**
   Current evidence: `\title[short]{long}` falls back to `Untitled (auto-extracted)`, and `\author{... \textsuperscript{1} ...}` truncates at the first nested brace.

3. **Add explicit resolution diagnostics.**
   Current evidence: the flattened gold paper contains 8 unresolved `\ref`/`\eqref` labels and 6 `\cref` calls, but the pipeline surfaces none of them.

4. **Persist diagnostics after `analyze`.**
   Current evidence: `PipelineResult.diagnostics` exists in memory, but the stored paper writes only `manifest.json`, `graph.json`, and `index.json`.

5. **Reclassify bibliography handling for the actual gold-paper layout.**
   Current evidence: `\bibliography{bibliography}` exists, `main.bbl` exists, `bibliography.bib` does not, and the current warning is `missing_bibliography`.

6. **Only then reconsider AST-first replacement.**
   Gate for escalation: a documented gold-paper failure that cannot be fixed by targeted hardening on the current path.

## Architecture Patterns

### Recommended Project Structure

```text
packages/core/src/ingestion/
├── flatten/latex-flattener.ts      # include/bibliography/graphics resolution and source-file tracking
├── parsers/latex-parser.ts         # metadata extraction, theorem parsing, unresolved-ref diagnostics
├── bundle-builder.ts               # preserve current bundle contract and in-memory diagnostics
packages/cli/src/
├── index.ts                        # analyze output / JSON summary for diagnostics exposure
└── store.ts                        # persist diagnostics next to manifest/graph/index
packages/core/test/
├── latex-flattener.test.ts         # reduced fixtures for isolated ingestion edge cases
├── ingestion-pipeline.test.ts      # public ingestion-boundary regressions
└── gold-paper-ingestion.test.ts    # recommended real-paper acceptance test
packages/cli/test/
└── analyze-command.test.ts         # CLI analyze + stored diagnostics regression
```

### Pattern 1: Gold-Paper-First Hardening
**What:** Reproduce failures on the real `main.tex` entrypoint first, then reduce only the smallest recurring cases into targeted fixtures.
**When to use:** Every Phase 1 code change.
**Example:**
```ts
const result = analyzeDocumentPath(GOLD_TEX_PATH);

expect(result.input.kind).toBe('latex');
expect(result.manifest.paper.title).toContain('Friedman--Ramanujan');
expect(result.graph.nodes.some((node) => node.kind === 'theorem')).toBe(true);
expect(result.diagnostics.warnings.find((warning) => warning.code === 'missing_input')).toBeUndefined();
```

### Pattern 2: Brace-Aware Metadata Extraction, Not Full Macro Expansion
**What:** Replace brittle one-shot `\title` / `\author` regexes with small brace-aware scanners that tolerate optional arguments and nested braces.
**When to use:** Front matter like `\title[short]{long}` and `\author{... \textsuperscript{1} ...}`.
**Example:**
```ts
const title = extractBalancedCommandArgument(rawText, 'title', { allowOptionalArg: true });
const authors = extractBalancedCommandArguments(rawText, 'author').map(normalizeLatexInlineText);
```

### Pattern 3: Persist Diagnostics as a Sidecar, Not a Schema Bump
**What:** Keep `manifest` / `graph` / `index` intact and persist structured diagnostics in a sibling file such as `diagnostics.json`.
**When to use:** Any stored-paper flow that needs explicit diagnostics after `analyze`.
**Example:**
```ts
writeFileSync(join(bundleDir, 'diagnostics.json'), JSON.stringify(bundle.diagnostics, null, 2) + '\n', 'utf8');
```

### Anti-Patterns to Avoid

- **Parser rewrite before evidence:** The gold paper already parses; replacement now is scope inflation.
- **Using `main.flat.tex` as acceptance:** It bypasses the very include/path behavior this phase is meant to harden.
- **Treating `validate=ok` as sufficient:** The current gold-paper bundle validates while still losing title, authors, and diagnostics.
- **CLI-only log warnings:** Diagnostics need a structured persisted form, not just console text.
- **Blanket TeX support work:** Phase 1 only needs the exact command and diagnostic handling required by the gold paper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gold-paper metadata repair | Full TeX macro interpreter | Small brace-aware scanners for the specific front-matter commands that fail now | The real failures are limited and concrete. |
| Diagnostics persistence | New canonical bundle schema version | `diagnostics.json` sidecar next to the existing bundle files | Preserves the current product contract and keeps the change narrow. |
| Acceptance harness | Ad hoc helper scripts over `main.flat.tex` | Existing CLI analyze/validate flow plus core/CLI tests on real `main.tex` | Matches the locked phase contract. |
| Parser rescue | AST-first rewrite now | Current flattener/parser stack plus gold-paper regression tests | The gold paper already produces 294 nodes and 60 edges; the problem is trust, not basic parsing. |
| Bibliography handling | Full BibTeX ingestion in Phase 1 | `.bib` / `.bbl` presence checks with explicit warning classification | Enough to make the gold paper trustworthy without expanding into citation extraction work. |

**Key insight:** Phase 1 is not blocked by inability to flatten or parse the gold paper. It is blocked by missing trust signals around metadata correctness and explicit diagnostics.

## Acceptance Commands

These are the concrete local commands that should prove Phase 1 is done:

```bash
node packages/cli/dist/index.js analyze ref/papers/long_nalini/arXiv-2502.12268v2/main.tex --store /tmp/paperparser-phase1-acceptance --paper long-nalini
node packages/cli/dist/index.js validate --store /tmp/paperparser-phase1-acceptance --paper long-nalini --json
npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/cli/test/analyze-command.test.ts
```

If diagnostics are persisted as a sidecar, the later validation doc should also inspect that stored diagnostics artifact and assert:

- no error-severity diagnostics for required inputs,
- no `missing_input` diagnostics,
- explicit diagnostics exist for any unresolved references or unsupported reference commands that remain.

## Common Pitfalls

### Pitfall 1: Silent Diagnostic Loss After Store Write
**What goes wrong:** `analyzeDocumentPath()` has warnings in memory, but the stored paper has no diagnostics artifact.
**Why it happens:** `writeBundleToStore()` serializes only `manifest.json`, `graph.json`, and `index.json`.
**How to avoid:** Persist diagnostics explicitly and add a CLI regression around stored output.
**Warning signs:** `result.diagnostics.warnings.length > 0` during tests, but nothing on disk after `paperparser analyze`.

### Pitfall 2: Regexes That Stop at the First Brace
**What goes wrong:** Title falls back to `Untitled (auto-extracted)` and authors truncate mid-macro.
**Why it happens:** The current title/author regexes do not tolerate optional arguments or nested braces.
**How to avoid:** Use brace-aware command extraction for front matter.
**Warning signs:** Stored manifest title is the display name fallback, or authors contain dangling macro fragments.

### Pitfall 3: Unsupported Reference Commands Quietly Disappear
**What goes wrong:** Real dependencies are neither resolved nor warned about.
**Why it happens:** Current resolution only scans `\ref` and `\eqref`; the gold paper uses `\cref` 6 times.
**How to avoid:** Either resolve `\cref` through the same label path or emit `unsupported_reference_command` diagnostics.
**Warning signs:** Flattened source contains `\cref`, but diagnostics and edges do not mention it.

### Pitfall 4: `.bbl`-Backed Projects Look Like Missing Bibliographies
**What goes wrong:** The gold paper always warns `missing_bibliography` even though it ships `main.bbl`.
**Why it happens:** The flattener only checks for `.bib` files.
**How to avoid:** Treat `.bbl` presence as satisfying the local bibliography input for Phase 1, or downgrade the warning severity/message.
**Warning signs:** `main.bbl` exists, `bibliography.bib` does not, and the only bibliography message is "missing".

### Pitfall 5: Passing Tests Without the Real Paper
**What goes wrong:** Reduced fixtures go green while the acceptance paper still regresses.
**Why it happens:** Small fixtures do not exercise the same front matter, include depth, or reference mix as `long_nalini`.
**How to avoid:** Keep one full-paper acceptance test and use reduced fixtures only for isolated edge cases.
**Warning signs:** All fixture tests pass, but the real `main.tex` analyze command changes behavior.

## Code Examples

Verified patterns from the current repo plus the recommended Phase 1 extensions:

### Gold-Paper Core Regression
```ts
const result = analyzeDocumentPath(GOLD_TEX_PATH);

expect(result.manifest.paper.title).toContain('Friedman--Ramanujan');
expect(result.manifest.paper.authors[0]).toContain('Nalini Anantharaman');
expect(result.graph.nodes.some((node) => node.kind === 'theorem')).toBe(true);
expect(result.diagnostics.warnings.map((warning) => warning.code)).not.toContain('missing_input');
```

### CLI Analyze Regression With Persisted Diagnostics
```ts
const exitCode = runCli(
  ['analyze', GOLD_TEX_PATH, '--store', storePath, '--paper', 'long-nalini'],
  { stdout: () => {}, stderr: () => {} },
);

expect(exitCode).toBe(0);
expect(readFileSync(join(storePath, 'long-nalini', 'diagnostics.json'), 'utf8')).toContain('"warnings"');
```

### Unresolved Reference Diagnostics
```ts
const warningCodes = result.diagnostics.warnings.map((warning) => warning.code);

expect(warningCodes).toContain('unresolved_reference');
expect(warningCodes).toContain('unsupported_reference_command');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Small synthetic LaTeX fixture proves the parser works "in principle" | Real multi-file gold-paper acceptance on `main.tex` | Current milestone / Phase 1 | Exposes the failures that matter to actual users. |
| In-memory diagnostics only | Persisted, surface-visible diagnostics (recommended for Phase 1) | Phase 1 target | Makes explicit warnings survive the CLI/API/MCP/web storage boundary. |
| Rigid front-matter regexes | Brace-aware command extraction for `\title` / `\author` | Phase 1 target | Fixes the gold paper without general parser replacement. |

**Deprecated/outdated:**
- Treating `main.flat.tex` as a sufficient acceptance input for Phase 1.
- Jumping to AST-first parser replacement before targeted hardening fails on the real paper.

## Open Questions

1. **Should `.bbl` suppress `missing_bibliography`, or should it only downgrade the warning?**
   - What we know: the gold paper has `\bibliography{bibliography}` and `main.bbl`, but no `bibliography.bib`.
   - What's unclear: whether Phase 1 should treat that as "resolved enough" or still warn that source bibliography data is missing.
   - Recommendation: Do not parse `.bbl` deeply in Phase 1. First classify `.bbl` presence as acceptable local support for this paper, with a clearer message if a warning remains.

2. **Should diagnostics live in a sidecar or in the canonical schema?**
   - What we know: the current schema and serializer omit diagnostics entirely, and the local store drops them.
   - What's unclear: whether later phases need diagnostics to travel with the canonical bundle itself.
   - Recommendation: Use a sidecar in Phase 1. Revisit schema inclusion only if later phases require diagnostics to be queryable as first-class bundle data.

3. **Should `sourceFiles` list only `main.tex`, or every visited included file?**
   - What we know: the real paper is multi-file, but the current stored manifest shows only `["main.tex"]`.
   - What's unclear: whether later phases depend on complete source-file enumeration.
   - Recommendation: If the flattener is touched anyway, return the visited file list and thread it into `manifest.paper.sourceFiles`; it improves trust at low cost and does not require a schema change.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | CLI analyze/validate, tests, local scripts | ✓ | `v22.20.0` | — |
| npm | Workspace test/typecheck commands | ✓ | `10.9.3` | — |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `3.2.4` |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts` |
| Full suite command | `npm test && npm run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INGEST-01 | Analyze the real multi-file gold paper from `main.tex` through the existing local path and produce a valid bundle without PDF | integration + CLI | `npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/cli/test/analyze-command.test.ts` | ❌ Wave 0 |
| INGEST-02 | Handle the gold paper's include graph, theorem macros from `def1.tex`, and front-matter command forms required by the paper | integration + reduced fixture regressions | `npx vitest run packages/core/test/gold-paper-ingestion.test.ts packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts` | ❌ Wave 0 |
| INGEST-03 | Emit explicit diagnostics for unresolved refs/cites/includes/unsupported ref commands and preserve them after `analyze` | integration + CLI persistence | `npx vitest run packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test && npm run typecheck`, plus the real local CLI acceptance commands in `## Acceptance Commands`

### Wave 0 Gaps

- [ ] `packages/core/test/gold-paper-ingestion.test.ts` — full-paper acceptance on `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
- [ ] Reduced front-matter fixture — reproduces `\title[short]{long}` and nested-brace `\author{...}` parsing failures
- [ ] Reduced unresolved-reference fixture — reproduces unresolved `\ref` plus unsupported `\cref` diagnostics
- [ ] CLI stored-diagnostics regression — extends `packages/cli/test/analyze-command.test.ts` (or a sibling test) to assert persisted diagnostics visibility

## Sources

### Primary (HIGH confidence)
- Local repo inspection:
  - `packages/core/src/ingestion/pipeline.ts`
  - `packages/core/src/ingestion/flatten/latex-flattener.ts`
  - `packages/core/src/ingestion/parsers/latex-parser.ts`
  - `packages/core/src/ingestion/bundle-builder.ts`
  - `packages/core/src/types/pipeline.ts`
  - `packages/core/src/serialization/bundle-serializer.ts`
  - `packages/cli/src/index.ts`
  - `packages/cli/src/store.ts`
  - `schema/manifest.schema.json`
  - `packages/core/test/latex-flattener.test.ts`
  - `packages/core/test/ingestion-pipeline.test.ts`
  - `packages/cli/test/analyze-command.test.ts`
- Gold-paper assets:
  - `ref/papers/long_nalini/arXiv-2502.12268v2/main.tex`
  - `ref/papers/long_nalini/arXiv-2502.12268v2/def1.tex`
  - `ref/papers/long_nalini/arXiv-2502.12268v2/main.flat.tex`
- Executed commands on 2026-04-02:
  - `node packages/cli/dist/index.js analyze ref/papers/long_nalini/arXiv-2502.12268v2/main.tex --store /tmp/paperparser-phase1-research-store`
  - `node packages/cli/dist/index.js validate --store /tmp/paperparser-phase1-research-store --paper main --json`
  - `npm test`
  - `npx vitest run packages/core/test/latex-flattener.test.ts packages/core/test/ingestion-pipeline.test.ts packages/cli/test/analyze-command.test.ts`
  - `node --version`
  - `npm --version`

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - based on direct inspection of the current repo and successful gold-paper execution through the built CLI.
- Architecture: HIGH - based on the current call path and the observed failure locations.
- Pitfalls: HIGH - based on concrete gold-paper evidence, stored output inspection, and executed regression commands.

**Research date:** 2026-04-02
**Valid until:** 2026-05-02
