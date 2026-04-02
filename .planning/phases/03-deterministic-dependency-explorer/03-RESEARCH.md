# Phase 03 Research

## Findings

1. `GraphPage` is already the best Phase 3 surface.
   - It has graph selection, filters, and node detail.
   - It already knows the filtered outgoing and incoming edges for the selected node.
   - It is a smaller change than expanding `ExplorerPage`.

2. The main missing primitive is selected-edge state.
   - Current UI lets the user jump from one node to another.
   - It does not let the user stop on a relation and inspect why that relation exists.

3. Phase 2 already produced the data needed for a real explanation panel.
   - `edge.provenance`
   - `edge.evidence`
   - `edge.detail`
   - edge metadata like `latexRef`, `latexCommand`, and `citeKey`

4. Render-only tests are sufficient for this phase.
   - Existing web tests already use `renderToStaticMarkup`.
   - We can lock the relation explanation contract without introducing browser automation.

## Recommendation

Implement Phase 3 in one execution plan on top of `GraphPage`:

- add selected-edge state
- let Uses / Used By entries select a relation instead of only navigating to the adjacent node
- add a structured edge explanation panel
- show source and target labels plus provenance/evidence/detail/metadata
- preserve node-to-node navigation as a secondary action

This is enough to satisfy:

- EXPL-01: already in place via static/API explorer loading
- EXPL-02: sharpened by explicit dependency inspection in the graph detail view
- EXPL-03: completed by the structured edge explanation panel
