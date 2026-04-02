# Domain Pitfalls: TeX-First Mathematical Dependency Parsing

**Domain:** Local-first mathematical paper parsing and dependency navigation from TeX with optional agent enrichment
**Researched:** 2026-04-02
**Confidence:** HIGH for TeX/notation pitfalls, MEDIUM for agent-enrichment roadmap implications

Phase assignments below are PaperParser-specific inferences from the cited sources plus the current milestone constraints in [.planning/PROJECT.md](/Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser/.planning/PROJECT.md).

## Recommended Phase Names

- **Phase 1 - Gold-paper ingestion hardening:** make one heavy TeX paper parse deterministically, with macro/include/package handling and source spans.
- **Phase 2 - Canonical object and provenance schema:** separate objects, relation types, IDs, evidence, and confidence.
- **Phase 3 - Trustworthy dependency explorer:** make every node and edge explainable to a mathematician.
- **Phase 4 - Optional agent enrichment:** layer probabilistic semantic suggestions on top of the deterministic base, never inside it.
- **Phase 5 - Gold-paper evaluation and regression gate:** lock acceptance criteria around the representative paper before scaling outward.

## Critical Pitfalls

### Pitfall 1: Treating TeX layout as if it were already semantic structure

**What goes wrong:**
The parser extracts blocks and formulas, but misses theorem/proof boundaries, custom environments, include structure, and package-specific meaning. The output looks structurally rich on toy fixtures and collapses on a real heavy paper.

