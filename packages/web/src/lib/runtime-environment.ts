import type { BundleSource } from './data-source.js';

export function getStaticBundleLoadBlocker(
  source: BundleSource,
  protocol: string,
): string | null {
  if (source.kind !== 'static') {
    return null;
  }

  if (protocol !== 'file:') {
    return null;
  }

  return 'Static dashboard exports must be served over HTTP. Start a local server in the export directory, for example: python3 -m http.server 8000';
}
