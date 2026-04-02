import { BundleSerializer, type SerializedPaperParserBundle } from '../serialization/bundle-serializer.js';
import { EnrichmentSerializer, type SerializedEnrichmentArtifact } from '../serialization/enrichment-serializer.js';
import type { PaperParserBundle } from '../types/bundle.js';
import { EDGE_EVIDENCE_VALUES, MATH_EDGE_KINDS } from '../types/edge.js';
import type { PaperParserEnrichment } from '../types/enrichment.js';
import { MATH_NODE_KINDS } from '../types/node.js';

const NODE_ID_PATTERN =
  /^sec[0-9A-Za-z]+(\.[0-9A-Za-z]+)*::(sec|def|thm|lem|prop|cor|asm|rem|ex|conj|not|proof|eq|ext):[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

function computeStats(bundle: SerializedPaperParserBundle['graph']) {
  const nodeCounts = Object.fromEntries(MATH_NODE_KINDS.map((key) => [key, 0])) as Record<
    (typeof MATH_NODE_KINDS)[number],
    number
  >;
  const edgeCounts = Object.fromEntries(MATH_EDGE_KINDS.map((key) => [key, 0])) as Record<
    (typeof MATH_EDGE_KINDS)[number],
    number
  >;
  const evidenceBreakdown = Object.fromEntries(
    EDGE_EVIDENCE_VALUES.map((key) => [key, 0]),
  ) as Record<(typeof EDGE_EVIDENCE_VALUES)[number], number>;

  for (const node of bundle.nodes) {
    nodeCounts[node.kind] += 1;
  }

  for (const edge of bundle.edges) {
    edgeCounts[edge.kind] += 1;
    evidenceBreakdown[edge.evidence] += 1;
  }

  return {
    node_counts: {
      ...nodeCounts,
      total: bundle.nodes.length,
    },
    edge_counts: {
      ...edgeCounts,
      total: bundle.edges.length,
    },
    evidence_breakdown: evidenceBreakdown,
  };
}

function collectIndexNodeRefs(index: SerializedPaperParserBundle['index']): string[] {
  const refs: string[] = [];

  for (const cluster of index.clusters) {
    refs.push(...cluster.members);
  }

  for (const result of index.main_results) {
    refs.push(result.node_id);
  }

  for (const strategy of index.proof_strategies) {
    refs.push(strategy.target_node);
    for (const step of strategy.key_steps) {
      refs.push(...step.uses);
    }
  }

  refs.push(...index.attention.high_dependency_nodes.map((item) => item.node_id));
  refs.push(...index.attention.demanding_proofs.map((item) => item.node_id));

  for (const unknown of index.unknowns) {
    refs.push(...unknown.related_nodes);
  }

  refs.push(...index.notation_index.map((entry) => entry.introduced_in));

  for (const innovation of index.innovation_assessment.main_innovations) {
    refs.push(...innovation.related_nodes);
  }

  return refs;
}

export class ConsistencyChecker {
  static checkBundle(bundle: PaperParserBundle): void {
    this.checkSerializedBundle(BundleSerializer.toJsonBundle(bundle));
  }

  static checkSerializedBundle(bundle: SerializedPaperParserBundle): void {
    const schemaVersions = [
      bundle.manifest.schema_version,
      bundle.graph.schema_version,
      bundle.index.schema_version,
    ];
    if (new Set(schemaVersions).size !== 1) {
      throw new Error(`schema_version mismatch: ${schemaVersions.join(', ')}`);
    }

    const nodeIds = bundle.graph.nodes.map((node) => node.id);
    for (const nodeId of nodeIds) {
      if (!NODE_ID_PATTERN.test(nodeId)) {
        throw new Error(`graph.nodes[].id does not match canonical pattern: ${nodeId}`);
      }
    }

    if (new Set(nodeIds).size !== nodeIds.length) {
      throw new Error('graph.nodes[].id must be unique');
    }

    const nodeIdSet = new Set(nodeIds);

    for (const edge of bundle.graph.edges) {
      if (!nodeIdSet.has(edge.source)) {
        throw new Error(`graph.edges[].source not in node IDs: ${edge.source}`);
      }
      if (!nodeIdSet.has(edge.target)) {
        throw new Error(`graph.edges[].target not in node IDs: ${edge.target}`);
      }
    }

    const missingRefs = [...new Set(collectIndexNodeRefs(bundle.index).filter((ref) => !nodeIdSet.has(ref)))].sort();
    if (missingRefs.length > 0) {
      throw new Error(`index contains references to unknown node ids: ${missingRefs.join(', ')}`);
    }

    const mainResultIds = new Set(bundle.graph.nodes.filter((node) => node.is_main_result).map((node) => node.id));
    const invalidMainResults = bundle.index.main_results
      .map((result) => result.node_id)
      .filter((nodeId) => !mainResultIds.has(nodeId));
    if (invalidMainResults.length > 0) {
      throw new Error(`index.main_results references nodes not marked is_main_result: ${invalidMainResults.join(', ')}`);
    }

    const computedStats = computeStats(bundle.graph);
    const serializedStats = bundle.index.stats;
    const statsMatch =
      JSON.stringify(serializedStats.node_counts) === JSON.stringify(computedStats.node_counts) &&
      JSON.stringify(serializedStats.edge_counts) === JSON.stringify(computedStats.edge_counts) &&
      JSON.stringify(serializedStats.evidence_breakdown) === JSON.stringify(computedStats.evidence_breakdown);

    if (!statsMatch) {
      throw new Error('index.stats does not match graph-derived statistics');
    }
  }

  static checkEnrichment(bundle: PaperParserBundle, enrichment: PaperParserEnrichment): void {
    this.checkSerializedEnrichment(BundleSerializer.toJsonBundle(bundle), EnrichmentSerializer.toJsonArtifact(enrichment));
  }

  static checkSerializedEnrichment(
    bundle: SerializedPaperParserBundle,
    enrichment: SerializedEnrichmentArtifact,
  ): void {
    if (bundle.graph.schema_version !== enrichment.base_bundle.schema_version) {
      throw new Error('enrichment base_bundle.schema_version must match graph.schema_version');
    }

    const nodeIdSet = new Set(bundle.graph.nodes.map((node) => node.id));
    const directRelationPairs = new Set(bundle.graph.edges.map((edge) => `${edge.source}::${edge.target}`));
    const candidateKeys = new Set<string>();

    for (const edge of enrichment.edges) {
      if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)) {
        throw new Error(`enrichment edge references unknown node ids: ${edge.source} -> ${edge.target}`);
      }
      if (edge.provenance !== 'agent_inferred') {
        throw new Error('enrichment edges must use provenance=agent_inferred');
      }
      if (edge.evidence !== 'inferred') {
        throw new Error('enrichment edges must use evidence=inferred');
      }
      if (typeof edge.confidence !== 'number' || edge.confidence <= 0 || edge.confidence > 1) {
        throw new Error('enrichment edges must have confidence in (0, 1]');
      }
      if (directRelationPairs.has(`${edge.source}::${edge.target}`)) {
        throw new Error(`enrichment edge duplicates an existing deterministic relation: ${edge.source} -> ${edge.target}`);
      }

      const candidateKey = `${edge.source}::${edge.target}::${edge.kind}`;
      if (candidateKeys.has(candidateKey)) {
        throw new Error(`duplicate enrichment edge: ${candidateKey}`);
      }
      candidateKeys.add(candidateKey);
    }
  }
}
