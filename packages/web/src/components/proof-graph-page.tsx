import { useState } from 'react';

import type { DashboardModel } from '../lib/dashboard-model.js';

const KIND_COLORS: Record<string, string> = {
  section: '#f97316',
  theorem: '#38bdf8',
  definition: '#4ade80',
  lemma: '#f59e0b',
  proposition: '#a78bfa',
  corollary: '#7dd3fc',
  assumption: '#f87171',
  remark: '#94a3b8',
  example: '#22d3ee',
  conjecture: '#fb7185',
  notation: '#cbd5e1',
  proof: '#facc15',
  equation: '#34d399',
  external_dependency: '#64748b',
};

const EVIDENCE_COLORS: Record<string, string> = {
  explicit_ref: '#38bdf8',
  inferred: '#f59e0b',
  external: '#94a3b8',
};

const ALL_KINDS = [
  'section',
  'definition',
  'theorem',
  'lemma',
  'proposition',
  'corollary',
  'assumption',
  'remark',
  'example',
  'conjecture',
  'notation',
  'proof',
  'equation',
  'external_dependency',
] as const;

const ALL_EVIDENCE = ['explicit_ref', 'inferred', 'external'] as const;

const SECTION_COLUMN_WIDTH = 240;
const NODE_ROW_HEIGHT = 112;
const NODE_WIDTH = 164;
const NODE_HEIGHT = 46;
const GRAPH_TOP_PADDING = 88;
const GRAPH_SIDE_PADDING = 40;

function cardStyle(): React.CSSProperties {
  return {
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: '18px',
    background: 'rgba(15, 23, 42, 0.72)',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.28)',
    padding: '1.2rem',
  };
}

function toolbarGroupStyle(): React.CSSProperties {
  return {
    display: 'grid',
    gap: '0.45rem',
    minWidth: 0,
  };
}

function tokenButtonStyle(active: boolean, accentColor?: string): React.CSSProperties {
  return {
    border: `1px solid ${active ? accentColor ?? 'rgba(56, 189, 248, 0.55)' : 'rgba(148, 163, 184, 0.24)'}`,
    borderRadius: '999px',
    padding: '0.42rem 0.75rem',
    background: active ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.42)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '0.8rem',
  };
}

function nodeButtonStyle(active: boolean): React.CSSProperties {
  return {
    width: '100%',
    textAlign: 'left',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: '12px',
    padding: '0.6rem 0.75rem',
    background: active ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.4)',
    color: 'inherit',
    cursor: 'pointer',
  };
}

function naturalCompare(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function compareNodeOrder(
  left: DashboardModel['nodes'][number],
  right: DashboardModel['nodes'][number],
): number {
  if (left.is_main_result !== right.is_main_result) {
    return left.is_main_result ? -1 : 1;
  }

  const numberCompare = naturalCompare(left.number ?? '', right.number ?? '');
  if (numberCompare !== 0) {
    return numberCompare;
  }

  const labelCompare = naturalCompare(left.label, right.label);
  if (labelCompare !== 0) {
    return labelCompare;
  }

  return naturalCompare(left.id, right.id);
}

function toggleSelection(values: string[], value: string, allValues: readonly string[]): string[] {
  if (values.includes(value)) {
    const next = values.filter((candidate) => candidate !== value);
    return next.length === 0 ? [...allValues] : next;
  }

  return [...values, value];
}

function buildNodePositions(nodes: DashboardModel['nodes'], sectionOrder: string[]): {
  width: number;
  height: number;
  positions: Map<string, { x: number; y: number }>;
} {
  const positions = new Map<string, { x: number; y: number }>();
  const nodesBySection = new Map<string, DashboardModel['nodes']>();

  for (const node of nodes) {
    const sectionNodes = nodesBySection.get(node.section) ?? [];
    sectionNodes.push(node);
    nodesBySection.set(node.section, sectionNodes);
  }

  const orderedSections = sectionOrder.filter((section) => nodesBySection.has(section));
  const extraSections = [...nodesBySection.keys()].filter((section) => !orderedSections.includes(section)).sort(naturalCompare);
  const allSections = [...orderedSections, ...extraSections];

  let maxRows = 1;
  for (const section of allSections) {
    const sectionNodes = (nodesBySection.get(section) ?? []).sort(compareNodeOrder);
    maxRows = Math.max(maxRows, sectionNodes.length);
    sectionNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: GRAPH_SIDE_PADDING + allSections.indexOf(section) * SECTION_COLUMN_WIDTH + SECTION_COLUMN_WIDTH / 2,
        y: GRAPH_TOP_PADDING + index * NODE_ROW_HEIGHT,
      });
    });
  }

  return {
    width: Math.max(760, allSections.length * SECTION_COLUMN_WIDTH + GRAPH_SIDE_PADDING * 2),
    height: Math.max(420, GRAPH_TOP_PADDING + maxRows * NODE_ROW_HEIGHT + 80),
    positions,
  };
}

