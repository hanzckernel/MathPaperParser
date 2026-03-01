<script>
  import Card from "./Card.svelte";

  export let stats = null;
  export let sectionCount = 0;

  const items = [
    { key: "definition", label: "Definitions", color: "var(--kind-definition)" },
    { key: "theorem", label: "Theorems", color: "var(--kind-theorem)" },
    { key: "lemma", label: "Lemmas", color: "var(--kind-lemma)" },
    { key: "proposition", label: "Propositions", color: "var(--kind-proposition)" },
    { key: "corollary", label: "Corollaries", color: "var(--kind-corollary)" },
  ];
</script>

<div class="row">
  {#each items as it (it.key)}
    <Card padded={false}>
      <div class="stat" style={`--accent-color: ${it.color}`}>
        <div class="count">{stats?.node_counts?.[it.key] ?? 0}</div>
        <div class="label">{it.label}</div>
      </div>
    </Card>
  {/each}

  <Card padded={false}>
    <div class="stat" style={`--accent-color: var(--accent)`}>
      <div class="count">{stats?.edge_counts?.total ?? 0}</div>
      <div class="label">Edges</div>
    </div>
  </Card>

  <Card padded={false}>
    <div class="stat" style={`--accent-color: var(--accent)`}>
      <div class="count">{sectionCount}</div>
      <div class="label">Sections</div>
    </div>
  </Card>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--gap-md);
  }

  .stat {
    background: var(--bg-surface);
    border-radius: var(--radius-md);
    padding: var(--gap-md);
    border-left: 3px solid var(--accent-color);
  }

  .count {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
  }

  .label {
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  @media (max-width: 1100px) {
    .row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>

