# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**Runner:**
- Vitest `^3.2.4`
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in `expect`

**Run Commands:**
```bash
npm test                # Root test command from `package.json`
npm run build           # Repo verification command documented in `README.md`
npm run typecheck       # Repo verification command documented in `README.md`
```

Additional command state:
- No dedicated watch-mode script is defined in `package.json`.
- No coverage script or coverage config is defined in `package.json` or `vitest.config.ts`.

## Test File Organization

**Location:**
- Tests are package-scoped but kept in separate `test/` directories rather than co-located with source:
  - `packages/core/test`
  - `packages/cli/test`
  - `packages/mcp/test`
  - `packages/web/test`
- `vitest.config.ts` includes only `packages/*/test/**/*.test.ts`.

**Naming:**
- Active tests use the `*.test.ts` suffix. Examples:
  - `packages/core/test/ingestion-pipeline.test.ts`
  - `packages/cli/test/serve-app.test.ts`
  - `packages/web/test/api-client.test.ts`
- No active `*.spec.ts` files were detected.

**Structure:**
```text
packages/
  core/
    src/
    test/
      fixtures/
      *.test.ts
  cli/
    src/
    test/
      *.test.ts
  mcp/
    src/
    test/
      *.test.ts
  web/
    src/
    test/
      *.test.ts
schema/
  examples/
```

## Test Structure

**Suite Organization:**
```typescript
describe('BundleQueryService', () => {
  it('returns deterministic keyword hits for theorem-like nodes', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
    const bundle = analyzeDocumentPath(fixturePath);
    const service = new BundleQueryService(bundle);

    const results = service.search({ text: 'compact main result', limit: 2 });

    expect(results[0]?.nodeId).toBe('sec1::thm:thm-main');
  });
});
```

**Patterns:**
- Setup is usually inline inside each test rather than centralized in shared hooks.
- Temporary directories are created with `mkdtempSync()` and OS temp paths in integration-style tests:
  - `packages/cli/test/analyze-command.test.ts`
  - `packages/cli/test/export-command.test.ts`
  - `packages/core/test/kuzu-store.test.ts`
  - `packages/mcp/test/server.test.ts`
- `afterEach()` cleanup is used only when the test creates persistent state that needs removal, for example `packages/core/test/kuzu-store.test.ts`.
- Assertions target public contract surfaces:
  - parsed bundle structure in `packages/core/test/markdown-parser.test.ts`
  - serialized JSON shape in `packages/core/test/validation.test.ts`
  - CLI stdout, stderr, and exit codes in `packages/cli/test/*.test.ts`
  - HTTP status and JSON payloads in `packages/cli/test/serve-app.test.ts`
  - rendered HTML strings in `packages/web/test/data-controls-render.test.ts`

## Mocking

**Framework:** Vitest `vi`

**Patterns:**
```typescript
const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
fetchMock.mockResolvedValueOnce(
  new Response(JSON.stringify({ latestPaperId: 'fixture-markdown', papers: [] }), { status: 200 }),
);

const listing = await listApiPapers('http://localhost:3000', fetchMock as typeof fetch);

expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/papers');
```

**What to Mock:**
- Mock `fetch` for browser-facing helpers in `packages/web/src/lib/api-client.ts` and `packages/web/src/lib/data-source.ts`.
- Inject fake IO callbacks for CLI tests instead of patching globals, as in `packages/cli/test/analyze-command.test.ts` and `packages/cli/test/read-commands.test.ts`.

**What NOT to Mock:**
- Core parsing, validation, serialization, and graph logic are exercised against real fixtures and real JSON examples.
- CLI and MCP tests prefer real temp directories and real stored bundles over filesystem mocks.
- No `vi.mock()` module replacement pattern was detected in active tests.

## Fixtures and Factories

**Test Data:**
```typescript
const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/markdown/paper.md');
const bundle = analyzeDocumentPath(fixturePath);
```

**Location:**
- Source-document fixtures live under `packages/core/test/fixtures`:
  - `packages/core/test/fixtures/markdown/paper.md`
  - `packages/core/test/fixtures/latex/project/main.tex`
- Schema contract examples live under `schema/examples` and are used by:
  - `packages/core/test/validation.test.ts`
  - `packages/core/test/alpha-contract.test.ts`
  - `packages/core/test/kuzu-store.test.ts`

**Factories and Helpers:**
- There is no shared factory library.
- Tests use small local helpers such as:
  - `loadExampleBundle()` in `packages/core/test/validation.test.ts`
  - `analyzeFixture()` in `packages/cli/test/read-commands.test.ts`
  - `writeBundle()` in `packages/mcp/test/server.test.ts`

## Coverage

**Requirements:** None enforced

Evidence:
- `package.json` exposes only `build`, `test`, `typecheck`, and `lint`.
- `vitest.config.ts` sets `include` and `environment`, but does not configure reporters or thresholds.
- No `coverage`, `c8`, `nyc`, or Istanbul config was detected outside dependency lock data.

