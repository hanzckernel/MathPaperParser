import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { KuzuStore } from '../src/persistence/kuzu-store.js';
import { BundleSerializer } from '../src/serialization/bundle-serializer.js';

function loadExampleBundle() {
  const examplesDir = resolve(process.cwd(), 'schema/examples');

  return BundleSerializer.fromJsonBundle({
    manifest: JSON.parse(readFileSync(resolve(examplesDir, 'manifest.example.json'), 'utf8')),
    graph: JSON.parse(readFileSync(resolve(examplesDir, 'graph.example.json'), 'utf8')),
    index: JSON.parse(readFileSync(resolve(examplesDir, 'index.example.json'), 'utf8')),
  });
}

describe('KuzuStore', () => {
  const createdDirs: string[] = [];

  afterEach(() => {
    for (const dir of createdDirs.splice(0)) {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it('persists and loads a paper bundle foundation', async () => {
    const dbDir = mkdtempSync(resolve(tmpdir(), 'paperparser-kuzu-'));
    createdDirs.push(dbDir);

    const bundle = loadExampleBundle();
    const store = new KuzuStore(dbDir);

    await store.open();
    await store.initializeSchema();
    await store.writeBundle(bundle);

    const summaries = await store.listPapers();
    const loaded = await store.readBundle(bundle.manifest.paper.title);

    await store.close();

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.title).toBe(bundle.manifest.paper.title);
    expect(loaded.manifest.paper.title).toBe(bundle.manifest.paper.title);
    expect(loaded.graph.nodes).toHaveLength(bundle.graph.nodes.length);
    expect(loaded.graph.edges).toHaveLength(bundle.graph.edges.length);
  });
});
