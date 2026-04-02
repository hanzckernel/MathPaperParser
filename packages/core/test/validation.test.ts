import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ConsistencyChecker } from '../src/validation/consistency-checker.js';
import { SchemaValidator } from '../src/validation/schema-validator.js';

function loadExampleBundle() {
  const examplesDir = resolve(process.cwd(), 'schema/examples');

  return {
    manifest: JSON.parse(readFileSync(resolve(examplesDir, 'manifest.example.json'), 'utf8')),
    graph: JSON.parse(readFileSync(resolve(examplesDir, 'graph.example.json'), 'utf8')),
    index: JSON.parse(readFileSync(resolve(examplesDir, 'index.example.json'), 'utf8')),
  };
}

function loadExpandedContractBundle() {
  const serialized = JSON.parse(JSON.stringify(loadExampleBundle())) as ReturnType<typeof loadExampleBundle>;
  const theoremId = serialized.graph.nodes[0]?.id;
  if (!theoremId) {
    throw new Error('example bundle missing theorem node');
  }

  serialized.graph.nodes.push({
    id: 'sec1::sec:introduction',
    kind: 'section',
    label: 'Section 1 (Introduction)',
    section: '1',
    section_title: 'Introduction',
    number: '1',
    latex_label: null,
    statement: 'Introduction section.',
    proof_status: 'not_applicable',
    is_main_result: false,
    novelty: 'new',
    metadata: {},
    file_path: 'main.tex',
    start_line: 1,
    end_line: 3,
  });

  serialized.graph.edges.push({
    source: 'sec1::sec:introduction',
    target: theoremId,
    kind: 'contains',
    evidence: 'inferred',
    provenance: 'structural',
    detail: 'Section 1 contains the theorem.',
    metadata: {},
  });

  serialized.graph.edges.push({
    source: theoremId,
    target: 'sec0::ext:foundations',
    kind: 'cites_external',
    evidence: 'external',
    provenance: 'explicit',
    detail: 'Cites \\cite{Foundations}.',
    metadata: {
      citeKey: 'Foundations',
    },
  });

  serialized.graph.nodes.push({
    id: 'sec0::ext:foundations',
    kind: 'external_dependency',
    label: 'External dependency (Foundations)',
    section: '0',
    section_title: 'External dependencies',
    number: '',
    latex_label: null,
    statement: 'Citation key: Foundations',
    proof_status: 'not_applicable',
    is_main_result: false,
    novelty: 'classical',
    metadata: {
      citeKey: 'Foundations',
    },
  });

  (serialized.index.stats.node_counts as Record<string, number>).section = 1;
  serialized.index.stats.node_counts.total += 1;
  serialized.index.stats.node_counts.external_dependency += 1;
  serialized.index.stats.node_counts.total += 1;
  (serialized.index.stats.edge_counts as Record<string, number>).contains = 1;
  serialized.index.stats.edge_counts.total += 1;
  serialized.index.stats.edge_counts.cites_external += 1;
  serialized.index.stats.edge_counts.total += 1;
  serialized.index.stats.evidence_breakdown.inferred += 1;
  serialized.index.stats.evidence_breakdown.external += 1;

  return serialized;
}

describe('schema and consistency validation', () => {
  it('accepts the published example bundle', () => {
    const serialized = loadExampleBundle();
    const validator = new SchemaValidator(resolve(process.cwd(), 'schema'));

    expect(() => validator.validateSerializedBundle(serialized)).not.toThrow();
    expect(() => ConsistencyChecker.checkSerializedBundle(serialized)).not.toThrow();
  });

  it('accepts markdown as a schema-valid source type', () => {
    const serialized = loadExampleBundle();
    const validator = new SchemaValidator(resolve(process.cwd(), 'schema'));

    serialized.manifest.paper.source_type = 'markdown';

    expect(() => validator.validateSerializedBundle(serialized)).not.toThrow();
  });

  it('rejects schema-invalid payloads', () => {
    const serialized = loadExampleBundle();
    const validator = new SchemaValidator(resolve(process.cwd(), 'schema'));

    serialized.graph.nodes[0] = {
      ...serialized.graph.nodes[0],
      kind: 'invalid_kind',
    };

    expect(() => validator.validateSerializedBundle(serialized)).toThrowError(/does not validate/i);
  });

  it('rejects broken node references in index data', () => {
    const serialized = loadExampleBundle();

    serialized.index.main_results[0] = {
      ...serialized.index.main_results[0],
      node_id: 'sec9::thm:missing-node',
    };

    expect(() => ConsistencyChecker.checkSerializedBundle(serialized)).toThrowError(/unknown node ids/i);
  });

  it('accepts the expanded canonical contract for sections, anchors, and provenance', () => {
    const serialized = loadExpandedContractBundle();
    const validator = new SchemaValidator(resolve(process.cwd(), 'schema'));

    expect(() => validator.validateSerializedBundle(serialized)).not.toThrow();
    expect(() => ConsistencyChecker.checkSerializedBundle(serialized)).not.toThrow();
  });
});
