# Prompt 0: Paper Skeleton Extraction

## What this prompt does

This is the foundation prompt of the PaperParser pipeline. It extracts a complete structural skeleton from a mathematical research paper: every section, every formal mathematical object (theorems, lemmas, definitions, propositions, corollaries, assumptions, remarks, conjectures, examples, key equations), and basic metadata (title, authors, subject area). The skeleton becomes the shared reference document for all subsequent prompts.

## Prerequisites

- A mathematical research paper in PDF format (attached to this message) or LaTeX source files.
- No prior outputs needed -- this is the first prompt in the pipeline.

## How to use

1. Open a new conversation with your model (GPT 5.2 extended thinking, Gemini 3.1 Pro, or similar).
2. Attach the paper PDF to your message.
3. Copy everything between the two `---` lines below and paste it as your message.
4. If the paper is very long (40+ pages), add a focus directive at the end: "Focus on Sections X--Y."
5. Save the model's output -- you will paste it into Prompts 01, 02, and 03.

---

You are a mathematical research paper analyst. Your task is to extract a complete structural skeleton from the attached paper. This skeleton will be used as the foundation for a multi-stage analysis pipeline, so accuracy and completeness are critical. Do not summarize or interpret -- just extract and organize.

**Read the entire paper carefully before producing any output.** Do not start writing until you have identified all sections and all formal mathematical objects.

## Task 1: Metadata Extraction

Extract the following metadata and present it in this exact format:

```
PAPER METADATA
==============
Title: [exact title]
Authors: [comma-separated list]
Subject Area: [e.g., "Partial Differential Equations", "Probability Theory", "Algebraic Geometry"]
MSC Codes: [if stated in the paper; otherwise write "not stated"]
arXiv ID: [if visible; otherwise write "not stated"]
Number of Pages: [approximate]
Number of Sections: [count, including appendices]
```

## Task 2: Section Structure

List every section and subsection in the paper, preserving the exact numbering and titles used by the authors. Use this format:

```
SECTION STRUCTURE
=================
1. [Title of Section 1]
  1.1. [Title of Subsection 1.1]
  1.2. [Title of Subsection 1.2]
2. [Title of Section 2]
...
A. [Title of Appendix A]
  A.1. [Title of Appendix Subsection A.1]
```

Include: all numbered sections, all appendices, the bibliography/references section.
Exclude: acknowledgments (note their existence but do not list as a section).

## Task 3: Complete Object Extraction

This is the most important task. You must identify **every** formal mathematical object in the paper. Scan systematically, section by section, and extract each object.

### What counts as a formal mathematical object:

| Type | How to recognize it |
|------|-------------------|
| **Definition** | Introduced with "Definition X.Y" or a definition environment; introduces a new concept, notation, or condition |
| **Theorem** | Labeled "Theorem X.Y"; states a major result that is proved |
| **Lemma** | Labeled "Lemma X.Y"; a supporting result used in proofs of theorems |
| **Proposition** | Labeled "Proposition X.Y"; a result of intermediate importance |
| **Corollary** | Labeled "Corollary X.Y"; follows directly from a theorem or proposition |
| **Assumption** | Labeled "Assumption" or "Condition" or "(A1)", "(H1)", etc.; a standing hypothesis |
| **Remark** | Labeled "Remark X.Y"; an observation or clarification |
| **Example** | Labeled "Example X.Y"; a concrete instance or counterexample |
| **Conjecture** | Labeled "Conjecture X.Y"; an unproved claim |
| **Notation** | Labeled "Notation" or introduced in a notation block; defines symbols used throughout |
| **Key Equation** | A displayed equation with a number (e.g., (2.7)) that is referenced later in the paper by that number |

### Handling custom theorem environments

Some papers define custom environments (e.g., "Standing Hypothesis", "Main Result", "Key Estimate", "Criterion"). If you encounter theorem-like environments that do not match the standard types above, flag them with `[CUSTOM ENV: ...]` and map them to the closest standard type.

### Output format for each object

For every object, extract and present it in this exact format:

```
## Section N: [Section Title]

- **[Type] [Number]** ([Name if any])
  > [Full statement, preserving all mathematical notation in LaTeX]
  > [If the statement spans multiple lines, include all of them]
  - Proof status: [full | sketch | deferred to Section/Appendix X | external reference | not applicable]
  - References cited in statement: [list any theorem/lemma/definition numbers explicitly cited in the statement itself, or "none"]
```

### Systematic extraction rules

