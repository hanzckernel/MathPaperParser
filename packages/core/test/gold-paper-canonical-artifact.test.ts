import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { BundleSerializer, analyzeDocumentPath } from '../src/index.js';

function normalizeSerializedBundle(bundle: ReturnType<typeof BundleSerializer.toJsonBundle>) {
  const clone = JSON.parse(JSON.stringify(bundle)) as ReturnType<typeof BundleSerializer.toJsonBundle>;
  clone.manifest.created_at = '__NORMALIZED__';
  clone.manifest.producer.timestamp_start = '__NORMALIZED__';
  clone.manifest.producer.timestamp_end = '__NORMALIZED__';
  if (clone.manifest.paper.version_note) {
    clone.manifest.paper.version_note = '__NORMALIZED__';
  }
  return clone;
}

describe('gold paper canonical artifact', () => {
  it('emits first-class canonical objects, anchors, and provenance-bearing relations', () => {
    const fixturePath = resolve(process.cwd(), 'ref/papers/long_nalini/arXiv-2502.12268v2/main.tex');
    const bundle = analyzeDocumentPath(fixturePath);
    const serialized = BundleSerializer.toJsonBundle(bundle);

    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'section')).toBe(true);
    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'definition')).toBe(true);
    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'lemma')).toBe(true);
    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'proposition')).toBe(true);
    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'corollary')).toBe(true);
    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'proof')).toBe(true);
    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'equation')).toBe(true);
    expect(bundle.graph.nodes.some((node) => String(node.kind) === 'external_dependency')).toBe(true);
    expect(
      bundle.graph.nodes.some(
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
      serialized.graph.edges.some(
        (edge) => String(edge.kind) === 'contains' && (edge as { provenance?: string }).provenance === 'structural',
      ),
    ).toBe(true);
    expect(
      serialized.graph.edges.some(
        (edge) => String(edge.kind) === 'proves' && (edge as { provenance?: string }).provenance === 'structural',
      ),
    ).toBe(true);
    expect(
      serialized.graph.edges.some(
        (edge) => edge.kind === 'uses_in_proof' && (edge as { provenance?: string }).provenance === 'explicit',
      ),
    ).toBe(true);
    expect(
      serialized.graph.edges.some(
        (edge) =>
          edge.kind === 'uses_in_proof' &&
          edge.evidence === 'explicit_ref' &&
          typeof (edge.metadata as { latexRef?: string }).latexRef === 'string',
      ),
    ).toBe(true);
    expect(
      serialized.graph.edges.some(
        (edge) =>
          edge.kind === 'cites_external' &&
          edge.evidence === 'external' &&
          (edge as { provenance?: string }).provenance === 'explicit' &&
          typeof (edge.metadata as { citeKey?: string }).citeKey === 'string',
      ),
    ).toBe(true);
  });

  it('is stable across deterministic reruns after normalizing time-varying metadata', () => {
    const fixturePath = resolve(process.cwd(), 'ref/papers/long_nalini/arXiv-2502.12268v2/main.tex');

    const first = normalizeSerializedBundle(BundleSerializer.toJsonBundle(analyzeDocumentPath(fixturePath)));
    const second = normalizeSerializedBundle(BundleSerializer.toJsonBundle(analyzeDocumentPath(fixturePath)));

    expect(first).toEqual(second);
  });
});
