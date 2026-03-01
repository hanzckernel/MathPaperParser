<script>
  export let padded = true;
</script>

<div class:padded class="card">
  <slot />
</div>

<style>
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }
  .padded {
    padding: var(--gap-lg);
  }
</style>

