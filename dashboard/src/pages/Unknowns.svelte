<script>
  import Badge from "../components/Badge.svelte";
  import Card from "../components/Card.svelte";

  import { bundle, nodeMap } from "../stores/graph.js";
  import { navigateToNode } from "../stores/ui.js";

  let scopeFilter = "all";
  let sortKey = "scope";
  let sortAsc = true;

  function scopeColor(scope) {
    if (scope === "proof_step") return "var(--kind-theorem)";
    if (scope === "section") return "var(--kind-lemma)";
    return "var(--kind-proposition)";
  }

  function compare(a, b) {
    const dir = sortAsc ? 1 : -1;
    if (sortKey === "id") return dir * String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    if (sortKey === "scope") {
      const s = dir * String(a.scope).localeCompare(String(b.scope));
      if (s !== 0) return s;
      return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    }
    return 0;
  }

  function toggleSort(nextKey) {
    if (sortKey === nextKey) sortAsc = !sortAsc;
    else {
      sortKey = nextKey;
      sortAsc = true;
    }
  }

  $: index = $bundle.index;
  $: unknownsRaw = index?.unknowns ?? [];
  $: unknowns =
    scopeFilter === "all" ? unknownsRaw : unknownsRaw.filter((u) => u.scope === scopeFilter);
  $: unknownsSorted = [...unknowns].sort(compare);
</script>

<h1>Unknowns</h1>

{#if index}
  <div class="filters">
    <div class="label">Scope</div>
    <select bind:value={scopeFilter}>
      <option value="all">All scopes</option>
      <option value="proof_step">proof_step</option>
      <option value="section">section</option>
      <option value="paper">paper</option>
    </select>
  </div>

  <Card padded={false}>
    <table>
      <thead>
        <tr>
          <th class="click" on:click={() => toggleSort("id")}>Unknown</th>
          <th class="click" on:click={() => toggleSort("scope")}>Scope</th>
          <th>Related</th>
          <th>Search hint</th>
        </tr>
      </thead>
      <tbody>
        {#if unknownsSorted.length === 0}
          <tr>
            <td colspan="4" class="empty">No unknowns match the current filters.</td>
          </tr>
        {:else}
          {#each unknownsSorted as u (u.id)}
            <tr>
              <td class="col-unknown">
                <div class="uid">{u.id}</div>
                <div>{u.description}</div>
              </td>
              <td>
                <Badge text={u.scope} color={scopeColor(u.scope)} />
              </td>
              <td class="col-related">
                {#if u.related_nodes?.length}
                  <div class="rels">
                    {#each u.related_nodes as nid (nid)}
                      <button class="rel" type="button" on:click={() => navigateToNode(nid)}>
                        {($nodeMap.get(nid)?.label ?? nid)}
                      </button>
                    {/each}
                  </div>
                {:else}
                  <span class="muted">(none)</span>
                {/if}
              </td>
              <td class="muted">{u.search_hint}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </Card>
{/if}

<style>
  h1 {
    margin: 0 0 var(--gap-lg);
    font-size: 22px;
  }
  .muted {
    color: var(--text-secondary);
  }

  .filters {
    display: flex;
    align-items: center;
    gap: var(--gap-md);
    margin-bottom: var(--gap-md);
  }

  .label {
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  select {
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 8px 10px;
    font-size: 13px;
    outline: none;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border-bottom: 1px solid var(--border);
    padding: 12px 14px;
    vertical-align: top;
  }

  th {
    background: var(--bg-surface);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 11px;
    color: var(--text-secondary);
    text-align: left;
  }

  th.click {
    cursor: pointer;
    user-select: none;
  }

  tr:hover td {
    background: color-mix(in srgb, var(--bg-surface), transparent 70%);
  }

  .empty {
    text-align: center;
    color: var(--text-secondary);
    padding: 30px 14px;
  }

  .uid {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }

  .rels {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .rel {
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 4px 8px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 12px;
    text-align: left;
  }

  .rel:hover {
    border-color: var(--accent);
  }
</style>