**Why it happens:**
Plain LaTeX is optimized for presentation, not knowledge representation. Current conversion tooling still expects document-specific bindings, declarations, or custom macro handling for high-semantic-content documents. [LaTeXML manual](https://dlmf.nist.gov/LaTeXML/manual.pdf), [plasTeX package handling](https://plastex.github.io/plastex/plastex/sec-packages.html), and [sTeX overview](https://kwarc.info/systems/sTeX/) all point to the same reality: semantics do not reliably fall out of raw TeX by default.

**How to avoid:**
- Start with a per-paper macro and environment inventory before changing extraction rules.
- Make include resolution, theorem-like environments, labels, and package warnings first-class parse outputs.
- Allow paper-specific bindings/configuration in v1 rather than pretending one parser pass will generalize.
- Store raw source spans for every extracted object so failures are inspectable.

**Warning signs:**
- Unknown macro/package warnings cluster around theorem-heavy regions.
- The same environment is sometimes parsed as a theorem and sometimes as plain text.
- Parsed output has sections and equations, but very few trustworthy theorem/proof objects.
- Successful parsing depends on manually editing the TeX source outside the product.

**Phase to address:**
Phase 1 - Gold-paper ingestion hardening

**Sources:**
[LaTeXML manual](https://dlmf.nist.gov/LaTeXML/manual.pdf), [plasTeX package handling](https://plastex.github.io/plastex/plastex/sec-packages.html), [Using LaTeX as a Semantic Markup Format](https://kwarc.info/people/mkohlhase/papers/mcs08-stex.pdf)

---

### Pitfall 2: Assuming notation is stable inside one document

**What goes wrong:**
Nodes or edges are keyed by surface symbols such as `G`, `X`, `f`, or `k`, so the parser merges distinct concepts or splits one concept across scopes. Dependency edges then look plausible while actually pointing to the wrong object.

**Why it happens:**
Math identifiers are ambiguous even within a single paper, sometimes within a paragraph. Recent grounding work explicitly argues that fixed-meaning assumptions are wrong, and that position plus local formula structure are critical for disambiguation. [Towards Grounding of Formulae](https://aclanthology.org/2020.sdp-1.16/), [Building Dataset for Grounding of Formulae](https://aclanthology.org/2022.lrec-1.519/), and [What Is Needed for Intra-document Disambiguation of Math Identifiers?](https://aclanthology.org/2024.lrec-main.1522/) all support this.

**How to avoid:**
- Use scope-aware IDs based on object identity plus source location, not raw notation.
- Track identifier grounding separately from theorem/object extraction.
- Prefer local context, nearby prose, section position, and formula structure over global symbol dictionaries.
- Support one-to-many and many-to-one mappings between symbols and semantic objects.

**Warning signs:**
- The same symbol gets incompatible textual descriptions in nearby sections.
- Query or retrieval results match formula shape but not the intended variables.
- Renaming one local variable causes large graph diffs.
- The parser cannot explain why two symbol occurrences were clustered together.

**Phase to address:**
Phase 2 - Canonical object and provenance schema

**Sources:**
[MathAlign](https://aclanthology.org/2020.lrec-1.269/), [Towards Grounding of Formulae](https://aclanthology.org/2020.sdp-1.16/), [Building Dataset for Grounding of Formulae](https://aclanthology.org/2022.lrec-1.519/), [What Is Needed for Intra-document Disambiguation of Math Identifiers?](https://aclanthology.org/2024.lrec-main.1522/)

---

### Pitfall 3: Treating formulas and prose as one modality

**What goes wrong:**
Dependency extraction overweights prose references or overweights formula similarity, but not both together. Search and graph construction work on simple named theorems yet miss proof-local equations, symbol descriptions, and paraphrased references.

**Why it happens:**
Mathematical language is mixed-mode. Recent surveys and retrieval work keep stressing that useful systems must model relationships between natural language and formulae rather than flattening them into generic text. [Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/), [Formula-Text Cross-Retrieval](https://aclanthology.org/2025.mathnlp-main.9/), and [Variable Typing](https://aclanthology.org/N18-1028/) support this.

**How to avoid:**
- Represent prose spans, formulas, and theorem-like environments as related but distinct artifacts.
- Build retrieval and edge extraction from both language cues and formula structure.
- Keep normalization/linearization steps explicit so failures can be debugged.
- Test search on notation-only, prose-only, and mixed queries.

**Warning signs:**
- A theorem is found by title but not by its key displayed equation.
- Dense text embeddings retrieve semantically similar prose but wrong formulas.
- Long or symbol-heavy formulas are disproportionately absent from dependencies.
- The only good results come from exact string matches.

**Phase to address:**
Phase 2 - Canonical object and provenance schema

**Sources:**
[Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/), [Formula-Text Cross-Retrieval](https://aclanthology.org/2025.mathnlp-main.9/), [Variable Typing](https://aclanthology.org/N18-1028/)

---

### Pitfall 4: Flattening all relation types into one generic "depends on" edge

**What goes wrong:**
Internal references, proof containment, citations, assumption use, structural adjacency, and agent guesses are all stored as the same dependency. The graph becomes impossible to trust because strong evidence and weak suggestions are visually identical.

**Why it happens:**
Mathematical dependency navigation sounds like a single relation, but the source signals come from different tasks: identifier grounding, reference retrieval, formula-text linking, and proof support. The PaperParser milestone already recognizes this by separating explicit, structural, and agent-inferred relations; the literature reinforces that these signals are not interchangeable. This phase recommendation is an inference from [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY), [Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/), and [MathAlign](https://aclanthology.org/2020.lrec-1.269/).

**How to avoid:**
- Make relation type mandatory at the schema level.
- Require evidence payloads that match relation type: source label for explicit refs, span/containment metadata for structural edges, prompt/evidence/confidence for agent edges.
- Let the UI filter by provenance and hide weak edges by default.
- Reject writes that create a dependency edge without a reason code.

**Warning signs:**
- Users ask "why is this edge here?" and the only answer is "the model thought so."
- Citations to outside papers appear identical to in-paper theorem dependencies.
- Minor parser changes cause large unexplained graph churn.
- Confidence scores exist only for some edges or only in UI state.

**Phase to address:**
Phase 2 - Canonical object and provenance schema

**Sources:**
[NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY), [Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/), [MathAlign](https://aclanthology.org/2020.lrec-1.269/)

---

### Pitfall 5: Pretending proofs make all dependencies explicit

**What goes wrong:**
The deterministic parser either under-links major results because the proof omits routine steps, or over-links aggressively by turning every nearby object into a dependency candidate. Both outcomes make the explorer less useful to mathematicians.

**Why it happens:**
Natural mathematical language mixes explicit references with implicit reasoning. Proof-reference retrieval remains hard enough that benchmark papers still report substantial headroom and poor out-of-domain behavior. [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY) and the [2025 mathematical reasoning survey](https://aclanthology.org/2025.findings-acl.614/) both point to this gap.

**How to avoid:**
- Treat deterministic extraction as a conservative baseline: explicit references, structural containment, and high-confidence local cues only.
- Reserve semantic completion for an optional enrichment pass.
- Add an explicit "unknown or implicit support" state instead of forcing low-quality edges.
- Measure false positives on the gold paper before chasing recall.

**Warning signs:**
- Important theorems show zero dependencies even though the proof is dense.
- The graph becomes nearly complete once heuristics are enabled.
- Operators keep adding handwritten allowlists or denylists to fix one paper.
- Users stop trusting the graph and fall back to raw source browsing.

**Phase to address:**
Phase 4 - Optional agent enrichment

**Sources:**
[NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY), [Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/), [A Survey of Mathematical Reasoning in the Era of Multimodal Large Language Model](https://aclanthology.org/2025.findings-acl.614/)

---

### Pitfall 6: Letting agent enrichment overwrite the canonical parse

**What goes wrong:**
The same paper produces different objects or dependencies across runs because the agent is allowed to mutate baseline parsing decisions. Reproducibility disappears, debugging becomes impossible, and trust collapses.

**Why it happens:**
LLM-based grounding is attractive because annotation is expensive, but current math-LLM work still frames these methods as challenging and evaluation-heavy rather than deterministic. [An Approach to Co-reference Resolution and Formula Grounding for Mathematical Identifiers Using Large Language Models](https://aclanthology.org/2024.mathnlp-1.1/) shows the opportunity; the [2025 survey](https://aclanthology.org/2025.findings-acl.614/) shows the remaining difficulty. The recommendation to freeze the base graph is a PaperParser-specific inference from those sources.

**How to avoid:**
- Freeze deterministic parse output before any agent step begins.
- Store agent suggestions in a separate layer keyed to stable node IDs.
- Cache prompts, model version, and returned evidence.
- Make agent enrichment opt-in at both CLI and UI levels.

**Warning signs:**
- Re-running the same paper without source changes changes node IDs or edge counts.
- Agent output lacks model/version metadata.
- Deterministic validation failures are fixed by prompt edits instead of parser changes.
- Users cannot diff "base graph" versus "enriched graph."

**Phase to address:**
Phase 4 - Optional agent enrichment

**Sources:**
[An Approach to Co-reference Resolution and Formula Grounding for Mathematical Identifiers Using Large Language Models](https://aclanthology.org/2024.mathnlp-1.1/), [A Survey of Mathematical Reasoning in the Era of Multimodal Large Language Model](https://aclanthology.org/2025.findings-acl.614/)

---

### Pitfall 7: Shipping dependency navigation without edge evidence

**What goes wrong:**
The graph is visible, clickable, and even searchable, but a mathematician still cannot tell why an edge exists. Without source-linked evidence, the explorer is a demo artifact, not a research tool.

**Why it happens:**
Math users need to inspect arguments, not only outcomes. Retrieval and grounding papers consistently evaluate link quality against context, descriptions, or proof references, not just opaque labels. This recommendation is an inference from [MathAlign](https://aclanthology.org/2020.lrec-1.269/), [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY), and the explicit "why each edge exists" milestone goal in [.planning/PROJECT.md](/Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser/.planning/PROJECT.md).

**How to avoid:**
- Require every edge to carry at least one evidence record with source span(s).
- Distinguish "quoted evidence" from "model rationale."
- Show source snippets and jump-to-location behavior in the first explorer release.
- Make missing evidence a validation error for explicit and structural edges.

**Warning signs:**
- The UI shows an edge type and score but no excerpt.
- Operators debug by opening raw JSON rather than using the explorer.
- User feedback says "I still need to grep the TeX to verify this."
- Graph screenshots look convincing, but inspection sessions are short.

**Phase to address:**
Phase 3 - Trustworthy dependency explorer

**Sources:**
[MathAlign](https://aclanthology.org/2020.lrec-1.269/), [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY), [.planning/PROJECT.md](/Users/hanzhicheng/Desktop/Coding/agent4math/PaperParser/.planning/PROJECT.md)

---

### Pitfall 8: Declaring success without a gold-paper evaluation contract

**What goes wrong:**
The team keeps improving heuristics, but nobody can say whether dependency navigation is actually getting better on the representative heavy paper. Regressions get hidden inside qualitative demos.

**Why it happens:**
Math language processing benchmarks are fragmented, tasks are not yet canonical, and research datasets remain limited relative to the complexity of real papers. The literature repeatedly frames data scarcity and task fragmentation as open problems. [Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/), [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY), and [arXMLiv](https://kwarc.info/projects/arXMLiv/) all support the need for explicit acceptance criteria instead of vague generalization claims.

**How to avoid:**
- Select one heavy paper now and turn it into the canonical acceptance artifact.
- Annotate the expected object inventory and a curated set of must-have, must-not-have, and uncertain edges.
- Record parser warnings, missing objects, and unresolved references as part of the regression report.
- Keep a small hand-reviewed "trust set" separate from broader future corpus work.

**Warning signs:**
- Tests use synthetic snippets but not the target paper.
- Success is reported as "looks better" instead of object/edge metrics plus review notes.
- Known parser failures are tracked in chat rather than fixtures or manifests.
- Each demo uses a different paper.

**Phase to address:**
Phase 5 - Gold-paper evaluation and regression gate

**Sources:**
[Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/), [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY), [arXMLiv](https://kwarc.info/projects/arXMLiv/)

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keying nodes by label text or rendered title | Fast linking for toy papers | Breaks on unlabeled claims, reused names, and local notation drift | Never |
| Hiding paper-specific macro fixes inside parser code | Quick green run on one paper | Untraceable behavior and regressions on the next paper | Only if mirrored in explicit paper config and tests |
| Running agent enrichment inline during parsing | Simpler pipeline shape | Non-deterministic artifacts and impossible diffing | Never |
| One generic `depends_on` edge type | Faster schema and UI | Trust collapse once explicit and inferred edges mix | Never |
| Treating unresolved refs as soft warnings only | Keeps pipeline moving | Users cannot tell missing structure from absent dependency | Only in Phase 1, with failures surfaced in reports |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TeX package/macro handling | Assume unknown macros can be ignored if output still renders | Fail closed on structure-bearing macros and record per-paper bindings/config |
| Formula grounding | Reuse global symbol dictionaries without local scope | Ground identifiers using local context, position, and formula structure |
| Agent enrichment | Ask the model for final dependencies directly | Ask for candidate edges plus cited evidence tied to stable base-node IDs |
| Explorer UI | Render graph first and explanation later | Design edge evidence, source jumps, and provenance filters before polishing layout |

## Performance Traps For The "One Heavy Paper" Milestone

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All-pairs edge scoring over every object | Parse time spikes superlinearly as theorem/equation count grows | Prune candidates by scope, references, and proof locality before semantic scoring | Usually once a single paper reaches a few hundred objects |
| Recomputing agent enrichment on every interaction | UI feels clever but sluggish and non-repeatable | Cache enriched candidates as a separate artifact keyed by model/version | Breaks immediately on iterative exploration |
| Eagerly normalizing every formula into maximal structure | Huge parse artifacts with little user value | Normalize enough for IDs, search, and evidence; defer heavy transforms until needed | Breaks on notation-dense appendices and long proofs |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Show node names without source context | Mathematician cannot distinguish similarly named results | Show label, type, local title/text snippet, and source location together |
| Show edge scores without provenance | User cannot decide what to trust | Show provenance first, score second |
| Hide unresolved structure | User assumes missing dependencies mean mathematical independence | Surface unresolved refs, unknown macros, and parse gaps explicitly |

## "Looks Done But Isn't" Checklist

- [ ] **Theorem extraction:** Verify custom theorem-like environments, unlabeled claims, and proof blocks are all captured on the gold paper.
- [ ] **Dependency graph:** Verify every visible edge has source-linked evidence or explicit agent provenance.
- [ ] **Identifier handling:** Verify the same symbol can map to different meanings across scopes without node collisions.
- [ ] **Agent enrichment:** Verify the enriched graph can be turned off and the deterministic base remains byte-stable across reruns.
- [ ] **Explorer usefulness:** Verify a mathematician can answer "why does this depend on that?" without opening raw JSON or TeX.

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Treating TeX layout as semantics | Phase 1 | Gold paper parses with bounded warnings and correct theorem/proof boundaries |
| Assuming notation is stable | Phase 2 | Ambiguous symbols on the gold paper resolve to stable, scope-aware IDs |
| Treating formulas and prose as one modality | Phase 2 | Mixed queries succeed on both theorem text and displayed formulas |
| Flattening all relation types | Phase 2 | Every edge validates with a non-empty provenance type and evidence contract |
| Pretending proofs are fully explicit | Phase 4 | Deterministic graph stays conservative; agent layer adds only reviewable candidates |
| Letting agent output overwrite base parse | Phase 4 | Re-running deterministic parse produces identical canonical artifacts |
| Shipping graph without edge evidence | Phase 3 | Clicking any edge reveals source spans or agent evidence |
| No gold-paper evaluation contract | Phase 5 | Regression report tracks must-have objects/edges and unresolved gaps on one fixed paper |

## Sources

- [LaTeXML manual](https://dlmf.nist.gov/LaTeXML/manual.pdf)
- [plasTeX package handling](https://plastex.github.io/plastex/plastex/sec-packages.html)
- [sTeX: Semantic Markup for LaTeX](https://kwarc.info/systems/sTeX/)
- [Using LaTeX as a Semantic Markup Format](https://kwarc.info/people/mkohlhase/papers/mcs08-stex.pdf)
- [arXMLiv project](https://kwarc.info/projects/arXMLiv/)
- [MathAlign](https://aclanthology.org/2020.lrec-1.269/)
- [Towards Grounding of Formulae](https://aclanthology.org/2020.sdp-1.16/)
- [Building Dataset for Grounding of Formulae](https://aclanthology.org/2022.lrec-1.519/)
- [What Is Needed for Intra-document Disambiguation of Math Identifiers?](https://aclanthology.org/2024.lrec-main.1522/)
- [Variable Typing](https://aclanthology.org/N18-1028/)
- [Introduction to Mathematical Language Processing](https://aclanthology.org/2023.tacl-1.66/)
- [NaturalProofs](https://openreview.net/forum?id=Jvxa8adr3iY)
- [An Approach to Co-reference Resolution and Formula Grounding for Mathematical Identifiers Using Large Language Models](https://aclanthology.org/2024.mathnlp-1.1/)
- [Formula-Text Cross-Retrieval](https://aclanthology.org/2025.mathnlp-main.9/)
- [A Survey of Mathematical Reasoning in the Era of Multimodal Large Language Model](https://aclanthology.org/2025.findings-acl.614/)
