<script>
  import { EVIDENCE_LEVELS, NODE_KINDS } from "../lib/constants.js";
  import { evidenceColorVar, kindColorVar } from "../lib/colors.js";
  import { sections } from "../stores/graph.js";
  import { searchQuery, sectionFilter, selectedEvidence, selectedKinds, viewMode } from "../stores/ui.js";

  let searchDraft = "";
  let debounceHandle = null;

  $: searchDraft = $searchQuery;

  function toggleInStore(store, value) {
    store.update((arr) => {
      const set = new Set(arr);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return [...set];
    });
  }

  function onSearchInput(ev) {
    const next = ev.currentTarget.value;
    searchDraft = next;
    if (debounceHandle) window.clearTimeout(debounceHandle);
    debounceHandle = window.setTimeout(() => searchQuery.set(next), 200);
  }
</script>

<div class="bar">
  <div class="group">
    <div class="label">Kind</div>
    <div class="toggles">
      {#each NODE_KINDS as k (k)}
        <button
          class:selected={$selectedKinds.includes(k)}
          type="button"
          on:click={() => toggleInStore(selectedKinds, k)}
          title={k}
        >
          <span class="dot" style={`--dot-color: ${kindColorVar(k)}`} />
          {k}
        </button>
      {/each}
    </div>
  </div>

  <div class="group">
    <div class="label">Section</div>
    <select bind:value={$sectionFilter}>
      <option value="all">All sections</option>
      {#each $sections as s (s.section)}
        <option value={s.section}>{s.section}. {s.title || "(untitled)"}</option>
      {/each}
    </select>
  </div>

  <div class="group">
    <div class="label">Evidence</div>
    <div class="toggles">
      {#each EVIDENCE_LEVELS as e (e)}
        <button
          class:selected={$selectedEvidence.includes(e)}
          type="button"
          on:click={() => toggleInStore(selectedEvidence, e)}
          title={e}
        >
          <span class="dot" style={`--dot-color: ${evidenceColorVar(e)}`} />
          {e}
        </button>
      {/each}
    </div>
  </div>

  <div class="group">
    <div class="label">Search</div>
    <input placeholder="label, number, statement…" value={searchDraft} on:input={onSearchInput} />
  </div>

  <div class="group">
    <div class="label">Mode</div>
    <div class="mode">
      <button class:selected={$viewMode === "bird_eye"} type="button" on:click={() => viewMode.set("bird_eye")}>
        Bird-eye
      </button>
      <button class:selected={$viewMode === "frog_eye"} type="button" on:click={() => viewMode.set("frog_eye")}>
        Frog-eye
      </button>
    </div>
  </div>
</div>

<style>
  .bar {
    display: grid;
    grid-template-columns: 1fr auto auto auto auto;
    gap: var(--gap-md);
    padding: var(--gap-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    align-items: end;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .label {
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
  }

  button:hover {
    color: var(--text-primary);
    border-color: color-mix(in srgb, var(--accent), var(--border) 60%);
  }

  button.selected {
    color: var(--text-primary);
    background: var(--bg-surface);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--dot-color);
    flex: 0 0 auto;
  }

  select,
  input {
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 8px 10px;
    font-size: 13px;
    outline: none;
  }

  input {
    width: 100%;
    min-width: 240px;
  }

  .mode {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  @media (max-width: 1100px) {
    .bar {
      grid-template-columns: 1fr;
      align-items: stretch;
    }
    input {
      min-width: 0;
    }
  }
</style>

