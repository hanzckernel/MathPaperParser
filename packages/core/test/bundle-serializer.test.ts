import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BundleSerializer } from '../src/serialization/bundle-serializer.js';
import { analyzeDocumentPath } from '../src/index.js';

function loadExampleBundle() {
  const examplesDir = resolve(process.cwd(), 'schema/examples');

  return {
    manifest: JSON.parse(readFileSync(resolve(examplesDir, 'manifest.example.json'), 'utf8')),
    graph: JSON.parse(readFileSync(resolve(examplesDir, 'graph.example.json'), 'utf8')),
    index: JSON.parse(readFileSync(resolve(examplesDir, 'index.example.json'), 'utf8')),
  };
}

describe('BundleSerializer', () => {
  it('round-trips the published schema examples', () => {
    const serialized = loadExampleBundle();

    const bundle = BundleSerializer.fromJsonBundle(serialized);

    expect(bundle.manifest.schemaVersion).toBe('0.2.0');
    expect(bundle.manifest.paper.sourceType).toBe('markdown');
    expect(bundle.graph.nodes).toHaveLength(serialized.graph.nodes.length);
    expect(bundle.index.mainResults[0]?.nodeId).toBe(serialized.index.main_results[0]?.node_id);
    expect(BundleSerializer.toJsonBundle(bundle)).toEqual(serialized);
  });

  it('serializes markdown as a first-class source type', () => {
    const serialized = loadExampleBundle();
    const bundle = BundleSerializer.fromJsonBundle(serialized);

    bundle.manifest.paper.sourceType = 'markdown';

    expect(BundleSerializer.toJsonBundle(bundle).manifest.paper.source_type).toBe('markdown');
  });

  it('round-trips anchors and provenance on analyzed canonical bundles', () => {
    const fixturePath = resolve(process.cwd(), 'packages/core/test/fixtures/latex/canonical-objects/main.tex');
    const bundle = analyzeDocumentPath(fixturePath);
    const serialized = BundleSerializer.toJsonBundle(bundle);
    const roundTripped = BundleSerializer.fromJsonBundle(serialized);

    expect(
      roundTripped.graph.nodes.some(
        (node) =>
          typeof node.filePath === 'string' && typeof node.startLine === 'number' && typeof node.endLine === 'number',
      ),
    ).toBe(true);
    expect(
      serialized.graph.nodes.some(
        (node) =>
          typeof (node as { file_path?: string }).file_path === 'string' &&
          typeof (node as { start_line?: number }).start_line === 'number' &&
          typeof (node as { end_line?: number }).end_line === 'number',
      ),
    ).toBe(true);
    expect(
      serialized.graph.edges.some((edge) => (edge as { provenance?: string }).provenance === 'structural'),
    ).toBe(true);
    expect(
      serialized.graph.edges.some(
        (edge) =>
          edge.kind === 'cites_external' &&
          (edge as { provenance?: string }).provenance === 'explicit' &&
          (edge.metadata as { citeKey?: string }).citeKey === 'Foundations',
      ),
    ).toBe(true);
    expect(BundleSerializer.toJsonBundle(roundTripped)).toEqual(serialized);
  });
});