**View Coverage:**
```bash
# Not configured in the repository today.
```

## Test Types

**Unit Tests:**
- Core contract and parser behavior:
  - `packages/core/test/contracts.test.ts`
  - `packages/core/test/markdown-parser.test.ts`
  - `packages/core/test/validation.test.ts`
  - `packages/core/test/bundle-serializer.test.ts`
- Web helper logic:
  - `packages/web/test/api-client.test.ts`
  - `packages/web/test/bundle-data.test.ts`

**Integration Tests:**
- Ingestion pipeline over tracked fixtures: `packages/core/test/ingestion-pipeline.test.ts`
- Kuzu persistence against a real temp database dir: `packages/core/test/kuzu-store.test.ts`
- CLI command flows over real temp stores: `packages/cli/test/analyze-command.test.ts`, `packages/cli/test/read-commands.test.ts`, `packages/cli/test/export-command.test.ts`
- HTTP request handling over real `Request`, `Response`, `FormData`, and stored bundles: `packages/cli/test/serve-app.test.ts`
- MCP server behavior over real stored bundles: `packages/mcp/test/server.test.ts`

**E2E Tests:**
- Not used
- No Playwright, Cypress, or browser automation config was detected.

## Common Patterns

**Async Testing:**
```typescript
const response = await handlePaperParserRequest(
  new Request('http://paperparser.local/api/papers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      inputPath: 'packages/core/test/fixtures/latex/project/main.tex',
      paperId: 'fixture-latex',
    }),
  }),
  { storePath },
);

expect(response.status).toBe(201);
```

**Error Testing:**
```typescript
expect(() => validator.validateSerializedBundle(serialized)).toThrowError(/does not validate/i);
expect(() => ConsistencyChecker.checkSerializedBundle(serialized)).toThrowError(/unknown node ids/i);
```

**Parameterized Testing:**
- `it.each()` is used for repeated format coverage in:
  - `packages/cli/test/export-command.test.ts`
  - `packages/web/test/proof-graph-render.test.ts`

**Render Testing:**
- React components are rendered with `renderToStaticMarkup()` from `react-dom/server`, not with DOM-testing utilities:
  - `packages/web/test/data-controls-render.test.ts`
  - `packages/web/test/proof-graph-render.test.ts`
- Assertions inspect HTML substrings and visible labels instead of DOM queries.

## Coverage Posture by Package

**`packages/core`:**
- Strongest coverage in the repo.
- Exercises parsing, schema validation, bundle serialization, graph behavior, query service, pipeline assembly, and Kuzu persistence.

**`packages/cli`:**
- Covers main happy-path commands (`analyze`, `status`, `list`, `validate`, `query`, `context`, `impact`, `export`) and HTTP handler flows in `packages/cli/test/*.test.ts`.

**`packages/mcp`:**
- Covers tool listing, resource listing, tool execution, and resource reads in `packages/mcp/test/server.test.ts`.

**`packages/web`:**
- Covers fetch helpers, bundle-to-model conversion, and server-rendered output for selected components in `packages/web/test/*.test.ts`.
- Coverage is narrower than `packages/core`; most tests stop at helper/component contract level.

## Likely Test Gaps

**Direct `App` behavior:**
- No direct tests were found for `packages/web/src/App.tsx`.
- Missing coverage likely includes route parsing, `window.location.hash` updates, upload status transitions, and multi-effect coordination between API listing, bundle loading, and UI state.

**Negative-path CLI coverage:**
- Happy-path CLI commands are well covered, but no explicit tests were found for invalid arguments or process startup failures in `packages/cli/src/index.ts`, such as:
  - invalid `serve` port handling
  - missing subcommand arguments beyond usage fallthrough
  - `mcp` stdio startup behavior

**Negative-path server and MCP coverage:**
- No explicit tests were found for malformed request bodies, unsupported content types, or unsupported MCP methods and resource URIs in:
  - `packages/cli/src/server.ts`
  - `packages/mcp/src/server.ts`

**PDF and unsupported-input behavior:**
- The type contract includes `'pdf'` in `packages/core/test/contracts.test.ts`, but no explicit test was found for the runtime rejection path in `packages/core/src/ingestion/pipeline.ts`.

**Browser-level interaction testing:**
- No DOM-event or browser-environment tests were found for `packages/web`.
- Render tests use static markup and do not exercise clicks, file input changes, or `useEffect` timing against a browser-like environment.

**CI and coverage enforcement:**
- `docs/deployment_readiness.md` states the repo does not currently ship `.github/workflows/` CI for the v2 monorepo.
- There is also no coverage threshold enforcement, so regressions depend on local command discipline plus the breadth of existing tests.

---

*Testing analysis: 2026-04-02*
