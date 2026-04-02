import { readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';
import { handlePaperParserRequest } from '../src/server.js';

describe('paperparser serve app', () => {
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
      papers: Array<{ paperId: string; sourceType: string }>;
    };
    expect(papers.latestPaperId).toBe('uploaded-markdown');
    expect(papers.papers.map((paper) => paper.paperId)).toEqual(['uploaded-markdown']);

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
      results: Array<{ nodeId: string }>;
    };
    expect(query.results[0]?.nodeId).toBe('sec1::thm:thm-fixture');

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
