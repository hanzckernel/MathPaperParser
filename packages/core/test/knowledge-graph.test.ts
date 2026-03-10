import { describe, expect, it } from 'vitest';

import type { MathEdge } from '../src/types/edge.js';
import type { MathNode, NodeId } from '../src/types/node.js';
import { MathKnowledgeGraph } from '../src/graph/knowledge-graph.js';

function makeNode(
  id: string,
  kind: MathNode['kind'],
  overrides: Partial<MathNode> = {},
): MathNode {
  return {
    id: id as NodeId,
    kind,
    label: overrides.label ?? `${kind}:${id}`,
    section: overrides.section ?? '1',
    sectionTitle: overrides.sectionTitle ?? 'Section 1',
    number: overrides.number ?? '1.1',
    latexLabel: overrides.latexLabel ?? null,
    statement: overrides.statement ?? `${kind} statement`,
    proofStatus: overrides.proofStatus ?? (kind === 'definition' ? 'not_applicable' : 'full'),
    isMainResult: overrides.isMainResult ?? false,
    novelty: overrides.novelty ?? 'new',
    metadata: overrides.metadata ?? {},
    filePath: overrides.filePath,
    startLine: overrides.startLine,
    endLine: overrides.endLine,
  };
}

function makeEdge(
  source: string,
  target: string,
  kind: MathEdge['kind'] = 'uses_in_proof',
  evidence: MathEdge['evidence'] = 'explicit_ref',
): MathEdge {
  return {
    source: source as NodeId,
    target: target as NodeId,
    kind,
    evidence,
    detail: `${source} -> ${target}`,
    metadata: {},
  };
}

describe('MathKnowledgeGraph', () => {
  it('indexes nodes by id, kind, and section', () => {
    const graph = new MathKnowledgeGraph();
    const theorem = makeNode('sec4::thm:main', 'theorem', {
      label: 'Theorem 4.1',
      section: '4',
      sectionTitle: 'Main Results',
      isMainResult: true,
    });
    const lemma = makeNode('sec3::lem:key-estimate', 'lemma', {
      label: 'Lemma 3.2',
      section: '3',
      sectionTitle: 'Key Estimates',
    });
    const definition = makeNode('sec2::def:space', 'definition', {
      label: 'Definition 2.1',
      section: '2',
      sectionTitle: 'Preliminaries',
    });

    graph.addNode(theorem);
    graph.addNode(lemma);
    graph.addNode(definition);
    graph.addEdge(makeEdge(theorem.id, lemma.id));
    graph.addEdge(makeEdge(theorem.id, definition.id, 'extends', 'inferred'));

    expect(graph.nodeCount).toBe(3);
    expect(graph.edgeCount).toBe(2);
    expect(graph.getNode(theorem.id)).toEqual(theorem);
    expect(graph.hasNode(lemma.id)).toBe(true);
    expect(graph.getNodesByKind('theorem')).toEqual([theorem]);
    expect(graph.getNodesBySection('4')).toEqual([theorem]);
    expect(graph.getMainResults()).toEqual([theorem]);
    expect(graph.getEdges(theorem.id, 'out')).toHaveLength(2);
    expect(graph.getEdges(lemma.id, 'in')).toHaveLength(1);
  });

  it('traverses dependency chains without revisiting cycles', () => {
    const graph = new MathKnowledgeGraph();
    const theorem = makeNode('sec4::thm:main', 'theorem', {
      section: '4',
      isMainResult: true,
    });
    const lemma = makeNode('sec3::lem:key-estimate', 'lemma', { section: '3' });
    const assumption = makeNode('sec1::asm:hypothesis', 'assumption', {
      section: '1',
      proofStatus: 'not_applicable',
    });

    graph.addNode(theorem);
    graph.addNode(lemma);
    graph.addNode(assumption);
    graph.addEdge(makeEdge(theorem.id, lemma.id));
    graph.addEdge(makeEdge(lemma.id, assumption.id));
    graph.addEdge(makeEdge(lemma.id, theorem.id));

    expect(graph.getDependencyChain(theorem.id, 4).map((node) => node.id)).toEqual([
      lemma.id,
      assumption.id,
    ]);
    expect(graph.getProofFlow(theorem.id).map((node) => node.id)).toEqual([
      lemma.id,
      assumption.id,
    ]);
  });

  it('removes nodes and recomputes bundle stats from the remaining graph', () => {
    const graph = new MathKnowledgeGraph();
    const theorem = makeNode('sec4::thm:main', 'theorem', {
      section: '4',
      isMainResult: true,
    });
    const lemma = makeNode('sec3::lem:key-estimate', 'lemma', { section: '3' });
    const external = makeNode('sec0::ext:reference', 'external_dependency', {
      section: '0',
      proofStatus: 'external',
      novelty: 'classical',
    });

    graph.addNode(theorem);
    graph.addNode(lemma);
    graph.addNode(external);
    graph.addEdge(makeEdge(theorem.id, lemma.id));
    graph.addEdge(makeEdge(lemma.id, external.id, 'cites_external', 'external'));

    expect(graph.removeNode(lemma.id)).toBe(true);
    expect(graph.hasNode(lemma.id)).toBe(false);
    expect(graph.edgeCount).toBe(0);

    graph.addNode(lemma);
    graph.addEdge(makeEdge(theorem.id, lemma.id));
    graph.addEdge(makeEdge(lemma.id, external.id, 'cites_external', 'external'));

    const stats = graph.computeStats();

    expect(stats.nodeCounts.theorem).toBe(1);
    expect(stats.nodeCounts.lemma).toBe(1);
    expect(stats.nodeCounts.external_dependency).toBe(1);
    expect(stats.nodeCounts.total).toBe(3);
    expect(stats.edgeCounts.uses_in_proof).toBe(1);
    expect(stats.edgeCounts.cites_external).toBe(1);
    expect(stats.edgeCounts.total).toBe(2);
    expect(stats.evidenceBreakdown.explicit_ref).toBe(1);
    expect(stats.evidenceBreakdown.external).toBe(1);
  });
});
