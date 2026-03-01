export const NODE_KINDS = [
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "assumption",
  "remark",
  "example",
  "conjecture",
  "notation",
  "external_dependency",
];

export const EDGE_KINDS = [
  "uses_in_proof",
  "extends",
  "generalizes",
  "specializes",
  "equivalent_to",
  "cites_external",
];

export const EVIDENCE_LEVELS = ["explicit_ref", "inferred", "external"];

export const PROOF_STATUSES = ["full", "sketch", "deferred", "external", "not_applicable"];

export const NOVELTY_LEVELS = ["new", "classical", "extended", "folklore"];

export const INNOVATION_CALIBRATIONS = ["significant", "incremental", "straightforward_extension"];

