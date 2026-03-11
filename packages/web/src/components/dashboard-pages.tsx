import type { DashboardModel } from '../lib/dashboard-model.js';
export { GraphPage } from './proof-graph-page.js';

function cardStyle(): React.CSSProperties {
  return {
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: '18px',
    background: 'rgba(15, 23, 42, 0.72)',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.28)',
    padding: '1.2rem',
  };
}

export function OverviewPage({
  model,
  onSelectNode,
}: {
  model: DashboardModel;
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Problem Statement</h2>
          <p>{model.problemStatement.question}</p>
          <p style={{ color: '#cbd5e1' }}>{model.problemStatement.motivation}</p>
          <p style={{ color: '#94a3b8' }}>{model.problemStatement.context}</p>
        </section>
        <section style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Key Stats</h2>
          <p>{model.stats.node_counts.total} nodes</p>
          <p>{model.stats.edge_counts.total} edges</p>
          <p>{model.sectionCount} sections</p>
        </section>
      </div>

      <section style={cardStyle()}>
        <h2 style={{ marginTop: 0 }}>Main Results</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {model.mainResults.map((result) => (
            <button
              key={result.nodeId}
              type="button"
              onClick={() => onSelectNode(result.nodeId)}
              style={{
                textAlign: 'left',
                border: '1px solid rgba(56, 189, 248, 0.28)',
                borderRadius: '14px',
                padding: '0.9rem',
                background: 'rgba(15, 23, 42, 0.45)',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700 }}>{result.label}</div>
              <div>{result.headline}</div>
              <div style={{ color: '#94a3b8' }}>{result.significance}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ExplorerPage({
  model,
  selectedNodeId,
  onSelectNode,
}: {
  model: DashboardModel;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const selectedNode = selectedNodeId ? model.nodeById.get(selectedNodeId) ?? null : null;
  const outgoing = selectedNode ? model.outgoingById.get(selectedNode.id) ?? [] : [];
  const incoming = selectedNode ? model.incomingById.get(selectedNode.id) ?? [] : [];

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(240px, 320px) 1fr' }}>
      <section style={cardStyle()}>
        <h2 style={{ marginTop: 0 }}>Sections</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {model.sections.map((section) => (
            <div key={section.section}>
              <div style={{ fontWeight: 700 }}>
                Section {section.section}: {section.title || '(untitled)'}
              </div>
              <div style={{ color: '#94a3b8', marginBottom: '0.45rem' }}>{section.summary || '(no summary)'}</div>
              <div style={{ display: 'grid', gap: '0.45rem' }}>
                {section.nodeIds.map((nodeId) => (
                  <button
                    key={nodeId}
                    type="button"
                    onClick={() => onSelectNode(nodeId)}
                    style={{
                      textAlign: 'left',
                      border: '1px solid rgba(148, 163, 184, 0.22)',
                      borderRadius: '12px',
                      padding: '0.55rem 0.7rem',
                      background: selectedNodeId === nodeId ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.35)',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {model.nodeById.get(nodeId)?.label ?? nodeId}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={cardStyle()}>
        <h2 style={{ marginTop: 0 }}>Theorem Explorer</h2>
        {selectedNode ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedNode.label}</div>
              <div style={{ color: '#94a3b8' }}>
                {selectedNode.kind} · {selectedNode.proof_status}
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedNode.statement}</div>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div>
                <strong>Uses</strong>
                {outgoing.length === 0 ? <div style={{ color: '#94a3b8' }}>(none)</div> : null}
                {outgoing.map((edge) => (
                  <div key={`${edge.source}-${edge.target}-${edge.kind}`}>{model.nodeById.get(edge.target)?.label ?? edge.target}</div>
                ))}
              </div>
              <div>
                <strong>Used By</strong>
                {incoming.length === 0 ? <div style={{ color: '#94a3b8' }}>(none)</div> : null}
                {incoming.map((edge) => (
                  <div key={`${edge.source}-${edge.target}-${edge.kind}`}>{model.nodeById.get(edge.source)?.label ?? edge.source}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>Select a result from the left column.</p>
        )}
      </section>
    </div>
  );
}

export function InnovationPage({ model }: { model: DashboardModel }) {
  return (
    <section style={cardStyle()}>
      <h2 style={{ marginTop: 0 }}>Innovation Map</h2>
      <p>{model.innovationAssessment.summary}</p>
      <div style={{ display: 'grid', gap: '0.8rem' }}>
        {model.innovationAssessment.main_innovations.map((innovation, index) => (
          <div key={`${innovation.description}-${index}`}>
            <strong>{innovation.calibration}</strong>
            <div>{innovation.description}</div>
          </div>
        ))}
      </div>
      <p style={{ color: '#94a3b8', marginTop: '1rem' }}>{model.innovationAssessment.prior_work_comparison}</p>
    </section>
  );
}

export function UnknownsPage({ model }: { model: DashboardModel }) {
  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <section style={cardStyle()}>
        <h2 style={{ marginTop: 0 }}>Unknowns</h2>
        {model.unknowns.length === 0 ? <p style={{ color: '#94a3b8' }}>No unknowns recorded.</p> : null}
        {model.unknowns.map((unknown) => (
          <div key={unknown.id} style={{ marginBottom: '0.9rem' }}>
            <strong>{unknown.scope}</strong>
            <div>{unknown.description}</div>
            <div style={{ color: '#94a3b8' }}>{unknown.search_hint}</div>
          </div>
        ))}
      </section>
      <section style={cardStyle()}>
        <h2 style={{ marginTop: 0 }}>Notation</h2>
        {model.notationIndex.length === 0 ? <p style={{ color: '#94a3b8' }}>No notation entries recorded.</p> : null}
        {model.notationIndex.map((entry) => (
          <div key={`${entry.symbol}-${entry.introduced_in}`} style={{ marginBottom: '0.9rem' }}>
            <strong>{entry.symbol}</strong>
            <div>{entry.meaning}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
