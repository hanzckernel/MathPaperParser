import { describe, expect, it } from 'vitest';

import { getStaticBundleLoadBlocker } from '../src/lib/runtime-environment.js';

describe('getStaticBundleLoadBlocker', () => {
  it('warns when a static export is opened via file protocol', () => {
    expect(
      getStaticBundleLoadBlocker(
        {
          kind: 'static',
          basePath: './data',
        },
        'file:',
      ),
    ).toContain('served over HTTP');
  });

  it('does not block API-backed dashboards over file protocol', () => {
    expect(
      getStaticBundleLoadBlocker(
        {
          kind: 'api',
          baseUrl: 'http://127.0.0.1:3000',
          paperId: 'latest',
        },
        'file:',
      ),
    ).toBeNull();
  });

  it('does not block static dashboards over http', () => {
    expect(
      getStaticBundleLoadBlocker(
        {
          kind: 'static',
          basePath: './data',
        },
        'http:',
      ),
    ).toBeNull();
  });
});
