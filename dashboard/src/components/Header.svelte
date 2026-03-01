<script>
  import { bundle } from "../stores/graph.js";
</script>

<header class="header">
  <div class="left">
    <div class="brand">PaperParser</div>
    {#if $bundle.manifest?.paper?.title}
      <div class="title">{$bundle.manifest.paper.title}</div>
    {:else}
      <div class="title muted">(no title loaded)</div>
    {/if}
  </div>

  <div class="right">
    {#if $bundle.manifest?.schema_version}
      <div class="pill">schema v{$bundle.manifest.schema_version}</div>
    {/if}
  </div>
</header>

<style>
  .header {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--gap-lg);
    border-bottom: 1px solid var(--border);
    background: var(--bg-secondary);
    gap: var(--gap-md);
  }

  .left {
    display: flex;
    align-items: baseline;
    gap: var(--gap-md);
    min-width: 0;
  }

  .brand {
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  .title {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70vw;
  }

  .muted {
    color: var(--text-secondary);
  }

  .pill {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 10px;
    background: var(--bg-primary);
  }
</style>

