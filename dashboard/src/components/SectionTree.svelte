<script>
  import { kindColorVar } from "../lib/colors.js";
  import { selectedNodeId, selectedSectionId } from "../stores/ui.js";

  export let sections = [];

  let expanded = new Set();

  function toggle(sectionId) {
    const next = new Set(expanded);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    expanded = next;
  }
</script>

<div class="tree">
  {#each sections as s (s.section)}
    <button
      class="section-row"
      class:active={$selectedSectionId === s.section}
      type="button"
      on:click={() => {
        toggle(s.section);
        selectedSectionId.set(s.section);
        selectedNodeId.set(null);
      }}
    >
      <span class="chev">{expanded.has(s.section) ? "▾" : "▸"}</span>
      <span class="sec">{s.section}.</span>
      <span class="title">{s.title || "(untitled)"}</span>
      <span class="count">({s.count})</span>
    </button>

    {#if expanded.has(s.section)}
      <div class="nodes">
        {#each s.nodes as n (n.id)}
          <button
            class="node-row"
            class:selected={$selectedNodeId === n.id}
            type="button"
            on:click={() => {
              selectedNodeId.set(n.id);
              selectedSectionId.set(s.section);
            }}
          >
            <span class="dot" style={`--dot-color: ${kindColorVar(n.kind)}`}></span>
            <span class="nlabel">{n.label}</span>
            {#if n.is_main_result}<span class="star">*</span>{/if}
          </button>
        {/each}
      </div>
    {/if}
  {/each}
</div>

<style>
  .tree {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-row {
    width: 100%;
    display: grid;
    grid-template-columns: 18px auto 1fr auto;
    gap: 8px;
    align-items: baseline;
    padding: 10px 10px;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
  }

  .section-row:hover {
    border-color: var(--accent);
    background: var(--bg-surface);
  }

  .section-row.active {
    outline: 2px solid color-mix(in srgb, var(--accent), transparent 70%);
  }

  .chev {
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }

  .sec {
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    color: var(--text-secondary);
    font-size: 12px;
  }

  .nodes {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0 0 4px 18px;
  }

  .node-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
  }

  .node-row:hover {
    border-color: var(--accent);
  }

  .node-row.selected {
    background: var(--bg-surface);
    outline: 1px solid var(--accent);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--dot-color);
    flex: 0 0 auto;
  }

  .nlabel {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .star {
    margin-left: auto;
    color: var(--accent);
    font-weight: 800;
  }
</style>
