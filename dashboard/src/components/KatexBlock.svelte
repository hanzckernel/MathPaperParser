<script>
  import katex from "katex";

  export let latex = "";
  export let displayMode = false;

  $: html =
    latex.trim().length === 0
      ? ""
      : katex.renderToString(latex, {
          throwOnError: false,
          displayMode,
          strict: false,
          trust: false,
        });
</script>

{#if html}
  <div class="katex-wrap">
    {@html html}
  </div>
{:else}
  <span class="muted">(no math)</span>
{/if}

<style>
  .katex-wrap {
    overflow-x: auto;
    max-width: 100%;
  }
  .muted {
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 12px;
  }
</style>
