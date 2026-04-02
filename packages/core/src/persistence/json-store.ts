import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { BundleSerializer, type SerializedPaperParserBundle } from '../serialization/bundle-serializer.js';
import { type SerializedEnrichmentArtifact } from '../serialization/enrichment-serializer.js';
import type { PaperParserBundle } from '../types/bundle.js';

export class JsonStore {
  static readBundle(directory: string): PaperParserBundle {
    return BundleSerializer.fromJsonBundle(this.readSerializedBundle(directory));
  }

  static readSerializedBundle(directory: string): SerializedPaperParserBundle {
    const bundleDir = resolve(directory);

    return {
      manifest: JSON.parse(readFileSync(resolve(bundleDir, 'manifest.json'), 'utf8')) as SerializedPaperParserBundle['manifest'],
      graph: JSON.parse(readFileSync(resolve(bundleDir, 'graph.json'), 'utf8')) as SerializedPaperParserBundle['graph'],
      index: JSON.parse(readFileSync(resolve(bundleDir, 'index.json'), 'utf8')) as SerializedPaperParserBundle['index'],
    };
  }

  static readSerializedEnrichment(directory: string): SerializedEnrichmentArtifact | undefined {
    const bundleDir = resolve(directory);

    try {
      return JSON.parse(readFileSync(resolve(bundleDir, 'enrichment.json'), 'utf8')) as SerializedEnrichmentArtifact;
    } catch {
      return undefined;
    }
  }

  static writeBundle(directory: string, bundle: PaperParserBundle): void {
    this.writeSerializedBundle(directory, BundleSerializer.toJsonBundle(bundle));
  }

  static writeSerializedBundle(directory: string, bundle: SerializedPaperParserBundle): void {
    const bundleDir = resolve(directory);
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(resolve(bundleDir, 'manifest.json'), `${JSON.stringify(bundle.manifest, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(bundleDir, 'graph.json'), `${JSON.stringify(bundle.graph, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(bundleDir, 'index.json'), `${JSON.stringify(bundle.index, null, 2)}\n`, 'utf8');
  }

  static writeSerializedEnrichment(directory: string, enrichment: SerializedEnrichmentArtifact): void {
    const bundleDir = resolve(directory);
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(resolve(bundleDir, 'enrichment.json'), `${JSON.stringify(enrichment, null, 2)}\n`, 'utf8');
  }
}
