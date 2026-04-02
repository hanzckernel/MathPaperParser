# Feature Landscape

**Domain:** Local-first math-paper dependency explorer for TeX papers
**Researched:** 2026-04-02
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes

Features a mathematician will expect before the tool feels trustworthy for a single heavy paper.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Deterministic typed object extraction | In this niche, paper-level retrieval is not enough; mathematicians increasingly want theorem-level access rather than scanning whole papers manually. [TheoremSearch](https://theoremsearch.com/) exists largely because document-level search misses the actual result. | HIGH | v1 baseline should cover sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations as first-class nodes or typed objects. |
| Object detail view with source context | Graph tools are useful only if a clicked item resolves to concrete metadata and original context; this is standard in [ResearchRabbit](https://learn.researchrabbit.ai/en/articles/12454564-how-do-i-see-citations-and-references-in-the-new-researchrabbit) and [Zotero](https://www.zotero.org/support/quick_start_guide). | MEDIUM | The detail pane should show label/title, object type, section breadcrumb, rendered or raw statement text, and source span/file location. |
| Dependency and reverse-dependency inspection | Literature-graph tools center traversal of references/citations and connected work rather than flat lists, as seen in [ResearchRabbit](https://learn.researchrabbit.ai/en/articles/12454564-how-do-i-see-citations-and-references-in-the-new-researchrabbit) and [Litmaps](https://docs.litmaps.com/en/articles/9057179-create-a-litmap). | MEDIUM | For this product, the analogue is `depends on` and `used by`, ideally with 1-hop first and optional transitive expansion. |
| Edge explanation with evidence | Users need to understand why two objects are connected, not just that they are connected; [Semantic Scholar](https://www.semanticscholar.org/product/tutorials) exposes citation type and influence for exactly this reason. | HIGH | For v1, every edge should have provenance and a human-readable reason: explicit citation, label reference, proof mention, section containment, or parser-derived structural rule. |
| Search by label or title | Search-first entry points are table stakes in local research tools such as [Zotero](https://www.zotero.org/support/searching), [Litmaps](https://docs.litmaps.com/en/articles/9922995-look-up-articles-in-litmaps), and [ResearchRabbit](https://learn.researchrabbit.ai/en/collections/17906784-searching-discovery). | LOW | Exact and fuzzy search over labels, titles, and normalized object names is enough for v1. Semantic search is not required. |
| Graph scoping and filtering | Real graph tools always give users ways to narrow scope via filters, lists, or seeded maps; [Litmaps](https://docs.litmaps.com/en/articles/9029858-search-algorithms-in-litmaps) and [Semantic Scholar](https://www.semanticscholar.org/product/tutorials) both emphasize search/sort/filter loops. | MEDIUM | Minimum useful filters: object type, section, and edge provenance. Without these, a single-paper graph becomes visually noisy fast. |

### Differentiators

Features that make this product meaningfully better than generic literature tools for a local mathematician.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Theorem-proof-equation dependency graph inside one paper | Most literature tools operate at paper or citation-network level. A graph grounded in internal mathematical objects is a materially different product and directly matches the pain point identified by [TheoremSearch](https://theoremsearch.com/): important results are hidden below the document level. | HIGH | This is the main differentiator. The product should feel like "Connected Papers for one TeX paper's logical structure," not another bibliography app. |
| Provenance-separated relation layers | Separating `explicit`, `structural`, and later `agent_inferred` edges makes the graph debuggable and trustworthy. This aligns with the transparency expectations visible in [Semantic Scholar's citation intent/influence features](https://www.semanticscholar.org/faq/citation-intent) and [ResearchRabbit's explanation of its search process](https://learn.researchrabbit.ai/en/articles/12454660-how-does-researchrabbit-work). | MEDIUM | This should be visible in both data and UI. It is not enough to keep provenance only in the backend. |
| Reviewable second-pass semantic enrichment | The category is moving toward semantic retrieval and ML-assisted relation finding, but the trustworthy versions expose confidence and evidence rather than pretending the model is always right; see [Semantic Scholar's influential citations](https://www.semanticscholar.org/faq/influential-citations) and [TheoremSearch](https://theoremsearch.com/). | HIGH | Good v1.1 feature: propose semantic edges separately, let the user inspect evidence, and keep them toggled off by default. |
| Local-first reusable artifact across CLI, dashboard, and MCP | Most adjacent tools are web-first SaaS. A local JSON artifact that powers terminal queries, static HTML exploration, and agent tooling is a strong workflow differentiator for one mathematician. | MEDIUM | This matters because the user is working alone, locally, and may want to inspect the same graph from different surfaces without re-ingesting or relying on a hosted service. |
| Section-aware navigation that links outline and graph | Generic citation maps do not usually model a paper's internal outline. For math papers, switching between section hierarchy and dependency graph is genuinely useful. | MEDIUM | A synchronized outline-plus-graph view is a better early differentiator than broader literature discovery. |
| Future theorem-semantic search over the local graph | Theorem-level semantic retrieval is now demonstrably feasible at scale via [TheoremSearch](https://theoremsearch.com/), making it a credible future upgrade once the deterministic graph is stable. | HIGH | This should be explicitly deferred until typed extraction and provenance are solid. It is attractive, but not a first-milestone requirement. |

### Anti-Features / Explicit Deferments

Features that are common in adjacent products but should stay out of v1 for this milestone.

| Feature | Why Requested | Why Avoid In v1 | Alternative |
|---------|---------------|-----------------|-------------|
| PDF-first ingestion or OCR recovery | Users often think in terms of PDFs because literature tools ingest PDFs or metadata records. | The project scope is TeX-first, and OCR/PDF reconstruction would consume the milestone while producing less trustworthy edges than source-based parsing. | Stay with TeX entry files and project directories; treat PDF support as a separate milestone. |
| Collaboration, shared workspaces, and public links | Tools like [ResearchRabbit](https://learn.researchrabbit.ai/en/articles/12454600-organizing-your-articles-with-collections), [Litmaps sharing](https://docs.litmaps.com/en/articles/10108900-how-to-share-a-litmap), and [Litmaps Teams](https://docs.litmaps.com/en/articles/9125752-litmaps-teams) push this hard. | The current user is one mathematician working locally. Adding permissions, syncing, and shared-state problems would distort the product toward SaaS concerns. | Keep export static and local. If sharing matters later, export HTML/JSON artifacts explicitly. |
| Alerts, monitors, and recommendation feeds | Modern literature tools use ongoing discovery loops, e.g. [Litmaps Monitor](https://docs.litmaps.com/en/articles/9126249-monitor-get-alerts-for-important-research) and [ResearchRabbit alerts/digests](https://www.researchrabbit.ai/freeforever). | The milestone is about understanding one paper's dependency structure, not staying current on a topic. These features also imply external corpus maintenance. | Defer until there is a multi-paper library or external index strategy. |
| Full reference-manager replacement | Products like [Zotero](https://www.zotero.org/support/collections_and_tags) and [ResearchRabbit collections](https://learn.researchrabbit.ai/en/articles/12454600-organizing-your-articles-with-collections) support tags, collections, and library management. | Bibliographic organization is a separate product category. Rebuilding collections/tags/notes would dilute the core dependency-explorer workflow. | Support export to BibTeX/JSON and lightweight local persistence, but not full library management in v1. |
| Auto-merged agent-inferred edges in the default graph | Users will ask for "smarter" graphs quickly. | Merging heuristic or model guesses into the baseline graph destroys trust and makes debugging impossible. | Keep inference opt-in, visually distinct, and reversible with evidence attached. |
| Manual graph editing UI | Once users find parser misses, manual fixes are an obvious request. | Early manual editing hides parser defects and creates a second source of truth before the canonical artifact is stable. | Prefer issue capture, provenance inspection, and parser fixture improvements first. |
| Cross-paper discovery and author-network exploration | [ResearchRabbit](https://www.researchrabbit.ai/features) and [Litmaps](https://docs.litmaps.com/en/articles/9057179-create-a-litmap) center "find related work" and graph expansion from seed papers. | That is a different product loop from "understand this TeX paper." It needs a broader corpus, ranking, deduplication, and freshness pipeline. | Keep search scoped to the current paper in v1; revisit when one-paper parsing is strong. |

## Feature Dependencies

```text
TeX flattening + source spans
  -> deterministic typed object extraction
  -> stable object IDs
  -> dependency/reverse-dependency inspection

deterministic typed object extraction
  -> object detail view
  -> graph scoping/filtering
  -> label/title search

source spans + relation builders
  -> edge explanation with evidence

edge provenance
  -> provenance filters
  -> safe agent-inferred enrichment

stable canonical artifact
  -> dashboard parity
  -> CLI/API/MCP parity
  -> future semantic search
```

### Dependency Notes

- **Typed extraction precedes everything else:** search, filters, and graph inspection only become trustworthy once object typing and IDs are stable.
- **Edge explanation depends on source spans:** if the parser cannot point back to a file/span or textual evidence, the "why" UX will collapse into hand-wavy labels.
- **Agent enrichment depends on provenance separation:** model-proposed edges are only safe once the deterministic baseline is independently inspectable.
- **Graph scoping depends on complete typing:** section/type filters are only useful if sections, proofs, equations, and citations are actually present in the graph.
- **Cross-paper discovery conflicts with the milestone:** it requires a very different indexing and ranking stack than single-paper dependency exploration.

## MVP Recommendation

### Launch With (v1)

- [ ] Deterministic extraction of the required object kinds: sections, theorems, lemmas, corollaries, definitions, propositions, proofs, equations, and citations.
- [ ] Click an object and inspect its direct dependencies and reverse dependencies.
- [ ] Click an edge and see a human-readable explanation plus provenance and evidence.
- [ ] Object detail view with label/title, section breadcrumb, and source-linked context.
- [ ] Basic label/title search plus object-type filtering.

### Add After Validation (v1.x)

- [ ] Provenance-layer toggles that clearly separate `explicit`, `structural`, and `agent_inferred` relations.
- [ ] Optional second-pass semantic edge proposals with confidence and supporting evidence.
- [ ] Synchronized outline-plus-graph navigation for large papers.

### Future Consideration (v2+)

- [ ] Theorem-semantic search over the local graph or local corpus.
- [ ] Multi-paper library mode and cross-paper dependency/discovery.
- [ ] PDF ingestion and OCR-assisted recovery.
- [ ] Collaboration, sharing, alerts, or hosted sync.

## Sources

- [TheoremSearch](https://theoremsearch.com/)
- [ResearchRabbit: citations and references](https://learn.researchrabbit.ai/en/articles/12454564-how-do-i-see-citations-and-references-in-the-new-researchrabbit)
- [ResearchRabbit: organizing articles with collections](https://learn.researchrabbit.ai/en/articles/12454600-organizing-your-articles-with-collections)
- [ResearchRabbit: how it works](https://learn.researchrabbit.ai/en/articles/12454660-how-does-researchrabbit-work)
- [ResearchRabbit features](https://www.researchrabbit.ai/features)
- [ResearchRabbit free tier / alerts / visualizations](https://www.researchrabbit.ai/freeforever)
- [Litmaps: create a Litmap](https://docs.litmaps.com/en/articles/9057179-create-a-litmap)
- [Litmaps: search algorithms](https://docs.litmaps.com/en/articles/9029858-search-algorithms-in-litmaps)
- [Litmaps: look up articles](https://docs.litmaps.com/en/articles/9922995-look-up-articles-in-litmaps)
- [Litmaps: share a Litmap](https://docs.litmaps.com/en/articles/10108900-how-to-share-a-litmap)
- [Litmaps: monitor alerts](https://docs.litmaps.com/en/articles/9126249-monitor-get-alerts-for-important-research)
- [Litmaps Teams](https://docs.litmaps.com/en/articles/9125752-litmaps-teams)
- [Semantic Scholar tutorials: citations overview](https://www.semanticscholar.org/product/tutorials)
- [Semantic Scholar FAQ: citation intent](https://www.semanticscholar.org/faq/citation-intent)
- [Semantic Scholar FAQ: influential citations](https://www.semanticscholar.org/faq/influential-citations)
- [Zotero searching](https://www.zotero.org/support/searching)
- [Zotero collections and tags](https://www.zotero.org/support/collections_and_tags)
- [Zotero quick start guide](https://www.zotero.org/support/quick_start_guide)

---
*Feature research for: local-first TeX math-paper dependency explorer*
