<script>
  import { sections } from "../stores/graph.js";
</script>

<h1>Theorem Explorer</h1>

<div class="card">
  <div class="muted">Phase 1 scaffold: section tree + detail panel comes in Phase 2.</div>
  {#if $sections.length}
    <h2>Sections (derived)</h2>
    <ul>
      {#each $sections as s}
        <li><span class="id">Section {s.section}</span> — {s.title} ({s.count} nodes)</li>
      {/each}
    </ul>
  {/if}
</div>

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
    color: var(--text-secondary);
  }
</style>

