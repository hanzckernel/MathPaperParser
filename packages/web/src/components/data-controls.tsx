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
  searchQuery: string;
  searchResults: BundleSearchResultItem[];
  onSearchQueryChange: (value: string) => void;
}

export interface BundleSearchResultItem {
  nodeId: string;
  nodeKind: string;
  label: string;
  number: string;
  section: string;
  sectionTitle: string;
  latexLabel: string | null;
  matchedText: string;
  excerpt?: string;
  href: string;
}

export function BundleDataControls(props: BundleDataControlsProps) {
  const hasSearchQuery = props.searchQuery.trim().length > 0;

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

          {props.apiListing ? (
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Local corpus</div>
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {props.apiListing.papers.map((paper) => {
                  const selected = paper.paperId === props.selectedPaperId;
                  return (
                    <button
                      key={`corpus-${paper.paperId}`}
                      type="button"
                      onClick={() => props.onSelectedPaperChange(paper.paperId)}
                      style={{
                        textAlign: 'left',
                        borderRadius: '14px',
                        border: selected ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(148, 163, 184, 0.22)',
                        background: selected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.38)',
                        color: '#e5eef9',
                        padding: '0.85rem 0.95rem',
                        cursor: 'pointer',
                        display: 'grid',
                        gap: '0.45rem',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{paper.title}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        {paper.paperId} · {paper.sourceType} · {paper.year}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.82rem' }}>
                        {paper.isLatest ? <span style={{ color: '#fbbf24' }}>Latest</span> : null}
                        <span style={{ color: '#cbd5e1' }}>{paper.warningCount} warnings</span>
                        <span style={{ color: paper.hasEnrichment ? '#86efac' : '#94a3b8' }}>
                          {paper.hasEnrichment ? 'Enrichment ready' : 'No enrichment'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Search this paper</span>
          <input
            value={props.searchQuery}
            onChange={(event) => props.onSearchQueryChange(event.target.value)}
            placeholder="label, theorem number, latex label"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(15, 23, 42, 0.55)',
              color: '#e5eef9',
              padding: '0.75rem 0.85rem',
            }}
          />
        </label>

        {props.searchResults.length > 0 ? (
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {props.searchResults.map((result) => (
              <a
                key={`${result.nodeId}-${result.href}`}
                href={result.href}
                style={{
                  display: 'grid',
                  gap: '0.35rem',
                  textDecoration: 'none',
                  borderRadius: '14px',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  padding: '0.85rem 0.95rem',
                  background: 'rgba(15, 23, 42, 0.45)',
                  color: '#e5eef9',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                  <strong>{result.label}</strong>
                  <span style={{ color: '#38bdf8', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {result.nodeKind}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                    Section {result.section}
                    {result.sectionTitle ? ` · ${result.sectionTitle}` : ''}
                  </span>
                </div>
                <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                  Match: {result.matchedText}
                  {result.number ? ` · ${result.number}` : ''}
                  {result.latexLabel ? ` · ${result.latexLabel}` : ''}
                </div>
                {result.excerpt ? <div style={{ color: '#94a3b8', fontSize: '0.92rem' }}>{result.excerpt}</div> : null}
                <div style={{ color: '#38bdf8', fontWeight: 600 }}>Open in Explorer</div>
              </a>
            ))}
          </div>
        ) : null}

        {hasSearchQuery && props.searchResults.length === 0 ? (
          <div
            style={{
              borderRadius: '12px',
              border: '1px dashed rgba(148, 163, 184, 0.24)',
              padding: '0.85rem 0.95rem',
              color: '#94a3b8',
            }}
          >
            <strong style={{ color: '#e5eef9' }}>No matches in this paper</strong>
            <div>Try a label, theorem number, or a distinctive phrase from the statement.</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
