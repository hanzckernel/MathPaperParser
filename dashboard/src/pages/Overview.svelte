<script>
  import KatexBlock from "../components/KatexBlock.svelte";
  import { bundle } from "../stores/graph.js";
</script>

<h1>Overview</h1>

{#if $bundle.index}
  <section class="grid">
    <div class="card">
      <h2>Problem statement</h2>
      <p><strong>Question:</strong> {$bundle.index.problem_statement.question}</p>
      <p class="muted"><strong>Motivation:</strong> {$bundle.index.problem_statement.motivation}</p>
      <p class="muted"><strong>Context:</strong> {$bundle.index.problem_statement.context}</p>
    </div>

    <div class="card">
      <h2>Innovation</h2>
      <p>{$bundle.index.innovation_assessment.summary}</p>
      <p class="muted">Main innovations: {$bundle.index.innovation_assessment.main_innovations.length}</p>
    </div>
  </section>

  <section class="card">
    <h2>Main results</h2>
    <ul>
      {#each $bundle.index.main_results as mr}
        <li>
          <span class="id">{mr.node_id}</span>
          <div>{mr.headline}</div>
        </li>
      {/each}
    </ul>
  </section>

  <section class="card">
    <h2>KaTeX smoke test</h2>
    <KatexBlock latex={"\\limsup_{g\\to\\infty}\\sup_{\\mathcal{S}\\in\\mathcal{M}_g} h(\\mathcal{S}) \\le \\frac{2}{\\pi}"} />
  </section>
{/if}

<style>
  h1 {
    margin: 0 0 var(--gap-lg);
    font-size: 22px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);
    margin-bottom: var(--gap-lg);
  }

  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--gap-lg);
  }

  .card h2 {
    margin: 0 0 var(--gap-md);
    font-size: 16px;
  }

  .muted {
    color: var(--text-secondary);
  }

  ul {
    margin: 0;
    padding-left: 18px;
  }

  li {
    margin: 8px 0;
  }

  .id {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-secondary);
  }
</style>

