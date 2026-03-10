import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type ErrorObject, type ValidateFunction } from 'ajv';
import * as ajvFormatsModule from 'ajv-formats';
import * as ajv2020Module from 'ajv/dist/2020.js';

import { BundleSerializer, type SerializedPaperParserBundle } from '../serialization/bundle-serializer.js';
import type { PaperParserBundle } from '../types/bundle.js';

type SchemaName = 'manifest' | 'graph' | 'index';

type AjvInstance = {
  compile: (schema: object) => ValidateFunction;
};

type AjvConstructor = new (options?: { allErrors?: boolean; strict?: boolean }) => AjvInstance;
type FormatsPlugin = (ajv: AjvInstance) => void;

// NodeNext resolves these AJV packages through their CommonJS entry points, so
// the runtime value is the default export hanging off the namespace object.
const Ajv2020 = ajv2020Module.default as unknown as AjvConstructor;
const addFormats = ajvFormatsModule.default as unknown as FormatsPlugin;

function formatErrorLocation(instancePath: string): string {
  return instancePath === '' ? '$' : `$${instancePath.replace(/\//g, '.')}`;
}

function renderErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return 'Unknown schema validation error.';
  }

  return errors
    .map((error) => `${formatErrorLocation(error.instancePath)}: ${error.message ?? 'validation error'}`)
    .join('\n');
}

function loadSchema(schemaDir: string, schemaName: SchemaName): object {
  const schemaPath = resolve(schemaDir, `${schemaName}.schema.json`);
  return JSON.parse(readFileSync(schemaPath, 'utf8')) as object;
}

export class SchemaValidator {
  private readonly validators: Record<SchemaName, ValidateFunction>;

  constructor(private readonly schemaDir = resolve(process.cwd(), 'schema')) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);

    this.validators = {
      manifest: ajv.compile(loadSchema(this.schemaDir, 'manifest')),
      graph: ajv.compile(loadSchema(this.schemaDir, 'graph')),
      index: ajv.compile(loadSchema(this.schemaDir, 'index')),
    };
  }

  validateSerializedBundle(bundle: SerializedPaperParserBundle): void {
    this.validatePart('manifest', bundle.manifest);
    this.validatePart('graph', bundle.graph);
    this.validatePart('index', bundle.index);
  }

  validateBundle(bundle: PaperParserBundle): void {
    this.validateSerializedBundle(BundleSerializer.toJsonBundle(bundle));
  }

  private validatePart(schemaName: SchemaName, value: unknown): void {
    const validator = this.validators[schemaName];
    if (validator(value)) {
      return;
    }

    throw new Error(`${schemaName}.json does not validate against ${schemaName}.schema.json:\n${renderErrors(validator.errors)}`);
  }
}
