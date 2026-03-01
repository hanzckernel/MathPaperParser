<script>
  import Badge from "./Badge.svelte";
  import Card from "./Card.svelte";
  import MathText from "./MathText.svelte";

  import { evidenceColorVar, kindColorVar } from "../lib/colors.js";
  import { edgeMap, graphView, nodeMap } from "../stores/graph.js";
  import { clearSelection, navigateToNode, selectedEdgeKey, selectedNodeId } from "../stores/ui.js";

  function proofStatusBadge(status) {
    if (status === "full") return { text: "Full proof", color: "var(--novelty-new)" };
    if (status === "sketch") return { text: "Proof sketch", color: "var(--novelty-extended)" };
    if (status === "deferred") return { text: "Proof deferred", color: "var(--kind-proposition)" };
    if (status === "external") return { text: "External proof", color: "var(--text-secondary)" };
    return { text: "Not applicable", color: "var(--text-secondary)" };
  }

  function noveltyBadge(novelty) {
    if (novelty === "new") return { text: "New", color: "var(--novelty-new)" };
    if (novelty === "classical") return { text: "Classical", color: "var(--novelty-classical)" };
    if (novelty === "extended") return { text: "Extended", color: "var(--novelty-extended)" };
    return { text: "Folklore", color: "var(--novelty-folklore)" };
  }

  $: node = $selectedNodeId ? $nodeMap.get($selectedNodeId) : null;
  $: edge = $selectedEdgeKey ? $edgeMap.get($selectedEdgeKey) : null;

  $: visibleNodeIds = $graphView.visibleNodeIds ?? new Set();
  $: selectedNodeHidden = $selectedNodeId && !visibleNodeIds.has($selectedNodeId);
  $: selectedEdgeHidden = $selectedEdgeKey && !(($graphView.edges ?? []).some((e) => e.key === $selectedEdgeKey));

  $: viewEdges = $graphView.edges ?? [];
  $: outgoing = node ? viewEdges.filter((e) => e.source === node.id) : [];
  $: incoming = node ? viewEdges.filter((e) => e.target === node.id) : [];
</script>

<aside class="sidebar">
  <div class="top">
    <div class="title">Details</div>
    <button type="button" class="clear" on:click={clearSelection}>Clear</button>
  </div>

  {#if selectedNodeHidden}
    <Card>
      <div class="muted">Selected node is hidden by current filters.</div>
      <div class="muted">Clear filters or switch to Frog-eye mode to reveal it.</div>
    </Card>
  {:else if selectedEdgeHidden}
    <Card>
      <div class="muted">Selected edge is hidden by current filters.</div>
      <div class="muted">Enable its evidence type or widen the section/kind filters.</div>
    </Card>
  {:else if node}
    <Card>
      <div class="header">
        <div class="label">{node.label}</div>
        <div class="badges">
          <Badge text={node.kind} color={kindColorVar(node.kind)} />
          {#if node.is_main_result}
            <Badge text="Main result" color="var(--accent)" />
          {/if}
        </div>
      </div>

      <div class="meta">
        <div><span class="k">Section</span> {node.section}</div>
        {#if node.number}<div><span class="k">Number</span> {node.number}</div>{/if}
      </div>

      <div class="statement">
        <MathText text={node.statement} />
      </div>

      <div class="row">
        {@const ps = proofStatusBadge(node.proof_status)}
        <Badge text={ps.text} color={ps.color} />
        {@const nv = noveltyBadge(node.novelty)}
        <Badge text={nv.text} color={nv.color} />
      </div>
    </Card>

    <Card>
      <div class="subhead">Uses</div>
      {#if outgoing.length === 0}
        <div class="muted">(no visible outgoing edges)</div>
      {:else}
        <ul class="elist">
          {#each outgoing as e (e.key)}
            <li>
              <button class="link" type="button" on:click={() => navigateToNode(e.target)}>
                <span class="arrow">→</span>
                <span>{($nodeMap.get(e.target)?.label ?? e.target)}</span>
                <span class="spacer" />
                <Badge text={e.evidence} color={evidenceColorVar(e.evidence)} />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </Card>

    <Card>
      <div class="subhead">Used by</div>
      {#if incoming.length === 0}
        <div class="muted">(no visible incoming edges)</div>
      {:else}
        <ul class="elist">
          {#each incoming as e (e.key)}
            <li>
              <button class="link" type="button" on:click={() => navigateToNode(e.source)}>
                <span class="arrow">←</span>
                <span>{($nodeMap.get(e.source)?.label ?? e.source)}</span>
                <span class="spacer" />
                <Badge text={e.evidence} color={evidenceColorVar(e.evidence)} />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </Card>
  {:else if edge}
    <Card>
      <div class="header">
        <div class="label">Edge</div>
        <div class="badges">
          <Badge text={edge.kind} color="var(--accent)" />
          <Badge text={edge.evidence} color={evidenceColorVar(edge.evidence)} />
        </div>
      </div>

      <div class="edge-line">
        <button class="node" type="button" on:click={() => navigateToNode(edge.source)}>
          {($nodeMap.get(edge.source)?.label ?? edge.source)}
        </button>
        <span class="arrow">→</span>
        <button class="node" type="button" on:click={() => navigateToNode(edge.target)}>
          {($nodeMap.get(edge.target)?.label ?? edge.target)}
        </button>
      </div>

      {#if edge.detail}
        <div class="detail">
          <MathText text={edge.detail} />
        </div>
      {/if}
    </Card>
  {:else}
    <Card>
      <div class="muted">Click a node or edge to see details.</div>
    </Card>
  {/if}
</aside>

<style>
  .sidebar {
    width: 320px;
    min-width: 320px;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: var(--gap-md);
    overflow: auto;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 2px;
  }

  .title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  .clear {
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .clear:hover {
    color: var(--text-primary);
    border-color: var(--accent);
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: var(--gap-md);
  }

  .label {
    font-size: 16px;
    font-weight: 700;
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .meta {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: var(--gap-md);
  }

  .k {
    font-family: var(--font-mono);
    color: var(--text-secondary);
    margin-right: 8px;
  }

  .statement {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    padding: var(--gap-md);
    overflow: auto;
    max-height: 240px;
    margin-bottom: var(--gap-md);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .subhead {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: var(--gap-sm);
  }

  .muted {
    color: var(--text-secondary);
  }

  .elist {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .link {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
  }

  .link:hover {
    border-color: var(--accent);
  }

  .arrow {
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }

  .spacer {
    flex: 1;
  }

  .edge-line {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    align-items: center;
    margin-bottom: var(--gap-md);
  }

  .node {
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
  }

  .node:hover {
    border-color: var(--accent);
  }

  .detail {
    color: var(--text-secondary);
  }
</style>
