import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BundleSerializer,
  ConsistencyChecker,
  EnrichmentSerializer,
  SchemaValidator,
  analyzeDocumentPath,
  createHeuristicEnrichment,
} from '../src/index.js';

describe('heuristic enrichment service', () => {
  it('generates a validated deterministic sidecar with reviewable inferred edges', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/canonical-objects/main.tex');
    const bundle = analyzeDocumentPath(fixturePath);
    const enrichment = createHeuristicEnrichment(bundle, {
      paperId: 'fixture-canonical',
      createdAt: '2026-04-02T12:00:00Z',
    });
    const serializedBundle = BundleSerializer.toJsonBundle(bundle);
    const serializedEnrichment = EnrichmentSerializer.toJsonArtifact(enrichment);
    const deterministicEdges = new Set(
      serializedBundle.graph.edges.map((edge) => `${edge.source}::${edge.target}::${edge.kind}`),
    );

    expect(serializedEnrichment.paper_id).toBe('fixture-canonical');
    expect(serializedEnrichment.provider.agent).toBe('paperparser-v2/heuristic-reviewer');
    expect(serializedEnrichment.edges.length).toBeGreaterThan(0);
    expect(
      serializedEnrichment.edges.every(
        (edge) =>
          edge.provenance === 'agent_inferred' &&
          edge.evidence === 'inferred' &&
          typeof edge.confidence === 'number' &&
          edge.confidence > 0 &&
          edge.confidence <= 1 &&
          edge.review_status === 'pending' &&
          !deterministicEdges.has(`${edge.source}::${edge.target}::${edge.kind}`),
      ),
    ).toBe(true);
    expect(
      serializedEnrichment.edges.some(
        (edge) =>
          edge.source === 'sec1::thm:thm-main' &&
          edge.target === 'sec1::lem:lem-key' &&
          Array.isArray((edge.metadata as { supportPath?: string[] }).supportPath),
      ),
    ).toBe(true);

    expect(() => new SchemaValidator().validateSerializedEnrichment(serializedEnrichment)).not.toThrow();
    expect(() => ConsistencyChecker.checkSerializedEnrichment(serializedBundle, serializedEnrichment)).not.toThrow();
    expect(
      EnrichmentSerializer.toJsonArtifact(
        createHeuristicEnrichment(bundle, {
          paperId: 'fixture-canonical',
          createdAt: '2026-04-02T12:00:00Z',
        }),
      ),
    ).toEqual(serializedEnrichment);
  });
});
