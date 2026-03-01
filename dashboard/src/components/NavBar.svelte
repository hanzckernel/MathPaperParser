<script>
  import { navigateTo, route } from "../stores/ui.js";
</script>

<nav class="nav">
  <a class:selected={$route === "overview"} href="#/overview" on:click|preventDefault={() => navigateTo("overview")}>
    Overview
  </a>
  <a class:selected={$route === "graph"} href="#/graph" on:click|preventDefault={() => navigateTo("graph")}>
    Proof Graph
  </a>
  <a class:selected={$route === "explorer"} href="#/explorer" on:click|preventDefault={() => navigateTo("explorer")}>
    Theorem Explorer
  </a>
  <a
    class:selected={$route === "innovation"}
    href="#/innovation"
    on:click|preventDefault={() => navigateTo("innovation")}
  >
    Innovation Map
  </a>
  <a class:selected={$route === "unknowns"} href="#/unknowns" on:click|preventDefault={() => navigateTo("unknowns")}>
    Unknowns
  </a>
</nav>

<style>
  .nav {
    border-right: 1px solid var(--border);
    background: var(--bg-secondary);
    padding: var(--gap-md);
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
  }

  a {
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-weight: 500;
  }

  a:hover {
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  a.selected {
    background: var(--bg-surface);
    color: var(--text-primary);
    outline: 1px solid var(--border);
  }
</style>

