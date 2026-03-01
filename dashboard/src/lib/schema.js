import Ajv from "ajv";
import addFormats from "ajv-formats";

import manifestSchema from "../../../schema/manifest.schema.json";
import graphSchema from "../../../schema/graph.schema.json";
import indexSchema from "../../../schema/index.schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validateManifest = ajv.compile(manifestSchema);
const validateGraph = ajv.compile(graphSchema);
const validateIndex = ajv.compile(indexSchema);

function formatErrors(prefix, errors) {
  if (!errors || errors.length === 0) return `${prefix}: (no details)`;
  return `${prefix}:\n` + errors.map((e) => `- ${e.instancePath || "/"} ${e.message ?? ""}`.trim()).join("\n");
}

export function validateBundleOrThrow({ manifest, graph, index }) {
  if (!validateManifest(manifest)) {
    throw new Error(formatErrors("manifest.json failed schema validation", validateManifest.errors));
  }
  if (!validateGraph(graph)) {
    throw new Error(formatErrors("graph.json failed schema validation", validateGraph.errors));
  }
  if (!validateIndex(index)) {
    throw new Error(formatErrors("index.json failed schema validation", validateIndex.errors));
  }

  if (manifest.schema_version !== graph.schema_version || manifest.schema_version !== index.schema_version) {
    throw new Error(
      `schema_version mismatch: manifest=${manifest.schema_version} graph=${graph.schema_version} index=${index.schema_version}`
    );
  }

  return [];
}

