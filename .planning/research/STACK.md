# Technology Stack

**Project:** PaperParser
**Researched:** 2026-04-02
**Confidence:** MEDIUM

## Recommended Stack

PaperParser should stay on its current brownfield foundation: Node 22, TypeScript 5.9, npm workspaces, the existing `manifest` / `graph` / `index` JSON contract, and the current React/Vite web package. The main stack change for the next milestone is not a platform rewrite. It is replacing the current regex-heavy TeX parsing path with a proper LaTeX AST layer inside `packages/core`, then keeping agent inference as a thin, optional second pass that writes back into the same validated JSON artifact.

The best current fit is the `@unified-latex/*` family as the deterministic parser layer, `ajv` plus the existing JSON Schemas as the canonical contract, `@xyflow/react` for the explorer graph page, and a direct provider SDK for enrichment rather than an agent framework. That keeps the repo aligned with its existing package boundaries and avoids adding a second source of truth.

### Core Technologies

| Technology | Version | Placement | Purpose | Why Recommended | Confidence |
|------------|---------|-----------|---------|-----------------|------------|
| Node.js + TypeScript | Node 22.x, TS 5.9.x | Existing monorepo baseline | Runtime, build, types | Already verified in the repo, already used across `packages/core`, `packages/cli`, `packages/web`, and `packages/mcp`; no reason to fork the stack for this milestone. | HIGH |
| `@unified-latex/unified-latex-util-parse` + `@unified-latex/unified-latex-util-visit` + `@unified-latex/unified-latex-util-environments` + `@unified-latex/unified-latex-util-match` + `@unified-latex/unified-latex-types` | `1.8.3`, `1.8.3`, `1.8.3`, `1.8.0`, `1.8.0` | `packages/core` | Deterministic TeX AST parsing, environment processing, traversal, matching, positions | Best match for a TypeScript monorepo that needs AST-level extraction of theorem-like environments, proofs, equations, labels, refs, and citations without leaving JS/TS. The package family explicitly supports parsing strings to ASTs, processing macros/environments, AST traversal, and node positions. | HIGH |
| `ajv` + existing JSON Schema files | Existing `8.17.1` | `packages/core`, `schema/` | Canonical artifact validation | PaperParser already has a machine-readable contract and runtime validation. Keep JSON Schema as the only canonical artifact definition; do not split truth across schema systems. | HIGH |
| React + Vite | Existing `19.1.1` / `6.4.1` | `packages/web` | Local HTML explorer shell | Already present and good enough. The milestone needs a better graph interaction layer, not a new frontend stack. | HIGH |
| `@xyflow/react` | `12.10.2` | `packages/web` | Interactive dependency graph canvas | Fits the existing React app and gives zoom, pan, controls, minimap, custom nodes, and typed graph primitives out of the box. This is a strong upgrade over the current hand-rolled static SVG for a heavy-paper dependency graph. | MEDIUM |
| `openai` | `6.33.0` | Optional adapter in `packages/core` or `packages/cli` | Optional second-pass semantic enrichment | The official JS SDK now centers on the Responses API, and Structured Outputs can enforce JSON Schema-shaped results. That matches PaperParser's requirement that enrichment stay optional and machine-readable. Keep this behind a provider interface so deterministic parsing remains first-class. | MEDIUM |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `latex-utensils` | `6.2.0` | Alternative LaTeX AST and BibTeX parser with location support | Use as a benchmark parser, fallback parser for difficult fixtures, or if BibTeX parsing becomes necessary in this milestone. Do not make it the main AST in the first pass. |
| `@modelcontextprotocol/server` / `@modelcontextprotocol/client` | Current official split packages | Future MCP modernization only | Use only if you later choose to modernize `packages/mcp`. This is not required to ship deterministic TeX parsing. |

## Recommended Package Fit

### `packages/core`

- Keep `flattenLatex` as the file/project resolver.
- Replace the current regex-first `latex-parser.ts` logic with an AST pipeline built on `@unified-latex/*`.
- Add explicit stages such as `AstLoader`, `EnvironmentRegistry`, `ObjectExtractor`, `ReferenceExtractor`, and `RelationBuilder`.
- Emit provenance at write time: deterministic edges should be separated from any later semantic proposals.
- Keep `ajv` validation as the final gate before writing the bundle.

### `packages/cli`

- Keep `analyze` as the deterministic parse command.
- Add enrichment as a separate command or explicit flag such as `enrich` / `--enrich`, never as the only parse path.
- Store enrichment output back into the same JSON artifact shape with provenance and confidence.

### `packages/web`

- Keep the existing React/Vite shell.
- Use `@xyflow/react` only for the dependency graph page; keep metadata/detail panels in the current React component style.
- Continue reading static exported JSON and API JSON exactly as today. The browser should not become the source of truth.

### `packages/mcp`

- No transport rewrite is needed for this milestone.
- Expose deterministic vs agent-inferred edges distinctly if the schema evolves.

## Installation

