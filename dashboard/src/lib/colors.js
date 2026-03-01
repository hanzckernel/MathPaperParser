export function kindColorVar(kind) {
  if (kind === "external_dependency") return "var(--kind-external_dependency)";
  return `var(--kind-${kind})`;
}

export function evidenceColorVar(evidence) {
  if (evidence === "explicit_ref") return "var(--evidence-explicit)";
  if (evidence === "inferred") return "var(--evidence-inferred)";
  return "var(--evidence-external)";
}

export function difficultyColorVar(difficulty) {
  if (difficulty === "high") return "var(--difficulty-high)";
  if (difficulty === "medium") return "var(--difficulty-medium)";
  return "var(--difficulty-low)";
}

export function calibrationColorVar(calibration) {
  if (calibration === "significant") return "var(--calibration-significant)";
  if (calibration === "incremental") return "var(--calibration-incremental)";
  return "var(--calibration-straightforward)";
}

