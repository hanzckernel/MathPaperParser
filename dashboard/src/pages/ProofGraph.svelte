<script>
  import DetailSidebar from "../components/DetailSidebar.svelte";
  import FilterBar from "../components/FilterBar.svelte";
  import ForceGraph from "../components/ForceGraph.svelte";
</script>

<h1>Proof Graph</h1>

<FilterBar />

<div class="layout">
  <div class="graph">
    <ForceGraph />
  </div>
  <DetailSidebar />
</div>

<style>
  h1 {
    margin: 0 0 var(--gap-lg);
    font-size: 22px;
  }

  .layout {
    margin-top: var(--gap-md);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--gap-lg);
    align-items: start;
    min-height: 0;
  }

  .graph {
    min-height: 0;
  }

  @media (max-width: 1100px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