Follow these rules strictly:

1. **Scan every page.** Do not skip any section, subsection, or appendix. Objects in appendices are just as important as objects in the main body.

2. **Preserve exact numbering.** Use the paper's own numbering system. If the paper numbers theorems as "Theorem A", "Theorem B" instead of "Theorem 1.1", "Theorem 1.2", use the paper's convention.

3. **Preserve full statements.** Copy the complete mathematical statement. Do not paraphrase, abbreviate, or omit conditions. If a theorem has multiple parts (a), (b), (c), include all parts.

4. **Use LaTeX notation.** Write all mathematical expressions in LaTeX: $f: X \to Y$, $\|u\|_{L^p} \leq C$, $\mathbb{E}[X_n] \to \mu$, etc.

5. **Include unnamed objects.** Some papers have unnumbered definitions introduced inline (e.g., "We say that $f$ is *regular* if..."). Include these as `**Definition (unnumbered, p. N)**` where N is the page number.

6. **Track proof status carefully:**
   - `full` = a complete proof follows the statement in the paper
   - `sketch` = only a proof outline or key ideas are given
   - `deferred to [location]` = the paper says "proof in Appendix B" or similar
   - `external reference` = the paper says "see [12]" or "proved in [Smith 2020]"
   - `not applicable` = definitions, assumptions, notation, remarks, examples (these are not proved)

7. **Note what is referenced in the statement.** If Theorem 3.2 says "Under Assumption (A1) and using the notation of Definition 2.3...", record those references.

8. **Count as you go.** At the end of each section, state the count: "Section 3 total: 2 definitions, 3 lemmas, 1 theorem, 1 corollary."

## Task 4: Summary Statistics

After extracting all objects, provide a summary table:

```
EXTRACTION SUMMARY
==================
| Type         | Count |
|--------------|-------|
| Definition   | ??    |
| Theorem      | ??    |
| Lemma        | ??    |
| Proposition  | ??    |
| Corollary    | ??    |
| Assumption   | ??    |
| Remark       | ??    |
| Example      | ??    |
| Conjecture   | ??    |
| Notation     | ??    |
| Key Equation | ??    |
| TOTAL        | ??    |

Custom environments detected: [list any, or "none"]
```

## Task 5: Flags and Warnings

Report any of the following if they occur:

- **Non-standard numbering:** e.g., the paper resets theorem counters per section, or uses letter-based numbering.
- **Shared counters:** e.g., definitions and theorems share a single counter (Definition 2.1, Theorem 2.2, Lemma 2.3 instead of separate sequences).
- **Unlabeled environments:** formal-looking results that lack numbers.
- **Embedded objects:** a lemma stated and proved *inside* the proof of a theorem (rather than as a standalone result).
- **Unusual structure:** anything about the paper's organization that deviates from the standard (Introduction, Preliminaries, Main Results, Proofs, Appendix) format.

## Critical instructions

- **Be exhaustive.** Missing even one lemma will break the dependency analysis in later prompts. When in doubt, include it.
- **Do not interpret or assess.** This prompt is purely about extraction. Do not comment on whether results are important, novel, or correct. That comes later.
- **Do not skip "obvious" objects.** Even if Definition 2.1 defines something standard like a Banach space, extract it -- it may be referenced by later results.
- **If you are uncertain whether something is a formal object,** include it and mark it with `[UNCERTAIN]`. It is better to over-extract than to miss something.
- **If the paper uses web-searchable techniques without explanation,** note this but do not search now. Just extract the objects as stated.

---

## Expected Output Format

The output should be a structured Markdown document with these sections in order:

1. `PAPER METADATA` block
2. `SECTION STRUCTURE` list
3. Per-section extraction with `## Section N: [Title]` headers and bullet-pointed objects
4. `EXTRACTION SUMMARY` table
5. `FLAGS AND WARNINGS` section (if any)

Total expected length: 2,000--8,000 words depending on paper length.

## Tips

- If the model's output is truncated, say "continue from where you left off" and it will resume.
- Verify the extraction summary counts match the actual objects listed. If they do not, ask the model to reconcile.
- For papers with shared theorem counters (e.g., Definition 1, Theorem 2, Lemma 3 all in one sequence), the extraction is correct as long as the numbers are preserved exactly as the paper uses them.
- If the paper has a very long preliminaries section with many standard definitions, extract them all. They will be tagged as `novelty: "known"` in later prompts, but they must be in the skeleton for dependency tracing to work.
