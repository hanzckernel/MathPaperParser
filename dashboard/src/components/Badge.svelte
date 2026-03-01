<script>
  export let text = "";
  export let color = "var(--accent)";
  export let subtle = false;
</script>

<span class:subtle class="badge" style={`--badge-color: ${color}`}>
  {text}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--badge-color), var(--border) 40%);
    background: color-mix(in srgb, var(--badge-color), transparent 88%);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  .subtle {
    background: transparent;
    color: var(--text-secondary);
  }
</style>