```bash
# Deterministic TeX parsing in packages/core
npm install --workspace @paperparser/core \
  @unified-latex/unified-latex-util-parse \
  @unified-latex/unified-latex-util-visit \
  @unified-latex/unified-latex-util-environments \
  @unified-latex/unified-latex-util-match \
  @unified-latex/unified-latex-types

# Interactive explorer graph page
npm install --workspace @paperparser/web @xyflow/react

# Optional semantic enrichment adapter
npm install --workspace @paperparser/core openai

# Optional benchmark / fallback parser during evaluation
npm install -D --workspace @paperparser/core latex-utensils
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Default | When Alternative Makes Sense |
|----------|-------------|-------------|-----------------|------------------------------|
| Deterministic TeX AST | `@unified-latex/*` | `latex-utensils` | `unified-latex` is the better fit for AST traversal and environment-aware transforms in a TypeScript pipeline; `latex-utensils` is more attractive as a comparison parser than as the primary long-term AST. | Use `latex-utensils` if a target paper exposes a parsing gap, or if BibTeX parsing becomes part of the acceptance criteria. |
| Explorer graph page | `@xyflow/react` | Current custom SVG page | Heavy-paper graphs need pan/zoom/selection affordances the current page does not provide well. React Flow adds those without replacing the whole web app. | Stay with the current SVG only if the accepted paper graph remains small and section-column layout remains readable. |
| Enrichment adapter | Direct provider SDK (`openai`) behind a PaperParser interface | LangChain / Vercel AI SDK / similar orchestration layer | This milestone needs one optional structured pass, not agent workflow composition. Direct SDKs are easier to debug, easier to validate, and align better with provenance requirements. | Add a higher-level abstraction only if multi-provider routing or complex tool orchestration becomes an explicit product need. |
| Canonical storage | Existing JSON bundle + in-memory graph | Kuzu / Neo4j as source of truth | For one-paper local-first parsing, a graph database adds operational cost and a second truth source without solving the core parsing problem. | Revisit database-backed indexing only after the product grows into multi-paper analytics or large corpus search. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Regex-first TeX parsing as the primary parser | The current parser shape is brittle for nested macros, custom theorem declarations, and source-linked extraction. It is the wrong substrate for deterministic dependency parsing. | A real AST pass using `@unified-latex/*`, with targeted extractors for theorem/proof/equation/citation structures. |
| `latex-utensils` as the main runtime parser from day one | It is useful, but adopting a second AST ecosystem as the primary path creates more migration cost than value in this repo. | `@unified-latex/*` as primary; `latex-utensils` as benchmark/fallback/BibTeX helper. |
| `kuzu` or another graph database as canonical milestone storage | The repo already has a JSON contract and does not currently use Kuzu in the active runtime path. Making the DB canonical would complicate storage, validation, and export. | Keep JSON canonical and build the in-memory graph from the stored bundle. |
| LangChain / LlamaIndex / crew-style agent frameworks | They add orchestration complexity, hidden prompts, and more debugging surface than this milestone needs. | A thin provider adapter that returns schema-shaped edge proposals plus evidence. |
| Zod as a second canonical schema system | PaperParser already uses JSON Schema and `ajv`. Duplicating the contract in Zod creates drift risk. | Keep JSON Schema authoritative; if an SDK helper needs Zod, confine it to the adapter layer or skip it. |
| Full TeX compiler stacks as the primary parse engine | Compile success is not the same as extracting theorem/proof dependency structure, and compiler toolchains add unnecessary operational load for local-first v1. | Source flattening plus AST parsing plus targeted semantic extraction. |
| MCP SDK migration in this milestone | The parser milestone does not need a transport rewrite, and the official TypeScript SDK is mid-transition toward v2 while v1.x remains the production recommendation. | Leave `packages/mcp` alone for now; if you modernize later, target the official split server/client packages. |

## Version Compatibility Notes

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@xyflow/react@12.10.2` | `react >=17` | Safe with the repo's current React 19.1.1 baseline. |
| `openai@6.33.0` | Node 22, optional `zod` and `ws` peers | Fine for a server-side optional enrichment pass; do not require it in the deterministic path. |
| `@unified-latex/*` `1.8.x` | Current TypeScript/Node toolchain | Pin exact package versions per package rather than relying on a loose umbrella version, because current package versions are mixed across the family. |

## Key Recommendation Summary

| Recommendation | Level | Why |
|---------------|-------|-----|
| Make `@unified-latex/*` the primary deterministic parser stack | HIGH | Best fit for AST-level extraction in an existing TypeScript monorepo. |
| Keep JSON Schema + `ajv` as the only canonical artifact contract | HIGH | Preserves one source of truth across CLI, web, export, and MCP surfaces. |
| Add `@xyflow/react` for the dependency graph page only | MEDIUM | Strong UI payoff with limited blast radius, but the current custom page can still cover a small MVP. |
| Keep semantic enrichment as an optional direct-SDK adapter | MEDIUM | Good fit for provenance and schema validation, but the exact model provider is a product choice, not a parsing necessity. |

## Sources

- [PaperParser project brief](../PROJECT.md)
- [Current codebase stack analysis](../codebase/STACK.md)
- [Current codebase architecture analysis](../codebase/ARCHITECTURE.md)
- [Unified LaTeX monorepo](https://github.com/siefkenj/unified-latex)
- [@unified-latex/unified-latex-util-parse on npm](https://www.npmjs.com/package/@unified-latex/unified-latex-util-parse)
- [@unified-latex/unified-latex-util-environments on npm](https://www.npmjs.com/package/@unified-latex/unified-latex-util-environments)
- [@unified-latex/unified-latex-util-visit on npm](https://www.npmjs.com/package/@unified-latex/unified-latex-util-visit)
- [latex-utensils](https://github.com/tamuratak/latex-utensils)
- [latex-utensils on npm](https://www.npmjs.com/package/latex-utensils)
- [AJV documentation](https://ajv.js.org/)
- [React Flow API reference](https://reactflow.dev/api-reference/react-flow)
- [@xyflow/react on npm](https://www.npmjs.com/package/@xyflow/react)
- [OpenAI JavaScript SDK](https://github.com/openai/openai-node)
- [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses&lang=javascript)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Model Context Protocol introduction](https://modelcontextprotocol.io/docs/getting-started/intro)

---
*Stack research for PaperParser deterministic TeX parsing milestone*
