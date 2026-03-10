import kuzu from 'kuzu';
import { extname, join } from 'node:path';

import {
  BundleSerializer,
  type SerializedManifest,
  type SerializedPaperParserBundle,
} from '../serialization/bundle-serializer.js';
import { createEmptyIndex, type PaperParserBundle } from '../types/bundle.js';
import { KUZU_SCHEMA_STATEMENTS } from './kuzu-schema.js';

type QueryRow = Record<string, unknown>;

export interface StoredPaperSummary {
  id: string;
  title: string;
  sourceType: string;
  year: number;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  throw new Error(`Expected numeric database value, received ${String(value)}`);
}

export class KuzuStore {
  private database: kuzu.Database | null = null;
  private connection: kuzu.Connection | null = null;
  private schemaInitialized = false;

  constructor(private readonly databasePath = ':memory:') {}

  async open(): Promise<void> {
    if (this.database && this.connection) {
      return;
    }

    const normalizedPath =
      this.databasePath === ':memory:' || extname(this.databasePath) !== ''
        ? this.databasePath
        : join(this.databasePath, 'paperparser.kuzu');

    this.database = new kuzu.Database(normalizedPath);
    await this.database.init();
    this.connection = new kuzu.Connection(this.database);
    await this.connection.init();
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }

  async initializeSchema(): Promise<void> {
    if (this.schemaInitialized) {
      return;
    }

    for (const statement of KUZU_SCHEMA_STATEMENTS) {
      await this.query(statement);
    }

    this.schemaInitialized = true;
  }

  async writeBundle(bundle: PaperParserBundle): Promise<void> {
    const connection = this.getConnection();
    const serialized = BundleSerializer.toJsonBundle(bundle);
    const paperId = bundle.manifest.paper.title;
    const paperStatement = await connection.prepare(`
      CREATE (p:Paper {
        id: $id,
        title: $title,
        authors: $authors,
        year: $year,
        subject_area: $subject_area,
        source_type: $source_type,
        arxiv_id: $arxiv_id,
        doi: $doi,
        created_at: $created_at,
        manifest_json: $manifest_json,
        index_json: $index_json
      })
    `);

    await connection.execute(paperStatement, {
      id: paperId,
      title: bundle.manifest.paper.title,
      authors: JSON.stringify(bundle.manifest.paper.authors),
      year: bundle.manifest.paper.year,
      subject_area: bundle.manifest.paper.subjectArea,
      source_type: bundle.manifest.paper.sourceType,
      arxiv_id: bundle.manifest.paper.arxivId ?? '',
      doi: bundle.manifest.paper.doi ?? '',
      created_at: bundle.manifest.createdAt,
      manifest_json: JSON.stringify(serialized.manifest),
      index_json: JSON.stringify(serialized.index),
    });

    const nodeStatement = await connection.prepare(`
      CREATE (n:MathObject {
        id: $id,
        kind: $kind,
        label: $label,
        section: $section,
        section_title: $section_title,
        number: $number,
        latex_label: $latex_label,
        statement: $statement,
        proof_status: $proof_status,
        is_main_result: $is_main_result,
        novelty: $novelty,
        metadata: $metadata
      })
    `);
    const belongsToStatement = await connection.prepare(`
      MATCH (n:MathObject {id: $node_id}), (p:Paper {id: $paper_id})
      CREATE (n)-[:BELONGS_TO]->(p)
    `);

    for (const node of serialized.graph.nodes) {
      await connection.execute(nodeStatement, {
        id: node.id,
        kind: node.kind,
        label: node.label,
        section: node.section,
        section_title: node.section_title,
        number: node.number,
        latex_label: node.latex_label ?? '',
        statement: node.statement,
        proof_status: node.proof_status,
        is_main_result: node.is_main_result,
        novelty: node.novelty,
        metadata: JSON.stringify(node.metadata),
      });
      await connection.execute(belongsToStatement, {
        node_id: node.id,
        paper_id: paperId,
      });
    }

    const edgeStatement = await connection.prepare(`
      MATCH (source:MathObject {id: $source_id}), (target:MathObject {id: $target_id})
      CREATE (source)-[:MathRelation {
        kind: $kind,
        evidence: $evidence,
        confidence: $confidence,
        detail: $detail,
        metadata: $metadata
      }]->(target)
    `);

    for (const edge of serialized.graph.edges) {
      await connection.execute(edgeStatement, {
        source_id: edge.source,
        target_id: edge.target,
        kind: edge.kind,
        evidence: edge.evidence,
        confidence: edge.confidence ?? 0,
        detail: edge.detail,
        metadata: JSON.stringify(edge.metadata),
      });
    }
  }

