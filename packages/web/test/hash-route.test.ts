import { describe, expect, it } from 'vitest';

import { buildHashRoute, parseHashRoute } from '../src/lib/hash-route.js';

describe('web hash routing', () => {
  it('builds explorer routes with encoded node ids', () => {
    expect(buildHashRoute('explorer', 'sec1::thm:thm-main')).toBe('#/explorer/sec1%3A%3Athm%3Athm-main');
  });

  it('parses explorer routes with node ids and falls back safely', () => {
    expect(parseHashRoute('#/explorer/sec1%3A%3Athm%3Athm-main')).toEqual({
      route: 'explorer',
      nodeId: 'sec1::thm:thm-main',
    });

    expect(parseHashRoute('#/graph')).toEqual({
      route: 'graph',
      nodeId: null,
    });

    expect(parseHashRoute('#/unknown-route')).toEqual({
      route: 'overview',
      nodeId: null,
    });
  });
});