function sectionTitle(model: DashboardModel, section: string): string {
  return model.sections.find((candidate) => candidate.section === section)?.title ?? '(untitled)';
}

export function GraphPage({
  model,
  selectedNodeId,
  onSelectNode,
}: {
  model: DashboardModel;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [visibleKinds, setVisibleKinds] = useState<string[]>([...ALL_KINDS]);
  const [visibleEvidence, setVisibleEvidence] = useState<string[]>([...ALL_EVIDENCE]);

  const loweredQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredNodes = model.nodes.filter((node) => {
    if (!visibleKinds.includes(node.kind)) {
      return false;
    }

    if (sectionFilter !== 'all' && node.section !== sectionFilter) {
      return false;
    }

    if (loweredQuery === '') {
      return true;
    }

    return [node.label, node.number, node.statement, node.section_title]
      .filter((value) => typeof value === 'string')
      .some((value) => value.toLocaleLowerCase().includes(loweredQuery));
  });
  const visibleNodeIds = new Set(filteredNodes.map((node) => node.id));
  const filteredEdges = model.edges.filter(
    (edge) => visibleEvidence.includes(edge.evidence) && visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
  );
  const filteredNodeIdsWithEdges = new Set<string>();
  for (const edge of filteredEdges) {
    filteredNodeIdsWithEdges.add(edge.source);
    filteredNodeIdsWithEdges.add(edge.target);
  }

  const selectedNode =
    selectedNodeId && visibleNodeIds.has(selectedNodeId)
      ? model.nodeById.get(selectedNodeId) ?? null
      : null;
  const selectedNodeHidden = Boolean(selectedNodeId && !visibleNodeIds.has(selectedNodeId));
  const graphNodes = filteredNodes.sort(compareNodeOrder);
  const { positions, width, height } = buildNodePositions(graphNodes, model.sections.map((section) => section.section));
  const outgoing = selectedNode ? filteredEdges.filter((edge) => edge.source === selectedNode.id) : [];
  const incoming = selectedNode ? filteredEdges.filter((edge) => edge.target === selectedNode.id) : [];

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section style={cardStyle()}>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(180px, 0.8fr) minmax(160px, 1fr)' }}>
          <label style={toolbarGroupStyle()}>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Search graph</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="label, number, statement"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                background: 'rgba(15, 23, 42, 0.55)',
                color: '#e2e8f0',
                padding: '0.72rem 0.85rem',
              }}
            />
          </label>

          <label style={toolbarGroupStyle()}>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Section</span>
            <select
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                background: 'rgba(15, 23, 42, 0.55)',
                color: '#e2e8f0',
                padding: '0.72rem 0.85rem',
              }}
            >
              <option value="all">All sections</option>
              {model.sections.map((section) => (
                <option key={section.section} value={section.section}>
                  {section.section}. {section.title || '(untitled)'}
                </option>
              ))}
            </select>
          </label>

          <div style={toolbarGroupStyle()}>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Visible graph</span>
            <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              {graphNodes.length} nodes · {filteredEdges.length} edges
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kinds</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {ALL_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setVisibleKinds((current) => toggleSelection(current, kind, ALL_KINDS))}
                  style={tokenButtonStyle(visibleKinds.includes(kind), KIND_COLORS[kind])}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Evidence</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {ALL_EVIDENCE.map((evidence) => (
                <button
                  key={evidence}
                  type="button"
                  onClick={() => setVisibleEvidence((current) => toggleSelection(current, evidence, ALL_EVIDENCE))}
                  style={tokenButtonStyle(visibleEvidence.includes(evidence), EVIDENCE_COLORS[evidence])}
                >
                  {evidence}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.75fr)' }}>
        <section style={cardStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', marginBottom: '0.9rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Proof Graph</h2>
              <p style={{ margin: '0.35rem 0 0', color: '#94a3b8' }}>
                Filtered structural view of theorem dependencies across sections.
              </p>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              {model.mainResults.length} main result{model.mainResults.length === 1 ? '' : 's'}
            </div>
          </div>

          {graphNodes.length === 0 ? (
            <div style={{ color: '#94a3b8' }}>No graph nodes match the current filters.</div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
              <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="PaperParser proof graph" style={{ display: 'block', width: '100%', minWidth: `${Math.min(width, 900)}px`, background: 'rgba(2, 6, 23, 0.72)' }}>
                <defs>
                  <marker id="proof-graph-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                  </marker>
                </defs>

                {model.sections
                  .filter((section) => graphNodes.some((node) => node.section === section.section))
                  .map((section) => {
                    const sectionNodes = graphNodes.filter((node) => node.section === section.section);
                    const anchor = positions.get(sectionNodes[0]?.id ?? '');
                    if (!anchor) {
                      return null;
                    }

                    return (
                      <g key={section.section}>
                        <text x={anchor.x} y={42} textAnchor="middle" fill="#f8fafc" fontSize="18" fontWeight="700">
                          Section {section.section}
                        </text>
                        <text x={anchor.x} y={62} textAnchor="middle" fill="#94a3b8" fontSize="12">
                          {sectionTitle(model, section.section)}
                        </text>
                      </g>
                    );
                  })}

                {filteredEdges.map((edge) => {
                  const source = positions.get(edge.source);
                  const target = positions.get(edge.target);
                  if (!source || !target) {
                    return null;
                  }

                  return (
                    <line
                      key={`${edge.source}-${edge.target}-${edge.kind}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={EVIDENCE_COLORS[edge.evidence] ?? '#64748b'}
                      strokeWidth={selectedNode?.id === edge.source || selectedNode?.id === edge.target ? 2.8 : 1.6}
                      opacity={selectedNode ? (selectedNode.id === edge.source || selectedNode.id === edge.target ? 1 : 0.28) : 0.7}
                      markerEnd="url(#proof-graph-arrow)"
                    />
                  );
                })}

                {graphNodes.map((node) => {
                  const position = positions.get(node.id);
                  if (!position) {
                    return null;
                  }

                  const isSelected = selectedNode?.id === node.id;
                  const isConnected = selectedNode ? filteredNodeIdsWithEdges.has(node.id) : false;
                  const fill = KIND_COLORS[node.kind] ?? '#94a3b8';
                  const opacity = selectedNode ? (isSelected || isConnected ? 1 : 0.36) : 1;

                  return (
                    <g key={node.id} transform={`translate(${position.x}, ${position.y})`} opacity={opacity} onClick={() => onSelectNode(node.id)} style={{ cursor: 'pointer' }}>
                      <rect
                        x={-NODE_WIDTH / 2}
                        y={-NODE_HEIGHT / 2}
                        width={NODE_WIDTH}
                        height={NODE_HEIGHT}
                        rx={14}
                        fill="rgba(15, 23, 42, 0.92)"
                        stroke={isSelected ? '#fbbf24' : node.is_main_result ? fill : 'rgba(148, 163, 184, 0.3)'}
                        strokeWidth={isSelected ? 3 : node.is_main_result ? 2.2 : 1.2}
                      />
                      <circle cx={-NODE_WIDTH / 2 + 18} cy={0} r={7} fill={fill} />
                      <text x={-NODE_WIDTH / 2 + 32} y={-2} fill="#f8fafc" fontSize="11.5" fontWeight="700">
                        {node.label.slice(0, 26)}
                        {node.label.length > 26 ? '…' : ''}
                      </text>
                      <text x={-NODE_WIDTH / 2 + 32} y={14} fill="#94a3b8" fontSize="10.5">
                        {node.kind} · {node.number || 'unnumbered'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </section>

        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Graph Detail</h2>
          {selectedNodeHidden ? (
            <p style={{ color: '#94a3b8' }}>The selected node is hidden by the current filters. Clear the search or widen the filters to reveal it again.</p>
          ) : selectedNode ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.08rem' }}>{selectedNode.label}</div>
                <div style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
                  {selectedNode.kind} · Section {selectedNode.section} · {selectedNode.proof_status}
                </div>
              </div>

              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#e2e8f0' }}>{selectedNode.statement}</div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                <span style={tokenButtonStyle(true, KIND_COLORS[selectedNode.kind])}>{selectedNode.kind}</span>
                {selectedNode.is_main_result ? <span style={tokenButtonStyle(true, '#fbbf24')}>main result</span> : null}
                <span style={tokenButtonStyle(true, '#64748b')}>{selectedNode.novelty}</span>
              </div>

              <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.55rem' }}>Uses</div>
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    {outgoing.length === 0 ? <div style={{ color: '#94a3b8' }}>(none visible)</div> : null}
                    {outgoing.map((edge) => (
                      <button key={`${edge.source}-${edge.target}-${edge.kind}`} type="button" onClick={() => onSelectNode(edge.target)} style={nodeButtonStyle(false)}>
                        <div>{model.nodeById.get(edge.target)?.label ?? edge.target}</div>
                        <div style={{ color: '#94a3b8', marginTop: '0.2rem', fontSize: '0.82rem' }}>{edge.kind} · {edge.evidence}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.55rem' }}>Used By</div>
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    {incoming.length === 0 ? <div style={{ color: '#94a3b8' }}>(none visible)</div> : null}
                    {incoming.map((edge) => (
                      <button key={`${edge.source}-${edge.target}-${edge.kind}`} type="button" onClick={() => onSelectNode(edge.source)} style={nodeButtonStyle(false)}>
                        <div>{model.nodeById.get(edge.source)?.label ?? edge.source}</div>
                        <div style={{ color: '#94a3b8', marginTop: '0.2rem', fontSize: '0.82rem' }}>{edge.kind} · {edge.evidence}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>Select a node in the graph to inspect its theorem statement and dependency neighborhood.</p>
          )}
        </section>
      </div>
    </div>
  );
}