  async listPapers(): Promise<StoredPaperSummary[]> {
    const rows = await this.getRows(`
      MATCH (p:Paper)
      RETURN p.id AS id, p.title AS title, p.source_type AS source_type, p.year AS year
      ORDER BY p.title
    `);

    return rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      sourceType: String(row.source_type),
      year: toNumber(row.year),
    }));
  }

  async readBundle(paperLookup: string): Promise<PaperParserBundle> {
    const paperRows = await this.getRows(`
      MATCH (p:Paper)
      WHERE p.id = '${paperLookup.replaceAll("'", "''")}' OR p.title = '${paperLookup.replaceAll("'", "''")}'
      RETURN p.id AS id, p.manifest_json AS manifest_json, p.index_json AS index_json
      LIMIT 1
    `);
    if (paperRows.length === 0) {
      throw new Error(`Unknown paper: ${paperLookup}`);
    }

    const manifest = JSON.parse(String(paperRows[0]?.manifest_json)) as SerializedManifest;
    const index = JSON.parse(String(paperRows[0]?.index_json)) as SerializedPaperParserBundle['index'];
    const paperId = String(paperRows[0]?.id);

    const nodeRows = await this.getRows(`
      MATCH (n:MathObject)-[:BELONGS_TO]->(p:Paper {id: '${paperId.replaceAll("'", "''")}'})
      RETURN
        n.id AS id,
        n.kind AS kind,
        n.label AS label,
        n.section AS section,
        n.section_title AS section_title,
        n.number AS number,
        n.latex_label AS latex_label,
        n.statement AS statement,
        n.proof_status AS proof_status,
        n.is_main_result AS is_main_result,
        n.novelty AS novelty,
        n.metadata AS metadata
      ORDER BY n.id
    `);

    const edgeRows = await this.getRows(`
      MATCH (source:MathObject)-[relation:MathRelation]->(target:MathObject),
            (source)-[:BELONGS_TO]->(paper:Paper {id: '${paperId.replaceAll("'", "''")}'})
      RETURN
        source.id AS source,
        target.id AS target,
        relation.kind AS kind,
        relation.evidence AS evidence,
        relation.detail AS detail,
        relation.confidence AS confidence,
        relation.metadata AS metadata
      ORDER BY source.id, target.id, relation.kind
    `);

    const serialized: SerializedPaperParserBundle = {
      manifest,
      graph: {
        schema_version: manifest.schema_version,
        nodes: nodeRows.map((row) => ({
          id: String(row.id),
          kind: String(row.kind) as SerializedPaperParserBundle['graph']['nodes'][number]['kind'],
          label: String(row.label),
          section: String(row.section),
          section_title: String(row.section_title),
          number: String(row.number),
          latex_label: row.latex_label ? String(row.latex_label) : null,
          statement: String(row.statement),
          proof_status: String(row.proof_status) as SerializedPaperParserBundle['graph']['nodes'][number]['proof_status'],
          is_main_result: Boolean(row.is_main_result),
          novelty: String(row.novelty) as SerializedPaperParserBundle['graph']['nodes'][number]['novelty'],
          metadata: JSON.parse(String(row.metadata)) as Record<string, unknown>,
        })),
        edges: edgeRows.map((row) => ({
          source: String(row.source),
          target: String(row.target),
          kind: String(row.kind) as SerializedPaperParserBundle['graph']['edges'][number]['kind'],
          evidence: String(row.evidence) as SerializedPaperParserBundle['graph']['edges'][number]['evidence'],
          detail: String(row.detail),
          confidence: toNumber(row.confidence),
          metadata: JSON.parse(String(row.metadata)) as Record<string, unknown>,
        })),
      },
      index,
    };

    const bundle = BundleSerializer.fromJsonBundle(serialized);
    if (bundle.index.mainResults.length === 0) {
      bundle.index = createEmptyIndex(bundle.manifest.schemaVersion);
    }
    return bundle;
  }

  private getConnection(): kuzu.Connection {
    if (!this.connection) {
      throw new Error('KuzuStore is not open.');
    }
    return this.connection;
  }

  private async query(statement: string) {
    return this.getConnection().query(statement);
  }

  private async getRows(statement: string): Promise<QueryRow[]> {
    const result = await this.query(statement);
    if (Array.isArray(result)) {
      throw new Error('Expected a single query result, received multiple result sets.');
    }
    const rows = await result.getAll();
    result.close();
    return rows;
  }
}
