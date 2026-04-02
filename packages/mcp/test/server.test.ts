import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import {
  EnrichmentSerializer,
  JsonStore,
  analyzeDocumentPath,
  createHeuristicEnrichment,
  type SerializedPaperParserBundle,
} from '@paperparser/core';

import { createPaperParserMcpServer } from '../src/index.js';

function writeBundle(storePath: string, paperId: string, inputPath: string): SerializedPaperParserBundle {
  const bundle = analyzeDocumentPath(inputPath);
  const bundleDir = join(storePath, paperId);
  JsonStore.writeBundle(bundleDir, bundle);
  JsonStore.writeSerializedEnrichment(
    bundleDir,
    EnrichmentSerializer.toJsonArtifact(
      createHeuristicEnrichment(bundle, {
        paperId,
        createdAt: '2026-04-02T12:00:00Z',
      }),
    ),
  );
  writeFileSync(
    join(storePath, 'latest.json'),
    `${JSON.stringify({ paper_id: paperId, updated_at: '2026-03-11T00:00:00Z' }, null, 2)}\n`,
    'utf8',
  );
  return JsonStore.readSerializedBundle(bundleDir);
}

describe('PaperParser MCP server', () => {
  it('lists the expected tools and resources', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-mcp-'));
    writeBundle(storePath, 'fixture-markdown', 'packages/core/test/fixtures/markdown/paper.md');
    const server = createPaperParserMcpServer({ storePath });

    const tools = await server.listTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      'query_math_objects',
      'get_context',
      'impact_analysis',
      'trace_proof_chain',
      'search_concepts',
      'validate_bundle',
    ]);

    const resources = await server.listResources();
    expect(resources.map((resource) => resource.uri)).toEqual([
      'paperparser://papers',
      'paperparser://papers/fixture-markdown/graph',
      'paperparser://papers/fixture-markdown/manifest',
      'paperparser://papers/fixture-markdown/enrichment',
    ]);
  });

  it('serves tool calls and resource reads for a stored paper', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-mcp-'));
    writeBundle(storePath, 'fixture-markdown', 'packages/core/test/fixtures/markdown/paper.md');
    const server = createPaperParserMcpServer({ storePath });

    const query = await server.callTool('query_math_objects', {
      paperId: 'fixture-markdown',
      query: 'compact main result',
      limit: 1,
    });
    expect(query.results[0]?.nodeId).toBe('sec1::thm:thm-main');
    expect(query.results[0]?.nodeKind).toBe('theorem');
    expect(query.results[0]?.number).toBe('2.1');

    const context = await server.callTool('get_context', {
      paperId: 'fixture-markdown',
      nodeId: 'sec2::lem:lem-bounded',
    });
    expect(context.node.id).toBe('sec2::lem:lem-bounded');
    expect(context.outgoingEdges[0]?.target).toBe('sec1::thm:thm-main');

    const impact = await server.callTool('impact_analysis', {
      paperId: 'fixture-markdown',
      nodeId: 'sec1::thm:thm-main',
    });
    expect(impact.dependentNodes.map((node) => node.id)).toEqual(['sec2::lem:lem-bounded']);

    const proofChain = await server.callTool('trace_proof_chain', {
      paperId: 'fixture-markdown',
      nodeId: 'sec2::lem:lem-bounded',
    });
    expect(proofChain.dependencyChain.map((node) => node.id)).toEqual(['sec1::thm:thm-main']);

    const validation = await server.callTool('validate_bundle', {
      paperId: 'fixture-markdown',
    });
    expect(validation.ok).toBe(true);

    const papers = await server.readResource('paperparser://papers');
    expect(papers.latestPaperId).toBe('fixture-markdown');

    const manifest = await server.readResource('paperparser://papers/fixture-markdown/manifest');
    expect(manifest.paper.source_type).toBe('markdown');

    const enrichment = await server.readResource('paperparser://papers/fixture-markdown/enrichment');
    expect(enrichment.paper_id).toBe('fixture-markdown');
    expect(Array.isArray(enrichment.edges)).toBe(true);
  });

  it('serves the same MCP surface for a stored latex paper', async () => {
    const storePath = mkdtempSync(join(tmpdir(), 'paperparser-mcp-'));
    writeBundle(storePath, 'fixture-latex', 'packages/core/test/fixtures/latex/project/main.tex');
    const server = createPaperParserMcpServer({ storePath });

    const query = await server.callTool('query_math_objects', {
      paperId: 'fixture-latex',
      query: 'main theorem',
      limit: 1,
    });
    expect(query.results[0]?.nodeId).toBe('sec1::thm:thm-fixture');
    expect(query.results[0]?.label).toContain('Theorem 1.1');
    expect(query.results[0]?.number).toBe('1.1');

    const context = await server.callTool('get_context', {
      paperId: 'fixture-latex',
      nodeId: 'sec1::thm:thm-fixture',
    });
    expect(context.node.id).toBe('sec1::thm:thm-fixture');

    const validation = await server.callTool('validate_bundle', {
      paperId: 'fixture-latex',
    });
    expect(validation.ok).toBe(true);

    const manifest = await server.readResource('paperparser://papers/fixture-latex/manifest');
    expect(manifest.paper.source_type).toBe('latex');

    const graph = await server.readResource('paperparser://papers/fixture-latex/graph');
    expect(graph.nodes.some((node: { id: string }) => node.id === 'sec1::thm:thm-fixture')).toBe(true);
  });
});
