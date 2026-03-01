<script>
  import Badge from "../components/Badge.svelte";
  import Card from "../components/Card.svelte";

  import { calibrationColorVar, difficultyColorVar } from "../lib/colors.js";
  import { bundle, nodeMap } from "../stores/graph.js";
  import { navigateToNode } from "../stores/ui.js";

  function overallCalibration(items) {
    const cals = new Set((items ?? []).map((x) => x.calibration));
    if (cals.has("significant")) return "significant";
    if (cals.has("incremental")) return "incremental";
    if (cals.has("straightforward_extension")) return "straightforward_extension";
    return null;
  }

  $: index = $bundle.index;
  $: innovations = index?.innovation_assessment?.main_innovations ?? [];
  $: overall = overallCalibration(innovations);
  $: high = index?.attention?.high_dependency_nodes ?? [];
  $: demanding = index?.attention?.demanding_proofs ?? [];
</script>

<h1>Innovation Map</h1>

{#if index}
  <Card>
    <div class="head">
      <h2>Innovation assessment</h2>
      {#if overall}
        <Badge text={overall} color={calibrationColorVar(overall)} />
      {/if}
    </div>
    <div>{index.innovation_assessment.summary}</div>
  </Card>

  <div class="spacer" />

  <Card>
    <h2>Main innovations</h2>
    <div class="ilist">
      {#each innovations as it (it.description)}
        <div class="icard">
          <div class="row">
            <Badge text={it.calibration} color={calibrationColorVar(it.calibration)} />
          </div>
          <div>{it.description}</div>
          {#if it.related_nodes?.length}
            <div class="chips">
              {#each it.related_nodes as nid (nid)}
                <button class="chip" type="button" on:click={() => navigateToNode(nid)}>
                  {($nodeMap.get(nid)?.label ?? nid)}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </Card>

  <div class="spacer" />

  <Card>
    <h2>Prior work comparison</h2>
    <div class="muted">{index.innovation_assessment.prior_work_comparison}</div>
  </Card>

  <div class="spacer" />

  <Card>
    <h2>Attention</h2>
    <div class="ilist">
      {#each high as it (it.node_id)}
        <button class="acard" type="button" on:click={() => navigateToNode(it.node_id)}>
          <div class="row">
            <Badge text="High dependency" color="var(--accent)" />
            <div class="label">{($nodeMap.get(it.node_id)?.label ?? it.node_id)}</div>
          </div>
          <div class="muted">{it.note}</div>
        </button>
      {/each}

      {#each demanding as it (it.node_id)}
        <button class="acard" type="button" on:click={() => navigateToNode(it.node_id)}>
          <div class="row">
            <Badge text={it.estimated_difficulty} color={difficultyColorVar(it.estimated_difficulty)} />
            <div class="label">{($nodeMap.get(it.node_id)?.label ?? it.node_id)}</div>
          </div>
          <div class="muted">{it.reason}</div>
        </button>
      {/each}
    </div>
  </Card>
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

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--gap-md);
    margin-bottom: var(--gap-md);
  }

  .spacer {
    height: var(--gap-lg);
  }

  .muted {
    color: var(--text-secondary);
  }

  .ilist {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--gap-md);
  }

  .icard {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-surface);
    padding: var(--gap-lg);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .chip {
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 6px 10px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 12px;
  }

  .chip:hover {
    border-color: var(--accent);
  }

  .acard {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    padding: var(--gap-lg);
    cursor: pointer;
    text-align: left;
  }

  .acard:hover {
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

  .label {
    font-weight: 800;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
