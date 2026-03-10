import { describe, expect, it } from 'vitest';

import {
  BUNDLE_EDGE_COUNT_KEYS,
  BUNDLE_EVIDENCE_COUNT_KEYS,
  BUNDLE_NODE_COUNT_KEYS,
  EDGE_EVIDENCE_VALUES,
  INGESTION_INPUT_KINDS,
  MATH_EDGE_KINDS,
  MATH_NODE_KINDS,
  PIPELINE_PHASE_NAMES,
  SEARCH_MODES,
  createEmptyBundleStats,
} from '../src/index.js';

describe('core type contracts', () => {
  it('publishes stable math node and edge enums', () => {
    expect(MATH_NODE_KINDS).toContain('theorem');
    expect(MATH_NODE_KINDS).toContain('external_dependency');
    expect(MATH_EDGE_KINDS).toEqual([
      'uses_in_proof',
      'extends',
      'generalizes',
      'specializes',
      'equivalent_to',
      'cites_external',
    ]);
    expect(EDGE_EVIDENCE_VALUES).toEqual(['explicit_ref', 'inferred', 'external']);
  });

  it('publishes the stage-one ingestion and search modes', () => {
    expect(INGESTION_INPUT_KINDS).toEqual(['latex', 'markdown', 'pdf']);
    expect(PIPELINE_PHASE_NAMES).toEqual([
      'scan',
      'structure',
      'parse',
      'resolve',
      'cluster',
      'proof-flow',
    ]);
    expect(SEARCH_MODES).toEqual(['keyword', 'semantic', 'hybrid']);
  });

  it('creates zeroed bundle stats for the v0.1 contract', () => {
    const stats = createEmptyBundleStats();

    expect(BUNDLE_NODE_COUNT_KEYS.at(-1)).toBe('total');
    expect(BUNDLE_EDGE_COUNT_KEYS.at(-1)).toBe('total');
    expect(BUNDLE_EVIDENCE_COUNT_KEYS.at(-1)).toBe('total');
    expect(stats.nodeCounts.total).toBe(0);
    expect(stats.edgeCounts.total).toBe(0);
    expect(stats.evidenceBreakdown.total).toBe(0);
  });
});
