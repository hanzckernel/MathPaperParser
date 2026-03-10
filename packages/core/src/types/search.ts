import type { NodeId } from './node.js';

export const SEARCH_MODES = ['keyword', 'semantic', 'hybrid'] as const;

export type SearchMode = (typeof SEARCH_MODES)[number];

export interface SearchQuery {
  text: string;
  mode?: SearchMode;
  limit?: number;
}

export interface SearchResult {
  nodeId: NodeId;
  score: number;
  mode: SearchMode;
  matchedText: string;
  excerpt?: string;
}
