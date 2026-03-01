<script>
  import { bundle } from "../stores/graph.js";
</script>

<h1>Innovation Map</h1>

{#if $bundle.index}
  <div class="card">
    <p>{$bundle.index.innovation_assessment.summary}</p>
    <h2>Main innovations</h2>
    <ul>
      {#each $bundle.index.innovation_assessment.main_innovations as it}
        <li>
          <div>{it.description}</div>
          <div class="muted">
            <span class="id">{it.calibration}</span>
            <span> · related: {it.related_nodes.length}</span>
          </div>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  h1 {
    margin: 0 0 var(--gap-lg);
    font-size: 22px;
  }
  h2 {
    margin: var(--gap-lg) 0 var(--gap-md);
    font-size: 16px;
  }
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--gap-lg);
  }
  .muted {
    color: var(--text-secondary);
  }
  .id {
    font-family: var(--font-mono);
    font-size: 12px;
  }
  ul {
    margin: 0;
    padding-left: 18px;
  }
  li {
    margin: 10px 0;
  }
</style>

