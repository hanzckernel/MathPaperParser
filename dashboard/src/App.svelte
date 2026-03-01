<script>
  import { onDestroy, onMount } from "svelte";

  import Header from "./components/Header.svelte";
  import NavBar from "./components/NavBar.svelte";

  import InnovationMap from "./pages/InnovationMap.svelte";
  import Overview from "./pages/Overview.svelte";
  import ProofGraph from "./pages/ProofGraph.svelte";
  import TheoremExplorer from "./pages/TheoremExplorer.svelte";
  import Unknowns from "./pages/Unknowns.svelte";

  import { bundle, loadBundle } from "./stores/graph.js";
  import { route, syncRouteFromLocation } from "./stores/ui.js";

  onMount(() => {
    const cleanup = syncRouteFromLocation();
    loadBundle().catch(() => {});
    return cleanup;
  });

  onDestroy(() => {});

  const pages = {
    overview: Overview,
    graph: ProofGraph,
    explorer: TheoremExplorer,
    innovation: InnovationMap,
    unknowns: Unknowns,
  };

  $: CurrentPage = pages[$route] ?? Overview;
</script>

<div class="layout">
  <Header />

  <div class="main">
    <NavBar />

    <main class="content">
      {#if $bundle.status === "loading" || $bundle.status === "idle"}
        <div class="state">
          <div class="title">Loading data…</div>
          <div class="hint">Expected files: <code>dashboard/public/data/{manifest,graph,index}.json</code></div>
        </div>
      {:else if $bundle.status === "error"}
        <div class="state error">
          <div class="title">Failed to load data</div>
          <pre class="details">{$bundle.error}</pre>
        </div>
      {:else}
        <CurrentPage />
      {/if}
    </main>
  </div>
</div>

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: 1;
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 0;
  }

  .content {
    padding: var(--gap-lg);
    min-height: 0;
    overflow: auto;
  }

  .state {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    padding: var(--gap-lg);
    max-width: 900px;
  }

  .state .title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: var(--gap-sm);
  }

  .state .hint {
    color: var(--text-secondary);
  }

  .state.error .details {
    margin-top: var(--gap-md);
    white-space: pre-wrap;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--gap-md);
  }
</style>

