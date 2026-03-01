export function edgeKey(edge) {
  return `${edge.source}→${edge.target}::${edge.kind}::${edge.evidence}`;
}

export function naturalCompare(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function clamp(min, value, max) {
  return Math.max(min, Math.min(value, max));
}

