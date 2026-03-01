<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

  import { kindColorVar } from "../lib/colors.js";
  import { navigateToSection } from "../stores/ui.js";

  export let sections = [];

  let host;
  let width = 600;
  let height = 360;

  function computePacked(secs, w, h) {
    const root = d3
      .hierarchy({ children: secs.map((s) => ({ ...s, value: Math.max(1, s.count ?? 0) })) })
      .sum((d) => d.value)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = d3.pack().size([w, h]).padding(10);
    return pack(root).leaves();
  }

  $: packed = computePacked(sections ?? [], Math.max(200, width), Math.max(200, height));

  onMount(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        width = Math.floor(e.contentRect.width);
        height = Math.floor(e.contentRect.height);
      }
    });
    if (host) ro.observe(host);
    return () => ro.disconnect();
  });
</script>

<div class="host" bind:this={host}>
  <svg {width} {height} viewBox={`0 0 ${width} ${height}`}>
    {#each packed as leaf (leaf.data.section)}
      <g transform={`translate(${leaf.x},${leaf.y})`} class="bubble">
        <circle
          r={Math.max(20, leaf.r)}
          fill={kindColorVar(leaf.data.dominantKind ?? "remark")}
          opacity="0.35"
          stroke="var(--border)"
          stroke-width="1"
          on:click={() => navigateToSection(leaf.data.section)}
        />
        <text text-anchor="middle" dominant-baseline="middle" class="label">
          {leaf.data.title || leaf.data.section}
        </text>
        <title>
          {leaf.data.title || `Section ${leaf.data.section}`} — {leaf.data.count} nodes — dominant: {leaf.data.dominantKind}
        </title>
      </g>
    {/each}
  </svg>
</div>

<style>
  .host {
    width: 100%;
    height: 340px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    overflow: hidden;
  }

  svg {
    display: block;
  }

  .bubble {
    cursor: pointer;
  }

  .bubble:hover circle {
    opacity: 0.5;
    stroke: var(--accent);
  }

  .label {
    font-family: var(--font-sans);
    font-size: 11px;
    fill: var(--text-primary);
    pointer-events: none;
    user-select: none;
  }
</style>

