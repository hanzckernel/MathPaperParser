import { useDeferredValue, useEffect, useState } from 'react';

import type { CrossPaperLinkResult, CrossPaperMatch } from '@paperparser/core';
import { BundleQueryService } from '../../core/src/services/bundle-query-service.js';
import { BundleSerializer, type SerializedPaperParserBundle } from '../../core/src/serialization/bundle-serializer.js';
import type { SearchResult } from '../../core/src/types/search.js';

import { BundleDataControls, type BundleSearchResultItem } from './components/data-controls.js';
import {
  ExplorerPage,
  GraphPage,
  InnovationPage,
  OverviewPage,
  UnknownsPage,
} from './components/dashboard-pages.js';
import { RuntimeBlockerPage } from './components/runtime-blocker.js';
import { getCrossPaperLinks, listApiPapers, type ApiPaperListing, uploadSourceDocument } from './lib/api-client.js';
import { buildDashboardModel, type DashboardModel } from './lib/dashboard-model.js';
import {
  loadSerializedPaperData,
  readBrowserRuntimeApiConfig,
  resolveBundleSource,
  type BrowserRuntimeApiConfig,
  type BundleSource,
} from './lib/data-source.js';
import { buildHashRoute, parseHashRoute, ROUTES, type RouteKey } from './lib/hash-route.js';
import { getStaticBundleLoadBlocker } from './lib/runtime-environment.js';

function appShellStyle(): React.CSSProperties {
  return {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top, rgba(234, 179, 8, 0.14), transparent 30%), radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.12), transparent 25%), #0f172a',
    color: '#e5eef9',
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  };
}

function cardStyle(): React.CSSProperties {
  return {
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: '18px',
    background: 'rgba(15, 23, 42, 0.72)',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.28)',
    padding: '1.2rem',
  };
}

function navButtonStyle(active: boolean): React.CSSProperties {
  return {
    border: '1px solid rgba(148, 163, 184, 0.24)',
    borderRadius: '999px',
    padding: '0.55rem 0.95rem',
    background: active ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.55)',
    color: active ? '#f8fafc' : '#cbd5e1',
    cursor: 'pointer',
    textTransform: 'capitalize',
    letterSpacing: '0.03em',
  };
}

function sourceToSearch(source: BundleSource, runtimeConfig: BrowserRuntimeApiConfig | null): string {
  if (source.kind === 'static') {
    return '';
  }

  if (
    runtimeConfig &&
    runtimeConfig.kind === 'api' &&
    source.baseUrl === runtimeConfig.baseUrl &&
    source.paperId === (runtimeConfig.paperId ?? 'latest')
  ) {
    return '';
  }

  const params = new URLSearchParams();
  params.set('api', source.baseUrl);
  params.set('paper', source.paperId);
  return `?${params.toString()}`;
}

function selectedPaperIdForControls(source: BundleSource, apiListing: ApiPaperListing | null): string | undefined {
  if (source.kind !== 'api') {
    return undefined;
  }

  if (source.paperId === 'latest') {
    return apiListing?.latestPaperId ?? undefined;
  }

  return source.paperId;
}

function buildSearchResults(
  serializedBundle: SerializedPaperParserBundle | null,
  queryText: string,
): SearchResult[] {
  if (!serializedBundle || queryText.trim() === '') {
    return [];
  }

  const service = new BundleQueryService(BundleSerializer.fromJsonBundle(serializedBundle));
  return service.search({ text: queryText, limit: 8 });
}

