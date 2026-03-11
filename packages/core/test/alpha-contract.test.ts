import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BundleSerializer,
  SchemaValidator,
  createEmptyIndex,
  type SerializedPaperParserBundle,
} from '../src/index.js';

function loadPublishedExamples(): SerializedPaperParserBundle {
  const examplesDir = resolve(process.cwd(), 'schema/examples');

  return {
    manifest: JSON.parse(readFileSync(resolve(examplesDir, 'manifest.example.json'), 'utf8')),
    graph: JSON.parse(readFileSync(resolve(examplesDir, 'graph.example.json'), 'utf8')),
    index: JSON.parse(readFileSync(resolve(examplesDir, 'index.example.json'), 'utf8')),
  } as SerializedPaperParserBundle;
}

describe('alpha bundle contract reset', () => {
  it('accepts markdown as a first-class paper source type in schema 0.2.0', () => {
    const serialized = loadPublishedExamples();
    const validator = new SchemaValidator();

    const markdownBundle: SerializedPaperParserBundle = {
      ...serialized,
      manifest: {
        ...serialized.manifest,
        schema_version: '0.2.0',
        paper: {
          ...serialized.manifest.paper,
          source_type: 'markdown',
          source_files: ['paper.md'],
        },
        producer: {
          ...serialized.manifest.producer,
          schema_version: '0.2.0',
        },
      },
      graph: {
        ...serialized.graph,
        schema_version: '0.2.0',
      },
      index: {
        ...serialized.index,
        schema_version: '0.2.0',
      },
    };

    expect(() => validator.validateSerializedBundle(markdownBundle)).not.toThrow();

    const bundle = BundleSerializer.fromJsonBundle(markdownBundle);
    expect(bundle.manifest.paper.sourceType).toBe('markdown');
    expect(BundleSerializer.toJsonBundle(bundle)).toEqual(markdownBundle);
  });

  it('defaults empty generated indexes to schema 0.2.0', () => {
    expect(createEmptyIndex().schemaVersion).toBe('0.2.0');
  });
});
