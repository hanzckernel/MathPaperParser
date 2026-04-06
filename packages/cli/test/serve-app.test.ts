import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';
import { createPaperParserRequestHandler, handlePaperParserRequest } from '../src/server.js';

describe('paperparser serve app', () => {
  it('serves a configured dashboard shell and injects deployed runtime config', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));
    const webDistPath = mkdtempSync(join(tmpdir(), 'paperparser-web-'));
    mkdirSync(join(webDistPath, 'assets'), { recursive: true });
    writeFileSync(
      join(webDistPath, 'index.html'),
      '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script type="module" src="./assets/app.js"></script></body></html>',
      'utf8',
    );
    writeFileSync(join(webDistPath, 'assets', 'app.js'), 'console.log("paperparser");\n', 'utf8');

    const htmlResponse = await handlePaperParserRequest(new Request('http://paperparser.local/'), {
      storePath,
      runtimeMode: 'deployed',
      webDistPath,
    } as any);
    expect(htmlResponse.status).toBe(200);
    expect(htmlResponse.headers.get('content-type')).toContain('text/html');
    await expect(htmlResponse.text()).resolves.toContain('window.__PAPERPARSER_RUNTIME__');

    const assetResponse = await handlePaperParserRequest(new Request('http://paperparser.local/assets/app.js'), {
      storePath,
      runtimeMode: 'deployed',
      webDistPath,
    } as any);
    expect(assetResponse.status).toBe(200);
    expect(assetResponse.headers.get('content-type')).toContain('text/javascript');
    await expect(assetResponse.text()).resolves.toContain('paperparser');
  });

  it('rejects JSON inputPath analysis in deployed mode', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));

    const response = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          inputPath: 'packages/core/test/fixtures/markdown/paper.md',
          paperId: 'fixture-markdown',
        }),
      }),
      { storePath, runtimeMode: 'deployed' } as any,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('inputPath'),
    });
  });

  it('serves health and ready aliases alongside healthz and readyz in deployed mode', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));

    const healthResponse = await handlePaperParserRequest(new Request('http://paperparser.local/healthz'), {
      storePath,
      runtimeMode: 'deployed',
    } as any);
    expect(healthResponse.status).toBe(200);
    await expect(healthResponse.json()).resolves.toMatchObject({ ok: true });

    const readyResponse = await handlePaperParserRequest(new Request('http://paperparser.local/readyz'), {
      storePath,
      runtimeMode: 'deployed',
    } as any);
    expect(readyResponse.status).toBe(200);
    await expect(readyResponse.json()).resolves.toMatchObject({
      ok: true,
      storePath,
    });

    const healthAliasResponse = await handlePaperParserRequest(new Request('http://paperparser.local/health'), {
      storePath,
      runtimeMode: 'deployed',
    } as any);
    expect(healthAliasResponse.status).toBe(200);
    await expect(healthAliasResponse.json()).resolves.toMatchObject({ ok: true });

    const readyAliasResponse = await handlePaperParserRequest(new Request('http://paperparser.local/ready'), {
      storePath,
      runtimeMode: 'deployed',
    } as any);
    expect(readyAliasResponse.status).toBe(200);
    await expect(readyAliasResponse.json()).resolves.toMatchObject({
      ok: true,
      storePath,
    });
  });

  it('rejects oversized multipart uploads explicitly', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));
    const body = new FormData();
    body.set('file', new File(['x'.repeat(64)], 'too-large.md', { type: 'text/markdown' }));

    const response = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers', {
        method: 'POST',
        body,
      }),
      { storePath, maxUploadBytes: 16, maxRequestBytes: 1024 } as any,
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('upload'),
    });
  });

  it('rejects oversized request bodies at the HTTP boundary', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));
    const server = createServer(
      createPaperParserRequestHandler({
        storePath,
        runtimeMode: 'deployed',
        maxRequestBytes: 32,
      } as any),
    );

    await new Promise<void>((resolve, reject) => {
      server.listen(0, '127.0.0.1', (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected an ephemeral HTTP server address.');
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/papers`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          inputPath: 'packages/core/test/fixtures/markdown/paper.md',
          paperId: 'fixture-markdown',
          padding: 'x'.repeat(256),
        }),
      });

      expect(response.status).toBe(413);
      await expect(response.json()).resolves.toMatchObject({
        error: expect.stringContaining('too large'),
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });

  it('uploads and analyzes a markdown file, then serves stored bundle parts', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));

    const body = new FormData();
    body.set(
      'file',
      new File([readFileSync('packages/core/test/fixtures/markdown/paper.md', 'utf8')], 'paper.md', {
        type: 'text/markdown',
      }),
    );
    body.set('paperId', 'uploaded-markdown');

    const postResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers', {
        method: 'POST',
        body,
      }),
      { storePath },
    );
    expect(postResponse.status).toBe(201);

    const created = (await postResponse.json()) as {
      paperId: string;
      sourceType: string;
      manifest: { paper: { title: string } };
    };
    expect(created.paperId).toBe('uploaded-markdown');
    expect(created.sourceType).toBe('markdown');
    expect(created.manifest.paper.title).toBe('Academic Markdown Fixture');

    const papersResponse = await handlePaperParserRequest(new Request('http://paperparser.local/api/papers'), {
      storePath,
    });
    expect(papersResponse.status).toBe(200);
    const papers = (await papersResponse.json()) as {
      latestPaperId: string;
      papers: Array<{ paperId: string; sourceType: string; warningCount: number; hasEnrichment: boolean }>;
    };
    expect(papers.latestPaperId).toBe('uploaded-markdown');
    expect(papers.papers.map((paper) => paper.paperId)).toEqual(['uploaded-markdown']);
    expect(papers.papers[0]?.warningCount).toBe(0);
    expect(papers.papers[0]?.hasEnrichment).toBe(false);

    const manifestResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/uploaded-markdown/manifest'),
      { storePath },
    );
    expect(manifestResponse.status).toBe(200);
    const manifest = (await manifestResponse.json()) as {
      paper: { source_type: string; title: string };
    };
    expect(manifest.paper.source_type).toBe('markdown');
    expect(manifest.paper.title).toBe('Academic Markdown Fixture');

    const graphResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/uploaded-markdown/graph'),
      { storePath },
    );
    expect(graphResponse.status).toBe(200);
    const graph = (await graphResponse.json()) as {
      nodes: Array<{ id: string }>;
      edges: Array<{ source: string; target: string }>;
    };
    expect(graph.nodes.some((node) => node.id === 'sec1::thm:thm-main')).toBe(true);
    expect(graph.edges.some((edge) => edge.source === 'sec2::lem:lem-bounded' && edge.target === 'sec1::thm:thm-main')).toBe(true);

    const indexResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/uploaded-markdown/index'),
      { storePath },
    );
    expect(indexResponse.status).toBe(200);
    const index = (await indexResponse.json()) as {
      main_results: Array<{ node_id: string }>;
    };
    expect(index.main_results[0]?.node_id).toBe('sec1::thm:thm-main');
  });

  it('serves query, context, and impact endpoints for a stored paper', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));

    const analyzeResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          inputPath: 'packages/core/test/fixtures/latex/project/main.tex',
          paperId: 'fixture-latex',
        }),
      }),
      { storePath },
    );
    expect(analyzeResponse.status).toBe(201);

    const queryResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/fixture-latex/query?q=compact'),
      { storePath },
    );
    expect(queryResponse.status).toBe(200);
    const query = (await queryResponse.json()) as {
      results: Array<{ nodeId: string; nodeKind: string; label: string; number: string }>;
    };
    expect(query.results[0]?.nodeId).toBe('sec1::thm:thm-fixture');
    expect(query.results[0]?.nodeKind).toBe('theorem');
    expect(query.results[0]?.label).toContain('Theorem 1.1');
    expect(query.results[0]?.number).toBe('1.1');

    const contextResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/fixture-latex/context/sec1::thm:thm-fixture'),
      { storePath },
    );
    expect(contextResponse.status).toBe(200);
    const context = (await contextResponse.json()) as {
      node: { id: string };
      dependencyChain: Array<{ id: string }>;
    };
    expect(context.node.id).toBe('sec1::thm:thm-fixture');
    expect(context.dependencyChain).toEqual([]);

    const impactResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/fixture-latex/impact/sec1::thm:thm-fixture'),
      { storePath },
    );
    expect(impactResponse.status).toBe(200);
    const impact = (await impactResponse.json()) as {
      node: { id: string };
      dependentNodes: Array<{ id: string }>;
    };
    expect(impact.node.id).toBe('sec1::thm:thm-fixture');
    expect(impact.dependentNodes).toEqual([]);
  });

  it('serves explainable cross-paper related results for a stored corpus', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));

    const markdownAnalyze = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          inputPath: 'packages/core/test/fixtures/markdown/paper.md',
          paperId: 'fixture-markdown',
        }),
      }),
      { storePath },
    );
    expect(markdownAnalyze.status).toBe(201);

    const latexAnalyze = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          inputPath: 'packages/core/test/fixtures/latex/project/main.tex',
          paperId: 'fixture-latex',
        }),
      }),
      { storePath },
    );
    expect(latexAnalyze.status).toBe(201);

    const relatedResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/fixture-markdown/related/sec1%3A%3Athm%3Athm-main'),
      { storePath },
    );
    expect(relatedResponse.status).toBe(200);
    const related = (await relatedResponse.json()) as {
      sourcePaperId: string;
      sourceNodeId: string;
      matches: Array<{ targetPaperId: string; targetNodeId: string; evidenceTerms: string[] }>;
    };
    expect(related.sourcePaperId).toBe('fixture-markdown');
    expect(related.sourceNodeId).toBe('sec1::thm:thm-main');
    expect(related.matches[0]?.targetPaperId).toBe('fixture-latex');
    expect(related.matches[0]?.targetNodeId).toBe('sec1::thm:thm-fixture');
    expect(related.matches[0]?.evidenceTerms).toEqual(expect.arrayContaining(['compact', 'set']));
  });

  it('serves a checked-in multi-paper corpus workflow over the API without manual repair steps', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));
    const fixtures = [
      ['fixture-markdown', 'packages/core/test/fixtures/markdown/paper.md'],
      ['fixture-latex', 'packages/core/test/fixtures/latex/project/main.tex'],
      ['fixture-canonical', 'packages/core/test/fixtures/latex/canonical-objects/main.tex'],
    ] as const;

    for (const [paperId, inputPath] of fixtures) {
      const analyzeResponse = await handlePaperParserRequest(
        new Request('http://paperparser.local/api/papers', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            inputPath,
            paperId,
          }),
        }),
        { storePath },
      );
      expect(analyzeResponse.status).toBe(201);
    }

    const papersResponse = await handlePaperParserRequest(new Request('http://paperparser.local/api/papers'), { storePath });
    expect(papersResponse.status).toBe(200);
    const papers = (await papersResponse.json()) as {
      papers: Array<{ paperId: string }>;
    };
    expect(papers.papers.map((paper) => paper.paperId)).toEqual(['fixture-canonical', 'fixture-latex', 'fixture-markdown']);

    const canonicalQueryResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/fixture-canonical/query?q=eq:key'),
      { storePath },
    );
    expect(canonicalQueryResponse.status).toBe(200);
    const canonicalQuery = (await canonicalQueryResponse.json()) as {
      results: Array<{ nodeId: string }>;
    };
    const canonicalNodeId = canonicalQuery.results[0]?.nodeId ?? null;
    expect(canonicalNodeId).toBeTruthy();

    const canonicalContextResponse = await handlePaperParserRequest(
      new Request(
        `http://paperparser.local/api/papers/fixture-canonical/context/${encodeURIComponent(canonicalNodeId ?? '')}`,
      ),
      { storePath },
    );
    expect(canonicalContextResponse.status).toBe(200);
    const canonicalContext = (await canonicalContextResponse.json()) as {
      node: { id: string };
    };
    expect(canonicalContext.node.id).toBe(canonicalNodeId);

    const relatedResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/fixture-markdown/related/sec1%3A%3Athm%3Athm-main'),
      { storePath },
    );
    expect(relatedResponse.status).toBe(200);
    const related = (await relatedResponse.json()) as {
      matches: Array<{ targetPaperId: string; targetNodeId: string; evidenceTerms: string[] }>;
    };
    expect(related.matches[0]?.targetPaperId).toBe('fixture-latex');
    expect(related.matches[0]?.targetNodeId).toBe('sec1::thm:thm-fixture');
    expect(related.matches[0]?.evidenceTerms).toEqual(expect.arrayContaining(['compact', 'set']));
  });

  it('serves enrichment.json when a stored paper has a sidecar', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-serve-'));

    const analyzeExitCode = runCli(
      ['analyze', 'packages/core/test/fixtures/latex/canonical-objects/main.tex', '--store', storePath, '--paper', 'fixture-canonical'],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );
    expect(analyzeExitCode).toBe(0);

    const enrichExitCode = runCli(
      ['enrich', '--store', storePath, '--paper', 'fixture-canonical'],
      {
        stdout: () => {},
        stderr: () => {},
      },
    );
    expect(enrichExitCode).toBe(0);

    const enrichmentResponse = await handlePaperParserRequest(
      new Request('http://paperparser.local/api/papers/fixture-canonical/enrichment'),
      { storePath },
    );
    expect(enrichmentResponse.status).toBe(200);
    const enrichment = (await enrichmentResponse.json()) as {
      paper_id: string;
      edges: Array<{ provenance: string; review_status: string }>;
    };
    expect(enrichment.paper_id).toBe('fixture-canonical');
    expect(enrichment.edges.length).toBeGreaterThan(0);
    expect(enrichment.edges.every((edge) => edge.provenance === 'agent_inferred' && edge.review_status === 'pending')).toBe(true);
  });
});
