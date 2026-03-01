<script>
  import { bundle } from "../stores/graph.js";
</script>

<h1>Unknowns</h1>

{#if $bundle.index}
  <div class="card">
    <div class="muted">Total unknowns: {$bundle.index.unknowns.length}</div>
    <ul>
      {#each $bundle.index.unknowns as u}
        <li>
          <div class="id">{u.id} ({u.scope})</div>
          <div>{u.description}</div>
          <div class="muted">Hint: {u.search_hint}</div>
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
    color: var(--text-secondary);
    margin-bottom: 4px;
  }
  ul {
    margin: var(--gap-md) 0 0;
    padding-left: 18px;
  }
  li {
    margin: 14px 0;
  }
</style>

