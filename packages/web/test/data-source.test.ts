import { describe, expect, it, vi } from 'vitest';

import { loadSerializedPaperData } from '../src/lib/data-source.js';

describe('web data source enrichment loading', () => {
  it('loads enrichment.json alongside static manifest/graph/index when present', async () => {
    const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', paper: { title: 'Static Title' } }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', nodes: [], edges: [] }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', main_results: [], stats: {} }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          schema_version: '0.2.0',
          paper_id: 'fixture-canonical',
          provider: { agent: 'paperparser-v2/heuristic-reviewer', model: 'local-transitive-v1', prompt_version: 'chain-review-v1' },
          base_bundle: { schema_version: '0.2.0', node_count: 4, edge_count: 3 },
          created_at: '2026-04-02T12:00:00Z',
          edges: [],
        }),
        { status: 200 },
      ),
    );

    const loaded = await loadSerializedPaperData(
      {
        kind: 'static',
        basePath: '/export/data',
      },
      fetchMock as typeof fetch,
    );

    expect(loaded.bundle.manifest.paper.title).toBe('Static Title');
    expect(loaded.enrichment?.paper_id).toBe('fixture-canonical');
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/export/data/manifest.json',
      '/export/data/graph.json',
      '/export/data/index.json',
      '/export/data/enrichment.json',
    ]);
  });

  it('treats missing enrichment as optional in API mode', async () => {
    const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ latestPaperId: 'fixture-latex' }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', paper: { title: 'API Title' } }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', nodes: [], edges: [] }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ schema_version: '0.2.0', main_results: [], stats: {} }), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(new Response('not found', { status: 404, statusText: 'Not Found' }));

    const loaded = await loadSerializedPaperData(
      {
        kind: 'api',
        baseUrl: 'http://localhost:3000',
        paperId: 'latest',
      },
      fetchMock as typeof fetch,
    );

    expect(loaded.bundle.manifest.paper.title).toBe('API Title');
    expect(loaded.enrichment).toBeUndefined();
  });
});