export function App() {
  const initialHashRoute = typeof window === 'undefined' ? { route: 'overview' as RouteKey, nodeId: null } : parseHashRoute(window.location.hash);
  const runtimeConfig = typeof window === 'undefined' ? null : readBrowserRuntimeApiConfig(window);
  const [route, setRoute] = useState<RouteKey>(() => initialHashRoute.route);
  const [source, setSource] = useState<BundleSource>(() =>
    typeof window === 'undefined'
      ? { kind: 'static', basePath: './data' }
      : resolveBundleSource(window.location.search, runtimeConfig),
  );
  const [model, setModel] = useState<DashboardModel | null>(null);
  const [serializedBundle, setSerializedBundle] = useState<SerializedPaperParserBundle | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => initialHashRoute.nodeId);
  const [apiListing, setApiListing] = useState<ApiPaperListing | null>(null);
  const [pendingPaperId, setPendingPaperId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [crossPaperLinks, setCrossPaperLinks] = useState<CrossPaperLinkResult | null>(null);
  const [crossPaperStatus, setCrossPaperStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [crossPaperError, setCrossPaperError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const selectedPaperId = selectedPaperIdForControls(source, apiListing);
  const currentPaper = selectedPaperId ? apiListing?.papers.find((paper) => paper.paperId === selectedPaperId) : undefined;
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchResults: BundleSearchResultItem[] = buildSearchResults(serializedBundle, deferredSearchQuery).map((result) => ({
    ...result,
    href: buildHashRoute('explorer', result.nodeId),
  }));

  useEffect(() => {
    const apply = () => {
      const nextRoute = parseHashRoute(window.location.hash);
      setRoute(nextRoute.route);
      if (nextRoute.nodeId) {
        setSelectedNodeId(nextRoute.nodeId);
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextSearch = sourceToSearch(source, runtimeConfig);
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash || '#/overview'}`;
    window.history.replaceState(null, '', nextUrl);
  }, [runtimeConfig, source]);

  useEffect(() => {
    if (source.kind !== 'api') {
      setApiListing(null);
      return;
    }

    let cancelled = false;
    listApiPapers(source.baseUrl)
      .then((listing) => {
        if (!cancelled) {
          setApiListing(listing);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiListing(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    setSerializedBundle(null);

    const blocker =
      typeof window === 'undefined' ? null : getStaticBundleLoadBlocker(source, window.location.protocol);
    if (blocker) {
      setStatus('error');
      setError(blocker);
      return () => {
        cancelled = true;
      };
    }

    loadSerializedPaperData(source)
      .then(({ bundle, enrichment }) => {
        if (cancelled) {
          return;
        }

        setSerializedBundle(bundle);
        const nextModel = buildDashboardModel(bundle, enrichment);
        setModel(nextModel);
        setSelectedNodeId((current) => {
          const hashNodeId = typeof window === 'undefined' ? null : parseHashRoute(window.location.hash).nodeId;
          if (hashNodeId && nextModel.nodeById.has(hashNodeId)) {
            return hashNodeId;
          }
          if (current && nextModel.nodeById.has(current)) {
            return current;
          }
          return nextModel.mainResults[0]?.nodeId ?? nextModel.nodes[0]?.id ?? null;
        });
        setStatus('ready');
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setSerializedBundle(null);
        setStatus('error');
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    if (source.kind !== 'api' || route !== 'explorer' || !selectedPaperId || !selectedNodeId) {
      setCrossPaperLinks(null);
      setCrossPaperStatus('idle');
      setCrossPaperError(null);
      return;
    }

    let cancelled = false;
    setCrossPaperStatus('loading');
    setCrossPaperError(null);
    getCrossPaperLinks(source.baseUrl, selectedPaperId, selectedNodeId)
      .then((result) => {
        if (!cancelled) {
          setCrossPaperLinks(result);
          setCrossPaperStatus('ready');
        }
      })
      .catch((relatedError) => {
        if (!cancelled) {
          setCrossPaperLinks(null);
          setCrossPaperStatus('error');
          setCrossPaperError(relatedError instanceof Error ? relatedError.message : String(relatedError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [route, selectedNodeId, selectedPaperId, source]);

  const openRelatedMatch = (match: CrossPaperMatch) => {
    if (source.kind !== 'api') {
      return;
    }

    setSelectedNodeId(match.targetNodeId);
    setSource({
      ...source,
      paperId: match.targetPaperId,
    });
    window.location.hash = buildHashRoute('explorer', match.targetNodeId);
  };

  const page = (() => {
    if (!model) {
      return null;
    }

    switch (route) {
      case 'overview':
        return (
          <OverviewPage
            model={model}
            onSelectNode={(nodeId) => {
              setSelectedNodeId(nodeId);
              window.location.hash = buildHashRoute('explorer', nodeId);
            }}
          />
        );
      case 'graph':
        return (
          <GraphPage
            model={model}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        );
      case 'explorer':
        return (
          <ExplorerPage
            model={model}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            crossPaperStatus={crossPaperStatus}
            crossPaperLinks={crossPaperLinks}
            crossPaperError={crossPaperError}
            onOpenRelated={openRelatedMatch}
            {...(currentPaper ? { currentPaper } : {})}
          />
        );
      case 'innovation':
        return <InnovationPage model={model} />;
      case 'unknowns':
        return <UnknownsPage model={model} />;
    }
  })();

  const runtimeBlocker =
    status === 'error' && error?.includes('served over HTTP')
      ? (
          <RuntimeBlockerPage
            title="Static export requires a local server"
            message={error}
          />
        )
      : null;

  if (runtimeBlocker) {
    return runtimeBlocker;
  }

  return (
    <main style={appShellStyle()}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem 3rem' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.22em', color: '#fbbf24', marginBottom: '0.75rem' }}>
            PaperParser v2 Alpha
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'end' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(2.1rem, 4vw, 3.7rem)' }}>{model?.title ?? 'Loading bundle...'}</h1>
              <p style={{ margin: '0.6rem 0 0', color: '#cbd5e1' }}>
                {model ? `${model.sourceType} · ${model.year} · ${model.authors.join(', ')}` : 'Static export and API-backed loading are now wired into the React dashboard.'}
              </p>
            </div>
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {ROUTES.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => {
                    window.location.hash = buildHashRoute(candidate, candidate === 'explorer' ? selectedNodeId : null);
                  }}
                  style={navButtonStyle(route === candidate)}
                >
                  {candidate}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {status === 'loading' ? (
          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Loading bundle…</h2>
            <p style={{ color: '#94a3b8' }}>Expected exported files under <code>./data</code> or an API base from <code>?api=...</code>.</p>
          </section>
        ) : null}

        {status === 'error' ? (
          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Failed to load data</h2>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#fecaca' }}>{error}</pre>
          </section>
        ) : null}

        <BundleDataControls
          sourceKind={source.kind}
          apiListing={apiListing}
          pendingPaperId={pendingPaperId}
          searchQuery={searchQuery}
          searchResults={searchResults}
          uploadStatus={uploadStatus}
          uploadMessage={uploadMessage}
          {...(source.kind === 'api' ? { apiBaseUrl: source.baseUrl } : {})}
          {...(selectedPaperId ? { selectedPaperId } : {})}
          onSearchQueryChange={setSearchQuery}
          onRefreshPapers={() => {
            if (source.kind !== 'api') {
              return;
            }

            listApiPapers(source.baseUrl)
              .then((listing) => setApiListing(listing))
              .catch((refreshError) => {
                setUploadStatus('error');
                setUploadMessage(refreshError instanceof Error ? refreshError.message : String(refreshError));
              });
          }}
          onSelectedPaperChange={(paperId) => {
            if (source.kind !== 'api') {
              return;
            }

            setSource({
              ...source,
              paperId,
            });
          }}
          onPaperIdInputChange={setPendingPaperId}
          onUploadFileChange={(file) => {
            if (source.kind !== 'api' || !file) {
              return;
            }

            setUploadStatus('uploading');
            setUploadMessage(`Uploading ${file.name}…`);

            void uploadSourceDocument(source.baseUrl, {
              file,
              ...(pendingPaperId.trim() ? { paperId: pendingPaperId.trim() } : {}),
            })
              .then((uploaded) => {
                setUploadStatus('success');
                setUploadMessage(`Uploaded ${uploaded.paperId}: ${uploaded.manifest.paper.title}`);
                setPendingPaperId('');
                setSource({
                  ...source,
                  paperId: uploaded.paperId,
                });
                return listApiPapers(source.baseUrl);
              })
              .then((listing) => {
                setApiListing(listing);
              })
              .catch((uploadError) => {
                setUploadStatus('error');
                setUploadMessage(uploadError instanceof Error ? uploadError.message : String(uploadError));
              });
          }}
        />

        {status === 'ready' ? page : null}
      </div>
    </main>
  );
}
