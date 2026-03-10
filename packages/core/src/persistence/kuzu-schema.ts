export const KUZU_SCHEMA_STATEMENTS = [
  `CREATE NODE TABLE MathObject (
    id STRING PRIMARY KEY,
    kind STRING,
    label STRING,
    section STRING,
    section_title STRING,
    number STRING,
    latex_label STRING,
    statement STRING,
    proof_status STRING,
    is_main_result BOOLEAN,
    novelty STRING,
    metadata STRING
  );`,
  `CREATE NODE TABLE Paper (
    id STRING PRIMARY KEY,
    title STRING,
    authors STRING,
    year INT64,
    subject_area STRING,
    source_type STRING,
    arxiv_id STRING,
    doi STRING,
    created_at STRING,
    manifest_json STRING,
    index_json STRING
  );`,
  `CREATE NODE TABLE Section (
    id STRING PRIMARY KEY,
    paper_id STRING,
    number STRING,
    title STRING,
    summary STRING
  );`,
  `CREATE NODE TABLE Cluster (
    id STRING PRIMARY KEY,
    label STRING,
    description STRING
  );`,
  `CREATE REL TABLE MathRelation (
    FROM MathObject TO MathObject,
    kind STRING,
    evidence STRING,
    confidence FLOAT,
    detail STRING,
    metadata STRING
  );`,
  `CREATE REL TABLE BELONGS_TO (
    FROM MathObject TO Paper
  );`,
  `CREATE REL TABLE IN_SECTION (
    FROM MathObject TO Section
  );`,
  `CREATE REL TABLE MEMBER_OF (
    FROM MathObject TO Cluster
  );`,
] as const;
