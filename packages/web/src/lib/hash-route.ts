export type RouteKey = 'overview' | 'graph' | 'explorer' | 'innovation' | 'unknowns';

export const ROUTES: RouteKey[] = ['overview', 'graph', 'explorer', 'innovation', 'unknowns'];

export interface HashRouteState {
  route: RouteKey;
  nodeId: string | null;
}

export function parseHashRoute(hash: string): HashRouteState {
  const cleaned = hash.replace(/^#\/?/u, '');
  const [candidateRoute, candidateNodeId] = cleaned.split('/', 2);
  const route = ROUTES.includes(candidateRoute as RouteKey) ? (candidateRoute as RouteKey) : 'overview';

  return {
    route,
    nodeId: candidateNodeId ? decodeURIComponent(candidateNodeId) : null,
  };
}

export function buildHashRoute(route: RouteKey, nodeId?: string | null): string {
  if (!nodeId) {
    return `#/${route}`;
  }

  return `#/${route}/${encodeURIComponent(nodeId)}`;
}
