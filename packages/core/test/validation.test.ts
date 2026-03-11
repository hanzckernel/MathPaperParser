import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ConsistencyChecker } from '../src/validation/consistency-checker.js';
import { SchemaValidator } from '../src/validation/schema-validator.js';

function loadExampleBundle() {
  const examplesDir = resolve(process.cwd(), 'schema/examples');

  return {
    manifest: JSON.parse(readFileSync(resolve(examplesDir, 'manifest.example.json'), 'utf8')),
    graph: JSON.parse(readFileSync(resolve(examplesDir, 'graph.example.json'), 'utf8')),
    index: JSON.parse(readFileSync(resolve(examplesDir, 'index.example.json'), 'utf8')),
  };
}

describe('schema and consistency validation', () => {
  it('accepts the published example bundle', () => {
    const serialized = loadExampleBundle();
    const validator = new SchemaValidator(resolve(process.cwd(), 'schema'));

    expect(() => validator.validateSerializedBundle(serialized)).not.toThrow();
    expect(() => ConsistencyChecker.checkSerializedBundle(serialized)).not.toThrow();
  });

  it('accepts markdown as a schema-valid source type', () => {
    const serialized = loadExampleBundle();
    const validator = new SchemaValidator(resolve(process.cwd(), 'schema'));

    serialized.manifest.paper.source_type = 'markdown';

    expect(() => validator.validateSerializedBundle(serialized)).not.toThrow();
  });

  it('rejects schema-invalid payloads', () => {
    const serialized = loadExampleBundle();
    const validator = new SchemaValidator(resolve(process.cwd(), 'schema'));

    serialized.graph.nodes[0] = {
      ...serialized.graph.nodes[0],
      kind: 'invalid_kind',
    };

    expect(() => validator.validateSerializedBundle(serialized)).toThrowError(/does not validate/i);
  });

  it('rejects broken node references in index data', () => {
    const serialized = loadExampleBundle();

    serialized.index.main_results[0] = {
      ...serialized.index.main_results[0],
      node_id: 'sec9::thm:missing-node',
    };

    expect(() => ConsistencyChecker.checkSerializedBundle(serialized)).toThrowError(/unknown node ids/i);
  });
});
