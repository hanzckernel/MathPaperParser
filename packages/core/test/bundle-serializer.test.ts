import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BundleSerializer } from '../src/serialization/bundle-serializer.js';

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

    expect(bundle.manifest.paper.sourceType).toBe('latex');
    expect(bundle.graph.nodes).toHaveLength(serialized.graph.nodes.length);
    expect(bundle.index.mainResults[0]?.nodeId).toBe(serialized.index.main_results[0]?.node_id);
    expect(BundleSerializer.toJsonBundle(bundle)).toEqual(serialized);
  });
});
