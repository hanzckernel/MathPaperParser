import type { SearchQuery, SearchResult } from '../types/search.js';
import type { MathNode } from '../types/node.js';

interface SearchCandidate {
  node: MathNode;
  score: number;
  matchedText: string;
  excerpt: string;
}

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function countTokenMatches(tokens: string[], haystack: string): number {
  const normalizedHaystack = haystack.toLowerCase();
  return tokens.filter((token) => normalizedHaystack.includes(token)).length;
}

function firstExcerpt(statement: string): string {
  const normalized = statement.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function scoreNode(node: MathNode, queryText: string, tokens: string[]): SearchCandidate | undefined {
  const normalizedQuery = queryText.trim().toLowerCase();
  if (!normalizedQuery) {
    return undefined;
  }

  const label = node.label;
  const number = node.number;
  const statement = node.statement;
  const sectionTitle = node.sectionTitle;
  const kind = node.kind;
  const latexLabel = node.latexLabel ?? '';

  let score = 0;
  let matchedText = label;

  if (label.toLowerCase().includes(normalizedQuery)) {
    score += 12;
    matchedText = label;
  }

  if (statement.toLowerCase().includes(normalizedQuery)) {
    score += 8;
    matchedText = statement;
  }

  if (number.toLowerCase().includes(normalizedQuery)) {
    score += 10;
    matchedText = number;
  }

  if (latexLabel.toLowerCase().includes(normalizedQuery)) {
    score += 11;
    matchedText = latexLabel;
  }

  if (kind.toLowerCase().includes(normalizedQuery)) {
    score += 5;
    matchedText = kind;
  }

  const labelMatches = countTokenMatches(tokens, label);
  const numberMatches = countTokenMatches(tokens, number);
  const statementMatches = countTokenMatches(tokens, statement);
  const sectionMatches = countTokenMatches(tokens, sectionTitle);
  const kindMatches = countTokenMatches(tokens, kind);
  const latexLabelMatches = countTokenMatches(tokens, latexLabel);

  score += labelMatches * 4;
  score += numberMatches * 5;
  score += statementMatches * 2;
  score += sectionMatches;
  score += kindMatches * 3;
  score += latexLabelMatches * 5;

  if (node.isMainResult) {
    score += 1;
  }

  if (score === 0) {
    return undefined;
  }

  if (labelMatches > 0) {
    matchedText = label;
  } else if (numberMatches > 0) {
    matchedText = number;
  } else if (latexLabelMatches > 0) {
    matchedText = latexLabel;
  } else if (kindMatches > 0) {
    matchedText = kind;
  } else if (statementMatches > 0) {
    matchedText = statement;
  } else if (sectionMatches > 0) {
    matchedText = sectionTitle;
  }

  return {
    node,
    score,
    matchedText,
    excerpt: firstExcerpt(statement),
  };
}

export function runKeywordSearch(nodes: Iterable<MathNode>, query: SearchQuery): SearchResult[] {
  const tokens = tokenize(query.text);
  const limit = query.limit ?? 10;

  return [...nodes]
    .map((node) => scoreNode(node, query.text, tokens))
    .filter((candidate): candidate is SearchCandidate => candidate !== undefined)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.node.id.localeCompare(right.node.id);
    })
    .slice(0, limit)
    .map((candidate) => ({
      nodeId: candidate.node.id,
      score: candidate.score,
      mode: 'keyword',
      matchedText: candidate.matchedText,
      excerpt: candidate.excerpt,
      nodeKind: candidate.node.kind,
      label: candidate.node.label,
      number: candidate.node.number,
      section: candidate.node.section,
      sectionTitle: candidate.node.sectionTitle,
      latexLabel: candidate.node.latexLabel,
    }));
}
