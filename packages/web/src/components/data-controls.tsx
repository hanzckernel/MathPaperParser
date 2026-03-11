import type { ApiPaperListing } from '../lib/api-client.js';

function cardStyle(): React.CSSProperties {
  return {
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: '18px',
    background: 'rgba(15, 23, 42, 0.72)',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.28)',
    padding: '1.2rem',
  };
}

export interface BundleDataControlsProps {
  sourceKind: 'static' | 'api';
  apiBaseUrl?: string;
  selectedPaperId?: string;
  apiListing: ApiPaperListing | null;
  pendingPaperId: string;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadMessage: string | null;
  onRefreshPapers: () => void;
  onSelectedPaperChange: (paperId: string) => void;
  onPaperIdInputChange: (value: string) => void;
  onUploadFileChange: (file: File | null) => void;
}

export function BundleDataControls(props: BundleDataControlsProps) {
  return (
    <section style={cardStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ textTransform: 'uppercase', letterSpacing: '0.16em', color: '#fbbf24', fontSize: '0.78rem' }}>
            {props.sourceKind === 'api' ? 'API Mode' : 'Static Export'}
          </div>
          <h2 style={{ margin: '0.35rem 0 0' }}>Bundle Source Controls</h2>
        </div>
        {props.sourceKind === 'api' && props.apiBaseUrl ? (
          <div style={{ color: '#94a3b8', fontSize: '0.92rem' }}>Connected to {props.apiBaseUrl}</div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.92rem' }}>Reading exported files from <code>./data</code></div>
        )}
      </div>

      {props.sourceKind === 'api' ? (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'minmax(220px, 1fr) auto' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Stored paper</span>
              <select
                value={props.selectedPaperId ?? ''}
                onChange={(event) => props.onSelectedPaperChange(event.target.value)}
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#e5eef9',
                  padding: '0.75rem 0.85rem',
                }}
              >
                {(props.apiListing?.papers ?? []).map((paper) => (
                  <option key={paper.paperId} value={paper.paperId}>
                    {paper.paperId} · {paper.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={props.onRefreshPapers}
              style={{
                alignSelf: 'end',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'rgba(15, 23, 42, 0.45)',
                color: '#e5eef9',
                padding: '0.75rem 0.95rem',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>

          <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Optional paper id</span>
              <input
                value={props.pendingPaperId}
                onChange={(event) => props.onPaperIdInputChange(event.target.value)}
                placeholder="uploaded-paper"
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#e5eef9',
                  padding: '0.75rem 0.85rem',
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Upload .tex or .md</span>
              <input
                type="file"
                accept=".tex,.md,.pdf"
                onChange={(event) => props.onUploadFileChange(event.target.files?.[0] ?? null)}
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#e5eef9',
                  padding: '0.7rem 0.85rem',
                }}
              />
            </label>
          </div>

          <div style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
            PDF upload stays visible for beta, but alpha robustness is focused on TeX and Markdown.
          </div>
          {props.uploadMessage ? (
            <div
              style={{
                borderRadius: '12px',
                padding: '0.75rem 0.9rem',
                background:
                  props.uploadStatus === 'error'
                    ? 'rgba(127, 29, 29, 0.42)'
                    : props.uploadStatus === 'success'
                      ? 'rgba(20, 83, 45, 0.38)'
                      : 'rgba(15, 23, 42, 0.45)',
                color: props.uploadStatus === 'error' ? '#fecaca' : '#dbeafe',
              }}
            >
              {props.uploadMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
