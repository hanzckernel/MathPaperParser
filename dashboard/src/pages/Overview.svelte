<script>
  import Badge from "../components/Badge.svelte";
  import BubbleChart from "../components/BubbleChart.svelte";
  import Card from "../components/Card.svelte";
  import StatsBar from "../components/StatsBar.svelte";

  import { difficultyColorVar } from "../lib/colors.js";
  import { bundle, nodeMap, sectionCount, sections } from "../stores/graph.js";
  import { navigateTo, navigateToNode } from "../stores/ui.js";

  $: index = $bundle.index;
  $: stats = index?.stats ?? null;

  $: topHigh = index?.attention?.high_dependency_nodes?.slice(0, 2) ?? [];
  $: topDemanding = index?.attention?.demanding_proofs?.slice(0, 1) ?? [];
</script>

<h1>Overview</h1>

{#if index}
  <StatsBar {stats} sectionCount={$sectionCount} />

  <div class="two">
    <Card>
      <h2>Problem statement</h2>
      <div class="block">
        <div class="k">Question</div>
        <div>{index.problem_statement.question}</div>
      </div>
      <div class="block">
        <div class="k">Motivation</div>
        <div class="muted">{index.problem_statement.motivation}</div>
      </div>
      <div class="block">
        <div class="k">Context</div>
        <div class="muted">{index.problem_statement.context}</div>
      </div>
    </Card>

    <Card>
      <h2>Innovation assessment</h2>
      <div>{index.innovation_assessment.summary}</div>
      <div class="muted">
        {index.innovation_assessment.main_innovations.length} innovations
        <button class="link" type="button" on:click={() => navigateTo("innovation")}>See details →</button>
      </div>
    </Card>
  </div>

  <div class="panel">
    <div class="panel-head">
      <h2>Section map</h2>
      <div class="muted">Click a bubble to open the graph filtered by section.</div>
    </div>
    <BubbleChart sections={$sections} />
  </div>

  <div class="panel">
    <div class="panel-head">
      <h2>Main results</h2>
      <div class="muted">Click to open in Proof Graph.</div>
    </div>
    <div class="list">
      {#each index.main_results as mr (mr.node_id)}
        <button class="item" type="button" on:click={() => navigateToNode(mr.node_id)}>
          <div class="row">
            <span class="dot" style={`--dot-color: var(--accent)`}></span>
            <div class="label">{($nodeMap.get(mr.node_id)?.label ?? mr.node_id)}</div>
          </div>
          <div class="headline">{mr.headline}</div>
          <div class="muted">{mr.significance}</div>
        </button>
      {/each}
    </div>
  </div>

  <div class="panel">
    <div class="panel-head">
      <h2>Top attention</h2>
      <div class="muted">High-dependency items and demanding proofs.</div>
    </div>

    <div class="list">
      {#each topHigh as it (it.node_id)}
        <button class="item" type="button" on:click={() => navigateToNode(it.node_id)}>
          <div class="row">
            <Badge text="High dependency" color="var(--accent)" />
            <div class="label">{($nodeMap.get(it.node_id)?.label ?? it.node_id)}</div>
          </div>
          <div class="muted">{it.note}</div>
        </button>
      {/each}

      {#each topDemanding as it (it.node_id)}
        <button class="item" type="button" on:click={() => navigateToNode(it.node_id)}>
          <div class="row">
            <Badge text={it.estimated_difficulty} color={difficultyColorVar(it.estimated_difficulty)} />
            <div class="label">{($nodeMap.get(it.node_id)?.label ?? it.node_id)}</div>
          </div>
          <div class="muted">{it.reason}</div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  h1 {
    margin: 0 0 var(--gap-lg);
    font-size: 22px;
  }

  h2 {
    margin: 0 0 var(--gap-md);
    font-size: 16px;
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);
    margin: var(--gap-lg) 0;
  }

  .block {
    margin: 10px 0;
  }

  .k {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .muted {
    color: var(--text-secondary);
  }

  .panel {
    margin: var(--gap-lg) 0;
  }

  .panel-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--gap-md);
    margin-bottom: var(--gap-md);
  }

  .list {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-md);
  }

  .item {
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: var(--gap-lg);
    cursor: pointer;
    text-align: left;
  }

  .item:hover {
    border-color: var(--accent);
    background: var(--bg-surface);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    min-width: 0;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--dot-color);
    flex: 0 0 auto;
  }

  .label {
    font-weight: 700;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .headline {
    margin-bottom: 6px;
  }

  .link {
    margin-left: 10px;
    border: none;
    background: transparent;
    color: var(--accent);
    cursor: pointer;
    font-weight: 600;
  }

  .link:hover {
    text-decoration: underline;
  }

  @media (max-width: 1100px) {
    .two {
      grid-template-columns: 1fr;
    }
  }
</style>
