<script>
  import { bundle } from "../stores/graph.js";
</script>

<h1>Proof Graph</h1>

{#if $bundle.graph}
  <div class="card">
    <div><strong>Nodes:</strong> {$bundle.graph.nodes.length}</div>
    <div><strong>Edges:</strong> {$bundle.graph.edges.length}</div>
    <div class="muted">Phase 1 scaffold: force-directed graph comes in Phase 2.</div>
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
</style>

